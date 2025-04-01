/**
 * Secrets Configuration
 * 
 * This module handles the secure access to API keys, contracts, and other sensitive information
 * needed to interact with exchanges, blockchains, and bridges.
 */

// Import environment variables
import dotenv from 'dotenv';
dotenv.config();

// CEX API key configuration
interface ExchangeKeys {
  apiKey: string;
  secret: string;
  additionalParams?: Record<string, string>; // For exchange-specific parameters
}

// Contract information
interface ContractInfo {
  address: string;
  abi: any;
  network: string;
}

// Check if we have a valid key
function hasValidKey(keys: ExchangeKeys): boolean {
  return !!(keys.apiKey && keys.secret && keys.apiKey.length > 5 && keys.secret.length > 5);
}

// Get CEX API keys from environment variables
export function getExchangeKeys(exchangeName: string): ExchangeKeys | null {
  const normalizedName = exchangeName.toLowerCase();
  
  switch (normalizedName) {
    case 'binance':
      return {
        apiKey: process.env.BINANCE_API_KEY || '',
        secret: process.env.BINANCE_API_SECRET || '',
      };
      
    case 'coinbase':
      return {
        apiKey: process.env.COINBASE_API_KEY || '',
        secret: process.env.COINBASE_API_SECRET || '',
        additionalParams: {
          password: process.env.COINBASE_API_PASSPHRASE || '',
        }
      };
      
    case 'kraken':
      return {
        apiKey: process.env.KRAKEN_API_KEY || '',
        secret: process.env.KRAKEN_API_SECRET || '',
      };
      
    case 'kucoin':
      return {
        apiKey: process.env.KUCOIN_API_KEY || '',
        secret: process.env.KUCOIN_API_SECRET || '',
        additionalParams: {
          password: process.env.KUCOIN_API_PASSPHRASE || '',
        }
      };
      
    default:
      return null;
  }
}

// Get private key for blockchain operations
export function getPrivateKey(network: string): string | null {
  const normalizedNetwork = network.toLowerCase();
  
  switch (normalizedNetwork) {
    case 'ethereum':
      return process.env.ETH_PRIVATE_KEY || null;
      
    case 'binance':
      return process.env.BSC_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    case 'polygon':
      return process.env.POLYGON_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    case 'avalanche':
      return process.env.AVAX_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    case 'arbitrum':
      return process.env.ARBITRUM_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    case 'optimism':
      return process.env.OPTIMISM_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    case 'base':
      return process.env.BASE_PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || null;
      
    default:
      return null;
  }
}

// Get blockchain provider URL
export function getProviderUrl(network: string): string | null {
  const normalizedNetwork = network.toLowerCase();
  
  switch (normalizedNetwork) {
    case 'ethereum':
      return process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/' + process.env.INFURA_API_KEY;
      
    case 'binance':
      return process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
      
    case 'polygon':
      return process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com/';
      
    case 'avalanche':
      return process.env.AVAX_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
      
    case 'arbitrum':
      return process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
      
    case 'optimism':
      return process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';
      
    case 'fantom':
      return process.env.FANTOM_RPC_URL || 'https://rpc.ftm.tools/';
      
    case 'base':
      return process.env.BASE_RPC_URL || 'https://mainnet.base.org';
      
    default:
      return null;
  }
}

// Get bridge contract information
export function getBridgeContract(bridgeName: string): ContractInfo | null {
  const normalizedName = bridgeName.toLowerCase();
  
  // Note: In a real implementation, these would be the actual contract addresses and ABIs
  // For now, we'll use placeholder values
  
  switch (normalizedName) {
    case 'axelar':
      return {
        address: '0xSimulatedAxelarGatewayAddress',
        abi: [
          'function bridge(address token, uint256 amount, string destinationChain, string recipient) external',
          'function isTokenSupported(address token) view returns (bool)'
        ],
        network: 'ethereum'
      };
      
    case 'layerzero':
      return {
        address: '0xSimulatedLayerZeroEndpointAddress',
        abi: [
          'function sendFrom(address from, uint16 dstChainId, bytes calldata toAddress, address token, uint256 amount) external payable',
          'function estimateFees(uint16 dstChainId, address userApplication, bytes calldata payload, bool payInZRO, bytes calldata adapterParams) view returns (uint256 nativeFee, uint256 zroFee)'
        ],
        network: 'ethereum'
      };
      
    default:
      return null;
  }
}

// Get flash loan provider contract information
export function getFlashLoanProvider(providerName: string): ContractInfo | null {
  const normalizedName = providerName.toLowerCase();
  
  // Note: In a real implementation, these would be the actual contract addresses and ABIs
  // For now, we'll use placeholder values
  
  switch (normalizedName) {
    case 'aave v3':
      return {
        address: '0xSimulatedAaveV3FlashLoanReceiverAddress',
        abi: [
          'function executeFlashLoan(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, bytes calldata params) external',
          'function executeOperation(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata premiums, address initiator, bytes calldata params) external returns (bool)'
        ],
        network: 'ethereum'
      };
      
    case 'balancer':
      return {
        address: '0xSimulatedBalancerFlashLoanReceiverAddress',
        abi: [
          'function receiveFlashLoan(address[] tokens, uint256[] amounts, uint256[] feeAmounts, bytes data) external',
          'function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes data) external'
        ],
        network: 'ethereum'
      };
      
    default:
      return null;
  }
}