import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Typography,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { collection, getDocs, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersCollection = collection(db, 'adminUsers');
            const snapshot = await getDocs(usersCollection);
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error('Error fetching admin users:', error);
            setAlert({
                open: true,
                message: 'Error al cargar los administradores',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
            try {
                await deleteDoc(doc(db, 'adminUsers', userId));
                setUsers(users.filter(user => user.id !== userId));
                setAlert({
                    open: true,
                    message: 'Administrador eliminado correctamente',
                    severity: 'success'
                });
            } catch (error) {
                console.error('Error deleting admin:', error);
                setAlert({
                    open: true,
                    message: 'Error al eliminar el administrador',
                    severity: 'error'
                });
            }
        }
    };

    const handleCreate = async () => {
        if (!formData.email || !formData.password) {
            setAlert({
                open: true,
                message: 'Email y contraseña son obligatorios',
                severity: 'error'
            });
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'adminUsers'), formData);
            const newUser = { id: docRef.id, ...formData };
            setUsers([...users, newUser]);
            setOpenDialog(false);
            setFormData({ email: '', password: '', role: 'admin' });
            setAlert({
                open: true,
                message: 'Administrador creado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error creating admin:', error);
            setAlert({
                open: true,
                message: 'Error al crear el administrador',
                severity: 'error'
            });
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData({ email: '', password: '', role: 'admin' });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Gestión de Administradores
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Crear Admin
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDelete(user.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Crear Nuevo Administrador</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Rol"
                        name="role"
                        value={formData.role}
                        disabled
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained" color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
            >
                <Alert
                    onClose={() => setAlert({ ...alert, open: false })}
                    severity={alert.severity}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
