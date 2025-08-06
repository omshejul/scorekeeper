import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { authOptions } from "@/lib/auth";

// Extended session type to include the id property added by our auth config
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ExtendedSession {
  user: ExtendedUser;
}

// GET /api/games/[gameId] - Get a single game
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

    const userId = (session as unknown as ExtendedSession).user.id;
    const userEmail = session.user?.email || "";

    // Find game that user owns OR has shared access to
    const game = await Game.findOne({
      id: gameId,
      $or: [{ userId: userId }, { sharedWith: userEmail }],
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/games/[gameId] - Update a game
export async function PUT(
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

    // DEBUG: Log the request data
    console.log("PUT /api/games/[gameId] - Request data:", {
      gameId,
      bodyKeys: Object.keys(body),
      players: body.players,
      bodyLength: JSON.stringify(body).length,
    });

    await connectToDatabase();

    const userId = (session as unknown as ExtendedSession).user.id;
    const userEmail = session.user?.email || "";

    // DEBUG: Log the query criteria
    console.log("PUT /api/games/[gameId] - Query criteria:", {
      id: gameId,
      userId,
      userEmail,
    });

    // First, let's check if the game exists
    const existingGame = await Game.findOne({
      id: gameId,
      $or: [{ userId: userId }, { sharedWith: userEmail }],
    });

    console.log(
      "PUT /api/games/[gameId] - Existing game found:",
      !!existingGame
    );
    if (existingGame) {
      console.log(
        "PUT /api/games/[gameId] - Current players in DB:",
        existingGame.players
      );
    }

    // Update the game and set lastPlayed to current time
    // Allow update if user owns the game OR has shared access
    const updatedGame = await Game.findOneAndUpdate(
      {
        id: gameId,
        $or: [{ userId: userId }, { sharedWith: userEmail }],
      },
      {
        ...body,
        lastPlayed: new Date(),
      },
      { new: true }
    );

    console.log("PUT /api/games/[gameId] - Update result:", {
      success: !!updatedGame,
      playersAfterUpdate: updatedGame?.players,
    });

    if (!updatedGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/games/[gameId] - Delete a game
export async function DELETE(
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

    const userId = (session as unknown as ExtendedSession).user.id;

    // Only allow deletion if user owns the game (not just shared access)
    const deletedGame = await Game.findOneAndDelete({ id: gameId, userId });

    if (!deletedGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
