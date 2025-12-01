import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Snackbar,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/auth/useAuth';
import { useCart } from '../../context/CartContext';

export function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const navigate = useNavigate();
    const { login, resetPassword, alert, closeAlert } = useAuth();
    const { addToCart } = useCart();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            if (user) {
                // Check for pending cart item
                const pendingItem = localStorage.getItem('pendingCartItem');
                if (pendingItem) {
                    try {
                        const { product, size, quantity } = JSON.parse(pendingItem);
                        await addToCart(product, size, quantity);
                        localStorage.removeItem('pendingCartItem');
                    } catch (error) {
                        console.error('Error adding pending item to cart:', error);
                    }
                }
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordClick = () => {
        setForgotPasswordOpen(true);
    };

    const handleForgotPasswordClose = () => {
        setForgotPasswordOpen(false);
        setResetEmail('');
    };

    const handleResetPasswordSubmit = async () => {
        if (!resetEmail) return;

        const success = await resetPassword(resetEmail);
        if (success) {
            handleForgotPasswordClose();
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Iniciar Sesión
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        fullWidth
                        label="Correo Electrónico"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Contraseña"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            color="primary"
                            size="small"
                            onClick={handleForgotPasswordClick}
                            sx={{ textTransform: 'none' }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Button>
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                Regístrate aquí
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotPasswordOpen} onClose={handleForgotPasswordClose}>
                <DialogTitle>Recuperar Contraseña</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </DialogContentText>
                    <DialogContentText>
                        <strong>Revisa en spam si no encuentras el correo.</strong>
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="reset-email"
                        label="Correo Electrónico"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleForgotPasswordClose}>Cancelar</Button>
                    <Button onClick={handleResetPasswordSubmit}>Enviar</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={closeAlert}
            >
                <Alert
                    onClose={closeAlert}
                    severity={alert.severity}
                    sx={{ width: '100%' }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}