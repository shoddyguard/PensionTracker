import type { NextAuthConfig } from "next-auth";

// Edge-compatible config - no Node.js-only imports (no db, no bcrypt).
// Used by middleware to verify the session JWT without hitting the database.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
  },
};
