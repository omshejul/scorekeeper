import { Game, Player } from "@/app/types/game";
import offlineAPI from "@/lib/offline/offlineAPI";

// Initialize offline API
if (typeof window !== "undefined") {
  offlineAPI.init().catch(console.error);
}

export async function fetchGames(): Promise<Game[]> {
  return await offlineAPI.fetchGames();
}

export async function fetchGame(gameId: string): Promise<Game> {
  return await offlineAPI.fetchGame(gameId);
}

export async function createGame(gameData: {
  id: string;
  name: string;
  players: Player[];
}): Promise<Game> {
  return await offlineAPI.createGame(gameData);
}

export async function updateGame(
  gameId: string,
  gameData: Partial<Game>
): Promise<Game> {
  console.log("lib/api/games - Updating game:", {
    gameId,
    dataSize: JSON.stringify(gameData).length,
    playersInData: gameData.players?.map((p: any) => ({
      name: p.name,
      score: p.score,
    })),
    isOnline: offlineAPI.isAppOnline(),
  });

  const result = await offlineAPI.updateGame(gameId, gameData);

  console.log("lib/api/games - Game updated:", {
    gameId: result.id,
    playersFromResult: result.players?.map((p: any) => ({
      name: p.name,
      score: p.score,
    })),
  });

  return result;
}

export async function deleteGame(gameId: string): Promise<void> {
  return await offlineAPI.deleteGame(gameId);
}

export async function joinSharedGame(shareCode: string): Promise<Game> {
  return await offlineAPI.joinSharedGame(shareCode);
}
