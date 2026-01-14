
export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'brush' | 'eraser' | 'neon';
}

export interface AIResponse {
  critique: string;
  suggestion: string;
  palette: string[];
  backstory: string;
}

export type AppState = 'drawing' | 'analyzing' | 'viewing-result';
