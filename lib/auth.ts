import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import jwt from "jsonwebtoken";

// Function to generate Apple client secret JWT
function generateAppleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;
  const keyId = process.env.APPLE_KEY_ID!;

  // Process the private key - ensure it's in the correct format for ES256
  let privateKey = process.env.APPLE_PRIVATE_KEY!;

  // Handle different private key formats
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    // If it's just the key content without PEM headers, add them
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.replace(
      /\\n/g,
      "\n"
    )}\n-----END PRIVATE KEY-----`;
  } else {
    // If it already has PEM headers, just fix newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 180, // 180 days (max 6 months)
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  try {
    return jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      keyid: keyId,
    });
  } catch (error) {
    console.error("Error generating Apple client secret:", error);
    throw new Error(
      "Failed to generate Apple client secret. Check your APPLE_PRIVATE_KEY format."
    );
  }
}

// Cache for the generated client secret
let cachedClientSecret: string | null = null;
let secretExpiry: number | null = null;

// Function to get Apple client secret with caching
function getAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);

  // Check if we have a cached secret that's still valid (with 1 day buffer)
  if (cachedClientSecret && secretExpiry && now < secretExpiry - 86400) {
    return cachedClientSecret;
  }

  // Generate new secret
  cachedClientSecret = generateAppleClientSecret();
  secretExpiry = Math.floor(Date.now() / 1000) + 3600 * 24 * 180;

  console.log(
    `Generated new Apple client secret, expires in ${Math.floor(
      (secretExpiry - now) / 86400
    )} days`
  );

  return cachedClientSecret;
}

// Pre-generate the Apple client secret to avoid delays during authentication
function initializeAppleClientSecret() {
  try {
    // Generate the secret immediately when the module loads
    const secret = getAppleClientSecret();
    console.log("Apple client secret pre-generated successfully");
    return secret;
  } catch (error) {
    console.error("Failed to pre-generate Apple client secret:", error);
    // Return a fallback that will generate on-demand
    return null;
  }
}

// Initialize the secret when the module loads
const preGeneratedAppleSecret = initializeAppleClientSecret();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: preGeneratedAppleSecret || getAppleClientSecret(),
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".arthkin.com" : undefined,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".arthkin.com" : undefined,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production" ? ".arthkin.com" : undefined,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
