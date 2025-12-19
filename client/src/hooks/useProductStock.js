import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const useProductStock = (id) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [maxQuantity, setMaxQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Fetch Product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'products', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = { id: docSnap.id, ...docSnap.data() };
                    setProduct(productData);

                    // Auto-select 'Unitalla' for 'Aretes' category
                    if (productData.category === 'Aretes' && productData.inventory) {
                        const inventoryKeys = Object.keys(productData.inventory);
                        const unitallaKey = inventoryKeys.find(key => key.toLowerCase().includes('unitalla'));
                        if (unitallaKey) {
                            const size = unitallaKey.split('__')[1];
                            setSelectedSize(size);
                        }
                    }
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    // Calculate available sizes based on selected variant or main product
    const getAvailableSizes = () => {
        if (!product) return [];

        if (selectedVariant) {
            return Object.entries(selectedVariant.inventory || {})
                .filter(([_, stock]) => stock > 0)
                .map(([size]) => size)
                .sort((a, b) => {
                    const sizeOrder = { 'unitalla': 0, 'L': 1, 'XL': 2, '1XL': 3, '2XL': 4, '3XL': 5, '4XL': 6, '5XL': 7 };
                    return sizeOrder[a] - sizeOrder[b];
                });
        }

        return Object.entries(product.inventory || {})
            .filter(([_, stock]) => stock > 0)
            .map(([sizeKey]) => sizeKey.split('__')[1])
            .sort((a, b) => {
                const sizeOrder = { 'unitalla': 0, 'L': 1, 'XL': 2, '1XL': 3, '2XL': 4, '3XL': 5, '4XL': 6, '5XL': 7 };
                return sizeOrder[a] - sizeOrder[b];
            });
    };

    const displayedSizes = getAvailableSizes();

    // Max Quantity Logic
    useEffect(() => {
        if (selectedSize && product) {
            let availableQuantity = 0;
            const sizeKey = selectedVariant ? selectedSize : `${product.id}__${selectedSize}`;

            if (selectedVariant) {
                availableQuantity = selectedVariant.inventory?.[selectedSize] || 0;
            } else {
                availableQuantity = product.inventory?.[sizeKey] || 0;
            }

            setMaxQuantity(availableQuantity);
            // Si la cantidad actual es mayor que el nuevo máximo, ajustarla
            if (quantity > availableQuantity) {
                setQuantity(availableQuantity || 1);
            }
        } else {
            setMaxQuantity(0);
            setQuantity(1);
        }
    }, [selectedSize, product, quantity, selectedVariant]);

    // Auto-select size if there's only one available
    useEffect(() => {
        if (!selectedSize && displayedSizes.length === 1) {
            setSelectedSize(displayedSizes[0]);
        }
    }, [selectedSize, displayedSizes]);

    const handleQuantityChange = (event) => {
        const newQuantity = parseInt(event.target.value);
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            setQuantity(newQuantity);
        }
    };

    const updateLocalStock = (qty) => {
        if (!product) return;

        let sizeKey;
        if (!selectedVariant) {
            sizeKey = `${product.id}__${selectedSize}`;
        }

        const currentStock = selectedVariant
            ? (selectedVariant.inventory?.[selectedSize] || 0)
            : (product.inventory?.[sizeKey] || 0);

        const newStock = currentStock - qty;

        if (selectedVariant) {
            setProduct(prev => ({
                ...prev,
                variants: prev.variants.map(v =>
                    v.id === selectedVariant.id ? {
                        ...v,
                        inventory: {
                            ...v.inventory,
                            [selectedSize]: newStock
                        }
                    } : v
                )
            }));
            // Update selectedVariant reference too
            setSelectedVariant(prev => ({
                ...prev,
                inventory: { ...prev.inventory, [selectedSize]: newStock }
            }));
        } else {
            setProduct(prev => ({
                ...prev,
                inventory: {
                    ...prev.inventory,
                    [sizeKey]: newStock
                }
            }));
        }

        setMaxQuantity(newStock);
        if (quantity > newStock) {
            setQuantity(newStock || 1);
        }
    };

    return {
        product,
        loading,
        selectedSize,
        setSelectedSize,
        selectedVariant,
        setSelectedVariant,
        quantity,
        setQuantity,
        maxQuantity,
        displayedSizes,
        handleQuantityChange,
        updateLocalStock
    };
};

export default useProductStock;
