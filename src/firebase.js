// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-RKjUJQwy3Opvrl6bIOofP86lsTP4yqg",
  authDomain: "projecttest-4ee6a.firebaseapp.com",
  projectId: "projecttest-4ee6a",
  storageBucket: "projecttest-4ee6a.firebasestorage.app",
  messagingSenderId: "84487569641",
  appId: "1:84487569641:web:1b1c589ebf29cd14757078",
  measurementId: "G-RN49PLHWT2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
