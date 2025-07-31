#!/usr/bin/env node

/**
 * Скрипт для экспорта данных из облачной базы и импорта в локальную
 * Использование: node scripts/export-import-data.js
 */

const fs = require('fs');
const path = require('path');

// Конфигурация
const CLOUD_DATABASE_URL = process.env.DATABASE_URL || "prisma+postgres://accelerate.prisma-data.net/?api_key=....";
const LOCAL_DATABASE_URL = "postgresql://portal_user:portal_password@localhost:5432/portal_db";
const EXPORT_FILE = path.join(__dirname, '../data-export.json');

async function exportData() {
  console.log('🔄 Экспорт данных из облачной базы...');
  
  // Временно подключаемся к облачной базе
  process.env.DATABASE_URL = CLOUD_DATABASE_URL;
  
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

  // Подключаемся к локальной базе
  process.env.DATABASE_URL = LOCAL_DATABASE_URL;
  
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
    for (const user of data.users) {
      const { skills, education, experience, projects, ...userData } = user;
      await localPrisma.user.create({
        data: userData
      });
    }

    console.log('📥 Импорт проектов...');
    for (const project of data.projects) {
      const { members, ...projectData } = project;
      const createdProject = await localPrisma.project.create({
        data: projectData
      });
      
      // Импортируем участников проекта
      for (const member of members) {
        await localPrisma.projectMember.create({
          data: {
            projectId: createdProject.id,
            userId: member.userId,
            role: member.role,
          }
        });
      }
    }

    console.log('📥 Импорт задач...');
    for (const task of data.tasks) {
      await localPrisma.task.create({
        data: task
      });
    }

    console.log('📥 Импорт объявлений...');
    for (const announcement of data.announcements) {
      await localPrisma.announcement.create({
        data: announcement
      });
    }

    console.log('📥 Импорт событий...');
    for (const event of data.events) {
      const { participants, ...eventData } = event;
      const createdEvent = await localPrisma.event.create({
        data: eventData
      });
      
      // Импортируем участников события
      for (const participant of participants) {
        await localPrisma.eventParticipant.create({
          data: {
            eventId: createdEvent.id,
            userId: participant.userId,
            status: participant.status,
          }
        });
      }
    }

    console.log('📥 Импорт документов...');
    for (const document of data.documents) {
      await localPrisma.document.create({
        data: document
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
    for (const comment of data.comments) {
      const { replies, ...commentData } = comment;
      const createdComment = await localPrisma.comment.create({
        data: commentData
      });
      
      // Импортируем ответы на комментарии
      for (const reply of replies) {
        await localPrisma.comment.create({
          data: {
            ...reply,
            parentId: createdComment.id,
          }
        });
      }
    }

    console.log('📥 Импорт уведомлений...');
    for (const notification of data.notifications) {
      await localPrisma.notification.create({
        data: notification
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
          await localPrisma.education.create({
            data: {
              ...edu,
              userId: user.id,
            }
          });
        }
      }
    }

    console.log('📥 Импорт опыта работы...');
    for (const user of data.users) {
      if (user.experience) {
        for (const exp of user.experience) {
          await localPrisma.experience.create({
            data: {
              ...exp,
              userId: user.id,
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
      await localPrisma.projectMember.create({
        data: {
          projectId: member.projectId,
          userId: member.userId,
          role: member.role,
        }
      });
    }

    console.log('📥 Импорт участников событий...');
    for (const participant of data.eventParticipants) {
      await localPrisma.eventParticipant.create({
        data: {
          eventId: participant.eventId,
          userId: participant.userId,
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
      await localPrisma.commentLike.create({
        data: {
          userId: like.userId,
          commentId: like.commentId,
        }
      });
    }

    console.log('📥 Импорт лайков объявлений...');
    for (const like of data.announcementLikes) {
      await localPrisma.announcementLike.create({
        data: {
          userId: like.userId,
          announcementId: like.announcementId,
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