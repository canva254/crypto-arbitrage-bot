# Cryptocurrency Arbitrage Bot

A sophisticated cryptocurrency arbitrage platform designed to help traders identify and capitalize on cross-exchange trading opportunities with advanced analytics and strategy exploration.

## Features

- Real-time exchange rate monitoring across CEX and DEX platforms
- Multi-exchange arbitrage scanning with various strategies:
  - Simple arbitrage (cross-exchange)
  - Triangular arbitrage
  - Cross-DEX arbitrage
  - Flash loan arbitrage
  - Statistical arbitrage
- Trade simulation for strategy testing
- Live execution of arbitrage opportunities
- Dashboard with analytics and visualization
- Risk assessment and management features

## Technology Stack

- **Frontend**: React.js with Shadcn UI components
- **Backend**: Node.js with Express
- **Data Management**: In-memory storage (expandable to PostgreSQL)
- **Exchange Connections**: CCXT library for CEX, Web3/Ethers for DEX
- **Real-time Updates**: WebSocket connections

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- NPM or Yarn
- Exchange API keys
- Ethereum wallet (for DEX interactions)

### Environment Variables

The following environment variables need to be set:

```
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
INFURA_API_KEY=your_infura_key
TEST_WALLET_PRIVATE_KEY=your_test_wallet_private_key
```

### Installation

1. Clone the repository:
```
git clone https://github.com/your-username/crypto-arbitrage-bot.git
cd crypto-arbitrage-bot
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

1. Configure your exchange API keys in the Execution tab
2. View active arbitrage opportunities in the Monitoring tab
3. Use the Trade Simulator to test strategies without using real funds
4. Execute real trades when you're confident in your strategy

## Risk Warning

Trading cryptocurrencies involves significant risk. This tool is provided for educational and research purposes only. Always perform your own due diligence before executing trades with real funds.

## License

MIT