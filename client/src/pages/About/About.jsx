import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import styles from '../../styles/About.module.css';

const About = () => {
    return (
        <Container maxWidth="lg" className={styles.container}>
            <Paper elevation={0} className={styles.content}>
                <Typography variant="h2" component="h1" className={styles.mainTitle}>
                    Sobre J&R Essentials
                </Typography>

                <Box className={styles.imageContainer}>
                    <img
                        src="/JR_Essentials.jpg"
                        alt="J&R Essentials"
                        className={styles.aboutImage}
                    />
                </Box>

                <Box className={styles.textContent}>
                    <Typography paragraph className={styles.paragraph}>
                        Bienvenida a J&R Essentials, el espacio donde creemos que los accesorios no son solo un complemento, sino el detalle que te da la confianza para ser la protagonista de tu historia.
                    </Typography>

                    <Typography paragraph className={styles.paragraph}>
                        Nacimos de una idea simple pero poderosa, la elegancia no tiene por qué ser aburrida, y la moda juvenil también puede ser sofisticada. Entendemos que un buen par de aretes tiene el poder de transformar no solo un outfit, sino tu actitud.
                    </Typography>

                    <Typography paragraph className={styles.paragraph}>
                        En J&R Essentials tenemos piezas pensadas para la mujer multifacética de hoy. La que busca ese toque "chunky y glam" para destacar en una noche de fiesta, pero también esa delicadeza dorada de un "Golden Garden" para iluminar su día a día.
                    </Typography>

                    <Typography paragraph className={styles.paragraph}>
                        Nuestra misión va más allá de vender aretes. Queremos acompañarte en cada paso. Como reza nuestro lema, queremos que uses nuestras piezas y sientas la seguridad de brillar sin pedir permiso.
                    </Typography>

                    <Typography paragraph className={styles.paragraph}>
                        Gracias por ser parte de este viaje brillante.
                    </Typography>

                    <Typography paragraph className={styles.paragraph} sx={{ fontWeight: 'bold' }}>
                        Con amor, El equipo de J&R.
                    </Typography>

                    <Typography variant="h4" component="h2" className={styles.subtitle}>
                        3 Razones para amarnos
                    </Typography>

                    <Box className={styles.features}>
                        <Typography paragraph className={styles.feature}>
                            <strong>Estilo que roba miradas:</strong> Ya sean nuestros corazones puffy o los diseños florales, nuestras piezas son conversation starters. Prepárate para que te pregunten: "¿Dónde compraste tus aretes?".
                        </Typography>
                        <Typography paragraph className={styles.feature}>
                            <strong>Lujo Accesible:</strong> Creemos que brillar no debería costar una fortuna. Te ofrecemos esa estética high-end y dorada a precios que te permiten estrenar seguido.
                        </Typography>
                        <Typography paragraph className={styles.feature}>
                            <strong>Tu brillo es nuestra prioridad:</strong> Desde que entras a la web hasta que abres tu paquete, cuidamos cada detalle para que tu experiencia sea tan brillante como tus nuevos accesorios.
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default About;