import {
  EVENTS_TABLE,
  REGISTRATIONS_TABLE,
  supabase,
} from "../config/database.js";

export class EventsService {
  // Получить все активные мероприятия
  static async getActiveEvents() {
    try {
      if (!supabase) {
        // Возвращаем тестовые данные если Supabase не настроен
        return [
          {
            id: 1,
            title: "Тестовое мероприятие",
            description:
              "Это тестовое мероприятие для демонстрации работы бота",
            event_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: "Онлайн",
            max_participants: 50,
            is_active: true,
          },
        ];
      }

      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select("*")
        .gte("event_date", new Date().toISOString())
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  }

  // Получить мероприятие по ID
  static async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching event:", error);
      return null;
    }
  }

  // Зарегистрировать пользователя на мероприятие
  static async registerUser(eventId, userId, userInfo = {}) {
    try {
      if (!supabase) {
        // Симуляция регистрации без Supabase
        const event = await this.getEventById(eventId);
        if (!event) {
          return {
            success: false,
            message: "Мероприятие не найдено или неактивно",
          };
        }

        const participantsCount = userInfo.participantsCount || 1;
        const teamName = userInfo.teamName || null;
        console.log(
          `📝 Симуляция регистрации: пользователь ${userId} на мероприятие ${eventId} (${participantsCount} чел.)${
            teamName ? `, команда: ${teamName}` : ""
          }`
        );

        let message = `Вы успешно зарегистрированы на мероприятие "${
          event.title
        }" на ${participantsCount} ${
          participantsCount === 1 ? "человека" : "человек"
        }!`;

        if (teamName) {
          message += `\n🏆 Название команды: ${teamName}`;
        }

        message += `\n(тестовый режим)`;

        return {
          success: true,
          message,
          registration: {
            id: Date.now(),
            event_id: eventId,
            user_id: userId,
            participants_count: participantsCount,
            team_name: teamName,
          },
        };
      }

      // Проверяем, не зарегистрирован ли уже пользователь
      const { data: existingRegistration } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      if (existingRegistration) {
        return {
          success: false,
          message: "Вы уже зарегистрированы на это мероприятие",
        };
      }

      // Проверяем, есть ли свободные места
      const event = await this.getEventById(eventId);
      if (!event) {
        return { success: false, message: "Мероприятие не найдено" };
      }

      const participantsCount = userInfo.participantsCount || 1;

      if (event.max_participants) {
        // Получаем общее количество зарегистрированных участников
        const { data: registrations } = await supabase
          .from(REGISTRATIONS_TABLE)
          .select("participants_count")
          .eq("event_id", eventId);

        const totalRegistered =
          registrations?.reduce(
            (sum, reg) => sum + (reg.participants_count || 1),
            0
          ) || 0;

        if (totalRegistered + participantsCount > event.max_participants) {
          return {
            success: false,
            message: `К сожалению, недостаточно мест. Доступно: ${
              event.max_participants - totalRegistered
            }`,
          };
        }
      }

      // Регистрируем пользователя
      const { data, error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .insert({
          event_id: eventId,
          user_id: userId,
          participants_count: participantsCount,
          user_name: userInfo.name || "Пользователь",
          user_phone: userInfo.phone || null,
          team_name: userInfo.teamName || null,
          registered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const participantsText =
        participantsCount === 1 ? "участника" : "участников";

      let message = `Вы успешно зарегистрированы на мероприятие "${event.name}" на ${participantsCount} ${participantsText}`;

      if (userInfo.teamName) {
        message += `\n🏆 Название команды: ${userInfo.teamName}`;
      }

      return {
        success: true,
        message,
        registration: data,
      };
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, message: "Произошла ошибка при регистрации" };
    }
  }

  // Отменить регистрацию
  static async cancelRegistration(eventId, userId) {
    try {
      if (!supabase) {
        // Симуляция отмены регистрации без Supabase
        console.log(
          `📝 Симуляция отмены регистрации: пользователь ${userId} с мероприятия ${eventId}`
        );
        return {
          success: true,
          message: "Регистрация отменена (тестовый режим)",
        };
      }

      const { error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;

      return { success: true, message: "Регистрация отменена" };
    } catch (error) {
      console.error("Error canceling registration:", error);
      return {
        success: false,
        message: "Произошла ошибка при отмене регистрации",
      };
    }
  }

  // Изменить количество участников
  static async changeParticipantsCount(eventId, userId, newParticipantsCount) {
    try {
      if (!supabase) {
        // Симуляция изменения количества участников без Supabase
        console.log(
          `📝 Симуляция изменения количества участников: пользователь ${userId} на мероприятие ${eventId} (${newParticipantsCount} чел.)`
        );
        return {
          success: true,
          message: `Количество участников изменено на ${newParticipantsCount} (тестовый режим)`,
        };
      }

      // Проверяем, зарегистрирован ли пользователь
      const { data: existingRegistration } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select("id, participants_count")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      if (!existingRegistration) {
        return {
          success: false,
          message: "Вы не зарегистрированы на это мероприятие",
        };
      }

      // Проверяем, есть ли свободные места для нового количества
      const event = await this.getEventById(eventId);
      if (!event) {
        return { success: false, message: "Мероприятие не найдено" };
      }

      if (event.max_participants) {
        // Получаем общее количество зарегистрированных участников
        const { data: registrations } = await supabase
          .from(REGISTRATIONS_TABLE)
          .select("participants_count")
          .eq("event_id", eventId);

        const totalRegistered =
          registrations?.reduce(
            (sum, reg) => sum + (reg.participants_count || 1),
            0
          ) || 0;

        // Вычитаем текущее количество участников пользователя
        const currentUserCount = existingRegistration.participants_count || 1;
        const availableSlots = totalRegistered - currentUserCount;

        if (availableSlots + newParticipantsCount > event.max_participants) {
          return {
            success: false,
            message: `К сожалению, недостаточно мест. Доступно: ${
              event.max_participants - availableSlots
            }`,
          };
        }
      }

      // Обновляем количество участников
      const { error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .update({ participants_count: newParticipantsCount })
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;

      const participantsText =
        newParticipantsCount === 1 ? "участника" : "участников";
      return {
        success: true,
        message: `Количество участников изменено на ${newParticipantsCount} ${participantsText}`,
      };
    } catch (error) {
      console.error("Error changing participants count:", error);
      return {
        success: false,
        message: "Произошла ошибка при изменении количества участников",
      };
    }
  }

  // Получить регистрации пользователя
  static async getUserRegistrations(userId) {
    try {
      const { data, error } = await supabase
        .from(REGISTRATIONS_TABLE)
        .select(
          `
          *,
          events (
            id,
            name,
            event_date,
            location
          )
        `
        )
        .eq("user_id", userId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      return [];
    }
  }

  // Форматировать дату для отображения
  static formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
