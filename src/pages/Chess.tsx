// src/pages/Chess.tsx
import { useState, useEffect, useRef } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { Chess as ChessLibrary, Move } from 'chess.js';
import styles from './Chess.module.css';

// Constants
const PIECE_VALUES = {
  p: 100,    // pawn
  n: 320,    // knight
  b: 330,    // bishop
  r: 500,    // rook
  q: 900,    // queen
  k: 20000   // king
};

const ENDGAME_PIECE_VALUES = {
  p: 1.2,  // Pawns become more valuable
  n: 2.8,  // Knights slightly less valuable
  b: 3.2,  // Bishops slightly more valuable
  r: 5,
  q: 9,
  k: 100
};

const PIECE_SQUARE_TABLES = {
  p: [  // Pawn
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [  // Knight
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]
  // Add more piece square tables as needed
};

const OPENING_BOOK = {
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': ['e2e4', 'd2d4', 'c2c4'], // Initial position
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3': ['e7e5', 'c7c5', 'e7e6'], // After 1.e4
  // Add more opening positions as needed
};

// Board position evaluation bonuses
const POSITION_BONUSES = {
  p: [  // Pawn position bonuses
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0,  1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
  ]
  // Add position bonuses for other pieces...
};

const isEndgame = (chess: ChessLibrary): boolean => {
  const pieces = chess.board().flat().filter(p => p);
  return pieces.length <= 12;
};

const evaluatePieceMobility = (chess: ChessLibrary, square: string, piece: any): number => {
  const moves = chess.moves({ square, verbose: true });
  const baseScore = moves.length * 0.1;
  
  // Bonus for controlling center squares
  const centerMoves = moves.filter(move => 
    ['d4','d5','e4','e5'].includes(move.to)
  );
  
  return baseScore + (centerMoves.length * 0.2);
};

const quiescenceSearch = (chess: ChessLibrary, alpha: number, beta: number, depth: number): number => {
  const standPat = evaluateBoard(chess);
  if (depth === 0) return standPat;
  
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  const captures = chess.moves({ verbose: true }).filter(move => move.captured);
  
  for (const move of captures) {
    chess.move(move);
    const score = -quiescenceSearch(chess, -beta, -alpha, depth - 1);
    chess.undo();
    
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  
  return alpha;
};

// Improved evaluation function
function evaluateBoard(chess: ChessLibrary): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -20000 : 20000;
  }
  
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();
  const isEndgamePhase = isEndgame(chess);
  
  // Material and position evaluation
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        // Base material value
        const pieceValue = isEndgamePhase ? 
          ENDGAME_PIECE_VALUES[piece.type] : 
          PIECE_VALUES[piece.type];
        
        // Position value
        const positionValue = PIECE_SQUARE_TABLES[piece.type] ?
          PIECE_SQUARE_TABLES[piece.type][piece.color === 'w' ? i : 7 - i][j] * 0.1 :
          0;
        
        const value = pieceValue + positionValue;
        score += piece.color === 'w' ? value : -value;
        
        // Add mobility evaluation
        score += piece.color === 'w' ? 
          evaluatePieceMobility(chess, `${String.fromCharCode(97 + j)}${8 - i}`, piece) :
          -evaluatePieceMobility(chess, `${String.fromCharCode(97 + j)}${8 - i}`, piece);
      }
    }
  }

  return score;
}

// Improved move ordering for better alpha-beta pruning
function orderMoves(chess: ChessLibrary, moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Capturing moves
    if (a.captured) {
      scoreA += PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
    }
    if (b.captured) {
      scoreB += PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
    }
    
    // Promotion moves
    if (a.promotion) scoreA += PIECE_VALUES[a.promotion];
    if (b.promotion) scoreB += PIECE_VALUES[b.promotion];
    
    // Check moves
    if (a.san.includes('+')) scoreA += 50;
    if (b.san.includes('+')) scoreB += 50;
    
    return scoreB - scoreA;
  });
}

// Update findBestMove to use move ordering
function findBestMove(chess: ChessLibrary, depth: number = 4): Move {
  const moves = chess.moves({ verbose: true });
  const orderedMoves = orderMoves(chess, moves);
  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;
  
  // Opening book check
  const bookMove = getOpeningBookMove(chess);
  if (bookMove) return bookMove;

  for (const move of orderedMoves) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -alpha, -1);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}

function negamax(chess: ChessLibrary, depth: number, alpha: number, beta: number, color: number): number {
  if (depth === 0) {
    return color * quiescenceSearch(chess, alpha, beta, 3);
  }

  const moves = chess.moves();
  if (moves.length === 0) {
    if (chess.isCheckmate()) return -Infinity * color;
    return 0;
  }

  for (const move of moves) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -alpha, -color);
    chess.undo();
    
    if (score >= beta) return beta;
    alpha = Math.max(alpha, score);
  }
  
  return alpha;
}

export function Chess() {
  // Initialize chess.js within useRef to persist across renders
  const chess = useRef(new ChessLibrary());

  // State variables
  const [board, setBoard] = useState(chess.current.board());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("Your turn! 🎮");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null); // Added winner state

  // Helper function to get Unicode symbols for pieces
  const getPieceSymbol = (piece: { type: string; color: string } | null): JSX.Element | null => {
    if (!piece) return null;
    const symbols: Record<string, Record<string, string>> = {
      w: {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
      },
      b: {
        p: '♟',
        r: '♜',
        n: '♞',
        b: '♝',
        q: '♛',
        k: '♚',
      },
    };
    return (
      <span className={piece.color === 'w' ? styles.whitepiece : styles.blackpiece}>
        {symbols[piece.color][piece.type]}
      </span>
    );
  };

  // Update the board state and check game status
  const updateBoard = () => {
    const currentBoard = chess.current.board();
    setBoard([...currentBoard]);

    console.log('Board updated:', currentBoard);

    // Check if the game is over
    if (chess.current.isGameOver()) {
      setGameOver(true);
      if (chess.current.isCheckmate()) {
        const winnerColor = chess.current.turn() === 'w' ? 'Black' : 'White';
        setWinner(winnerColor);
        setStatus(`${winnerColor} wins by checkmate! 🎉`);
        console.log(`Game Over: ${winnerColor} wins by checkmate`);
      } else if (chess.current.isDraw()) {
        setStatus("It's a Draw! ⚖️");
        console.log('Game Over: Draw');
      } else {
        setStatus("Game Over! 🛑");
        console.log('Game Over');
      }
    } else {
      // Toggle turn using functional update to prevent stale state
      setIsPlayerTurn((prev) => {
        const newTurn = !prev;
        setStatus(newTurn ? "Your turn! 🎮" : "AI thinking... 🤖");
        console.log('Turn toggled. Player turn:', newTurn);
        return newTurn;
      });
    }
  };

  // Handle player's move
  const handleMove = (from: string, to: string) => {
    console.log(`Player attempts to move from ${from} to ${to}`);
    const move: Move | null = chess.current.move({ from, to, promotion: 'q' }); // Promote to queen by default
    if (move) {
      console.log(`Player moved: ${move.san}`);
      updateBoard();
    } else {
      console.log("Invalid move attempted.");
    }
  };

  // Handle square clicks for selecting and moving
  const handleSquareClick = (square: string) => {
    if (gameOver) return;

    const piece = chess.current.get(square);
    console.log(`Square clicked: ${square}`, piece);

    if (selectedSquare === square) {
      // Deselect the square if the same square is clicked again
      setSelectedSquare(null);
      console.log(`Deselected piece at: ${square}`);
    } else if (selectedSquare) {
      // Attempt to move the selected piece to the clicked square
      handleMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      // Select square if it has player's piece (white)
      if (piece && piece.color === 'w') { // Assuming player is White
        setSelectedSquare(square);
        console.log(`Piece selected at: ${square}`);
      }
    }
  };

  // Simplified AI move function
  const aiMove = () => {
    try {
      if (chess.current.isGameOver()) {
        console.log('Game is over');
        return;
      }
  
      const moves = chess.current.moves();
      if (moves.length === 0) {
        console.log('No legal moves');
        return;
      }
  
      let bestMove = null;
      let bestScore = -Infinity;
  
      // Simple one-ply search
      for (const move of moves) {
        chess.current.move(move);
        const score = -evaluateBoard(chess.current);
        chess.current.undo();
  
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
  
      if (bestMove) {
        chess.current.move(bestMove);
        updateBoard();
        console.log('AI moved:', bestMove);
      }
  
    } catch (error) {
      console.error('AI move error:', error);
      setStatus('AI move error occurred');
    }
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isPlayerTurn && !gameOver) {
      console.log("AI turn detected, preparing move...");
      setStatus("AI is thinking... 🤖");
      
      timeoutId = setTimeout(() => {
        console.log("Executing AI move after delay");
        aiMove();
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPlayerTurn, gameOver]);

  // Reset the game to initial state
  const resetGame = () => {
    chess.current.reset();
    setBoard(chess.current.board());
    setIsPlayerTurn(true);
    setGameOver(false);
    setStatus("Your turn! 🎮");
    setSelectedSquare(null);
    setWinner(null);
    console.log("Game has been reset.");
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text className={styles.title}>Chess</Text>
        <div className={styles.board}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const square = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
              const isSelected = selectedSquare === square;
              const pieceSymbol = getPieceSymbol(cell);
              return (
                <Button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`${styles.cell} ${isSelected ? styles.selected : ''}`}
                  disabled={ (!isPlayerTurn && cell?.color === 'b') || gameOver }
                >
                  {pieceSymbol}
                </Button>
              );
            })
          )}
        </div>
        <Text className={styles.status}>{status}</Text>
        {gameOver && (
          <Button className={styles.playAgainBtn} onClick={resetGame}>
            Play Again 🎯
          </Button>
        )}
      </div> 
    </Page>
  );
}