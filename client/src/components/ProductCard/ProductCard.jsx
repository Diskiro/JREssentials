import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Snackbar,
    Alert
} from '@mui/material';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { formatPrice } from '../../utils/priceUtils';
import PropTypes from 'prop-types';
import styles from '../../styles/ProductCard.module.css';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';


export default function ProductCard({ product: initialProduct }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
    const [selectedSize, setSelectedSize] = useState('');
    const [product, setProduct] = useState({
        ...initialProduct,
        images: Array.isArray(initialProduct.images) ? initialProduct.images : [],
        inventory: initialProduct.inventory || {}
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Efecto para actualizar el producto cuando cambia el stock
    useEffect(() => {
        const updateProductStock = async () => {
            try {
                const productDoc = await getDoc(doc(db, 'products', initialProduct.id));
                if (productDoc.exists()) {
                    const data = productDoc.data();
                    setProduct(prev => ({
                        id: productDoc.id,
                        ...data,
                        images: Array.isArray(data.images) ? data.images : [],
                        inventory: data.inventory || {},
                        // Preserve selectedVariant from initialProduct if it exists
                        selectedVariant: initialProduct.selectedVariant || prev.selectedVariant
                    }));
                }
            } catch (error) {
                console.error('Error al actualizar el stock:', error);
            }
        };

        updateProductStock();
    }, [initialProduct.id, initialProduct.selectedVariant]);

    const mainImage = product.selectedVariant?.images?.[0] || product.images?.[0] || product.variants?.[0]?.images?.[0] || '/assets/placeholder.jpg';

    // Obtener las tallas disponibles del inventario
    const availableSizes = Object.entries(product.inventory || {})
        .filter(([key, stock]) => {
            if (stock <= 0) return false;

            // Si tenemos una variante seleccionada, solo mostrar tallas de esa variante
            if (product.selectedVariant) {
                return key.includes(`__${product.selectedVariant.id}__`);
            }

            // Si no hay variante seleccionada, mostrar tallas del producto base (ID__Size)
            // Si el producto SOLO tiene variantes, esto podría estar vacío, lo cual es correcto para una tarjeta genérica
            // a menos que queramos agregar lógica para "cualquier talla de cualquier variante".
            // Por ahora, mantenemos la lógica para producto base o variante específica.
            const parts = key.split('__');
            return parts.length === 2;
        })
        .map(([sizeKey]) => {
            const parts = sizeKey.split('__');
            return parts[parts.length - 1]; // La talla siempre es el último elemento
        })
        .sort((a, b) => {
            // Ordenar las tallas de manera lógica
            const sizeOrder = { 'unitalla': 0, 'L': 1, 'XL': 2, '1XL': 3, '2XL': 4, '3XL': 5, '4XL': 6, '5XL': 7 };
            return sizeOrder[a] - sizeOrder[b];
        });

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!selectedSize) {
            setSnackbar({
                open: true,
                message: 'Por favor selecciona una talla',
                severity: 'error'
            });
            return;
        }

        try {
            // Pass selectedVariant (if exists) to addToCart
            const success = await addToCart(product, selectedSize, 1, product.selectedVariant);
            if (success) {
                // Actualizar el stock localmente
                // Adjust logic to handle variant keys? 
                // Currently updateLocalStock in ProductCard simplifies key.
                // If variant, key is ID__VariantID__Size. If not, ID__Size.
                // But ProductCard assumes simpler inventory structure or needs update.
                // Actually, ProductCard might not be perfectly suited for variant inventory updates locally without more changes.
                // For now, let's rely on toast success.
                // But we should try to update local visual stock if possible.

                let sizeKey = `${product.id}__${selectedSize}`;
                if (product.selectedVariant) {
                    sizeKey = `${product.id}__${product.selectedVariant.id}__${selectedSize}`;
                }

                const currentStock = product.inventory[sizeKey] || 0;
                // ... (rest of update logic) is fine if key matches
                const newStock = currentStock - 1;

                setProduct(prev => ({
                    ...prev,
                    inventory: {
                        ...prev.inventory,
                        [sizeKey]: newStock
                    }
                }));

                // Si el stock llega a 0, actualizar la lista de tallas disponibles
                if (newStock === 0) {
                    setSelectedSize('');
                }

                setSnackbar({
                    open: true,
                    message: 'Producto agregado al carrito',
                    severity: 'success'
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        }
    };

    const handleFavoriteClick = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorite(product.id, product.selectedVariant?.id)) {
                await removeFromFavorites(product, product.selectedVariant);
                setSnackbar({
                    open: true,
                    message: 'Producto eliminado de favoritos',
                    severity: 'success'
                });
            } else {
                await addToFavorites(product, product.selectedVariant);
                setSnackbar({
                    open: true,
                    message: 'Producto agregado a favoritos',
                    severity: 'success'
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Card className={styles.productCard}>
            <Box className={styles.imageContainer}>
                <img src={mainImage} alt={product.name} className={styles.productImage}
                    onClick={() => navigate(`/producto/${product.id}`, { replace: false })}
                />

            </Box>
            <CardContent className={styles.content}>
                <Typography
                    className={styles.title}
                    onClick={() => navigate(`/producto/${product.id}`, { replace: false })}
                >
                    {product.name} {product.selectedVariant ? `- ${product.selectedVariant.color}` : ''}
                </Typography>
                <Typography
                    className={styles.description}
                    sx={{
                        whiteSpace: 'pre-line'
                    }}
                >
                    {product.description}
                </Typography>
                <Typography className={styles.price}>
                    {formatPrice(product.price)}
                </Typography>
            </CardContent>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Card>
    );
}

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        price: PropTypes.number.isRequired,
        images: PropTypes.arrayOf(PropTypes.string),
        inventory: PropTypes.object
    }).isRequired
};

ProductCard.defaultProps = {
    product: {
        id: '',
        images: [],
        name: 'Producto sin nombre',
        price: 0,
        category: 'Sin categoría',
        sizes: [],
        inventory: {}
    }
};