import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        // Validamos explícitamente el HOME para asegurar que siempre vaya al inicio
        // Usamos setTimeout para asegurar que se ejecute después del renderizado y restauración del navegador
        if (pathname === '/') {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 0);
            return;
        }

        const isCategoryPage = pathname.startsWith('/catalogo') || pathname.startsWith('/categorias');
        const isPopState = navigationType === 'POP';

        // Si NO es una página de categorías/catálogo, SIEMPRE scrollear arriba (incluso si es Back)
        if (!isCategoryPage) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 0);
            return;
        }

        // Si ES una página de categorías:
        // Solo scrollear arriba si NO es una acción de "Regresar" (POP)
        // Si es POP, dejamos que el navegador restaure la posición
        if (!isPopState) {
            window.scrollTo(0, 0);
        }
    }, [pathname, navigationType]);

    return null;
};

export default ScrollToTop;
