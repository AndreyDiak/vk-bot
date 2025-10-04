import { VK } from "vk-io";

export class VKSetupService {
  constructor(accessToken) {
    this.vk = new VK({
      token: accessToken,
    });
  }

  // Получить информацию о группе
  async getGroupInfo(groupId) {
    try {
      const response = await this.vk.api.groups.getById({
        group_id: groupId,
        fields: "description,status,type,photo_200,member_count",
      });

      return {
        success: true,
        group: response[0],
      };
    } catch (error) {
      console.error("Error getting group info:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Настроить Callback API
  async setupCallbackAPI(groupId, webhookUrl, confirmationToken) {
    try {
      // Сначала получаем server_id для группы
      const serverInfo = await this.vk.api.groups.getCallbackServers({
        group_id: groupId,
      });

      let serverId;
      if (serverInfo.items && serverInfo.items.length > 0) {
        // Используем существующий server_id
        serverId = serverInfo.items[0].id;
      } else {
        // Создаем новый сервер
        const newServer = await this.vk.api.groups.addCallbackServer({
          group_id: groupId,
          url: webhookUrl,
          title: "Events Bot Server",
          secret_key: confirmationToken,
        });
        serverId = newServer.server_id;
      }

      // Получаем текущие настройки
      const currentSettings = await this.vk.api.groups.getCallbackSettings({
        group_id: groupId,
        server_id: serverId,
      });

      // Настраиваем Callback API
      const response = await this.vk.api.groups.setCallbackSettings({
        group_id: groupId,
        server_id: serverId,
        secret_key: confirmationToken,
        api_version: "5.131",
        message_new: 1,
        message_reply: 1,
        message_edit: 1,
        message_allow: 1,
        message_deny: 1,
        photo_new: 1,
        audio_new: 1,
        video_new: 1,
        wall_reply_new: 1,
        wall_reply_edit: 1,
        wall_reply_delete: 1,
        wall_reply_restore: 1,
        wall_post_new: 1,
        wall_repost: 1,
        board_post_new: 1,
        board_post_edit: 1,
        board_post_restore: 1,
        board_post_delete: 1,
        photo_comment_new: 1,
        photo_comment_edit: 1,
        photo_comment_delete: 1,
        photo_comment_restore: 1,
        video_comment_new: 1,
        video_comment_edit: 1,
        video_comment_delete: 1,
        video_comment_restore: 1,
        market_comment_new: 1,
        market_comment_edit: 1,
        market_comment_delete: 1,
        market_comment_restore: 1,
        poll_vote_new: 1,
        group_join: 1,
        group_leave: 1,
        group_change_settings: 1,
        group_change_photo: 1,
        group_officers_edit: 1,
        user_block: 1,
        user_unblock: 1,
        lead_forms_new: 1,
        like_add: 1,
        like_remove: 1,
      });

      return {
        success: true,
        settings: response,
        message: "Callback API настроен успешно",
      };
    } catch (error) {
      console.error("Error setting up Callback API:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Настроить права бота
  async setupBotPermissions(groupId) {
    try {
      // Получаем текущие права
      const currentRights = await this.vk.api.groups.getTokenPermissions({
        group_id: groupId,
      });

      // Настраиваем права для бота
      const requiredRights = [
        "messages", // Отправка сообщений
        "photos", // Работа с фотографиями
        "docs", // Работа с документами
        "wall", // Работа со стеной
        "groups", // Управление группой
        "stats", // Статистика
        "market", // Товары
        "stories", // Истории
        "app_widget", // Виджеты
        "manage", // Управление
      ];

      return {
        success: true,
        currentRights: currentRights,
        requiredRights: requiredRights,
        message: "Права бота проверены",
      };
    } catch (error) {
      console.error("Error checking bot permissions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Создать меню бота
  async createBotMenu(groupId) {
    try {
      // Создаем меню для бота
      const menu = {
        one_time: false,
        buttons: [
          [
            {
              action: {
                type: "text",
                payload: JSON.stringify({ command: "events" }),
                label: "📅 Мероприятия",
              },
              color: "primary",
            },
            {
              action: {
                type: "text",
                payload: JSON.stringify({ command: "my_registrations" }),
                label: "📝 Мои регистрации",
              },
              color: "secondary",
            },
          ],
          [
            {
              action: {
                type: "text",
                payload: JSON.stringify({ command: "help" }),
                label: "ℹ️ Помощь",
              },
              color: "secondary",
            },
            {
              action: {
                type: "text",
                payload: JSON.stringify({ command: "contacts" }),
                label: "📞 Контакты",
              },
              color: "secondary",
            },
          ],
        ],
      };

      // Отправляем меню (это делается через отправку сообщения с клавиатурой)
      const response = await this.vk.api.messages.send({
        peer_id: -groupId,
        message: "🤖 Бот настроен! Выберите действие:",
        keyboard: JSON.stringify(menu),
        random_id: Math.floor(Math.random() * 2147483647),
      });

      return {
        success: true,
        message: "Меню бота создано",
        response: response,
      };
    } catch (error) {
      console.error("Error creating bot menu:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Установить описание группы
  async setGroupDescription(groupId, description) {
    try {
      const response = await this.vk.api.groups.edit({
        group_id: groupId,
        description: description,
      });

      return {
        success: true,
        message: "Описание группы обновлено",
      };
    } catch (error) {
      console.error("Error setting group description:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Полная настройка бота
  async setupBot(groupId, webhookUrl, confirmationToken) {
    try {
      const results = {
        groupInfo: null,
        callbackAPI: null,
        permissions: null,
        menu: null,
        description: null,
      };

      // 1. Получаем информацию о группе
      console.log("Получение информации о группе...");
      results.groupInfo = await this.getGroupInfo(groupId);
      if (!results.groupInfo.success) {
        throw new Error(
          `Ошибка получения информации о группе: ${results.groupInfo.error}`
        );
      }

      // 2. Настраиваем Callback API
      console.log("Настройка Callback API...");
      results.callbackAPI = await this.setupCallbackAPI(
        groupId,
        webhookUrl,
        confirmationToken
      );
      if (!results.callbackAPI.success) {
        throw new Error(
          `Ошибка настройки Callback API: ${results.callbackAPI.error}`
        );
      }

      // 3. Проверяем права бота
      console.log("Проверка прав бота...");
      results.permissions = await this.setupBotPermissions(groupId);
      if (!results.permissions.success) {
        throw new Error(`Ошибка проверки прав: ${results.permissions.error}`);
      }

      // 4. Создаем меню бота
      console.log("Создание меню бота...");
      results.menu = await this.createBotMenu(groupId);
      if (!results.menu.success) {
        console.warn(
          `Предупреждение: не удалось создать меню: ${results.menu.error}`
        );
      }

      // 5. Устанавливаем описание группы
      console.log("Обновление описания группы...");
      const description = `🤖 Добро пожаловать в наше сообщество!

Здесь вы можете:
📅 Просматривать и регистрироваться на мероприятия
📝 Управлять своими регистрациями
ℹ️ Получать актуальную информацию

Напишите боту /start для начала работы!`;

      results.description = await this.setGroupDescription(
        groupId,
        description
      );
      if (!results.description.success) {
        console.warn(
          `Предупреждение: не удалось обновить описание: ${results.description.error}`
        );
      }

      return {
        success: true,
        message: "Бот успешно настроен!",
        results: results,
      };
    } catch (error) {
      console.error("Error setting up bot:", error);
      return {
        success: false,
        error: error.message,
        results: results,
      };
    }
  }

  // Проверить статус настройки
  async checkSetupStatus(groupId) {
    try {
      const groupInfo = await this.getGroupInfo(groupId);
      const permissions = await this.setupBotPermissions(groupId);

      return {
        success: true,
        group: groupInfo.group,
        permissions: permissions.currentRights,
        isConfigured: groupInfo.success && permissions.success,
      };
    } catch (error) {
      console.error("Error checking setup status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
