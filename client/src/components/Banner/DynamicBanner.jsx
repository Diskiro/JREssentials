import React, { useState, useEffect } from 'react';
import { Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/DynamicBanner.css';


const DynamicBanner = () => {
    const [banners, setBanners] = useState([]);
    const [activeStep, setActiveStep] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:768px)');

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const q = query(
                    collection(db, 'banners'),
                    where('active', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const bannersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => (a.order || 0) - (b.order || 0));
                setBanners(bannersData);
            } catch (error) {
                console.error('Error fetching banners:', error);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            const timer = setInterval(() => {
                handleNext();
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [activeStep, banners.length]);

    const handleNext = () => {
        setActiveStep((prevStep) => (prevStep + 1) % banners.length);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => (prevStep - 1 + banners.length) % banners.length);
    };

    if (banners.length === 0) return null;

    return (
        <Box className="dynamic-banner-container">
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`banner-slide ${index === activeStep ? 'active' : ''}`}
                    style={{
                        backgroundImage: `url(${isMobile && banner.mobileImageUrl ? banner.mobileImageUrl : banner.imageUrl})`
                    }}
                >

                </div>
            ))}

            {banners.length > 1 && (
                <>
                    <IconButton
                        className="banner-nav-btn prev"
                        onClick={handleBack}
                        aria-label="Anterior"
                    >
                        <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton
                        className="banner-nav-btn next"
                        onClick={handleNext}
                        aria-label="Siguiente"
                    >
                        <KeyboardArrowRight />
                    </IconButton>

                    <div className="banner-indicators">
                        {banners.map((_, index) => (
                            <div
                                key={index}
                                className={`indicator ${index === activeStep ? 'active' : ''}`}
                                onClick={() => setActiveStep(index)}
                            />
                        ))}
                    </div>
                </>
            )}
        </Box>
    );
};

export default DynamicBanner;
