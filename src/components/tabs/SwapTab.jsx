import React from 'react';

const SwapTab = ({
  inputAmount,
  setInputAmount,
  estimateOutput,
  toggleToken,
  estimatedOutput,
  inputToken,
  swap,
  loading,
  isConnected,
  hasInsufficientBalance
}) => {
  return (
    <div className="space-y-4 bg-zinc-900 p-4 rounded-xl shadow-md">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 bg-zinc-800 border border-zinc-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Amount ${inputToken}`}
          value={inputAmount}
          onChange={(e) => {
            setInputAmount(e.target.value);
            estimateOutput(e.target.value);
          }}
        />
        <button
          onClick={toggleToken}
          className="bg-zinc-700 text-white px-3 py-2 rounded-full hover:bg-zinc-600 transition"
          title="Toggle token"
        >
          ⇄
        </button>
      </div>

      {estimatedOutput && (
        <p className="text-sm text-zinc-300">
          Estimated output: <strong className="text-white">{estimatedOutput} {inputToken === 'A' ? 'B' : 'A'}</strong>
        </p>
      )}

      {inputAmount && hasInsufficientBalance() && (
        <p className="text-sm text-red-500">
          Insufficient balance for Token {inputToken}
        </p>
      )}

      <button
        onClick={swap}
        disabled={loading || !isConnected || hasInsufficientBalance()}
        className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
      >
        {loading ? 'Swapping...' : `Swap ${inputToken} → ${inputToken === 'A' ? 'B' : 'A'}`}
      </button>
    </div>
  );
};

export default SwapTab;
