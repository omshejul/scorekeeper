import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { authOptions } from "@/lib/auth";
import { sendGameInvites } from "@/lib/email";

// POST /api/games/[gameId]/share - Share a game with other users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = await params;
    const { emails } = body; // Array of email addresses to share with

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Email addresses required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    const userEmail = session.user?.email || "";

    // Find the game and ensure user owns it
    const game = await Game.findOne({ id: gameId, userId });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found or not owned by user" },
        { status: 404 }
      );
    }

    // Generate share code if not exists
    let shareCode = game.shareCode;
    if (!shareCode) {
      shareCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // Update game with sharing info
    const updatedGame = await Game.findOneAndUpdate(
      { id: gameId, userId },
      {
        isShared: true,
        shareCode: shareCode,
        sharedBy: userEmail,
        $addToSet: { sharedWith: { $each: emails } }, // Add emails without duplicates
      },
      { new: true }
    );

    // Send invitation emails
    const shareUrl = `${process.env.NEXTAUTH_URL}`;
    const inviterName = session.user?.name || userEmail.split("@")[0];

    let emailResults = { successful: 0, failed: 0, results: [] as any[] };

    try {
      emailResults = await sendGameInvites(emails, {
        inviterName,
        inviterEmail: userEmail,
        gameName: game.name || "ScoreKeeper Game",
        gameUrl: shareUrl,
      });
    } catch (error) {
      console.error("Error sending invitation emails:", error);
      // Continue with the response even if emails fail
    }

    return NextResponse.json({
      message: "Game shared successfully",
      shareCode: shareCode,
      sharedWith: updatedGame?.sharedWith || [],
      shareUrl: shareUrl,
      emailResults: {
        successful: emailResults.successful,
        failed: emailResults.failed,
      },
    });
  } catch (error) {
    console.error("Error sharing game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET /api/games/[gameId]/share - Get sharing info for a game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await params;

    await connectToDatabase();

    const userId = (session.user as any).id;

    const game = await Game.findOne({ id: gameId, userId });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      isShared: game.isShared || false,
      sharedWith: game.sharedWith || [],
      shareCode: game.shareCode,
      shareUrl: game.shareCode
        ? `${process.env.NEXTAUTH_URL}?join=${game.shareCode}`
        : null,
    });
  } catch (error) {
    console.error("Error getting share info:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
