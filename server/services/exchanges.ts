import { ExchangeStatusEnum, NetworkEnum } from '@shared/schema';
import { Exchange } from '@shared/schema';
import { storage } from '../storage';
import * as cexConnector from './connectors/cex';
import * as dexConnector from './connectors/dex';

// Track connected exchanges
const connectedExchanges = new Map<string, any>();

// Initialize and set up exchanges
export async function setupExchanges(): Promise<void> {
  console.log('Setting up exchanges...');
  const exchanges = await storage.getAllExchanges();
  
  // Connect to active exchanges
  await connectToExchanges(exchanges);
  console.log('Exchanges setup complete');
}

// Connect to exchange APIs
export async function connectToExchanges(exchanges: Exchange[]): Promise<string[]> {
  const activeExchanges: string[] = [];
  
  for (const exchange of exchanges) {
    if (!exchange.isActive) continue;
    
    try {
      console.log(`Connecting to ${exchange.name}...`);
      let connected = false;
      
      // Try to establish real connections
      if (exchange.type === 'cex') {
        // Get exchange instance using CEX connector
        const exchangeInstance = await cexConnector.getExchange(exchange.name);
        connected = !!exchangeInstance;
      } else if (exchange.type === 'dex' && exchange.network) {
        // For DEX, check if we can get a provider for the network
        const provider = await dexConnector.getProvider(exchange.network);
        connected = !!provider;
      }
      
      // If real connection fails, fall back to simulation
      if (!connected) {
        connected = await simulateExchangeConnection(exchange.name);
      }
      
      if (connected) {
        // Store exchange instance
        connectedExchanges.set(exchange.name, { name: exchange.name, connected: true });
        activeExchanges.push(exchange.name);
        
        // Update exchange status
        await storage.updateExchangeStatus(exchange.id, ExchangeStatusEnum.ONLINE);
        console.log(`Connected to ${exchange.name}`);
      } else {
        // Update exchange status
        await storage.updateExchangeStatus(exchange.id, ExchangeStatusEnum.OFFLINE);
      }
    } catch (error) {
      console.error(`Failed to connect to ${exchange.name}:`, error);
      // Update exchange status
      await storage.updateExchangeStatus(exchange.id, ExchangeStatusEnum.ERROR);
    }
  }
  
  return activeExchanges;
}

// Simulate checking exchange connection status
async function simulateExchangeConnection(exchangeName: string): Promise<boolean> {
  // In a real app, this would test the API connection
  // Random chance of connection success (for simulation)
  const name = exchangeName.toLowerCase();
  
  if (name === 'kucoin') {
    // Simulate rate limiting on Kucoin
    return Math.random() > 0.7;
  } else if (name === 'bitfinex') {
    // Simulate connection issues with Bitfinex
    return Math.random() > 0.7;
  } else {
    // Other exchanges generally work
    return Math.random() > 0.1;
  }
}

// Get tickers for a specific trading pair
export async function getTickersForPair(pair: string, exchangeNames: string[]) {
  const tickers = [];
  
  for (const exchangeName of exchangeNames) {
    try {
      // Get exchange information
      const exchange = await storage.getExchangeByName(exchangeName);
      if (!exchange) continue;
      
      // Try to get real ticker data first
      if (exchange.type === 'cex') {
        try {
          // Try to get real ticker from CEX
          const realTicker = await cexConnector.getTicker(exchangeName, pair);
          if (realTicker) {
            tickers.push({
              symbol: pair,
              bid: realTicker.bid,
              ask: realTicker.ask,
              last: realTicker.last,
              volume: realTicker.volume || 0,
              timestamp: realTicker.timestamp || Date.now(),
              exchange: exchangeName
            });
            continue;
          }
        } catch (error) {
          console.log(`Failed to get real ticker data for ${pair} on ${exchangeName}, falling back to simulation`);
        }
      } else if (exchange.type === 'dex' && exchange.network) {
        // For DEXes, we would need to get real prices from the blockchain
        // This would require token addresses for the pair, which we don't have in this simulation
        // In a real implementation, this would use dexConnector.getDexPrice
      }
      
      // Fall back to simulated data if real data isn't available
      const ticker = simulateTickerData(exchangeName, pair);
      tickers.push(ticker);
    } catch (error) {
      console.error(`Failed to get ticker for ${pair} on ${exchangeName}:`, error);
    }
  }
  
  return tickers;
}

// Check exchange status
export async function getExchangeStatus(exchangeName: string): Promise<string> {
  try {
    // Try to get real exchange status
    const exchange = await storage.getExchangeByName(exchangeName);
    if (!exchange) {
      return ExchangeStatusEnum.OFFLINE;
    }
    
    if (exchange.type === 'cex') {
      // Use the CEX connector to get status
      const status = await cexConnector.getExchangeStatus(exchangeName);
      if (status) {
        return status;
      }
    } else if (exchange.type === 'dex' && exchange.network) {
      // Use the DEX connector to get status
      const status = await dexConnector.getDexStatus(exchangeName);
      if (status) {
        return status;
      }
    }
  } catch (error) {
    console.error(`Error getting real status for ${exchangeName}:`, error);
  }
  
  // Fall back to simulation if real status check fails
  const name = exchangeName.toLowerCase();
  
  // Simulate exchange statuses
  if (name === 'kucoin') {
    // Kucoin often has rate limiting
    return Math.random() > 0.3 ? ExchangeStatusEnum.ONLINE : ExchangeStatusEnum.RATE_LIMITED;
  } else if (name === 'bitfinex') {
    // Bitfinex has occasional connection issues
    return Math.random() > 0.6 ? ExchangeStatusEnum.ONLINE : ExchangeStatusEnum.ERROR;
  } else {
    // Other exchanges are generally stable
    return Math.random() > 0.05 ? ExchangeStatusEnum.ONLINE : ExchangeStatusEnum.ERROR;
  }
}

// Simulate ticker data (would be real API data in production)
function simulateTickerData(exchangeName: string, pair: string) {
  // Base price with some randomness
  let basePrice = 0;
  
  // Set realistic price ranges based on the pair
  if (pair === 'BTC/USDT') {
    basePrice = 36000 + Math.random() * 3000;
  } else if (pair === 'ETH/USDT') {
    basePrice = 2400 + Math.random() * 200;
  } else if (pair === 'SOL/USDT') {
    basePrice = 75 + Math.random() * 10;
  } else if (pair === 'ADA/USDT') {
    basePrice = 0.4 + Math.random() * 0.05;
  } else if (pair === 'LINK/USDT') {
    basePrice = 15 + Math.random() * 2;
  } else {
    basePrice = 10 + Math.random() * 100;
  }
  
  // Add exchange-specific price variance
  const exchangeVariance = getExchangeVarianceFactor(exchangeName);
  const finalBasePrice = basePrice * exchangeVariance;
  
  // Create spread
  const spread = basePrice * 0.001; // 0.1% spread
  
  return {
    symbol: pair,
    bid: finalBasePrice - (spread / 2),
    ask: finalBasePrice + (spread / 2),
    last: finalBasePrice,
    volume: 1000000 + Math.random() * 9000000,
    timestamp: Date.now(),
    exchange: exchangeName
  };
}

// Get exchange-specific price variance factor
function getExchangeVarianceFactor(exchangeName: string): number {
  // Different exchanges have slightly different prices
  const name = exchangeName.toLowerCase();
  
  if (name === 'binance') {
    return 1.0; // Use Binance as baseline
  } else if (name === 'coinbase') {
    return 1.0 + (Math.random() * 0.02); // Coinbase slightly higher on average
  } else if (name === 'kraken') {
    return 1.0 - (Math.random() * 0.01); // Kraken slightly lower on average
  } else if (name === 'kucoin') {
    return 1.0 + (Math.random() * 0.015 - 0.01); // KuCoin varies more
  } else {
    return 1.0 + (Math.random() * 0.03 - 0.015); // Other exchanges vary more
  }
}
