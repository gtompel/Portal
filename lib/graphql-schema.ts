// Базовая GraphQL схема для оптимизации запросов
export const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    position: String!
    department: String!
    avatar: String
    initials: String!
    status: UserStatus!
    tasks: [Task!]
    createdTasks: [Task!]
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    networkType: NetworkType!
    dueDate: String
    taskNumber: Int
    assignee: User
    creator: User!
    createdAt: String!
    updatedAt: String!
    isArchived: Boolean!
  }

  type Notification {
    id: ID!
    type: NotificationType!
    read: Boolean!
    createdAt: String!
    event: Event
    task: Task
    message: Message
    announcement: Announcement
  }

  type Event {
    id: ID!
    title: String!
    description: String
    date: String!
    startTime: String!
    endTime: String!
    location: String
    type: EventType!
    creator: User!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    receiver: User!
    read: Boolean!
    createdAt: String!
  }

  type Announcement {
    id: ID!
    title: String!
    content: String!
    category: AnnouncementCategory!
    author: User!
    createdAt: String!
  }

  enum UserStatus {
    WORKING
    ON_VACATION
    REMOTE
  }

  enum TaskStatus {
    NEW
    IN_PROGRESS
    REVIEW
    COMPLETED
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
  }

  enum NetworkType {
    EMVS
    INTERNET
    ASZI
  }

  enum NotificationType {
    EVENT
    TASK
    MESSAGE
    ANNOUNCEMENT
  }

  enum EventType {
    MEETING
    DEADLINE
    HOLIDAY
    VACATION
  }

  enum AnnouncementCategory {
    IMPORTANT
    NEWS
    EVENT
  }

  type Query {
    users(department: String, search: String): [User!]!
    user(id: ID!): User
    tasks(status: TaskStatus, assigneeId: ID, showArchived: Boolean): [Task!]!
    task(id: ID!): Task
    notifications(userId: ID!): [Notification!]!
    events: [Event!]!
    announcements: [Announcement!]!
    messages(userId: ID!): [Message!]!
    analytics(period: String): Analytics!
  }

  type Analytics {
    overview: OverviewStats!
    details: DetailStats!
    current: CurrentData!
  }

  type OverviewStats {
    tasks: TaskStats!
    documents: DocumentStats!
    announcements: AnnouncementStats!
    users: UserStats!
  }

  type TaskStats {
    total: Int!
    completed: Int!
    inProgress: Int!
    new: Int!
    overdue: Int!
    completionRate: Float!
    averageCompletionTime: Int!
  }

  type DocumentStats {
    total: Int!
    byType: [DocumentTypeCount!]!
  }

  type DocumentTypeCount {
    type: String!
    count: Int!
  }

  type AnnouncementStats {
    total: Int!
  }

  type UserStats {
    total: Int!
  }

  type DetailStats {
    tasksByStatus: [StatusCount!]!
    tasksByPriority: [PriorityCount!]!
    tasksByNetwork: [NetworkCount!]!
    tasksByAssignee: [AssigneeStats!]!
    tasksOverTime: [TimeStats!]!
  }

  type StatusCount {
    name: String!
    value: Int!
    color: String!
  }

  type PriorityCount {
    name: String!
    value: Int!
    color: String!
  }

  type NetworkCount {
    name: String!
    value: Int!
    color: String!
  }

  type AssigneeStats {
    name: String!
    fullName: String!
    completed: Int!
    inProgress: Int!
    overdue: Int!
    total: Int!
  }

  type TimeStats {
    date: String!
    created: Int!
    completed: Int!
  }

  type CurrentData {
    overdueTasks: [Task!]!
    upcomingTasks: [Task!]!
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    markNotificationsRead(notificationIds: [ID!], markAll: Boolean): Boolean!
    createNotification(input: CreateNotificationInput!): Notification!
  }

  input CreateTaskInput {
    title: String!
    description: String
    status: TaskStatus
    priority: TaskPriority
    networkType: NetworkType
    dueDate: String
    assigneeId: ID
    creatorId: ID!
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: TaskPriority
    networkType: NetworkType
    dueDate: String
    assigneeId: ID
    isArchived: Boolean
  }

  input CreateNotificationInput {
    type: NotificationType!
    userId: ID!
    eventId: ID
    taskId: ID
    messageId: ID
    announcementId: ID
  }
` 