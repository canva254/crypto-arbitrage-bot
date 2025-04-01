import { useState } from 'react';
import { Opportunity, RiskLevelEnum, StrategyTypeEnum } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: unknown;
  selectedOpportunityId?: number;
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export default function OpportunitiesTable({ 
  opportunities, 
  isLoading, 
  error, 
  selectedOpportunityId,
  onSelectOpportunity 
}: OpportunitiesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Calculate pagination
  const totalPages = Math.ceil(opportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = opportunities.slice(startIndex, endIndex);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleSelectPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="card rounded-lg">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Live Arbitrage Opportunities</h3>
        <div className="flex items-center">
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" type="button">
            <span className="material-icons text-sm">filter_list</span>
          </button>
          <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted ml-2" type="button">
            <span className="material-icons text-sm">more_vert</span>
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <span className="material-icons text-error text-4xl mb-2">error_outline</span>
          <p className="text-lg font-medium">Error loading opportunities</p>
          <p className="text-sm text-gray-400">Please try refreshing or check your connection</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-8 text-center">
          <span className="material-icons text-gray-400 text-4xl mb-2">search_off</span>
          <p className="text-lg font-medium">No arbitrage opportunities found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or waiting for market conditions to change</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Pair</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Route</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {currentItems.map((opportunity) => (
                  <tr 
                    key={opportunity.id}
                    className={`hover:bg-muted cursor-pointer ${
                      selectedOpportunityId === opportunity.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onSelectOpportunity(opportunity)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-semibold">{opportunity.assetPair.split('/')[0]}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">{opportunity.assetPair}</div>
                          <div className="text-xs text-muted-foreground">
                            {opportunity.timestamp 
                              ? `Updated ${formatDistanceToNow(new Date(opportunity.timestamp), { addSuffix: true })}`
                              : 'Recently updated'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        opportunity.strategy.toLowerCase() === StrategyTypeEnum.SIMPLE 
                          ? 'bg-primary/20 text-primary'
                          : 'bg-blue-400/20 text-blue-400'
                      }`}>
                        {opportunity.strategy}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center flex-wrap">
                        {opportunity.route}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-500 font-mono">
                        +{parseFloat(opportunity.profitPercentage.toString()).toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ≈ ${parseFloat(opportunity.estimatedProfit.toString()).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      ${parseFloat(opportunity.volume.toString()).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        opportunity.risk.toLowerCase() === RiskLevelEnum.LOW
                          ? 'bg-green-500/20 text-green-500'
                          : opportunity.risk.toLowerCase() === RiskLevelEnum.MEDIUM
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                      }`}>
                        {opportunity.risk.charAt(0).toUpperCase() + opportunity.risk.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOpportunity(opportunity);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(opportunities.length, startIndex + 1)}-{Math.min(endIndex, opportunities.length)} of {opportunities.length} opportunities
            </div>
            <div className="flex items-center">
              <button 
                className={`p-1 rounded-md ${currentPage === 1 ? 'bg-muted text-muted-foreground' : 'bg-muted text-foreground hover:bg-muted/80'} flex items-center justify-center h-8 w-8`}
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">chevron_left</span>
              </button>
              <div className="flex mx-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    className={`p-1 rounded-md ${
                      currentPage === i + 1 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    } flex items-center justify-center h-8 w-8 ${i > 0 ? 'ml-1' : ''}`}
                    onClick={() => handleSelectPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                className={`p-1 rounded-md ${currentPage === totalPages ? 'bg-muted text-muted-foreground' : 'bg-muted text-foreground hover:bg-muted/80'} flex items-center justify-center h-8 w-8`}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
