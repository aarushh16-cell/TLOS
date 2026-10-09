import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, secret: process.env.AUTH_SECRET, providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string }
        })
        
        if (!user || user.password !== credentials.password) {
          throw new Error("Account not found. Only pre-registered teams or existing accounts can sign in.")
        }
        const team = await prisma.team.findUnique({ where: { userId: user.id } })

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          teamId: team?.id
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.teamId = user.teamId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.teamId = token.teamId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
})
