"use client";

import { Game, Player } from "@/app/types/game";
import { motion } from "framer-motion";
import { Minus, MoreVertical, RefreshCw, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [isRotated, setIsRotated] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio helpers
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    let ctx: AudioContext | null = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioCtx();
      audioContextRef.current = ctx;
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  // Tone-based playback for more distinct sounds
  type ToneConfig = {
    freqHz: number;
    durationSeconds: number;
    wave: OscillatorType;
    gain?: number;
    pan?: number; // -1 (left) to 1 (right)
  };

  const playTone = useCallback(
    (tone: ToneConfig, startOffsetSeconds: number) => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime + startOffsetSeconds;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const panner = (ctx as any).createStereoPanner
        ? (ctx as any).createStereoPanner()
        : null;

      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.freqHz, now);

      const peak = Math.max(0.01, Math.min(0.6, tone.gain ?? 0.22));
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(peak, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        now + tone.durationSeconds
      );

      oscillator.connect(gainNode);
      if (panner && typeof tone.pan === "number") {
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, tone.pan)), now);
        gainNode.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gainNode.connect(ctx.destination);
      }

      oscillator.start(now);
      oscillator.stop(now + tone.durationSeconds + 0.02);
    },
    [getAudioContext]
  );

  const playMelody = useCallback(
    (tones: ToneConfig[], gapSeconds = 0.04) => {
      let offset = 0;
      for (const tone of tones) {
        playTone(tone, offset);
        offset += tone.durationSeconds + gapSeconds;
      }
    },
    [playTone]
  );

  // Strongly differentiated presets per team/color
  type SoundPreset = { up: ToneConfig[]; down: ToneConfig[] };

  const SOUND_PRESETS: SoundPreset[] = [
    // 0 - Bright square two-note up; low saw down (pan left)
    {
      up: [
        {
          freqHz: 1046,
          durationSeconds: 0.09,
          wave: "square",
          gain: 0.2,
          pan: -0.4,
        }, // C6
        {
          freqHz: 1318,
          durationSeconds: 0.11,
          wave: "square",
          gain: 0.2,
          pan: -0.4,
        }, // E6
      ],
      down: [
        {
          freqHz: 392,
          durationSeconds: 0.16,
          wave: "sawtooth",
          gain: 0.18,
          pan: -0.4,
        },
      ], // G4
    },
    // 1 - Clear triangle up; two-step triangle down (pan right)
    {
      up: [
        {
          freqHz: 880,
          durationSeconds: 0.14,
          wave: "triangle",
          gain: 0.22,
          pan: 0.4,
        },
      ], // A5
      down: [
        {
          freqHz: 330,
          durationSeconds: 0.1,
          wave: "triangle",
          gain: 0.18,
          pan: 0.4,
        }, // E4
        {
          freqHz: 262,
          durationSeconds: 0.12,
          wave: "triangle",
          gain: 0.18,
          pan: 0.4,
        }, // C4
      ],
    },
    // 2 - Soft sine arpeggio up; mellow sine down (center)
    {
      up: [
        {
          freqHz: 784,
          durationSeconds: 0.08,
          wave: "sine",
          gain: 0.22,
          pan: 0,
        }, // G5
        {
          freqHz: 988,
          durationSeconds: 0.08,
          wave: "sine",
          gain: 0.22,
          pan: 0,
        }, // B5
        {
          freqHz: 1175,
          durationSeconds: 0.08,
          wave: "sine",
          gain: 0.22,
          pan: 0,
        }, // D6
      ],
      down: [
        { freqHz: 349, durationSeconds: 0.14, wave: "sine", gain: 0.2, pan: 0 },
      ], // F4
    },
    // 3 - Edgy saw up; deep square down (pan left)
    {
      up: [
        {
          freqHz: 1175,
          durationSeconds: 0.15,
          wave: "sawtooth",
          gain: 0.2,
          pan: -0.6,
        },
      ], // D6
      down: [
        {
          freqHz: 220,
          durationSeconds: 0.18,
          wave: "square",
          gain: 0.22,
          pan: -0.6,
        },
      ], // A3
    },
    // 4 - Square two-note up; soft sine down (pan right)
    {
      up: [
        {
          freqHz: 1318,
          durationSeconds: 0.09,
          wave: "square",
          gain: 0.2,
          pan: 0.6,
        }, // E6
        {
          freqHz: 1568,
          durationSeconds: 0.11,
          wave: "square",
          gain: 0.2,
          pan: 0.6,
        }, // G6
      ],
      down: [
        {
          freqHz: 330,
          durationSeconds: 0.16,
          wave: "sine",
          gain: 0.18,
          pan: 0.6,
        },
      ], // E4
    },
    // 5 - Bright triangle up; buzzy very-low saw down (center)
    {
      up: [
        {
          freqHz: 988,
          durationSeconds: 0.13,
          wave: "triangle",
          gain: 0.22,
          pan: 0,
        },
      ], // B5
      down: [
        {
          freqHz: 196,
          durationSeconds: 0.2,
          wave: "sawtooth",
          gain: 0.22,
          pan: 0,
        },
      ], // G3
    },
  ];

  const hashStringToIndex = useCallback(
    (value: string, modulo: number): number => {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0; // 32-bit
      }
      return Math.abs(hash) % modulo;
    },
    []
  );

  const getPresetForColor = useCallback(
    (color: string | undefined): SoundPreset => {
      const key = (color ?? "default").toLowerCase();
      const idx = hashStringToIndex(key, SOUND_PRESETS.length);
      return SOUND_PRESETS[idx];
    },
    [hashStringToIndex]
  );

  const playIncrementSound = useCallback(
    (color?: string) => {
      const { up } = getPresetForColor(color);
      playMelody(up);
    },
    [getPresetForColor, playMelody]
  );

  const playDecrementSound = useCallback(
    (color?: string) => {
      const { down } = getPresetForColor(color);
      playMelody(down);
    },
    [getPresetForColor, playMelody]
  );

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
          playersBeforeSave: updatedPlayers.map((p: Player) => ({
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
        const target = prev.find((p) => p.id === playerId);
        const updatedPlayers = prev.map((player) =>
          player.id === playerId
            ? { ...player, score: player.score + 1 }
            : player
        );

        // Trigger debounced auto-save
        debouncedAutoSave(updatedPlayers);

        // Play increment sound for this player's color/team
        playIncrementSound(target?.color);

        return updatedPlayers;
      });
    },
    [debouncedAutoSave, playIncrementSound]
  );

  const decrementScore = useCallback(
    (playerId: string) => {
      setPlayers((prev) => {
        const target = prev.find((p) => p.id === playerId);
        const updatedPlayers = prev.map((player) =>
          player.id === playerId
            ? { ...player, score: Math.max(0, player.score - 1) }
            : player
        );

        // Trigger debounced auto-save
        debouncedAutoSave(updatedPlayers);

        // Play decrement sound for this player's color/team
        playDecrementSound(target?.color);

        return updatedPlayers;
      });
    },
    [debouncedAutoSave, playDecrementSound]
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

  const handleResetScores = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlayers((prev) => {
        const resetPlayers = prev.map((player) => ({
          ...player,
          score: 0,
        }));
        debouncedAutoSave(resetPlayers);
        return resetPlayers;
      });
      setIsMenuOpen(false);
    },
    [debouncedAutoSave]
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
            initial={{ opacity: 0, scale: 0.9, y: -10, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: -10, filter: "blur(10px)" }}
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
              onClick={handleResetScores}
              className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-md text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Scores</span>
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
            transition={{ delay: index * 0.1, duration: 0.2 }}
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
              transition={{ duration: 0.2, ease: "easeOut" }}
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
