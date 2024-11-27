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

// Add this helper function near the top of the file
const formatGG = (amount: number) => {
  return `🪙${amount}gg`;
};

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
  const [maxRaisesPerRound] = useState(3); // Limit number of raises per round
  const [playerRaises, setPlayerRaises] = useState(0);
  const [aiRaises, setAIRaises] = useState(0);

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
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Ensure aiHand is properly mapped and not hidden before evaluation
    const aiVisibleCards = aiHand.map(card => ({
      ...card,
      hidden: false,
      value: card.value,
      suit: card.suit
    }));

    const allCards = [...aiVisibleCards, ...communityCards];
    const handStrength = allCards.length > 0 ? poker.evaluateHand(allCards) : { rank: 0 };

    const aiCanCheck = currentBet === aiBet;
    const callAmount = currentBet - aiBet;
    const lastRaiseSize = currentBet - Math.min(playerBet, aiBet);
    const minRaise = Math.max(currentBet + lastRaiseSize, 20);
    const maxRaise = aiChips + aiBet;

    // Calculate hand strength
    const potOdds = callAmount / (pot + callAmount);

    let action: 'check' | 'call' | 'raise' | 'fold' = 'check';
    let raiseAmount = minRaise;

    // AI decision-making logic
    if (aiCanCheck) {
      if (handStrength.rank >= 4) {
        action = 'raise';
      } else {
        action = 'check';
      }
    } else {
      if (handStrength.rank >= 4 && aiRaises < maxRaisesPerRound) {
        action = 'raise';
      } else if (potOdds < 0.5 || handStrength.rank >= 2) {
        action = 'call';
      } else {
        action = 'fold';
      }
    }

    handleAIAction(action, raiseAmount);
  };

  const handleAIAction = (action: 'check' | 'call' | 'raise' | 'fold', raiseAmount?: number) => {
    // Set AI speech based on action
    switch (action) {
      case 'check':
        setAiSpeech('Check.');
        break;
      case 'call':
        setAiSpeech('Call.');
        break;
      case 'raise':
        setAiSpeech('Raise.');
        break;
      case 'fold':
        setAiSpeech('Fold.');
        break;
    }

    // Clear speech after 2 seconds
    setTimeout(() => setAiSpeech(''), 2000);

    switch (action) {
      case 'check':
        setAIBet(currentBet);
        if (playerBet === currentBet) {
          advanceGameStage();
        } else {
          setIsPlayerTurn(true);
        }
        break;
      case 'call':
        const callAmount = currentBet - aiBet;
        setAIChips(prev => prev - callAmount);
        setAIBet(currentBet);
        setPot(prev => prev + callAmount);
        if (playerBet === currentBet) {
          advanceGameStage();
        } else {
          setIsPlayerTurn(true);
        }
        break;
      case 'raise':
        const raiseTotal = raiseAmount!;
        const additionalAmount = raiseTotal - aiBet;
        setAIChips(prev => prev - additionalAmount);
        setAIBet(raiseTotal);
        setPot(prev => prev + additionalAmount);
        setCurrentBet(raiseTotal);
        setAIRaises(prev => prev + 1);
        setIsPlayerTurn(true);
        break;
      case 'fold':
        setResult('AI folded. You win!');
        setPlayerChips(prev => prev + pot);
        setGameStage('end');
        setIsPlayerTurn(false);
        break;
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

  const handlePlayerAction = (action: 'fold' | 'check' | 'call' | 'raise', raiseAmount?: number) => {
    if (!isPlayerTurn) return;

    switch (action) {
      case 'fold':
        handleFold();
        break;
      case 'check':
        if (bettingState.canCheck) {
          if (aiBet === currentBet) {
            advanceGameStage();
          } else {
            handleAITurn();
          }
        }
        break;

      case 'call':
        const callAmount = currentBet - playerBet;
        setPlayerChips(prev => prev - callAmount);
        setPlayerBet(currentBet);
        setPot(prev => prev + callAmount);

        if (playerBet === currentBet) {
          advanceGameStage();
        } else {
          handleAITurn();
        }
        break;

      case 'raise':
        const minRaiseAmount = bettingState.minRaise;
        const maxAllowedRaise = aiChips + aiBet;
        const desiredRaise = raiseAmount || minRaiseAmount;
        const actualRaise = Math.min(desiredRaise, playerChips + playerBet, maxAllowedRaise);

        if (actualRaise < minRaiseAmount) {
          // Raise amount is too low
          return;
        }

        // Update player raises counter
        setPlayerRaises(prev => prev + 1);

        const raiseIncrement = actualRaise - playerBet;
        setPlayerChips(prev => prev - raiseIncrement);
        setPlayerBet(actualRaise);
        setPot(prev => prev + raiseIncrement);
        setCurrentBet(actualRaise);
        handleAITurn();
        break;

      default:
        break;
    }
  };

  const advanceGameStage = () => {
    // Reset raises counters at the end of each betting round
    setPlayerRaises(0);
    setAIRaises(0);

    // Reset bets for new betting round
    setPlayerBet(0);
    setAIBet(0);
    setCurrentBet(0);
    
    switch (gameStage) {
      case 'preflop':
        dealFlop();
        break;
      case 'flop':
        dealTurn();
        break;
      case 'turn':
        dealRiver();
        break;
      case 'river':
        handleShowdown();
        return; // Exit early to avoid setting isPlayerTurn after the game ends
    }

    // Ensure isPlayerTurn is set to true after advancing the game stage
    setIsPlayerTurn(true);
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
      // Hand ranks are equal; compare kickers
      const kickerComparison = poker.compareKickers(playerBestHand.kickers, aiBestHand.kickers);
      if (kickerComparison > 0) {
        setPlayerChips(prev => prev + pot);
        setResult(`You win with ${playerBestHand.name} (better kickers)!`);
      } else if (kickerComparison < 0) {
        setAIChips(prev => prev + pot);
        setResult(`AI wins with ${aiBestHand.name} (better kickers)!`);
      } else {
        // If kickers are also equal, it's a tie
        setPlayerChips(prev => prev + Math.floor(pot / 2));
        setAIChips(prev => prev + Math.floor(pot / 2));
        setResult(`It's a tie with ${playerBestHand.name}! Pot is split.`);
      }
    }
    setGameStage('end');
    setIsPlayerTurn(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    updateBettingState();
  }, [currentBet, playerBet, aiBet, playerChips, aiChips]);

  const updateBettingState = () => {
    // Can check only if no one has bet in this round
    const canCheck = currentBet === playerBet;
    
    // Minimum raise must be at least the size of the previous raise
    const lastRaiseSize = currentBet - Math.min(playerBet, aiBet);
    const minRaiseIncrement = lastRaiseSize > 0 ? lastRaiseSize : 20; // minimum 20 chips
    const minRaise = currentBet + minRaiseIncrement;
    
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
            <Text>{formatGG(playerChips)}</Text>
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
                {formatGG(pot)}
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
                  <Button onClick={() => handlePlayerAction('fold')}>Fold</Button>
                  {bettingState.canCheck ? (
                    <Button onClick={() => handlePlayerAction('check')}>Check</Button>
                  ) : (
                    <Button onClick={() => handlePlayerAction('call')}>
                      Call {formatGG(currentBet - playerBet)}
                    </Button>
                  )}
                  <Button 
                    onClick={() => handlePlayerAction('raise', bettingState.minRaise)}
                    disabled={
                      playerChips < bettingState.minRaise - playerBet ||
                      playerRaises >= maxRaisesPerRound
                    }
                  >
                    Raise to {formatGG(bettingState.minRaise)}
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