"use client";

import { Game, Player } from "@/app/types/game";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  fetchGames,
  fetchGame,
  createGame,
  updateGame,
  deleteGame,
} from "@/lib/api/games";
import GamePlay from "./GamePlay";
import GameSetup from "./GameSetup";
import HomePage from "./HomePage";
import ShareGameModal from "./ShareGameModal";

type AppState = "home" | "setup" | "playing";

export default function ScoreKeeper() {
  const { data: session, status } = useSession();

  console.log("ScoreKeeper - Session status:", {
    status,
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: (session?.user as { id?: string })?.id,
    userEmail: session?.user?.email,
  });

  const [appState, setAppState] = useState<AppState>("home");
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [gameToShare, setGameToShare] = useState<Game | null>(null);

  // Migrate guest games to authenticated account
  const migrateGuestGames = useCallback(async () => {
    try {
      setMigrating(true);
      const guestGamesData = localStorage.getItem("scorekeeper-games-guest");

      if (!guestGamesData) return [];

      const guestGames = JSON.parse(guestGamesData).map((game: Game) => ({
        ...game,
        createdAt: new Date(game.createdAt),
        lastPlayed: new Date(game.lastPlayed),
      }));

      if (guestGames.length === 0) return [];

      console.log(
        `Migrating ${guestGames.length} guest games to authenticated account...`
      );

      // Upload each guest game to the user's account
      const migratedGames = [];
      for (const game of guestGames) {
        try {
          const migratedGame = await createGame({
            id: game.id,
            name: game.name,
            players: game.players,
          });
          migratedGames.push(migratedGame);
        } catch (error) {
          console.error(`Failed to migrate game ${game.name}:`, error);
        }
      }

      // Clear guest data after successful migration
      if (migratedGames.length > 0) {
        localStorage.removeItem("scorekeeper-games-guest");
        console.log(`Successfully migrated ${migratedGames.length} games`);
      }

      return migratedGames;
    } catch (error) {
      console.error("Failed to migrate guest games:", error);
      return [];
    } finally {
      setMigrating(false);
    }
  }, []);

  // Load games from MongoDB when user session is available, or localStorage for guests
  useEffect(() => {
    async function loadGames() {
      if (status === "loading") return;

      if (!session?.user) {
        // Load from localStorage for guests
        try {
          const savedGames = localStorage.getItem("scorekeeper-games-guest");
          if (savedGames) {
            const parsedGames = JSON.parse(savedGames).map((game: Game) => ({
              ...game,
              createdAt: new Date(game.createdAt),
              lastPlayed: new Date(game.lastPlayed),
            }));
            setGames(parsedGames);
          } else {
            setGames([]);
          }
        } catch (error) {
          console.error("Failed to load guest games:", error);
          setGames([]);
        }
        return;
      }

      try {
        setLoading(true);

        // Check if we need to migrate guest games
        const guestGamesData = localStorage.getItem("scorekeeper-games-guest");
        if (guestGamesData) {
          const guestGames = JSON.parse(guestGamesData);
          if (guestGames.length > 0) {
            console.log("Found guest games, starting migration...");
            const migratedGames = await migrateGuestGames();
            const cloudGames = await fetchGames();
            // Combine migrated and existing cloud games, removing duplicates by ID
            const allGames = [...cloudGames];
            migratedGames.forEach((migrated) => {
              if (!allGames.find((existing) => existing.id === migrated.id)) {
                allGames.push(migrated);
              }
            });
            setGames(
              allGames.sort(
                (a, b) =>
                  new Date(b.lastPlayed).getTime() -
                  new Date(a.lastPlayed).getTime()
              )
            );
            return;
          }
        }

        // Normal cloud game loading
        const fetchedGames = await fetchGames();
        setGames(fetchedGames);
      } catch (error) {
        console.error("Failed to load games:", error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [session, status, migrateGuestGames]);

  // Save games to localStorage for guests
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user && games.length > 0) {
      localStorage.setItem("scorekeeper-games-guest", JSON.stringify(games));
    }
  }, [games, session, status]);

  const handleNewGame = () => {
    setAppState("setup");
  };

  const handleBackToHome = () => {
    setAppState("home");
    setCurrentGame(null);
  };

  const handleStartGame = async (gameName: string, players: Player[]) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameName,
      players,
      createdAt: new Date(),
      lastPlayed: new Date(),
    };

    try {
      setLoading(true);

      // If user is authenticated, save to database
      if (session?.user) {
        const savedGame = await createGame({
          id: newGame.id,
          name: newGame.name,
          players: newGame.players,
        });
        setGames((prev) => [savedGame, ...prev]);
        setCurrentGame(savedGame);
      } else {
        // If not authenticated, just start the game locally
        setGames((prev) => [newGame, ...prev]);
        setCurrentGame(newGame);
      }

      setAppState("playing");
    } catch (error) {
      console.error("Failed to create game:", error);
      // Fallback: start game locally even if database save fails
      setGames((prev) => [newGame, ...prev]);
      setCurrentGame(newGame);
      setAppState("playing");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = async (game: Game) => {
    try {
      setLoading(true);

      // For authenticated users, fetch the latest game data from server
      if (session?.user) {
        const latestGame = await fetchGame(game.id);
        setCurrentGame(latestGame);
        // Also update the local games list with the fresh data
        setGames((prev) =>
          prev.map((g) => (g.id === latestGame.id ? latestGame : g))
        );
      } else {
        // For guest users, use local data
        setCurrentGame(game);
      }

      setAppState("playing");
    } catch (error) {
      console.error("Failed to fetch latest game data:", error);
      // Fallback: use the existing game data
      setCurrentGame(game);
      setAppState("playing");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      setLoading(true);

      // If user is authenticated, delete from database
      if (session?.user) {
        await deleteGame(gameId);
      }

      // Always remove from local state
      setGames((prev) => prev.filter((game) => game.id !== gameId));
    } catch (error) {
      console.error("Failed to delete game:", error);
      // Fallback: still remove from local state
      setGames((prev) => prev.filter((game) => game.id !== gameId));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGame = useCallback(
    async (updatedGame: Game) => {
      try {
        // If user is authenticated, save to database
        if (session?.user) {
          console.log("ScoreKeeper - Updating game to server:", {
            gameId: updatedGame.id,
            players: updatedGame.players,
            playersScores: updatedGame.players.map((p: Player) => ({
              name: p.name,
              score: p.score,
            })),
          });

          const updated = await updateGame(updatedGame.id, updatedGame);

          console.log("ScoreKeeper - Server response:", {
            gameId: updated.id,
            playersFromServer: updated.players.map((p: Player) => ({
              name: p.name,
              score: p.score,
            })),
          });

          setGames((prev) =>
            prev.map((game) => (game.id === updated.id ? updated : game))
          );
          setCurrentGame(updated);
        } else {
          // If not authenticated, just update local state
          setGames((prev) =>
            prev.map((game) =>
              game.id === updatedGame.id ? updatedGame : game
            )
          );
          setCurrentGame(updatedGame);
        }
      } catch (error) {
        console.error("Failed to update game:", error);
        // Fallback: still update local state
        setGames((prev) =>
          prev.map((game) => (game.id === updatedGame.id ? updatedGame : game))
        );
        setCurrentGame(updatedGame);
      }
    },
    [session]
  );

  const handleExitGame = () => {
    setAppState("home");
    setCurrentGame(null);
  };

  const handleShareGame = (game: Game) => {
    setGameToShare(game);
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setGameToShare(null);
  };

  return (
    <>
      {(() => {
        switch (appState) {
          case "home":
            return (
              <HomePage
                games={games}
                onNewGame={handleNewGame}
                onPlayGame={handlePlayGame}
                onDeleteGame={handleDeleteGame}
                onShareGame={handleShareGame}
                loading={loading || migrating}
                migrating={migrating}
                currentUserEmail={session?.user?.email || undefined}
              />
            );

          case "setup":
            return (
              <GameSetup
                onBack={handleBackToHome}
                onStartGame={handleStartGame}
                loading={loading}
              />
            );

          case "playing":
            return currentGame ? (
              <GamePlay
                game={currentGame}
                onUpdateGame={handleUpdateGame}
                onExitGame={handleExitGame}
              />
            ) : null;

          default:
            return null;
        }
      })()}

      {/* Share Modal */}
      <ShareGameModal
        game={gameToShare}
        isOpen={shareModalOpen}
        onClose={handleCloseShareModal}
      />
    </>
  );
}
