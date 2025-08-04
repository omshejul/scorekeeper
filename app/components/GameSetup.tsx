"use client";

import { Player, PLAYER_COLORS } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Palette, Play, Users, Dice5 } from "lucide-react";
import { useState } from "react";
import { generatePlayerNames, generateGameName } from "@/lib/utils";

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

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const names = generatePlayerNames(count);
    setPlayerNames(names);
    setSelectedColors([]);
  };

  const handleGenerateNewNames = () => {
    const names = generatePlayerNames(playerCount);
    setPlayerNames(names);
  };

  const handleGenerateNewGameName = () => {
    setGameName(generateGameName());
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            New Game Setup
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "count" && (
            <motion.div
              key="count"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                      <Input
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="Enter game name..."
                        className="text-lg flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleGenerateNewGameName}
                        className="flex items-center gap-2"
                      >
                        <Dice5 className="w-4 h-4" />
                      </Button>
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Player Names</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Generate New Names Button */}
                  <div className="flex justify-center mb-4">
                    <Button
                      variant="outline"
                      onClick={handleGenerateNewNames}
                      className="flex items-center gap-2"
                    >
                      <Dice5 className="w-4 h-4" />
                      Generate New Names
                    </Button>
                  </div>

                  {playerNames.map((name, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-2">
                        Player {index + 1}
                      </label>
                      <Input
                        value={name}
                        onChange={(e) =>
                          handleNameChange(index, e.target.value)
                        }
                        placeholder={`Player ${index + 1} name...`}
                        className="text-lg"
                      />
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
