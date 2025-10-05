-- Добавление поля team_name в таблицу регистраций
-- Выполните эти SQL команды в Supabase SQL Editor

-- Добавляем поле team_name в таблицу регистраций
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);

-- Создаем индекс для производительности
CREATE INDEX IF NOT EXISTS idx_registrations_team_name ON event_registrations(team_name);

-- Обновляем существующие записи, устанавливая team_name = NULL для всех существующих регистраций
UPDATE event_registrations 
SET team_name = NULL 
WHERE team_name IS NULL;
