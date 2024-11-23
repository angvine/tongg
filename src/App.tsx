import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// Make sure your manifest is accessible via HTTPS
const manifestUrl = "https://games.ton.gg/tonconnect-manifest.json";

const manifest = {
  "url": "https://games.ton.gg",
  "name": "TON Good Games",
  "iconUrl": "https://games.ton.gg/icon.png"
};

export function App() {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <RouterProvider router={router} />
    </TonConnectUIProvider>
  );
}
