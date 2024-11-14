import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Card, Text } from '@telegram-apps/telegram-ui';
import styles from './MemoryMatch.module.css';

type CardType = {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
};

export function MemoryMatch() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const initializeCards = () => {
    const values = ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎫', '🎰'];
    const initialCards = [...values, ...values]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }));
    setCards(initialCards);
    setMoves(0);
    setIsGameComplete(false);
  };

  useEffect(() => {
    initializeCards();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    if (cards[id].matched || cards[id].flipped) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlippedCards;

      if (cards[first].value === cards[second].value) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedCards([]);

          if (matchedCards.every(card => card.matched)) {
            setIsGameComplete(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text variant="h1" className={styles.title}>Memory Match</Text>
        <Text variant="body">Moves: {moves}</Text>

        <div className={styles.grid}>
          {cards.map(card => (
            <Card
              key={card.id}
              className={`${styles.card} ${card.flipped ? styles.flipped : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>?</div>
                <div className={styles.cardBack}>{card.value}</div>
              </div>
            </Card>
          ))}
        </div>

        {isGameComplete && (
          <div className={styles.gameComplete}>
            <Text variant="h2">Congratulations! 🎉</Text>
            <Text>You won in {moves} moves!</Text>
            <Button onClick={initializeCards}>Play Again</Button>
          </div>
        )}
      </div>
    </Page>
  );
}