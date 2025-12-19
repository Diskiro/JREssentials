import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Container, Grid, Typography, Button, Divider, Select, MenuItem, Box, IconButton, CircularProgress, TextField, Snackbar, Alert, FormControl, InputLabel } from '@mui/material';
import { AddShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material';
import { formatPrice } from '../../utils/priceUtils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { FavoritesProvider } from '../../context/FavoritesContext';
import ShareButton from '../../components/ShareButton/ShareButton';
import ProductImageCarousel from '../../components/Product/ProductImageCarousel';
import useProductStock from '../../hooks/useProductStock';
import '../../styles/Product.css';


const ProductPageContent = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    // Use Custom Hook
    const {
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
    } = useProductStock(id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const handleAddToCart = async () => {
        if (!selectedSize) {
            setSnackbar({
                open: true,
                message: 'Por favor selecciona una talla',
                severity: 'error'
            });
            return;
        }

        if (!user) {
            const pendingItem = {
                product,
                size: selectedSize,
                quantity,
                variant: selectedVariant
            };
            localStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
            navigate('/login');
            return;
        }

        // Check availability logic again if needed, or rely on hook state
        // The hook already maintains maxQuantity, but let's double check vs current state
        if (maxQuantity === 0 || quantity > maxQuantity) {
            setSnackbar({
                open: true,
                message: `Solo hay ${maxQuantity} unidades disponibles`,
                severity: 'error'
            });
            return;
        }

        try {
            const success = await addToCart(product, selectedSize, quantity, selectedVariant);
            if (success) {
                // Actualizar el stock local
                updateLocalStock(quantity);
            }
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Error al agregar al carrito',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleFavoriteClick = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorite(product.id, selectedVariant?.id)) {
                await removeFromFavorites(product, selectedVariant);
                setSnackbar({
                    open: true,
                    message: 'Producto eliminado de favoritos',
                    severity: 'success'
                });
            } else {
                await addToFavorites(product, selectedVariant);
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

    if (loading) return (
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
        </Container>
    );

    if (!product) return null;

    const formattedPrice = formatPrice(product.price);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid className="product-view" container spacing={4}>
                {/* Galería de imágenes */}
                <Grid className="product-image-container" item xs={12} md={6} sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                }}>
                    <ProductImageCarousel product={product} selectedVariant={selectedVariant} />
                </Grid>

                {/* Información del producto */}
                <Grid item xs={12} md={6}>
                    <Box sx={{
                        maxWidth: '400px',
                        '@media (min-width: 769px)': {
                            margin: '0 auto'
                        }
                    }}>
                        <Typography variant="h4" gutterBottom>
                            {product.name} {selectedVariant ? ` ${selectedVariant.color}` : ''}
                        </Typography>
                        <Typography variant="h5" color="primary" gutterBottom>
                            {formattedPrice}
                        </Typography>
                        <Typography
                            variant="body1"
                            paragraph
                            sx={{
                                whiteSpace: 'pre-line'
                            }}
                        >
                            {product.description}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        {/* Variants Selector */}
                        {product.variants && product.variants.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Color / Variante
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {product.variants.map((variant) => (
                                        <Button
                                            key={variant.id}
                                            variant={selectedVariant?.id === variant.id ? "contained" : "outlined"}
                                            onClick={() => {
                                                if (selectedVariant?.id === variant.id) {
                                                    setSelectedVariant(null);
                                                    setSelectedSize('');
                                                } else {
                                                    setSelectedVariant(variant);
                                                    setSelectedSize('');
                                                }
                                            }}
                                            sx={{ borderRadius: 2 }}
                                            className="variant-button"
                                        >
                                            {variant.color}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Tallas */}
                        {displayedSizes && displayedSizes.length > 0 && (
                            <Box sx={{ mb: 2, display: 'none' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Talla
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Talla</InputLabel>
                                    <Select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        label="Talla"
                                    >
                                        <MenuItem value="">
                                            <em>Selecciona una talla</em>
                                        </MenuItem>
                                        {displayedSizes.map((size) => (
                                            <MenuItem key={size} value={size}>
                                                {size} ({selectedVariant ? selectedVariant.inventory[size] : product.inventory[`${product.id}__${size}`]} disponibles)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        {/* Cantidad */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Cantidad
                            </Typography>
                            <TextField
                                type="number"
                                value={quantity}
                                onChange={handleQuantityChange}
                                inputProps={{
                                    min: 1,
                                    max: maxQuantity,
                                    step: 1
                                }}
                                fullWidth
                                disabled={!selectedSize || maxQuantity === 0}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {selectedSize
                                    ? `${maxQuantity} disponibles`
                                    : 'Selecciona una talla'}
                            </Typography>
                        </Box>

                        {/* Botones de acción */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <IconButton
                                aria-label="add to favorites"
                                color="secondary"
                                size="large"
                                onClick={handleFavoriteClick}
                            >
                                {isFavorite(product.id, selectedVariant?.id) ? <Favorite /> : <FavoriteBorder />}
                            </IconButton>
                            <ShareButton
                                productUrl={`${window.location.origin}/producto/${product.id}`}
                                productName={product.name}
                            />
                            <Button
                                className="add-to-cart-button button primary"
                                variant="contained"
                                size="large"
                                startIcon={<AddShoppingCart />}
                                fullWidth
                                onClick={handleAddToCart}
                                disabled={!selectedSize || maxQuantity === 0}
                            >
                                {maxQuantity === 0 ? 'Sin stock' : 'Añadir al carrito'}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

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
        </Container>
    );
};

const ProductPage = () => {
    return (
        <FavoritesProvider>
            <ProductPageContent />
        </FavoritesProvider>
    );
};

export default ProductPage;