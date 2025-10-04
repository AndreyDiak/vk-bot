-- Обновление схемы базы данных для поддержки количества участников
-- Выполните эти SQL команды в Supabase SQL Editor

-- Добавляем новые поля в таблицу регистраций
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS participants_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);

-- Обновляем существующие записи, устанавливая participants_count = 1 для всех существующих регистраций
UPDATE event_registrations 
SET participants_count = 1 
WHERE participants_count IS NULL;

-- Создаем индекс для производительности
CREATE INDEX IF NOT EXISTS idx_registrations_participants ON event_registrations(participants_count);
