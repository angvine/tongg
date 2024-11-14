// src/helpers/ton.ts
import { TonClient } from 'ton';
import { useTonConnect } from '@tonconnect/ui-react';

export async function sendGameResult(gameId: string, score: number) {
  const { wallet } = useTonConnect();
  if (!wallet) return;

  const client = new TonClient();
  // Implementation for sending game results to smart contract
}