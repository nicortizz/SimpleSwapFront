import React from 'react';
import SwapInterface from './components/SwapInterface.jsx';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">🔄 SimpleSwap DApp</h1>
          <p className="text-lg text-gray-300">Swap tokens, add/remove liquidity and monitor your position.</p>
        </header>

        <SwapInterface />
      </div>
    </div>
  );
}

export default App;