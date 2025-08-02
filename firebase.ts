import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeGeD6Y5YpQsOcu0U1N4_50VcU_c9nTRg",
  authDomain: "fir-88d06.firebaseapp.com",
  databaseURL: "https://fir-88d06-default-rtdb.firebaseio.com",
  projectId: "fir-88d06",
  storageBucket: "fir-88d06.firebasestorage.app",
  messagingSenderId: "79770688808",
  appId: "1:79770688808:web:093a38f7f1d3d76987841d"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { app, messaging };
