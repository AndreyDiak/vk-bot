-- Схема базы данных для мероприятий
-- Выполните эти SQL команды в Supabase SQL Editor

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  vk_user_id INTEGER UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100),
  photo_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица мероприятий
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица регистраций
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  participants_count INTEGER DEFAULT 1,
  user_name VARCHAR(255),
  user_phone VARCHAR(20),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'general',
  target_event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users(vk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(target_event_id);

-- RLS (Row Level Security) политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update users" ON users
  FOR UPDATE USING (true);

-- Политики для чтения мероприятий (все могут читать)
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

-- Политики для регистраций (пользователи могут управлять своими регистрациями)
CREATE POLICY "Users can view their own registrations" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own registrations" ON event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own registrations" ON event_registrations
  FOR DELETE USING (true);

-- Политики для уведомлений
CREATE POLICY "Anyone can view notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update notifications" ON notifications
  FOR UPDATE USING (true);

-- Вставка тестовых данных
INSERT INTO events (name, description, event_date, location, max_participants) VALUES
('Встреча разработчиков', 'Еженедельная встреча для обсуждения проектов', NOW() + INTERVAL '7 days', 'Офис, 3 этаж', 20),
('Мастер-класс по React', 'Изучаем современные возможности React 18', NOW() + INTERVAL '14 days', 'Конференц-зал', 15),
('Hackathon 2024', '48-часовой марафон программирования', NOW() + INTERVAL '30 days', 'IT-парк', 50),
('Лекция по AI', 'Введение в машинное обучение', NOW() + INTERVAL '21 days', 'Аудитория 101', 30);
