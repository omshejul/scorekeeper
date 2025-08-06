"use client";

import { Player, PLAYER_COLORS } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Palette, Play, Users, Dice5 } from "lucide-react";
import { useState } from "react";
import { generatePlayerNames, generateGameName } from "@/lib/utils";
import DecryptedText from "@/components/ui/DecryptedText";

interface GameSetupProps {
  onBack: () => void;
  onStartGame: (gameName: string, players: Player[]) => void;
  loading?: boolean;
}

export default function GameSetup({
  onBack,
  onStartGame,
  loading = false,
}: GameSetupProps) {
  const [step, setStep] = useState<"count" | "names" | "colors">("count");
  const [playerCount, setPlayerCount] = useState(2);
  const [gameName, setGameName] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array(2).fill("")
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isGameNameDiceRotating, setIsGameNameDiceRotating] = useState(false);
  const [isPlayerNamesDiceRotating, setIsPlayerNamesDiceRotating] =
    useState(false);
  const [showDecryptedGameName, setShowDecryptedGameName] = useState(false);
  const [showDecryptedPlayerNames, setShowDecryptedPlayerNames] =
    useState(false);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const names = generatePlayerNames(count);
    setPlayerNames(names);
    setSelectedColors([]);
  };

  const handleGenerateNewNames = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlayerNamesDiceRotating(true);
    setShowDecryptedPlayerNames(true);

    const names = generatePlayerNames(playerCount);
    setPlayerNames(names);

    // Reset rotation state after animation completes
    setTimeout(() => {
      setIsPlayerNamesDiceRotating(false);
      // Hide decryption animation after a delay
      setTimeout(() => {
        setShowDecryptedPlayerNames(false);
      }, 500);
    }, 600);
  };

  const handleGenerateNewGameName = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGameNameDiceRotating(true);
    setShowDecryptedGameName(true);

    const newGameName = generateGameName();
    setGameName(newGameName);

    // Reset rotation state after animation completes
    setTimeout(() => {
      setIsGameNameDiceRotating(false);
      // Hide decryption animation after a delay
      setTimeout(() => {
        setShowDecryptedGameName(false);
      }, 500);
    }, 600);
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleColorSelect = (playerIndex: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[playerIndex] = color;
    setSelectedColors(newColors);
  };

  const isColorTaken = (color: string, currentPlayerIndex: number) => {
    return selectedColors.some(
      (selectedColor, index) =>
        selectedColor === color && index !== currentPlayerIndex
    );
  };

  const canProceedToColors =
    gameName.trim() && playerNames.every((name) => name.trim());
  const canStartGame =
    selectedColors.length === playerCount &&
    selectedColors.every((color) => color);

  const handleStartGame = () => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name: name.trim(),
      score: 0,
      color: selectedColors[index],
    }));

    onStartGame(gameName.trim(), players);
  };

  return (
    <div className="min-h-[80vh] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-gray-800 dark:text-white">
            New Game Setup
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "count" && (
            <motion.div
              key="count"
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Game Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Game Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Game Name
                    </label>
                    <div className="flex gap-2">
                      <AnimatePresence mode="wait">
                        {showDecryptedGameName ? (
                          <motion.div
                            key="game-decrypted"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 border border-input bg-background px-3 py-1 rounded-md h-9 flex items-center"
                          >
                            <DecryptedText
                              text={gameName}
                              speed={50}
                              maxIterations={10}
                              sequential={true}
                              animateOn="view"
                              className="text-base md:text-sm"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="game-input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 w-full"
                          >
                            <Input
                              value={gameName}
                              onChange={(e) => setGameName(e.target.value)}
                              placeholder="Enter game name..."
                              className="flex-1 w-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.75 }}
                      >
                        <Button
                          variant="outline"
                          onClick={handleGenerateNewGameName}
                          disabled={showDecryptedGameName}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            key={isGameNameDiceRotating ? "rotating" : "idle"}
                            initial={{ rotate: 0 }}
                            animate={{
                              rotate: isGameNameDiceRotating ? 360 : 0,
                            }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                          >
                            <Dice5 className="w-4 h-4" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Player Count */}
                  <div>
                    <label className="block text-sm font-medium mb-4">
                      Number of Players
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {[2, 3, 4, 5, 6].map((count) => (
                        <Button
                          key={count}
                          variant={
                            playerCount === count ? "default" : "outline"
                          }
                          onClick={() => handlePlayerCountChange(count)}
                          className="h-12 text-lg"
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep("names")}
                    disabled={!gameName.trim()}
                    className="w-full"
                    size="lg"
                  >
                    Next: Player Names
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "names" && (
            <motion.div
              key="names"
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Player Names</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Generate New Names Button */}
                  <div className="flex justify-center mb-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleGenerateNewNames}
                        disabled={showDecryptedPlayerNames}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          key={isPlayerNamesDiceRotating ? "rotating" : "idle"}
                          initial={{ rotate: 0 }}
                          animate={{
                            rotate: isPlayerNamesDiceRotating ? 360 : 0,
                          }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                          <Dice5 className="w-4 h-4" />
                        </motion.div>
                        Generate Random Names
                      </Button>
                    </motion.div>
                  </div>

                  {playerNames.map((name, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-2">
                        Player {index + 1}
                      </label>
                      <AnimatePresence mode="wait">
                        {showDecryptedPlayerNames ? (
                          <motion.div
                            key="player-decrypted"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border border-input px-3 py-1 rounded-md h-9 flex items-center"
                          >
                            <DecryptedText
                              text={name}
                              speed={50}
                              maxIterations={8}
                              sequential={true}
                              animateOn="view"
                              className="text-base md:text-sm text-neutral-500"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="player-input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Input
                              value={name}
                              onChange={(e) =>
                                handleNameChange(index, e.target.value)
                              }
                              placeholder={`Player ${index + 1} name...`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("count")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("colors")}
                      disabled={!canProceedToColors}
                      className="flex-1"
                    >
                      Next: Choose Colors
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "colors" && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Choose Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {playerNames.map((name, playerIndex) => (
                    <div key={playerIndex}>
                      <label className="block text-sm font-medium mb-3">
                        {name}
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {PLAYER_COLORS.map((color) => {
                          const isSelected =
                            selectedColors[playerIndex] === color;
                          const isTaken = isColorTaken(color, playerIndex);

                          return (
                            <motion.button
                              key={color}
                              onClick={() =>
                                !isTaken &&
                                handleColorSelect(playerIndex, color)
                              }
                              disabled={isTaken}
                              className={`
                                w-16 h-16 rounded-lg border-4 transition-all
                                ${
                                  isSelected
                                    ? "border-gray-800 dark:border-white scale-110"
                                    : "border-transparent"
                                }
                                ${
                                  isTaken
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:scale-105"
                                }
                              `}
                              style={{ backgroundColor: color }}
                              whileHover={!isTaken ? { scale: 1.05 } : {}}
                              whileTap={!isTaken ? { scale: 0.95 } : {}}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("names")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame || loading}
                      className="flex-1 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {loading ? "Starting..." : "Start Game"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
