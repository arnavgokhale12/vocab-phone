/**
 * Web stub for NotificationService.
 * Local push notifications are not supported on web.
 */

interface NotificationContent {
  title: string;
  body: string;
}

export async function requestPermission(): Promise<boolean> {
  return false;
}

export async function hasPermission(): Promise<boolean> {
  return false;
}

export function getNotificationContent(
  _streak: number,
  _completedToday: boolean
): NotificationContent | null {
  return null;
}

export async function scheduleDailyReminder(): Promise<void> {
  // no-op on web
}

export async function cancelAllNotifications(): Promise<void> {
  // no-op on web
}

export async function getScheduledNotifications(): Promise<[]> {
  return [];
}
