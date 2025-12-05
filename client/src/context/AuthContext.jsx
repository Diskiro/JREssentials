import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadUserFromLocalStorage, saveUserToLocalStorage, logoutService } from './auth/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
    const [cart, setCart] = useState([]);

    // Cargar el usuario del localStorage al iniciar
    useEffect(() => {
        const storedUser = loadUserFromLocalStorage();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    // Cargar el carrito del localStorage al iniciar
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }
    }, []);

    // Guardar el carrito en localStorage cuando cambia
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart]);

    const logout = async () => {
        try {
            await logoutService();
            setUser(null);
            saveUserToLocalStorage(null);
            localStorage.removeItem('cart');
            setCart([]);
            setAlert({
                open: true,
                message: 'Sesión cerrada correctamente',
                severity: 'success'
            });
        } catch (error) {
            setAlert({
                open: true,
                message: 'Error al cerrar sesión',
                severity: 'error'
            });
        }
    };

    const closeAlert = () => {
        setAlert({ ...alert, open: false });
    };

    const value = {
        user,
        setUser,
        loading,
        cart,
        setCart,
        alert,
        setAlert,
        closeAlert,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 