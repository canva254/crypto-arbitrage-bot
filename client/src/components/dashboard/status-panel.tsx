import { Exchange, Opportunity, Stats, ExchangeStatusEnum } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusPanelProps {
  exchanges: Exchange[];
  opportunities: Opportunity[];
  stats?: Stats;
  isLoading: boolean;
}

export default function StatusPanel({ exchanges, opportunities, stats, isLoading }: StatusPanelProps) {
  // Count strategies in opportunities
  const simpleCount = opportunities.filter(op => op.strategy.toLowerCase() === 'simple').length;
  const triangularCount = opportunities.filter(op => op.strategy.toLowerCase() === 'triangular').length;
  
  // Find highest profit opportunity
  const highestProfitOpp = opportunities.length > 0 
    ? opportunities.reduce((prev, current) => 
        parseFloat(prev.profitPercentage.toString()) > parseFloat(current.profitPercentage.toString()) 
          ? prev 
          : current
      )
    : null;
  
  const secondHighestProfitOpp = opportunities.length > 1 
    ? opportunities
        .filter(op => op.id !== highestProfitOpp?.id)
        .reduce((prev, current) => 
          parseFloat(prev.profitPercentage.toString()) > parseFloat(current.profitPercentage.toString()) 
            ? prev 
            : current
        )
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-16 mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      {/* Exchanges Card */}
      <div className="card p-4 bg-surface rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Active Exchanges</p>
            <p className="text-2xl font-semibold font-mono">
              {exchanges.filter(e => e.status === ExchangeStatusEnum.ONLINE).length}/
              {exchanges.length}
            </p>
          </div>
          <div className="bg-surface2 rounded-full p-2">
            <span className="material-icons text-secondary">account_balance</span>
          </div>
        </div>
        <div className="mt-4">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="flex items-center text-xs mt-1">
              <span 
                className={`h-2 w-2 rounded-full mr-2 ${
                  exchange.status === ExchangeStatusEnum.ONLINE 
                    ? 'bg-success' 
                    : exchange.status === ExchangeStatusEnum.RATE_LIMITED 
                      ? 'bg-warning' 
                      : 'bg-error'
                }`}
              ></span>
              <span className="text-gray-300">{exchange.name}</span>
              <span 
                className={`ml-auto ${
                  exchange.status === ExchangeStatusEnum.ONLINE 
                    ? 'text-success' 
                    : exchange.status === ExchangeStatusEnum.RATE_LIMITED 
                      ? 'text-warning' 
                      : 'text-error'
                }`}
              >
                {exchange.status === ExchangeStatusEnum.ONLINE 
                  ? 'Online' 
                  : exchange.status === ExchangeStatusEnum.RATE_LIMITED 
                    ? 'Rate limited' 
                    : 'Connection error'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities Card */}
      <div className="card p-4 bg-surface rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Opportunities</p>
            <p className="text-2xl font-semibold font-mono">{opportunities.length}</p>
          </div>
          <div className="bg-surface2 rounded-full p-2">
            <span className="material-icons text-secondary">trending_up</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-300">By Strategy</span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-surface2 mt-1">
              {simpleCount > 0 && (
                <div 
                  style={{ width: `${(simpleCount / opportunities.length) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                ></div>
              )}
              {triangularCount > 0 && (
                <div 
                  style={{ width: `${(triangularCount / opportunities.length) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary"
                ></div>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{simpleCount} Simple</span>
              <span>{triangularCount} Triangular</span>
            </div>
          </div>
        </div>
      </div>

      {/* Highest Profit Card */}
      <div className="card p-4 bg-surface rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Highest Profit</p>
            <p className="text-2xl font-semibold font-mono text-success">
              {highestProfitOpp 
                ? `${parseFloat(highestProfitOpp.profitPercentage.toString()).toFixed(2)}%` 
                : '0.00%'}
            </p>
          </div>
          <div className="bg-surface2 rounded-full p-2">
            <span className="material-icons text-success">payments</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-col">
            {highestProfitOpp && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">{highestProfitOpp.assetPair}</span>
                  <span className="text-success font-mono">
                    {parseFloat(highestProfitOpp.profitPercentage.toString()).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">
                    {highestProfitOpp.buyExchange} → {highestProfitOpp.sellExchange}
                  </span>
                  <span className="text-gray-400">{highestProfitOpp.strategy}</span>
                </div>
                {secondHighestProfitOpp && (
                  <>
                    <div className="h-px bg-gray-700 my-2"></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{secondHighestProfitOpp.assetPair}</span>
                      <span className="text-success font-mono">
                        {parseFloat(secondHighestProfitOpp.profitPercentage.toString()).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">
                        {secondHighestProfitOpp.buyExchange} → {secondHighestProfitOpp.sellExchange}
                      </span>
                      <span className="text-gray-400">{secondHighestProfitOpp.strategy}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 24h Statistics Card */}
      <div className="card p-4 bg-surface rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">24h Statistics</p>
            <p className="text-2xl font-semibold font-mono">
              {stats ? stats.totalOpportunities : '0'}
            </p>
          </div>
          <div className="bg-surface2 rounded-full p-2">
            <span className="material-icons text-secondary">insights</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Total opportunities</span>
              <span className="font-mono">{stats ? stats.totalOpportunities : '0'}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-gray-300">Avg. profit</span>
              <span className="font-mono text-success">
                {stats ? `${parseFloat(stats.avgProfit.toString()).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-gray-300">Max. profit</span>
              <span className="font-mono text-success">
                {stats ? `${parseFloat(stats.maxProfit.toString()).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-gray-300">Success rate</span>
              <span className="font-mono">
                {stats ? `${parseFloat(stats.successRate.toString()).toFixed(1)}%` : '0.0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
