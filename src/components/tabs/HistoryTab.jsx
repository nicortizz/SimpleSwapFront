// HistoryTab.jsx
import React from 'react';

const HistoryTab = ({ history, fetchFullHistory }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      <div className="text-center">
        <button
          onClick={fetchFullHistory}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Show full history
        </button>
      </div>
      <ul className="space-y-2">
        {history.length === 0 ? (
          <li className="text-gray-500">No history found</li>
        ) : (
          history.map((h, idx) => (
            <li key={idx} className="text-sm border border-gray-200 p-2 rounded">
              <div className="font-semibold">{h.type || 'Swap'}</div>
              <div>{h.detail || `${h.amountIn} ${h.inputToken.slice(0, 6)} → ${h.amountOut} ${h.outputToken.slice(0, 6)}`}</div>
              <div className="text-gray-500 text-xs">{h.time || h.timestamp}</div>
              <a
                href={`https://sepolia.etherscan.io/tx/${h.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                {h.hash.slice(0, 10)}...
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default HistoryTab;
