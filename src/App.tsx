import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const manifestUrl = 'https://games.ton.gg/tonconnect-manifest.json'; // Replace with your actual manifest URL

export function App() {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <RouterProvider router={router} />
    </TonConnectUIProvider>
  );
}

export default App;
