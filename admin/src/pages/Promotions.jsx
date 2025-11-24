import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, LocalOffer as OfferIcon } from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPromo, setCurrentPromo] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discountPercentage: '',
        usageLimit: '',
        active: true
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const q = query(collection(db, 'promocodes'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const promotionsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPromotions(promotionsData);
        } catch (error) {
            console.error('Error fetching promotions:', error);
        }
    };

    const handleOpen = (promo = null) => {
        if (promo) {
            setCurrentPromo(promo);
            setFormData({
                code: promo.code,
                discountPercentage: promo.discountPercentage,
                usageLimit: promo.usageLimit,
                active: promo.active
            });
        } else {
            setCurrentPromo(null);
            setFormData({
                code: '',
                discountPercentage: '',
                usageLimit: '',
                active: true
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentPromo(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const promoData = {
                code: formData.code.toUpperCase().trim(),
                discountPercentage: Number(formData.discountPercentage),
                usageLimit: Number(formData.usageLimit),
                active: formData.active,
                updatedAt: Timestamp.now()
            };

            if (currentPromo) {
                await updateDoc(doc(db, 'promocodes', currentPromo.id), promoData);
            } else {
                await addDoc(collection(db, 'promocodes'), {
                    ...promoData,
                    usageCount: 0,
                    createdAt: Timestamp.now()
                });
            }

            fetchPromotions();
            handleClose();
        } catch (error) {
            console.error('Error saving promotion:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este código de promoción?')) {
            try {
                await deleteDoc(doc(db, 'promocodes', id));
                fetchPromotions();
            } catch (error) {
                console.error('Error deleting promotion:', error);
            }
        }
    };

    const handleToggleActive = async (promo) => {
        try {
            await updateDoc(doc(db, 'promocodes', promo.id), {
                active: !promo.active
            });
            fetchPromotions();
        } catch (error) {
            console.error('Error updating promotion status:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3} sx={{ flexDirection: 'column' }}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <OfferIcon fontSize="large" />
                        Códigos y Promociones
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Nuevo Código
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Código</TableCell>
                                    <TableCell>Descuento</TableCell>
                                    <TableCell>Límite de Uso</TableCell>
                                    <TableCell>Usos Actuales</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {promotions.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell>
                                            <Chip label={promo.code} color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell>{promo.discountPercentage}%</TableCell>
                                        <TableCell>{promo.usageLimit}</TableCell>
                                        <TableCell>{promo.usageCount || 0}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={promo.active}
                                                onChange={() => handleToggleActive(promo)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpen(promo)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(promo.id)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentPromo ? 'Editar Promoción' : 'Nueva Promoción'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Código de Promoción"
                            fullWidth
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            helperText="Ej: VERANO2025"
                        />
                        <TextField
                            label="Porcentaje de Descuento (%)"
                            type="number"
                            fullWidth
                            value={formData.discountPercentage}
                            onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                        />
                        <TextField
                            label="Límite de Usos"
                            type="number"
                            fullWidth
                            value={formData.usageLimit}
                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                            helperText="Número máximo de veces que se puede usar este código"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                />
                            }
                            label="Activo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
