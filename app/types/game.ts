export interface Player {
  id: string
  name: string
  score: number
  color: string
}

export interface Game {
  id: string
  name: string
  players: Player[]
  createdAt: Date
  lastPlayed: Date
}

export const PLAYER_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#14B8A6', // Teal
] as const