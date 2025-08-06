import type { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 часов
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    newUser: "/auth/register",
  },
  cookies: (() => {
    const url = process.env.NEXTAUTH_URL || '';
    const host = url.replace(/^https?:\/\//, '').split(':')[0];
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isHTTPS = url.startsWith('https://');
    
    // Для IP адресов и localhost используем обычную куку
    if (isIP || isLocalhost) {
      return {
        sessionToken: {
          name: 'next-auth.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: false
          }
        }
      };
    }
    
    // Для production доменов используем Secure куку
    return {
      sessionToken: {
        name: '__Secure-next-auth.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: isHTTPS,
          domain: host
        }
      }
    };
  })(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }

          console.log('✅ User found:', { id: user.id, email: user.email })

          const passwordMatch = await compare(credentials.password || '', user.password)

          if (!passwordMatch) {
            console.log('❌ Password mismatch for:', credentials.email)
            return null
          }

          console.log('✅ Password verified for:', credentials.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.position,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Если URL относительный или начинается с baseUrl - разрешаем
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url
      }
      // Если URL начинается с http://localhost или http://172.16.10.245 - разрешаем
      if (url.startsWith('http://localhost') || url.startsWith('http://172.16.10.245')) {
        return url
      }
      // По умолчанию возвращаем на главную
      return baseUrl
    },
  },
}
