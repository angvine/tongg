// src/pages/Poker.tsx

import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { PokerLogic, Card, GameStage } from './PokerLogic';
import styles from './Poker.module.css';

const dealerEmojis = {
  thinking: '🤔',
  happy: '😊',
  sad: '😢',
  excited: '🎉',
  nervous: '😅'
};

export function Poker() {
  const [poker] = useState(() => new PokerLogic());
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [playerChips, setPlayerChips] = useState(1000);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [gameStage, setGameStage] = useState<GameStage>('preflop');
  const [result, setResult] = useState<string>('');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [dealerChips, setDealerChips] = useState(1000);
  const [playerBet, setPlayerBet] = useState(0);
  const [dealerBet, setDealerBet] = useState(0);
  const [dealerMood, setDealerMood] = useState<keyof typeof dealerEmojis>('happy');

  const startNewGame = () => {
    const newDeck = poker.createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [
      { ...newDeck.pop()!, hidden: true },
      { ...newDeck.pop()!, hidden: true }
    ];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setCommunityCards([]);
    setPot(30); // Small blind 10 + Big blind 20
    setPlayerChips(prev => prev - 20);
    setCurrentBet(20);
    setGameStage('preflop');
    setResult('');
    setIsPlayerTurn(true);
    setDealerChips(1000);
    setPlayerChips(1000);
    setPot(0);
    setPlayerBet(0);
    setDealerBet(0);
    
    // Small and big blinds
    const smallBlind = 10;
    const bigBlind = 20;
    
    setPlayerChips(prev => prev - bigBlind);
    setDealerChips(prev => prev - smallBlind);
    setPlayerBet(bigBlind);
    setDealerBet(smallBlind);
    setPot(smallBlind + bigBlind);
    setCurrentBet(bigBlind);
  };

  const handleDealerTurn = async () => {
    setIsPlayerTurn(false);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const decision = Math.random();
    const callAmount = currentBet - dealerBet;
    
    if (communityCards.length >= 3) {
      const dealerVisibleCards = [...dealerHand.map(card => ({...card, hidden: false})), ...communityCards];
      const handStrength = poker.evaluateHand(dealerVisibleCards).rank;
      
      // More conservative dealer logic
      if (handStrength >= 4) { // Strong hand
        if (dealerChips >= currentBet * 2) {
          handleDealerAction('raise', currentBet * 2);
        } else {
          handleDealerAction('call');
        }
      } else if (handStrength >= 2) { // Medium hand
        handleDealerAction('call');
      } else { // Weak hand
        if (callAmount <= 20) { // Small bet, worth calling
          handleDealerAction('call');
        } else {
          handleDealerAction('fold');
        }
      }
    } else {
      // Pre-flop decisions
      if (callAmount <= 20 || decision < 0.7) {
        handleDealerAction('call');
      } else {
        handleDealerAction('fold');
      }
    }
  };

  const handleDealerAction = (action: 'call' | 'raise' | 'fold', raiseAmount?: number) => {
    switch (action) {
      case 'call':
        const callAmount = currentBet - dealerBet;
        setDealerChips(prev => prev - callAmount);
        setDealerBet(currentBet);
        setPot(prev => prev + callAmount);
        if (currentBet === playerBet) {
          advanceGameStage();
        } else {
          setIsPlayerTurn(true);
        }
        break;
        
      case 'raise':
        if (raiseAmount) {
          const actualRaise = Math.min(raiseAmount, dealerChips + dealerBet);
          const raiseIncrement = actualRaise - dealerBet;
          setDealerChips(prev => prev - raiseIncrement);
          setDealerBet(actualRaise);
          setPot(prev => prev + raiseIncrement);
          setCurrentBet(actualRaise);
          setIsPlayerTurn(true);
        }
        break;
        
      case 'fold':
        setPlayerChips(prev => prev + pot);
        setResult('Dealer folded. You win!');
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
    const winner = isPlayerTurn ? 'dealer' : 'player';
    const loser = isPlayerTurn ? 'player' : 'dealer';
    
    if (winner === 'dealer') {
      setDealerChips(prev => prev + pot);
    } else {
      setPlayerChips(prev => prev + pot);
    }
    
    setResult(`${loser === 'player' ? 'You' : 'Dealer'} folded. ${winner === 'player' ? 'You' : 'Dealer'} wins!`);
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
      
      if (currentBet === dealerBet) {
        advanceGameStage();
      } else {
        handleDealerTurn();
      }
    }
  };

  const handleRaise = (newBet: number) => {
    const currentPlayer = isPlayerTurn ? 'player' : 'dealer';
    const availableChips = currentPlayer === 'player' ? playerChips : dealerChips;
    
    if (!poker.validateBet(newBet, availableChips, currentBet)) {
      return;
    }

    const raiseAmount = newBet - (currentPlayer === 'player' ? playerBet : dealerBet);
    
    if (isPlayerTurn) {
      setPlayerChips(prev => prev - raiseAmount);
      setPlayerBet(newBet);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(newBet);
      handleDealerTurn();
    } else {
      setDealerChips(prev => prev - raiseAmount);
      setDealerBet(newBet);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(newBet);
      setIsPlayerTurn(true);
    }
  };

  const advanceGameStage = () => {
    // Reset bets for new betting round
    setPlayerBet(0);
    setDealerBet(0);
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
    setDealerHand(prev => prev.map(card => ({ ...card, hidden: false })));

    const playerBestHand = poker.evaluateHand([...playerHand, ...communityCards]);
    const dealerBestHand = poker.evaluateHand([...dealerHand, ...communityCards]);

    if (playerBestHand.rank > dealerBestHand.rank) {
      setPlayerChips(prev => prev + pot);
      setResult(`You win with ${playerBestHand.name}!`);
    } else if (playerBestHand.rank < dealerBestHand.rank) {
      setDealerChips(prev => prev + pot);
      setResult(`Dealer wins with ${dealerBestHand.name}!`);
    } else {
      // Compare kickers when ranks are equal
      const kickerComparison = poker.compareKickers(playerBestHand.kickers, dealerBestHand.kickers);
      if (kickerComparison > 0) {
        setPlayerChips(prev => prev + pot);
        setResult(`You win with ${playerBestHand.name} (better kickers)!`);
      } else if (kickerComparison < 0) {
        setDealerChips(prev => prev + pot);
        setResult(`Dealer wins with ${dealerBestHand.name} (better kickers)!`);
      } else {
        setPlayerChips(prev => prev + Math.floor(pot / 2));
        setDealerChips(prev => prev + Math.floor(pot / 2));
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
          Friendly Poker 🎲
        </Text>
        
        <div className={styles.chips}>
          <span className={styles.chipIcon}>💰</span>
          <Text>Your Chips: ${playerChips}</Text>
        </div>

        <div className={styles.dealerArea}>
          <div className={styles.dealerCharacter}>
            {dealerEmojis[dealerMood]}
          </div>
          <Text variant="body">Dealer's Cards</Text>
          <div className={styles.hand}>
            {dealerHand.map((card, index) => (
              <div key={index} className={styles.card}>
                {card.hidden ? '🂠' : 
                  <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : ''}>
                    {card.value}{card.suit}
                  </span>
                }
              </div>
            ))}
          </div>
        </div>

        <div className={styles.communityArea}>
          <Text variant="body">Community Cards 🎴</Text>
          <div className={styles.hand}>
            {communityCards.map((card, index) => (
              <div key={index} className={styles.card}>
                <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : ''}>
                  {card.value}{card.suit}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.playerArea}>
          <Text variant="body">Your Cards 🎯</Text>
          <div className={styles.hand}>
            {playerHand.map((card, index) => (
              <div key={index} className={styles.card}>
                <span className={card.suit === '♥' || card.suit === '♦' ? styles.red : ''}>
                  {card.value}{card.suit}
                </span>
              </div>
            ))}
          </div>
        </div>

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
                Dealer is thinking...
              </Text>
            )
          ) : (
            <Button onClick={startNewGame}>New Game</Button>
          )}
        </div>
      </div>
    </Page>
  );
}