// src/components/tabs/DashboardTab.jsx
import React from 'react';

function DashboardTab({ address = '', history = [], reserves = {}, lpBalance = '0', userShare = '0', totalSupply = '0' }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-sm font-semibold">📊 Dashboard</p>
        <ul className="text-sm space-y-1 mt-2">
          <li>🧮 Total Swaps: <strong>{history.length}</strong></li>
          <li>💧 Pool Liquidity: <strong>{reserves.reserveA}</strong> A / <strong>{reserves.reserveB}</strong> B</li>
          <li>🪙 Your LP Tokens: <strong>{lpBalance}</strong></li>
          <li>📈 Pool Share: <strong>{userShare}%</strong></li>
          <li>🔄 Total LP Supply: <strong>{totalSupply}</strong></li>
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        Connected wallet: <strong>{address}</strong>
      </div>
    </div>
  );
}

export default DashboardTab;
