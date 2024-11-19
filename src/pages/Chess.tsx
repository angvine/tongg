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

// Add these new evaluation constants
const KING_SAFETY = {
  PAWN_SHIELD: 50,     // Bonus for pawns protecting king
  KING_EXPOSED: -100,  // Penalty for exposed king
  SAFE_SQUARES: 30     // Bonus for each safe square around king
};

const PIECE_COORDINATION = {
  CONNECTED_ROOKS: 50,      // Bonus for rooks supporting each other
  BISHOP_PAIR: 50,         // Bonus for having both bishops
  KNIGHT_OUTPOST: 30,      // Bonus for knights in strong positions
  PAWN_CHAIN: 20          // Bonus for connected pawns
};

const CENTER_CONTROL = {
  CENTER_SQUARE: 30,      // d4,d5,e4,e5
  EXTENDED_CENTER: 15     // c3-f3-f6-c6
};

// Add strategic pattern recognition
const PAWN_STRUCTURE = {
  ISOLATED: -20,
  DOUBLED: -15,
  BACKWARD: -10,
  PASSED: 50,
  PROTECTED_PASSED: 70
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

  // Strategic evaluation
  score += evaluatePieceCoordination(chess, 'w') - evaluatePieceCoordination(chess, 'b');
  score += evaluateKingSafety(chess, 'w') - evaluateKingSafety(chess, 'b');
  score += evaluateCenterControl(chess, 'w') - evaluateCenterControl(chess, 'b');
  
  // Mobility
  score += evaluateMobility(chess, 'w') - evaluateMobility(chess, 'b');

  // Add tempo bonus
  score += chess.turn() === 'w' ? 10 : -10;

  // Add threat evaluation
  score += evaluateThreats(chess, 'w');
  score -= evaluateThreats(chess, 'b');

  // Add future position analysis
  const futureScore = evaluateFuturePosition(chess, chess.turn());
  score += futureScore;

  return score;
}

// Improved move ordering for better alpha-beta pruning
function orderMoves(chess: ChessLibrary, moves: Move[]): Move[] {
  const hash = zobristHash(chess);
  const tt = TranspositionTable.get(hash);
  const moveScores = new Map<Move, number>();

  moves.forEach(move => {
    let score = 0;
    
    // TT move gets highest priority
    if (tt && moveEquals(move, tt.move)) {
      score += 10000;
    }
    
    // Captures
    if (move.captured) {
      score += 1000 + getMVVLVA(move);
    }
    
    // Killer moves
    if (KillerMoves[chess.history().length]?.some(m => moveEquals(m, move))) {
      score += 900;
    }
    
    // History heuristic
    const historyKey = `${move.from}${move.to}`;
    score += HistoryTable.get(historyKey) || 0;

    // Check if move improves piece position
    chess.move(move);
    const positionImprovement = evaluatePositionalGain(chess, move);
    chess.undo();
    score += positionImprovement;
    
    // Prioritize center control in opening/middlegame
    if (!isEndgame(chess)) {
      if (isCenterSquare(move.to)) {
        score += 50;
      }
    }
    
    // Consider piece development in opening
    if (isOpeningPhase(chess) && isOptimalDevelopmentMove(move)) {
      score += 40;
    }
    
    // Check if move prevents immediate threats
    chess.move(move);
    const threatsBefore = evaluateThreats(chess, chess.turn());
    const threatsAfter = evaluateThreats(chess, chess.turn() === 'w' ? 'b' : 'w');
    chess.undo();

    // Bonus for moves that reduce threats
    if (threatsAfter > threatsBefore) {
      score += 200;
    }

    // Penalty for moves that create self-threats
    if (threatsBefore > threatsAfter) {
      score -= 150;
    }

    moveScores.set(move, score);
  });

  return moves.sort((a, b) => (moveScores.get(b) || 0) - (moveScores.get(a) || 0));
}

// Add these new constants near the top
const INFINITY = 30000;
const MATE_VALUE = 29000;
const MATE_THRESHOLD = 28000;

// Add transposition table interface
interface TTEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'alpha' | 'beta';
  move: Move;
}

// Add new constants and data structures
const TranspositionTable = new Map<string, TTEntry>();
const KillerMoves: Move[][] = Array(64).fill([]);
const HistoryTable = new Map<string, number>();

// Add this helper function
function zobristHash(chess: ChessLibrary): string {
  return chess.fen().split(' ').slice(0, 4).join(' ');
}

// Replace the existing findBestMove function
function findBestMove(chess: ChessLibrary, maxTime: number = 5000): Move | null {
  try {
    const startTime = Date.now();
    let bestMove: Move | null = null;
    let depth = 1;

    // First check opening book
    const bookMove = getOpeningBookMove(chess);
    if (bookMove) return bookMove;

    // Get legal moves first
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) return null;
    
    // If only one legal move, return it immediately
    if (legalMoves.length === 1) return legalMoves[0];

    while (Date.now() - startTime < maxTime && depth <= 4) {
      try {
        const searchResult = searchPosition(chess, depth, -INFINITY, INFINITY, true, startTime, maxTime);
        if (searchResult.move) {
          bestMove = searchResult.move;
        }
        
        if (Math.abs(searchResult.score) > MATE_THRESHOLD) {
          break;
        }
        
        depth++;
      } catch (e) {
        break;
      }
    }

    // If no best move found, return a random legal move
    return bestMove || legalMoves[Math.floor(Math.random() * legalMoves.length)];
  } catch (error) {
    console.error('Find best move error:', error);
    return null;
  }
}

// Add this new search function
function searchPosition(
  chess: ChessLibrary, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isRoot: boolean = false,
  startTime: number,
  maxTime: number
): { score: number; move: Move | null } {
  // Time check
  if (Date.now() - startTime > maxTime) {
    throw new Error('Time exceeded');
  }

  // Transposition table lookup
  const hash = zobristHash(chess);
  const tt = TranspositionTable.get(hash);
  if (tt && tt.depth >= depth && !isRoot) {
    if (tt.flag === 'exact') return { score: tt.score, move: tt.move };
    if (tt.flag === 'alpha' && tt.score <= alpha) return { score: alpha, move: tt.move };
    if (tt.flag === 'beta' && tt.score >= beta) return { score: beta, move: tt.move };
  }

  if (depth === 0) {
    return { 
      score: quiescenceSearch(chess, alpha, beta, 10),
      move: null 
    };
  }

  const moves = orderMoves(chess, chess.moves({ verbose: true }));
  let bestMove: Move | null = null;
  let bestScore = -INFINITY;
  let originalAlpha = alpha;

  for (const move of moves) {
    chess.move(move);
    const score = -searchPosition(
      chess, 
      depth - 1, 
      -beta, 
      -alpha,
      false,
      startTime,
      maxTime
    ).score;
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      
      if (score > alpha) {
        alpha = score;
        
        // Update killer moves and history table
        if (!move.captured) {
          KillerMoves[depth] = [move, ...(KillerMoves[depth] || []).slice(0, 1)];
          const key = `${move.from}${move.to}`;
          HistoryTable.set(key, (HistoryTable.get(key) || 0) + depth * depth);
        }
      }
    }

    if (alpha >= beta) {
      // Store beta cutoff
      TranspositionTable.set(hash, {
        depth,
        score: beta,
        flag: 'beta',
        move: move
      });
      return { score: beta, move };
    }
  }

  // Store transposition table entry
  TranspositionTable.set(hash, {
    depth,
    score: bestScore,
    flag: bestScore <= originalAlpha ? 'alpha' : 'exact',
    move: bestMove!
  });

  return { score: bestScore, move: bestMove };
}

// Add these helper functions
function moveEquals(a: Move, b: Move): boolean {
  return a && b && a.from === b.from && a.to === b.to && a.promotion === b.promotion;
}

function getMVVLVA(move: Move): number {
  const victimValue = PIECE_VALUES[move.captured || 'p'];
  const attackerValue = PIECE_VALUES[move.piece];
  return victimValue * 100 - attackerValue;
}

function isOpeningPhase(chess: ChessLibrary): boolean {
  return chess.history().length < 10;
}

function isCenterSquare(square: string): boolean {
  return ['d4', 'd5', 'e4', 'e5'].includes(square);
}

function isOptimalDevelopmentMove(move: Move): boolean {
  // Prioritize development of knights and bishops
  if (['n', 'b'].includes(move.piece) && move.from.includes('1')) {
    return true;
  }
  // Castle moves are good for development
  if (move.flags.includes('k') || move.flags.includes('q')) {
    return true;
  }
  return false;
}

// Add these new constants at the top
const THREAT_VALUES = {
  PIECE_THREATENED: -30,      // Piece is under attack
  PIECE_DEFENDED: 15,        // Piece is defended
  FORK_THREAT: -80,          // Potential fork
  PIN_THREAT: -60,           // Potential pin
  DISCOVERED_ATTACK: -50,    // Potential discovered attack
  MATE_THREAT: -1000        // Potential mate threat
};

// Add these new evaluation functions
function evaluateThreats(chess: ChessLibrary, forColor: 'w' | 'b'): number {
  let threatScore = 0;
  const board = chess.board();
  const opponent = forColor === 'w' ? 'b' : 'w';

  // Get all squares with pieces of the given color
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.color === forColor) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}`;
        
        // Check if piece is threatened
        if (isSquareAttacked(chess, square, opponent)) {
          threatScore += THREAT_VALUES.PIECE_THREATENED;
          
          // Higher penalty for undefended pieces
          if (!isSquareDefended(chess, square, forColor)) {
            threatScore += THREAT_VALUES.PIECE_THREATENED;
          }
        }
        
        // Check for potential forks
        if (isPotentialFork(chess, square, opponent)) {
          threatScore += THREAT_VALUES.FORK_THREAT;
        }
        
        // Check for pins and discovered attacks
        if (isPinned(chess, square, forColor)) {
          threatScore += THREAT_VALUES.PIN_THREAT;
        }
      }
    }
  }

  return threatScore;
}

// Add these helper functions
function isSquareAttacked(chess: ChessLibrary, square: string, byColor: 'w' | 'b'): boolean {
  try {
    const moves = chess.moves({ verbose: true, square });
    return moves.some(move => move.captured && move.color === byColor);
  } catch {
    return false;
  }
}

function isSquareDefended(chess: ChessLibrary, square: string, byColor: 'w' | 'b'): boolean {
  try {
    // Make a temporary move to capture the piece and see if it can be recaptured
    const piece = chess.get(square);
    if (!piece) return false;

    const defenders = chess.moves({ verbose: true }).filter(move => 
      move.to === square && move.color === byColor
    );

    return defenders.length > 0;
  } catch {
    return false;
  }
}

function isPotentialFork(chess: ChessLibrary, square: string, byColor: 'w' | 'b'): boolean {
  try {
    const moves = chess.moves({ verbose: true, square });
    for (const move of moves) {
      chess.move(move);
      const attackedPieces = getAttackedPieces(chess, byColor);
      chess.undo();
      
      // If a move can attack multiple pieces, it's a potential fork
      if (attackedPieces.length > 1) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function getAttackedPieces(chess: ChessLibrary, byColor: 'w' | 'b'): string[] {
  const attacked: string[] = [];
  const board = chess.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.color !== byColor) {
        const square = `${String.fromCharCode(97 + j)}${8 - i}`;
        if (isSquareAttacked(chess, square, byColor)) {
          attacked.push(square);
        }
      }
    }
  }
  
  return attacked;
}

// Add future position analysis
function evaluateFuturePosition(chess: ChessLibrary, color: 'w' | 'b', depth: number = 2): number {
  if (depth === 0) return 0;

  let bestScore = -INFINITY;
  const moves = chess.moves({ verbose: true });

  for (const move of moves) {
    chess.move(move);
    const score = -evaluateFuturePosition(chess, color === 'w' ? 'b' : 'w', depth - 1);
    chess.undo();

    bestScore = Math.max(bestScore, score);
  }

  return bestScore * 0.5; // Discount future positions
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
        console.log('Game is over, no move made');
        return;
      }
      
      const legalMoves = chess.current.moves({ verbose: true });
      if (legalMoves.length === 0) {
        console.log('No legal moves available');
        return;
      }
      
      const bestMove = findBestMove(chess.current, 3000);
      
      // Validate the move before attempting it
      if (bestMove && isValidMove(chess.current, bestMove)) {
        chess.current.move(bestMove);
        updateBoard();
        console.log('AI moved:', bestMove);
      } else {
        // Fallback to a random legal move if bestMove is invalid
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        chess.current.move(randomMove);
        updateBoard();
        console.log('AI made fallback move:', randomMove);
      }
    } catch (error) {
      console.error('AI move error:', error);
      // Attempt recovery with a random legal move
      try {
        const legalMoves = chess.current.moves({ verbose: true });
        if (legalMoves.length > 0) {
          const recoveryMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          chess.current.move(recoveryMove);
          updateBoard();
          console.log('AI recovery move:', recoveryMove);
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        setStatus('AI move error occurred');
      }
    }
  };

  // Add this helper function to validate moves
  function isValidMove(chess: ChessLibrary, move: Move): boolean {
    try {
      // Get all legal moves in the current position
      const legalMoves = chess.moves({ verbose: true });
      
      // Check if the proposed move exists in legal moves
      return legalMoves.some(legalMove => 
        legalMove.from === move.from && 
        legalMove.to === move.to && 
        legalMove.promotion === move.promotion
      );
    } catch (error) {
      console.error('Move validation error:', error);
      return false;
    }
  }

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
    TranspositionTable.clear();
    KillerMoves.fill([]);
    HistoryTable.clear();
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