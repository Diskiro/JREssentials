import React, { useState, useEffect } from 'react';
import { Box, IconButton, CircularProgress } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

const ProductImageCarousel = ({ product, selectedVariant }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState({});

    const currentImages = product ? (selectedVariant ? (selectedVariant.images?.length > 0 ? selectedVariant.images : product.images) : product.images) : [];

    // Reset index when variant changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [selectedVariant]);

    // Image preloading logic
    useEffect(() => {
        if (!product) return;

        const allImages = [...(product.images || [])];
        if (product.variants) {
            product.variants.forEach(v => {
                if (v.images) allImages.push(...v.images);
            });
        }

        if (allImages.length > 0) {
            allImages.forEach((imageUrl) => {
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [imageUrl]: true }));
                };
            });
        }
    }, [product]);

    const handlePreviousImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === currentImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    if (!product || currentImages.length === 0) return null;

    return (
        <Box className="product-image" sx={{
            width: '100%',
            maxWidth: '600px',
            position: 'relative',
            '@media (min-width: 769px)': {
                aspectRatio: '3/4',
                overflow: 'hidden'
            }
        }}>
            {!loadedImages[currentImages[currentImageIndex]] && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.8)'
                }}>
                    <CircularProgress />
                </Box>
            )}
            <img
                src={currentImages[currentImageIndex]}
                alt={product.name}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: loadedImages[currentImages[currentImageIndex]] ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                }} />

            {currentImages.length > 1 && (
                <>
                    <IconButton
                        onClick={handlePreviousImage}
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)'
                            }
                        }}
                    >
                        <ArrowBackIos />
                    </IconButton>
                    <IconButton
                        onClick={handleNextImage}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)'
                            }
                        }}
                    >
                        <ArrowForwardIos />
                    </IconButton>
                    <Box sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1
                    }}>
                        {currentImages.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: index === currentImageIndex ? 'primary.main' : 'grey.300',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setCurrentImageIndex(index)}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
};

export default ProductImageCarousel;
