import React from 'react';

function DashboardTab({ address = '', history = [], reserves = {}, lpBalance = '0', userShare = '0', totalSupply = '0' }) {
  return (
    <div className="space-y-6 bg-zinc-900 p-6 rounded-xl shadow-md text-white">
      <div>
        <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
          📊 Dashboard Summary
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li>
            🧮 <span className="font-medium">Total Swaps:</span>{' '}
            <span className="text-white font-semibold">{history?.length ?? 0}</span>
          </li>
          <li>
            💧 <span className="font-medium">Pool Liquidity:</span>{' '}
            <span className="text-white font-semibold">{reserves?.reserveA ?? '0'}</span> A /{' '}
            <span className="text-white font-semibold">{reserves?.reserveB ?? '0'}</span> B
          </li>
          <li>
            🪙 <span className="font-medium">Your LP Tokens:</span>{' '}
            <span className="text-white font-semibold">{lpBalance ?? '0'}</span>
          </li>
          <li>
            📈 <span className="font-medium">Your Pool Share:</span>{' '}
            <span className="text-white font-semibold">{userShare ?? 0}%</span>
          </li>
          <li>
            🔄 <span className="font-medium">Total LP Supply:</span>{' '}
            <span className="text-white font-semibold">{totalSupply ?? '0'}</span>
          </li>
        </ul>
      </div>

      <div className="text-xs text-zinc-400 border-t border-zinc-700 pt-4">
        Connected wallet: <span className="text-white">{address ?? 'Not connected'}</span>
      </div>
    </div>
  );
}

export default DashboardTab;
