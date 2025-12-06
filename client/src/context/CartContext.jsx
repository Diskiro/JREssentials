import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, query, collection, where, getDocs } from 'firebase/firestore';
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

            const currentStock = productDoc.data().inventory?.[sizeKey] || 0;
            const newStock = currentStock - quantity;

            if (newStock < 0) {
                throw new Error('No hay suficiente stock disponible');
            }

            await updateDoc(productRef, {
                [`inventory.${sizeKey}`]: newStock
            });

        } catch (error) {
            console.error('❌ Error al actualizar stock:', error);
            throw error;
        }
    };

    // Función debounceada para guardar el carrito
    const debouncedSaveCart = useCallback(
        debounce(async (cartData) => {
            try {
                if (user) {
                    await setDoc(doc(db, 'storeUsers', user.uid), {
                        cart: cartData,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            } catch (error) {
                console.error('❌ Error guardando carrito:', error);
                throw error;
            }
        }, 1000),
        [user]
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
        }
    }, [user, initializeCart]);

    const updateQuantity = async (productId, size, quantity) => {
        try {
            if (quantity <= 0) {
                removeFromCart(productId, size);
                return;
            }

            const sizeKey = `${productId}__${size}`;
            const currentItem = cart.find(item => item.size === sizeKey);

            if (!currentItem) {
                throw new Error('Producto no encontrado en el carrito');
            }

            // Calcular la diferencia entre la cantidad actual y la nueva
            const quantityDifference = quantity - currentItem.quantity;

            if (quantityDifference > 0) {
                // Si estamos aumentando la cantidad, verificar el stock disponible
                const availableStock = await getProductStock(productId, sizeKey);
                if (availableStock < quantityDifference) {
                    throw new Error(`No hay suficiente stock disponible. Solo quedan ${availableStock} unidades.`);
                }
                // Actualizar el inventario en la base de datos
                await updateDoc(doc(db, 'products', productId), {
                    [`inventory.${sizeKey}`]: increment(-quantityDifference)
                });
            } else if (quantityDifference < 0) {
                // Si estamos reduciendo la cantidad, devolver al inventario la diferencia exacta
                await updateDoc(doc(db, 'products', productId), {
                    [`inventory.${sizeKey}`]: increment(Math.abs(quantityDifference))
                });
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

    const addToCart = async (product, size, quantity = 1) => {
        try {
            if (quantity <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            const sizeKey = `${product.id}__${size}`;
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

            // Verificar si hay suficiente stock
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
                    name: product.name,
                    price: product.price,
                    size: sizeKey,
                    quantity: quantity,
                    image: product.images?.[0] || '',
                    createdAt: new Date().toISOString()
                });
            }

            setCart(newCart);

            // IMPORTANTE: Si es usuario logueado, se guarda en firebase via debouncedSaveCart
            // Si es invitado, el useEffect detectará el cambio y guardará en localStorage
            if (user) {
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

    const removeFromCart = async (productId, size) => {
        try {
            const sizeKey = `${productId}__${size}`;
            const itemToRemove = cart.find(item => item.size === sizeKey);

            if (itemToRemove) {
                // Restaurar el inventario en la base de datos con la cantidad exacta
                const productRef = doc(db, 'products', productId);
                await updateDoc(productRef, {
                    [`inventory.${sizeKey}`]: increment(itemToRemove.quantity)
                });
            }

            const newCart = cart.filter(item => item.size !== sizeKey);
            setCart(newCart);

            if (user) {
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
                const [productId, size] = item.size.split('__');
                const productRef = doc(db, 'products', productId);

                // Devolver exactamente la misma cantidad que estaba en el carrito
                await updateDoc(productRef, {
                    [`inventory.${item.size}`]: increment(item.quantity)
                });
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
                    await updateDoc(productRef, {
                        [`inventory.${item.size}`]: increment(item.quantity)
                    });
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

                // Actualizar el stock de la talla específica
                await updateDoc(productRef, {
                    [`inventory.${item.size}`]: increment(item.quantity)
                });
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