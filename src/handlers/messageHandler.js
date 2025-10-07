import { Keyboards } from "../keyboards/keyboards.js";
import { EventsService } from "../services/eventsService.js";

export class MessageHandler {
  constructor(bot) {
    this.bot = bot;
    this.userStates = new Map(); // Для хранения состояний пользователей
  }

  // Обработка входящих сообщений
  async handleMessage(context) {
    const userId = context.senderId;
    const text = context.text?.toLowerCase() || "";
    const payload = context.messagePayload;

    // Обработка команд из payload
    if (payload) {
      return this.handlePayload(context, payload);
    }

    // Проверяем, является ли это первым сообщением пользователя
    if (text === "start" || text === "начать") {
      return this.showWelcomeMessage(context);
    }

    // Обработка текстовых команд
    switch (text) {
      case "меню":
        return this.showMainMenu(context);

      case "мероприятия":
      case "events":
        return this.showEvents(context);

      case "мои регистрации":
      case "registrations":
        return this.showMyRegistrations(context);

      case "помощь":
      case "help":
        return this.showHelp(context);

      default:
        // Если пользователь вводит число, проверяем, не находится ли он в процессе выбора количества участников
        if (
          this.userStates.has(userId) &&
          (this.userStates.get(userId).state === "selecting_participants" ||
            this.userStates.get(userId).state === "changing_participants")
        ) {
          return this.handleParticipantsCount(context, text);
        }

        // Если пользователь вводит название команды
        if (
          this.userStates.has(userId) &&
          this.userStates.get(userId).state === "entering_team_name"
        ) {
          return this.handleTeamNameInput(context, text);
        }
        return this.showMainMenu(context);
    }
  }

  // Обработка payload команд
  async handlePayload(context, payload) {
    const userId = context.senderId;
    const command = payload.command;

    switch (command) {
      case "start_bot":
        return this.showMainMenu(context);

      case "main_menu":
        return this.showMainMenu(context);

      case "events":
        return this.showEvents(context);

      case "event_details":
        return this.showEventDetails(context, payload.eventId);

      case "register":
        return this.showParticipantsCountSelection(context, payload.eventId);

      case "confirm_register":
        return this.showTeamNameInput(
          context,
          payload.eventId,
          payload.participantsCount
        );

      case "confirm_register_with_team":
        return this.registerUser(
          context,
          payload.eventId,
          payload.participantsCount,
          payload.teamName
        );

      case "cancel_registration":
        return this.cancelRegistration(context, payload.eventId);

      case "change_participants":
        return this.showParticipantsCountSelection(
          context,
          payload.eventId,
          true
        );

      case "confirm_change_participants":
        return this.changeParticipantsCount(
          context,
          payload.eventId,
          payload.participantsCount
        );

      case "my_registrations":
        return this.showMyRegistrations(context);

      case "help":
        return this.showHelp(context);

      case "contacts":
        return this.showContacts(context);

      default:
        return this.showMainMenu(context);
    }
  }

  // Показать приветственное сообщение
  async showWelcomeMessage(context) {
    await context.send({
      message: `🎉 Добро пожаловать в бот мероприятий!

Я помогу вам:
• Просматривать доступные мероприятия
• Регистрироваться на интересные события
• Управлять своими регистрациями

Нажмите кнопку "Начать", чтобы продолжить!`,
      keyboard: Keyboards.getWelcomeKeyboard(),
    });
  }

  // Показать главное меню
  async showMainMenu(context) {
    await context.send({
      message: `👋 Привет! Я бот для управления мероприятиями.

Выберите действие:`,
      keyboard: Keyboards.getMainMenu(),
    });
  }

  // Показать список мероприятий
  async showEvents(context) {
    const events = await EventsService.getActiveEvents();

    if (events.length === 0) {
      await context.send({
        message:
          "📅 На данный момент нет активных мероприятий.\n\nПроверьте позже!",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    let message = "📅 **Доступные мероприятия:**\n\n";

    events.forEach((event, index) => {
      const date = EventsService.formatEventDate(event.event_date);
      message += `${index + 1}. **${event.name}**\n`;
      message += `📅 ${date}\n`;
      if (event.location) {
        message += `📍 ${event.location}\n`;
      }
      message += "\n";
    });

    await context.send({
      message,
      keyboard: Keyboards.getEventsList(events),
    });
  }

  // Показать детали мероприятия
  async showEventDetails(context, eventId) {
    const event = await EventsService.getEventById(eventId);

    if (!event) {
      await context.send({
        message: "❌ Мероприятие не найдено",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    // Проверяем, зарегистрирован ли пользователь
    const registrations = await EventsService.getUserRegistrations(
      context.senderId
    );
    const isRegistered = registrations.some((reg) => reg.event_id === eventId);
    const currentRegistration = registrations.find(
      (reg) => reg.event_id === eventId
    );

    const date = EventsService.formatEventDate(event.event_date);

    let message = `📅 **${event.name}**\n\n`;
    message += `📅 **Дата:** ${date}\n`;

    if (event.location) {
      message += `📍 **Место:** ${event.location}\n`;
    }

    if (event.description) {
      message += `\n📝 **Описание:**\n${event.description}\n`;
    }

    if (event.max_participants) {
      message += `\n👥 **Максимум участников:** ${event.max_participants}`;
    }

    if (isRegistered) {
      const participantsCount = currentRegistration?.participants_count || 1;
      const teamName = currentRegistration?.team_name;
      message += `\n\n✅ **Вы зарегистрированы на это мероприятие**`;
      message += `\n👥 **Количество участников:** ${participantsCount}`;
      if (teamName) {
        message += `\n🏆 **Команда:** ${teamName}`;
      }
    }

    await context.send({
      message,
      keyboard: Keyboards.getEventDetails(
        event,
        isRegistered,
        currentRegistration
      ),
    });
  }

  // Показать выбор количества участников
  async showParticipantsCountSelection(context, eventId, isChanging = false) {
    const event = await EventsService.getEventById(eventId);

    if (!event) {
      await context.send({
        message: "❌ Мероприятие не найдено",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    const date = EventsService.formatEventDate(event.event_date);

    let message = `📅 **${event.name}**\n\n`;
    message += `📅 **Дата:** ${date}\n`;

    if (event.location) {
      message += `📍 **Место:** ${event.location}\n`;
    }

    if (isChanging) {
      // Получаем текущее количество участников
      const registrations = await EventsService.getUserRegistrations(
        context.senderId
      );
      const currentRegistration = registrations.find(
        (reg) => reg.event_id === eventId
      );
      const currentCount = currentRegistration?.participants_count || 1;

      message += `\n👥 **Текущее количество участников:** ${currentCount}\n`;
      message += `\n👥 **Выберите новое количество участников:**\n`;
    } else {
      message += `\n👥 **Сколько человек будет участвовать?**\n`;
    }
    message += `Введите число от 1 до 10:`;

    // Сохраняем состояние пользователя
    this.userStates.set(context.senderId, {
      state: isChanging ? "changing_participants" : "selecting_participants",
      eventId: eventId,
      isChanging: isChanging,
    });

    await context.send({
      message,
      keyboard: Keyboards.getParticipantsCountKeyboard(eventId, isChanging),
    });
  }

  // Обработка ввода количества участников
  async handleParticipantsCount(context, text) {
    const userId = context.senderId;
    const userState = this.userStates.get(userId);

    if (
      !userState ||
      (userState.state !== "selecting_participants" &&
        userState.state !== "changing_participants")
    ) {
      return this.showMainMenu(context);
    }

    const participantsCount = parseInt(text);

    if (
      isNaN(participantsCount) ||
      participantsCount < 1 ||
      participantsCount > 12
    ) {
      await context.send({
        message: "❌ Пожалуйста, введите число от 1 до 12",
        keyboard: Keyboards.getParticipantsCountKeyboard(
          userState.eventId,
          userState.isChanging
        ),
      });
      return;
    }

    // Очищаем состояние пользователя
    this.userStates.delete(userId);

    if (userState.isChanging) {
      // Показываем подтверждение изменения
      await this.showChangeParticipantsConfirm(
        context,
        userState.eventId,
        participantsCount
      );
    } else {
      // Показываем подтверждение регистрации
      await this.showRegistrationConfirm(
        context,
        userState.eventId,
        participantsCount
      );
    }
  }

  // Показать ввод названия команды
  async showTeamNameInput(context, eventId, participantsCount = 1) {
    const event = await EventsService.getEventById(eventId);

    if (!event) {
      await context.send({
        message: "❌ Мероприятие не найдено",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    const date = EventsService.formatEventDate(event.event_date);

    let message = `📅 **${event.name}**\n\n`;
    message += `📅 **Дата:** ${date}\n`;

    if (event.location) {
      message += `📍 **Место:** ${event.location}\n`;
    }

    message += `👥 **Количество участников:** ${participantsCount}\n`;
    message += `\n🏆 **Введите название команды (обязательно):**\n`;
    message += `_Максимум 50 символов_`;

    // Сохраняем состояние пользователя
    this.userStates.set(context.senderId, {
      state: "entering_team_name",
      eventId: eventId,
      participantsCount: participantsCount,
    });

    await context.send({
      message,
      keyboard: Keyboards.getTeamNameInput(eventId, participantsCount),
    });
  }

  // Обработка ввода названия команды
  async handleTeamNameInput(context, text) {
    const userId = context.senderId;
    const userState = this.userStates.get(userId);

    if (!userState || userState.state !== "entering_team_name") {
      return this.showMainMenu(context);
    }

    // Очищаем состояние пользователя
    this.userStates.delete(userId);

    // Валидация названия команды
    const teamName = text.trim();

    if (!teamName) {
      await context.send({
        message:
          "❌ Название команды обязательно для заполнения. Пожалуйста, введите название команды.",
        keyboard: Keyboards.getTeamNameInput(
          userState.eventId,
          userState.participantsCount
        ),
      });
      return;
    }

    if (teamName.length > 50) {
      await context.send({
        message: "❌ Название команды слишком длинное. Максимум 50 символов.",
        keyboard: Keyboards.getTeamNameInput(
          userState.eventId,
          userState.participantsCount
        ),
      });
      return;
    }

    // Показываем подтверждение регистрации
    await this.showRegistrationConfirm(
      context,
      userState.eventId,
      userState.participantsCount,
      teamName
    );
  }

  // Показать подтверждение регистрации
  async showRegistrationConfirm(
    context,
    eventId,
    participantsCount = 1,
    teamName = null
  ) {
    const event = await EventsService.getEventById(eventId);

    if (!event) {
      await context.send({
        message: "❌ Мероприятие не найдено",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    const date = EventsService.formatEventDate(event.event_date);

    let message = `📅 **${event.name}**\n\n`;
    message += `📅 **Дата:** ${date}\n`;

    if (event.location) {
      message += `📍 **Место:** ${event.location}\n`;
    }

    message += `👥 **Количество участников:** ${participantsCount}\n`;

    if (teamName) {
      message += `🏆 **Название команды:** ${teamName}\n`;
    }

    message += `\n❓ **Вы уверены, что хотите зарегистрироваться?**`;

    await context.send({
      message,
      keyboard: Keyboards.getRegistrationConfirm(
        eventId,
        participantsCount,
        teamName
      ),
    });
  }

  // Зарегистрировать пользователя
  async registerUser(context, eventId, participantsCount = 1, teamName = null) {
    const userInfo = {
      name: context.senderId, // В реальном проекте можно получить имя из профиля ВК
      phone: null,
      participantsCount: participantsCount,
      teamName: teamName,
    };

    const result = await EventsService.registerUser(
      eventId,
      context.senderId,
      userInfo
    );

    await context.send({
      message: result.message,
      keyboard: Keyboards.getMainMenu(),
    });
  }

  // Отменить регистрацию
  async cancelRegistration(context, eventId) {
    const result = await EventsService.cancelRegistration(
      eventId,
      context.senderId
    );

    await context.send({
      message: result.message,
      keyboard: Keyboards.getMainMenu(),
    });
  }

  // Показать подтверждение изменения количества участников
  async showChangeParticipantsConfirm(context, eventId, newParticipantsCount) {
    const event = await EventsService.getEventById(eventId);

    if (!event) {
      await context.send({
        message: "❌ Мероприятие не найдено",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    // Получаем текущее количество участников
    const registrations = await EventsService.getUserRegistrations(
      context.senderId
    );
    const currentRegistration = registrations.find(
      (reg) => reg.event_id === eventId
    );
    const currentCount = currentRegistration?.participants_count || 1;

    const date = EventsService.formatEventDate(event.event_date);

    let message = `📅 **${event.name}**\n\n`;
    message += `📅 **Дата:** ${date}\n`;

    if (event.location) {
      message += `📍 **Место:** ${event.location}\n`;
    }

    message += `👥 **Текущее количество участников:** ${currentCount}\n`;
    message += `👥 **Новое количество участников:** ${newParticipantsCount}\n`;
    message += `\n❓ **Вы уверены, что хотите изменить количество участников?**`;

    await context.send({
      message,
      keyboard: Keyboards.getChangeParticipantsConfirm(
        eventId,
        newParticipantsCount
      ),
    });
  }

  // Изменить количество участников
  async changeParticipantsCount(context, eventId, newParticipantsCount) {
    const result = await EventsService.changeParticipantsCount(
      eventId,
      context.senderId,
      newParticipantsCount
    );

    await context.send({
      message: result.message,
      keyboard: Keyboards.getMainMenu(),
    });
  }

  // Показать мои регистрации
  async showMyRegistrations(context) {
    const registrations = await EventsService.getUserRegistrations(
      context.senderId
    );

    if (registrations.length === 0) {
      await context.send({
        message: "📝 У вас нет активных регистраций на мероприятия.",
        keyboard: Keyboards.getMainMenu(),
      });
      return;
    }

    let message = "📝 **Ваши регистрации:**\n\n";

    registrations.forEach((registration, index) => {
      const event = registration.events;
      const date = EventsService.formatEventDate(event.event_date);
      const participantsCount = registration.participants_count || 1;
      const teamName = registration.team_name;

      message += `${index + 1}. **${event.name}**\n`;
      message += `📅 ${date}\n`;
      if (event.location) {
        message += `📍 ${event.location}\n`;
      }
      message += `👥 Участников: ${participantsCount}\n`;
      if (teamName) {
        message += `🏆 Команда: ${teamName}\n`;
      }
      message += "\n";
    });

    await context.send({
      message,
      keyboard: Keyboards.getMyRegistrations(registrations),
    });
  }

  // Показать помощь
  async showHelp(context) {
    const message = `ℹ️ **Помощь по боту**

**Основные команды:**
• /start - Главное меню
• /events - Список мероприятий
• /registrations - Мои регистрации

**Как пользоваться:**
1. Выберите "Мероприятия" для просмотра доступных событий
2. Нажмите на интересующее мероприятие для просмотра деталей
3. Нажмите "Зарегистрироваться" для участия
4. Используйте "Мои регистрации" для просмотра ваших заявок

**Поддержка:**
Если у вас возникли вопросы, обратитесь к администратору.`;

    await context.send({
      message,
      keyboard: Keyboards.getHelp(),
    });
  }

  // Показать контакты
  async showContacts(context) {
    const message = `📞 **Контакты**

**Техническая поддержка:**
• Email: support@example.com
• Телефон: +7 (XXX) XXX-XX-XX

**Администратор:**
• @username (ВКонтакте)

**Время работы:**
Пн-Пт: 9:00 - 18:00
Сб-Вс: 10:00 - 16:00`;

    await context.send({
      message,
      keyboard: Keyboards.getMainMenu(),
    });
  }
}
