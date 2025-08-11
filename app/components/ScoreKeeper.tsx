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
import InstallPrompt from "./InstallPrompt";
import { useOffline } from "@/lib/hooks/useOffline";

type AppState = "home" | "setup" | "playing";

export default function ScoreKeeper() {
  const { data: session, status } = useSession();
  const { isInitialized } = useOffline();
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

      const guestGames = JSON.parse(guestGamesData).map((game: any) => ({
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

  // Load games when session is ready and offline API is initialized
  useEffect(() => {
    async function loadGames() {
      if (status === "loading" || !isInitialized) return;

      try {
        setLoading(true);

        // Check if we need to migrate guest games for authenticated users
        if (session?.user) {
          const guestGamesData = localStorage.getItem(
            "scorekeeper-games-guest"
          );
          if (guestGamesData) {
            const guestGames = JSON.parse(guestGamesData);
            if (guestGames.length > 0) {
              console.log("Found guest games, starting migration...");
              await migrateGuestGames();
              // Clear the localStorage after migration
              localStorage.removeItem("scorekeeper-games-guest");
            }
          }
        }

        // Fetch games using offline-first API
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
  }, [session, status, isInitialized, migrateGuestGames]);

  // Note: Game persistence is now handled by the offline API layer

  const handleNewGame = () => {
    setAppState("setup");
  };

  const handleBackToHome = () => {
    setAppState("home");
    setCurrentGame(null);
  };

  const handleStartGame = async (gameName: string, players: Player[]) => {
    try {
      setLoading(true);

      const savedGame = await createGame({
        id: Date.now().toString(),
        name: gameName,
        players: players,
      });

      setGames((prev) => [savedGame, ...prev]);
      setCurrentGame(savedGame);
      setAppState("playing");
    } catch (error) {
      console.error("Failed to create game:", error);
      // This should not happen with offline-first API, but as a safety fallback
      const newGame: Game = {
        id: Date.now().toString(),
        name: gameName,
        players,
        createdAt: new Date(),
        lastPlayed: new Date(),
      };
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

      // Fetch the latest game data (offline-first)
      const latestGame = await fetchGame(game.id);
      setCurrentGame(latestGame);

      // Update the local games list with the fresh data
      setGames((prev) =>
        prev.map((g) => (g.id === latestGame.id ? latestGame : g))
      );

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

      // Delete using offline-first API
      await deleteGame(gameId);

      // Remove from local state
      setGames((prev) => prev.filter((game) => game.id !== gameId));
    } catch (error) {
      console.error("Failed to delete game:", error);
      // Fallback: still remove from local state
      setGames((prev) => prev.filter((game) => game.id !== gameId));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGame = useCallback(async (updatedGame: Game) => {
    try {
      console.log("ScoreKeeper - Updating game:", {
        gameId: updatedGame.id,
        players: updatedGame.players,
        playersScores: updatedGame.players.map((p: any) => ({
          name: p.name,
          score: p.score,
        })),
      });

      // Update using offline-first API
      const updated = await updateGame(updatedGame.id, updatedGame);

      console.log("ScoreKeeper - Game updated:", {
        gameId: updated.id,
        playersFromResult: updated.players.map((p: any) => ({
          name: p.name,
          score: p.score,
        })),
      });

      setGames((prev) =>
        prev.map((game) => (game.id === updated.id ? updated : game))
      );
      setCurrentGame(updated);
    } catch (error) {
      console.error("Failed to update game:", error);
      // Fallback: still update local state
      setGames((prev) =>
        prev.map((game) => (game.id === updatedGame.id ? updatedGame : game))
      );
      setCurrentGame(updatedGame);
    }
  }, []);

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
      <InstallPrompt />

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
