import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from "react-toastify";
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SwapTab from './tabs/SwapTab';
import AddLiquidityTab from './tabs/AddLiquidityTab';
import RemoveLiquidityTab from './tabs/RemoveLiquidityTab';
import HistoryTab from './tabs/HistoryTab';
import DashboardTab from './tabs/DashboardTab';
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
  const provider = useMemo(() => {
    if (!walletClient) return null;
    return new ethers.providers.Web3Provider(window.ethereum);
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingFullHistory, setLoadingFullHistory] = useState(false);

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
        await fetchUserShare(instance);
        await fetchReserves(instance);
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

  const fetchUserShare = async (instanceOverride, addressOverride) => {
    try {
      const inst = instanceOverride || contract;
      if (!signer || !address || !inst) return;
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
      toast.error("Pool participation could not be calculated");
    }
  };

  const fetchReserves = async (instanceOverride) => {
    try {
      const inst = instanceOverride || contract;
      if (!inst) return;
      const [rawA, rawB] = await inst.getReserves();
      const formattedA = ethers.utils.formatUnits(rawA, 18);
      const formattedB = ethers.utils.formatUnits(rawB, 18);
      setReserves({ reserveA: formattedA, reserveB: formattedB });
    } catch (err) {
      console.error("Error fetching reserves", err);
      toast.error("Liquidity could not be obtained from the pool");
    }
  };

  const fetchBalances = async (instance, user, a, b) => {
    try {
      if (!window.ethereum || !user) {
        console.error("Lack of data to obtain balances");
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
      toast.error("Could not get LP balance");
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

  const fetchFullHistory = async (instanceOverride, addressOverride) => {
    setLoadingFullHistory(true);
    
    try {
      const currentInstance = contract || instanceOverride;
      const currentAddress = address || addressOverride;
      if (!currentInstance || !currentAddress || !provider) return;

      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - 10000, 0); // last 10k blocks

      const filters = {
        swap: currentInstance.filters.TokenSwapped(currentAddress),
        add: currentInstance.filters.LiquidityAdded(currentAddress),
        remove: currentInstance.filters.LiquidityRemoved(currentAddress),
      };

      const [swaps, adds, removes] = await Promise.all([
        currentInstance.queryFilter(filters.swap, fromBlock, latestBlock),
        currentInstance.queryFilter(filters.add, fromBlock, latestBlock),
        currentInstance.queryFilter(filters.remove, fromBlock, latestBlock),
      ]);

      const formatSwap = swaps.map((e) => {
        const args = e.args || {};
        return {
          type: 'Swap',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountIn && args.inputToken && args.amountOut && args.outputToken
            ? `Swap ${ethers.utils.formatUnits(args.amountIn, 18)} ${args.inputToken.slice(0, 6)} → ${ethers.utils.formatUnits(args.amountOut, 18)} ${args.outputToken.slice(0, 6)}`
            : 'Swap (incomplete data)',
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
        };
      });

      const formatAdd = adds.map((e) => {
        const args = e.args || {};
        return {
          type: 'AddLiquidity',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountA && args.amountB && args.liquidity
            ? `Add ${ethers.utils.formatUnits(args.amountA, 18)} A + ${ethers.utils.formatUnits(args.amountB, 18)} B → LP ${ethers.utils.formatUnits(args.liquidity, 18)}`
            : 'Add Liquidity (incomplete data)',
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
        };
      });

      const formatRemove = removes.map((e) => {
        const args = e.args || {};
        return {
          type: 'RemoveLiquidity',
          hash: e.transactionHash,
          time: new Date().toLocaleString(),
          detail: args.amountA && args.amountB && args.liquidity
            ? `Remove ${ethers.utils.formatUnits(args.amountA, 18)} A + ${ethers.utils.formatUnits(args.amountB, 18)} B ← LP ${ethers.utils.formatUnits(args.liquidity, 18)}`
            : 'Remove Liquidity (incomplete data)',
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
        };
      });

      const full = [...formatSwap, ...formatAdd, ...formatRemove].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return b.blockNumber - a.blockNumber;
        }
        return b.logIndex - a.logIndex;
      });

      setHistory(full);
    } catch (err) {
      console.error("Error fetching full history", err);
      toast.error("The full history could not be obtained");
    } finally {
      setLoadingFullHistory(false);
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
        const receipt = await approveTx.wait();
        const gasUsed = receipt.gasUsed.toString();
        toast.info(`✅ Token approved (gas used: ${gasUsed})`);
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

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.info(`✅ Operation confirmed (gas used: ${gasUsed})`);
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

      const amountADesired = ethers.utils.parseUnits(liquidityInputs.amountADesired || "0", 18);
      const amountBDesired = ethers.utils.parseUnits(liquidityInputs.amountBDesired || "0", 18);

      const userBalanceA = ethers.utils.parseUnits(balanceA || "0", 18);
      const userBalanceB = ethers.utils.parseUnits(balanceB || "0", 18);

      if (amountADesired.gt(userBalanceA)) {
        toast.error("You don't have enough Token A balance.");
        return;
      }

      if (amountBDesired.gt(userBalanceB)) {
        toast.error("You don't have enough Token B balance.");
        return;
      }

      const [reserveARaw, reserveBRaw] = await contract.getReserves();
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      const slippageTolerance = 0.01; // 1%

      let amountA = amountADesired;
      let amountB = amountBDesired;
      let amountAMin, amountBMin;

      if (reserveARaw.eq(0) && reserveBRaw.eq(0)) {
        // First liquidity provider
        amountAMin = amountA.mul(100 - slippageTolerance * 100).div(100);
        amountBMin = amountB.mul(100 - slippageTolerance * 100).div(100);
      } else {
        const amountBOptimal = amountA.mul(reserveBRaw).div(reserveARaw);
        if (amountBOptimal.lte(amountB)) {
          amountB = amountBOptimal;
          amountAMin = amountA.mul(100 - slippageTolerance * 100).div(100);
          amountBMin = amountB.mul(100 - slippageTolerance * 100).div(100);
        } else {
          const amountAOptimal = amountB.mul(reserveARaw).div(reserveBRaw);
          amountA = amountAOptimal;
          amountAMin = amountA.mul(100 - slippageTolerance * 100).div(100);
          amountBMin = amountB.mul(100 - slippageTolerance * 100).div(100);
        }
      }

      // Approvals
      await ensureApproval({ tokenAddress: tokenA, spender: contract.address, amount: amountA, signer, userAddress: address });
      await ensureApproval({ tokenAddress: tokenB, spender: contract.address, amount: amountB, signer, userAddress: address });

      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        amountA,
        amountB,
        amountAMin,
        amountBMin,
        address,
        deadline
      );

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toString();
      toast.info(`✅ Operation confirmed (gas used: ${gasUsed})`);

      await fetchBalances(contract, address, tokenA, tokenB);
      await fetchUserShare();
      await fetchLpBalance(address);
      await fetchReserves();
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.reason || err.message || "Failed to add liquidity"}`);
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
        toast.error("You don't have enough LP to remove that amount.");
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
      toast.info(`✅ Operation confirmed (gas used: ${gasUsed})`);
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

  const renderTab = () => {
    switch (activeTab) {
      case 'swap':
        return <SwapTab
          inputToken={inputToken}
          inputAmount={inputAmount}
          setInputAmount={setInputAmount}
          estimateOutput={estimateOutput}
          toggleToken={toggleToken}
          estimatedOutput={estimatedOutput}
          hasInsufficientBalance={hasInsufficientBalance}
          loading={loading}
          isConnected={isConnected}
          swap={swap}
          price={price}
          getPrice={getPrice}
        />;
      case 'add':
        return <AddLiquidityTab
          balanceA={reserves.reserveA}
          balanceB={reserves.reserveB}
          liquidityInputs={liquidityInputs}
          setLiquidityInputs={setLiquidityInputs}
          handleAddLiquidity={handleAddLiquidity}
          loading={loading}
          isConnected={isConnected}
        />;
      case 'remove':
        return <RemoveLiquidityTab
          lpBalance={lpBalance}
          liquidityToRemove={liquidityToRemove}
          setLiquidityToRemove={setLiquidityToRemove}
          handleRemoveLiquidity={handleRemoveLiquidity}
          loading={loading}
          isConnected={isConnected}
        />;
      case 'history':
        return <HistoryTab
          history={history}
          fetchFullHistory={fetchFullHistory}
          loadingFullHistory={loadingFullHistory}
        />;
      default:
        return <DashboardTab
          address={address}
          history={history}
          reserves={reserves}
          lpBalance={lpBalance}
          userShare={userShare}
          totalSupply={totalSupply}
        />;
    }
  };

    //<div className="max-w-xl mx-auto p-6 rounded-xl shadow-md bg-white">
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
      <ConnectButton />

      <div className="flex justify-around mt-4 border-b">
        <button
          className={`py-2 px-4 ${activeTab === 'summary' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'swap' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          onClick={() => setActiveTab('swap')}
        >
          Swap
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'add' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Liquidity
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'remove' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          onClick={() => setActiveTab('remove')}
        >
          Remove Liquidity
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="mt-6">
        {renderTab()}
      </div>
    </div>
  );
}

export default SwapInterface;
