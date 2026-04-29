'use client';

import { useState, useCallback, useEffect } from 'react';
import { GameData, GameState } from '@/lib/gameTypes';
import { createDeck, createHand } from '@/lib/cardUtils';
import { hitPlayer, stand, doubleDown, dealerPlay } from '@/lib/gameLogic';
import { HandDisplay } from './Hand';
import { GameControls } from './GameControls';
import { BettingControls } from './BettingControls';

const INITIAL_BALANCE = 500;
const BALANCE_STORAGE_KEY = 'blackjack-balance';

function getInitialGame(): GameData {
  const storedBalance =
    typeof window === 'undefined' ? null : window.localStorage.getItem(BALANCE_STORAGE_KEY);
  const parsedBalance = storedBalance ? Number(storedBalance) : NaN;
  const balance = Number.isFinite(parsedBalance) && parsedBalance >= 0 ? parsedBalance : INITIAL_BALANCE;

  return {
    playerHand: { cards: [], value: 0, isBust: false },
    dealerHand: { cards: [], value: 0, isBust: false },
    dealerUpCard: null,
    gameState: 'betting',
    balance,
    currentBet: 0,
    message: 'Place your bet to begin',
    playerWon: null,
    isDraw: false,
  };
}

export function GameBoard() {
  const [deck, setDeck] = useState(() => createDeck());
  const [gameState, setGameState] = useState<GameState>('betting');
  const [game, setGame] = useState<GameData>(getInitialGame);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(BALANCE_STORAGE_KEY, String(game.balance));
  }, [game.balance]);

  const dealInitialCards = useCallback((betAmount: number) => {
    const newDeck = deck.length < 10 ? createDeck() : deck;
    const playerCards = [newDeck[0], newDeck[1]];
    const dealerCards = [newDeck[2], newDeck[3]];

    const playerHand = createHand(playerCards);
    const dealerHand = createHand(dealerCards);

    const newGame: GameData = {
      playerHand,
      dealerHand,
      dealerUpCard: dealerCards[0],
      gameState: 'playing',
      balance: game.balance - betAmount,
      currentBet: betAmount,
      message: 'Your turn!',
      playerWon: null,
      isDraw: false,
    };

    setDeck(newDeck.slice(4));
    setGameState('playing');
    setGame(newGame);
  }, [deck, game.balance]);

  const dealerPlayTurn = useCallback(
    (currentGame: GameData) => {
      let tempGame = currentGame;

      const playDealer = (g: GameData, d: typeof deck) => {
        let newDeck = d.length === 0 ? createDeck() : d;

        if (tempGame.dealerHand.value < 17) {
          const newCard = newDeck[0];
          tempGame = dealerPlay(g, newCard);
          newDeck = newDeck.slice(1);

          setTimeout(() => {
            playDealer(tempGame, newDeck);
          }, 800);
        } else {
          tempGame = dealerPlay(g, null);
          setDeck(newDeck);
          setGameState('finished');
          setGame(tempGame);
        }
      };

      playDealer(currentGame, deck);
    },
    [deck]
  );

  const handleHit = useCallback(() => {
    if (deck.length === 0) {
      setDeck(createDeck());
    }

    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const updatedGame = hitPlayer(game, newCard);

    setDeck(newDeck);
    setGameState(updatedGame.gameState);
    setGame(updatedGame);
  }, [deck, game]);

  const handleStand = useCallback(() => {
    const updatedGame = stand(game);
    setGameState(updatedGame.gameState);
    setGame(updatedGame);

    setTimeout(() => {
      dealerPlayTurn(updatedGame);
    }, 500);
  }, [game, dealerPlayTurn]);

  const handleDoubleDown = useCallback(() => {
    if (deck.length === 0) {
      setDeck(createDeck());
    }

    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const updatedGame = doubleDown(game, newCard);

    setDeck(newDeck);
    setGameState(updatedGame.gameState);
    setGame(updatedGame);

    setTimeout(() => {
      dealerPlayTurn(updatedGame);
    }, 500);
  }, [deck, game, dealerPlayTurn]);

  const handleNewGame = useCallback(() => {
    setGameState('betting');
    setGame({
      playerHand: { cards: [], value: 0, isBust: false },
      dealerHand: { cards: [], value: 0, isBust: false },
      dealerUpCard: null,
      gameState: 'betting',
      balance: game.balance,
      currentBet: 0,
      message: 'Place your bet to begin',
      playerWon: null,
      isDraw: false,
    });
  }, [game.balance]);

  const handlePlayAgain = useCallback(() => {
    dealInitialCards(game.currentBet);
  }, [game.currentBet, dealInitialCards]);

  const handleBet = (betAmount: number) => {
    dealInitialCards(betAmount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Message Display - Enhanced */}
      <div className={`mb-8 p-6 rounded-2xl text-center font-bold text-xl slide-up-animation transform transition-all duration-500 ${
        game.playerWon === true
          ? 'bg-linear-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/60 text-green-300 shadow-lg shadow-green-500/20'
          : game.playerWon === false
          ? 'bg-linear-to-r from-red-900/50 to-rose-900/50 border-2 border-red-500/60 text-red-300 shadow-lg shadow-red-500/20'
          : game.isDraw
          ? 'bg-linear-to-r from-yellow-900/50 to-amber-900/50 border-2 border-yellow-500/60 text-yellow-300 shadow-lg shadow-amber-500/20'
          : 'bg-linear-to-r from-slate-800/60 to-slate-700/60 border-2 border-slate-600/60 text-slate-300'
      }`}>
        <div className="inline-block">
          {game.playerWon === true && <span className="mr-2">🎉</span>}
          {game.playerWon === false && <span className="mr-2">💔</span>}
          {game.isDraw && <span className="mr-2">🤝</span>}
          {game.message}
          {game.playerWon === true && <span className="ml-2">🎉</span>}
        </div>
      </div>

      {/* Game Board - Enhanced */}
      {gameState !== 'betting' && (
        <div className="bg-linear-to-b from-slate-900/80 via-slate-800/80 to-slate-900/80 rounded-3xl p-8 mb-8 border-2 border-amber-500/40 shadow-2xl glass-alt backdrop-blur-xl relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.1)_0%,transparent_50%)] pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Dealer Hand - Enhanced */}
            <div className="mb-12 pb-8 border-b border-slate-700/50">
              <HandDisplay
                hand={game.dealerHand}
                title="🎰 Dealer"
                hideFirstCard={gameState === 'playing' && game.dealerHand.cards.length > 0}
                isDealer={true}
              />
            </div>

            {/* Player Hand - Enhanced */}
            <div className="mb-12 p-6 bg-slate-800/50 rounded-xl border border-amber-500/20">
              <HandDisplay hand={game.playerHand} title="👤 Your Hand" />
            </div>

            {/* Current Bet - Enhanced */}
            <div className="mb-8 text-center p-4 bg-linear-to-r from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-500/30">
              <p className="text-amber-300 text-lg font-semibold mb-1">Current Bet</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-amber-500">
                ${game.currentBet}
              </p>
            </div>

            {/* Game Controls */}
            <GameControls
              onHit={handleHit}
              onStand={handleStand}
              onDoubleDown={handleDoubleDown}
              onNewGame={handleNewGame}
              onPlayAgain={handlePlayAgain}
              canHit={gameState === 'playing'}
              canStand={gameState === 'playing'}
              canDoubleDown={gameState === 'playing' && game.playerHand.cards.length === 2}
              gameFinished={gameState === 'finished'}
              lastBet={game.currentBet}
            />
          </div>
        </div>
      )}

      {/* Betting Controls */}
      {gameState === 'betting' && (
        <div className="bounce-animation">
          <BettingControls
            balance={game.balance}
            onBet={handleBet}
            disabled={gameState !== 'betting'}
          />
        </div>
      )}

      {/* Balance Display - Enhanced */}
      <div className="text-center mt-12 p-6 bg-linear-to-r from-slate-800/60 to-slate-700/60 rounded-2xl border border-slate-600/40 glass">
        <p className="text-slate-400 text-sm font-medium mb-2">💰 Total Balance</p>
        <p className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-amber-500">
          ${game.balance}
        </p>
      </div>
    </div>
  );
}
