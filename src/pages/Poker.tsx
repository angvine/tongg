// src/pages/Poker.tsx

import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { PokerLogic, Card, GameStage } from './PokerLogic';
import styles from './Poker.module.css';

interface BettingState {
  canCheck: boolean;
  minRaise: number;
  maxRaise: number;
}

export function Poker() {
  // Add new state for tracking raises
  const [riverRaises, setRiverRaises] = useState<number>(0);
  
  const [poker] = useState(() => new PokerLogic());
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAIHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [playerChips, setPlayerChips] = useState(1000);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [gameStage, setGameStage] = useState<GameStage>('preflop');
  const [result, setResult] = useState<string>('');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [aiChips, setAIChips] = useState(1000);
  const [playerBet, setPlayerBet] = useState(0);
  const [aiBet, setAIBet] = useState(0);
  const [bettingState, setBettingState] = useState<BettingState>({
    canCheck: true,
    minRaise: 0,
    maxRaise: 0
  });
  const [aiSpeech, setAiSpeech] = useState<string>('');
  const [aiThinkingTimeout, setAiThinkingTimeout] = useState<NodeJS.Timeout | null>(null);

  const startNewGame = () => {
    const newDeck = poker.createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [
      { ...newDeck.pop()!, hidden: true },
      { ...newDeck.pop()!, hidden: true }
    ];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAIHand(dHand);
    setCommunityCards([]);
    setPot(30); // Small blind 10 + Big blind 20
    setPlayerChips(prev => prev - 20);
    setCurrentBet(20);
    setGameStage('preflop');
    setResult('');
    setIsPlayerTurn(true);
    setAIChips(1000);
    setPlayerChips(1000);
    setPot(0);
    setPlayerBet(0);
    setAIBet(0);
    setRiverRaises(0);  // Reset raises counter
    
    // Small and big blinds
    const smallBlind = 10;
    const bigBlind = 20;
    
    setPlayerChips(prev => prev - bigBlind);
    setAIChips(prev => prev - smallBlind);
    setPlayerBet(bigBlind);
    setAIBet(smallBlind);
    setPot(smallBlind + bigBlind);
    setCurrentBet(bigBlind);
  };

  const handleAITurn = async () => {
    setIsPlayerTurn(false);
    
    // Clear any existing timeout
    if (aiThinkingTimeout) {
      clearTimeout(aiThinkingTimeout);
    }
    
    // Set a timeout to force action if AI gets stuck
    const timeout = setTimeout(() => {
      console.log('AI timeout triggered - forcing action');
      handleAIAction('fold');
    }, 5000);
    
    setAiThinkingTimeout(timeout);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear timeout as AI is responding normally
      clearTimeout(timeout);
      setAiThinkingTimeout(null);

      const aiCards = aiHand.map(card => ({...card, hidden: false}));
      const callAmount = Math.max(0, currentBet - aiBet);
      
      // Validate betting amounts
      if (callAmount > aiChips) {
        handleAIAction('fold');
        return;
      }

      const lastRaiseSize = currentBet - Math.min(playerBet, aiBet);
      const minRaise = Math.max(currentBet + lastRaiseSize, 20);
      const maxRaise = aiChips + aiBet;

      // Calculate hand equity
      const handEquity = poker.calculateHandEquity(aiCards, communityCards);
      
      // Calculate pot odds
      const potOdds = poker.calculatePotOdds(callAmount, pot);
      
      // Position evaluation
      const position = gameStage === 'preflop' ? 'early' : 'late';
      const positionMultiplier = poker.evaluatePosition(position, gameStage);
      
      // Stack size considerations
      const effectiveStack = Math.min(aiChips, playerChips);
      const stackToPotRatio = effectiveStack / pot;
      
      // Final decision making
      const decisionThreshold = handEquity * positionMultiplier;

      if (gameStage === 'river') {
        if (riverRaises >= 2) {
          // If already raised twice on river, be more cautious
          if (handEquity > 0.8 || (handEquity > 0.6 && potOdds < 0.2)) {
            handleAIAction('call');
          } else {
            handleAIAction('fold');
          }
          return;
        }
      }

      // Aggressive play with strong hands
      if (decisionThreshold > 0.8) {
        const raiseAmount = Math.min(
          pot * (handEquity * 2), // Size raise based on hand strength
          maxRaise
        );
        if (raiseAmount >= minRaise) {
          handleAIAction('raise', raiseAmount);
          return;
        }
      }

      // Semi-bluff with drawing hands
      if (decisionThreshold > 0.4 && stackToPotRatio > 3) {
        if (Math.random() < handEquity) { // Bluff frequency based on hand strength
          const bluffAmount = Math.min(pot * 0.6, maxRaise);
          handleAIAction('raise', bluffAmount);
          return;
        }
      }

      // Call with medium strength hands if odds are good
      if (decisionThreshold > potOdds) {
        handleAIAction('call');
        return;
      }

      // Default to folding
      handleAIAction('fold');
    } catch (error) {
      console.error('AI turn error:', error);
      // Clear timeout and force fold on error
      clearTimeout(timeout);
      setAiThinkingTimeout(null);
      handleAIAction('fold');
    }
  };

  const handleAIAction = (action: 'check' | 'call' | 'raise' | 'fold', raiseAmount?: number) => {
    try {
      // Clear AI thinking timeout if it exists
      if (aiThinkingTimeout) {
        clearTimeout(aiThinkingTimeout);
        setAiThinkingTimeout(null);
      }

      // Validate action is possible
      if (!validateAIAction(action, raiseAmount)) {
        console.log('Invalid AI action, forcing fold');
        action = 'fold';
      }

      // Set AI speech based on action
      switch (action) {
        case 'check':
          setAiSpeech("I'll check.");
          break;
        case 'call':
          setAiSpeech(`I'll call $${currentBet - aiBet}.`);
          break;
        case 'raise':
          setAiSpeech(`I raise to $${raiseAmount}!`);
          break;
        case 'fold':
          setAiSpeech("I fold...");
          break;
      }

      // Clear speech after 2 seconds
      setTimeout(() => setAiSpeech(''), 2000);

      switch (action) {
        case 'check':
          if (currentBet === aiBet) {
            advanceGameStage();
          }
          break;

        case 'call':
          const callAmount = currentBet - aiBet;
          if (callAmount > aiChips) {
            // All-in
            const allInAmount = aiChips;
            setAIChips(0);
            setAIBet(aiBet + allInAmount);
            setPot(prev => prev + allInAmount);
          } else {
            setAIChips(prev => prev - callAmount);
            setAIBet(currentBet);
            setPot(prev => prev + callAmount);
          }
          
          if (currentBet === playerBet) {
            advanceGameStage();
          } else {
            setIsPlayerTurn(true);
          }
          break;
        
        case 'raise':
          if (raiseAmount && raiseAmount >= currentBet * 2) {
            const actualRaise = Math.min(raiseAmount, aiChips + aiBet);
            const raiseIncrement = actualRaise - aiBet;
            
            if (gameStage === 'river') {
              setRiverRaises(prev => prev + 1);
            }
            
            if (raiseIncrement >= aiChips) {
              // All-in
              setAIChips(0);
              setAIBet(aiBet + aiChips);
              setPot(prev => prev + aiChips);
              setCurrentBet(aiBet + aiChips);
            } else {
              setAIChips(prev => prev - raiseIncrement);
              setAIBet(actualRaise);
              setPot(prev => prev + raiseIncrement);
              setCurrentBet(actualRaise);
            }
            setIsPlayerTurn(true);
          }
          break;
        
        case 'fold':
          setPlayerChips(prev => prev + pot);
          setResult('AI folded. You win!');
          setGameStage('end');
          break;
      }
    } catch (error) {
      console.error('AI action error:', error);
      // Handle any errors by folding
      setAiSpeech("I fold due to error");
      handleFold();
    }
  };

  const validateAIAction = (action: string, raiseAmount?: number): boolean => {
    switch (action) {
      case 'check':
        return currentBet === aiBet;
      case 'call':
        return (currentBet - aiBet) <= aiChips;
      case 'raise':
        return raiseAmount !== undefined && 
               raiseAmount <= (aiChips + aiBet) && 
               raiseAmount >= Math.max(currentBet * 2, 20);
      case 'fold':
        return true;
      default:
        return false;
    }
  };

  const dealFlop = () => {
    const newDeck = [...deck];
    const flop = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
    setCommunityCards(flop);
    setDeck(newDeck);
    setGameStage('flop');
    setCurrentBet(0);
    setIsPlayerTurn(true);
  };

  const dealTurn = () => {
    const newDeck = [...deck];
    setCommunityCards(prev => [...prev, newDeck.pop()!]);
    setDeck(newDeck);
    setGameStage('turn');
    setCurrentBet(0);
    setIsPlayerTurn(true);
  };

  const dealRiver = () => {
    const newDeck = [...deck];
    setCommunityCards(prev => [...prev, newDeck.pop()!]);
    setDeck(newDeck);
    setGameStage('river');
    setCurrentBet(0);
    setIsPlayerTurn(true);
  };

  const handleFold = () => {
    const winner = isPlayerTurn ? 'ai' : 'player';
    const loser = isPlayerTurn ? 'player' : 'ai';
    
    if (winner === 'ai') {
      setAIChips(prev => prev + pot);
    } else {
      setPlayerChips(prev => prev + pot);
    }
    
    setResult(`${loser === 'player' ? 'You' : 'AI'} folded. ${winner === 'player' ? 'You' : 'AI'} wins!`);
    setGameStage('end');
  };

  const handleCall = () => {
    if (!isPlayerTurn) return;
    
    const callAmount = currentBet - playerBet;
    
    if (callAmount > playerChips) {
      // All-in situation
      const allInAmount = playerChips;
      setPlayerChips(0);
      setPlayerBet(playerBet + allInAmount);
      setPot(prev => prev + allInAmount);
      handleAITurn();
      return;
    }
    
    setPlayerChips(prev => prev - callAmount);
    setPlayerBet(currentBet);
    setPot(prev => prev + callAmount);
    
    if (currentBet === aiBet) {
      advanceGameStage();
    } else {
      handleAITurn();
    }
  };

  const handleCheck = () => {
    if (!isPlayerTurn || !bettingState.canCheck) return;
    
    if (currentBet === aiBet) {
      advanceGameStage();
    } else {
      handleAITurn();
    }
  };

  const handleRaise = (raiseAmount: number) => {
    if (!isPlayerTurn) return;
    
    // Validate raise amount
    if (raiseAmount < bettingState.minRaise || raiseAmount > bettingState.maxRaise) {
      return;
    }
    
    const totalBet = raiseAmount;
    const additionalAmount = totalBet - playerBet;
    
    if (additionalAmount > playerChips) {
      // All-in situation
      const allInAmount = playerChips;
      setPlayerChips(0);
      setPlayerBet(playerBet + allInAmount);
      setPot(prev => prev + allInAmount);
      setCurrentBet(playerBet + allInAmount);
      handleAITurn();
      return;
    }
    
    setPlayerChips(prev => prev - additionalAmount);
    setPlayerBet(totalBet);
    setPot(prev => prev + additionalAmount);
    setCurrentBet(totalBet);
    handleAITurn();
  };

  const advanceGameStage = () => {
    // Validate that bets are equal before advancing
    if (playerBet !== aiBet || currentBet !== playerBet) {
      console.error('Betting mismatch detected');
      return;
    }

    // Reset bets for new betting round
    setPlayerBet(0);
    setAIBet(0);
    setCurrentBet(0);
    
    try {
      switch (gameStage) {
        case 'preflop':
          if (communityCards.length !== 0) throw new Error('Invalid community cards for preflop');
          dealFlop();
          break;
        case 'flop':
          if (communityCards.length !== 3) throw new Error('Invalid community cards for flop');
          dealTurn();
          break;
        case 'turn':
          if (communityCards.length !== 4) throw new Error('Invalid community cards for turn');
          dealRiver();
          break;
        case 'river':
          if (communityCards.length !== 5) throw new Error('Invalid community cards for river');
          handleShowdown();
          break;
        default:
          throw new Error('Invalid game stage');
      }
    } catch (error) {
      console.error('Game stage error:', error);
      // Reset the game on critical errors
      startNewGame();
    }
  };

  const handleShowdown = () => {
    setAIHand(prev => prev.map(card => ({ ...card, hidden: false })));

    const playerBestHand = poker.evaluateHand([...playerHand, ...communityCards]);
    const aiBestHand = poker.evaluateHand([...aiHand, ...communityCards]);

    if (playerBestHand.rank > aiBestHand.rank) {
      setPlayerChips(prev => prev + pot);
      setResult(`You win with ${playerBestHand.name}!`);
    } else if (playerBestHand.rank < aiBestHand.rank) {
      setAIChips(prev => prev + pot);
      setResult(`AI wins with ${aiBestHand.name}!`);
    } else {
      // Compare kickers when ranks are equal
      const kickerComparison = poker.compareKickers(playerBestHand.kickers, aiBestHand.kickers);
      if (kickerComparison > 0) {
        setPlayerChips(prev => prev + pot);
        setResult(`You win with ${playerBestHand.name} (better kickers)!`);
      } else if (kickerComparison < 0) {
        setAIChips(prev => prev + pot);
        setResult(`AI wins with ${aiBestHand.name} (better kickers)!`);
      } else {
        setPlayerChips(prev => prev + Math.floor(pot / 2));
        setAIChips(prev => prev + Math.floor(pot / 2));
        setResult(`Split pot with ${playerBestHand.name}!`);
      }
    }
    setGameStage('end');
  };

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    updateBettingState();
  }, [currentBet, playerBet, aiBet, playerChips, aiChips]);

  useEffect(() => {
    return () => {
      if (aiThinkingTimeout) {
        clearTimeout(aiThinkingTimeout);
      }
    };
  }, [aiThinkingTimeout]);

  const updateBettingState = () => {
    // Can check only if no one has bet in this round
    const canCheck = currentBet === playerBet;
    
    // Minimum raise must be at least the size of the previous raise
    const lastRaiseSize = currentBet - Math.min(playerBet, aiBet);
    const minRaise = Math.max(currentBet + lastRaiseSize, 20); // minimum 20 chips
    
    // Maximum raise is all remaining chips (all-in)
    const maxRaise = playerChips + playerBet;

    setBettingState({ canCheck, minRaise, maxRaise });
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text variant="h1" className={styles.title}>
          Poker Table
        </Text>
        
        <div className={styles.pokerTable}>
          <div className={styles.chips}>
            <span className={styles.chipIcon}>💰</span>
            <Text>${playerChips}</Text>
          </div>

          <div className={styles.dealerArea}>
            <Text variant="body">AI's Cards</Text>
            {aiSpeech && <div className={styles.aiSpeechBubble}>{aiSpeech}</div>}
            <div className={styles.hand}>
              {aiHand.map((card, index) => (
                <div 
                  key={index} 
                  className={`${styles.card} ${card.hidden ? styles.cardHidden : ''}`}
                  data-trump={!card.hidden && (card.value === 'A' || card.value === 'K')}
                >
                  {card.hidden ? (
                    <div className={styles.cardBack} />
                  ) : (
                    <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : styles.black}>
                      {card.value}{card.suit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.communityArea}>
            {pot > 0 && (
              <div className={styles.potDisplay}>
                Pot: ${pot}
              </div>
            )}
            <div className={styles.hand}>
              {communityCards.map((card, index) => (
                <div 
                  key={index} 
                  className={`${styles.card} ${card.hidden ? styles.cardHidden : ''}`}
                  data-trump={!card.hidden && (card.value === 'A' || card.value === 'K')}
                >
                  {card.hidden ? (
                    <div className={styles.cardBack} />
                  ) : (
                    <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : styles.black}>
                      {card.value}{card.suit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.playerArea}>
            <div className={styles.hand}>
              {playerHand.map((card, index) => (
                <div 
                  key={index} 
                  className={`${styles.card} ${card.hidden ? styles.cardHidden : ''}`}
                  data-trump={!card.hidden && (card.value === 'A' || card.value === 'K')}
                >
                  {card.hidden ? (
                    <div className={styles.cardBack} />
                  ) : (
                    <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : styles.black}>
                      {card.value}{card.suit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rest of the controls and result display remain the same */}
          {result && (
            <div className={styles.result}>
              <Text>{result}</Text>
            </div>
          )}

          <div className={styles.controls}>
            {gameStage !== 'end' ? (
              isPlayerTurn ? (
                <>
                  <Button onClick={handleFold}>Fold</Button>
                  {bettingState.canCheck ? (
                    <Button onClick={handleCheck}>Check</Button>
                  ) : (
                    <Button onClick={handleCall}>
                      Call ${currentBet - playerBet}
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleRaise(bettingState.minRaise)}
                    disabled={playerChips < bettingState.minRaise - playerBet}
                  >
                    Raise to ${bettingState.minRaise}
                  </Button>
                </>
              ) : (
                <Text className={styles.dealerThinking}>
                  AI is thinking...
                </Text>
              )
            ) : (
              <Button onClick={startNewGame}>New Game</Button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}