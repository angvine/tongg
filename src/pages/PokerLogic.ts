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
  kickers?: Card[];
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
    const combinations = this.getCombinations(cards, 5);
    let bestHand: HandRank = {
      rank: -1,
      name: '',
      cards: [],
      kickers: [] as Card[]
    };

    for (const combo of combinations) {
      const currentHand = this.evaluateSingleHand(combo);
      if (currentHand.rank > bestHand.rank || 
          (currentHand.rank === bestHand.rank && this.compareKickers(currentHand.kickers, bestHand.kickers) > 0)) {
        bestHand = currentHand;
      }
    }

    return bestHand;
  }

  private compareKickers(kickers1: Card[], kickers2: Card[]): number {
    for (let i = 0; i < kickers1.length; i++) {
      const value1 = this.VALUES[kickers1[i].value];
      const value2 = this.VALUES[kickers2[i].value];
      if (value1 !== value2) return value1 - value2;
    }
    return 0;
  }

  private evaluateSingleHand(cards: Card[]): HandRank & { kickers: Card[] } {
    if (cards.length !== 5) throw new Error('Invalid hand size');

    const sortedCards = [...cards].sort((a, b) => this.VALUES[b.value] - this.VALUES[a.value]);
    
    if (this.isStraightFlush(cards)) return { rank: 8, name: 'Straight Flush', cards, kickers: sortedCards };
    if (this.isFourOfAKind(cards)) return { rank: 7, name: 'Four of a Kind', cards, kickers: this.getKickers(cards, 4) };
    if (this.isFullHouse(cards)) return { rank: 6, name: 'Full House', cards, kickers: this.getFullHouseKickers(cards) };
    if (this.isFlush(cards)) return { rank: 5, name: 'Flush', cards, kickers: sortedCards };
    if (this.isStraight(cards)) return { rank: 4, name: 'Straight', cards, kickers: sortedCards };
    if (this.isThreeOfAKind(cards)) return { rank: 3, name: 'Three of a Kind', cards, kickers: this.getKickers(cards, 3) };
    if (this.isTwoPair(cards)) return { rank: 2, name: 'Two Pair', cards, kickers: this.getTwoPairKickers(cards) };
    if (this.isPair(cards)) return { rank: 1, name: 'Pair', cards, kickers: this.getKickers(cards, 2) };
    return { rank: 0, name: 'High Card', cards, kickers: sortedCards };
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
    if (r > cards.length) return [];
    if (r === cards.length) return [cards];
    if (r === 1) return cards.map(card => [card]);

    const combinations: Card[][] = [];
    const firstCard = cards[0];
    const remainingCards = cards.slice(1);
    const combinationsWithoutFirst = this.getCombinations(remainingCards, r);
    const combinationsWithFirst = this.getCombinations(remainingCards, r - 1)
      .map(combo => [firstCard, ...combo]);

    return [...combinationsWithFirst, ...combinationsWithoutFirst];
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
    return cards.reduce((counts, card) => {
      counts[card.value] = (counts[card.value] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  validateBet(bet: number, chips: number, currentBet: number): boolean {
    return bet <= chips && bet >= currentBet;
  }

  calculateCallAmount(currentBet: number, playerBet: number): number {
    return Math.max(0, currentBet - playerBet);
  }
}