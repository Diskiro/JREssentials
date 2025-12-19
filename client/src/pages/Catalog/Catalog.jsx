import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Grid, Typography, Box, CircularProgress, Button, Pagination } from '@mui/material';
import ProductCard from '../../components/ProductCard/ProductCard';
import CategoryCard from '../../components/CategoryCard/CategoryCard';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { normalizeCategoryName } from '../../utils/categoryUtils';
import { formatPrice } from '../../utils/priceUtils';
import styles from '../../styles/Catalog.module.css';
import { FavoritesProvider } from '../../context/FavoritesContext';

export default function CatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const productsPerPage = 12;

    const page = parseInt(searchParams.get('page')) || 1;
    const category = searchParams.get('category');

    // Restaurar la posición del scroll cuando se cargan los productos
    useEffect(() => {
        if (!loading && products.length > 0) {
            const savedPosition = parseInt(localStorage.getItem(`scroll_position_${category}`)) || 0;

            if (savedPosition > 0) {
                setTimeout(() => {
                    window.scrollTo({
                        top: savedPosition,
                        behavior: 'instant'
                    });
                    // Limpiar la posición después de restaurarla para que no afecte la navegación normal
                    localStorage.removeItem(`scroll_position_${category}`);
                }, 100);
            }
        }
    }, [loading, products, category]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                if (!category) {
                    // Si no hay categoría, cargar todas las categorías
                    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
                    const categoriesSnapshot = await getDocs(q);
                    const categoriesList = categoriesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setCategories(categoriesList);
                    setProducts([]);
                    return;
                }

                // Si hay categoría, cargar productos de esa categoría
                const normalizedCategory = normalizeCategoryName(category);
                const productsQuery = query(
                    collection(db, 'products'),
                    where('category', '==', normalizedCategory)
                );

                const querySnapshot = await getDocs(productsQuery);
                const productsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    formattedPrice: formatPrice(doc.data().price)
                }));

                // Filtrar productos que tienen al menos una talla con stock (ya sea en inventario principal o variantes)
                const productsWithStock = productsList.filter(product => {
                    // Check simple inventory
                    let hasSimpleStock = false;
                    if (product.inventory) {
                        const totalStock = Object.values(product.inventory).reduce((sum, stock) => sum + stock, 0);
                        if (totalStock > 0) hasSimpleStock = true;
                    }

                    // Check variants inventory
                    let hasVariantStock = false;
                    if (product.variants && Array.isArray(product.variants)) {
                        for (const variant of product.variants) {
                            if (variant.inventory) {
                                const totalVariantStock = Object.values(variant.inventory).reduce((sum, stock) => sum + stock, 0);
                                if (totalVariantStock > 0) {
                                    hasVariantStock = true;
                                    break;
                                }
                            }
                        }
                    }

                    return hasSimpleStock || hasVariantStock;
                });

                setProducts(productsWithStock);

            } catch (error) {
                console.error('Error al obtener los datos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchParams, category]);

    // Calcular los productos para la página actual
    const indexOfLastProduct = page * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / productsPerPage);

    const handlePageChange = (event, value) => {
        setSearchParams({ category, page: value.toString() }, { replace: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleProductClick = () => {
        localStorage.setItem(`scroll_position_${category}`, window.scrollY.toString());
    };

    if (loading) {
        return (
            <Box className={styles.loadingContainer}>
                <CircularProgress />
            </Box>
        );
    }

    // Si no hay categoría seleccionada, mostrar todas las categorías
    if (!category) {
        return (
            <FavoritesProvider>
                <Container maxWidth="xl" className={styles.catalogContainer}>
                    <Typography variant="h3" className={styles.catalogTitle}>
                        Categorías
                    </Typography>
                    <Grid container spacing={3} className={styles.categoriesGrid}>
                        {categories.map(category => (
                            <Grid item xs={12} sm={6} md={4} key={category.id} className={styles.categoryItem}>
                                <CategoryCard category={category} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </FavoritesProvider>
        );
    }

    // Si hay categoría seleccionada, mostrar productos
    return (
        <FavoritesProvider>
            <Container maxWidth="xl" className={styles.catalogContainer}>
                <Typography variant="h3" className={styles.catalogTitle}>
                    {normalizeCategoryName(category)}
                </Typography>

                <Grid container spacing={3} className={styles.productsGrid}>
                    {currentProducts.length > 0 ? (
                        currentProducts.map(product => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id} className={styles.productItem}>
                                <div onClick={handleProductClick} style={{ height: '100%' }}>
                                    <ProductCard product={product} />
                                </div>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography variant="body1" className={styles.noProductsMessage}>
                                No hay productos disponibles en esta categoría
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Container>
        </FavoritesProvider>
    );
}