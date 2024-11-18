// src/pages/GameHub.tsx
import { Page } from '@/components/Page';
import { Button, Card, Text } from '@telegram-apps/telegram-ui';
import { useNavigate } from 'react-router-dom';
import styles from './GameHub.module.css';
import { TonConnectButton, useTonWallet, TonConnectUIProvider } from '@tonconnect/ui-react';

export function GameHub() {
  const navigate = useNavigate();
  const wallet = useTonWallet();

  const games = [
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      description: 'Challenge the AI in classic X\'s and O\'s',
      icon: '#️⃣',  // Changed from ❌ to #️⃣ (hash/grid)
      color: '#FF6B6B'
    },
    {
      id: 'chess',
      title: 'Chess',
      description: 'Strategic chess battles against AI',
      icon: '♟️',
      color: '#4ECDC4'
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your memory with card pairs',
      icon: '🎭',
      color: '#FFB6C1'  // Changed from #45B7D1 to light pink for better contrast
    },
    {
      id: 'poker',
      title: 'Poker',
      description: 'Texas Hold\'em against the dealer',
      icon: '🃏',  // Changed from 🎰 to 🃏 (Joker Card)
      color: '#FF9F43'
    },
    {
      id: 'numbermind',
      title: 'Number Mind',
      description: 'Crack the secret code with AI feedback',
      icon: '🎯',
      color: '#9B59B6'
    },
    {
      id: 'dotsandboxes',
      title: 'Dots & Boxes',
      description: 'Classic strategy game against AI',
      icon: '⬚',
      color: '#3498DB'
    }
  ];

  return (
    <Page>
      <div className={styles.container}>
        {!wallet ? (
          <div className={styles.connectButtonWrapper}>
            <TonConnectButton className={styles.connectButton} />
          </div>
        ) : (
          <Text className={styles.walletInfo}>
            Connected: {wallet.account.address}
          </Text>
        )}
        
        {/* Game cards grid */}
        <div className={styles.gameGrid}>
          {games.map(game => (
            <Card key={game.id} className={styles.gameCard}>
              <div 
                className={styles.gameIcon} 
                style={{ background: game.color }}
              >
                {game.icon}
              </div>
              <div className={styles.gameInfo}>
                <Text as="h3" className={styles.gameTitle}>{game.title}</Text>
                {/* <Text className={styles.gameDescription}>{game.description}</Text> */}
              </div>
              <Button
                className={styles.playButton}
                onClick={() => navigate(`/games/${game.id}`)}
              >
                Play Now
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}

function Root() {
  return (
    <TonConnectUIProvider manifestUrl="https://ton.games/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}