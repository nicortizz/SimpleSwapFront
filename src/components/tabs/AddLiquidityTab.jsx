import React from 'react';

const AddLiquidityTab = ({
  liquidityInputs,
  setLiquidityInputs,
  handleAddLiquidity,
  loading,
  isConnected,
  balanceA,
  balanceB
}) => {
  const parsedA = parseFloat(liquidityInputs.amountADesired || '0');
  const parsedB = parseFloat(liquidityInputs.amountBDesired || '0');
  const balA = parseFloat(balanceA || '0');
  const balB = parseFloat(balanceB || '0');

  return (
    <div className="space-y-4 bg-zinc-900 p-4 rounded-xl shadow-md">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Amount A (desired)</label>
        <input
          type="number"
          value={liquidityInputs.amountADesired}
          onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountADesired: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.0"
        />
        {parsedA > balA && (
          <p className="text-sm text-red-500 mt-1">Insufficient Token A balance</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Amount B (desired)</label>
        <input
          type="number"
          value={liquidityInputs.amountBDesired}
          onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountBDesired: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-600 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.0"
        />
        {parsedB > balB && (
          <p className="text-sm text-red-500 mt-1">Insufficient Token B balance</p>
        )}
      </div>

      <button
        onClick={handleAddLiquidity}
        disabled={loading || !isConnected || parsedA > balA || parsedB > balB}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Liquidity'}
      </button>
    </div>
  );
};

export default AddLiquidityTab;
