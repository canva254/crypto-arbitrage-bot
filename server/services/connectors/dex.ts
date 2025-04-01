/**
 * Decentralized Exchange Connector
 * 
 * This module provides an interface for interacting with decentralized exchanges
 * across multiple blockchain networks (Ethereum, BSC, Polygon, etc.).
 */

import { ethers } from 'ethers';
import { getPrivateKey, getProviderUrl } from '../../config/secrets';
import { NetworkEnum, ExchangeStatusEnum } from '@shared/schema';

// DEX Factory and Router ABIs (simplified)
const UniswapV2FactoryABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)'
];

const UniswapV2RouterABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

const UniswapV2PairABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function price0CumulativeLast() external view returns (uint)',
  'function price1CumulativeLast() external view returns (uint)'
];

const ERC20ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint amount) returns (bool)'
];

// DEX Configuration
interface DexConfig {
  name: string;
  network: string;
  factoryAddress: string;
  routerAddress: string;
  wethAddress: string;  // Wrapped native token (WETH, WBNB, etc.)
}

// Price data from a DEX
interface DexPrice {
  exchange: string;
  network: string;
  pair: string;
  token0: string;
  token1: string;
  price: number;      // Price of token0 in terms of token1
  liquidityUSD: number;
  fee: number;        // Trading fee (e.g., 0.003 for 0.3%)
}

// Map of DEX configurations
const dexConfigs: Record<string, DexConfig> = {
  'Uniswap': {
    name: 'Uniswap',
    network: NetworkEnum.ETHEREUM,
    factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Uniswap V2 Factory
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH
  },
  'SushiSwap': {
    name: 'SushiSwap',
    network: NetworkEnum.ETHEREUM,
    factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', // SushiSwap Factory
    routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap Router
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH
  },
  'PancakeSwap': {
    name: 'PancakeSwap',
    network: NetworkEnum.BSC,
    factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // PancakeSwap Factory V2
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap Router V2
    wethAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'  // WBNB
  },
  'QuickSwap': {
    name: 'QuickSwap',
    network: NetworkEnum.POLYGON,
    factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32', // QuickSwap Factory
    routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap Router
    wethAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'  // WMATIC
  }
};

// Cache of provider instances to avoid recreating them
const providerCache: Record<string, ethers.Provider> = {};
const walletCache: Record<string, ethers.Wallet> = {};

/**
 * Get a blockchain provider for a specific network
 */
export async function getProvider(network: string): Promise<ethers.Provider | null> {
  // Return cached provider if available
  if (providerCache[network]) {
    return providerCache[network];
  }
  
  // Get blockchain provider URL
  const providerUrl = getProviderUrl(network);
  if (!providerUrl) {
    console.error(`No RPC provider URL configured for ${network}`);
    return null;
  }
  
  try {
    // Create and cache provider
    const provider = new ethers.JsonRpcProvider(providerUrl);
    providerCache[network] = provider;
    return provider;
  } catch (error) {
    console.error(`Error creating provider for ${network}:`, error);
    return null;
  }
}

/**
 * Get a signer (wallet) for interacting with blockchain
 */
export async function getSigner(network: string): Promise<ethers.Wallet | null> {
  // Return cached wallet if available
  if (walletCache[network]) {
    return walletCache[network];
  }
  
  const provider = await getProvider(network);
  if (!provider) {
    return null;
  }
  
  // Get private key
  const privateKey = getPrivateKey(network);
  if (!privateKey) {
    console.error(`No private key configured for ${network}`);
    return null;
  }
  
  try {
    // Create wallet with private key
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Cache wallet
    walletCache[network] = wallet;
    return wallet;
  } catch (error) {
    console.error(`Error creating wallet for ${network}:`, error);
    return null;
  }
}

/**
 * Get price data for a token pair on a DEX
 */
export async function getDexPrice(
  dexName: string, 
  tokenA: string, 
  tokenB: string
): Promise<DexPrice | null> {
  const dexConfig = dexConfigs[dexName];
  if (!dexConfig) {
    console.error(`Unsupported DEX: ${dexName}`);
    return null;
  }
  
  const provider = await getProvider(dexConfig.network);
  if (!provider) {
    return null;
  }
  
  try {
    // Connect to factory contract
    const factory = new ethers.Contract(
      dexConfig.factoryAddress, 
      UniswapV2FactoryABI, 
      provider
    );
    
    // Get pair address
    const pairAddress = await factory.getPair(tokenA, tokenB);
    if (pairAddress === ethers.constants.AddressZero) {
      console.log(`No liquidity pair exists for ${tokenA}/${tokenB} on ${dexName}`);
      return null;
    }
    
    // Connect to pair contract
    const pair = new ethers.Contract(
      pairAddress, 
      UniswapV2PairABI, 
      provider
    );
    
    // Get tokens and reserves
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const [reserve0, reserve1] = await pair.getReserves();
    
    // Calculate price (reserve1/reserve0)
    const price = reserve1.mul(ethers.BigNumber.from(10).pow(18)).div(reserve0).toNumber() / 1e18;
    
    // Get token contracts for additional info
    const token0Contract = new ethers.Contract(token0, ERC20ABI, provider);
    const token1Contract = new ethers.Contract(token1, ERC20ABI, provider);
    
    // Get token symbols
    const token0Symbol = await token0Contract.symbol();
    const token1Symbol = await token1Contract.symbol();
    
    // Calculate liquidity in USD (simplified)
    // This is a placeholder - in a real app you would use price oracles
    const tokenPriceInUSD = 1000; // Placeholder price in USD
    const liquidityUSD = (
      reserve0.mul(ethers.BigNumber.from(tokenPriceInUSD)).div(ethers.BigNumber.from(10).pow(18)).toNumber()
    );
    
    // Return formatted price data
    return {
      exchange: dexName,
      network: dexConfig.network,
      pair: `${token0Symbol}/${token1Symbol}`,
      token0: token0,
      token1: token1,
      price,
      liquidityUSD,
      fee: dexName === 'Uniswap' ? 0.003 : 0.0025 // Default fees (adjust as needed)
    };
  } catch (error) {
    console.error(`Error getting price from ${dexName} for ${tokenA}/${tokenB}:`, error);
    return null;
  }
}

/**
 * Get status of a DEX
 */
export async function getDexStatus(dexName: string): Promise<string> {
  const dexConfig = dexConfigs[dexName];
  if (!dexConfig) {
    console.error(`Unsupported DEX: ${dexName}`);
    return ExchangeStatusEnum.OFFLINE;
  }
  
  const provider = await getProvider(dexConfig.network);
  if (!provider) {
    return ExchangeStatusEnum.OFFLINE;
  }
  
  try {
    // Check if the factory contract is accessible
    const factory = new ethers.Contract(
      dexConfig.factoryAddress, 
      UniswapV2FactoryABI, 
      provider
    );
    
    // Try to call a view function
    await factory.allPairsLength();
    
    // Check gas prices to determine if network is congested
    const gasPrice = await provider.getGasPrice();
    const gasPriceInGwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
    
    // Check if gas price is high
    const highGasThresholds: Record<string, number> = {
      [NetworkEnum.ETHEREUM]: 100, // 100 gwei
      [NetworkEnum.BSC]: 10,      // 10 gwei
      [NetworkEnum.POLYGON]: 300, // 300 gwei
    };
    
    const threshold = highGasThresholds[dexConfig.network] || 100;
    if (gasPriceInGwei > threshold) {
      return ExchangeStatusEnum.HIGH_GAS;
    }
    
    return ExchangeStatusEnum.ONLINE;
  } catch (error) {
    console.error(`Error checking status of ${dexName}:`, error);
    return ExchangeStatusEnum.ERROR;
  }
}

/**
 * Swap tokens on a DEX (execute a trade)
 */
export async function swapTokens(
  dexName: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  slippage: number = 0.5 // Slippage tolerance in percentage
): Promise<string | null> {
  const dexConfig = dexConfigs[dexName];
  if (!dexConfig) {
    console.error(`Unsupported DEX: ${dexName}`);
    return null;
  }
  
  // Get signer (wallet with funds)
  const signer = await getSigner(dexConfig.network);
  if (!signer) {
    console.error(`No wallet available for ${dexConfig.network}`);
    return null;
  }
  
  try {
    // Connect to router contract with signer
    const router = new ethers.Contract(
      dexConfig.routerAddress,
      UniswapV2RouterABI,
      signer
    );
    
    // Connect to token contracts
    const tokenInContract = new ethers.Contract(tokenIn, ERC20ABI, signer);
    
    // Check if input is native token (ETH/BNB/MATIC)
    const isNativeToken = tokenIn.toLowerCase() === dexConfig.wethAddress.toLowerCase();
    
    // Check and approve allowance if not native token
    if (!isNativeToken) {
      const walletAddress = await signer.getAddress();
      const allowance = await tokenInContract.allowance(walletAddress, dexConfig.routerAddress);
      const amountInWei = ethers.utils.parseUnits(amountIn, 18); // Assuming 18 decimals
      
      if (allowance.lt(amountInWei)) {
        console.log(`Approving ${dexName} router to spend ${amountIn} tokens...`);
        const approveTx = await tokenInContract.approve(
          dexConfig.routerAddress,
          ethers.constants.MaxUint256 // Infinite approval
        );
        await approveTx.wait();
        console.log('Approval confirmed');
      }
    }
    
    // Get price quote
    const path = [tokenIn, tokenOut];
    const amountInWei = ethers.utils.parseUnits(amountIn, 18); // Assuming 18 decimals
    const amounts = await router.getAmountsOut(amountInWei, path);
    const expectedAmountOut = amounts[1];
    
    // Calculate minimum amount out with slippage tolerance
    const slippageFactor = 1000 - (slippage * 10); // 0.5% slippage = 995/1000
    const minAmountOut = expectedAmountOut.mul(slippageFactor).div(1000);
    
    console.log(`Swapping ${amountIn} tokens on ${dexName}...`);
    console.log(`Expected output: ${ethers.utils.formatUnits(expectedAmountOut, 18)}`);
    console.log(`Minimum output with slippage: ${ethers.utils.formatUnits(minAmountOut, 18)}`);
    
    // Execute the swap
    let tx;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const walletAddress = await signer.getAddress();
    
    if (isNativeToken) {
      // Swap ETH/BNB/MATIC for tokens
      tx = await router.swapExactETHForTokens(
        minAmountOut,
        path,
        walletAddress,
        deadline,
        { value: amountInWei }
      );
    } else if (tokenOut.toLowerCase() === dexConfig.wethAddress.toLowerCase()) {
      // Swap tokens for ETH/BNB/MATIC
      tx = await router.swapExactTokensForETH(
        amountInWei,
        minAmountOut,
        path,
        walletAddress,
        deadline
      );
    } else {
      // Swap tokens for tokens
      tx = await router.swapExactTokensForTokens(
        amountInWei,
        minAmountOut,
        path,
        walletAddress,
        deadline
      );
    }
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Swap complete. Transaction: ${receipt.transactionHash}`);
    
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error swapping tokens on ${dexName}:`, error);
    return null;
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  network: string,
  tokenAddress: string,
  walletAddress?: string
): Promise<string | null> {
  const provider = await getProvider(network);
  if (!provider) {
    return null;
  }
  
  // Get wallet address if not provided
  if (!walletAddress) {
    // Get from signer
    const signer = await getSigner(network);
    if (signer) {
      walletAddress = await signer.getAddress();
    } else {
      console.error(`No wallet address available for ${network}`);
      return null;
    }
  }
  
  try {
    // Check if token is native currency (ETH, BNB, MATIC, etc.)
    if (tokenAddress.toLowerCase() === 'native') {
      const balance = await provider.getBalance(walletAddress);
      return ethers.utils.formatEther(balance);
    }
    
    // For ERC20 tokens
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const decimals = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(walletAddress);
    
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Error getting token balance on ${network}:`, error);
    return null;
  }
}

/**
 * Get list of supported DEXes
 */
export function getSupportedDexes(): string[] {
  return Object.keys(dexConfigs);
}

/**
 * Get DEX configuration by name
 */
export function getDexConfig(dexName: string): DexConfig | null {
  return dexConfigs[dexName] || null;
}