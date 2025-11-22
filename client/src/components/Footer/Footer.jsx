import { Box, Container, Grid, Typography, Link, Divider, IconButton } from '@mui/material';
import { Facebook, WhatsApp } from '@mui/icons-material';
import './Footer.css';

const Footer = () => {
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
                            Tu destino para moda femenina: ropa exclusiva y accesorios elegantes.
                        </Typography>

                        {/* Redes sociales */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <IconButton href="https://www.facebook.com/share/18uDVsd7Pa/" sx={{ color: 'white' }}>
                                <Facebook />
                            </IconButton>
                            <IconButton href="https://wa.me/525559032017" sx={{ color: 'white' }}>
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
                            <Link href="/catalogo?category=vestidos" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Vestidos
                            </Link>
                            <Link href="/catalogo?category=blusas" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Blusas
                            </Link>
                            <Link href="/catalogo?category=pantalones" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Pantalones
                            </Link>
                            <Link href="/accessories" color="inherit" underline="hover" display="block">
                                Accesorios
                            </Link>
                        </Box>
                    </Grid>

                    {/* Información */}
                    <Grid item xs={6} md={2}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Información
                        </Typography>
                        <Box component="nav">
                            <Link href="#" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Sobre Nosotros
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
                                Envíos y Devoluciones
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