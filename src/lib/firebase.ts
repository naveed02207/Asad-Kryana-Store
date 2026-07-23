import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "reflected-object-w7c1c",
  appId: "1:893735753554:web:b4c0dcfaf6aceed43a0c8b",
  apiKey: "AIzaSyBA46RqEUMQukl1G7ZbSw7yOb-mJtS5V4k",
  authDomain: "reflected-object-w7c1c.firebaseapp.com",
  storageBucket: "reflected-object-w7c1c.firebasestorage.app",
  messagingSenderId: "893735753554",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-8808b7e3-822f-48b9-bf74-3c3839fa926d");
