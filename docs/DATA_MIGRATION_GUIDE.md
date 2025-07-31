# Руководство по миграции данных

## 🎯 Цель
Перенести данные из облачной базы Prisma Data Platform в локальную PostgreSQL базу данных.

## 📋 Предварительные требования

### 1. **Установить PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Скачать с https://www.postgresql.org/download/windows/
```

### 2. **Создать локальную базу данных**
```bash
# Подключиться к PostgreSQL
sudo -u postgres psql

# Создать пользователя и базу данных
CREATE USER portal_user WITH PASSWORD 'portal_password';
CREATE DATABASE portal_db OWNER portal_user;
GRANT ALL PRIVILEGES ON DATABASE portal_db TO portal_user;
\q
```

### 3. **Настроить переменные окружения**
Создать файл `.env` с настройками:
```env
# Локальная база данных
DATABASE_URL="postgresql://portal_user:portal_password@localhost:5432/portal_db"

# Облачная база данных (для экспорта)
CLOUD_DATABASE_URL="postgresql://...@accelerate.prisma-data.net"
```

## 🚀 Пошаговая миграция

### Шаг 1: Создать локальную схему
```bash
# Применить схему к локальной базе
npx prisma migrate dev --name init-local-database
```

### Шаг 2: Экспорт данных из облачной базы
```bash
# Экспортировать данные
node scripts/export-import-data.js export
```

**Что происходит:**
- ✅ Подключение к облачной базе
- ✅ Экспорт всех таблиц с связями
- ✅ Сохранение в файл `data-export.json`
- ✅ Показ статистики экспорта

### Шаг 3: Импорт данных в локальную базу
```bash
# Импортировать данные
node scripts/export-import-data.js import
```

**Что происходит:**
- ✅ Очистка локальной базы
- ✅ Импорт данных в правильном порядке
- ✅ Восстановление связей между таблицами
- ✅ Показ статистики импорта

### Шаг 4: Полный процесс (экспорт + импорт)
```bash
# Выполнить весь процесс сразу
node scripts/export-import-data.js full
```

## 📊 Что экспортируется/импортируется

### Основные таблицы:
- ✅ **Users** - пользователи с навыками, образованием, опытом
- ✅ **Tasks** - задачи с исполнителями и создателями
- ✅ **Projects** - проекты с участниками
- ✅ **Announcements** - объявления с авторами
- ✅ **Events** - события с участниками
- ✅ **Documents** - документы с создателями
- ✅ **Messages** - сообщения с вложениями
- ✅ **Comments** - комментарии с ответами
- ✅ **Notifications** - уведомления
- ✅ **Accounts** - аккаунты для аутентификации
- ✅ **Sessions** - сессии пользователей
- ✅ **VerificationTokens** - токены верификации
- ✅ **UserSkills** - навыки пользователей
- ✅ **Education** - образование пользователей
- ✅ **Experience** - опыт работы пользователей
- ✅ **ProjectMembers** - участники проектов
- ✅ **EventParticipants** - участники событий
- ✅ **MessageAttachments** - вложения к сообщениям
- ✅ **CommentLikes** - лайки комментариев
- ✅ **AnnouncementLikes** - лайки объявлений
- ✅ **TaskComments** - комментарии к задачам

### Связи и зависимости:
- ✅ **Foreign Keys** - все связи между таблицами
- ✅ **Nested Data** - вложенные данные (навыки, образование)
- ✅ **Many-to-Many** - связи многие-ко-многим
- ✅ **Hierarchical** - иерархические данные (комментарии)

## 🔍 Проверка миграции

### 1. **Проверить данные через Prisma Studio**
```bash
npx prisma studio
```

### 2. **Проверить API endpoints**
```bash
# Запустить приложение
npm run dev

# Проверить endpoints
curl http://localhost:3000/api/users
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/projects
```

### 3. **Проверить статистику**
```bash
# Посмотреть количество записей в каждой таблице
node scripts/export-import-data.js import
```

## 🛠️ Устранение проблем

### Ошибка подключения к облачной базе
```bash
# Проверить CLOUD_DATABASE_URL в .env
# Убедиться, что облачная база доступна
```

### Ошибка подключения к локальной базе
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
psql -h localhost -U portal_user -d portal_db
```

### Ошибка импорта данных
```bash
# Очистить локальную базу
npx prisma migrate reset

# Повторить импорт
node scripts/export-import-data.js import
```

### Большой объем данных
```bash
# Разбить экспорт на части
# Или использовать потоковую обработку
```

## 📝 Полезные команды

```bash
# Просмотр схемы
npx prisma db pull

# Открыть Prisma Studio
npx prisma studio

# Проверить статус миграций
npx prisma migrate status

# Сбросить базу данных
npx prisma migrate reset

# Генерировать клиент
npx prisma generate
```

## 🔄 Восстановление уведомлений

После успешной миграции восстановить уведомления:

```bash
# Раскомментировать код в app/api/notifications/route.ts
# Удалить временные решения
```

## ✅ Результат

После успешной миграции:
- ✅ **Локальная база данных** с полными данными
- ✅ **Нет лимитов** на запросы
- ✅ **Полная функциональность** приложения
- ✅ **Уведомления работают**
- ✅ **Быстрая разработка**

## 📁 Файлы

- `scripts/export-import-data.js` - скрипт миграции
- `data-export.json` - экспортированные данные
- `docs/DATA_MIGRATION_GUIDE.md` - это руководство 