// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBF1A2T0V0uyeXWfYdtftjuhQxxbq4OPoU",
  authDomain: "pickleball-tournament-platform.firebaseapp.com",
  projectId: "pickleball-tournament-platform",
  storageBucket: "pickleball-tournament-platform.firebasestorage.app",
  messagingSenderId: "259616192729",
  appId: "1:259616192729:web:09c8bb380009e3982466c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;