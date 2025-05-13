import { DefaultSession } from "next-auth";
import { AdapterUser } from "next-auth/adapters";

declare module "next-auth" {
  interface User extends AdapterUser {
    role: string; // Обязательно указываем, что role есть
  }

  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends User {
    role: string;
  }
}
