import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Grid,
    Alert,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader
} from '@mui/material';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export default function EditProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        metroStation: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'storeUsers', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phone: data.phone || '',
                        metroStation: data.metroStation || ''
                    });
                }
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
                setSnackbar({
                    open: true,
                    message: 'Error al cargar los datos del usuario',
                    severity: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUserData();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const userRef = doc(db, 'storeUsers', user.uid);
            await updateDoc(userRef, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                metroStation: formData.metroStation,
                updatedAt: new Date()
            });

            setSnackbar({
                open: true,
                message: 'Perfil actualizado correctamente',
                severity: 'success'
            });

            // Redirigir al perfil después de 2 segundos
            setTimeout(() => {
                navigate('/usuario');
            }, 2000);
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            setSnackbar({
                open: true,
                message: 'Error al actualizar el perfil',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Editar Perfil
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Apellido"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Ej: 55 1234 5678"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="metro-station-label">Estación de metro</InputLabel>
                                <Select
                                    labelId="metro-station-label"
                                    id="metro-station-select"
                                    name="metroStation"
                                    value={formData.metroStation}
                                    label="Estación de metro"
                                    onChange={handleChange}
                                >
                                    <ListSubheader>Linea 2</ListSubheader>
                                    <MenuItem value="Cuatro Caminos">Cuatro Caminos</MenuItem>
                                    <MenuItem value="Panteones">Panteones</MenuItem>
                                    <MenuItem value="Tacuba">Tacuba</MenuItem>
                                    <MenuItem value="Cuitláhuac">Cuitláhuac</MenuItem>
                                    <MenuItem value="Popotla">Popotla</MenuItem>
                                    <MenuItem value="Colegio Militar">Colegio Militar</MenuItem>
                                    <MenuItem value="Normal">Normal</MenuItem>
                                    <MenuItem value="San Cosme">San Cosme</MenuItem>
                                    <MenuItem value="Revolución">Revolución</MenuItem>
                                    <MenuItem value="Hidalgo">Hidalgo</MenuItem>

                                    <ListSubheader>Linea 7</ListSubheader>
                                    <MenuItem value="Camarones">Camarones</MenuItem>
                                    <MenuItem value="Refinería">Refinería</MenuItem>
                                    <MenuItem value="Tacuba (L7)">Tacuba</MenuItem>
                                    <MenuItem value="San Joaquín">San Joaquín</MenuItem>
                                    <MenuItem value="Polanco">Polanco</MenuItem>
                                    <MenuItem value="Auditorio">Auditorio</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/user')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Box>
                </form>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
} 