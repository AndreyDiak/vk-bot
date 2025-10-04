import { supabase } from '../config/database.js';
import { UserService } from './userService.js';

export class NotificationService {
  // Отправить уведомление всем активным пользователям
  static async broadcastToAllUsers(message, title = 'Уведомление') {
    try {
      const users = await UserService.getAllActiveUsers();
      const results = [];

      for (const user of users) {
        try {
          // Здесь будет вызов VK API для отправки сообщения
          // Пока просто логируем
          console.log(`Sending to user ${user.vk_user_id}: ${message}`);
          
          results.push({
            user_id: user.vk_user_id,
            success: true,
            message: 'Sent successfully'
          });
        } catch (error) {
          console.error(`Error sending to user ${user.vk_user_id}:`, error);
          results.push({
            user_id: user.vk_user_id,
            success: false,
            error: error.message
          });
        }
      }

      // Сохраняем уведомление в базу
      await this.saveNotification({
        title,
        message,
        notification_type: 'broadcast',
        target_event_id: null
      });

      return {
        success: true,
        total_sent: results.filter(r => r.success).length,
        total_failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error broadcasting to all users:', error);
      return { success: false, error: error.message };
    }
  }

  // Отправить уведомление участникам конкретного мероприятия
  static async notifyEventParticipants(eventId, message, title = 'Уведомление о мероприятии') {
    try {
      const participants = await UserService.getEventParticipants(eventId);
      const results = [];

      for (const participant of participants) {
        try {
          // Здесь будет вызов VK API для отправки сообщения
          console.log(`Sending to event participant ${participant.user_id}: ${message}`);
          
          results.push({
            user_id: participant.user_id,
            success: true,
            message: 'Sent successfully'
          });
        } catch (error) {
          console.error(`Error sending to participant ${participant.user_id}:`, error);
          results.push({
            user_id: participant.user_id,
            success: false,
            error: error.message
          });
        }
      }

      // Сохраняем уведомление в базу
      await this.saveNotification({
        title,
        message,
        notification_type: 'event',
        target_event_id: eventId
      });

      return {
        success: true,
        total_sent: results.filter(r => r.success).length,
        total_failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error notifying event participants:', error);
      return { success: false, error: error.message };
    }
  }

  // Отправить уведомление конкретному пользователю
  static async sendToUser(vkUserId, message, title = 'Уведомление') {
    try {
      // Здесь будет вызов VK API для отправки сообщения
      console.log(`Sending to user ${vkUserId}: ${message}`);
      
      return { success: true, message: 'Sent successfully' };
    } catch (error) {
      console.error(`Error sending to user ${vkUserId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Сохранить уведомление в базу данных
  static async saveNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: notificationData.title,
          message: notificationData.message,
          notification_type: notificationData.notification_type || 'general',
          target_event_id: notificationData.target_event_id || null,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, notification: data };
    } catch (error) {
      console.error('Error saving notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Получить историю уведомлений
  static async getNotificationHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          events (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  // Получить статистику уведомлений
  static async getNotificationStats() {
    try {
      const { count: totalNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      const { count: broadcastNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('notification_type', 'broadcast');

      const { count: eventNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('notification_type', 'event');

      return {
        totalNotifications: totalNotifications || 0,
        broadcastNotifications: broadcastNotifications || 0,
        eventNotifications: eventNotifications || 0
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { totalNotifications: 0, broadcastNotifications: 0, eventNotifications: 0 };
    }
  }
}
