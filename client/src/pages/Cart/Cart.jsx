import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Snackbar,
    Alert,
    Grid,
    Divider,
    TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/priceUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import '../../styles/Cart.css';

const Cart = () => {
    const {
        cart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getSubtotal,
        getDiscountAmount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        loadCart
    } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [code, setCode] = useState('');
    const [promoError, setPromoError] = useState('');
    const [promoSuccess, setPromoSuccess] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    const handleQuantityChange = async (productId, size, newQuantity) => {
        try {
            await updateQuantity(productId, size, newQuantity);
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

    // Función para obtener solo la talla del formato ID__TALLA
    const getSizeOnly = (size) => {
        return size.split('__')[1];
    };

    const handleClearCart = async () => {
        try {
            await clearCart();
            setSnackbar({
                open: true,
                message: 'Carrito eliminado correctamente',
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        }
    };

    const handleApplyPromo = async () => {
        if (!code.trim()) return;
        setPromoError('');
        setPromoSuccess('');
        try {
            const result = await applyPromoCode(code.toUpperCase().trim());
            setPromoSuccess(result.message);
            setCode('');
        } catch (error) {
            setPromoError(error.message);
        }
    };

    const handleRemovePromo = () => {
        removePromoCode();
        setPromoSuccess('');
        setPromoError('');
    };

    if (cart.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Tu Carrito
                </Typography>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Tu carrito está vacío
                    </Typography>
                    <Button
                        component={Link}
                        to="/products"
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        Ver Productos
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Tu Carrito
            </Typography>

            <Grid container spacing={4}>
                <Grid className="cart-container" item xs={12} md={8}>
                    {isMobile ? (
                        <Box>
                            {cart.map((item) => (
                                <Paper key={`${item.productId}_${item.size}`} sx={{ mb: 2, p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 16, borderRadius: 8 }}
                                        />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
                                            <Typography variant="body2">Talla: {getSizeOnly(item.size)}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="body2">Precio: {formatPrice(item.price)}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <IconButton size="small" onClick={() => handleQuantityChange(item.productId, getSizeOnly(item.size), item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon /></IconButton>
                                            {item.quantity}
                                            <IconButton size="small" onClick={() => handleQuantityChange(item.productId, getSizeOnly(item.size), item.quantity + 1)}><AddIcon /></IconButton>
                                        </Box>
                                        <Typography variant="body2">Total: {formatPrice(item.price * item.quantity)}</Typography>
                                        <IconButton color="primary" onClick={() => removeFromCart(item.productId, getSizeOnly(item.size))}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell align="center">Cantidad</TableCell>
                                        <TableCell align="right">Precio</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map((item) => (
                                        <TableRow key={item.size}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle2">{item.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Talla: {item.size.split('__')[1]}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleQuantityChange(item.productId, getSizeOnly(item.size), item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <RemoveIcon />
                                                    </IconButton>
                                                    <Typography>{item.quantity}</Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleQuantityChange(item.productId, getSizeOnly(item.size), item.quantity + 1)}
                                                    >
                                                        <AddIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatPrice(item.price)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatPrice(item.price * item.quantity)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => removeFromCart(item.productId, getSizeOnly(item.size))}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleClearCart}
                            startIcon={<DeleteIcon />}
                        >
                            Vaciar Carrito
                        </Button>
                    </Box>
                </Grid>

                <Grid className="cart-summary" item xs={12} md={4}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Resumen del Pedido
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Código de Promoción
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Ingresa tu código"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    disabled={!!promoCode}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleApplyPromo}
                                    disabled={!!promoCode || !code}
                                >
                                    Aplicar
                                </Button>
                            </Box>
                            {promoError && (
                                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                                    {promoError}
                                </Typography>
                            )}
                            {promoSuccess && (
                                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                                    {promoSuccess}
                                </Typography>
                            )}
                            {promoCode && (
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                    <Typography variant="body2" color="primary">
                                        Código <strong>{promoCode.code}</strong> aplicado
                                    </Typography>
                                    <IconButton size="small" onClick={handleRemovePromo} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Subtotal</Typography>
                            <Typography>{formatPrice(getSubtotal())}</Typography>
                        </Box>

                        {promoCode && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                                <Typography>Descuento ({promoCode.discountPercentage}%)</Typography>
                                <Typography>-{formatPrice(getDiscountAmount())}</Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography>Envío</Typography>
                            <Typography>Calculado en el siguiente paso</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6">Total</Typography>
                            <Typography variant="h6">{formatPrice(getTotalPrice())}</Typography>
                        </Box>

                        <Button
                            component={Link}
                            to="/checkout"
                            variant="contained"
                            fullWidth
                            size="large"
                        >
                            Proceder al Pago
                        </Button>
                    </Paper>
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

export default Cart;