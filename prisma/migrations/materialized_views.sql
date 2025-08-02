-- Materialized Views для оптимизации аналитики

-- 1. Статистика задач по статусам
CREATE MATERIALIZED VIEW IF NOT EXISTS task_status_stats AS
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as recent_count
FROM "Task"
WHERE "isArchived" = false
GROUP BY status;

-- 2. Статистика задач по приоритетам
CREATE MATERIALIZED VIEW IF NOT EXISTS task_priority_stats AS
SELECT 
  priority,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as recent_count
FROM "Task"
WHERE "isArchived" = false
GROUP BY priority;

-- 3. Статистика задач по типам сети
CREATE MATERIALIZED VIEW IF NOT EXISTS task_network_stats AS
SELECT 
  "networkType",
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as recent_count
FROM "Task"
WHERE "isArchived" = false
GROUP BY "networkType";

-- 4. Статистика задач по исполнителям
CREATE MATERIALIZED VIEW IF NOT EXISTS task_assignee_stats AS
SELECT 
  "assigneeId",
  u.name as assignee_name,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE t.status = 'COMPLETED') as completed_tasks,
  COUNT(*) FILTER (WHERE t.status IN ('IN_PROGRESS', 'REVIEW')) as in_progress_tasks,
  COUNT(*) FILTER (WHERE t."dueDate" < NOW() AND t.status != 'COMPLETED') as overdue_tasks
FROM "Task" t
LEFT JOIN "User" u ON t."assigneeId" = u.id
WHERE t."isArchived" = false AND t."assigneeId" IS NOT NULL
GROUP BY "assigneeId", u.name;

-- 5. Статистика задач по времени (последние 30 дней)
CREATE MATERIALIZED VIEW IF NOT EXISTS task_time_stats AS
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as created,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
FROM "Task"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date;

-- 6. Статистика пользователей
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
  department,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'WORKING') as working_users,
  COUNT(*) FILTER (WHERE status = 'ON_VACATION') as vacation_users,
  COUNT(*) FILTER (WHERE status = 'REMOTE') as remote_users
FROM "User"
GROUP BY department;

-- 7. Статистика уведомлений
CREATE MATERIALIZED VIEW IF NOT EXISTS notification_stats AS
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE read = false) as unread,
  COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days') as recent
FROM "Notification"
GROUP BY type;

-- 8. Статистика документов
CREATE MATERIALIZED VIEW IF NOT EXISTS document_stats AS
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as recent_count
FROM "Document"
GROUP BY type;

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_task_status_created ON "Task" (status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_task_priority_created ON "Task" (priority, "createdAt");
CREATE INDEX IF NOT EXISTS idx_task_network_created ON "Task" ("networkType", "createdAt");
CREATE INDEX IF NOT EXISTS idx_task_assignee_status ON "Task" ("assigneeId", status);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task" ("dueDate") WHERE "dueDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_user_type ON "Notification" ("userId", type);
CREATE INDEX IF NOT EXISTS idx_notification_created ON "Notification" ("createdAt");

-- Функция для обновления materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW task_status_stats;
  REFRESH MATERIALIZED VIEW task_priority_stats;
  REFRESH MATERIALIZED VIEW task_network_stats;
  REFRESH MATERIALIZED VIEW task_assignee_stats;
  REFRESH MATERIALIZED VIEW task_time_stats;
  REFRESH MATERIALIZED VIEW user_stats;
  REFRESH MATERIALIZED VIEW notification_stats;
  REFRESH MATERIALIZED VIEW document_stats;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления views при изменении данных
CREATE OR REPLACE FUNCTION trigger_refresh_views()
RETURNS trigger AS $$
BEGIN
  -- Обновляем views асинхронно
  PERFORM pg_notify('refresh_views', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для основных таблиц
DROP TRIGGER IF EXISTS trigger_task_changes ON "Task";
CREATE TRIGGER trigger_task_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Task"
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_views();

DROP TRIGGER IF EXISTS trigger_user_changes ON "User";
CREATE TRIGGER trigger_user_changes
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_views();

DROP TRIGGER IF EXISTS trigger_notification_changes ON "Notification";
CREATE TRIGGER trigger_notification_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Notification"
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_views();

DROP TRIGGER IF EXISTS trigger_document_changes ON "Document";
CREATE TRIGGER trigger_document_changes
  AFTER INSERT OR UPDATE OR DELETE ON "Document"
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_views(); 