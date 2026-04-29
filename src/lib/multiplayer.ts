import { Card, Hand } from './gameTypes';

export type MultiplayerPlayer = {
  socketId: string;
  name: string;
  host: boolean;
  balance: number;
  connected: boolean;
};

export type MultiplayerRoomState = {
  roomId: string;
  ownerId: string;
  gameState: 'betting' | 'playing' | 'dealerTurn' | 'finished';
  playerHand: Hand;
  dealerHand: Hand;
  dealerUpCard: Card | null;
  currentBet: number;
  message: string;
  playerWon: boolean | null;
  isDraw: boolean;
  activePlayerId: string | null;
  players: MultiplayerPlayer[];
  roundNumber: number;
  finished: boolean;
};

export type RoomAck = {
  ok: boolean;
  error?: string;
  playerId?: string;
  room?: MultiplayerRoomState;
};
