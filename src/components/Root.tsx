import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { App } from './App';

import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';

function ErrorBoundaryError({ error }: { error: unknown }) {
  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

// Wallet connection implementation in ToN Good Games

// 1. Core wallet integration via TonConnectUIProvider
// In src/components/Root.tsx
export function Root() {
  return (
    <TonConnectUIProvider manifestUrl="https://ton.games/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}
