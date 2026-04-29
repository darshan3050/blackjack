export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Hand {
  cards: Card[];
  value: number;
  isBust: boolean;
}

export type GameState = 'betting' | 'playing' | 'dealerTurn' | 'finished';

export interface GameData {
  playerHand: Hand;
  dealerHand: Hand;
  dealerUpCard: Card | null;
  gameState: GameState;
  balance: number;
  currentBet: number;
  message: string;
  playerWon: boolean | null;
  isDraw: boolean;
}
