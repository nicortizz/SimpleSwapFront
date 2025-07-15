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
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          className="flex-1 border border-gray-300 px-4 py-2 rounded focus:outline-none"
          placeholder={`Amount ${inputToken}`}
          value={inputAmount}
          onChange={(e) => {
            setInputAmount(e.target.value);
            estimateOutput(e.target.value);
          }}
        />
        <button className="text-blue-500 font-bold" onClick={toggleToken}>⇄ A/B</button>
      </div>
      {estimatedOutput && (
        <p className="text-sm text-gray-600">
          Estimated output: <strong>{estimatedOutput} {inputToken === 'A' ? 'B' : 'A'}</strong>
        </p>
      )}
      {inputAmount && hasInsufficientBalance() && (
        <p className="text-sm text-red-600">
          Insufficient balance for Token {inputToken}
        </p>
      )}
      <button
        onClick={swap}
        disabled={loading || !isConnected || hasInsufficientBalance()}
        className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Swapping...' : `Swap ${inputToken} → ${inputToken === 'A' ? 'B' : 'A'}`}
      </button>
    </div>
  );
};

export default SwapTab;
