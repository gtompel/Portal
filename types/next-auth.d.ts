import type { DefaultSession } from "next-auth"

// Расширяем типы NextAuth для включения дополнительных полей пользователя
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      // А также все стандартные поля пользователя
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    // А также все стандартные поля пользователя
  }
}

