"use client";

import { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Play, Plus, Trash2, Users, Loader, Share2 } from "lucide-react";
import { AuthButton } from "./AuthButton";

interface HomePageProps {
  games: Game[];
  onNewGame: () => void;
  onPlayGame: (game: Game) => void;
  onDeleteGame: (gameId: string) => void;
  onShareGame: (game: Game) => void;
  loading?: boolean;
  migrating?: boolean;
  currentUserEmail?: string;
}

export default function HomePage({
  games,
  onNewGame,
  onPlayGame,
  onDeleteGame,
  onShareGame,
  loading = false,
  migrating = false,
  currentUserEmail,
}: HomePageProps) {
  return (
    <div className="min-h-[80vh] p-6">
      <div className="fixed z-10 py-2 px-4 rounded-md left-1/2 bottom-0 -translate-x-1/2">
        <AuthButton />
      </div>
      <div className="max-w-4xl mx-auto mb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-display text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Score Keeper
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your games and track scores
              </p>
            </div>
          </div>
        </motion.div>

        {/* Add New Game Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mb-8"
        >
          <Button
            onClick={onNewGame}
            size="lg"
            className="w-full h-16 text-lg gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-6 h-6" />
            Add New Game
          </Button>
        </motion.div>

        {/* Games List */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-6 h-6 animate-spin" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {migrating
                    ? "Migrating your games..."
                    : "Loading your games..."}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {migrating
                    ? "Transferring your guest games to your account"
                    : "Please wait while we fetch your data"}
                </p>
              </div>
            </div>
          </motion.div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No games yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first game to get started
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
              >
                <Card className="overflow-hidden transition-shadow">
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white line-clamp-1">
                            {game.name}
                          </h3>
                          {game.userEmail !== currentUserEmail && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Shared
                            </span>
                          )}
                        </div>

                        {/* Player colors preview */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {game.players.map((player) => (
                            <div
                              key={player.id}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs sm:text-sm font-bold"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.score}
                            </div>
                          ))}
                          <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                            {game.players.length} players
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Last played: {game.lastPlayed.toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex justify-between sm:justify-start gap-2 sm:ml-4 w-full sm:w-auto">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onPlayGame(game)}
                            className="gap-1 sm:gap-2 text-sm w-20"
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Play</span>
                          </Button>
                          {/* Only show share button if user owns the game */}
                          {game.userEmail === currentUserEmail && (
                            <Button
                              onClick={() => onShareGame(game)}
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Share game"
                            >
                              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Only show delete button if user owns the game */}
                        {game.userEmail === currentUserEmail && (
                          <Button
                            onClick={() => onDeleteGame(game.id)}
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete game"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
