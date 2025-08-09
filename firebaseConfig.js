// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhwTITlR5Nv6FKoyQqoO1WEXIIhEgnu-U",
  authDomain: "qwickfix-585ce.firebaseapp.com",
  projectId: "qwickfix-585ce",
  storageBucket: "qwickfix-585ce.firebasestorage.app",
  messagingSenderId: "36596000737",
  appId: "1:36596000737:web:d624ad9e514a102ae2d4a0",
  measurementId: "G-4PHJZYRSTH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);