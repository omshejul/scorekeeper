'use client'

import { Game, Player } from '@/app/types/game'
import { useCallback, useEffect, useState } from 'react'
import GamePlay from './GamePlay'
import GameSetup from './GameSetup'
import HomePage from './HomePage'

type AppState = 'home' | 'setup' | 'playing'

export default function ScoreKeeper() {
  const [appState, setAppState] = useState<AppState>('home')
  const [games, setGames] = useState<Game[]>([])
  const [currentGame, setCurrentGame] = useState<Game | null>(null)

  // Load games from localStorage on mount
  useEffect(() => {
    const savedGames = localStorage.getItem('scorekeeper-games')
    if (savedGames) {
      try {
        const parsedGames = JSON.parse(savedGames).map((game: any) => ({
          ...game,
          createdAt: new Date(game.createdAt),
          lastPlayed: new Date(game.lastPlayed)
        }))
        setGames(parsedGames)
      } catch (error) {
        console.error('Failed to load games:', error)
      }
    }
  }, [])

  // Save games to localStorage whenever games change
  useEffect(() => {
    localStorage.setItem('scorekeeper-games', JSON.stringify(games))
  }, [games])

  const handleNewGame = () => {
    setAppState('setup')
  }

  const handleBackToHome = () => {
    setAppState('home')
    setCurrentGame(null)
  }

  const handleStartGame = (gameName: string, players: Player[]) => {
    const newGame: Game = {
      id: Date.now().toString(),
      name: gameName,
      players,
      createdAt: new Date(),
      lastPlayed: new Date()
    }
    
    setGames(prev => [newGame, ...prev])
    setCurrentGame(newGame)
    setAppState('playing')
  }

  const handlePlayGame = (game: Game) => {
    setCurrentGame(game)
    setAppState('playing')
  }

  const handleDeleteGame = (gameId: string) => {
    setGames(prev => prev.filter(game => game.id !== gameId))
  }

  const handleUpdateGame = useCallback((updatedGame: Game) => {
    setGames(prev => prev.map(game => 
      game.id === updatedGame.id ? updatedGame : game
    ))
    setCurrentGame(updatedGame)
  }, [])

  const handleExitGame = () => {
    setAppState('home')
    setCurrentGame(null)
  }

  switch (appState) {
    case 'home':
      return (
        <HomePage
          games={games}
          onNewGame={handleNewGame}
          onPlayGame={handlePlayGame}
          onDeleteGame={handleDeleteGame}
        />
      )
    
    case 'setup':
      return (
        <GameSetup
          onBack={handleBackToHome}
          onStartGame={handleStartGame}
        />
      )
    
    case 'playing':
      return currentGame ? (
        <GamePlay
          game={currentGame}
          onUpdateGame={handleUpdateGame}
          onExitGame={handleExitGame}
        />
      ) : null

    default:
      return null
  }
}