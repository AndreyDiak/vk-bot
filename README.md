# VK Events Bot

Бот для управления мероприятиями через ВКонтакте с интеграцией Supabase.

## 🚀 Быстрый старт

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd vk-events-bot
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   ```bash
   cp env.example .env
   # Отредактируйте .env файл
   ```

4. **Запустите бота:**
   ```bash
   npm run dev
   ```

## 📋 Функционал

### Для пользователей:
- 📅 Просмотр списка активных мероприятий
- ✅ Регистрация на мероприятия
- 📝 Просмотр своих регистраций
- ❌ Отмена регистрации
- ℹ️ Информация о мероприятиях

### Для администратора:
- 👥 **Управление пользователями** - автоматическое сохранение профилей
- 📢 **Массовые уведомления** - отправка всем пользователям
- 🎯 **Таргетированные уведомления** - уведомления участникам конкретного мероприятия
- 📊 **Статистика** - количество пользователей, регистраций, уведомлений
- 🖥️ **Админ-панель** - веб-интерфейс для управления
- ⚙️ **Автоматическая настройка** - настройка бота в несколько кликов

## 🛠️ Настройка

### 1. Переменные окружения

Создайте файл `.env` на основе `env.example`:

```env
# VK Bot Configuration
VK_ACCESS_TOKEN=your_vk_access_token_here
VK_GROUP_ID=your_group_id_here
VK_CONFIRMATION_TOKEN=your_confirmation_token_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Bot Configuration
BOT_PORT=3000
NODE_ENV=development
```

### 2. Настройка VK

#### Автоматическая настройка (рекомендуется)

1. **Через веб-интерфейс:**
   - Перейдите на `http://localhost:3000/admin/setup`
   - Введите ID группы, URL webhook и токен подтверждения
   - Нажмите "Настроить бота"

2. **Через командную строку:**
   ```bash
   npm run setup
   ```

#### Ручная настройка

1. Создайте группу в ВКонтакте
2. Перейдите в "Управление" → "Настройки" → "Работа с API"
3. Создайте приложение типа "Сообщество"
4. Получите токен доступа
5. Настройте Callback API:
   - URL: `https://your-domain.vercel.app/webhook`
   - Типы событий: `message_new`

### 3. Настройка Supabase

Выполните SQL команды из файла `supabase/events_schema.sql` в Supabase SQL Editor.

## 🚀 Деплой

### Vercel (рекомендуется)

1. Установите Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Войдите в аккаунт:
   ```bash
   vercel login
   ```

3. Деплой:
   ```bash
   vercel
   ```

4. Настройте переменные окружения в Vercel Dashboard

### Другие платформы

- **Railway**: `railway deploy`
- **Render**: Подключите GitHub репозиторий
- **Heroku**: `git push heroku main`

## 📁 Структура проекта

```
vk-events-bot/
├── src/
│   ├── config/
│   │   └── database.js      # Конфигурация Supabase
│   ├── handlers/
│   │   └── messageHandler.js # Обработка сообщений
│   ├── keyboards/
│   │   └── keyboards.js     # Клавиатуры VK
│   ├── services/
│   │   ├── eventsService.js  # Работа с мероприятиями
│   │   ├── userService.js    # Управление пользователями
│   │   ├── notificationService.js # Уведомления
│   │   └── vkSetupService.js # Автонастройка ВК
│   └── index.js             # Основной файл
├── admin/
│   ├── index.html           # Админ-панель
│   └── setup.html           # Страница настройки
├── scripts/
│   └── setup-bot.js         # CLI настройка
├── supabase/
│   └── events_schema.sql    # SQL схема
├── package.json
├── vercel.json
└── README.md
```

## 🔧 API

### Уведомления
- `POST /api/broadcast` - Отправить всем пользователям
- `POST /api/notify-event/:eventId` - Отправить участникам мероприятия

### Данные
- `GET /api/stats` - Статистика
- `GET /api/users` - Список пользователей
- `GET /api/events` - Список мероприятий

### Админ-панель
- `GET /admin` - Веб-интерфейс управления
- `GET /admin/setup` - Автоматическая настройка бота

### Настройка бота
- `POST /api/setup-bot` - Автоматическая настройка бота
- `GET /api/setup-status/:groupId` - Проверить статус настройки
- `GET /api/group-info/:groupId` - Информация о группе

## 📱 Команды бота

- `/start` - Главное меню
- `/events` - Список мероприятий
- `/registrations` - Мои регистрации
- `/help` - Помощь

## 🧪 Тестирование

```bash
# Запуск тестового сервера
node test-server.js

# Проверка работы
curl http://localhost:3000
curl http://localhost:3000/admin
```

## 📝 Примеры использования

### Отправить уведомление всем пользователям
```bash
curl -X POST https://your-bot.vercel.app/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Важное уведомление",
    "message": "Завтра мероприятие переносится на 15:00"
  }'
```

### Отправить уведомление участникам мероприятия
```bash
curl -X POST https://your-bot.vercel.app/api/notify-event/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Напоминание",
    "message": "Не забудьте про мероприятие завтра в 18:00"
  }'
```

## 🐛 Устранение неполадок

1. **Ошибка "Cannot find module 'express'"**
   - Выполните `npm install`

2. **Ошибка "Missing Supabase configuration"**
   - Проверьте файл `.env` и переменные окружения

3. **Бот не отвечает на сообщения**
   - Проверьте настройки Callback API в ВК
   - Убедитесь, что webhook URL доступен

4. **Ошибки в админ-панели**
   - Проверьте, что сервер запущен
   - Убедитесь, что все API endpoints работают

## 📄 Лицензия

MIT License

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в правильности настроек
3. Создайте issue в репозитории

---

**Создано с ❤️ для управления мероприятиями через ВКонтакте**