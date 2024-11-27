// src/helpers/ton.ts
import { TonClient } from 'ton';
import { useTonConnect } from '@tonconnect/ui-react';

// TON HTTP API endpoints
const MAINNET_API_ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC'; 
const TESTNET_API_ENDPOINT = 'https://testnet.toncenter.com/api/v2/jsonRPC';

// Initialize TON Client with proper configuration
const client = new TonClient({
  endpoint: TESTNET_API_ENDPOINT,
  apiKey: '73d5701dadec580a9bb59baecd8b36c57bab9eb21beb8aaa30d0bee19674da08', // Replace with your actual API key
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export async function sendGameResult(gameId: string, score: number) {
  try {
    const { wallet } = useTonConnect();
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    // Construct the transaction payload
    const payload = {
      type: 'gameResult',
      gameId: gameId,
      score: score,
      timestamp: Date.now()
    };

    // Send the transaction
    const result = await wallet.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000,
      messages: [
        {
          address: process.env.VITE_TON_CONTRACT_ADDRESS || '', // Get from env
          amount: '10000000', // 0.01 TON
          payload: payload,
        },
      ],
    });

    return result;
  } catch (error) {
    console.error('Failed to send game result:', error);
    throw error;
  }
}