import React from 'react';

const RemoveLiquidityTab = ({
  liquidityToRemove,
  setLiquidityToRemove,
  lpBalance,
  handleRemoveLiquidity,
  loading,
  isConnected
}) => {
  const parsedRemove = parseFloat(liquidityToRemove || '0');
  const parsedBalance = parseFloat(lpBalance || '0');

  return (
    <div className="space-y-4 bg-zinc-900 p-6 rounded-xl shadow-md text-white">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">LP Tokens to Remove</label>
        <input
          type="number"
          value={liquidityToRemove}
          onChange={(e) => setLiquidityToRemove(e.target.value)}
          placeholder="Enter amount"
          className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {parsedRemove > parsedBalance && (
          <p className="text-sm text-red-500 mt-1">Insufficient LP token balance</p>
        )}
      </div>

      <button
        onClick={handleRemoveLiquidity}
        disabled={
          loading || !isConnected || parsedRemove <= 0 || parsedRemove > parsedBalance
        }
        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded disabled:opacity-50"
      >
        {loading ? 'Removing...' : 'Remove Liquidity'}
      </button>

      <div className="text-xs text-zinc-400 text-right">
        Your LP Balance: <span className="text-white font-semibold">{lpBalance ?? '0'}</span>
      </div>
    </div>
  );
};

export default RemoveLiquidityTab;
