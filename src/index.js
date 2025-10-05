import dotenv from "dotenv";

// Загружаем переменные окружения в самом начале
dotenv.config();

import express from "express";
import { VK } from "vk-io";
import { MessageHandler } from "./handlers/messageHandler.js";
import { UserService } from "./services/userService.js";

// Инициализация VK API
const vk = new VK({
  token: process.env.VK_ACCESS_TOKEN,
  groupId: process.env.VK_GROUP_ID,
});

console.log({ vk });

// Инициализация Express
const app = express();
const PORT = process.env.BOT_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация обработчика сообщений
const messageHandler = new MessageHandler(vk);

// Обработка входящих сообщений от VK
app.post("/webhook", async (req, res) => {
  try {
    console.log("📨 Webhook получен:", JSON.stringify(req.body, null, 2));
    const { type, object } = req.body;

    // Подтверждение сервера
    if (type === "confirmation") {
      console.log(
        "✅ Подтверждение сервера, отправляем токен:",
        process.env.VK_CONFIRMATION_TOKEN
      );
      return res.status(200).send(process.env.VK_CONFIRMATION_TOKEN);
    }

    // Обработка новых сообщений
    if (type === "message_new") {
      const message = object.message;

      // Сохраняем профиль пользователя (временно отключено)
      // try {
      //   const userInfo = {
      //     first_name: message.first_name || null,
      //     last_name: message.last_name || null,
      //     username: message.username || null,
      //     photo_url: message.photo_100 || null,
      //   };

      //   await UserService.saveUserProfile(message.from_id, userInfo);
      // } catch (error) {
      //   console.error("Error saving user profile:", error);
      // }

      // Создаем контекст для обработчика
      const context = {
        senderId: message.from_id,
        text: message.text,
        messagePayload: message.payload ? JSON.parse(message.payload) : null,
        send: async (options) => {
          return await vk.api.messages.send({
            peer_id: message.from_id,
            random_id: Math.floor(Math.random() * 2147483647),
            ...options,
          });
        },
      };

      // Обрабатываем сообщение
      await messageHandler.handleMessage(context);
    }

    console.log("✅ Отправляем ответ 'ok'");
    res.status(200).send("ok");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("error");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Главная страница
app.get("/", (req, res) => {
  res.json({
    message: "VK Events Bot is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Обработка POST запросов на корневой путь (для VK callback)
app.post("/", async (req, res) => {
  try {
    console.log(
      "📨 POST запрос на корневой путь:",
      JSON.stringify(req.body, null, 2)
    );
    const { type, object } = req.body;

    // Подтверждение сервера
    if (type === "confirmation") {
      console.log(
        "✅ Подтверждение сервера (корневой путь), отправляем токен:",
        process.env.VK_CONFIRMATION_TOKEN
      );
      return res.status(200).send(process.env.VK_CONFIRMATION_TOKEN);
    }

    // Обработка новых сообщений
    if (type === "message_new") {
      const message = object.message;

      // Создаем контекст для обработчика
      const context = {
        senderId: message.from_id,
        text: message.text,
        messagePayload: message.payload ? JSON.parse(message.payload) : null,
        send: async (options) => {
          return await vk.api.messages.send({
            peer_id: message.from_id,
            random_id: Math.floor(Math.random() * 2147483647),
            ...options,
          });
        },
      };

      // Обрабатываем сообщение
      await messageHandler.handleMessage(context);
    }

    console.log("✅ Отправляем ответ 'ok' (корневой путь)");
    res.status(200).send("ok");
  } catch (error) {
    console.error("❌ Root webhook error:", error);
    res.status(500).send("error");
  }
});

// API для администратора
import { NotificationService } from "./services/notificationService.js";

// Отправить уведомление всем пользователям
app.post("/api/broadcast", async (req, res) => {
  try {
    const { message, title } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await NotificationService.broadcastToAllUsers(
      message,
      title
    );
    res.json(result);
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Отправить уведомление участникам мероприятия
app.post("/api/notify-event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, title } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await NotificationService.notifyEventParticipants(
      eventId,
      message,
      title
    );
    res.json(result);
  } catch (error) {
    console.error("Event notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Получить статистику
app.get("/api/stats", async (req, res) => {
  try {
    const userStats = await UserService.getUserStats();
    const notificationStats = await NotificationService.getNotificationStats();

    res.json({
      users: userStats,
      notifications: notificationStats,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Получить список пользователей
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserService.getAllActiveUsers();
    res.json(users);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Получить список мероприятий
app.get("/api/events", async (req, res) => {
  try {
    const { EventsService } = await import("./services/eventsService.js");
    const events = await EventsService.getActiveEvents();
    res.json(events);
  } catch (error) {
    console.error("Events error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Админ панель
app.get("/admin", (req, res) => {
  res.sendFile("admin/index.html", { root: "." });
});

// Страница настройки бота
app.get("/admin/setup", (req, res) => {
  res.sendFile("admin/setup.html", { root: "." });
});

// Автоматическая настройка бота
app.post("/api/setup-bot", async (req, res) => {
  try {
    const { groupId, webhookUrl, confirmationToken } = req.body;

    if (!groupId || !webhookUrl || !confirmationToken) {
      return res.status(400).json({
        error:
          "Missing required parameters: groupId, webhookUrl, confirmationToken",
      });
    }

    const { VKSetupService } = await import("./services/vkSetupService.js");
    const setupService = new VKSetupService(process.env.VK_ACCESS_TOKEN);

    const result = await setupService.setupBot(
      groupId,
      webhookUrl,
      confirmationToken
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Бот успешно настроен!",
        results: result.results,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        results: result.results,
      });
    }
  } catch (error) {
    console.error("Setup bot error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Проверить статус настройки
app.get("/api/setup-status/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const { VKSetupService } = await import("./services/vkSetupService.js");
    const setupService = new VKSetupService(process.env.VK_ACCESS_TOKEN);

    const result = await setupService.checkSetupStatus(groupId);
    res.json(result);
  } catch (error) {
    console.error("Setup status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Получить информацию о группе
app.get("/api/group-info/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const { VKSetupService } = await import("./services/vkSetupService.js");
    const setupService = new VKSetupService(process.env.VK_ACCESS_TOKEN);

    const result = await setupService.getGroupInfo(groupId);
    res.json(result);
  } catch (error) {
    console.error("Group info error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Запуск сервера
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Bot server running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  });
}

// Для Vercel
export default app;
