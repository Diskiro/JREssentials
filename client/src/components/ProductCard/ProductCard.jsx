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
                    setProduct({
                        id: productDoc.id,
                        ...data,
                        images: Array.isArray(data.images) ? data.images : [],
                        inventory: data.inventory || {}
                    });
                }
            } catch (error) {
                console.error('Error al actualizar el stock:', error);
            }
        };

        updateProductStock();
    }, [initialProduct.id]);

    const mainImage = product.images?.[0] || '/assets/placeholder.jpg';

    // Obtener las tallas disponibles del inventario
    const availableSizes = Object.entries(product.inventory || {})
        .filter(([_, stock]) => stock > 0)
        .map(([sizeKey]) => sizeKey.split('__')[1])
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
            const success = await addToCart(product, selectedSize);
            if (success) {
                // Actualizar el stock localmente
                const sizeKey = `${product.id}__${selectedSize}`;
                const currentStock = product.inventory[sizeKey] || 0;
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
            if (isFavorite(product.id)) {
                await removeFromFavorites(product);
                setSnackbar({
                    open: true,
                    message: 'Producto eliminado de favoritos',
                    severity: 'success'
                });
            } else {
                await addToFavorites(product);
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
                    {product.name}
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