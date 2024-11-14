import { useState, useEffect, useCallback } from 'react';
import { Page } from '@/components/Page';
import { Button, Text, Card } from '@telegram-apps/telegram-ui';
import styles from './DotsAndBoxes.module.css';

type Line = {
  id: string;
  row: number;
  col: number;
  isHorizontal: boolean;
  owner: string | null;
};

type Box = {
  owner: string | null;
  completed: boolean;
};

type GameState = 'playing' | 'gameOver';
type Player = 'player' | 'ai';
type Winner = Player | 'draw' | null;

const CHARACTERS = {
  player: '🐱',
  ai: '🐰',
  dot: '⭐',
} as const;

const BOARD_SIZE = 3; // Fixed board size

export function DotsAndBoxes() {
  // Game state
  const [lines, setLines] = useState<Line[]>([]);
  const [boxes, setBoxes] = useState<Box[][]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Player state
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [lastMove, setLastMove] = useState<Line | null>(null);
  
  // UI state
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [waitingForNextTurn, setWaitingForNextTurn] = useState(false);

  const initializeBoard = useCallback(() => {
    try {
      const newLines: Line[] = [];
      let lineId = 0;

      // Initialize horizontal lines
      for (let i = 0; i <= BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          newLines.push({
            id: `h-${lineId++}`,
            row: i,
            col: j,
            isHorizontal: true,
            owner: null
          });
        }
      }

      // Initialize vertical lines
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j <= BOARD_SIZE; j++) {
          newLines.push({
            id: `v-${lineId++}`,
            row: i,
            col: j,
            isHorizontal: false,
            owner: null
          });
        }
      }

      const newBoxes = Array(BOARD_SIZE).fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)
        .map(() => ({ owner: null, completed: false })));

      setLines(newLines);
      setBoxes(newBoxes);
      setPlayerScore(0);
      setAiScore(0);
      setIsPlayerTurn(true);
      setIsGameOver(false);
      setWinner(null);
      setIsAiThinking(false);
      setWaitingForNextTurn(false);
      setGameState('playing');
      setLastMove(null); // Reset last move
    } catch (error) {
      console.error('Error initializing board:', error);
    }
  }, []);

  const checkBoxCompletion = useCallback((x: number, y: number, currentLines: Line[]): boolean => {
    try {
      const getLine = (row: number, col: number, isHorizontal: boolean) =>
        currentLines.find(line => 
          line.row === row && 
          line.col === col && 
          line.isHorizontal === isHorizontal
        );

      const topLine = getLine(x, y, true);
      const rightLine = getLine(x, y + 1, false);
      const bottomLine = getLine(x + 1, y, true);
      const leftLine = getLine(x, y, false);

      return Boolean(
        topLine?.owner && 
        rightLine?.owner && 
        bottomLine?.owner && 
        leftLine?.owner
      );
    } catch (error) {
      console.error('Error checking box completion:', error);
      return false;
    }
  }, []);

  const makeMove = useCallback((line: Line, player: Player) => {
    if (
      line.owner || 
      gameState === 'gameOver' || 
      waitingForNextTurn || 
      isGameOver
    ) return;

    try {
      setWaitingForNextTurn(true);
      setLastMove(line); // Set the last move

      setLines(prevLines => {
        const newLines = prevLines.map(l => 
          l.id === line.id ? { ...l, owner: player } : l
        );

        let boxesCompleted = 0;
        setBoxes(prevBoxes => {
          const newBoxes = [...prevBoxes].map(row => [...row]);
          
          for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
              if (checkBoxCompletion(i, j, newLines) && !newBoxes[i][j].completed) {
                newBoxes[i][j] = { owner: player, completed: true };
                boxesCompleted++;
              }
            }
          }
          return newBoxes;
        });

        // Update scores
        if (player === 'player') {
          setPlayerScore(prev => prev + boxesCompleted);
        } else {
          setAiScore(prev => prev + boxesCompleted);
        }

        // Check for game over
        const totalBoxes = BOARD_SIZE * BOARD_SIZE;
        const completedBoxes = playerScore + aiScore + boxesCompleted;
        
        if (completedBoxes === totalBoxes) {
          setIsGameOver(true);
          setGameState('gameOver');
          if (playerScore > aiScore) setWinner('player');
          else if (aiScore > playerScore) setWinner('ai');
          else setWinner('draw');
        } else if (boxesCompleted === 0) {
          setIsPlayerTurn(!isPlayerTurn);
        }

        setWaitingForNextTurn(false);
        return newLines;
      });
    } catch (error) {
      console.error('Error making move:', error);
      setWaitingForNextTurn(false);
    }
  }, [checkBoxCompletion, gameState, isGameOver, isPlayerTurn, playerScore, aiScore, waitingForNextTurn]);

  // AI move handler
  useEffect(() => {
    if (!isPlayerTurn && !isGameOver && !waitingForNextTurn) {
      const timer = setTimeout(() => {
        const availableLines = lines.filter(line => !line.owner);
        if (availableLines.length > 0) {
          setWaitingForNextTurn(true);
          const randomLine = availableLines[Math.floor(Math.random() * availableLines.length)];
          makeMove(randomLine, 'ai');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, isGameOver, waitingForNextTurn, lines, makeMove]);

  // Initialize board on mount
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const handleNextTurn = useCallback(() => {
    setWaitingForNextTurn(false);
  }, []);

  const initializeGame = useCallback(() => {
    initializeBoard();
  }, [initializeBoard]);

  return (
    <Page>
      <div className={styles.gameContainer}>
        <Card className={styles.scoreCard}>
          <div className={styles.scoreWrapper}>
            <div className={styles.playerScore}>
              <Text variant="h3">{CHARACTERS.player} You</Text>
              <Text variant="h2">{playerScore}</Text>
            </div>
            <div className={styles.divider} />
            <div className={styles.aiScore}>
              <Text variant="h3">{CHARACTERS.ai} AI</Text>
              <Text variant="h2">{aiScore}</Text>
            </div>
          </div>
        </Card>

        <Text className={styles.turnIndicator}>
          {isPlayerTurn 
            ? `${CHARACTERS.player} Your turn` 
            : `${CHARACTERS.ai} AI's turn`}
        </Text>

        {isAiThinking && (
          <Text className={styles.thinkingText}>
            {CHARACTERS.ai} AI is thinking...
          </Text>
        )}

        <div className={styles.board}>
          <div 
            className={styles.grid}
            style={{
              '--board-size': BOARD_SIZE
            } as React.CSSProperties}
          >
            {/* Dots */}
            {Array.from({ length: (BOARD_SIZE + 1) ** 2 }).map((_, index) => {
              const row = Math.floor(index / (BOARD_SIZE + 1));
              const col = index % (BOARD_SIZE + 1);
              return (
                <div
                  key={`dot-${row}-${col}`}
                  className={styles.dot}
                  style={{
                    gridRow: row * 2 + 1,
                    gridColumn: col * 2 + 1,
                  }}
                />
              );
            })}

            {/* Lines */}
            {lines.map((line) => (
              <div
                key={line.id}
                className={`${styles.line} ${line.isHorizontal ? styles.horizontal : styles.vertical} ${line.owner ? styles[line.owner] : ''} ${lastMove?.id === line.id ? styles.lastMove : ''}`}
                style={{
                  gridRow: line.isHorizontal ? line.row * 2 + 1 : line.row * 2 + 1,
                  gridColumn: line.isHorizontal ? line.col * 2 + 1 : line.col * 2 + 1,
                  gridRowEnd: line.isHorizontal ? 'span 1' : 'span 3',
                  gridColumnEnd: line.isHorizontal ? 'span 3' : 'span 1',
                }}
                onClick={() => !line.owner && isPlayerTurn && makeMove(line, 'player')}
              />
            ))}

            {/* Boxes */}
            {boxes.map((row, rowIndex) => 
              row.map((box, colIndex) => box.completed && (
                <div
                  key={`box-${rowIndex}-${colIndex}`}
                  className={`${styles.box} ${styles[box.owner || '']}`}
                  style={{
                    gridRow: rowIndex * 2 + 2,
                    gridColumn: colIndex * 2 + 2,
                    gridRowEnd: rowIndex * 2 + 4,
                    gridColumnEnd: colIndex * 2 + 4,
                  }}
                >
                  {box.owner === 'player' ? CHARACTERS.player : CHARACTERS.ai}
                </div>
              ))
            )}
          </div>
        </div>

        {waitingForNextTurn && !isGameOver && (
          <Button
            onClick={handleNextTurn}
            className={styles.nextTurnButton}
          >
            Next Turn
          </Button>
        )}

        <div className={styles.controls}>
          <Button
            accent
            onClick={initializeGame}
          >
            New Game
          </Button>
        </div>

        {isGameOver && (
          <Text className={styles.gameOverText}>
            {winner === 'draw' ? 'It\'s a draw!' : `${CHARACTERS[winner]} ${winner === 'player' ? 'You win!' : 'AI wins!'}`}
          </Text>
        )}
      </div>
    </Page>
  );
}