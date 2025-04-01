import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Opportunity } from '@shared/schema';
import { AlertTriangle, Loader, ArrowRightCircle, CheckCircle, Ban, Triangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

// Result type from execution
interface ExecutionResult {
  success: boolean;
  opportunityId: number;
  strategy: string;
  transactionHashes?: string[];
  profit?: string;
  error?: string;
  completionTime?: number;
}

/**
 * Trade Executor Component
 * 
 * This component allows users to execute arbitrage opportunities
 */
export function TradeExecutor() {
  const { toast } = useToast();
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [positionSize, setPositionSize] = useState('1000');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [minProfit, setMinProfit] = useState('0.5');
  
  // Fetch opportunities with filters
  const { 
    data: opportunities = [], 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/opportunities', { minProfit, strategy: selectedStrategy }],
    queryFn: () => apiRequest(`/api/opportunities?minProfit=${minProfit}&strategy=${selectedStrategy}`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Get selected opportunity
  const selectedOpportunity = selectedOpportunityId ? 
    opportunities.find(o => o.id === selectedOpportunityId) : null;
  
  // Execute arbitrage mutation
  const executeMutation = useMutation({
    mutationFn: async (opportunityId: number) => {
      setIsExecuting(true);
      return apiRequest(`/api/opportunities/${opportunityId}/execute`, 'POST');
    },
    onSuccess: (data: ExecutionResult) => {
      setExecutionResult(data);
      setIsExecuting(false);
      
      // Show success or error toast based on result
      if (data.success) {
        toast({
          title: 'Arbitrage Executed Successfully',
          description: `Profit: ${formatProfit(data.profit || '0')}`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Arbitrage Execution Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
      
      // Refresh opportunities
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
    },
    onError: (error: any) => {
      setIsExecuting(false);
      setExecutionResult(null);
      
      toast({
        title: 'Execution Error',
        description: error.message || 'Failed to execute arbitrage',
        variant: 'destructive',
      });
    }
  });
  
  // Format profit with currency symbol and 2 decimal places
  const formatProfit = (profit: string | number) => {
    const profitNum = typeof profit === 'string' ? parseFloat(profit) : profit;
    return `$${profitNum.toFixed(2)}`;
  };
  
  // Format percentage with % sign and 2 decimal places
  const formatPercentage = (percentage: string | number) => {
    const percentNum = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    return `${percentNum.toFixed(2)}%`;
  };
  
  // Get badge color based on risk level
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Handle executing an arbitrage opportunity
  const handleExecute = () => {
    if (!selectedOpportunityId) return;
    executeMutation.mutate(selectedOpportunityId);
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-primary">Trade Executor</CardTitle>
            <CardDescription>
              Execute real arbitrage trades across exchanges and blockchain networks
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Strategy Type</label>
            <Select 
              value={selectedStrategy} 
              onValueChange={setSelectedStrategy}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="simple">Simple Arbitrage</SelectItem>
                <SelectItem value="triangular">Triangular Arbitrage</SelectItem>
                <SelectItem value="cross-dex">Cross-DEX Arbitrage</SelectItem>
                <SelectItem value="flash-loan">Flash Loan Arbitrage</SelectItem>
                <SelectItem value="statistical">Statistical Arbitrage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Min Profit (%)</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={minProfit}
              onChange={(e) => setMinProfit(e.target.value)}
            />
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Position Size ($)</label>
            <Input
              type="number"
              min="100"
              step="100"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
            />
          </div>
        </div>
        
        {/* Opportunities Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Opportunities</h3>
            <p className="text-muted-foreground">
              There was a problem fetching arbitrage opportunities. Please try again.
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Triangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Opportunities Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              There are currently no profitable arbitrage opportunities that match your criteria.
              Try adjusting your filters or waiting for market conditions to change.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableCaption>Available arbitrage opportunities for execution</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Execute</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opportunity: Opportunity) => (
                  <TableRow 
                    key={opportunity.id}
                    className={selectedOpportunityId === opportunity.id ? 'bg-muted/50' : ''}
                  >
                    <TableCell>{opportunity.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {opportunity.strategy}
                      </Badge>
                    </TableCell>
                    <TableCell>{opportunity.assetPair}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {opportunity.route}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatProfit(opportunity.estimatedProfit)}
                      </span>
                      <span className="text-xs block text-muted-foreground">
                        {formatPercentage(opportunity.profitPercentage)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getRiskBadgeColor(opportunity.risk)} capitalize`}>
                        {opportunity.risk}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedOpportunityId(opportunity.id)}
                          >
                            <ArrowRightCircle className="h-4 w-4 mr-1" />
                            Trade
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Execute Arbitrage Trade</DialogTitle>
                            <DialogDescription>
                              Review and confirm trade execution details
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedOpportunity && (
                            <div className="py-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Trade Details</h4>
                                  <div className="bg-muted p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div className="font-medium">Strategy:</div>
                                      <div className="capitalize">{selectedOpportunity.strategy}</div>
                                      
                                      <div className="font-medium">Asset Pair:</div>
                                      <div>{selectedOpportunity.assetPair}</div>
                                      
                                      <div className="font-medium">Route:</div>
                                      <div className="truncate">{selectedOpportunity.route}</div>
                                      
                                      <div className="font-medium">Estimated Profit:</div>
                                      <div className="text-green-600">{formatProfit(selectedOpportunity.estimatedProfit)}</div>
                                      
                                      <div className="font-medium">Risk Level:</div>
                                      <div className="capitalize">{selectedOpportunity.risk}</div>
                                      
                                      <div className="font-medium">Exchange Fees:</div>
                                      <div>{selectedOpportunity.exchangeFees || 'Not available'}</div>
                                      
                                      <div className="font-medium">Gas Cost (if DEX):</div>
                                      <div>{selectedOpportunity.estimatedGasCost || 'N/A'}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex">
                                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                                  <div className="text-sm text-amber-800">
                                    <p className="font-medium">Trade Warning</p>
                                    <p className="mt-1">You are about to execute a real trade using actual funds. 
                                    Make sure you've properly set up API keys and understand the risks involved.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">
                                <Ban className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button 
                              onClick={handleExecute}
                              disabled={isExecuting}
                            >
                              {isExecuting ? (
                                <>
                                  <Loader className="h-4 w-4 animate-spin mr-1" />
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Execute Trade
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Execution Result Dialog */}
        {executionResult && (
          <Dialog open={!!executionResult} onOpenChange={(open) => !open && setExecutionResult(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {executionResult.success ? 'Arbitrage Executed Successfully' : 'Execution Failed'}
                </DialogTitle>
                <DialogDescription>
                  {executionResult.success 
                    ? 'Your arbitrage trade was successfully executed' 
                    : 'There was a problem executing the arbitrage trade'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {executionResult.success ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-green-800">
                        {formatProfit(executionResult.profit || '0')}
                      </h3>
                      <p className="text-green-700">Profit Realized</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Execution Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Strategy:</div>
                        <div className="capitalize">{executionResult.strategy}</div>
                        
                        <div className="font-medium">Opportunity ID:</div>
                        <div>{executionResult.opportunityId}</div>
                        
                        <div className="font-medium">Execution Time:</div>
                        <div>{executionResult.completionTime ? `${(executionResult.completionTime / 1000).toFixed(2)} seconds` : 'Unknown'}</div>
                      </div>
                    </div>
                    
                    {executionResult.transactionHashes && executionResult.transactionHashes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Transaction Hashes</h4>
                        <div className="space-y-2">
                          {executionResult.transactionHashes.map((hash, index) => (
                            <div key={index} className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                              {hash}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-md text-center">
                      <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-red-800">Execution Failed</h3>
                      <p className="text-red-700">{executionResult.error || 'An unknown error occurred'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Execution Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Strategy:</div>
                        <div className="capitalize">{executionResult.strategy}</div>
                        
                        <div className="font-medium">Opportunity ID:</div>
                        <div>{executionResult.opportunityId}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setExecutionResult(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Executing trades requires valid API keys and wallet configuration
        </p>
      </CardFooter>
    </Card>
  );
}