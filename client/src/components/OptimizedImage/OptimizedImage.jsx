import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';

const imageCache = new Map();

const OptimizedImage = ({ src, alt, className, style, onClick, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        setLoading(true);
        setError(false);

        if (!src) {
            setLoading(false);
            setError(true);
            return;
        }

        // Check cache first
        if (imageCache.has(src)) {
            setImageSrc(imageCache.get(src));
            setLoading(false);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Crucial for Canvas manipulation of external images
        img.src = src;

        img.onload = () => {
            if (!mountedRef.current) return;

            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Convert to WebP
                const webpDataUrl = canvas.toDataURL('image/webp', 0.8);

                // Store in cache
                imageCache.set(src, webpDataUrl);

                setImageSrc(webpDataUrl);
                setLoading(false);
            } catch (err) {
                console.warn('WebP conversion failed, falling back to original image:', err);
                // Fallback to original if canvas fails (e.g., CORS issues)
                setImageSrc(src);
                setLoading(false);
            }
        };

        img.onerror = () => {
            if (!mountedRef.current) return;
            console.error('Error loading image:', src);
            setError(true);
            setLoading(false);
        };

        return () => {
            mountedRef.current = false;
        };
    }, [src]);

    if (loading) {
        return (
            <Skeleton
                variant="rectangular"
                animation="wave"
                className={className}
                style={{ ...style, width: '100%', height: '100%' }}
            />
        );
    }

    if (error) {
        return (
            <Box
                className={className}
                style={{
                    ...style,
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                }}
            >
                Error
            </Box>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
            onClick={onClick}
            {...props}
        />
    );
};

export default OptimizedImage;
