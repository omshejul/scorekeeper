import { Game, Player } from "@/app/types/game";

const API_BASE = "/api/games";

export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(API_BASE, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch games");
  }

  const games = await response.json();

  // Convert date strings back to Date objects
  return games.map((game: Game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
    lastPlayed: new Date(game.lastPlayed),
  }));
}

export async function fetchGame(gameId: string): Promise<Game> {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch game");
  }

  const game = await response.json();

  return {
    ...game,
    createdAt: new Date(game.createdAt),
    lastPlayed: new Date(game.lastPlayed),
  };
}

export async function createGame(gameData: {
  id: string;
  name: string;
  players: Player[];
}): Promise<Game> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    throw new Error("Failed to create game");
  }

  const game = await response.json();

  return {
    ...game,
    createdAt: new Date(game.createdAt),
    lastPlayed: new Date(game.lastPlayed),
  };
}

export async function updateGame(
  gameId: string,
  gameData: Partial<Game>
): Promise<Game> {
  console.log("lib/api/games - Sending PUT request:", {
    url: `${API_BASE}/${gameId}`,
    gameId,
    dataSize: JSON.stringify(gameData).length,
    playersInData: gameData.players?.map((p: Player) => ({
      name: p.name,
      score: p.score,
    })),
  });

  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(gameData),
  });

  console.log(
    "lib/api/games - Response status:",
    response.status,
    response.statusText
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("lib/api/games - Error response:", errorText);
    throw new Error(`Failed to update game: ${response.status} ${errorText}`);
  }

  const game = await response.json();

  console.log("lib/api/games - Successful response:", {
    gameId: game.id,
    playersFromResponse: game.players?.map((p: Player) => ({
      name: p.name,
      score: p.score,
    })),
  });

  return {
    ...game,
    createdAt: new Date(game.createdAt),
    lastPlayed: new Date(game.lastPlayed),
  };
}

export async function deleteGame(gameId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete game");
  }
}
