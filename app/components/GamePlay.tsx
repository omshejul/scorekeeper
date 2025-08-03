'use client'

import { Game, Player } from '@/app/types/game'
import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'

interface GamePlayProps {
  game: Game
  onUpdateGame: (updatedGame: Game) => void
  onExitGame: () => void
}

export default function GamePlay({ game, onUpdateGame, onExitGame }: GamePlayProps) {
  const [players, setPlayers] = useState<Player[]>(game.players)
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isHolding, setIsHolding] = useState(false)

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

  const handleStart = useCallback((playerId: string) => {
    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(true)
      decrementScore(playerId)
      holdIntervalRef.current = setInterval(() => {
        decrementScore(playerId)
      }, 150)
    }, 500)
  }, [decrementScore])

  const handleEnd = useCallback((playerId: string) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    
    // If we weren't holding, it's a tap - increment score
    if (!isHolding) {
      incrementScore(playerId)
    }
    setIsHolding(false)
  }, [isHolding, incrementScore])

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

  // Double tap to exit game
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateParentGame() // Save current state before exiting
    onExitGame()
  }, [onExitGame, updateParentGame])

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      {/* Exit hint */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
        Double tap anywhere to exit
      </div>

      <div className={`grid h-full w-full ${getGridLayout()}`}>
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className="relative flex items-center justify-center cursor-pointer user-select-none"
            style={{ backgroundColor: player.color }}
            onMouseDown={() => handleStart(player.id)}
            onMouseUp={() => handleEnd(player.id)}
            onMouseLeave={() => handleEnd(player.id)}
            onTouchStart={() => handleStart(player.id)}
            onTouchEnd={() => handleEnd(player.id)}
            onDoubleClick={handleDoubleClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Player Name */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/20 text-white px-4 py-2 rounded-full text-lg font-semibold backdrop-blur-sm">
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

            {/* Tap indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                Tap +1 | Hold -1
              </div>
            </div>

            {/* Touch effect */}
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHolding ? 1 : 0 }}
              transition={{ duration: 0.1 }}
            />
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