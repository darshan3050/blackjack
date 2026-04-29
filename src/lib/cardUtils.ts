import { Card, Hand, Rank, Suit } from './gameTypes';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}-${id}` });
      id++;
    }
  }

  return deck.sort(() => Math.random() - 0.5);
}

export function calculateHandValue(cards: Card[]): { value: number; isBust: boolean } {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      value += 10;
    } else {
      value += parseInt(card.rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return { value, isBust: value > 21 };
}

export function createHand(cards: Card[]): Hand {
  const { value, isBust } = calculateHandValue(cards);
  return { cards, value, isBust };
}

export function isBlackjack(hand: Hand): boolean {
  return hand.cards.length === 2 && hand.value === 21;
}

export function hasCard(hand: Hand): boolean {
  return hand.cards.length > 0;
}
