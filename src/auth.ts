import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";

const entraConfigured =
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, account }) {
      if (account?.provider) token.provider = account.provider;
      return token;
    },
    session({ session, token }) {
      if (typeof token.provider === "string") session.user.provider = token.provider;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username as string));
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: String(user.id), name: user.username };
      },
    }),
    ...(entraConfigured
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
          }),
        ]
      : []),
  ],
});

export const azureEnabled = !!entraConfigured;
