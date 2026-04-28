import { Card, Hand } from './gameTypes';

export type MultiplayerRoomState = {
  roomId: string;
  gameState: 'betting' | 'playing' | 'dealerTurn' | 'finished';
  playerHand: Hand;
  dealerHand: Hand;
  dealerUpCard: Card | null;
  currentBet: number;
  message: string;
  playerWon: boolean | null;
  isDraw: boolean;
  turnOrder: string[];
  activePlayerId: string | null;
  players: Record<string, { id: string; name: string; balance: number; connected: boolean }>;
  roundNumber: number;
  finished: boolean;
};
