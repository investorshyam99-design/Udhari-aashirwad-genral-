import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "integral-truck-8vvcq",
  appId: "1:776860378952:web:1ed4b5fd3c41615fc8f57d",
  apiKey: "AIzaSyBNqqCqefnAXD7jshCjiTZXku2mJ19h7CM",
  authDomain: "integral-truck-8vvcq.firebaseapp.com",
  storageBucket: "integral-truck-8vvcq.firebasestorage.app",
  messagingSenderId: "776860378952",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-5f24b056-e66d-45d5-9cbc-c7c3dd1a45a7");
export const auth = getAuth(app);
