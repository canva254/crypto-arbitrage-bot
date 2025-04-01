export interface ExchangeTicker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
  exchange: string;
}

export interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitPercentage: number;
  route: string;
  strategy: 'simple' | 'triangular' | 'cross-dex' | 'flash-loan';
  volume: number;
  timestamp: number;
  risk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  buyExchangeType: 'cex' | 'dex';
  sellExchangeType: 'cex' | 'dex';
  buyNetwork?: string;
  sellNetwork?: string;
  estimatedGasCost?: number;
  estimatedCompletionTime?: number;
  crossChainBridge?: string;
}

export interface HistoricalPriceData {
  timestamp: number;
  price: number;
  exchange: string;
  symbol: string;
}

export interface ExchangeStatus {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'rate_limited' | 'error' | 'high_gas' | 'congested';
  lastChecked: string;
  type: 'cex' | 'dex';
  network?: string;
  gasPrice?: number;
  currentLiquidity?: number;
  tvl?: number; // Total Value Locked (for DEXes)
}

export interface ArbitrageStats {
  period: string; // '24h', '7d', '30d'
  totalOpportunities: number;
  averageProfit: number;
  maxProfit: number;
  successRate: number;
  timestamp: string;
  
  // DEX-specific metrics
  cexToDexOpportunities?: number;
  dexToCexOpportunities?: number;
  dexToDexOpportunities?: number;
  crossNetworkOpportunities?: number;
  averageGasCost?: number;
  averageCompletionTime?: number;
  
  // Strategy breakdown
  simpleArbitrageCount?: number;
  triangularArbitrageCount?: number;
  crossDexArbitrageCount?: number;
  flashLoanArbitrageCount?: number;
}

export interface ProfitHistoryData {
  timestamps: string[];
  profits: number[];
  pair: string;
}

export interface PriceComparisonData {
  timestamps: string[];
  exchanges: {
    name: string;
    prices: number[];
  }[];
  pair: string;
}

// DEX-specific interfaces
export interface LiquidityPool {
  exchange: string;
  network: string;
  pair: string;
  liquidityUSD: number;
  token0Amount: number;
  token1Amount: number;
  token0Symbol: string;
  token1Symbol: string;
  apy?: number;
  fee: number;
  timestamp: number;
}

export interface GasPrice {
  network: string;
  fast: number;
  average: number;
  slow: number;
  unit: 'gwei' | 'wei' | 'satoshi';
  timestamp: number;
}

export interface CrossChainBridge {
  name: string;
  sourceNetwork: string;
  destinationNetwork: string;
  supportedTokens: string[];
  fee: number;
  estimatedTime: number; // in minutes
  minimumAmount: number;
  maximumAmount?: number;
  status: 'active' | 'congested' | 'offline';
}

export interface FlashLoanProvider {
  name: string;
  network: string;
  fee: number;
  maxLoanAmount: number;
  supportedTokens: string[];
}
