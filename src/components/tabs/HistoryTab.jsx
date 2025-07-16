import React from 'react';

const HistoryTab = ({ history, fetchFullHistory, loadingFullHistory }) => {
  return (
    <div className="space-y-4 bg-zinc-900 p-6 rounded-xl shadow-md text-white">
      <h3 className="text-lg font-semibold">📜 Recent Activity</h3>

      <div className="text-center">
        <button
          onClick={fetchFullHistory}
          disabled={loadingFullHistory}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          {loadingFullHistory ? "Loading..." : "🔍 Show full history"}
        </button>
      </div>

      {loadingFullHistory && (
        <div className="text-sm text-gray-500 text-center animate-pulse">Fetching on-chain history...</div>
      )}

      <ul className="space-y-3 max-h-[24rem] overflow-y-auto">
        {history.length === 0 ? (
          <li className="text-zinc-400">No history found</li>
        ) : (
          history.map((h, idx) => (
            <li key={idx} className="bg-zinc-800 border border-zinc-700 p-3 rounded-md text-sm space-y-1">
              <div className="font-semibold text-blue-400">{h.type || 'Swap'}</div>
              <div>
                {h.detail ||
                  `${h.amountIn} ${h.inputToken?.slice(0, 6)} → ${h.amountOut} ${h.outputToken?.slice(0, 6)}`}
              </div>
              <div className="text-xs text-zinc-400">
                {h.time || new Date(h.timestamp * 1000).toLocaleString()}
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${h.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline break-all text-xs"
              >
                Tx: {h.hash?.slice(0, 10)}...
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default HistoryTab;
