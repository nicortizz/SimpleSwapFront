import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const config = getDefaultConfig({
  appName: 'SimpleSwap',
  projectId: 'simple_swap_demo', // reemplazalo si querés usar WalletConnect real
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(), // usa el transport por defecto (viem)
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
          <ToastContainer position="top-right" autoClose={5000} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);
