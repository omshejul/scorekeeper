"use client";

import { Game, Player } from "@/app/types/game";
import { motion } from "framer-motion";
import { Minus, X, MoreVertical, RotateCcw } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";

interface GamePlayProps {
  game: Game;
  onUpdateGame: (updatedGame: Game) => void;
  onExitGame: () => void;
}

export default function GamePlay({
  game,
  onUpdateGame,
  onExitGame,
}: GamePlayProps) {
  const [players, setPlayers] = useState<Player[]>(game.players);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (updatedPlayers: Player[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const updatedGame = {
          ...game,
          players: updatedPlayers,
          lastPlayed: new Date(),
        };

        console.log("GamePlay - Debounced auto-save:", {
          gameId: updatedGame.id,
          playersBeforeSave: updatedPlayers.map((p: any) => ({
            name: p.name,
            score: p.score,
          })),
          lastPlayed: updatedGame.lastPlayed,
        });

        onUpdateGame(updatedGame);
      }, 2000); // 2 second debounce
    },
    [game, onUpdateGame]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Update parent game when exiting
  const updateParentGame = useCallback(() => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const updatedGame = { ...game, players, lastPlayed: new Date() };
    onUpdateGame(updatedGame);
  }, [game, players, onUpdateGame]);

  const incrementScore = useCallback(
    (playerId: string) => {
      setPlayers((prev) => {
        const updatedPlayers = prev.map((player) =>
          player.id === playerId
            ? { ...player, score: player.score + 1 }
            : player
        );

        // Trigger debounced auto-save
        debouncedAutoSave(updatedPlayers);

        return updatedPlayers;
      });
    },
    [debouncedAutoSave]
  );

  const decrementScore = useCallback(
    (playerId: string) => {
      setPlayers((prev) => {
        const updatedPlayers = prev.map((player) =>
          player.id === playerId
            ? { ...player, score: Math.max(0, player.score - 1) }
            : player
        );

        // Trigger debounced auto-save
        debouncedAutoSave(updatedPlayers);

        return updatedPlayers;
      });
    },
    [debouncedAutoSave]
  );

  const handleTap = useCallback(
    (playerId: string, event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
      incrementScore(playerId);
    },
    [incrementScore]
  );

  const handleDecrement = useCallback(
    (playerId: string, event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
      decrementScore(playerId);
    },
    [decrementScore]
  );

  const getGridLayout = () => {
    const playerCount = players.length;
    switch (playerCount) {
      case 2:
        return "grid-cols-1 grid-rows-2"; // Vertical split
      case 3:
        return "grid-cols-1 grid-rows-3"; // Vertical thirds
      case 4:
        return "grid-cols-2 grid-rows-2"; // 2x2 grid
      case 5:
        return "grid-cols-2 grid-rows-3"; // 2x3 grid with empty space
      case 6:
        return "grid-cols-2 grid-rows-3"; // 2x3 grid
      default:
        return "grid-cols-2 grid-rows-2";
    }
  };

  // Menu handlers
  const handleMenuToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(!isMenuOpen);
    },
    [isMenuOpen]
  );

  const handleRotate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRotated(!isRotated);
      setIsMenuOpen(false);
    },
    [isRotated]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateParentGame(); // Save current state before exiting
      onExitGame();
    },
    [onExitGame, updateParentGame]
  );

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      {/* Menu Button */}
      <div className="absolute top-3 right-3 z-20">
        <motion.button
          className="w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200"
          onClick={handleMenuToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MoreVertical className="w-4 h-4" />
        </motion.button>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-10 right-0 bg-black/80 backdrop-blur-sm whitespace-nowrap rounded-lg p-1"
          >
            <button
              onClick={handleRotate}
              className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-md text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isRotated ? "Normal View" : "Rotate"}</span>
            </button>
            <div className="h-px w-full bg-white/20" />
            <button
              onClick={handleClose}
              className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-md text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Close Game</span>
            </button>
          </motion.div>
        )}
      </div>

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
              className={`absolute ${
                isRotated ? "bottom-6 left-6" : "top-3 left-3"
              } w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-200`}
              onClick={(e) => handleDecrement(player.id, e)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus
                className="w-4 h-4"
                style={{
                  transform: isRotated ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease-in-out",
                }}
              />
            </motion.button>

            {/* Player Name */}
            <div
              className={`absolute w-32 text-center ${
                isRotated
                  ? "z-10 -left-8"
                  : "z-10 top-3 right-1/2 transform translate-x-1/2"
              }`}
              style={{
                transition: "translate 0.3s ease-in-out",
              }}
            >
              <div
                className=" text-black/30 px-3 py-1 rounded-full text-sm font-semibold "
                style={{
                  transform: isRotated ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease-in-out",
                }}
              >
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
              <div
                className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold leading-none drop-shadow-2xl"
                style={{
                  transform: isRotated ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease-in-out",
                  display: "inline-block",
                }}
              >
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
  );
}
