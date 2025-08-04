import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { authOptions } from "@/lib/auth";

// GET /api/games - Get all games for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    const userEmail = session.user?.email || "";

    // Find games owned by user OR shared with user
    const games = await Game.find({
      $or: [{ userId: userId }, { sharedWith: userEmail }],
    }).sort({ lastPlayed: -1 });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/games - Create a new game
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, players } = body;

    await connectToDatabase();

    const userId = (session.user as any).id;
    const userName = session.user?.name || "";
    const userEmail = session.user?.email || "";

    const game = new Game({
      id,
      name,
      players,
      userId,
      userName,
      userEmail,
      createdAt: new Date(),
      lastPlayed: new Date(),
    });

    await game.save();

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
