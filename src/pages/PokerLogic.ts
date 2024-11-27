// src/game/PokerLogic.ts

export type Card = {
  suit: '♠' | '♣' | '♥' | '♦';
  value: string;
  hidden?: boolean;
};

export type GameStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'end';

export type HandRank = {
  rank: number;
  name: string;
  cards: Card[];
  kickers: Card[];
};

export class PokerLogic {
  private readonly VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  private readonly SUITS: Card['suit'][] = ['♠', '♣', '♥', '♦'];

  createDeck(): Card[] {
    const deck = this.SUITS.flatMap(suit =>
      Object.keys(this.VALUES).map(value => ({ suit, value }))
    );
    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    return [...deck].sort(() => Math.random() - 0.5);
  }

  evaluateHand(cards: Card[]): HandRank {
    if (!Array.isArray(cards) || cards.length === 0) {
      return {
        rank: 0,
        name: 'No Hand',
        cards: [],
        kickers: [],
      };
    }

    const availableCards = cards.length;
    const combinationSize = Math.min(5, availableCards);
    const combinations = this.getCombinations(cards, combinationSize);
    let bestHand: HandRank = {
      rank: 0,
      name: 'High Card',
      cards: [],
      kickers: [],
    };

    for (const combo of combinations) {
      const handRank = this.evaluateSingleHand(combo);
      if (
        handRank.rank > bestHand.rank ||
        (handRank.rank === bestHand.rank &&
          this.compareHands(handRank, bestHand) > 0)
      ) {
        bestHand = handRank;
      }
    }

    return bestHand;
  }

  private compareKickers(kickers1: Card[], kickers2: Card[]): number {
    for (let i = 0; i < Math.max(kickers1.length, kickers2.length); i++) {
      const value1 = kickers1[i] ? this.VALUES[kickers1[i].value] : 0;
      const value2 = kickers2[i] ? this.VALUES[kickers2[i].value] : 0;
      if (value1 > value2) return 1;
      if (value1 < value2) return -1;
    }
    return 0;
  }

  private evaluateSingleHand(cards: Card[]): HandRank {
    if (!cards || cards.length === 0) {
      return {
        rank: 0,
        name: 'No Hand',
        cards: [],
        kickers: [],
      };
    }

    const sortedCards = cards.slice().sort(
      (a, b) => this.VALUES[b.value] - this.VALUES[a.value]
    );
    const valueCounts = this.getValueCounts(cards);
    const isFlush = this.isFlush(cards);
    const isStraight = this.isStraight(cards);

    // Check for hand types in order of rank
    if (isFlush && isStraight) {
      return { rank: 9, name: 'Straight Flush', cards: sortedCards, kickers: [] };
    }
    if (this.hasNOfAKind(valueCounts, 4)) {
      const fourKindValue = this.getNOfAKindValues(valueCounts, 4)[0];
      const mainCards = sortedCards.filter((card) => card.value === fourKindValue);
      const kickers = sortedCards.filter((card) => card.value !== fourKindValue);
      return {
        rank: 8,
        name: 'Four of a Kind',
        cards: mainCards,
        kickers: kickers,
      };
    }
    if (this.isFullHouse(valueCounts)) {
      const threeKindValue = this.getNOfAKindValues(valueCounts, 3)[0];
      const pairValue = this.getNOfAKindValues(valueCounts, 2)[0];
      const mainCards = sortedCards.filter(
        (card) => card.value === threeKindValue || card.value === pairValue
      );
      return {
        rank: 7,
        name: 'Full House',
        cards: mainCards,
        kickers: [],
      };
    }
    if (isFlush) {
      return { rank: 6, name: 'Flush', cards: sortedCards, kickers: [] };
    }
    if (isStraight) {
      return { rank: 5, name: 'Straight', cards: sortedCards, kickers: [] };
    }
    if (this.hasNOfAKind(valueCounts, 3)) {
      const threeKindValue = this.getNOfAKindValues(valueCounts, 3)[0];
      const mainCards = sortedCards.filter((card) => card.value === threeKindValue);
      const kickers = sortedCards.filter((card) => card.value !== threeKindValue);
      return {
        rank: 4,
        name: 'Three of a Kind',
        cards: mainCards,
        kickers: kickers,
      };
    }
    if (this.hasTwoPairs(valueCounts)) {
      const pairValues = this.getNOfAKindValues(valueCounts, 2);
      const mainCards = sortedCards.filter((card) => pairValues.includes(card.value));
      const kickers = sortedCards.filter((card) => !pairValues.includes(card.value));
      return {
        rank: 3,
        name: 'Two Pair',
        cards: mainCards,
        kickers: kickers,
      };
    }
    if (this.hasNOfAKind(valueCounts, 2)) {
      const pairValue = this.getNOfAKindValues(valueCounts, 2)[0];
      const mainCards = sortedCards.filter((card) => card.value === pairValue);
      const kickers = sortedCards.filter((card) => card.value !== pairValue);
      return {
        rank: 2,
        name: 'One Pair',
        cards: mainCards,
        kickers: kickers,
      };
    }
    return {
      rank: 1,
      name: 'High Card',
      cards: [sortedCards[0]],
      kickers: sortedCards.slice(1),
    };
  }

  private compareHands(hand1: HandRank, hand2: HandRank): number {
    // Compare the main cards in the hand (e.g., pair, three of a kind)
    for (let i = 0; i < hand1.cards.length; i++) {
      const value1 = this.VALUES[hand1.cards[i].value];
      const value2 = this.VALUES[hand2.cards[i].value];
      if (value1 > value2) return 1;
      if (value1 < value2) return -1;
    }
    // If main hand cards are equal, compare kickers
    return this.compareKickers(hand1.kickers, hand2.kickers);
  }

  private hasNOfAKind(
    valueCounts: Record<string, number>,
    n: number
  ): boolean {
    return Object.values(valueCounts).some((count) => count === n);
  }

  private getNOfAKindValues(
    valueCounts: Record<string, number>,
    n: number
  ): string[] {
    return Object.keys(valueCounts)
      .filter((value) => valueCounts[value] === n)
      .sort((a, b) => this.VALUES[b] - this.VALUES[a]);
  }

  private hasTwoPairs(valueCounts: Record<string, number>): boolean {
    return (
      Object.values(valueCounts).filter((count) => count === 2).length >= 2
    );
  }

  private getFullHouseKickers(cards: Card[]): Card[] {
    const valueCounts = this.getValueCounts(cards);
    const sortedValues = Object.entries(valueCounts)
        .sort(([v1, c1], [v2, c2]) => 
            c2 - c1 || this.VALUES[v2] - this.VALUES[v1]
        );
    
    const threeOfAKindValue = sortedValues[0][0];
    const pairValue = sortedValues[1][0];
    
    return cards
        .sort((a, b) => {
            if (a.value === threeOfAKindValue && b.value !== threeOfAKindValue) return -1;
            if (a.value !== threeOfAKindValue && b.value === threeOfAKindValue) return 1;
            if (a.value === pairValue && b.value !== pairValue) return -1;
            if (a.value !== pairValue && b.value === pairValue) return 1;
            return this.VALUES[b.value] - this.VALUES[a.value];
        });
  }

  private getTwoPairKickers(cards: Card[]): Card[] {
    const valueCounts = this.getValueCounts(cards);
    const pairs = Object.entries(valueCounts)
        .filter(([_, count]) => count === 2)
        .sort(([v1], [v2]) => this.VALUES[v2] - this.VALUES[v1]);
    
    const highPairValue = pairs[0][0];
    const lowPairValue = pairs[1][0];
    
    return cards
        .sort((a, b) => {
            if (a.value === highPairValue && b.value !== highPairValue) return -1;
            if (a.value !== highPairValue && b.value === highPairValue) return 1;
            if (a.value === lowPairValue && b.value !== lowPairValue) return -1;
            if (a.value !== lowPairValue && b.value === lowPairValue) return 1;
            return this.VALUES[b.value] - this.VALUES[a.value];
        });
  }

  private getKickers(cards: Card[], count: number): Card[] {
    const valueCounts = this.getValueCounts(cards);
    const sortedCards = cards.sort((a, b) => this.VALUES[b.value] - this.VALUES[a.value]);
    const kickers = sortedCards.filter(card => valueCounts[card.value] < count);
    return kickers.slice(0, 5 - count);
  }

  private getCombinations(cards: Card[], r: number): Card[][] {
    if (r > cards.length) {
      return [];
    }
    if (r === cards.length) {
      return [cards];
    }
    if (r === 1) {
      return cards.map(card => [card]);
    }

    const combinations: Card[][] = [];
    const remainingCards = cards.slice(1);
    const combosWithoutFirst = this.getCombinations(remainingCards, r);
    const combosWithFirst = this.getCombinations(remainingCards, r - 1)
      .map(combo => [cards[0], ...combo]);

    return [...combosWithFirst, ...combosWithoutFirst];
  }

  private isStraightFlush(cards: Card[]): boolean {
    return this.isFlush(cards) && this.isStraight(cards);
  }

  private isFourOfAKind(cards: Card[]): boolean {
    const valueCounts = this.getValueCounts(cards);
    return Object.values(valueCounts).includes(4);
  }

  private isFullHouse(cards: Card[]): boolean {
    const valueCounts = this.getValueCounts(cards);
    const counts = Object.values(valueCounts);
    return counts.includes(3) && counts.includes(2);
  }

  private isFlush(cards: Card[]): boolean {
    return new Set(cards.map(card => card.suit)).size === 1;
  }

  private isStraight(cards: Card[]): boolean {
    const values = cards
      .map(card => this.VALUES[card.value])
      .sort((a, b) => a - b);
    
    // Check regular straight
    let isRegularStraight = true;
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        isRegularStraight = false;
        break;
      }
    }
    
    // Check Ace-low straight (A-2-3-4-5)
    let isAceLowStraight = false;
    if (values.includes(14)) { // Has Ace
      const aceLowValues = values.map(v => v === 14 ? 1 : v).sort((a, b) => a - b);
      isAceLowStraight = true;
      for (let i = 1; i < aceLowValues.length; i++) {
        if (aceLowValues[i] !== aceLowValues[i - 1] + 1) {
          isAceLowStraight = false;
          break;
        }
      }
    }

    return isRegularStraight || isAceLowStraight;
  }

  private isThreeOfAKind(cards: Card[]): boolean {
    const valueCounts = this.getValueCounts(cards);
    return Object.values(valueCounts).includes(3);
  }

  private isTwoPair(cards: Card[]): boolean {
    const valueCounts = this.getValueCounts(cards);
    return Object.values(valueCounts).filter(count => count === 2).length === 2;
  }

  private isPair(cards: Card[]): boolean {
    const valueCounts = this.getValueCounts(cards);
    return Object.values(valueCounts).includes(2);
  }

  private getValueCounts(cards: Card[]): Record<string, number> {
    if (!Array.isArray(cards) || cards.length === 0) {
      return {};
    }

    // Ensure all cards have a value property
    if (!cards.every(card => card && typeof card.value === 'string')) {
      return {};
    }

    // Create an initial empty object with type annotation
    const counts: Record<string, number> = {};

    // Use forEach instead of reduce for more reliable behavior
    cards.forEach(card => {
      counts[card.value] = (counts[card.value] || 0) + 1;
    });

    return counts;
  }

  validateBet(bet: number, chips: number, currentBet: number): boolean {
    return bet <= chips && bet >= currentBet;
  }

  calculateCallAmount(currentBet: number, playerBet: number): number {
    return Math.max(0, currentBet - playerBet);
  }

  // Add new method to calculate hand equity
  calculateHandEquity(hand: Card[], communityCards: Card[]): number {
    const remainingCards = this.createDeck().filter(card => 
      !hand.some(h => h.value === card.value && h.suit === card.suit) &&
      !communityCards.some(c => c.value === card.value && c.suit === card.suit)
    );
    
    let wins = 0;
    const iterations = 100; // Monte Carlo simulation iterations
    
    for (let i = 0; i < iterations; i++) {
      const shuffledRemaining = this.shuffleDeck([...remainingCards]);
      const neededCommunity = 5 - communityCards.length;
      const simulatedCommunity = [...communityCards, ...shuffledRemaining.slice(0, neededCommunity)];
      const opponentHand = [shuffledRemaining[neededCommunity], shuffledRemaining[neededCommunity + 1]];
      
      const playerHand = this.evaluateHand([...hand, ...simulatedCommunity]);
      const oppHand = this.evaluateHand([...opponentHand, ...simulatedCommunity]);
      
      if (playerHand.rank > oppHand.rank || 
          (playerHand.rank === oppHand.rank && 
           this.compareKickers(playerHand.kickers, oppHand.kickers) > 0)) {
        wins++;
      }
    }
    
    return wins / iterations;
  }

  // Add position evaluator
  evaluatePosition(position: 'early' | 'middle' | 'late', gameStage: GameStage): number {
    const positionValues = {
      early: { preflop: 0.7, flop: 0.8, turn: 0.9, river: 1 },
      middle: { preflop: 0.8, flop: 0.9, turn: 1, river: 1 },
      late: { preflop: 1, flop: 1, turn: 1, river: 1 }
    };
    return positionValues[position][gameStage] || 1;
  }

  // Add pot odds calculator
  calculatePotOdds(callAmount: number, potSize: number): number {
    return callAmount / (potSize + callAmount);
  }
}