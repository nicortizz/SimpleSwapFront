import React from 'react';

const RemoveLiquidityTab = ({
  liquidityToRemove,
  setLiquidityToRemove,
  lpBalance,
  handleRemoveLiquidity,
  loading,
  isConnected
}) => {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700">Liquidity amount to remove</label>
      <input
        type="text"
        placeholder="e.g. 10"
        value={liquidityToRemove}
        onChange={(e) => setLiquidityToRemove(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      <p className="text-sm text-gray-600">Current LP balance: <strong>{lpBalance}</strong></p>
      <button
        onClick={handleRemoveLiquidity}
        disabled={
          loading ||
          !isConnected ||
          !liquidityToRemove ||
          parseFloat(liquidityToRemove) > parseFloat(lpBalance)
        }
        className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Removing...' : 'Remove Liquidity'}
      </button>
    </div>
  );
};

export default RemoveLiquidityTab;
