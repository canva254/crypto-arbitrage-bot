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
  strategy: 'simple' | 'triangular';
  volume: number;
  timestamp: number;
  risk: 'low' | 'medium' | 'high';
  riskFactors: string[];
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
  status: 'online' | 'offline' | 'rate_limited' | 'error';
  lastChecked: string;
}

export interface ArbitrageStats {
  period: string; // '24h', '7d', '30d'
  totalOpportunities: number;
  averageProfit: number;
  maxProfit: number;
  successRate: number;
  timestamp: string;
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
