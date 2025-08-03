'use client'

import { Game, Player } from '@/app/types/game'
import { motion } from 'framer-motion'
import { Minus, X } from 'lucide-react'
import { useCallback, useState } from 'react'

interface GamePlayProps {
  game: Game
  onUpdateGame: (updatedGame: Game) => void
  onExitGame: () => void
}

export default function GamePlay({ game, onUpdateGame, onExitGame }: GamePlayProps) {
  const [players, setPlayers] = useState<Player[]>(game.players)

  // Update parent game when exiting
  const updateParentGame = useCallback(() => {
    const updatedGame = { ...game, players, lastPlayed: new Date() }
    onUpdateGame(updatedGame)
  }, [game, players, onUpdateGame])

  const incrementScore = useCallback((playerId: string) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, score: player.score + 1 } : player
    ))
  }, [])

  const decrementScore = useCallback((playerId: string) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, score: Math.max(0, player.score - 1) } : player
    ))
  }, [])

  const handleTap = useCallback((playerId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    incrementScore(playerId)
  }, [incrementScore])

  const handleDecrement = useCallback((playerId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    decrementScore(playerId)
  }, [decrementScore])

  const getGridLayout = () => {
    const playerCount = players.length
    switch (playerCount) {
      case 2:
        return 'grid-cols-1 grid-rows-2' // Vertical split
      case 3:
        return 'grid-cols-1 grid-rows-3' // Vertical thirds
      case 4:
        return 'grid-cols-2 grid-rows-2' // 2x2 grid
      case 5:
        return 'grid-cols-2 grid-rows-3' // 2x3 grid with empty space
      case 6:
        return 'grid-cols-2 grid-rows-3' // 2x3 grid
      default:
        return 'grid-cols-2 grid-rows-2'
    }
  }

  // Exit game handler
  const handleExit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateParentGame() // Save current state before exiting
    onExitGame()
  }, [onExitGame, updateParentGame])

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      {/* Exit Button */}
      <motion.button
        className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200"
        onClick={handleExit}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-6 h-6" />
      </motion.button>

      <div className={`grid h-full w-full ${getGridLayout()}`}>
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className="relative flex items-center justify-center cursor-pointer user-select-none touch-manipulation"
            style={{ backgroundColor: player.color }}
            onClick={(e) => handleTap(player.id, e)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Minus Button */}
            <motion.button
              className="absolute top-4 left-4 w-12 h-12 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-200"
              onClick={(e) => handleDecrement(player.id, e)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus className="w-5 h-5" />
            </motion.button>

            {/* Player Name */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/30 text-white px-4 py-2 rounded-full text-base font-semibold backdrop-blur-sm">
                {player.name}
              </div>
            </div>

            {/* Score */}
            <motion.div
              key={player.score}
              initial={{ scale: 1.2, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-white text-center"
            >
              <div className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold leading-none drop-shadow-2xl">
                {player.score}
              </div>
            </motion.div>

          </motion.div>
        ))}

        {/* Fill empty spaces for 5 players */}
        {players.length === 5 && (
          <div className="bg-gray-200 dark:bg-gray-800" />
        )}
      </div>
    </div>
  )
}