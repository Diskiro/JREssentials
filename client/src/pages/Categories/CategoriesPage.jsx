import { useState, useEffect } from 'react';
import { Container, Grid, Typography } from '@mui/material';
import CategoryCard from '../../components/CategoryCard/CategoryCard';
import { fetchCategories } from '../../data';
import styles from '../../styles/CategoriesPage.module.css';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const categoriesData = await fetchCategories();
                setCategories(categoriesData);
                setLoading(false);
            } catch (err) {
                setError('Error al cargar las categorías');
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>{error}</div>;

    return (
        <Container maxWidth="xl" className={styles.categoriesContainer}>
            <Typography variant="h4" className={styles.sectionTitle}>
                Todas las categorías
            </Typography>
            <Grid container spacing={3} className={styles.categoriesGrid}>
                {categories.map(category => (
                    <Grid item xs={12} sm={6} md={4} key={category.id} className={styles.categoryItem}>
                        <CategoryCard category={category} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
} 