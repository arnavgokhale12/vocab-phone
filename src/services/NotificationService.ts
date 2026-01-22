/**
 * NotificationService - Handles local push notifications for streak reminders.
 *
 * Uses expo-notifications for scheduling daily reminders.
 * Notification content varies based on streak state.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  getNotificationSettings,
  setNotificationsEnabled,
} from './storage/mmkvStorage';
import { getStats } from './storage/mmkvStorage';

// Configure notification handler (show notifications even when app is foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestPermission(): Promise<boolean> {
  // Notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Notifications require a physical device');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9966FF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  return true;
}

/**
 * Check if notification permissions are granted.
 */
export async function hasPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

interface NotificationContent {
  title: string;
  body: string;
}

/**
 * Get notification content based on streak state.
 * Returns null if user has already completed today's goal.
 */
export function getNotificationContent(
  streak: number,
  completedToday: boolean
): NotificationContent | null {
  if (completedToday) {
    return null; // Don't notify if already done
  }

  if (streak > 0) {
    return {
      title: "Don't break your streak! 🔥",
      body: `Keep your ${streak}-day streak alive. Just a few words today.`,
    };
  }

  return {
    title: 'Ready for today\'s words? 📚',
    body: 'Start building your vocabulary streak today.',
  };
}

/**
 * Schedule daily reminder notification based on streak state.
 * Cancels existing notifications and schedules a new one.
 */
export async function scheduleDailyReminder(): Promise<void> {
  // Always cancel existing notifications first
  await cancelAllNotifications();

  const settings = getNotificationSettings();
  if (!settings.enabled) {
    return;
  }

  // Check if we have permission
  const permitted = await hasPermission();
  if (!permitted) {
    // Disable notifications if permission was revoked
    setNotificationsEnabled(false);
    return;
  }

  const stats = getStats();
  const content = getNotificationContent(stats.currentStreak, stats.todayGoalMet);

  if (!content) {
    // User already completed today, no notification needed
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
      },
    });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

/**
 * Get all currently scheduled notifications (for debugging).
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
