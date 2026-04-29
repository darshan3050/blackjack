import { Card, GameData } from './gameTypes';
import { createHand } from './cardUtils';

export function hitPlayer(game: GameData, newCard: Card): GameData {
  const playerHand = createHand([...game.playerHand.cards, newCard]);

  if (playerHand.isBust) {
    return {
      ...game,
      playerHand,
      gameState: 'finished',
      playerWon: false,
      isDraw: false,
      message: 'Bust! Dealer wins.',
    };
  }

  return { ...game, playerHand };
}

export function stand(game: GameData): GameData {
  return {
    ...game,
    gameState: 'dealerTurn',
    message: "You've stood. Dealer's turn...",
  };
}

export function doubleDown(game: GameData, newCard: Card): GameData {
  const playerHand = createHand([...game.playerHand.cards, newCard]);
  const newBet = game.currentBet * 2;

  if (playerHand.isBust) {
    return {
      ...game,
      playerHand,
      currentBet: newBet,
      gameState: 'finished',
      playerWon: false,
      isDraw: false,
      message: 'Bust! Dealer wins.',
    };
  }

  return {
    ...game,
    playerHand,
    currentBet: newBet,
    gameState: 'dealerTurn',
    message: 'Doubled down. Dealer is playing...',
  };
}

export function dealerPlay(game: GameData, newCard: Card | null): GameData {
  let dealerHand = game.dealerHand;

  if (newCard) {
    dealerHand = createHand([...dealerHand.cards, newCard]);
  }

  if (dealerHand.isBust) {
    return {
      ...game,
      dealerHand,
      gameState: 'finished',
      playerWon: true,
      isDraw: false,
      message: 'Dealer busted! You win!',
      balance: game.balance + game.currentBet,
    };
  }

  if (dealerHand.value < 17) {
    return {
      ...game,
      dealerHand,
      message: 'Dealer hits...',
    };
  }

  // Dealer stands
  const result = determineWinner(game.playerHand.value, dealerHand.value);

  if (result === 'player') {
    return {
      ...game,
      dealerHand,
      gameState: 'finished',
      playerWon: true,
      isDraw: false,
      message: 'You win!',
      balance: game.balance + game.currentBet,
    };
  } else if (result === 'dealer') {
    return {
      ...game,
      dealerHand,
      gameState: 'finished',
      playerWon: false,
      isDraw: false,
      message: 'Dealer wins.',
      balance: game.balance - game.currentBet,
    };
  } else {
    return {
      ...game,
      dealerHand,
      gameState: 'finished',
      playerWon: false,
      isDraw: true,
      message: "It's a tie!",
      balance: game.balance,
    };
  }
}

export function determineWinner(playerValue: number, dealerValue: number): 'player' | 'dealer' | 'draw' {
  if (playerValue > dealerValue) {
    return 'player';
  } else if (dealerValue > playerValue) {
    return 'dealer';
  } else {
    return 'draw';
  }
}
