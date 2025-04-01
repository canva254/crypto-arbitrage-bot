import { Opportunity } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface OpportunityDetailsProps {
  opportunity: Opportunity | null;
  isLoading: boolean;
}

export default function OpportunityDetails({ opportunity, isLoading }: OpportunityDetailsProps) {
  // Constants for fee calculation
  const EXCHANGE_FEE_PERCENTAGE = 0.25; // 0.25%
  const NETWORK_FEE_FIXED = 12.80;
  
  // Calculate fees
  const exchangeFees = opportunity 
    ? parseFloat(opportunity.volume.toString()) * (EXCHANGE_FEE_PERCENTAGE / 100) 
    : 0;
  
  const estimatedProfit = opportunity 
    ? parseFloat(opportunity.estimatedProfit.toString()) 
    : 0;
  
  const netProfit = estimatedProfit - exchangeFees - NETWORK_FEE_FIXED;

  return (
    <div className="card bg-surface rounded-lg h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-medium">Opportunity Details</h3>
      </div>
      
      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center mb-4">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
        </div>
      ) : !opportunity ? (
        <div className="p-4 text-center py-12">
          <span className="material-icons text-gray-400 text-4xl mb-2">info</span>
          <p className="text-lg font-medium">No opportunity selected</p>
          <p className="text-sm text-gray-400">Select an opportunity from the table to view details</p>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-center py-6">
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mb-4">
                <span className="font-semibold text-2xl">{opportunity.assetPair.split('/')[0]}</span>
              </div>
              <h3 className="text-xl font-medium mb-2">{opportunity.assetPair}</h3>
              <span className={`px-3 py-1 text-sm rounded-full mb-4 ${
                opportunity.strategy.toLowerCase() === 'simple' 
                  ? 'bg-primary bg-opacity-20 text-primary'
                  : 'bg-secondary bg-opacity-20 text-secondary'
              }`}>
                {opportunity.strategy} Arbitrage
              </span>
            </div>

            <div className="bg-surface2 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Buy Price ({opportunity.buyExchange})</span>
                <span className="font-mono font-medium">
                  ${parseFloat(opportunity.buyPrice.toString()).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Sell Price ({opportunity.sellExchange})</span>
                <span className="font-mono font-medium">
                  ${parseFloat(opportunity.sellPrice.toString()).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Price Difference</span>
                <span className="font-mono font-medium text-success">
                  +${(parseFloat(opportunity.sellPrice.toString()) - parseFloat(opportunity.buyPrice.toString())).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Percentage Profit</span>
                <span className="font-mono font-medium text-success">
                  +{parseFloat(opportunity.profitPercentage.toString()).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-surface2 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium mb-3">Profit Calculation</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Trading Volume</span>
                <span className="font-mono font-medium">
                  ${parseFloat(opportunity.volume.toString()).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Exchange Fees</span>
                <span className="font-mono font-medium text-error">
                  -${exchangeFees.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Network Fees</span>
                <span className="font-mono font-medium text-error">
                  -${NETWORK_FEE_FIXED.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-gray-700 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-white">Estimated Net Profit</span>
                <span className="font-mono font-medium text-success">
                  ${netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-surface2 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium mb-3">Risk Assessment</h4>
              <div className="flex items-center mb-2">
                <span className={`px-2 py-1 text-xs rounded-full mr-2 ${
                  opportunity.risk.toLowerCase() === 'low'
                    ? 'bg-success bg-opacity-20 text-success'
                    : opportunity.risk.toLowerCase() === 'medium'
                      ? 'bg-warning bg-opacity-20 text-warning'
                      : 'bg-error bg-opacity-20 text-error'
                }`}>
                  {opportunity.risk.charAt(0).toUpperCase() + opportunity.risk.slice(1)} Risk
                </span>
                <span className="text-gray-400 text-sm">
                  {opportunity.risk.toLowerCase() === 'low'
                    ? 'Price volatility is low'
                    : opportunity.risk.toLowerCase() === 'medium'
                      ? 'Moderate price volatility'
                      : 'High price volatility'}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                <ul className="list-disc list-inside">
                  {opportunity.risk.toLowerCase() === 'low' && (
                    <>
                      <li>High liquidity on both exchanges</li>
                      <li>Stable spread for last 30 minutes</li>
                      <li>Low transaction confirmation time</li>
                    </>
                  )}
                  {opportunity.risk.toLowerCase() === 'medium' && (
                    <>
                      <li>Moderate liquidity on exchanges</li>
                      <li>Some fluctuation in price spread</li>
                      <li>Average transaction confirmation time</li>
                    </>
                  )}
                  {opportunity.risk.toLowerCase() === 'high' && (
                    <>
                      <li>Low liquidity on one or both exchanges</li>
                      <li>Rapidly changing price spread</li>
                      <li>Long transaction confirmation time</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <button className="w-full py-2 px-4 bg-primary hover:bg-blue-600 text-white rounded-md transition-colors mb-2">
              Execute Trade
            </button>
            <button className="w-full py-2 px-4 bg-surface2 hover:bg-surface text-gray-300 rounded-md transition-colors">
              Add to Watchlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
