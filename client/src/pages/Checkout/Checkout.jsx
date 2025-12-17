import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    TextField,
    FormControlLabel,
    Checkbox,
    Divider,
    Radio,
    RadioGroup,
    Paper,
    Box,
    Button,
    Stepper,
    Step,
    StepLabel,
    Link as MuiLink,
    CircularProgress,
    Snackbar,
    Alert,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    ListSubheader
} from '@mui/material';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/priceUtils';
import { calculateDistance } from '../../utils/distanceUtils';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { db } from '../../firebase';
import { collection, doc, runTransaction, Timestamp, increment, getDoc } from 'firebase/firestore';

const steps = ['Envío', 'Pago', 'Revisión'];

export default function CheckoutPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('transfer');
    const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('domicilio');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        metroStation: '',
        zipCode: ''
    });
    const { user } = useAuth();
    const { cart, getTotalPrice, clearCart, getSubtotal, getDiscountAmount, promoCode } = useCart();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [distanceInfo, setDistanceInfo] = useState(null);
    const [shippingCost, setShippingCost] = useState(40); // Base shipping cost
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            setFormData(prevData => ({
                ...prevData,
                name: `${user.firstName} ${user.lastName}` || '',
                email: user.email || '',
                phone: user.phone || '',
                metroStation: user.metroStation || ''
            }));
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handlePaymentChange = (event) => {
        setPaymentMethod(event.target.value);
    };

    const handleShippingMethodChange = (event) => {
        const method = event.target.value;
        setShippingMethod(method);

        if (method === 'popotla') {
            setShippingCost(0);
        } else {
            // Restore calculated price or base price
            if (distanceInfo && distanceInfo.distance && distanceInfo.distance.value) {
                setShippingCost(getShippingPrice(distanceInfo.distance.value));
            } else {
                setShippingCost(40); // Base cost
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getShippingPrice = (distanceInMeters) => {
        const km = distanceInMeters / 1000;
        if (km <= 2) return 40;
        if (km <= 4) return 60;
        if (km <= 6) return 80;
        if (km <= 8) return 100;
        if (km <= 10) return 110;
        if (km <= 13) return 120;
        if (km <= 16) return 180;
        return 180; // Default max or fallback
    };

    const handleCalculateDistance = async () => {
        if (!formData.zipCode) return;

        setCalculatingDistance(true);
        setDistanceInfo(null);
        try {
            const data = await calculateDistance(formData.zipCode);
            // Google Maps Distance Matrix response structure
            if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0]) {
                const element = data.rows[0].elements[0];
                if (element.status === 'OK') {
                    setDistanceInfo(element);
                    if (element.distance && element.distance.value) {
                        const newShippingCost = getShippingPrice(element.distance.value);
                        setShippingCost(newShippingCost);
                    }
                } else {
                    setSnackbar({ open: true, message: `No se pudo calcular la distancia: ${element.status}`, severity: 'warning' });
                }
            } else {
                setSnackbar({ open: true, message: 'Respuesta inesperada al calcular distancia.', severity: 'error' });
            }
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error al conectar con el servicio de distancia.', severity: 'error' });
        } finally {
            setCalculatingDistance(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || cart.length === 0) {
            setSnackbar({ open: true, message: 'Error: No hay usuario o el carrito está vacío.', severity: 'error' });
            return;
        }
        setIsProcessing(true);

        try {
            let newOrderRef;
            await runTransaction(db, async (transaction) => {
                // Obtener o crear el contador de pedidos del usuario
                const userOrdersCounterRef = doc(db, 'userOrdersCounters', user.uid);
                const counterDoc = await transaction.get(userOrdersCounterRef);

                let orderNumber = 1;
                if (counterDoc.exists()) {
                    orderNumber = counterDoc.data().count + 1;
                }

                // Crear el ID del pedido
                const orderId = `${user.uid}__orden${orderNumber}`;
                newOrderRef = doc(db, 'orders', orderId);

                const orderData = {
                    id: orderId,
                    userId: user.uid,
                    customerName: formData.name,
                    customerEmail: formData.email,
                    customerPhone: formData.phone,
                    shippingMethod: shippingMethod,
                    metroStation: formData.metroStation || user.metroStation || '',
                    paymentMethod: paymentMethod,
                    items: cart,
                    subtotal: getSubtotal(),
                    discount: getDiscountAmount(),
                    shippingCost: shippingCost,
                    totalAmount: total + shippingCost,
                    promoCode: promoCode ? {
                        code: promoCode.code,
                        discountPercentage: promoCode.discountPercentage
                    } : null,
                    status: 'Pendiente',
                    confirmed: false,
                    createdAt: Timestamp.now()
                };

                // Crear el pedido
                transaction.set(newOrderRef, orderData);

                // Actualizar el contador de pedidos del usuario
                transaction.set(userOrdersCounterRef, { count: orderNumber }, { merge: true });

                // Actualizar el inventario
                for (const item of cart) {
                    if (!item.productId || !item.size || !item.size.includes('__')) {
                        console.warn('Item inválido en el carrito, omitiendo actualización de stock:', item);
                        throw new Error(`Item inválido en el carrito: ${item.name || 'Producto desconocido'}. No se pudo procesar el pedido.`);
                    }

                    const productRef = doc(db, 'products', item.productId);
                    const sizeKey = item.size;

                    transaction.update(productRef, {
                        [`inventory.${sizeKey}`]: increment(-item.quantity)
                    });
                }

                // Update promo code usage if applied
                if (promoCode) {
                    const promoRef = doc(db, 'promocodes', promoCode.id);
                    transaction.update(promoRef, {
                        usageCount: increment(1)
                    });
                }
            });

            setSnackbar({ open: true, message: 'Pedido realizado con éxito.', severity: 'success' });
            await clearCart();
            navigate('/confirmation', {
                state: {
                    order: {
                        id: newOrderRef.id,
                        userId: user.uid,
                        customerName: formData.name,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        shippingMethod: shippingMethod,
                        metroStation: formData.metroStation || user.metroStation || '',
                        paymentMethod: paymentMethod,
                        items: cart,
                        subtotal: getSubtotal(),
                        discount: getDiscountAmount(),
                        shippingCost: shippingCost,
                        total: total + shippingCost,
                        promoCode: promoCode,
                        createdAt: new Date().toISOString(),
                        status: 'pending'
                    }
                }
            });

        } catch (error) {
            console.error("Error al procesar el pedido: ", error);
            setSnackbar({ open: true, message: `Error al procesar el pedido: ${error.message}`, severity: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = getSubtotal ? getSubtotal() : getTotalPrice();
    // shipping uses state shippingCost
    const discount = getDiscountAmount ? getDiscountAmount() : 0;
    const total = getTotalPrice();

    const getSizeOnly = (size) => {
        return size ? size.split('__')[1] : '';
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    {activeStep === 0 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Información de envío
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Método de envío
                                </Typography>

                                <RadioGroup value={shippingMethod} onChange={handleShippingMethodChange}>
                                    <FormControlLabel
                                        value="domicilio"
                                        control={<Radio />}
                                        label={`Envío a domicilio (${formatPrice(shippingMethod === 'domicilio' ? shippingCost : (distanceInfo ? getShippingPrice(distanceInfo.distance.value) : 40))})`}
                                    />

                                    {shippingMethod === 'domicilio' && (
                                        <Box sx={{ ml: 4, mb: 2, p: 2, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', borderRadius: 1 }}>
                                            {/* Distance Calculation Section */}
                                            <Box sx={{ mt: 1, mb: 2 }}>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={8} sm={9}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Código Postal (para calcular distancia)"
                                                            name="zipCode"
                                                            value={formData.zipCode || ''}
                                                            onChange={handleChange}
                                                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={4} sm={3}>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={handleCalculateDistance}
                                                            disabled={calculatingDistance || !formData.zipCode}
                                                            fullWidth
                                                        >
                                                            {calculatingDistance ? <CircularProgress size={24} /> : 'Calcular'}
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                                {distanceInfo && (
                                                    <Alert severity="info" sx={{ mt: 1 }}>
                                                        Distancia aproximada: <strong>{distanceInfo.distance?.text}</strong>
                                                    </Alert>
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    <FormControlLabel
                                        value="popotla"
                                        control={<Radio />}
                                        label="Entrega en metro Popotla (Gratis)"
                                    />
                                </RadioGroup>

                                <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
                                    Para coordinar el envío y recibo de tu producto comunícate a este WhatsApp:
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<WhatsAppIcon />}
                                    component={MuiLink}
                                    href="https://wa.me/525559032017"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        textTransform: 'none',
                                        bgcolor: '#25D366',
                                        '&:hover': {
                                            bgcolor: '#128C7E'
                                        }
                                    }}
                                >
                                    Contactar por WhatsApp
                                </Button>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Nombre"
                                        variant="outlined"
                                        margin="normal"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Email"
                                        variant="outlined"
                                        margin="normal"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Teléfono"
                                        variant="outlined"
                                        margin="normal"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {activeStep === 1 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Método de pago
                            </Typography>

                            <RadioGroup value={paymentMethod} onChange={handlePaymentChange}>
                                <FormControlLabel
                                    value="transfer"
                                    control={<Radio />}
                                    label="Transferencia bancaria"
                                />

                                {paymentMethod === 'transfer' && (
                                    <Box sx={{ ml: 4, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            Datos para transferencia:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>Nombre:</strong> Ruby Jazmin Marin Carrasco
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Banco:</strong> BanBajio
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Clabe:</strong> 0301 8090 0046 9352 39
                                        </Typography>
                                    </Box>
                                )}

                                <FormControlLabel
                                    value="farmacias"
                                    control={<Radio />}
                                    label="Depósito por Farmacias Guadalajara"
                                />

                                {paymentMethod === 'farmacias' && (
                                    <Box sx={{ ml: 4, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            Datos para depósito:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>Nombre:</strong> Ruby Jazmin Marin Carrasco
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Banco:</strong> BanBajio
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>No. Tarjeta:</strong> 4210 0300 6109 9128
                                        </Typography>
                                    </Box>
                                )}

                                <FormControlLabel
                                    value="oxxo"
                                    control={<Radio />}
                                    label="Depósito por OXXO"
                                />
                                {paymentMethod === 'oxxo' && (
                                    <Box sx={{ ml: 4, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            Datos para OXXO:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            <strong>Nombre:</strong> Ruby Jazmin Marin Carrasco
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Banco:</strong> Nubank
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Clabe:</strong> 5101 2547 2180 3766
                                        </Typography>
                                    </Box>
                                )}
                            </RadioGroup>
                        </Paper>
                    )}

                    {activeStep === 2 && (
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Revisión del pedido
                            </Typography>

                            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                                Información de envío:
                            </Typography>
                            <Typography paragraph>
                                <strong>Nombre:</strong> {formData.name}<br />
                                <strong>Email:</strong> {formData.email}<br />
                                <strong>Teléfono:</strong> {formData.phone}<br />
                                <strong>Estación de metro:</strong> {formData.metroStation || 'No especificada'}<br />
                                <strong>Método de envío:</strong> {shippingMethod === 'domicilio' ? 'Envío a domicilio' : 'Entrega en metro Popotla'}
                            </Typography>

                            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                                Método de pago:
                            </Typography>
                            <Typography paragraph>
                                {paymentMethod === 'transfer' && 'Transferencia bancaria'}
                                {paymentMethod === 'farmacias' && 'Depósito por Farmacias Guadalajara'}
                                {paymentMethod === 'oxxo' && 'Depósito por OXXO'}
                            </Typography>

                            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                                Resumen:
                            </Typography>
                            {cart.map((item) => (
                                <Box key={`${item.id}-${item.size}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography sx={{ mr: 2.5 }}>
                                        {item.name} ({getSizeOnly(item.size)}) × {item.quantity}
                                    </Typography>
                                    <Typography sx={{ whiteSpace: 'nowrap' }}>
                                        {formatPrice(item.price * item.quantity)}
                                    </Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography>Subtotal:</Typography>
                                <Typography>{formatPrice(subtotal)}</Typography>
                            </Box>
                            {promoCode && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                                    <Typography>Descuento ({promoCode.discountPercentage}%):</Typography>
                                    <Typography>-{formatPrice(discount)}</Typography>
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography>Envío:</Typography>
                                <Typography>{formatPrice(shippingCost)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Total:</Typography>
                                <Typography variant="h6">{formatPrice(total + shippingCost)}</Typography>
                            </Box>

                            <Box sx={{
                                mt: 3,
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 1,
                                border: '1px dashed #9e9e9e'
                            }}>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Tienes 24 horas para enviar tu recibo de pago a este WhatsApp:
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<WhatsAppIcon />}
                                    component={MuiLink}
                                    href="https://wa.me/525559032017"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        textTransform: 'none',
                                        bgcolor: '#25D366',
                                        '&:hover': {
                                            bgcolor: '#128C7E'
                                        }
                                    }}
                                >
                                    Contactar por WhatsApp
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            disabled={activeStep === 0 || isProcessing}
                            onClick={handleBack}
                            sx={{ mr: 1 }}
                        >
                            Regresar
                        </Button>

                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={isProcessing || cart.length === 0}
                            >
                                {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Confirmar pedido'}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                disabled={isProcessing}
                            >
                                Continuar
                            </Button>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 130 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Resumen del pedido
                        </Typography>

                        {cart.map((item) => (
                            <Box key={`${item.id}-${item.size}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography sx={{ mr: 2.5 }}>
                                    {item.name} ({getSizeOnly(item.size)}) × {item.quantity}
                                </Typography>
                                <Typography sx={{ whiteSpace: 'nowrap' }}>
                                    {formatPrice(item.price * item.quantity)}
                                </Typography>
                            </Box>
                        ))}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Subtotal:</Typography>
                            <Typography>{formatPrice(subtotal)}</Typography>
                        </Box>
                        {promoCode && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                                <Typography>Descuento ({promoCode.discountPercentage}%):</Typography>
                                <Typography>-{formatPrice(discount)}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Envío:</Typography>
                            <Typography>{formatPrice(shippingCost)}</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Total:</Typography>
                            <Typography variant="h6">{formatPrice(total + shippingCost)}</Typography>
                        </Box>
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
}