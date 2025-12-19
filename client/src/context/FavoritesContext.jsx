import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Cargar favoritos cuando el usuario inicia sesión
    useEffect(() => {
        const loadFavorites = async () => {
            setLoading(true);
            try {
                if (user?.uid) {
                    const userDoc = await getDoc(doc(db, 'storeUsers', user.uid));
                    if (userDoc.exists()) {
                        setFavorites(userDoc.data().favorites || []);
                    }
                } else {
                    setFavorites([]);
                }
            } catch (error) {
                console.error('Error al cargar favoritos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user]);

    const addToFavorites = async (product, variant = null) => {
        if (!user) {
            throw new Error('Debes iniciar sesión para agregar a favoritos');
        }

        try {
            const itemToSave = variant ? { ...product, selectedVariant: variant } : product;

            const userRef = doc(db, 'storeUsers', user.uid);
            await updateDoc(userRef, {
                favorites: arrayUnion(itemToSave)
            });
            setFavorites(prev => [...prev, itemToSave]);
            return true;
        } catch (error) {
            console.error('Error al agregar a favoritos:', error);
            throw new Error('Error al agregar a favoritos');
        }
    };

    const removeFromFavorites = async (product, variant = null) => {
        if (!user) {
            throw new Error('Debes iniciar sesión para eliminar de favoritos');
        }

        try {
            // Find the exact object to remove from the local state to ensure arrayRemove works
            // or we use filtering on local state logic if arrayRemove fails with constructed objects.
            // Actually, for arrayRemove to work, we need ensuring exact object match or use a different removal strategy (read-modify-write).
            // Since we store objects, let's find the one in our list that matches IDs.

            const itemToRemove = favorites.find(fav => {
                if (variant) {
                    return fav.id === product.id && fav.selectedVariant?.id === variant.id;
                }
                return fav.id === product.id && !fav.selectedVariant;
            });

            if (!itemToRemove) {
                // Fallback: try removing strictly passed product if logic above fails
                // but typically we should rely on found item.
                console.warn("Item to remove not found in local favorites");
                return false;
            }

            const userRef = doc(db, 'storeUsers', user.uid);
            await updateDoc(userRef, {
                favorites: arrayRemove(itemToRemove)
            });

            setFavorites(prev => prev.filter(fav => fav !== itemToRemove));
            return true;
        } catch (error) {
            console.error('Error al eliminar de favoritos:', error);
            throw new Error('Error al eliminar de favoritos');
        }
    };

    const isFavorite = (productId, variantId = null) => {
        return favorites.some(fav => {
            if (variantId) {
                return fav.id === productId && fav.selectedVariant?.id === variantId;
            }
            // If checking generic product, return true if ANY version is favorite?
            // Or only if the base product is favorite?
            // Usually if I'm on a product page, I want to know if THIS configuration is favorited.
            // But if no variant selected (e.g. card view), maybe just check ID.
            return fav.id === productId && !fav.selectedVariant;
        });
    };

    const value = {
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        isFavorite
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}; 