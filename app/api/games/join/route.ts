import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { authOptions } from "@/lib/auth";

// POST /api/games/join - Join a shared game using share code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shareCode } = body;

    if (!shareCode) {
      return NextResponse.json(
        { error: "Share code required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userEmail = session.user?.email || "";

    // Find the game by share code
    const game = await Game.findOne({ shareCode: shareCode });

    if (!game) {
      return NextResponse.json(
        { error: "Invalid share code" },
        { status: 404 }
      );
    }

    // Check if user is already in the shared list or is the owner
    if (
      game.userId === (session.user as any).id ||
      game.sharedWith?.includes(userEmail)
    ) {
      return NextResponse.json({
        message: "Already have access to this game",
        game: game,
      });
    }

    // Add user to shared list
    const updatedGame = await Game.findOneAndUpdate(
      { shareCode: shareCode },
      {
        $addToSet: { sharedWith: userEmail },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Successfully joined shared game",
      game: updatedGame,
    });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
