import { useState, useCallback, useEffect } from 'react';
import { useAuth as useAuthContext } from '../AuthContext';
import { loginService, registerService, logoutService, saveUserToLocalStorage, sendPasswordResetEmailService } from './authService';
import { useInactivity } from './inactivity/useInactivity';
import { updateLastActivity } from './inactivity/inactivityService';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
    const { user, setUser, alert, setAlert, closeAlert } = useAuthContext();
    const [loading, setLoading] = useState(true); // Inicialmente true para verificar estado

    // Escuchar cambios en el estado de autenticación de Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Usuario autenticado en Firebase, obtener datos de Firestore
                    const userDoc = await getDoc(doc(db, 'storeUsers', firebaseUser.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const fullUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            phone: userData.phone,
                            metroStation: userData.metroStation,
                            role: userData.role
                        };
                        setUser(fullUser);
                        saveUserToLocalStorage(fullUser);
                    } else {
                        // Fallback si no hay datos en Firestore
                        const partialUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'customer'
                        };
                        setUser(partialUser);
                        saveUserToLocalStorage(partialUser);
                    }
                } else {
                    // Usuario no autenticado
                    setUser(null);
                    saveUserToLocalStorage(null);
                }
            } catch (error) {
                console.error('Error al sincronizar estado de auth:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [setUser]);

    const handleLogout = useCallback(async () => {
        try {
            await logoutService();
            // El listener onAuthStateChanged se encargará de limpiar el estado
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
    }, [setAlert]);

    // Inicializar el monitoreo de inactividad
    const { handleActivity } = useInactivity(user, handleLogout);

    const login = useCallback(async (email, password) => {
        try {
            setLoading(true);
            const userData = await loginService(email, password);

            // Reiniciar el contador de inactividad al iniciar sesión
            updateLastActivity();

            // El estado se actualizará vía onAuthStateChanged, pero podemos setearlo aquí para feedback inmediato si es necesario
            // setUser(userData); 
            setAlert({
                open: true,
                message: 'Inicio de sesión exitoso',
                severity: 'success'
            });
            return userData;
        } catch (error) {
            setAlert({
                open: true,
                message: error.message,
                severity: 'error'
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [setAlert]);

    const register = useCallback(async (userData) => {
        try {
            setLoading(true);
            const newUser = await registerService(userData);

            // Reiniciar el contador de inactividad al registrarse
            updateLastActivity();

            // El estado se actualizará vía onAuthStateChanged
            setAlert({
                open: true,
                message: 'Registro exitoso',
                severity: 'success'
            });
            return newUser;
        } catch (error) {
            setAlert({
                open: true,
                message: error.message,
                severity: 'error'
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [setAlert]);

    const resetPassword = useCallback(async (email) => {
        try {
            setLoading(true);
            await sendPasswordResetEmailService(email);
            setAlert({
                open: true,
                message: 'Correo de recuperación enviado. Revisa tu bandeja de entrada.',
                severity: 'success'
            });
            return true;
        } catch (error) {
            let errorMessage = 'Error al enviar el correo de recuperación.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No existe una cuenta con este correo electrónico.';
            }
            setAlert({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [setAlert]);

    return {
        user,
        loading,
        login,
        register,
        logout: handleLogout,
        resetPassword,
        alert,
        setAlert,
        closeAlert,
        handleActivity
    };
};