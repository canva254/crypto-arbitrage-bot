import { 
  Exchange, InsertExchange, 
  Opportunity, InsertOpportunity, 
  Stats, InsertStats,
  LiquidityPool, InsertLiquidityPool,
  GasPrice, InsertGasPrice,
  CrossChainBridge, InsertCrossChainBridge,
  FlashLoanProvider, InsertFlashLoanProvider,
  ExchangeStatusEnum, RiskLevelEnum, StrategyTypeEnum,
  ExchangeTypeEnum, NetworkEnum, BridgeStatusEnum
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
  
  // DEX-specific operations
  // Liquidity Pool operations
  getLiquidityPools(exchange?: string, network?: string): Promise<LiquidityPool[]>;
  getLiquidityPoolByPair(exchange: string, network: string, pair: string): Promise<LiquidityPool | undefined>;
  addLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool>;
  
  // Gas Price operations
  getLatestGasPrices(network: string): Promise<GasPrice | undefined>;
  addGasPrice(gasPrice: InsertGasPrice): Promise<GasPrice>;
  
  // Cross Chain Bridge operations
  getCrossChainBridges(sourceNetwork?: string, destinationNetwork?: string): Promise<CrossChainBridge[]>;
  addCrossChainBridge(bridge: InsertCrossChainBridge): Promise<CrossChainBridge>;
  updateBridgeStatus(id: number, status: string): Promise<CrossChainBridge>;
  
  // Flash Loan Provider operations
  getFlashLoanProviders(network?: string): Promise<FlashLoanProvider[]>;
  addFlashLoanProvider(provider: InsertFlashLoanProvider): Promise<FlashLoanProvider>;
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
  
  // DEX-specific storage
  private liquidityPools: Map<number, LiquidityPool>;
  private gasPrices: Map<number, GasPrice>;
  private crossChainBridges: Map<number, CrossChainBridge>;
  private flashLoanProviders: Map<number, FlashLoanProvider>;
  
  private exchangeId: number;
  private opportunityId: number;
  private statsId: number;
  private liquidityPoolId: number;
  private gasPriceId: number;
  private bridgeId: number;
  private providerId: number;
  
  // Utility function to create ISO timestamp string
  private createTimestamp(): string {
    return new Date().toISOString();
  }

  constructor() {
    this.exchanges = new Map();
    this.opportunities = new Map();
    this.stats = new Map();
    this.profitHistory = new Map();
    this.priceComparison = new Map();
    
    // Initialize DEX-specific maps
    this.liquidityPools = new Map();
    this.gasPrices = new Map();
    this.crossChainBridges = new Map();
    this.flashLoanProviders = new Map();
    
    this.exchangeId = 1;
    this.opportunityId = 1;
    this.statsId = 1;
    this.liquidityPoolId = 1;
    this.gasPriceId = 1;
    this.bridgeId = 1;
    this.providerId = 1;
    
    // Initialize with default exchanges
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default exchanges (CEX)
    const defaultExchanges: InsertExchange[] = [
      { name: 'Binance', isActive: true, status: ExchangeStatusEnum.ONLINE, exchangeType: ExchangeTypeEnum.CEX },
      { name: 'Coinbase', isActive: true, status: ExchangeStatusEnum.ONLINE, exchangeType: ExchangeTypeEnum.CEX },
      { name: 'Kraken', isActive: true, status: ExchangeStatusEnum.ONLINE, exchangeType: ExchangeTypeEnum.CEX },
      { name: 'Kucoin', isActive: true, status: ExchangeStatusEnum.RATE_LIMITED, exchangeType: ExchangeTypeEnum.CEX },
      { name: 'Bitfinex', isActive: true, status: ExchangeStatusEnum.ONLINE, exchangeType: ExchangeTypeEnum.CEX },
    ];
    
    // Add default DEX exchanges
    const defaultDEXs: InsertExchange[] = [
      { 
        name: 'Uniswap', 
        isActive: true, 
        status: ExchangeStatusEnum.ONLINE, 
        exchangeType: ExchangeTypeEnum.DEX,
        network: NetworkEnum.ETHEREUM,
        tvl: "5500000000", // $5.5B
        gasPrice: "45" // in gwei
      },
      { 
        name: 'SushiSwap', 
        isActive: true, 
        status: ExchangeStatusEnum.ONLINE, 
        exchangeType: ExchangeTypeEnum.DEX,
        network: NetworkEnum.ETHEREUM,
        tvl: "1200000000", // $1.2B
        gasPrice: "45" // in gwei
      },
      { 
        name: 'PancakeSwap', 
        isActive: true, 
        status: ExchangeStatusEnum.ONLINE, 
        exchangeType: ExchangeTypeEnum.DEX,
        network: NetworkEnum.BSC,
        tvl: "2500000000", // $2.5B
        gasPrice: "5" // in gwei
      },
      { 
        name: 'QuickSwap', 
        isActive: true, 
        status: ExchangeStatusEnum.ONLINE, 
        exchangeType: ExchangeTypeEnum.DEX,
        network: NetworkEnum.POLYGON,
        tvl: "450000000", // $450M
        gasPrice: "50" // in gwei
      },
      { 
        name: 'Trader Joe', 
        isActive: true, 
        status: ExchangeStatusEnum.ONLINE, 
        exchangeType: ExchangeTypeEnum.DEX,
        network: NetworkEnum.AVALANCHE,
        tvl: "380000000", // $380M
        gasPrice: "25" // in gwei
      }
    ];
    
    // Add all exchanges
    [...defaultExchanges, ...defaultDEXs].forEach(exchange => {
      this.upsertExchange(exchange);
    });

    // Initialize default stats
    const defaultStats: InsertStats = {
      totalOpportunities: 276,
      avgProfit: "1.85",
      maxProfit: "5.72",
      successRate: "87.5",
      period: '24h',
      // DEX-specific stats
      cexToDexOpportunities: 112,
      dexToCexOpportunities: 75,
      dexToDexOpportunities: 54,
      crossNetworkOpportunities: 35,
      averageGasCost: "23.45",
      averageCompletionTime: "8.6",
      // Strategy breakdown
      simpleArbitrageCount: 182,
      triangularArbitrageCount: 47,
      crossDexArbitrageCount: 32,
      flashLoanArbitrageCount: 15
    };
    
    this.updateStats(defaultStats);
    
    // Initialize default liquidity pools
    const defaultLiquidityPools: InsertLiquidityPool[] = [
      {
        exchange: 'Uniswap',
        network: NetworkEnum.ETHEREUM,
        pair: 'ETH/USDT',
        liquidityUSD: "280000000",
        token0Amount: "150000",
        token1Amount: "240000000",
        token0Symbol: 'ETH',
        token1Symbol: 'USDT',
        apy: "5.2",
        fee: "0.003"
      },
      {
        exchange: 'Uniswap',
        network: NetworkEnum.ETHEREUM,
        pair: 'ETH/USDC',
        liquidityUSD: "320000000",
        token0Amount: "170000",
        token1Amount: "272000000",
        token0Symbol: 'ETH',
        token1Symbol: 'USDC',
        apy: "4.8",
        fee: "0.003"
      },
      {
        exchange: 'PancakeSwap',
        network: NetworkEnum.BSC,
        pair: 'BNB/USDT',
        liquidityUSD: "160000000",
        token0Amount: "600000",
        token1Amount: "160000000",
        token0Symbol: 'BNB',
        token1Symbol: 'USDT',
        apy: "7.5",
        fee: "0.0025"
      },
      {
        exchange: 'QuickSwap',
        network: NetworkEnum.POLYGON,
        pair: 'MATIC/USDC',
        liquidityUSD: "85000000",
        token0Amount: "120000000",
        token1Amount: "85000000",
        token0Symbol: 'MATIC',
        token1Symbol: 'USDC',
        apy: "9.2",
        fee: "0.003"
      },
      {
        exchange: 'Trader Joe',
        network: NetworkEnum.AVALANCHE,
        pair: 'AVAX/USDC',
        liquidityUSD: "65000000",
        token0Amount: "3000000",
        token1Amount: "65000000",
        token0Symbol: 'AVAX',
        token1Symbol: 'USDC',
        apy: "8.3",
        fee: "0.003"
      }
    ];
    
    // Add liquidity pools
    defaultLiquidityPools.forEach(pool => {
      this.addLiquidityPool(pool);
    });
    
    // Initialize default gas prices
    const defaultGasPrices: InsertGasPrice[] = [
      {
        network: NetworkEnum.ETHEREUM,
        fast: "55",
        average: "45",
        slow: "35",
        unit: 'gwei'
      },
      {
        network: NetworkEnum.BSC,
        fast: "7",
        average: "5",
        slow: "3",
        unit: 'gwei'
      },
      {
        network: NetworkEnum.POLYGON,
        fast: "70",
        average: "50",
        slow: "30",
        unit: 'gwei'
      },
      {
        network: NetworkEnum.AVALANCHE,
        fast: "35",
        average: "25",
        slow: "15",
        unit: 'gwei'
      },
      {
        network: NetworkEnum.ARBITRUM,
        fast: "0.4",
        average: "0.25",
        slow: "0.1",
        unit: 'gwei'
      }
    ];
    
    // Add gas prices
    defaultGasPrices.forEach(gasPrice => {
      this.addGasPrice(gasPrice);
    });
    
    // Initialize default cross-chain bridges
    const defaultBridges: InsertCrossChainBridge[] = [
      {
        name: 'Polygon Bridge',
        sourceNetwork: NetworkEnum.ETHEREUM,
        destinationNetwork: NetworkEnum.POLYGON,
        supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI'],
        fee: "0.1",
        estimatedTime: "15", // minutes
        minimumAmount: "10",
        maximumAmount: "1000000",
        status: BridgeStatusEnum.ACTIVE
      },
      {
        name: 'Arbitrum Bridge',
        sourceNetwork: NetworkEnum.ETHEREUM,
        destinationNetwork: NetworkEnum.ARBITRUM,
        supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI'],
        fee: "0.05",
        estimatedTime: "10", // minutes
        minimumAmount: "10",
        maximumAmount: "5000000",
        status: BridgeStatusEnum.ACTIVE
      },
      {
        name: 'Avalanche Bridge',
        sourceNetwork: NetworkEnum.ETHEREUM,
        destinationNetwork: NetworkEnum.AVALANCHE,
        supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI', 'AVAX'],
        fee: "0.075",
        estimatedTime: "20", // minutes
        minimumAmount: "10",
        maximumAmount: "3000000",
        status: BridgeStatusEnum.ACTIVE
      },
      {
        name: 'Binance Bridge',
        sourceNetwork: NetworkEnum.ETHEREUM,
        destinationNetwork: NetworkEnum.BSC,
        supportedTokens: ['ETH', 'USDC', 'USDT', 'BNB'],
        fee: "0.1",
        estimatedTime: "60", // minutes
        minimumAmount: "10",
        maximumAmount: "10000000",
        status: BridgeStatusEnum.CONGESTED
      }
    ];
    
    // Add bridges
    defaultBridges.forEach(bridge => {
      this.addCrossChainBridge(bridge);
    });
    
    // Initialize default flash loan providers
    const defaultProviders: InsertFlashLoanProvider[] = [
      {
        name: 'Aave',
        network: NetworkEnum.ETHEREUM,
        fee: "0.09",
        maxLoanAmount: "30000000",
        supportedTokens: ['ETH', 'USDC', 'USDT', 'DAI', 'AAVE', 'LINK']
      },
      {
        name: 'dYdX',
        network: NetworkEnum.ETHEREUM,
        fee: "0",
        maxLoanAmount: "25000000",
        supportedTokens: ['ETH', 'USDC', 'DAI']
      },
      {
        name: 'Maker',
        network: NetworkEnum.ETHEREUM,
        fee: "0.05",
        maxLoanAmount: "50000000",
        supportedTokens: ['ETH', 'USDC', 'DAI']
      },
      {
        name: 'Aave',
        network: NetworkEnum.POLYGON,
        fee: "0.09",
        maxLoanAmount: "15000000",
        supportedTokens: ['MATIC', 'USDC', 'USDT', 'DAI', 'AAVE']
      },
      {
        name: 'Geist Finance',
        network: NetworkEnum.FANTOM,
        fee: "0.08",
        maxLoanAmount: "8000000",
        supportedTokens: ['FTM', 'USDC', 'DAI']
      }
    ];
    
    // Add flash loan providers
    defaultProviders.forEach(provider => {
      this.addFlashLoanProvider(provider);
    });

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
        lastChecked: this.createTimestamp()
      };
      this.exchanges.set(existingExchange.id, updatedExchange);
      return updatedExchange;
    } else {
      const newExchange: Exchange = {
        id: this.exchangeId++,
        ...exchange,
        lastChecked: this.createTimestamp()
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
      lastChecked: this.createTimestamp()
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
      timestamp: this.createTimestamp()
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
      timestamp: this.createTimestamp()
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

  // Liquidity Pool operations
  async getLiquidityPools(exchange?: string, network?: string): Promise<LiquidityPool[]> {
    let pools = Array.from(this.liquidityPools.values());
    
    if (exchange) {
      pools = pools.filter(pool => pool.exchange.toLowerCase() === exchange.toLowerCase());
    }
    
    if (network) {
      pools = pools.filter(pool => pool.network.toLowerCase() === network.toLowerCase());
    }
    
    return pools;
  }
  
  async getLiquidityPoolByPair(exchange: string, network: string, pair: string): Promise<LiquidityPool | undefined> {
    return Array.from(this.liquidityPools.values()).find(
      pool => 
        pool.exchange.toLowerCase() === exchange.toLowerCase() &&
        pool.network.toLowerCase() === network.toLowerCase() &&
        pool.pair.toLowerCase() === pair.toLowerCase()
    );
  }
  
  async addLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool> {
    const existingPool = await this.getLiquidityPoolByPair(pool.exchange, pool.network, pool.pair);
    
    if (existingPool) {
      const updatedPool: LiquidityPool = {
        ...existingPool,
        ...pool,
        timestamp: this.createTimestamp()
      };
      this.liquidityPools.set(existingPool.id, updatedPool);
      return updatedPool;
    } else {
      const newPool: LiquidityPool = {
        id: this.liquidityPoolId++,
        ...pool,
        timestamp: this.createTimestamp()
      };
      this.liquidityPools.set(newPool.id, newPool);
      return newPool;
    }
  }
  
  // Gas Price operations
  async getLatestGasPrices(network: string): Promise<GasPrice | undefined> {
    // Find the most recent gas price for the specified network
    const networkGasPrices = Array.from(this.gasPrices.values())
      .filter(price => price.network.toLowerCase() === network.toLowerCase())
      .sort((a, b) => {
        // Safe timestamp comparison that ensures we have valid timestamps
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    
    return networkGasPrices[0];
  }
  
  async addGasPrice(gasPrice: InsertGasPrice): Promise<GasPrice> {
    const newGasPrice: GasPrice = {
      id: this.gasPriceId++,
      ...gasPrice,
      timestamp: this.createTimestamp()
    };
    
    this.gasPrices.set(newGasPrice.id, newGasPrice);
    return newGasPrice;
  }
  
  // Cross Chain Bridge operations
  async getCrossChainBridges(sourceNetwork?: string, destinationNetwork?: string): Promise<CrossChainBridge[]> {
    let bridges = Array.from(this.crossChainBridges.values());
    
    if (sourceNetwork) {
      bridges = bridges.filter(bridge => 
        bridge.sourceNetwork.toLowerCase() === sourceNetwork.toLowerCase()
      );
    }
    
    if (destinationNetwork) {
      bridges = bridges.filter(bridge => 
        bridge.destinationNetwork.toLowerCase() === destinationNetwork.toLowerCase()
      );
    }
    
    return bridges;
  }
  
  async addCrossChainBridge(bridge: InsertCrossChainBridge): Promise<CrossChainBridge> {
    // Ensure status is set with a default if not provided
    const newBridge: CrossChainBridge = {
      id: this.bridgeId++,
      ...bridge,
      // Add default status if not provided
      status: bridge.status || BridgeStatusEnum.ACTIVE,
      // Ensure maximumAmount is never undefined (either a string or null)
      maximumAmount: bridge.maximumAmount ?? null
    };
    
    this.crossChainBridges.set(newBridge.id, newBridge);
    return newBridge;
  }
  
  async updateBridgeStatus(id: number, status: string): Promise<CrossChainBridge> {
    const bridge = this.crossChainBridges.get(id);
    if (!bridge) {
      throw new Error(`Bridge with ID ${id} not found`);
    }
    
    const updatedBridge: CrossChainBridge = {
      ...bridge,
      status: status as any // Cast to handle type conversion
    };
    
    this.crossChainBridges.set(id, updatedBridge);
    return updatedBridge;
  }
  
  // Flash Loan Provider operations
  async getFlashLoanProviders(network?: string): Promise<FlashLoanProvider[]> {
    let providers = Array.from(this.flashLoanProviders.values());
    
    if (network) {
      providers = providers.filter(provider => 
        provider.network.toLowerCase() === network.toLowerCase()
      );
    }
    
    return providers;
  }
  
  async addFlashLoanProvider(provider: InsertFlashLoanProvider): Promise<FlashLoanProvider> {
    const newProvider: FlashLoanProvider = {
      id: this.providerId++,
      ...provider
    };
    
    this.flashLoanProviders.set(newProvider.id, newProvider);
    return newProvider;
  }
}

export const storage = new MemStorage();
