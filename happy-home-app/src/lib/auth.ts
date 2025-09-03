import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { Adapter } from 'next-auth/adapters'
import bcrypt from 'bcryptjs'

// UserRole enum type from Prisma schema
type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER'

declare module "next-auth" {
  interface User {
    role: UserRole;
    id?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email with raw SQL to ensure we get the password field
        const users = await prisma.$queryRaw`
          SELECT * FROM users WHERE email = ${credentials.email}
        `
        
        // Convert result to user object
        const user = Array.isArray(users) && users.length > 0 ? users[0] : null

        // Check if user exists and is active
        if (user && user.isActive) {
          // Check if user has a password set
          if (user.password) {
            // Compare password using bcrypt
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
              }
            }
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) || (token.sub as string)
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt'
  }
}