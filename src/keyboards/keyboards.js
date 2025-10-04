import { Keyboard } from "vk-io";

export class Keyboards {
  // Приветственная клавиатура
  static getWelcomeKeyboard() {
    return Keyboard.builder()
      .textButton({
        label: "🚀 Начать",
        payload: { command: "start_bot" },
        color: "positive",
      })
      .oneTime();
  }

  // Главное меню
  static getMainMenu() {
    return Keyboard.builder()
      .textButton({
        label: "📅 Мероприятия",
        payload: { command: "events" },
        color: "primary",
      })
      .textButton({
        label: "📝 Мои регистрации",
        payload: { command: "my_registrations" },
        color: "secondary",
      })
      .row()
      .textButton({
        label: "ℹ️ Помощь",
        payload: { command: "help" },
        color: "secondary",
      })
      .textButton({
        label: "📞 Контакты",
        payload: { command: "contacts" },
        color: "secondary",
      })
      .oneTime();
  }

  // Список мероприятий
  static getEventsList(events) {
    const keyboard = Keyboard.builder();

    events.forEach((event, index) => {
      if (index % 2 === 0) {
        keyboard.row();
      }

      keyboard.textButton({
        label:
          event.name.length > 20
            ? event.name.substring(0, 17) + "..."
            : event.name,
        payload: { command: "event_details", eventId: event.id },
        color: "primary",
      });
    });

    keyboard.row().textButton({
      label: "🔙 Назад",
      payload: { command: "main_menu" },
      color: "secondary",
    });

    return keyboard.oneTime();
  }

  // Детали мероприятия
  static getEventDetails(event, isRegistered = false) {
    const keyboard = Keyboard.builder();

    if (!isRegistered) {
      keyboard.textButton({
        label: "✅ Зарегистрироваться",
        payload: { command: "register", eventId: event.id },
        color: "positive",
      });
    } else {
      keyboard.textButton({
        label: "❌ Отменить регистрацию",
        payload: { command: "cancel_registration", eventId: event.id },
        color: "negative",
      });
    }

    keyboard.row().textButton({
      label: "🔙 К мероприятиям",
      payload: { command: "events" },
      color: "secondary",
    });

    return keyboard.oneTime();
  }

  // Клавиатура для выбора количества участников
  static getParticipantsCountKeyboard(eventId) {
    return Keyboard.builder()
      .textButton({
        label: "1",
        payload: { command: "confirm_register", eventId, participantsCount: 1 },
        color: "primary",
      })
      .textButton({
        label: "2",
        payload: { command: "confirm_register", eventId, participantsCount: 2 },
        color: "primary",
      })
      .textButton({
        label: "3",
        payload: { command: "confirm_register", eventId, participantsCount: 3 },
        color: "primary",
      })
      .row()
      .textButton({
        label: "4",
        payload: { command: "confirm_register", eventId, participantsCount: 4 },
        color: "primary",
      })
      .textButton({
        label: "5",
        payload: { command: "confirm_register", eventId, participantsCount: 5 },
        color: "primary",
      })
      .textButton({
        label: "6",
        payload: { command: "confirm_register", eventId, participantsCount: 6 },
        color: "primary",
      })
      .row()
      .textButton({
        label: "7",
        payload: { command: "confirm_register", eventId, participantsCount: 7 },
        color: "primary",
      })
      .textButton({
        label: "8",
        payload: { command: "confirm_register", eventId, participantsCount: 8 },
        color: "primary",
      })
      .textButton({
        label: "9",
        payload: { command: "confirm_register", eventId, participantsCount: 9 },
        color: "primary",
      })
      .row()
      .textButton({
        label: "10",
        payload: {
          command: "confirm_register",
          eventId,
          participantsCount: 10,
        },
        color: "primary",
      })
      .row()
      .textButton({
        label: "🔙 Назад",
        payload: { command: "event_details", eventId },
        color: "secondary",
      })
      .oneTime();
  }

  // Подтверждение регистрации
  static getRegistrationConfirm(eventId, participantsCount = 1) {
    return Keyboard.builder()
      .textButton({
        label: "✅ Да, зарегистрироваться",
        payload: { command: "confirm_register", eventId, participantsCount },
        color: "positive",
      })
      .textButton({
        label: "❌ Отмена",
        payload: { command: "event_details", eventId },
        color: "negative",
      })
      .oneTime();
  }

  // Мои регистрации
  static getMyRegistrations(registrations) {
    const keyboard = Keyboard.builder();

    registrations.forEach((registration, index) => {
      if (index % 2 === 0) {
        keyboard.row();
      }

      const eventName =
        registration.events.name.length > 15
          ? registration.events.name.substring(0, 12) + "..."
          : registration.events.name;

      keyboard.textButton({
        label: eventName,
        payload: { command: "event_details", eventId: registration.event_id },
        color: "primary",
      });
    });

    keyboard.row().textButton({
      label: "🔙 Главное меню",
      payload: { command: "main_menu" },
      color: "secondary",
    });

    return keyboard.oneTime();
  }

  // Помощь
  static getHelp() {
    return Keyboard.builder()
      .textButton({
        label: "🔙 Главное меню",
        payload: { command: "main_menu" },
        color: "secondary",
      })
      .oneTime();
  }
}
