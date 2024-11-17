// src/pages/Poker.tsx

import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { PokerLogic, Card, GameStage } from './PokerLogic';
import styles from './Poker.module.css';

export function Poker() {
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
    
    const decision = Math.random();
    const callAmount = currentBet - aiBet;
    
    if (communityCards.length >= 3) {
      const aiVisibleCards = [...aiHand.map(card => ({...card, hidden: false})), ...communityCards];
      const handStrength = poker.evaluateHand(aiVisibleCards).rank;
      
      // More conservative AI logic
      if (handStrength >= 4) { // Strong hand
        if (aiChips >= currentBet * 2) {
          handleAIAction('raise', currentBet * 2);
        } else {
          handleAIAction('call');
        }
      } else if (handStrength >= 2) { // Medium hand
        handleAIAction('call');
      } else { // Weak hand
        if (callAmount <= 20) { // Small bet, worth calling
          handleAIAction('call');
        } else {
          handleAIAction('fold');
        }
      }
    } else {
      // Pre-flop decisions
      if (callAmount <= 20 || decision < 0.7) {
        handleAIAction('call');
      } else {
        handleAIAction('fold');
      }
    }
  };

  const handleAIAction = (action: 'call' | 'raise' | 'fold', raiseAmount?: number) => {
    switch (action) {
      case 'call':
        const callAmount = currentBet - aiBet;
        setAIChips(prev => prev - callAmount);
        setAIBet(currentBet);
        setPot(prev => prev + callAmount);
        if (currentBet === playerBet) {
          advanceGameStage();
        } else {
          setIsPlayerTurn(true);
        }
        break;
        
      case 'raise':
        if (raiseAmount) {
          const actualRaise = Math.min(raiseAmount, aiChips + aiBet);
          const raiseIncrement = actualRaise - aiBet;
          setAIChips(prev => prev - raiseIncrement);
          setAIBet(actualRaise);
          setPot(prev => prev + raiseIncrement);
          setCurrentBet(actualRaise);
          setIsPlayerTurn(true);
        }
        break;
        
      case 'fold':
        setPlayerChips(prev => prev + pot);
        setResult('AI folded. You win!');
        setGameStage('end');
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
    const callAmount = currentBet - playerBet;
    
    if (isPlayerTurn) {
      if (callAmount > playerChips) {
        // Handle all-in logic here if needed
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
    }
  };

  const handleRaise = (newBet: number) => {
    const currentPlayer = isPlayerTurn ? 'player' : 'ai';
    const availableChips = currentPlayer === 'player' ? playerChips : aiChips;
    
    if (!poker.validateBet(newBet, availableChips, currentBet)) {
      return;
    }

    const raiseAmount = newBet - (currentPlayer === 'player' ? playerBet : aiBet);
    
    if (isPlayerTurn) {
      setPlayerChips(prev => prev - raiseAmount);
      setPlayerBet(newBet);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(newBet);
      handleAITurn();
    } else {
      setAIChips(prev => prev - raiseAmount);
      setAIBet(newBet);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(newBet);
      setIsPlayerTurn(true);
    }
  };

  const advanceGameStage = () => {
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
        break;
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
                  <Button onClick={() => handleCall()}>
                    Call ${currentBet}
                  </Button>
                  <Button onClick={() => handleRaise(currentBet * 2)}>
                    Raise to ${currentBet * 2}
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