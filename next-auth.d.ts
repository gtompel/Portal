
import { DefaultSession } from "next-auth";
import { AdapterUser } from "next-auth/adapters";

interface UserRole {
    role: string;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"]
    }

    interface User extends UserRole, AdapterUser {}
}

declare module "next-auth/adapters" {
    interface AdapterUser extends UserRole {
    }
}
