import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.warn('Push notifications not supported on web');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  // Register token with Supabase
  const { error } = await supabase.from('device_tokens').upsert({
    token: pushToken,
    user_id: userId,
    role: 'resident',
    device_type: Platform.OS === 'ios' ? 'ios' : 'android',
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'token' });

  if (error) {
    console.error('Error registering push token:', error);
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('intercom', {
      name: 'Citófono',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }

  return pushToken;
}

export function addNotificationListener(
  onReceive: (notification: Notifications.Notification) => void,
  onTap: (response: Notifications.NotificationResponse) => void
) {
  const receiveSub = Notifications.addNotificationReceivedListener(onReceive);
  const tapSub = Notifications.addNotificationResponseReceivedListener(onTap);

  return () => {
    receiveSub.remove();
    tapSub.remove();
  };
}
