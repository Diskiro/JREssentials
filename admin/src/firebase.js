import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCbIKY7PSCf4LMrQXfFbLxiOEycR9KrEjY",
    authDomain: "jr-essentials.firebaseapp.com",
    projectId: "jr-essentials",
    storageBucket: "jr-essentials.firebasestorage.app",
    messagingSenderId: "664841148086",
    appId: "1:664841148086:web:701b3776e0a2965b5cb817",
    measurementId: "G-Y200X4326T"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
