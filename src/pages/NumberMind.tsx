// src/pages/NumberMind.tsx
import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Text, Input } from '@telegram-apps/telegram-ui';
import styles from './NumberMind.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'playing' | 'won' | 'lost';

interface Attempt {
  guess: string;
  exactMatches: number;
  partialMatches: number;
}

export function NumberMind() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameState, setGameState] = useState<GameState>('setup');
  const [secretCode, setSecretCode] = useState<string>('');
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [remainingAttempts, setRemainingAttempts] = useState(10);
  const [score, setScore] = useState(0);

  const difficultySettings = {
    easy: { length: 4, attempts: 10 },
    medium: { length: 5, attempts: 12 },
    hard: { length: 6, attempts: 15 }
  };

  const generateCode = (length: number): string => {
    const digits = Array.from({ length }, () => 
      Math.floor(Math.random() * 10).toString()
    );
    return digits.join('');
  };

  const startGame = () => {
    const settings = difficultySettings[difficulty];
    setSecretCode(generateCode(settings.length));
    setRemainingAttempts(settings.attempts);
    setAttempts([]);
    setCurrentGuess('');
    setGameState('playing');
  };

  const evaluateGuess = (guess: string): Attempt => {
    let exactMatches = 0;
    let partialMatches = 0;
    const secretArray = secretCode.split('');
    const guessArray = guess.split('');

    // Check exact matches
    for (let i = 0; i < secretArray.length; i++) {
      if (guessArray[i] === secretArray[i]) {
        exactMatches++;
        secretArray[i] = 'X';
        guessArray[i] = 'Y';
      }
    }

    // Check partial matches
    for (let i = 0; i < guessArray.length; i++) {
      const index = secretArray.indexOf(guessArray[i]);
      if (index !== -1 && guessArray[i] !== 'Y') {
        partialMatches++;
        secretArray[index] = 'X';
      }
    }

    return { guess, exactMatches, partialMatches };
  };

  const handleGuess = () => {
    if (currentGuess.length !== difficultySettings[difficulty].length) {
      return;
    }

    const result = evaluateGuess(currentGuess);
    setAttempts(prev => [...prev, result]);
    setRemainingAttempts(prev => prev - 1);
    setCurrentGuess('');

    if (result.exactMatches === difficultySettings[difficulty].length) {
      const baseScore = difficultySettings[difficulty].length * 100;
      const attemptsBonus = remainingAttempts * 50;
      setScore(baseScore + attemptsBonus);
      setGameState('won');
    } else if (remainingAttempts <= 1) {
      setGameState('lost');
    }
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text variant="h1" className={styles.title}>Number Mind</Text>

        {gameState === 'setup' && (
          <div className={styles.setup}>
            <Text variant="body">Select Difficulty:</Text>
            <div className={styles.difficultyButtons}>
              {Object.keys(difficultySettings).map((diff) => (
                <Button
                  key={diff}
                  onClick={() => setDifficulty(diff as Difficulty)}
                  className={difficulty === diff ? styles.selected : ''}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={startGame}>Start Game</Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className={styles.gameArea}>
            <Text>Attempts Left: {remainingAttempts}</Text>
            
            <div className={styles.inputArea}>
              <Input
                type="number"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                maxLength={difficultySettings[difficulty].length}
                placeholder={`Enter ${difficultySettings[difficulty].length} digits`}
              />
              <Button onClick={handleGuess}>Guess</Button>
            </div>

            <div className={styles.attempts}>
              {attempts.map((attempt, index) => (
                <div key={index} className={styles.attempt}>
                  <Text>{attempt.guess}</Text>
                  <div className={styles.matches}>
                    <span className={styles.exact}>🎯 {attempt.exactMatches}</span>
                    <span className={styles.partial}>🔄 {attempt.partialMatches}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(gameState === 'won' || gameState === 'lost') && (
          <div className={styles.gameOver}>
            <Text variant="h2">
              {gameState === 'won' ? '🎉 You Won!' : '😢 Game Over'}
            </Text>
            <Text>The code was: {secretCode}</Text>
            {gameState === 'won' && <Text>Score: {score}</Text>}
            <Button onClick={() => setGameState('setup')}>Play Again</Button>
          </div>
        )}
      </div>
    </Page>
  );
}