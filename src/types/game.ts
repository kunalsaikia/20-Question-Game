export type AnswerChoice = 'yes' | 'no' | 'sometimes' | 'unknown';

export interface GameObject {
  name: string;
  attributes: Record<string, number>; // 0.0 to 1.0
  category?: string;
  learned?: boolean;
}

export interface KnowledgeData {
  objects: GameObject[];
  questions: Record<string, string>;
}

export interface AnswerRecord {
  qKey: string;
  prompt: string;
  answer: AnswerChoice;
  weight: number | null; // 1.0, 0.0, 0.5, or null for unknown
  roundNumber: number;
}

export type GamePhase = 
  | 'READY'            // Device initialized, user thinking of an item
  | 'PLAYING'          // Answering questions (up to 20)
  | 'GUESSING'         // Device making its guess ("I guess it is a...")
  | 'VICTORY'          // Device guessed correctly
  | 'LEARNING'         // Device guessed wrong, user teaching the new item & question
  | 'LEARNED_SUCCESS'; // Memory flashed and saved!

export type BacklightTheme = 'emerald' | 'amber' | 'cyan' | 'ruby';

export type DeviceExpression = 
  | 'idle' 
  | 'thinking' 
  | 'curious' 
  | 'smug' 
  | 'celebrating' 
  | 'puzzled' 
  | 'learning';

export interface CandidateScore {
  name: string;
  score: number; // 0 or negative penalty value
  matchPercentage: number;
}
