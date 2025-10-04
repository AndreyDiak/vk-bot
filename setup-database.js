#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log("🗄️  Настройка базы данных...");

    // Создаем таблицы по одной
    const tables = [
      {
        name: "users",
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            vk_user_id INTEGER UNIQUE NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            username VARCHAR(255),
            photo_url TEXT,
            phone VARCHAR(20),
            email VARCHAR(255),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "events",
        sql: `
          CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            location VARCHAR(255),
            max_participants INTEGER,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "event_registrations",
        sql: `
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
        `,
      },
      {
        name: "notifications",
        sql: `
          CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            title VARCHAR(255),
            message TEXT NOT NULL,
            is_sent BOOLEAN DEFAULT false,
            sent_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
    ];

    // Создаем каждую таблицу
    for (const table of tables) {
      console.log(`📋 Создание таблицы: ${table.name}`);

      const { error } = await supabase.rpc("exec", { sql: table.sql });

      if (error) {
        console.log(
          `⚠️  Таблица ${table.name} уже существует или ошибка:`,
          error.message
        );
      } else {
        console.log(`✅ Таблица ${table.name} создана успешно`);
      }
    }

    console.log("✅ Настройка базы данных завершена!");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  }
}

setupDatabase();
