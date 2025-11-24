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
    FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function Banners() {
    const [banners, setBanners] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentBanner, setCurrentBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        mobileImageUrl: '',
        active: true,
        order: 0
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const bannersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBanners(bannersData);
        } catch (error) {
            console.error('Error fetching banners:', error);
        }
    };

    const handleOpen = (banner = null) => {
        if (banner) {
            setCurrentBanner(banner);
            setFormData({
                title: banner.title,
                subtitle: banner.subtitle,
                imageUrl: banner.imageUrl,
                mobileImageUrl: banner.mobileImageUrl || '',
                active: banner.active,
                order: banner.order || 0
            });
        } else {
            setCurrentBanner(null);
            setFormData({
                title: '',
                subtitle: '',
                imageUrl: '',
                mobileImageUrl: '',
                active: true,
                order: 0
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentBanner(null);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const bannerData = {
                ...formData,
                updatedAt: new Date()
            };

            if (currentBanner) {
                await updateDoc(doc(db, 'banners', currentBanner.id), bannerData);
            } else {
                await addDoc(collection(db, 'banners'), {
                    ...bannerData,
                    createdAt: new Date()
                });
            }

            fetchBanners();
            handleClose();
        } catch (error) {
            console.error('Error saving banner:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este banner?')) {
            try {
                await deleteDoc(doc(db, 'banners', id));
                fetchBanners();
            } catch (error) {
                console.error('Error deleting banner:', error);
            }
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            await updateDoc(doc(db, 'banners', banner.id), {
                active: !banner.active
            });
            fetchBanners();
        } catch (error) {
            console.error('Error updating banner status:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid sx={{ flexDirection: 'column' }} container spacing={3}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1">
                        Banners
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Nuevo Banner
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Imagen</TableCell>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Subtítulo</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Orden</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>
                                            <Box
                                                component="img"
                                                sx={{
                                                    height: 50,
                                                    width: 100,
                                                    objectFit: 'cover',
                                                    borderRadius: 1
                                                }}
                                                src={banner.imageUrl}
                                                alt={banner.title}
                                            />
                                        </TableCell>
                                        <TableCell>{banner.title}</TableCell>
                                        <TableCell>{banner.subtitle}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={banner.active}
                                                onChange={() => handleToggleActive(banner)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>{banner.order}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpen(banner)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDelete(banner.id)} color="error">
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
                <DialogTitle>{currentBanner ? 'Editar Banner' : 'Nuevo Banner'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Título"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Subtítulo"
                            fullWidth
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        />
                        <TextField
                            label="Orden"
                            type="number"
                            fullWidth
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        />
                        <TextField
                            label="URL de la Imagen (Escritorio)"
                            fullWidth
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            helperText="Ingresa la URL de la imagen para escritorio"
                        />
                        {formData.imageUrl && (
                            <Box
                                component="img"
                                sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    mt: 1
                                }}
                                src={formData.imageUrl}
                                alt="Preview Desktop"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Error+al+cargar+imagen'; }}
                            />
                        )}
                        <TextField
                            label="URL de la Imagen (Móvil)"
                            fullWidth
                            value={formData.mobileImageUrl}
                            onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
                            helperText="Ingresa la URL de la imagen para dispositivos móviles (< 769px)"
                        />
                        {formData.mobileImageUrl && (
                            <Box
                                component="img"
                                sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    mt: 1
                                }}
                                src={formData.mobileImageUrl}
                                alt="Preview Mobile"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Error+al+cargar+imagen'; }}
                            />
                        )}
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
