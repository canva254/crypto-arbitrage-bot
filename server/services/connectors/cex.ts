/**
 * Centralized Exchange Connector
 * 
 * This module provides a unified interface for interacting with centralized exchanges
 * using the CCXT library.
 */

import * as ccxt from 'ccxt';
import { getExchangeKeys } from '../../config/secrets';
import { ExchangeStatusEnum } from '@shared/schema';

// Map of exchange IDs to ccxt exchange classes
const exchangeMap: Record<string, any> = {
  'Binance': ccxt.binance,
  'Coinbase': ccxt.coinbase,
  'Kraken': ccxt.kraken,
  'Kucoin': ccxt.kucoin,
  'Bitfinex': ccxt.bitfinex,
  'Huobi': ccxt.huobi,
  'OKX': ccxt.okx,
  'Bybit': ccxt.bybit,
  'Bitmex': ccxt.bitmex
};

// Cache of exchange instances to avoid recreating them
const exchangeInstances: Record<string, ccxt.Exchange> = {};

/**
 * Get an authenticated instance of a specific exchange
 */
export async function getExchange(exchangeName: string): Promise<ccxt.Exchange | null> {
  // Return cached instance if available
  if (exchangeInstances[exchangeName]) {
    return exchangeInstances[exchangeName];
  }
  
  // Get the corresponding CCXT exchange class
  const ExchangeClass = exchangeMap[exchangeName];
  if (!ExchangeClass) {
    console.error(`Unsupported exchange: ${exchangeName}`);
    return null;
  }
  
  // Get API credentials
  const credentials = getExchangeKeys(exchangeName);
  if (!credentials) {
    console.warn(`No API credentials for ${exchangeName}. Using public API only.`);
    // Create instance with public API access only
    const exchange = new ExchangeClass({
      enableRateLimit: true,
    });
    exchangeInstances[exchangeName] = exchange;
    return exchange;
  }
  
  // Create exchange instance with credentials
  try {
    const config: ccxt.Exchange = {
      apiKey: credentials.apiKey,
      secret: credentials.secret,
      enableRateLimit: true,
    };
    
    // Add exchange-specific parameters from additionalParams
    if (credentials.additionalParams) {
      for (const [key, value] of Object.entries(credentials.additionalParams)) {
        (config as any)[key] = value;
      }
    }
    
    const exchange = new ExchangeClass(config);
    
    // Load markets (required for some exchange operations)
    await exchange.loadMarkets();
    
    // Cache the instance
    exchangeInstances[exchangeName] = exchange;
    return exchange;
  } catch (error) {
    console.error(`Error creating ${exchangeName} instance:`, error);
    return null;
  }
}

/**
 * Get real-time ticker data for a specific pair on an exchange
 */
export async function getTicker(exchangeName: string, symbol: string): Promise<ccxt.Ticker | null> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return null;
  }
  
  try {
    // Normalize symbol format to exchange-specific format
    const marketSymbol = normalizeSymbol(exchange, symbol);
    if (!marketSymbol) {
      console.error(`Symbol ${symbol} not supported on ${exchangeName}`);
      return null;
    }
    
    // Fetch ticker
    const ticker = await exchange.fetchTicker(marketSymbol);
    return ticker;
  } catch (error) {
    console.error(`Error fetching ticker for ${symbol} on ${exchangeName}:`, error);
    return null;
  }
}

/**
 * Get exchange status (online, rate limited, etc.)
 */
export async function getExchangeStatus(exchangeName: string): Promise<string> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return ExchangeStatusEnum.OFFLINE;
  }
  
  try {
    // Simple ping to check if exchange is responsive
    await exchange.fetchTime();
    return ExchangeStatusEnum.ONLINE;
  } catch (error: any) {
    // Check for different types of errors
    if (error instanceof ccxt.RateLimitExceeded) {
      return ExchangeStatusEnum.RATE_LIMITED;
    } else if (error instanceof ccxt.NetworkError) {
      return ExchangeStatusEnum.OFFLINE;
    } else {
      return ExchangeStatusEnum.ERROR;
    }
  }
}

/**
 * Get order book data for a specific pair
 */
export async function getOrderBook(exchangeName: string, symbol: string, limit: number = 20): Promise<ccxt.OrderBook | null> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return null;
  }
  
  try {
    // Normalize symbol format
    const marketSymbol = normalizeSymbol(exchange, symbol);
    if (!marketSymbol) {
      console.error(`Symbol ${symbol} not supported on ${exchangeName}`);
      return null;
    }
    
    // Fetch order book
    const orderBook = await exchange.fetchOrderBook(marketSymbol, limit);
    return orderBook;
  } catch (error) {
    console.error(`Error fetching order book for ${symbol} on ${exchangeName}:`, error);
    return null;
  }
}

/**
 * Place a market buy order
 */
export async function placeMarketBuyOrder(
  exchangeName: string, 
  symbol: string, 
  amount: number
): Promise<ccxt.Order | null> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return null;
  }
  
  // Check if we have authentication
  if (!exchange.apiKey) {
    console.error(`Cannot place order on ${exchangeName} without API credentials`);
    return null;
  }
  
  try {
    // Normalize symbol format
    const marketSymbol = normalizeSymbol(exchange, symbol);
    if (!marketSymbol) {
      console.error(`Symbol ${symbol} not supported on ${exchangeName}`);
      return null;
    }
    
    // Place market buy order
    const order = await exchange.createMarketBuyOrder(marketSymbol, amount);
    return order;
  } catch (error) {
    console.error(`Error placing market buy order for ${symbol} on ${exchangeName}:`, error);
    return null;
  }
}

/**
 * Place a market sell order
 */
export async function placeMarketSellOrder(
  exchangeName: string, 
  symbol: string, 
  amount: number
): Promise<ccxt.Order | null> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return null;
  }
  
  // Check if we have authentication
  if (!exchange.apiKey) {
    console.error(`Cannot place order on ${exchangeName} without API credentials`);
    return null;
  }
  
  try {
    // Normalize symbol format
    const marketSymbol = normalizeSymbol(exchange, symbol);
    if (!marketSymbol) {
      console.error(`Symbol ${symbol} not supported on ${exchangeName}`);
      return null;
    }
    
    // Place market sell order
    const order = await exchange.createMarketSellOrder(marketSymbol, amount);
    return order;
  } catch (error) {
    console.error(`Error placing market sell order for ${symbol} on ${exchangeName}:`, error);
    return null;
  }
}

/**
 * Get balance for a specific currency
 */
export async function getBalance(exchangeName: string, currency: string): Promise<number | null> {
  const exchange = await getExchange(exchangeName);
  if (!exchange) {
    return null;
  }
  
  try {
    const balances = await exchange.fetchBalance();
    return balances[currency]?.free || 0;
  } catch (error) {
    console.error(`Error fetching balance for ${currency} on ${exchangeName}:`, error);
    return null;
  }
}

/**
 * Normalize symbol to exchange-specific format
 * e.g., "BTC/USDT" might be "BTCUSDT" on some exchanges
 */
function normalizeSymbol(exchange: ccxt.Exchange, symbol: string): string | null {
  try {
    // Check if symbol exists in exchange markets
    if (exchange.markets && exchange.markets[symbol]) {
      return symbol;
    }
    
    // Try alternative formats
    const [base, quote] = symbol.split('/');
    
    // Try without the slash
    const noslashSymbol = `${base}${quote}`;
    if (exchange.markets && exchange.markets[noslashSymbol]) {
      return noslashSymbol;
    }
    
    // Try with underscore
    const underscoreSymbol = `${base}_${quote}`;
    if (exchange.markets && exchange.markets[underscoreSymbol]) {
      return underscoreSymbol;
    }
    
    // If we can't find it, return null
    return null;
  } catch (error) {
    console.error(`Error normalizing symbol ${symbol}:`, error);
    return null;
  }
}