import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  refreshRate: number;
  setRefreshRate: (rate: number) => void;
  minProfit: number;
  setMinProfit: (profit: number) => void;
  strategy: string;
  setStrategy: (strategy: string) => void;
  onRefresh: () => void;
}

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen,
  refreshRate,
  setRefreshRate,
  minProfit,
  setMinProfit,
  strategy,
  setStrategy,
  onRefresh
}: HeaderProps) {
  const { toast } = useToast();

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = () => {
    onRefresh();
    toast({
      title: "Refreshing data",
      description: "Fetching latest arbitrage opportunities",
      duration: 2000,
    });
  };

  const handleRefreshRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseInt(e.target.value);
    setRefreshRate(newRate);
    toast({
      title: "Refresh rate updated",
      description: `Data will refresh every ${newRate / 1000} seconds`,
      duration: 2000,
    });
  };

  const handleMinProfitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMinProfit(parseFloat(e.target.value));
  };

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrategy(e.target.value);
  };

  return (
    <header className="bg-surface border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white"
            type="button"
            onClick={handleToggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          <h2 className="text-lg font-medium ml-2">Arbitrage Dashboard</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search opportunities..." 
              className="bg-background text-gray-300 text-sm rounded-md py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="material-icons absolute left-3 top-2 text-gray-400">search</span>
          </div>

          <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-surface2" type="button">
            <span className="material-icons">notifications</span>
          </button>
          
          <button 
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-surface2" 
            type="button"
            onClick={handleRefresh}
          >
            <span className="material-icons">refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-400">Refresh rate:</span>
          <select 
            className="bg-background text-white text-sm rounded-md p-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
            value={refreshRate}
            onChange={handleRefreshRateChange}
          >
            <option value="5000">5s</option>
            <option value="10000">10s</option>
            <option value="30000">30s</option>
            <option value="60000">1m</option>
            <option value="300000">5m</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-400">Strategy:</span>
          <select 
            className="bg-background text-white text-sm rounded-md p-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
            value={strategy}
            onChange={handleStrategyChange}
          >
            <option value="all">All strategies</option>
            <option value="simple">Simple arbitrage</option>
            <option value="triangular">Triangular arbitrage</option>
          </select>
        </div>

        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-400">Min profit:</span>
          <select 
            className="bg-background text-white text-sm rounded-md p-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
            value={minProfit.toString()}
            onChange={handleMinProfitChange}
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1">1%</option>
            <option value="2">2%</option>
            <option value="5">5%</option>
          </select>
        </div>
      </div>
    </header>
  );
}
