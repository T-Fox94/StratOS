import { useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform() || !user) {
      return;
    }

    const initializePush = async () => {
      // 1. Request permissions
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('User denied push notification permissions');
        return;
      }

      // 2. Register with FCM
      await PushNotifications.register();

      // 3. Listen for successful registration
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        // Save the token to Firestore linked to the user
        try {
          await setDoc(doc(db, 'fcm_tokens', user.uid), {
            token: token.value,
            platform: Capacitor.getPlatform(),
            updatedAt: serverTimestamp(),
            email: user.email
          }, { merge: true });
          console.log('FCM Token saved to Firestore for user:', user.uid);
        } catch (error) {
          console.error('Error saving FCM token to Firestore:', error);
        }
      });

      // 4. Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ' + JSON.stringify(error));
      });

      // 5. Listen for incoming notifications (foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        // You could trigger a toast or update local state here if needed
      });

      // 6. Listen for notification actions (user clicked on the notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
        // Navigate or take action based on notification data
        // For example, if there's a deep link or view name in the data:
        // const { view } = notification.notification.data;
        // if (view) { ... }
      });
    };

    initializePush();

    // Clean up listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
};
