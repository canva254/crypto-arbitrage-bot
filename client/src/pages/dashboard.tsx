import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import StatusPanel from '@/components/dashboard/status-panel';
import OpportunitiesTable from '@/components/dashboard/opportunities-table';
import OpportunityDetails from '@/components/dashboard/opportunity-details';
import ChartsPanel from '@/components/dashboard/charts-panel';
import { ApiKeysManager } from '@/components/dashboard/api-keys-manager';
import { TradeExecutor } from '@/components/dashboard/trade-executor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Opportunity } from '@shared/schema';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [minProfit, setMinProfit] = useState(0.5); // 0.5% default
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  // Fetch exchanges data
  const { data: exchanges, isLoading: isLoadingExchanges } = useQuery({
    queryKey: ['/api/exchanges'],
  });

  // Fetch opportunities data with the refresh interval
  const { 
    data: opportunities, 
    isLoading: isLoadingOpportunities,
    error: opportunitiesError,
    refetch: refetchOpportunities
  } = useQuery({
    queryKey: ['/api/opportunities', { minProfit, strategy: selectedStrategy }],
    refetchInterval: refreshInterval,
  });

  // Fetch stats data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats/24h'],
    refetchInterval: refreshInterval,
  });

  // Manually refresh data
  const handleRefresh = () => {
    refetchOpportunities();
  };

  // Select an opportunity for details view
  const handleSelectOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  // Select the first opportunity when data loads if none is selected
  useEffect(() => {
    if (opportunities && opportunities.length > 0 && !selectedOpportunity) {
      setSelectedOpportunity(opportunities[0]);
    }
  }, [opportunities, selectedOpportunity]);

  const [activeTab, setActiveTab] = useState('monitoring');
  
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          refreshRate={refreshInterval}
          setRefreshRate={setRefreshInterval}
          minProfit={minProfit}
          setMinProfit={setMinProfit}
          strategy={selectedStrategy}
          setStrategy={setSelectedStrategy}
          onRefresh={handleRefresh}
        />
        
        <main className="flex-1 overflow-y-auto p-4 bg-background">
          <StatusPanel 
            exchanges={exchanges || []} 
            opportunities={opportunities || []} 
            stats={stats}
            isLoading={isLoadingExchanges || isLoadingStats}
          />
          
          <Tabs defaultValue="monitoring" className="w-full mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
            </TabsList>
            
            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <div className="col-span-1 xl:col-span-2">
                  <OpportunitiesTable 
                    opportunities={opportunities || []} 
                    isLoading={isLoadingOpportunities}
                    error={opportunitiesError}
                    selectedOpportunityId={selectedOpportunity?.id}
                    onSelectOpportunity={handleSelectOpportunity}
                  />
                </div>
                
                <div className="col-span-1">
                  <OpportunityDetails 
                    opportunity={selectedOpportunity}
                    isLoading={isLoadingOpportunities} 
                  />
                </div>
              </div>
              
              <ChartsPanel opportunities={opportunities || []} />
            </TabsContent>
            
            {/* Execution Tab */}
            <TabsContent value="execution" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <ApiKeysManager />
                </div>
                <div className="col-span-1">
                  <TradeExecutor />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
