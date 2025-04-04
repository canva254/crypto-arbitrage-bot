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
      <div className="card p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Active Exchanges</p>
            <p className="text-2xl font-semibold font-mono">
              {exchanges.filter(e => e.status === ExchangeStatusEnum.ONLINE).length}/
              {exchanges.length}
            </p>
          </div>
          <div className="bg-muted rounded-full p-2">
            <span className="material-icons text-blue-400">account_balance</span>
          </div>
        </div>
        <div className="mt-4">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="flex items-center text-xs mt-1">
              <span 
                className={`h-2 w-2 rounded-full mr-2 ${
                  exchange.status === ExchangeStatusEnum.ONLINE 
                    ? 'bg-green-500' 
                    : exchange.status === ExchangeStatusEnum.RATE_LIMITED 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
              ></span>
              <span className="text-foreground">{exchange.name}</span>
              <span 
                className={`ml-auto ${
                  exchange.status === ExchangeStatusEnum.ONLINE 
                    ? 'text-green-500' 
                    : exchange.status === ExchangeStatusEnum.RATE_LIMITED 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
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
      <div className="card p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Opportunities</p>
            <p className="text-2xl font-semibold font-mono">{opportunities.length}</p>
          </div>
          <div className="bg-muted rounded-full p-2">
            <span className="material-icons text-blue-400">trending_up</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-foreground">By Strategy</span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-muted mt-1">
              {simpleCount > 0 && (
                <div 
                  style={{ width: `${(simpleCount / opportunities.length) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                ></div>
              )}
              {triangularCount > 0 && (
                <div 
                  style={{ width: `${(triangularCount / opportunities.length) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-400"
                ></div>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{simpleCount} Simple</span>
              <span>{triangularCount} Triangular</span>
            </div>
          </div>
        </div>
      </div>

      {/* Highest Profit Card */}
      <div className="card p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Highest Profit</p>
            <p className="text-2xl font-semibold font-mono text-green-500">
              {highestProfitOpp 
                ? `${parseFloat(highestProfitOpp.profitPercentage.toString()).toFixed(2)}%` 
                : '0.00%'}
            </p>
          </div>
          <div className="bg-muted rounded-full p-2">
            <span className="material-icons text-green-500">payments</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-col">
            {highestProfitOpp && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-foreground">{highestProfitOpp.assetPair}</span>
                  <span className="text-green-500 font-mono">
                    {parseFloat(highestProfitOpp.profitPercentage.toString()).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">
                    {highestProfitOpp.buyExchange} → {highestProfitOpp.sellExchange}
                  </span>
                  <span className="text-muted-foreground">{highestProfitOpp.strategy}</span>
                </div>
                {secondHighestProfitOpp && (
                  <>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground">{secondHighestProfitOpp.assetPair}</span>
                      <span className="text-green-500 font-mono">
                        {parseFloat(secondHighestProfitOpp.profitPercentage.toString()).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">
                        {secondHighestProfitOpp.buyExchange} → {secondHighestProfitOpp.sellExchange}
                      </span>
                      <span className="text-muted-foreground">{secondHighestProfitOpp.strategy}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 24h Statistics Card */}
      <div className="card p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">24h Statistics</p>
            <p className="text-2xl font-semibold font-mono">
              {stats ? stats.totalOpportunities : '0'}
            </p>
          </div>
          <div className="bg-muted rounded-full p-2">
            <span className="material-icons text-blue-400">insights</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-xs">
              <span className="text-foreground">Total opportunities</span>
              <span className="font-mono">{stats ? stats.totalOpportunities : '0'}</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-foreground">Avg. profit</span>
              <span className="font-mono text-green-500">
                {stats ? `${parseFloat(stats.avgProfit.toString()).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-foreground">Max. profit</span>
              <span className="font-mono text-green-500">
                {stats ? `${parseFloat(stats.maxProfit.toString()).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-foreground">Success rate</span>
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
