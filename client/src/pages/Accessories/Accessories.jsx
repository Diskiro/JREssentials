import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import styles from '../../styles/Accessories.module.css';

const Accessories = () => {
    return (
        <Container maxWidth="lg" className={styles.container}>
            <Paper elevation={0} className={styles.content}>
                <Box className={styles.imageContainer}>
                    <img
                        src="/CharysBoutique.jpeg"
                        alt="J&R Essentials"
                        className={styles.logo}
                    />
                </Box>

                <Typography variant="h2" component="h1" className={styles.mainTitle}>
                    PRÓXIMAMENTE
                </Typography>

                <Typography variant="h4" component="h2" className={styles.subtitle}>
                    ¡ESPÉRALO!
                </Typography>

                <Typography variant="body1" className={styles.description}>
                    Estamos preparando una increíble colección de accesorios para complementar tu estilo.
                </Typography>
            </Paper>
        </Container>
    );
};

export default Accessories; 