import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, query, collection, where, getDocs, runTransaction } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import debounce from 'lodash.debounce';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('guestCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error parsing guestCart:', error);
            return [];
        }
    });

    const [loading, setLoading] = useState(true);
    const [promoCode, setPromoCode] = useState(null);
    const { user, handleLogout } = useAuth();
    const stockCacheRef = useRef({});

    const userRef = useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Persistir carrito de invitado en LocalStorage
    useEffect(() => {
        if (!user) {
            localStorage.setItem('guestCart', JSON.stringify(cart));
        }
    }, [cart, user]);

    // Función para obtener el stock de un producto
    const getProductStock = async (productId, sizeKey) => {
        try {
            // Obtener directamente de la base de datos
            const productDoc = await getDoc(doc(db, 'products', productId));
            if (!productDoc.exists()) {
                throw new Error('Producto no encontrado');
            }

            const productData = productDoc.data();

            // Check if sizeKey implies a variant (Format: productId__variantId__size)
            const parts = sizeKey.split('__');
            if (parts.length === 3) {
                const [_, variantId, size] = parts;
                const variant = productData.variants?.find(v => v.id === variantId);
                return variant?.inventory?.[size] || 0;
            }

            const availableStock = productData.inventory?.[sizeKey] || 0;

            return availableStock;
        } catch (error) {
            console.error('Error al obtener stock:', error);
            throw error;
        }
    };

    // Función para actualizar el stock en la base de datos
    const updateProductStock = async (productId, sizeKey, quantity) => {
        try {
            const productRef = doc(db, 'products', productId);
            const productDoc = await getDoc(productRef);

            if (!productDoc.exists()) {
                throw new Error('Producto no encontrado');
            }

            const parts = sizeKey.split('__');

            if (parts.length === 3) {
                const [_, variantId, size] = parts;
                const productData = productDoc.data();
                const variants = productData.variants || [];
                const variantIndex = variants.findIndex(v => v.id === variantId);

                if (variantIndex === -1) throw new Error('Variante no encontrada');

                const currentStock = variants[variantIndex].inventory?.[size] || 0;
                const newStock = currentStock - quantity;

                if (newStock < 0) throw new Error('No hay suficiente stock disponible');

                // Update specific variant inventory inside the array
                variants[variantIndex].inventory[size] = newStock;
                await updateDoc(productRef, { variants });

            } else {
                const currentStock = productDoc.data().inventory?.[sizeKey] || 0;
                const newStock = currentStock - quantity;

                if (newStock < 0) {
                    throw new Error('No hay suficiente stock disponible');
                }

                await updateDoc(productRef, {
                    [`inventory.${sizeKey}`]: newStock
                });
            }

        } catch (error) {
            console.error('❌ Error al actualizar stock:', error);
            throw error;
        }
    };

    // Función debounceada para guardar el carrito
    const debouncedSaveCart = useCallback(
        debounce(async (cartData) => {
            try {
                if (userRef.current) {
                    await setDoc(doc(db, 'storeUsers', userRef.current.uid), {
                        cart: cartData,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            } catch (error) {
                console.error('❌ Error guardando carrito:', error);
                throw error;
            }
        }, 1000),
        []
    );

    // Helper para fusionar y guardar
    const mergeAndSave = async (guestCart, userCloudCart, userCartRef) => {
        const mergedCartMap = new Map();
        userCloudCart.forEach(item => mergedCartMap.set(item.size, { ...item }));

        for (const guestItem of guestCart) {
            const existingItem = mergedCartMap.get(guestItem.size);
            if (existingItem) {
                mergedCartMap.set(guestItem.size, { ...existingItem, quantity: existingItem.quantity + guestItem.quantity });
            } else {
                mergedCartMap.set(guestItem.size, guestItem);
            }
        }

        const finalMergedCart = Array.from(mergedCartMap.values());
        await setDoc(userCartRef, {
            cart: finalMergedCart,
            mergedAt: new Date().toISOString()
        }, { merge: true });

        return finalMergedCart;
    };

    const initializeCart = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');

            // Prevent race conditions: check and clear immediately
            if (guestCart.length > 0) {
                localStorage.removeItem('guestCart'); // CLEAR IMMEDIATELY

                const userCartRef = doc(db, 'storeUsers', user.uid);
                const userCartDoc = await getDoc(userCartRef);
                const userCloudCart = userCartDoc.exists() ? (userCartDoc.data().cart || []) : [];

                const finalCart = await mergeAndSave(guestCart, userCloudCart, userCartRef);
                setCart(finalCart);
            } else {
                const userCartRef = doc(db, 'storeUsers', user.uid);
                const userCartDoc = await getDoc(userCartRef);

                if (userCartDoc.exists()) {
                    setCart(userCartDoc.data().cart || []);
                } else {
                    setCart([]);
                }
            }
        } catch (error) {
            console.error('❌ [initializeCart] Error:', error);
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            initializeCart();
        } else {
            setCart([]);
        }
    }, [user, initializeCart]);

    const updateQuantity = async (productId, sizeKey, quantity) => {
        try {
            if (quantity <= 0) {
                removeFromCart(productId, sizeKey);
                return;
            }

            const currentItem = cart.find(item => item.size === sizeKey);

            if (!currentItem) {
                throw new Error('Producto no encontrado en el carrito');
            }

            // Calcular la diferencia entre la cantidad actual y la nueva
            const quantityDifference = quantity - currentItem.quantity;

            if (quantityDifference !== 0) {
                // Si la diferencia es positiva, se están pidiendo más, checar stock
                // Si es negativa, se están devolviendo al stock
                if (quantityDifference > 0) {
                    const availableStock = await getProductStock(productId, sizeKey);
                    if (availableStock < quantityDifference) {
                        throw new Error(`No hay suficiente stock disponible. Solo quedan ${availableStock} unidades.`);
                    }
                }

                // Usar la función helper que ya maneja variantes
                await updateProductStock(productId, sizeKey, quantityDifference);
            }

            // Actualizar el carrito
            const newCart = cart.map(item =>
                item.size === sizeKey
                    ? { ...item, quantity }
                    : item
            );

            setCart(newCart);
            await debouncedSaveCart(newCart);

            return true;
        } catch (error) {
            console.error('Error updating quantity:', error);
            throw error;
        }
    };

    const addToCart = async (product, size, quantity = 1, variant = null) => {
        try {
            if (quantity <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            let sizeKey;
            let itemImage;
            let itemName;

            if (variant) {
                sizeKey = `${product.id}__${variant.id}__${size}`;
                itemImage = variant.images?.[0] || product.images?.[0] || '';
                itemName = `${product.name} - ${variant.color}`;
            } else {
                sizeKey = `${product.id}__${size}`;
                itemImage = product.images?.[0] || '';
                itemName = product.name;
            }

            const existingItemIndex = cart.findIndex(item => item.size === sizeKey);

            // Obtener stock actualizado directamente de la base de datos
            const availableStock = await getProductStock(product.id, sizeKey);
            const currentCartQuantity = existingItemIndex >= 0 ? cart[existingItemIndex].quantity : 0;

            // Verificar si hay stock suficiente considerando lo que ya está en el carrito
            const realAvailableStock = availableStock + currentCartQuantity;
            const newTotalQuantity = currentCartQuantity + quantity;

            if (realAvailableStock <= 0) {
                throw new Error('El producto está agotado');
            }

            // Verificar si hay suficiente stock (Check logic matches getProductStock return)
            if (newTotalQuantity > realAvailableStock) {
                const disponibles = realAvailableStock - currentCartQuantity;
                throw new Error(`No hay suficiente stock disponible. Solo quedan ${disponibles} unidades disponibles.`);
            }

            // Actualizar el inventario en la base de datos
            await updateProductStock(product.id, sizeKey, quantity);

            // Actualizar el carrito
            const newCart = [...cart];
            if (existingItemIndex >= 0) {
                newCart[existingItemIndex].quantity = newTotalQuantity;
            } else {
                newCart.push({
                    productId: product.id,
                    name: itemName,
                    price: product.price,
                    size: sizeKey,
                    quantity: quantity,
                    image: itemImage,
                    createdAt: new Date().toISOString()
                });
            }

            setCart(newCart);

            // IMPORTANTE: Si es usuario logueado, se guarda en firebase via debouncedSaveCart
            // Si es invitado, el useEffect detectará el cambio y guardará en localStorage
            if (userRef.current) {
                await debouncedSaveCart(newCart);
            } else {
                localStorage.setItem('guestCart', JSON.stringify(newCart));
            }

            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    };

    const removeFromCart = async (productId, sizeKey) => {
        try {
            const itemToRemove = cart.find(item => item.size === sizeKey);

            if (itemToRemove) {
                // Restaurar el inventario usando el helper con cantidad negativa para sumar al stock (o lógica inversa)
                // updateProductStock resta la cantidad. Si pasamos negativo (-cantidad), sumará.
                await updateProductStock(productId, sizeKey, -itemToRemove.quantity);
            }

            const newCart = cart.filter(item => item.size !== sizeKey);
            setCart(newCart);

            setCart(newCart);

            if (userRef.current) {
                debouncedSaveCart(newCart);
            } else {
                localStorage.setItem('guestCart', JSON.stringify(newCart));
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    };

    const clearCartInDatabase = useCallback(async () => {
        if (!user) {
            // Si es invitado, solo limpiamos el estado (que limpiará el localstorage por el effect)
            setCart([]);
            return true;
        }

        try {
            // Eliminar el carrito de la base de datos
            const userRef = doc(db, 'storeUsers', user.uid);
            await updateDoc(userRef, {
                cart: [],
                updatedAt: new Date().toISOString()
            });

            // Actualizar el estado local
            setCart([]);
            console.log('✅ Carrito eliminado en la base de datos y estado local actualizado');
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar el carrito en la base de datos:', error);
            throw error;
        }
    }, [user]);

    const clearCart = async () => {
        try {
            // Restaurar stock en la base de datos
            const restoreStockPromises = cart.map(async (item) => {
                const parts = item.size.split('__');
                const productRef = doc(db, 'products', parts[0]);

                if (parts.length === 3) {
                    // It's a variant: productId__variantId__size
                    const [_, variantId, size] = parts;
                    // We need to read, modify array, write back
                    // Since inside map/loop, this might be heavy but necessary
                    try {
                        await runTransaction(db, async (transaction) => {
                            const pDoc = await transaction.get(productRef);
                            if (!pDoc.exists()) return;
                            const pData = pDoc.data();
                            const variants = pData.variants || [];
                            const vIndex = variants.findIndex(v => v.id === variantId);
                            if (vIndex !== -1) {
                                variants[vIndex].inventory[size] = (variants[vIndex].inventory[size] || 0) + item.quantity;
                                transaction.update(productRef, { variants });
                            }
                        });
                    } catch (e) {
                        console.error("Error restoring variant stock", e);
                        // Fallback or retry?
                    }
                } else {
                    await updateDoc(productRef, {
                        [`inventory.${item.size}`]: increment(item.quantity)
                    });
                }
            });

            await Promise.all(restoreStockPromises);

            // Limpiar el carrito en la base de datos
            await clearCartInDatabase();

            // Actualizar el estado local (hecho dentro de clearCartInDatabase)
            // setCart([]); 
        } catch (error) {
            console.error('Error al limpiar el carrito:', error);
            throw error;
        }
    };

    const clearCartForInactivity = useCallback(async () => {
        if (!user) {
            console.log('ℹ️ Limpiando carrito de invitado por inactividad');
            // Para invitados, el "clearCart" local es suficiente, pero queremos restaurar stock.
            // La función original restauraba stock. Vamos a reusar la lógica de restaurar stock pero adaptada.
            // Copiamos la lógica de abajo:

            // Restaurar el stock de cada producto en el carrito local
            for (const item of cart) {
                const [productId] = item.size.split('__');
                const productRef = doc(db, 'products', productId);

                try {
                    // logic restoration same as clearCart
                    const parts = item.size.split('__');
                    if (parts.length === 3) {
                        const [_, variantId, size] = parts;
                        const pDoc = await getDoc(productRef);
                        if (pDoc.exists()) {
                            const pData = pDoc.data();
                            const variants = pData.variants || [];
                            const vIndex = variants.findIndex(v => v.id === variantId);
                            if (vIndex !== -1) {
                                variants[vIndex].inventory[size] = (variants[vIndex].inventory[size] || 0) + item.quantity;
                                await updateDoc(productRef, { variants });
                            }
                        }
                    } else {
                        await updateDoc(productRef, {
                            [`inventory.${item.size}`]: increment(item.quantity)
                        });
                    }
                } catch (e) { console.error("Error restaurando stock inactividad", e) }
            }
            setCart([]);
            return;
        }

        try {
            // Obtener el carrito actual
            const userRef = doc(db, 'storeUsers', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.log('❌ Usuario no encontrado');
                return;
            }

            const userData = userDoc.data();
            const cartItems = userData.cart || [];

            // Restaurar el stock de cada producto en el carrito
            for (const item of cartItems) {
                const productRef = doc(db, 'products', item.productId);

                console.log(`📥 Restaurando ${item.quantity} unidades al producto ${item.productId} talla ${item.size}`);

                // Obtener el stock actual
                const productDoc = await getDoc(productRef);
                if (!productDoc.exists()) {
                    console.error(`❌ Producto ${item.productId} no encontrado`);
                    continue;
                }

                // Restaurar stock
                const parts = item.size.split('__');
                if (parts.length === 3) {
                    const [_, variantId, size] = parts;
                    console.log(`🔍 Buscando variante ${variantId} talla ${size}...`);
                    const variants = productDoc.data().variants || [];
                    const vIndex = variants.findIndex(v => v.id === variantId);

                    if (vIndex !== -1) {
                        const oldStock = variants[vIndex].inventory[size] || 0;
                        const newStock = oldStock + item.quantity;
                        variants[vIndex].inventory[size] = newStock;
                        console.log(`✅ Restaurando variante: Stock anterior ${oldStock} -> Nuevo ${newStock}`);
                        await updateDoc(productRef, { variants });
                    } else {
                        console.warn(`⚠️ Variante ${variantId} no encontrada en producto ${item.productId}`);
                    }
                } else {
                    console.log(`📦 Restaurando producto simple: +${item.quantity}`);
                    await updateDoc(productRef, {
                        [`inventory.${item.size}`]: increment(item.quantity)
                    });
                }
            }

            // Limpiar el carrito en la base de datos
            await updateDoc(userRef, {
                cart: []
            });

            // Actualizar el estado local
            setCart([]);
            console.log('✅ Carrito limpiado por inactividad exitosamente');
        } catch (error) {
            console.error('❌ Error al limpiar el carrito por inactividad:', error);
            throw error;
        }
    }, [user, cart]);

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const applyPromoCode = async (code) => {
        try {
            const q = query(collection(db, 'promocodes'), where('code', '==', code), where('active', '==', true));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Código inválido o expirado');
            }

            const promoData = querySnapshot.docs[0].data();
            const promoId = querySnapshot.docs[0].id;

            if (promoData.usageLimit > 0 && promoData.usageCount >= promoData.usageLimit) {
                throw new Error('Este código ha alcanzado su límite de uso');
            }

            setPromoCode({
                id: promoId,
                code: promoData.code,
                discountPercentage: promoData.discountPercentage
            });

            return {
                success: true,
                message: `Código ${promoData.code} aplicado: ${promoData.discountPercentage}% de descuento`
            };
        } catch (error) {
            console.error('Error applying promo code:', error);
            throw error;
        }
    };

    const removePromoCode = () => {
        setPromoCode(null);
    };

    const getTotalPrice = () => {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        if (promoCode) {
            const discount = (subtotal * promoCode.discountPercentage) / 100;
            return subtotal - discount;
        }
        return subtotal;
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getDiscountAmount = () => {
        if (!promoCode) return 0;
        const subtotal = getSubtotal();
        return (subtotal * promoCode.discountPercentage) / 100;
    };

    const value = {
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearCartInDatabase,
        clearCartForInactivity,
        loadCart: initializeCart, // Maintain API compatibility if needed, or remove
        getTotalItems,
        getTotalPrice,
        getSubtotal,
        getDiscountAmount,
        promoCode,
        applyPromoCode,
        removePromoCode
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}