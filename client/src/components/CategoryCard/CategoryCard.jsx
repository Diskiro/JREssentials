import { Card, CardActionArea, CardMedia, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CategoryCard({ category }) {
    const navigate = useNavigate();

    const handleCategoryClick = () => {
        const categoryName = category?.name?.toLowerCase() || 'sin-categoria';
        // Navegar a la categoría, asegurando que siempre estemos en la página 1
        navigate(`/catalogo?category=${categoryName}&page=1`, { replace: false });
    };

    return (
        <Card sx={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
            }
        }}>
            <CardActionArea onClick={handleCategoryClick}>
                {/* Imagen de la categoría */}
                <CardMedia
                    component="img"
                    image={category.image}
                    alt={category.name}
                    sx={{
                        height: 200,
                        objectFit: 'cover',
                        filter: 'brightness(0.9)'
                    }}
                />

                {/* Overlay para mejor legibilidad */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
                }} />

                {/* Contenido de la tarjeta */}
                <CardContent sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    color: 'white',
                    zIndex: 1
                }}>
                    <Typography variant="h5" component="h3" sx={{
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {category.name}
                    </Typography>

                    <Typography variant="body2" sx={{
                        mt: 1,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        opacity: 0.9
                    }}>
                        {category.productCount || 'Nuevos productos'} disponibles
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}