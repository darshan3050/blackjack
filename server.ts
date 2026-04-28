import { createServer } from 'http';
import { randomUUID } from 'crypto';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { createDeck, createHand } from './src/lib/cardUtils';
import { Card, GameData, GameState } from './src/lib/gameTypes';

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const DEFAULT_BALANCE = 500;

type RoomPlayer = {
  id: string;
  name: string;
  balance: number;
  connected: boolean;
};

type RoomState = {
  roomId: string;
  deck: Card[];
  gameState: GameState;
  playerHand: GameData['playerHand'];
  dealerHand: GameData['dealerHand'];
  dealerUpCard: Card | null;
  currentBet: number;
  message: string;
  playerWon: boolean | null;
  isDraw: boolean;
  turnOrder: string[];
  activePlayerId: string | null;
  players: Record<string, RoomPlayer>;
  roundNumber: number;
  finished: boolean;
};

const rooms = new Map<string, RoomState>();

function createRoom(roomId: string): RoomState {
  return {
    roomId,
    deck: createDeck(),
    gameState: 'betting',
    playerHand: { cards: [], value: 0, isBust: false },
    dealerHand: { cards: [], value: 0, isBust: false },
    dealerUpCard: null,
    currentBet: 0,
    message: 'Waiting for players to join',
    playerWon: null,
    isDraw: false,
    turnOrder: [],
    activePlayerId: null,
    players: {},
    roundNumber: 0,
    finished: false,
  };
}

function getRoom(roomId: string): RoomState {
  const room = rooms.get(roomId);
  if (room) {
    return room;
  }

  const freshRoom = createRoom(roomId);
  rooms.set(roomId, freshRoom);
  return freshRoom;
}

function cloneRoom(room: RoomState): RoomState {
  return {
    ...room,
    deck: [...room.deck],
    playerHand: {
      ...room.playerHand,
      cards: [...room.playerHand.cards],
    },
    dealerHand: {
      ...room.dealerHand,
      cards: [...room.dealerHand.cards],
    },
    dealerUpCard: room.dealerUpCard,
    turnOrder: [...room.turnOrder],
    players: Object.fromEntries(
      Object.entries(room.players).map(([id, player]) => [id, { ...player }])
    ),
  };
}

function computeHandValue(cards: Card[]) {
  const hand = createHand(cards);
  return hand;
}

function ensureDeck(room: RoomState) {
  if (room.deck.length < 12) {
    room.deck = createDeck();
  }
}

function dealRound(room: RoomState) {
  ensureDeck(room);

  const playerCards = [room.deck[0], room.deck[1]];
  const dealerCards = [room.deck[2], room.deck[3]];

  room.playerHand = createHand(playerCards);
  room.dealerHand = createHand(dealerCards);
  room.dealerUpCard = dealerCards[0];
  room.deck = room.deck.slice(4);
  room.currentBet = 0;
  room.playerWon = null;
  room.isDraw = false;
  room.finished = false;
  room.gameState = 'betting';
  room.message = 'Place your bet to begin';
}

function startMultiplayerRound(room: RoomState, playerId: string, betAmount: number) {
  const player = room.players[playerId];
  if (!player || player.balance < betAmount || betAmount <= 0) {
    return;
  }

  ensureDeck(room);

  const playerCards = [room.deck[0], room.deck[1]];
  const dealerCards = [room.deck[2], room.deck[3]];

  room.playerHand = createHand(playerCards);
  room.dealerHand = createHand(dealerCards);
  room.dealerUpCard = dealerCards[0];
  room.deck = room.deck.slice(4);
  room.currentBet = betAmount;
  room.gameState = 'playing';
  room.playerWon = null;
  room.isDraw = false;
  room.finished = false;
  room.activePlayerId = playerId;
  room.message = `${player.name}'s turn`;
  player.balance -= betAmount;
  room.turnOrder = room.turnOrder.length > 0 ? room.turnOrder : [playerId];
}

function applyDealerResult(room: RoomState) {
  const dealerValue = room.dealerHand.value;
  const playerValue = room.playerHand.value;

  if (room.dealerHand.isBust) {
    room.playerWon = true;
    room.isDraw = false;
    room.message = 'Dealer busted!';
    room.finished = true;
    room.gameState = 'finished';
    return;
  }

  if (playerValue > dealerValue) {
    room.playerWon = true;
    room.isDraw = false;
    room.message = 'You win!';
    room.finished = true;
    room.gameState = 'finished';
    return;
  }

  if (dealerValue > playerValue) {
    room.playerWon = false;
    room.isDraw = false;
    room.message = 'Dealer wins.';
    room.finished = true;
    room.gameState = 'finished';
    return;
  }

  room.playerWon = false;
  room.isDraw = true;
  room.message = "It's a tie!";
  room.finished = true;
  room.gameState = 'finished';
}

function dealerTurn(room: RoomState) {
  ensureDeck(room);

  while (room.dealerHand.value < 17 && !room.dealerHand.isBust) {
    const newCard = room.deck[0];
    room.deck = room.deck.slice(1);
    room.dealerHand = createHand([...room.dealerHand.cards, newCard]);
  }

  if (!room.dealerHand.isBust) {
    if (room.dealerHand.value >= 17) {
      applyDealerResult(room);
    }
  } else {
    room.playerWon = true;
    room.isDraw = false;
    room.message = 'Dealer busted!';
    room.finished = true;
    room.gameState = 'finished';
  }
}

function serializeRoom(room: RoomState) {
  return {
    roomId: room.roomId,
    gameState: room.gameState,
    playerHand: room.playerHand,
    dealerHand: room.dealerHand,
    dealerUpCard: room.dealerUpCard,
    currentBet: room.currentBet,
    message: room.message,
    playerWon: room.playerWon,
    isDraw: room.isDraw,
    turnOrder: room.turnOrder,
    activePlayerId: room.activePlayerId,
    players: room.players,
    roundNumber: room.roundNumber,
    finished: room.finished,
  };
}

function emitRoom(io: SocketIOServer, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  io.to(roomId).emit('room:update', serializeRoom(room));
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    socket.on('room:join', ({ roomId, name }: { roomId: string; name?: string }) => {
      const room = getRoom(roomId);
      const playerId = socket.id;
      const playerName = name?.trim() || `Player ${room.turnOrder.length + 1}`;

      room.players[playerId] = {
        id: playerId,
        name: playerName,
        balance: room.players[playerId]?.balance ?? DEFAULT_BALANCE,
        connected: true,
      };

      if (!room.turnOrder.includes(playerId)) {
        room.turnOrder.push(playerId);
      }

      socket.join(roomId);
      socket.emit('room:joined', {
        roomId,
        playerId,
        state: serializeRoom(room),
      });
      emitRoom(io, roomId);
    });

    socket.on('room:startRound', ({ roomId, betAmount }: { roomId: string; betAmount: number }) => {
      const room = getRoom(roomId);
      const player = room.players[socket.id];
      if (!player) {
        return;
      }

      if (room.gameState === 'playing') {
        return;
      }

      if (player.balance < betAmount) {
        socket.emit('room:error', { message: 'Insufficient balance' });
        return;
      }

      startMultiplayerRound(room, socket.id, betAmount);
      emitRoom(io, roomId);
    });

    socket.on('room:hit', ({ roomId }: { roomId: string }) => {
      const room = getRoom(roomId);
      if (room.activePlayerId !== socket.id || room.gameState !== 'playing') {
        return;
      }

      ensureDeck(room);
      const newCard = room.deck[0];
      room.deck = room.deck.slice(1);
      room.playerHand = createHand([...room.playerHand.cards, newCard]);

      if (room.playerHand.isBust) {
        room.playerWon = false;
        room.isDraw = false;
        room.finished = true;
        room.gameState = 'finished';
        room.message = 'Bust! Dealer wins.';
      }

      emitRoom(io, roomId);
    });

    socket.on('room:stand', ({ roomId }: { roomId: string }) => {
      const room = getRoom(roomId);
      if (room.activePlayerId !== socket.id || room.gameState !== 'playing') {
        return;
      }

      room.gameState = 'dealerTurn';
      room.message = "Dealer's turn...";
      emitRoom(io, roomId);

      setTimeout(() => {
        dealerTurn(room);
        if (room.playerWon) {
          const player = room.players[socket.id];
          if (player) {
            player.balance += room.currentBet * 2;
          }
        } else if (room.isDraw) {
          const player = room.players[socket.id];
          if (player) {
            player.balance += room.currentBet;
          }
        }

        emitRoom(io, roomId);
      }, 900);
    });

    socket.on('room:double', ({ roomId }: { roomId: string }) => {
      const room = getRoom(roomId);
      if (room.activePlayerId !== socket.id || room.gameState !== 'playing') {
        return;
      }

      const player = room.players[socket.id];
      if (!player || player.balance < room.currentBet) {
        return;
      }

      player.balance -= room.currentBet;
      room.currentBet *= 2;
      ensureDeck(room);
      const newCard = room.deck[0];
      room.deck = room.deck.slice(1);
      room.playerHand = createHand([...room.playerHand.cards, newCard]);

      if (room.playerHand.isBust) {
        room.playerWon = false;
        room.isDraw = false;
        room.finished = true;
        room.gameState = 'finished';
        room.message = 'Bust! Dealer wins.';
        emitRoom(io, roomId);
        return;
      }

      room.gameState = 'dealerTurn';
      room.message = 'Doubled down. Dealer is playing...';
      emitRoom(io, roomId);

      setTimeout(() => {
        dealerTurn(room);
        if (room.playerWon) {
          player.balance += room.currentBet * 2;
        } else if (room.isDraw) {
          player.balance += room.currentBet;
        }
        emitRoom(io, roomId);
      }, 900);
    });

    socket.on('room:playAgain', ({ roomId }: { roomId: string }) => {
      const room = getRoom(roomId);
      const player = room.players[socket.id];
      if (!player) {
        return;
      }

      if (room.currentBet <= 0) {
        return;
      }

      startMultiplayerRound(room, socket.id, room.currentBet);
      emitRoom(io, roomId);
    });

    socket.on('disconnect', () => {
      for (const room of rooms.values()) {
        if (room.players[socket.id]) {
          room.players[socket.id].connected = false;
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
  });
});
