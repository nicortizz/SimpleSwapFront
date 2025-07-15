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
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600">Amount A (desired)</label>
        <input
          type="number"
          value={liquidityInputs.amountADesired}
          onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountADesired: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        {parsedA > balA && <p className="text-sm text-red-600">Insufficient Token A balance</p>}
      </div>
      <div>
        <label className="block text-sm text-gray-600">Amount B (desired)</label>
        <input
          type="number"
          value={liquidityInputs.amountBDesired}
          onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountBDesired: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        {parsedB > balB && <p className="text-sm text-red-600">Insufficient Token B balance</p>}
      </div>
      <button
        onClick={handleAddLiquidity}
        disabled={
          loading || !isConnected || parsedA > balA || parsedB > balB
        }
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Liquidity'}
      </button>
    </div>
  );
};

export default AddLiquidityTab;
