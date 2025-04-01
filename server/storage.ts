import { 
  Exchange, InsertExchange, 
  Opportunity, InsertOpportunity, 
  Stats, InsertStats,
  ExchangeStatusEnum, RiskLevelEnum, StrategyTypeEnum
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Exchange operations
  getAllExchanges(): Promise<Exchange[]>;
  getExchangeById(id: number): Promise<Exchange | undefined>;
  getExchangeByName(name: string): Promise<Exchange | undefined>;
  upsertExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchangeStatus(id: number, status: string): Promise<Exchange>;
  
  // Opportunity operations
  getOpportunities(minProfit?: number, strategy?: string): Promise<Opportunity[]>;
  getOpportunityById(id: number): Promise<Opportunity | undefined>;
  addOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  deactivateOpportunity(id: number): Promise<Opportunity>;
  
  // Stats operations
  getStatsByPeriod(period: string): Promise<Stats | undefined>;
  updateStats(stats: InsertStats): Promise<Stats>;
  
  // History operations
  getProfitHistory(pair: string): Promise<{ timestamps: string[], profits: number[], pair: string }>;
  getPriceComparison(pair: string): Promise<{ 
    timestamps: string[], 
    exchanges: { name: string, prices: number[] }[],
    pair: string
  }>;
}

// MemStorage implementation
export class MemStorage implements IStorage {
  private exchanges: Map<number, Exchange>;
  private opportunities: Map<number, Opportunity>;
  private stats: Map<string, Stats>;
  private profitHistory: Map<string, { timestamps: string[], profits: number[] }>;
  private priceComparison: Map<string, { 
    timestamps: string[], 
    exchanges: { name: string, prices: number[] }[] 
  }>;
  
  private exchangeId: number;
  private opportunityId: number;
  private statsId: number;

  constructor() {
    this.exchanges = new Map();
    this.opportunities = new Map();
    this.stats = new Map();
    this.profitHistory = new Map();
    this.priceComparison = new Map();
    
    this.exchangeId = 1;
    this.opportunityId = 1;
    this.statsId = 1;
    
    // Initialize with default exchanges
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default exchanges
    const defaultExchanges: InsertExchange[] = [
      { name: 'Binance', isActive: true, status: ExchangeStatusEnum.ONLINE },
      { name: 'Coinbase', isActive: true, status: ExchangeStatusEnum.ONLINE },
      { name: 'Kraken', isActive: true, status: ExchangeStatusEnum.ONLINE },
      { name: 'Kucoin', isActive: true, status: ExchangeStatusEnum.RATE_LIMITED },
      { name: 'FTX', isActive: true, status: ExchangeStatusEnum.ERROR },
    ];
    
    defaultExchanges.forEach(exchange => {
      this.upsertExchange(exchange);
    });

    // Initialize default stats
    const defaultStats: InsertStats = {
      totalOpportunities: 158,
      avgProfit: 1.24,
      maxProfit: 4.56,
      successRate: 92.3,
      period: '24h'
    };
    
    this.updateStats(defaultStats);

    // Initialize default profit history for BTC/USDT
    const now = new Date();
    const timestamps: string[] = [];
    const profits: number[] = [];
    
    // Generate 24 hours of history data with 1-hour intervals
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      timestamps.push(timestamp);
      // Generate random profit between 0.5% and 4%
      const profit = 0.5 + Math.random() * 3.5;
      profits.push(profit);
    }
    
    this.profitHistory.set('BTC/USDT', { timestamps, profits });
    this.profitHistory.set('all', { timestamps, profits });

    // Initialize default price comparison for BTC/USDT
    const priceTimestamps: string[] = [];
    const binancePrices: number[] = [];
    const coinbasePrices: number[] = [];
    const krakenPrices: number[] = [];
    
    // Generate 24 hours of price data with 1-hour intervals
    const basePrice = 37000;
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString();
      priceTimestamps.push(timestamp);
      
      // Generate slightly different prices for each exchange
      const volatility = Math.random() * 200 - 100; // -100 to +100
      binancePrices.push(basePrice + volatility);
      coinbasePrices.push(basePrice + volatility + 50 + Math.random() * 100);
      krakenPrices.push(basePrice + volatility - 30 + Math.random() * 100);
    }
    
    this.priceComparison.set('BTC/USDT', {
      timestamps: priceTimestamps,
      exchanges: [
        { name: 'Binance', prices: binancePrices },
        { name: 'Coinbase', prices: coinbasePrices },
        { name: 'Kraken', prices: krakenPrices }
      ]
    });
  }

  // Exchange operations
  async getAllExchanges(): Promise<Exchange[]> {
    return Array.from(this.exchanges.values());
  }

  async getExchangeById(id: number): Promise<Exchange | undefined> {
    return this.exchanges.get(id);
  }

  async getExchangeByName(name: string): Promise<Exchange | undefined> {
    return Array.from(this.exchanges.values()).find(
      (exchange) => exchange.name.toLowerCase() === name.toLowerCase()
    );
  }

  async upsertExchange(exchange: InsertExchange): Promise<Exchange> {
    const existingExchange = await this.getExchangeByName(exchange.name);
    
    if (existingExchange) {
      const updatedExchange: Exchange = {
        ...existingExchange,
        ...exchange,
        lastChecked: new Date().toISOString()
      };
      this.exchanges.set(existingExchange.id, updatedExchange);
      return updatedExchange;
    } else {
      const newExchange: Exchange = {
        id: this.exchangeId++,
        ...exchange,
        lastChecked: new Date().toISOString()
      };
      this.exchanges.set(newExchange.id, newExchange);
      return newExchange;
    }
  }

  async updateExchangeStatus(id: number, status: string): Promise<Exchange> {
    const exchange = await this.getExchangeById(id);
    if (!exchange) {
      throw new Error(`Exchange with ID ${id} not found`);
    }
    
    const updatedExchange: Exchange = {
      ...exchange,
      status,
      lastChecked: new Date().toISOString()
    };
    
    this.exchanges.set(id, updatedExchange);
    return updatedExchange;
  }

  // Opportunity operations
  async getOpportunities(minProfit: number = 0, strategy: string = 'all'): Promise<Opportunity[]> {
    let opportunities = Array.from(this.opportunities.values())
      .filter(opp => opp.isActive);
    
    if (minProfit > 0) {
      opportunities = opportunities.filter(opp => 
        parseFloat(opp.profitPercentage.toString()) >= minProfit
      );
    }
    
    if (strategy !== 'all') {
      opportunities = opportunities.filter(opp => 
        opp.strategy.toLowerCase() === strategy.toLowerCase()
      );
    }
    
    // Sort by profit percentage (descending)
    return opportunities.sort((a, b) => 
      parseFloat(b.profitPercentage.toString()) - parseFloat(a.profitPercentage.toString())
    );
  }

  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async addOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const newOpportunity: Opportunity = {
      id: this.opportunityId++,
      ...opportunity,
      timestamp: new Date().toISOString()
    };
    
    this.opportunities.set(newOpportunity.id, newOpportunity);
    return newOpportunity;
  }

  async deactivateOpportunity(id: number): Promise<Opportunity> {
    const opportunity = await this.getOpportunityById(id);
    if (!opportunity) {
      throw new Error(`Opportunity with ID ${id} not found`);
    }
    
    const updatedOpportunity: Opportunity = {
      ...opportunity,
      isActive: false
    };
    
    this.opportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  // Stats operations
  async getStatsByPeriod(period: string): Promise<Stats | undefined> {
    return this.stats.get(period);
  }

  async updateStats(stats: InsertStats): Promise<Stats> {
    const { period } = stats;
    const existingStats = await this.getStatsByPeriod(period);
    
    const newStats: Stats = {
      id: existingStats ? existingStats.id : this.statsId++,
      ...stats,
      timestamp: new Date().toISOString()
    };
    
    this.stats.set(period, newStats);
    return newStats;
  }

  // History operations
  async getProfitHistory(pair: string): Promise<{ timestamps: string[], profits: number[], pair: string }> {
    const history = this.profitHistory.get(pair) || this.profitHistory.get('all') || { timestamps: [], profits: [] };
    
    return {
      ...history,
      pair
    };
  }

  async getPriceComparison(pair: string): Promise<{ 
    timestamps: string[], 
    exchanges: { name: string, prices: number[] }[],
    pair: string
  }> {
    const comparison = this.priceComparison.get(pair) || { timestamps: [], exchanges: [] };
    
    return {
      ...comparison,
      pair
    };
  }
}

export const storage = new MemStorage();
