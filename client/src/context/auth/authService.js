import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';

export const loginService = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'storeUsers', user.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
                uid: user.uid,
                email: user.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                metroStation: userData.metroStation,
                role: userData.role
            };
        } else {
            // Si el usuario existe en Auth pero no en Firestore (caso raro o nuevo)
            return {
                uid: user.uid,
                email: user.email,
                role: 'customer'
            };
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
};

export const registerService = async (userData) => {
    try {
        const { email, password, firstName, lastName, phone, metroStation } = userData;

        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newUser = {
            email,
            firstName,
            lastName,
            phone,
            metroStation,
            createdAt: new Date().toISOString(),
            role: 'customer'
        };

        // Guardar datos adicionales en Firestore usando el UID de Auth
        await setDoc(doc(db, 'storeUsers', user.uid), newUser);

        return {
            uid: user.uid,
            ...newUser
        };
    } catch (error) {
        console.error('Error al registrar:', error);
        throw error;
    }
};

export const logoutService = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        throw error;
    }
};

export const sendPasswordResetEmailService = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        throw error;
    }
};

// Ya no necesitamos guardar manualmente en localStorage para la persistencia de sesión básica,
// pero podríamos querer guardar el perfil del usuario para acceso rápido.
export const saveUserToLocalStorage = (userData) => {
    if (userData) {
        localStorage.setItem('user_profile', JSON.stringify(userData));
    } else {
        localStorage.removeItem('user_profile');
    }
};

export const loadUserFromLocalStorage = () => {
    const storedUser = localStorage.getItem('user_profile');
    return storedUser ? JSON.parse(storedUser) : null;
};