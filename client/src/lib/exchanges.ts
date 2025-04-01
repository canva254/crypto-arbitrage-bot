import { ExchangeTicker } from './types';

// List of supported exchanges
export const SUPPORTED_EXCHANGES = [
  // Centralized Exchanges (CEX)
  { id: 'binance', name: 'Binance', logo: 'binance', type: 'cex' },
  { id: 'coinbase', name: 'Coinbase', logo: 'coinbase', type: 'cex' },
  { id: 'kraken', name: 'Kraken', logo: 'kraken', type: 'cex' },
  { id: 'kucoin', name: 'Kucoin', logo: 'kucoin', type: 'cex' },
  { id: 'bitfinex', name: 'Bitfinex', logo: 'bitfinex', type: 'cex' },
  
  // Decentralized Exchanges (DEX)
  { id: 'uniswap', name: 'Uniswap', logo: 'uniswap', type: 'dex' },
  { id: 'sushiswap', name: 'SushiSwap', logo: 'sushiswap', type: 'dex' },
  { id: 'pancakeswap', name: 'PancakeSwap', logo: 'pancakeswap', type: 'dex' },
  { id: 'curve', name: 'Curve', logo: 'curve', type: 'dex' },
  { id: 'dydx', name: 'dYdX', logo: 'dydx', type: 'dex' },
];

// List of common trading pairs
export const COMMON_PAIRS = [
  // Common stablecoin pairs
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'ADA/USDT',
  'LINK/USDT',
  'DOT/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
  
  // DEX-specific pairs
  'ETH/USDC',
  'WBTC/ETH',
  'ETH/DAI',
  'LINK/ETH',
  'UNI/ETH',
  'SUSHI/ETH',
  'AAVE/ETH',
  'COMP/ETH',
  'CAKE/BNB',
  'MATIC/ETH',
];

// Typical trading fees by exchange (percentage)
export const EXCHANGE_FEES = {
  // CEX Fees
  binance: 0.1,
  coinbase: 0.5,
  kraken: 0.26,
  kucoin: 0.1,
  bitfinex: 0.1,
  
  // DEX Fees
  uniswap: 0.3,
  sushiswap: 0.3,
  pancakeswap: 0.25,
  curve: 0.04,
  dydx: 0.05,
};

// Map of pairs to their basic risk levels
export const PAIR_RISK_LEVELS = {
  // CEX pairs risk levels
  'BTC/USDT': 'low',
  'ETH/USDT': 'low',
  'SOL/USDT': 'medium',
  'ADA/USDT': 'medium',
  'LINK/USDT': 'medium',
  'DOT/USDT': 'medium',
  'BNB/USDT': 'low',
  'XRP/USDT': 'medium',
  'DOGE/USDT': 'high',
  'AVAX/USDT': 'medium',
  
  // DEX pairs risk levels
  'ETH/USDC': 'low',
  'WBTC/ETH': 'medium',
  'ETH/DAI': 'low',
  'LINK/ETH': 'medium',
  'UNI/ETH': 'medium',
  'SUSHI/ETH': 'high',
  'AAVE/ETH': 'medium',
  'COMP/ETH': 'high',
  'CAKE/BNB': 'medium',
  'MATIC/ETH': 'medium',
};

// Risk factors descriptions
export const RISK_FACTORS = {
  low: [
    'High liquidity on both exchanges',
    'Stable spread for last 30 minutes',
    'Low transaction confirmation time',
    'Low gas fees for DEX transactions',
    'High trading volume in both directions',
  ],
  medium: [
    'Moderate liquidity on exchanges',
    'Some fluctuation in price spread',
    'Average transaction confirmation time',
    'Moderate gas fees for DEX transactions',
    'Some price impact on larger orders',
  ],
  high: [
    'Low liquidity on one or both exchanges',
    'Rapidly changing price spread',
    'Long transaction confirmation time',
    'High gas fees for DEX transactions',
    'Significant price impact on larger orders',
    'Cross-chain bridge required',
  ],
};

// Network specific considerations
export const NETWORK_FACTORS = {
  ethereum: {
    gasPrice: 'high',
    confirmation: 'medium',
    security: 'high',
    exchanges: ['uniswap', 'sushiswap', 'curve', 'dydx']
  },
  binance: {
    gasPrice: 'low',
    confirmation: 'fast',
    security: 'medium',
    exchanges: ['pancakeswap']
  },
  solana: {
    gasPrice: 'very low',
    confirmation: 'very fast',
    security: 'medium',
    exchanges: []
  },
  polygon: {
    gasPrice: 'very low',
    confirmation: 'fast',
    security: 'medium',
    exchanges: []
  }
};

// Network transfer times (in minutes) by cryptocurrency
export const NETWORK_TRANSFER_TIMES = {
  // Base cryptocurrencies
  BTC: 30,
  ETH: 10,
  SOL: 1,
  ADA: 5,
  LINK: 10,
  DOT: 8,
  BNB: 3,
  XRP: 2,
  DOGE: 8,
  AVAX: 4,
  
  // DEX specific tokens
  WBTC: 10, // Wrapped BTC follows ETH transfer times
  UNI: 10,  // Uniswap token (ETH network)
  SUSHI: 10, // SushiSwap token (ETH network)
  AAVE: 10,  // Aave token (ETH network)
  COMP: 10,  // Compound token (ETH network)
  CAKE: 3,   // PancakeSwap token (BNB network)
  MATIC: 1,  // Polygon token
  
  // Stablecoins
  USDT: 10,  // On ETH network
  USDC: 10,  // On ETH network
  DAI: 10,   // On ETH network
};
