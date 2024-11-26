// src/helpers/ton.ts
import { TonClient } from 'ton';
import { useTonConnect } from '@tonconnect/ui-react';

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: '73d5701dadec580a9bb59baecd8b36c57bab9eb21beb8aaa30d0bee19674da08', // Replace with your actual Toncenter API key
});

export async function sendGameResult(gameId: string, score: number) {
  const { wallet } = useTonConnect();
  if (!wallet) return;

  // Construct the transaction payload
  const payload = {
    // Your smart contract method and parameters
  };

  // Send the transaction using the wallet
  await wallet.sendTransaction({
    validUntil: Date.now() + 5 * 60 * 1000, // Transaction validity time
    messages: [
      {
        address: 'SMART_CONTRACT_ADDRESS', // Replace with your smart contract address
        amount: '1000000', // Amount in nanotons (adjust as needed)
        payload, // The payload constructed above
      },
    ],
  });
}