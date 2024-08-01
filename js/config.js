import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyqYSgE4lza8qMRAgA4QD_ktre6t9BnQc",
  authDomain: "murmurwebsite.firebaseapp.com",
  projectId: "murmurwebsite",
  storageBucket: "murmurwebsite.appspot.com",
  messagingSenderId: "499595493997",
  appId: "1:499595493997:web:5295c99c3e07d9f7dd7564",
  measurementId: "G-P59KESGR07"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);