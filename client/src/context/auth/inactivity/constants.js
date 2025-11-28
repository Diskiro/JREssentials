export const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos antes de iniciar monitoreo
export const CHECK_INTERVAL = 1 * 60 * 1000; // 1 minuto de monitoreo
export const ACTIVITY_EVENTS = ['click']; // Solo monitorear clicks

// Elementos interactivos que se monitorean
export const INTERACTIVE_ELEMENTS = {
    BUTTON: 'button',
    LINK: 'a',
    INPUT: 'input'
};

export const LOG_MESSAGES = {
    AUTH_START: '🔐 Usuario autenticado - Iniciando monitoreo de inactividad',
    MONITORING_START: '⏱️ Iniciando monitoreo de actividad (1 minuto)',
    ACTIVITY_DETECTED: '🔄 Actividad detectada en elemento interactivo:',
    NO_ACTIVITY: '⚠️ No se detectó actividad en el período de monitoreo',
    CLEARING_CART: '🛒 Limpiando carrito por inactividad',
    LOGGING_OUT: '🚪 Cerrando sesión por inactividad',
    MONITORING_END: '✅ Monitoreo finalizado'
}; 