'use client'

import { Game } from '@/app/types/game'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Play, Plus, Trash2, Users } from 'lucide-react'

interface HomePageProps {
  games: Game[]
  onNewGame: () => void
  onPlayGame: (game: Game) => void
  onDeleteGame: (gameId: string) => void
}

export default function HomePage({ games, onNewGame, onPlayGame, onDeleteGame }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Score Keeper
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your games and track scores
          </p>
        </motion.div>

        {/* Add New Game Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
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
        {games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                          {game.name}
                        </h3>
                        
                        {/* Player colors preview */}
                        <div className="flex items-center gap-2 mb-3">
                          {game.players.map((player, playerIndex) => (
                            <div
                              key={player.id}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.score}
                            </div>
                          ))}
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            {game.players.length} players
                          </span>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Last played: {game.lastPlayed.toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => onPlayGame(game)}
                          size="sm"
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Play
                        </Button>
                        <Button
                          onClick={() => onDeleteGame(game.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
  )
}