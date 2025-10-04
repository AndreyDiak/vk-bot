import { supabase } from "../config/database.js";

export class UserService {
  // Сохранить или обновить профиль пользователя
  static async saveUserProfile(vkUserId, userInfo = {}) {
    try {
      if (!supabase) {
        console.log(`📝 Симуляция сохранения профиля пользователя ${vkUserId}`);
        return { success: true };
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("vk_user_id", vkUserId)
        .single();

      const userData = {
        vk_user_id: vkUserId,
        first_name: userInfo.first_name || null,
        last_name: userInfo.last_name || null,
        username: userInfo.username || null,
        photo_url: userInfo.photo_url || null,
        phone: userInfo.phone || null,
        email: userInfo.email || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingUser) {
        // Обновляем существующего пользователя
        const { data, error } = await supabase
          .from("users")
          .update(userData)
          .eq("vk_user_id", vkUserId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Создаем нового пользователя
        userData.created_at = new Date().toISOString();

        const { data, error } = await supabase
          .from("users")
          .insert(userData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return { success: true, user: result };
    } catch (error) {
      console.error("Error saving user profile:", error);
      return { success: false, error: error.message };
    }
  }

  // Получить профиль пользователя
  static async getUserProfile(vkUserId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("vk_user_id", vkUserId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  // Получить всех активных пользователей
  static async getAllActiveUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching active users:", error);
      return [];
    }
  }

  // Получить пользователей, зарегистрированных на конкретное мероприятие
  static async getEventParticipants(eventId) {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          `
          user_id,
          users (
            vk_user_id,
            first_name,
            last_name,
            username
          )
        `
        )
        .eq("event_id", eventId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching event participants:", error);
      return [];
    }
  }

  // Получить статистику пользователей
  static async getUserStats() {
    try {
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: activeUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: totalRegistrations } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true });

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalRegistrations: totalRegistrations || 0,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return { totalUsers: 0, activeUsers: 0, totalRegistrations: 0 };
    }
  }

  // Деактивировать пользователя
  static async deactivateUser(vkUserId) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("vk_user_id", vkUserId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deactivating user:", error);
      return { success: false, error: error.message };
    }
  }
}
