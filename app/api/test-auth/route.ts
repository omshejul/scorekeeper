import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    console.log("Test auth endpoint - Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as { id?: string })?.id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    });

    console.log("Test auth endpoint - Environment variables:", {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      host: process.env.HOST,
      vercelUrl: process.env.VERCEL_URL,
    });

    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as { id?: string })?.id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      env: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        host: process.env.HOST,
        vercelUrl: process.env.VERCEL_URL,
      },
    });
  } catch (error) {
    console.error("Test auth endpoint error:", error);
    return NextResponse.json({ error: "Auth test failed" }, { status: 500 });
  }
}
