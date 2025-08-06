import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

export const runtime = "nodejs";

const handler = NextAuth({
  ...authOptions,
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier", 
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
});

export { handler as GET, handler as POST };
