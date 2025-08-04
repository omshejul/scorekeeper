import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  animals,
} from "unique-names-generator";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Configuration for generating player names
const nameConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: " ",
  length: 2,
  style: "capital",
};

/**
 * Generates a random name for players
 * Examples: "Clever Fox", "Swift Bear", "Mighty Lion"
 */
export function generateCoolPlayerName(): string {
  return uniqueNamesGenerator(nameConfig);
}

/**
 * Generates multiple unique names for players with indices
 * Examples: "Thick Mouse 1", "Swift Fox 2", "Mighty Lion 3"
 */
export function generatePlayerNames(count: number): string[] {
  const baseNames: string[] = [];
  const usedNames = new Set<string>();

  // Generate base names first
  while (baseNames.length < count) {
    const name = generateCoolPlayerName();
    if (!usedNames.has(name)) {
      usedNames.add(name);
      baseNames.push(name);
    }
  }

  // Add indices to make them unique and numbered
  // return baseNames.map((name, index) => `${name} ${index + 1}`);
  return baseNames.map((name) => `${name}`);
}

/**
 * Generates a unique ID for games
 * Uses timestamp + random string to ensure uniqueness
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Generates a cool random game name
 * Examples: "Epic Battle", "Legendary Showdown", "Mystic Challenge"
 */
export function generateGameName(): string {
  const gameNames = [
    "Epic Battle",
    "Legendary Showdown", 
    "Mystic Challenge",
    "Supreme Clash",
    "Heroic Duel",
    "Ancient Rivalry",
    "Cosmic Contest", 
    "Thunder Match",
    "Golden Tournament",
    "Silver Showdown",
    "Dragon Battle",
    "Phoenix Challenge",
    "Stellar Clash",
    "Mystic Tournament", 
    "Royal Duel",
    "Crystal Contest",
    "Shadow Match",
    "Lightning Battle",
    "Storm Showdown",
    "Frost Challenge",
    "Inferno Clash",
    "Celestial Duel",
    "Titan Tournament",
    "Ethereal Battle", 
    "Void Showdown",
    "Astral Contest",
    "Primal Challenge",
    "Omega Match",
    "Quantum Clash",
    "Nebula Duel",
    "Galactic Showdown",
    "Eternal Battle",
    "Divine Tournament",
    "Mythic Challenge",
    "Infinity Contest",
    "Dimensional Warfare",
    "Chromatic Conquest",
    "Radiant Rumble",
    "Twilight Tussle",
    "Lunar Legacy",
    "Solar Strife",
    "Cosmic Carnage",
    "Astral Assault",
    "Ethereal Engagement",
    "Void Venture",
    "Celestial Siege",
    "Quantum Quest",
    "Nebula Nexus",
    "Stellar Strife",
    "Galactic Glory",
    "Neon Nights",
    "Cyber Showdown",
    "Digital Duel",
    "Virtual Venture",
    "Tech Tournament",
    "Binary Battle",
    "Circuit Clash",
    "Data Duel",
    "Pixel Pursuit",
    "Matrix Match"
  ];

  return gameNames[Math.floor(Math.random() * gameNames.length)];
}
