import { useState, useEffect, useRef } from 'react';
import { Opportunity } from '@shared/schema';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  TimeScale 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartsPanelProps {
  opportunities: Opportunity[];
}

export default function ChartsPanel({ opportunities }: ChartsPanelProps) {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  
  // Get unique pairs from opportunities
  const uniquePairs = Array.from(new Set(opportunities.map(o => o.assetPair)));
  
  // Fetch historical profit data
  const { data: profitHistory, isLoading: isLoadingProfitHistory } = useQuery({
    queryKey: ['/api/history/profit', { pair: selectedPair }],
  });
  
  // Fetch exchange price comparison data
  const { data: priceComparison, isLoading: isLoadingPriceComparison } = useQuery({
    queryKey: ['/api/history/prices', { pair: selectedPair }],
  });

  // Prepare chart data for profit history
  const profitChartData = {
    labels: profitHistory ? profitHistory.timestamps || [] : [],
    datasets: [
      {
        label: 'Profit %',
        data: profitHistory ? profitHistory.profits || [] : [],
        borderColor: 'rgb(56, 189, 248)',  // Light blue
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Prepare chart data for price comparison
  const priceComparisonData = {
    labels: priceComparison ? priceComparison.timestamps || [] : [],
    datasets: priceComparison && priceComparison.exchanges 
      ? priceComparison.exchanges.map((exchange: any, index: number) => ({
          label: exchange.name,
          data: exchange.prices,
          borderColor: index === 0 ? 'rgb(56, 189, 248)' : index === 1 ? 'rgb(244, 114, 182)' : 'rgb(34, 197, 94)',  // Blue, Pink, Green
          backgroundColor: 'transparent',
          tension: 0.2,
        })) 
      : []
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          tooltipFormat: 'MMM d, HH:mm'
        },
        grid: {
          color: 'rgba(100, 116, 139, 0.2)'
        },
        ticks: {
          color: 'rgb(148, 163, 184)'
        }
      },
      y: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)'
        },
        ticks: {
          color: 'rgb(148, 163, 184)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(148, 163, 184)'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1
      }
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Profit Opportunities (24h)</h3>
          <select 
            className="bg-background text-foreground text-sm rounded-md p-1 border border-input focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
          >
            <option value="all">All pairs</option>
            {uniquePairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
        <div className="h-64 w-full">
          {isLoadingProfitHistory ? (
            <div className="bg-muted rounded-lg h-full w-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="material-icons text-4xl mb-2">hourglass_empty</span>
                <p>Loading profit history data...</p>
              </div>
            </div>
          ) : !profitHistory || (profitHistory.profits && profitHistory.profits.length === 0) ? (
            <div className="bg-muted rounded-lg h-full w-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="material-icons text-4xl mb-2">timeline</span>
                <p>No profit history data available</p>
                <p className="text-sm">Check back later for updates</p>
              </div>
            </div>
          ) : (
            <Line data={profitChartData} options={chartOptions} />
          )}
        </div>
      </div>

      <div className="card p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Exchange Price Comparison</h3>
          <select 
            className="bg-background text-foreground text-sm rounded-md p-1 border border-input focus:outline-none focus:ring-1 focus:ring-primary"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
          >
            {uniquePairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>
        <div className="h-64 w-full">
          {isLoadingPriceComparison ? (
            <div className="bg-muted rounded-lg h-full w-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="material-icons text-4xl mb-2">hourglass_empty</span>
                <p>Loading price comparison data...</p>
              </div>
            </div>
          ) : !priceComparison || (priceComparison.exchanges && priceComparison.exchanges.length === 0) ? (
            <div className="bg-muted rounded-lg h-full w-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="material-icons text-4xl mb-2">stacked_line_chart</span>
                <p>Exchange price comparison chart</p>
                <p className="text-sm">No price data available</p>
              </div>
            </div>
          ) : (
            <Line data={priceComparisonData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
