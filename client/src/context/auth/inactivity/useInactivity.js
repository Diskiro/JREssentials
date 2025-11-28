import { useState, useRef, useEffect, useCallback } from 'react';
import { CHECK_INTERVAL, ACTIVITY_EVENTS, INTERACTIVE_ELEMENTS, INACTIVITY_TIMEOUT } from './constants';
import { updateLastActivity, checkInactivity } from './inactivityService';
import { useCart } from '../../../context/CartContext';

export const useInactivity = (user, onLogout) => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const monitoringIntervalRef = useRef(null);
    const { clearCartForInactivity: clearCartForInactivityContext } = useCart();

    const handleInactivity = useCallback(async () => {
        try {
            // Limpiar el carrito
            console.log('🧹 Limpiando carrito por inactividad...');
            await clearCartForInactivityContext();

            // Cerrar la sesión
            console.log('🔒 Cerrando sesión por inactividad...');
            await onLogout();
            console.log('✅ Sesión cerrada exitosamente');
        } catch (error) {
            console.error('❌ Error durante el proceso de inactividad:', error);
        }
    }, [clearCartForInactivityContext, onLogout]);

    const handleActivity = useCallback(() => {
        if (user) {
            const now = updateLastActivity();
            setLastActivity(now);
        }
    }, [user]);

    const isInteractiveElement = useCallback((element) => {
        if (!element) return false;

        const tagName = element.tagName?.toLowerCase();
        if (!tagName) return false;

        // Verificar si el elemento es interactivo
        if (tagName === INTERACTIVE_ELEMENTS.BUTTON ||
            tagName === INTERACTIVE_ELEMENTS.LINK ||
            tagName === INTERACTIVE_ELEMENTS.INPUT) {
            return true;
        }

        // Verificar si el elemento tiene un padre interactivo
        let parent = element.parentElement;
        while (parent) {
            const parentTagName = parent.tagName?.toLowerCase();
            if (parentTagName === INTERACTIVE_ELEMENTS.BUTTON ||
                parentTagName === INTERACTIVE_ELEMENTS.LINK ||
                parentTagName === INTERACTIVE_ELEMENTS.INPUT) {
                return true;
            }
            parent = parent.parentElement;
        }

        return false;
    }, []);

    // Interceptor para peticiones fetch
    useEffect(() => {
        if (!user) return;

        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            handleActivity();
            return originalFetch(...args);
        };

        // Interceptor para XHR (si se usa axios u otros)
        const originalXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function (...args) {
            handleActivity();
            return originalXHR.apply(this, args);
        };

        return () => {
            window.fetch = originalFetch;
            window.XMLHttpRequest.prototype.open = originalXHR;
        };
    }, [user, handleActivity]);

    // Monitoreo de eventos de usuario
    useEffect(() => {
        if (!user) return;

        const onUserActivity = (event) => {
            // Si es un evento de click, verificar si es un elemento interactivo
            if (event.type === 'click') {
                if (isInteractiveElement(event.target)) {
                    // console.log('✅ Actividad válida detectada:', event.target.tagName);
                    handleActivity();
                }
            } else {
                // Para otros eventos (si los hubiera en el futuro), registrar actividad
                handleActivity();
            }
        };

        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, onUserActivity);
        });

        // Verificar inactividad inmediatamente al montar/recargar
        checkInactivity(lastActivity, user, handleInactivity);

        // Intervalo para verificar inactividad periódicamente
        monitoringIntervalRef.current = setInterval(async () => {
            const shouldLogout = await checkInactivity(lastActivity, user, handleInactivity);
            if (shouldLogout) {
                clearInterval(monitoringIntervalRef.current);
            }
        }, CHECK_INTERVAL);

        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, onUserActivity);
            });
            if (monitoringIntervalRef.current) {
                clearInterval(monitoringIntervalRef.current);
            }
        };
    }, [user, lastActivity, handleActivity, handleInactivity, isInteractiveElement]);

    return { handleActivity };
};