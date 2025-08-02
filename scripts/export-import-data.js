#!/usr/bin/env node

/**
 * Скрипт для экспорта данных из облачной базы и импорта в локальную
 * Использование: node scripts/export-import-data.js
 */

// Загружаем переменные окружения
require('dotenv').config();

// Проверяем, есть ли DATABASE_URL в аргументах командной строки
const useLocalDb = process.argv.includes('--local-db');

const fs = require('fs');
const path = require('path');

// Конфигурация
const DATABASE_URL = process.env.DATABASE_URL;
const EXPORT_FILE = path.join(__dirname, '../data-export.json');

// Проверяем наличие DATABASE_URL только для экспорта
if (process.argv[2] === 'export' && !DATABASE_URL) {
  console.error('❌ Ошибка: DATABASE_URL не установлен в переменных окружения');
  process.exit(1);
}

async function exportData() {
  console.log('🔄 Экспорт данных из облачной базы...');
  
  // Используем DATABASE_URL из переменных окружения
  // Преобразуем prisma+postgres:// в prisma:// для совместимости
  const prismaUrl = DATABASE_URL.replace('prisma+postgres://', 'prisma://');
  process.env.DATABASE_URL = prismaUrl;
  
  const { PrismaClient } = require('@prisma/client');
  const cloudPrisma = new PrismaClient();
  
  try {
    const data = {
      users: [],
      tasks: [],
      projects: [],
      announcements: [],
      events: [],
      documents: [],
      messages: [],
      notifications: [],
      comments: [],
      accounts: [],
      sessions: [],
      verificationTokens: [],
      userSkills: [],
      education: [],
      experience: [],
      projectMembers: [],
      eventParticipants: [],
      messageAttachments: [],
      commentLikes: [],
      announcementLikes: [],
      taskComments: [],
    };

    // Экспортируем данные по таблицам
    console.log('📊 Экспорт пользователей...');
    data.users = await cloudPrisma.user.findMany({
      include: {
        skills: true,
        education: true,
        experience: true,
        projects: true,
      }
    });

    console.log('📊 Экспорт задач...');
    data.tasks = await cloudPrisma.task.findMany({
      include: {
        assignee: true,
        creator: true,
      }
    });

    console.log('📊 Экспорт проектов...');
    data.projects = await cloudPrisma.project.findMany({
      include: {
        members: {
          include: {
            user: true,
          }
        }
      }
    });

    console.log('📊 Экспорт объявлений...');
    data.announcements = await cloudPrisma.announcement.findMany({
      include: {
        author: true,
      }
    });

    console.log('📊 Экспорт событий...');
    data.events = await cloudPrisma.event.findMany({
      include: {
        creator: true,
        participants: {
          include: {
            user: true,
          }
        }
      }
    });

    console.log('📊 Экспорт документов...');
    data.documents = await cloudPrisma.document.findMany({
      include: {
        creator: true,
      }
    });

    console.log('📊 Экспорт сообщений...');
    data.messages = await cloudPrisma.message.findMany({
      include: {
        sender: true,
        receiver: true,
        attachments: true,
      }
    });

    console.log('📊 Экспорт уведомлений...');
    data.notifications = await cloudPrisma.notification.findMany({
      include: {
        user: true,
        event: true,
        task: true,
        message: true,
        announcement: true,
      }
    });

    console.log('📊 Экспорт комментариев...');
    data.comments = await cloudPrisma.comment.findMany({
      include: {
        author: true,
        replies: {
          include: {
            author: true,
          }
        }
      }
    });

    console.log('📊 Экспорт аккаунтов...');
    data.accounts = await cloudPrisma.account.findMany();

    console.log('📊 Экспорт сессий...');
    data.sessions = await cloudPrisma.session.findMany();

    console.log('📊 Экспорт токенов верификации...');
    data.verificationTokens = await cloudPrisma.verificationToken.findMany();

    console.log('📊 Экспорт навыков пользователей...');
    data.userSkills = await cloudPrisma.userSkill.findMany({
      include: {
        user: true,
      }
    });

    console.log('📊 Экспорт образования...');
    data.education = await cloudPrisma.education.findMany({
      include: {
        user: true,
      }
    });

    console.log('📊 Экспорт опыта работы...');
    data.experience = await cloudPrisma.experience.findMany({
      include: {
        user: true,
      }
    });

    console.log('📊 Экспорт участников проектов...');
    data.projectMembers = await cloudPrisma.projectMember.findMany({
      include: {
        user: true,
        project: true,
      }
    });

    console.log('📊 Экспорт участников событий...');
    data.eventParticipants = await cloudPrisma.eventParticipant.findMany({
      include: {
        user: true,
        event: true,
      }
    });

    console.log('📊 Экспорт вложений сообщений...');
    data.messageAttachments = await cloudPrisma.messageAttachment.findMany({
      include: {
        message: true,
      }
    });

    console.log('📊 Экспорт лайков комментариев...');
    data.commentLikes = await cloudPrisma.commentLike.findMany({
      include: {
        user: true,
        comment: true,
      }
    });

    console.log('📊 Экспорт лайков объявлений...');
    data.announcementLikes = await cloudPrisma.announcementLike.findMany({
      include: {
        user: true,
        announcement: true,
      }
    });

    console.log('📊 Экспорт комментариев к задачам...');
    data.taskComments = await cloudPrisma.taskComment.findMany({
      include: {
        task: true,
      }
    });

    // Сохраняем данные в файл
    fs.writeFileSync(EXPORT_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Данные экспортированы в ${EXPORT_FILE}`);
    
    // Статистика
    console.log('\n📈 Статистика экспорта:');
    Object.entries(data).forEach(([table, records]) => {
      console.log(`  ${table}: ${records.length} записей`);
    });

  } catch (error) {
    console.error('❌ Ошибка при экспорте:', error);
  } finally {
    await cloudPrisma.$disconnect();
  }
}

async function importData() {
  console.log('🔄 Импорт данных в локальную базу...');
  
  // Проверяем наличие файла экспорта
  if (!fs.existsSync(EXPORT_FILE)) {
    console.error('❌ Файл экспорта не найден. Сначала выполните экспорт.');
    return;
  }

  // Сохраняем оригинальный DATABASE_URL
  const originalDatabaseUrl = process.env.DATABASE_URL;
  
  // Подключаемся к локальной базе только если указан флаг
  if (useLocalDb) {
    // Используем DATABASE_URL напрямую, так как он уже настроен на локальную базу
    console.log('📊 Используем локальную базу данных');
  }
  
  const { PrismaClient } = require('@prisma/client');
  const localPrisma = new PrismaClient();
  
  try {
    const data = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
    
    console.log('🗑️ Очистка локальной базы...');
    // Очищаем таблицы в правильном порядке (из-за foreign keys)
    await localPrisma.notification.deleteMany();
    await localPrisma.commentLike.deleteMany();
    await localPrisma.announcementLike.deleteMany();
    await localPrisma.taskComment.deleteMany();
    await localPrisma.comment.deleteMany();
    await localPrisma.messageAttachment.deleteMany();
    await localPrisma.message.deleteMany();
    await localPrisma.eventParticipant.deleteMany();
    await localPrisma.event.deleteMany();
    await localPrisma.document.deleteMany();
    await localPrisma.task.deleteMany();
    await localPrisma.projectMember.deleteMany();
    await localPrisma.project.deleteMany();
    await localPrisma.userSkill.deleteMany();
    await localPrisma.education.deleteMany();
    await localPrisma.experience.deleteMany();
    await localPrisma.announcement.deleteMany();
    await localPrisma.account.deleteMany();
    await localPrisma.session.deleteMany();
    await localPrisma.verificationToken.deleteMany();
    await localPrisma.user.deleteMany();

    console.log('📥 Импорт пользователей...');
    const userMap = new Map(); // Для отслеживания старых и новых ID
    
    for (const user of data.users) {
      const { skills, education, experience, projects, ...userData } = user;
      const oldId = userData.id;
      
      // Очищаем поля, которые могут содержать несуществующие ссылки
      const cleanUserData = {
        ...userData,
        id: undefined, // Позволяем базе данных генерировать новый ID
        managerId: undefined, // Временно убираем ссылку на менеджера
        createdAt: undefined,
        updatedAt: undefined,
      };
      
      const createdUser = await localPrisma.user.create({
        data: cleanUserData
      });
      
      // Сохраняем соответствие старых и новых ID
      userMap.set(oldId, createdUser.id);
    }
    
    // Обновляем связи менеджеров
    console.log('📥 Обновление связей менеджеров...');
    for (const user of data.users) {
      if (user.managerId && userMap.has(user.managerId)) {
        const newUserId = userMap.get(user.id);
        const newManagerId = userMap.get(user.managerId);
        
        await localPrisma.user.update({
          where: { id: newUserId },
          data: { managerId: newManagerId }
        });
      }
    }

    console.log('📥 Импорт проектов...');
    const projectMap = new Map(); // Для отслеживания старых и новых ID проектов
    for (const project of data.projects) {
      const { members, ...projectData } = project;
      const cleanProjectData = {
        ...projectData,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      const createdProject = await localPrisma.project.create({
        data: cleanProjectData
      });
      projectMap.set(project.id, createdProject.id); // Сохраняем соответствие старых и новых ID проектов
    }

    console.log('📥 Импорт объявлений...');
    const announcementMap = new Map();
    for (const announcement of data.announcements) {
      const { author, ...announcementData } = announcement;
      const cleanAnnouncementData = {
        ...announcementData,
        id: undefined,
        authorId: userMap.has(announcement.authorId) ? userMap.get(announcement.authorId) : undefined,
        createdAt: undefined,
        updatedAt: undefined,
        likes: undefined,
        comments: undefined,
      };
      const createdAnnouncement = await localPrisma.announcement.create({
        data: cleanAnnouncementData
      });
      announcementMap.set(announcement.id, createdAnnouncement.id);
    }

    console.log('📥 Импорт задач...');
    const taskMap = new Map();
    for (const task of data.tasks) {
      const { assignee, creator, ...taskData } = task;
      const cleanTaskData = {
        ...taskData,
        id: undefined,
        assigneeId: userMap.has(task.assigneeId) ? userMap.get(task.assigneeId) : undefined,
        creatorId: userMap.has(task.creatorId) ? userMap.get(task.creatorId) : undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      const createdTask = await localPrisma.task.create({
        data: cleanTaskData
      });
      taskMap.set(task.id, createdTask.id);
    }

    // Импорт событий
    console.log('📥 Импорт событий...');
    const eventMap = new Map();
    for (const event of data.events) {
      const { participants, creator, ...eventData } = event;
      const cleanEventData = {
        ...eventData,
        id: undefined,
        creatorId: userMap.has(event.creatorId) ? userMap.get(event.creatorId) : undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      const createdEvent = await localPrisma.event.create({
        data: cleanEventData
      });
      eventMap.set(event.id, createdEvent.id);
    }

    console.log('📥 Импорт документов...');
    for (const document of data.documents) {
      const { creator, ...documentData } = document;
      const cleanDocumentData = {
        ...documentData,
        id: undefined,
        creatorId: userMap.has(document.creatorId) ? userMap.get(document.creatorId) : undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      await localPrisma.document.create({
        data: cleanDocumentData
      });
    }

    console.log('📥 Импорт сообщений...');
    for (const message of data.messages) {
      const { attachments, ...messageData } = message;
      const createdMessage = await localPrisma.message.create({
        data: messageData
      });
      
      // Импортируем вложения
      for (const attachment of attachments) {
        await localPrisma.messageAttachment.create({
          data: {
            ...attachment,
            messageId: createdMessage.id,
          }
        });
      }
    }

    console.log('📥 Импорт комментариев...');
    const createdCommentIds = new Map();
    let remaining = [...data.comments];
    let added;
    do {
      added = 0;
      const next = [];
      for (const comment of remaining) {
        const { replies, author, ...commentData } = comment;
        if (!userMap.has(comment.authorId)) continue;
        // Используем новые id для announcementId и taskId
        const newAnnouncementId = comment.announcementId ? announcementMap.get(comment.announcementId) : undefined;
        const newTaskId = comment.taskId ? taskMap.get(comment.taskId) : undefined;
        if (comment.announcementId && !newAnnouncementId) continue;
        if (comment.taskId && !newTaskId) continue;
        if (comment.parentId && !createdCommentIds.has(comment.parentId)) {
          next.push(comment);
          continue;
        }
        const cleanCommentData = {
          ...commentData,
          id: undefined,
          authorId: userMap.get(comment.authorId),
          parentId: comment.parentId ? createdCommentIds.get(comment.parentId) : undefined,
          announcementId: newAnnouncementId,
          taskId: newTaskId,
          createdAt: undefined,
          updatedAt: undefined,
          likesCount: undefined,
        };
        const createdComment = await localPrisma.comment.create({
          data: cleanCommentData
        });
        createdCommentIds.set(comment.id, createdComment.id);
        added++;
      }
      remaining = next;
    } while (added > 0 && remaining.length > 0);
    if (remaining.length > 0) {
      console.log(`⚠️ Пропущено ${remaining.length} комментариев из-за отсутствия валидных parentId/authorId/announcementId/taskId`);
    }
    // replies импортируются как обычные комментарии, т.к. replies — это просто комментарии с parentId

    // Импорт уведомлений
    console.log('📥 Импорт уведомлений...');
    const messageMap = new Map();
    for (const message of data.messages) {
      if (message.id) messageMap.set(message.id, message.id); // dummy, не используется напрямую
    }
    for (const notification of data.notifications) {
      const { user, task, event, message, announcement, ...notificationData } = notification;
      const newUserId = userMap.get(notification.userId);
      const newTaskId = notification.taskId ? taskMap.get(notification.taskId) : undefined;
      const newAnnouncementId = notification.announcementId ? announcementMap.get(notification.announcementId) : undefined;
      // eventId и messageId не используются, если нужны — аналогично
      if (!newUserId) continue;
      if (notification.taskId && !newTaskId) continue;
      if (notification.announcementId && !newAnnouncementId) continue;
      const cleanNotificationData = {
        ...notificationData,
        id: undefined,
        userId: newUserId,
        taskId: newTaskId,
        announcementId: newAnnouncementId,
        createdAt: undefined,
        updatedAt: undefined,
      };
      await localPrisma.notification.create({
        data: cleanNotificationData
      });
    }

    console.log('📥 Импорт навыков пользователей...');
    for (const user of data.users) {
      if (user.skills) {
        for (const skill of user.skills) {
          await localPrisma.userSkill.create({
            data: {
              ...skill,
              userId: user.id,
            }
          });
        }
      }
    }

    console.log('📥 Импорт образования...');
    for (const user of data.users) {
      if (user.education) {
        for (const edu of user.education) {
          if (!userMap.has(user.id)) continue;
          await localPrisma.education.create({
            data: {
              ...edu,
              id: undefined,
              userId: userMap.get(user.id),
              createdAt: undefined,
              updatedAt: undefined,
            }
          });
        }
      }
    }

    console.log('📥 Импорт опыта работы...');
    for (const user of data.users) {
      if (user.experience) {
        for (const exp of user.experience) {
          if (!userMap.has(user.id)) continue;
          await localPrisma.experience.create({
            data: {
              ...exp,
              id: undefined,
              userId: userMap.get(user.id),
              createdAt: undefined,
              updatedAt: undefined,
            }
          });
        }
      }
    }

    console.log('📥 Импорт аккаунтов...');
    for (const account of data.accounts) {
      await localPrisma.account.create({
        data: account
      });
    }

    console.log('📥 Импорт сессий...');
    for (const session of data.sessions) {
      await localPrisma.session.create({
        data: session
      });
    }

    console.log('📥 Импорт токенов верификации...');
    for (const token of data.verificationTokens) {
      await localPrisma.verificationToken.create({
        data: token
      });
    }

    console.log('📥 Импорт участников проектов...');
    for (const member of data.projectMembers) {
      const newUserId = userMap.get(member.userId);
      const newProjectId = projectMap ? projectMap.get(member.projectId) : undefined;
      if (!newUserId || !newProjectId) continue;
      await localPrisma.projectMember.create({
        data: {
          projectId: newProjectId,
          userId: newUserId,
          role: member.role,
        }
      });
    }

    console.log('📥 Импорт участников событий...');
    for (const participant of data.eventParticipants) {
      const newUserId = userMap.get(participant.userId);
      const newEventId = eventMap ? eventMap.get(participant.eventId) : undefined;
      if (!newUserId || !newEventId) continue;
      await localPrisma.eventParticipant.create({
        data: {
          eventId: newEventId,
          userId: newUserId,
          status: participant.status,
        }
      });
    }

    console.log('📥 Импорт вложений сообщений...');
    for (const attachment of data.messageAttachments) {
      await localPrisma.messageAttachment.create({
        data: {
          name: attachment.name,
          url: attachment.url,
          type: attachment.type,
          messageId: attachment.messageId,
        }
      });
    }

    console.log('📥 Импорт лайков комментариев...');
    for (const like of data.commentLikes) {
      const newUserId = userMap.get(like.userId);
      const newCommentId = createdCommentIds.get(like.commentId);
      if (!newUserId || !newCommentId) continue;
      await localPrisma.commentLike.create({
        data: {
          userId: newUserId,
          commentId: newCommentId,
        }
      });
    }

    console.log('📥 Импорт лайков объявлений...');
    for (const like of data.announcementLikes) {
      const newUserId = userMap.get(like.userId);
      const newAnnouncementId = announcementMap.get(like.announcementId);
      if (!newUserId || !newAnnouncementId) continue;
      await localPrisma.announcementLike.create({
        data: {
          userId: newUserId,
          announcementId: newAnnouncementId,
        }
      });
    }

    console.log('📥 Импорт комментариев к задачам...');
    for (const taskComment of data.taskComments) {
      await localPrisma.taskComment.create({
        data: {
          content: taskComment.content,
          taskId: taskComment.taskId,
        }
      });
    }

    console.log('✅ Импорт завершен успешно!');
    
    // Статистика импорта
    console.log('\n📈 Статистика импорта:');
    const stats = await Promise.all([
      localPrisma.user.count(),
      localPrisma.task.count(),
      localPrisma.project.count(),
      localPrisma.announcement.count(),
      localPrisma.event.count(),
      localPrisma.document.count(),
      localPrisma.message.count(),
      localPrisma.notification.count(),
      localPrisma.comment.count(),
      localPrisma.account.count(),
      localPrisma.session.count(),
      localPrisma.verificationToken.count(),
      localPrisma.userSkill.count(),
      localPrisma.education.count(),
      localPrisma.experience.count(),
      localPrisma.projectMember.count(),
      localPrisma.eventParticipant.count(),
      localPrisma.messageAttachment.count(),
      localPrisma.commentLike.count(),
      localPrisma.announcementLike.count(),
      localPrisma.taskComment.count(),
    ]);
    
    const tables = [
      'users', 'tasks', 'projects', 'announcements', 'events', 'documents', 
      'messages', 'notifications', 'comments', 'accounts', 'sessions', 
      'verificationTokens', 'userSkills', 'education', 'experience', 
      'projectMembers', 'eventParticipants', 'messageAttachments', 
      'commentLikes', 'announcementLikes', 'taskComments'
    ];
    tables.forEach((table, index) => {
      console.log(`  ${table}: ${stats[index]} записей`);
    });

  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
  } finally {
    await localPrisma.$disconnect();
    // Восстанавливаем оригинальный DATABASE_URL
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'export':
      await exportData();
      break;
    case 'import':
      await importData();
      break;
    case 'full':
      console.log('🔄 Полный процесс экспорта и импорта...');
      await exportData();
      await importData();
      break;
    default:
      console.log(`
📋 Использование: node scripts/export-import-data.js [команда]

Команды:
  export  - Экспорт данных из облачной базы
  import  - Импорт данных в локальную базу
  full    - Полный процесс экспорта и импорта

Примеры:
  node scripts/export-import-data.js export
  node scripts/export-import-data.js import
  node scripts/export-import-data.js full
      `);
  }
}

main().catch(console.error); 