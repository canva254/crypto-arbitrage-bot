import { ExchangeTicker } from './types';

// List of supported exchanges
export const SUPPORTED_EXCHANGES = [
  { id: 'binance', name: 'Binance', logo: 'binance' },
  { id: 'coinbase', name: 'Coinbase', logo: 'coinbase' },
  { id: 'kraken', name: 'Kraken', logo: 'kraken' },
  { id: 'kucoin', name: 'Kucoin', logo: 'kucoin' },
  { id: 'ftx', name: 'FTX', logo: 'ftx' },
];

// List of common trading pairs
export const COMMON_PAIRS = [
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
];

// Typical trading fees by exchange (percentage)
export const EXCHANGE_FEES = {
  binance: 0.1,
  coinbase: 0.5,
  kraken: 0.26,
  kucoin: 0.1,
  ftx: 0.07,
};

// Map of pairs to their basic risk levels
export const PAIR_RISK_LEVELS = {
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
};

// Risk factors descriptions
export const RISK_FACTORS = {
  low: [
    'High liquidity on both exchanges',
    'Stable spread for last 30 minutes',
    'Low transaction confirmation time',
  ],
  medium: [
    'Moderate liquidity on exchanges',
    'Some fluctuation in price spread',
    'Average transaction confirmation time',
  ],
  high: [
    'Low liquidity on one or both exchanges',
    'Rapidly changing price spread',
    'Long transaction confirmation time',
  ],
};

// Network transfer times (in minutes) by cryptocurrency
export const NETWORK_TRANSFER_TIMES = {
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
};
