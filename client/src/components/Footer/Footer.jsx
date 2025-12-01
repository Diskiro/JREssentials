import { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Link, Divider, IconButton } from '@mui/material';
import { Facebook, WhatsApp, Instagram } from '@mui/icons-material';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import '../../styles/Footer.css';

const Footer = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, 'categories'), orderBy('order', 'asc'), limit(4));
                const querySnapshot = await getDocs(q);
                const categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesList);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <Box className="footer"
            component="footer"
            sx={{
                py: 6,
                mt: 'auto'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Logo y descripción */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                            J&R Essentials
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Brilla sin pedir permiso.
                        </Typography>

                        {/* Redes sociales */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <IconButton href="https://www.instagram.com/jyressentials/" target="_blank" sx={{ color: 'white' }}>
                                <Instagram />
                            </IconButton>
                            <IconButton href="https://wa.me/525559032017" target="_blank" sx={{ color: 'white' }}>
                                <WhatsApp />
                            </IconButton>
                        </Box>
                    </Grid>

                    {/* Categorías */}
                    <Grid item xs={6} md={2}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Categorías
                        </Typography>
                        <Box component="nav">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/catalogo?category=${category.name}`}
                                        color="inherit"
                                        underline="hover"
                                        display="block"
                                        sx={{ mb: 1 }}
                                    >
                                        {category.name}
                                    </Link>
                                ))
                            ) : (
                                <Typography variant="body2" color="inherit">
                                    Cargando...
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {/* Información */}
                    <Grid item xs={6} md={2}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Información
                        </Typography>
                        <Box component="nav">
                            <Link href="/about" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Sobre Nosotros
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Envíos
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Términos y Condiciones
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block">
                                Política de Privacidad
                            </Link>
                        </Box>
                    </Grid>

                    {/* Contacto */}
                    <Grid item xs={12} sm={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Contacto
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Teléfono:</Box> 5559032017
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, backgroundColor: 'rgba(255,255,255,0.2)' }} />

                {/* Derechos de autor */}
                <Typography variant="body2" align="center">
                    © {new Date().getFullYear()} J&R Essentials. Todos los derechos reservados.
                </Typography>
            </Container>
        </Box>
    );
}
export default Footer;