import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import styles from '../../styles/About.module.css';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';

const About = () => {
    return (
        <Container maxWidth="lg" className={styles.container}>
            <Paper elevation={0} className={styles.content}>
                <Typography variant="h2" component="h1" className={styles.mainTitle}>
                    Sobre J&R Essentials
                </Typography>

                <Box className={styles.imageContainer}>
                    <OptimizedImage
                        src="/JR_Essentials.jpg"
                        alt="J&R Essentials"
                        className={styles.aboutImage}
                    />
                </Box>

                <Box className={styles.textContent}>
                    <Typography paragraph className={styles.paragraph}>
                        En J&R Essentials, creemos que la moda es sinónimo de confianza, comodidad y estilo sin límites. Somos un espacio dedicado a la mujer curvy, donde cada prenda está cuidadosamente seleccionada para resaltar tu belleza única y acompañarte en cada momento de tu vida.
                    </Typography>

                    <Typography paragraph className={styles.paragraph}>
                        Nuestra misión es romper estereotipos y ofrecer ropa de calidad, a la moda y con tallajes reales, porque sabemos que el estilo no tiene talla. Desde looks casuales hasta outfits elegantes, en nuestra boutique encontrarás piezas que se adaptan a tu cuerpo y personalidad, siempre con el toque exclusivo que nos caracteriza.
                    </Typography>

                    <Typography variant="h4" component="h2" className={styles.subtitle}>
                        ¿Por qué elegirnos?
                    </Typography>

                    <Box className={styles.features}>
                        <Typography paragraph className={styles.feature}>
                            ✨ Diseños pensados para ti: Prendas que combinan tendencias, comodidad y ajuste perfecto.
                        </Typography>
                        <Typography paragraph className={styles.feature}>
                            ✨ Variedad y versatilidad: Desde ropa casual hasta elegante, para todas las ocasiones.
                        </Typography>
                        <Typography paragraph className={styles.feature}>
                            ✨ Asesoramiento personalizado: Te ayudamos a encontrar piezas que te hagan sentir tan fabulosa como eres.
                        </Typography>
                    </Box>

                    <Typography paragraph className={styles.paragraph}>
                        En J&R Essentials, celebramos la diversidad y empoderamos a través de la moda. ¡Porque todas merecemos brillar con confianza!
                    </Typography>

                    <Typography variant="h5" component="h3" className={styles.welcome}>
                        ¡Bienvenida a tu nuevo destino fashion!
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default About; 