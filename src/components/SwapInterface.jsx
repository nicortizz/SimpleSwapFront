import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from "react-toastify";
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import simpleSwapAbi from '../abi/SimpleSwap.json';
import { erc20Abi, ensureApproval } from '../abi/erc20Abi';

const contractAddress = '0x3f7c341Fc3AC70A4Ac9BF861dE759B0A9eE0EB55';

function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const signer = useMemo(() => {
    if (!walletClient) return null;
    return new ethers.providers.Web3Provider(window.ethereum).getSigner();
  }, [walletClient]);

  const [contract, setContract] = useState(null);
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [inputToken, setInputToken] = useState('A');
  const [inputAmount, setInputAmount] = useState('');
  const [price, setPrice] = useState(null);
  const [balanceA, setBalanceA] = useState(null);
  const [balanceB, setBalanceB] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liquidityInputs, setLiquidityInputs] = useState({
    amountADesired: '100',
    amountBDesired: '100',
    lpToRemove: '50'
  });
  const [liquidityToRemove, setLiquidityToRemove] = useState("10");
  const [lpBalance, setLpBalance] = useState("0");
  const [reserves, setReserves] = useState({ reserveA: '0', reserveB: '0' });
  const [userShare, setUserShare] = useState(null);
  const [totalSupply, setTotalSupply] = useState("0");
  const [estimatedOutput, setEstimatedOutput] = useState(null);


  useEffect(() => {
    if (!walletClient || !isConnected || !signer) return;

    const instance = new ethers.Contract(contractAddress, simpleSwapAbi, signer);
    setContract(instance);

    (async () => {
      try {
        const a = await instance.tokenA();
        const b = await instance.tokenB();
        setTokenA(a);
        setTokenB(b);
        await fetchBalances(instance, address, a, b);
        await fetchHistory(instance, address);
        await fetchLpBalance(address);
        await fetchUserShare();
        await fetchReserves();
        await fetchFullHistory(instance, address);
      } catch (err) {
        console.error(err);
        setError('Failed to initialize contract');
      }
    })();
  }, [walletClient, isConnected, signer]);

  useEffect(() => {
    if (!contract || !tokenA || !tokenB) return;

    const interval = setInterval(() => {
      const fetchPrice = async () => {
        try {
          const tokenIn = inputToken === 'A' ? tokenA : tokenB;
          const tokenOut = inputToken === 'A' ? tokenB : tokenA;
          const price = await contract.getPrice(tokenIn, tokenOut);
          setPrice(ethers.utils.formatUnits(price, 18));
        } catch (err) {
          console.error("Error fetching price:", err);
        }
      };
      fetchPrice();
    }, 10000);

    return () => clearInterval(interval);
  }, [contract, tokenA, tokenB, inputToken]);

  const fetchUserShare = async () => {
    try {
      if (!signer || !address || !contract) return;
      const lpToken = new ethers.Contract(contractAddress, simpleSwapAbi, signer);
      const userBalance = await lpToken.balanceOf(address);
      const totalSupply = await lpToken.totalSupply();
      setTotalSupply(ethers.utils.formatUnits(totalSupply, 18));

      if (totalSupply.isZero()) {
        setUserShare('0');
      } else {
        const share = userBalance.mul(10000).div(totalSupply).toNumber() / 100;
        setUserShare(share.toFixed(2)); // ejemplo: 5.23%
      }
    } catch (err) {
      console.error("Error fetching user share", err);
      toast.error("No se pudo calcular la participación en el pool");
    }
  };

  const fetchReserves = async () => {
    try {
      if (!contract) return;
      const [rawA, rawB] = await contract.getReserves();
      const formattedA = ethers.utils.formatUnits(rawA, 18);
      const formattedB = ethers.utils.formatUnits(rawB, 18);
      setReserves({ reserveA: formattedA, reserveB: formattedB });
    } catch (err) {
      console.error("Error fetching reserves", err);
      toast.error("No se pudo obtener la liquidez del pool");
    }
  };

  const fetchBalances = async (instance, user, a, b) => {
    try {
      if (!window.ethereum || !user) {
        console.error("Faltan datos para obtener balances");
        return;
      }

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

      const tokenAContract = new ethers.Contract(a, erc20Abi, signer);
      const tokenBContract = new ethers.Contract(b, erc20Abi, signer);

      const balA = await tokenAContract.balanceOf(user);
      const balB = await tokenBContract.balanceOf(user);

      setBalanceA(ethers.utils.formatUnits(balA, 18));
      setBalanceB(ethers.utils.formatUnits(balB, 18));
    } catch (err) {
      console.error(err);
      setError('Error fetching balances');
    }
  };

  const fetchLpBalance = async (user) => {
    try {
      const lpTokenContract = new ethers.Contract(contractAddress, erc20Abi, signer);
      const balance = await lpTokenContract.balanceOf(user);
      setLpBalance(ethers.utils.formatUnits(balance, 18));
    } catch (err) {
      console.error("Error fetching LP balance", err);
      toast.error("No se pudo obtener el balance de LP");
    }
  };

  const estimateOutput = async (amount) => {
    try {
      if (!contract || !tokenA || !tokenB || !amount) return;

      const inputTokenAddress = inputToken === 'A' ? tokenA : tokenB;
      const outputTokenAddress = inputToken === 'A' ? tokenB : tokenA;

      const amountIn = ethers.utils.parseUnits(amount, 18);
      const output = await contract.getAmountOut(inputTokenAddress, outputTokenAddress, amountIn);
      setEstimatedOutput(ethers.utils.formatUnits(output, 18));
    } catch (err) {
      console.error("Error estimating output", err);
      setEstimatedOutput(null);
    }
  };


  const fetchHistory = async (instance, user) => {
    try {
      const filter = instance.filters.TokenSwapped(user);
      const events = await instance.queryFilter(filter, -5000);
      const parsed = events.map((e) => ({
        hash: e.transactionHash,
        inputToken: e.args.inputToken,
        outputToken: e.args.outputToken,
        amountIn: ethers.utils.formatUnits(e.args.amountIn, 18),
        amountOut: ethers.utils.formatUnits(e.args.amountOut, 18),
        timestamp: new Date().toLocaleString()
      })).reverse();
      setHistory(parsed);
    } catch (err) {
      console.error(err);
      setError('Error fetching swap history');
    }
  };

  const fetchFullHistory = async () => {
    try {
      if (!contract || !address) return;

      const fromBlock = -5000;
      const filters = {
        swap: contract.filters.TokenSwapped(address),
        add: contract.filters.LiquidityAdded(address),
        remove: contract.filters.LiquidityRemoved(address),
      };

      const [swaps, adds, removes] = await Promise.all([
        contract.queryFilter(filters.swap, fromBlock),
        contract.queryFilter(filters.add, fromBlock),
        contract.queryFilter(filters.remove, fromBlock),
      ]);

      const formatSwap = swaps.map((e) => {
        const args = e.args || {};
        return {
          type: 'Swap',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountIn && args.inputToken && args.amountOut && args.outputToken
            ? `Swap ${ethers.utils.formatUnits(args.amountIn, 18)} ${args.inputToken.slice(0, 6)} → ${ethers.utils.formatUnits(args.amountOut, 18)} ${args.outputToken.slice(0, 6)}`
            : 'Swap (datos incompletos)',
        };
      });

      const formatAdd = adds.map((e) => {
        const args = e.args || {};
        return {
          type: 'AddLiquidity',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountA && args.amountB && args.lpTokens
            ? `Add ${ethers.utils.formatUnits(args.amountA, 18)} A + ${ethers.utils.formatUnits(args.amountB, 18)} B → LP ${ethers.utils.formatUnits(args.lpTokens, 18)}`
            : 'Add Liquidity (datos incompletos)',
        };
      });

      const formatRemove = removes.map((e) => {
        const args = e.args || {};
        return {
          type: 'RemoveLiquidity',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountA && args.amountB && args.lpTokensBurned
            ? `Remove ${ethers.utils.formatUnits(args.amountA, 18)} A + ${ethers.utils.formatUnits(args.amountB, 18)} B ← LP ${ethers.utils.formatUnits(args.lpTokensBurned, 18)}`
            : 'Remove Liquidity (datos incompletos)',
        };
      });

      const full = [...formatSwap, ...formatAdd, ...formatRemove].sort((a, b) => b.hash.localeCompare(a.hash));
      setHistory(full);
    } catch (err) {
      console.error("Error fetching full history", err);
      toast.error("No se pudo obtener el historial completo");
    }
  };

  const getPrice = async () => {
    try {
      if (!contract) return;
      const tokenIn = inputToken === 'A' ? tokenA : tokenB;
      const tokenOut = inputToken === 'A' ? tokenB : tokenA;
      const price = await contract.getPrice(tokenIn, tokenOut);
      setPrice(ethers.utils.formatUnits(price, 18));
    } catch (err) {
      console.error(err);
      setError('Error fetching price');
    }
  };

  const swap = async () => {
    try {
      if (!contract || !inputAmount || !signer) return;
      setLoading(true);
      const amountIn = ethers.utils.parseUnits(inputAmount, 18);
      const amountOutMin = 0;
      const path = inputToken === 'A' ? [tokenA, tokenB] : [tokenB, tokenA];
      const to = address;
      const deadline = Math.floor(Date.now() / 1000) + 60;

      const tokenInContract = new ethers.Contract(path[0], erc20Abi, signer);
      const currentAllowance = await tokenInContract.allowance(address, contractAddress);
      if (currentAllowance.lt(amountIn)) {
        const approveTx = await tokenInContract.approve(contractAddress, amountIn);
        await approveTx.wait();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed.toString();
        toast.info(`✅ Operación confirmada (gas usado: ${gasUsed})`);
      }

      const tx = await contract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline,
        {
          gasLimit: 300000,
        }
      );

      await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.info(`✅ Operación confirmada (gas usado: ${gasUsed})`);
      await fetchBalances(contract, address, tokenA, tokenB);
      await fetchHistory(contract, address);
      await fetchUserShare();
    } catch (err) {
      console.error(err);
      setError('Swap failed: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!contract || !signer || !tokenA || !tokenB || !address) return;

    try {
      setLoading(true);

      const parsedAmountA = ethers.utils.parseUnits(liquidityInputs.amountADesired || "0", 18);
      const parsedAmountB = ethers.utils.parseUnits(liquidityInputs.amountBDesired || "0", 18);
      const minAmountA = parsedAmountA.mul(90).div(100);
      const minAmountB = parsedAmountB.mul(90).div(100);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const userBalanceA = ethers.utils.parseUnits(balanceA || "0", 18);
      const userBalanceB = ethers.utils.parseUnits(balanceB || "0", 18);

      if (parsedAmountA.gt(userBalanceA)) {
        toast.error("No tenés suficiente balance de Token A.");
        return;
      }

      if (parsedAmountB.gt(userBalanceB)) {
        toast.error("No tenés suficiente balance de Token B.");
        return;
      }

      await ensureApproval({ tokenAddress: tokenA, spender: contract.address, amount: parsedAmountA, signer, userAddress: address });
      await ensureApproval({ tokenAddress: tokenB, spender: contract.address, amount: parsedAmountB, signer, userAddress: address });

      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        parsedAmountA,
        parsedAmountB,
        minAmountA,
        minAmountB,
        address,
        deadline
      );

      await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.info(`✅ Operación confirmada (gas usado: ${gasUsed})`);
      if (!address || !signer) {
        setError("Signer o dirección no definidos");
      } else {
        await fetchBalances(contract, address, tokenA, tokenB);
      }
      await fetchUserShare();
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.reason || err.message || "Falló agregar liquidez"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    try {
      if (!contract || !tokenA || !tokenB) return;
      const liquidity = ethers.utils.parseUnits(liquidityInputs.lpToRemove, 18);
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const amountToRemove = ethers.utils.parseUnits(liquidityToRemove, 18);
      const userLpBalance = ethers.utils.parseUnits(lpBalance || "0", 18);

      if (amountToRemove.gt(userLpBalance)) {
        toast.error("No tenés suficiente LP para remover esa cantidad.");
        return;
      }

      const tx = await contract.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        0, 0,
        address,
        deadline
      );

      await tx.wait();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.info(`✅ Operación confirmada (gas usado: ${gasUsed})`);
      await fetchBalances(contract, address, tokenA, tokenB);
      await fetchUserShare();
    } catch (err) {
      console.error(err);
      setError("Failed to remove liquidity: " + (err.reason || err.message));
    }
  };

  const toggleToken = () => {
    setInputToken(prev => (prev === 'A' ? 'B' : 'A'));
  };

  const hasInsufficientBalance = () => {
    const inputValue = parseFloat(inputAmount || '0');
    if (inputToken === 'A') return inputValue > parseFloat(balanceA || '0');
    if (inputToken === 'B') return inputValue > parseFloat(balanceB || '0');
    return false;
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md space-y-6">
      <ConnectButton />
      {address && (
        <div className="my-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
          <p className="text-sm">📊 <strong>Resumen</strong></p>
          <ul className="text-sm space-y-1">
            <li>🧮 Swaps realizados: <strong>{history.length}</strong></li>
            <li>💧 Liquidez: <strong>{reserves.reserveA}</strong> A / <strong>{reserves.reserveB}</strong> B</li>
            <li>🪙 Tus tokens LP: <strong>{lpBalance}</strong></li>
            <li>📈 Participación: <strong>{userShare}%</strong></li>
            <li>🔄 LP Total: <strong>{totalSupply}</strong></li>
          </ul>
        </div>
      )}
      {address && <p className="text-sm text-gray-600">Connected: {address}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-2">
        <p className="text-gray-700">Token A Balance: {balanceA}</p>
        <p className="text-gray-700">Token B Balance: {balanceB}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h4 className="text-md font-semibold mb-2">Liquidez del Pool</h4>
        {userShare !== null && (
          <div className="text-sm text-gray-700 mt-2">
            Tu participación en el pool: <strong>{userShare}%</strong>
          </div>
        )}
        <p className="text-sm">Token A: {reserves.reserveA}</p>
        <p className="text-sm">Token B: {reserves.reserveB}</p>
      </div>

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
          Estimado a recibir: <strong>{estimatedOutput} {inputToken === 'A' ? 'B' : 'A'}</strong>
        </p>
      )}
      {inputAmount && hasInsufficientBalance() && (
        <p className="text-sm text-red-600">
          Saldo insuficiente para Token {inputToken}
        </p>
      )}

      <button
        onClick={swap}
        disabled={loading || !isConnected || hasInsufficientBalance()}
        className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Swapping...' : `Swap ${inputToken} → ${inputToken === 'A' ? 'B' : 'A'}`}
      </button>

      <div className="text-center">
        <button
          onClick={getPrice}
          className="text-blue-600 underline"
        >
          Get Price ({inputToken} in {inputToken === 'A' ? 'B' : 'A'})
        </button>
        {price && <p className="text-sm text-gray-700">Price: {price}</p>}
      </div>

      <hr className="my-4" />
      <h3 className="text-lg font-semibold">Liquidity Actions</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600">Amount A (desired)</label>
          <input
            type="number"
            value={liquidityInputs.amountADesired}
            onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountADesired: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          {parseFloat(liquidityInputs.amountADesired || '0') > parseFloat(balanceA || '0') && (
            <p className="text-sm text-red-600">Saldo insuficiente de Token A</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-600">Amount B (desired)</label>
          <input
            type="number"
            value={liquidityInputs.amountBDesired}
            onChange={(e) => setLiquidityInputs({ ...liquidityInputs, amountBDesired: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          {parseFloat(liquidityInputs.amountBDesired || '0') > parseFloat(balanceB || '0') && (
            <p className="text-sm text-red-600">Saldo insuficiente de Token B</p>
          )}
        </div>
        <button
          onClick={handleAddLiquidity}
          disabled={
            loading ||
            !isConnected ||
            parseFloat(liquidityInputs.amountADesired || '0') > parseFloat(balanceA || '0') ||
            parseFloat(liquidityInputs.amountBDesired || '0') > parseFloat(balanceB || '0')
          }
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Agregando...' : 'Agregar Liquidez'}
        </button>
      </div>

      <div className="mt-6 space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Remover Liquidez</h3>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Cantidad de Liquidez a remover</label>
          <input
            type="text"
            placeholder="Ej: 10"
            value={liquidityToRemove}
            onChange={(e) => setLiquidityToRemove(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <p className="text-sm text-gray-600">
            Balance actual de LP: <strong>{lpBalance}</strong>
          </p>
        </div>

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
          {loading ? 'Removiendo...' : 'Remover Liquidez'}
        </button>
      </div>

      <hr className="my-4" />
      <h3 className="text-lg font-semibold">Recent Swaps</h3>
      {history.length === 0 && <p className="text-gray-500">No swaps found</p>}
      <div className="text-center mt-4">
        <button
          onClick={fetchFullHistory}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Show all history
        </button>
      </div>

      <ul className="space-y-2 mt-4">
        {history.map((h, idx) => (
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
        ))}
      </ul>
    </div>
  );
}

export default SwapInterface;
