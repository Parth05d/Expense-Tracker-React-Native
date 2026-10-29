import { Platform } from 'react-native';
import { Reminder } from '../types';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  // Graceful fallback if package is pending installation
}

/**
 * Request system push notification permissions (iOS & Android)
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance?.MAX || 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Send an immediate local push notification (e.g. for Shared/Split Bill activity)
 */
export const sendInstantPushNotification = async (title: string, body: string, data?: any): Promise<void> => {
  if (!Notifications) {
    console.warn('[NotificationService] expo-notifications module not loaded');
    return;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance?.MAX || 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
        data: data || {},
      },
      trigger: null, // Null trigger fires immediately
    });
    console.log('[NotificationService] Instant notification dispatched:', title);
  } catch (error) {
    console.warn('Failed to send instant notification:', error);
  }
};

/**
 * Schedule a device push notification alert for a financial reminder at 9:00 AM on due date
 */
export const scheduleReminderNotification = async (reminder: Reminder): Promise<string | null> => {
  if (!Notifications || reminder.isCompleted) return null;

  try {
    const dueDate = new Date(reminder.dueDate);
    dueDate.setHours(9, 0, 0, 0); // Trigger alert at 9:00 AM

    const now = new Date();
    if (dueDate.getTime() <= now.getTime()) {
      return null;
    }

    const isReceivable = reminder.type === 'money_receivable';
    const title = isReceivable ? `💰 Payment Receivable: ${reminder.title}` : `⏰ Bill / Due Alert: ${reminder.title}`;
    const body = reminder.amount > 0 
      ? `Reminder: ${reminder.title} (${reminder.amount}) is due today!` 
      : `Reminder: ${reminder.title} is due today!`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
        data: { reminderId: reminder.id },
      },
      trigger: {
        date: dueDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled reminder notification
 */
export const cancelReminderNotification = async (notificationId?: string): Promise<void> => {
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
};
