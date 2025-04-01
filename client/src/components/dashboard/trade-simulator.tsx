import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { COMMON_PAIRS } from '@/lib/exchanges';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema - validation
const tradeSimulationSchema = z.object({
  assetPair: z.string().min(1, {
    message: "Asset pair is required",
  }),
  buyExchange: z.string().min(1, {
    message: "Buy exchange is required",
  }),
  sellExchange: z.string().min(1, {
    message: "Sell exchange is required",
  }),
  initialAmount: z.string().min(1, {
    message: "Initial amount is required",
  }),
  useFlashLoan: z.boolean().default(false),
  useMevProtection: z.boolean().default(false),
  maxSlippage: z.string().optional(),
  gasPriority: z.enum(["low", "medium", "high"]).default("medium"),
  strategy: z.enum(["simple", "triangular", "cross_dex", "flash_loan", "statistical"]).default("simple"),
});

type TradeSimulationFormValues = z.infer<typeof tradeSimulationSchema>;

export function TradeSimulator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new-simulation");
  const [selectedSimulation, setSelectedSimulation] = useState<number | null>(null);

  // Fetch exchanges data
  const { data: exchanges, isLoading: isLoadingExchanges } = useQuery({
    queryKey: ['/api/exchanges'],
  });

  // Fetch existing simulations
  const { 
    data: simulations, 
    isLoading: isLoadingSimulations 
  } = useQuery({
    queryKey: ['/api/simulations'],
  });

  // Form setup with default values
  const form = useForm<TradeSimulationFormValues>({
    resolver: zodResolver(tradeSimulationSchema),
    defaultValues: {
      assetPair: "ETH/USDT",
      buyExchange: "",
      sellExchange: "",
      initialAmount: "1000",
      useFlashLoan: false,
      useMevProtection: false,
      maxSlippage: "1",
      gasPriority: "medium",
      strategy: "simple",
    },
  });

  // Create a new simulation
  const createMutation = useMutation({
    mutationFn: async (values: TradeSimulationFormValues) => {
      // Calculate additional fields for the simulation
      const tradedAmount = parseFloat(values.initialAmount) * 0.995; // 0.5% fee
      const exchangeFees = parseFloat(values.initialAmount) * 0.005; // 0.5% fee
      const gasFees = values.useFlashLoan ? "15" : "5"; // Higher gas for flash loans
      const flashLoanFees = values.useFlashLoan ? 
        (parseFloat(values.initialAmount) * 0.0009).toString() : // 0.09% for flash loan
        undefined;
      
      // Calculate a simulated profit (in reality would be fetched from exchange price data)
      const profitPercentage = (Math.random() * 2 + 0.5).toFixed(2); // 0.5% to 2.5%
      const profitLoss = (parseFloat(values.initialAmount) * parseFloat(profitPercentage) / 100).toFixed(2);
      
      const simulationData = {
        ...values,
        tradedAmount: tradedAmount.toString(),
        exchangeFees: exchangeFees.toString(),
        gasFees,
        flashLoanFees,
        profitLoss,
        profitPercentage,
        timestamp: new Date().toISOString(),
        status: "simulated"
      };
      
      return apiRequest('POST', '/api/simulations', simulationData);
    },
    onSuccess: () => {
      toast({
        title: "Simulation created",
        description: "Your trade simulation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
      setActiveTab("my-simulations");
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create simulation. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating simulation:", error);
    }
  });

  // Execute a simulation
  const executeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/simulations/${id}/execute`);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Trade executed",
        description: `Simulated trade executed with ${data?.success ? 'success' : 'failure'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
    },
    onError: (error) => {
      toast({
        title: "Execution failed",
        description: "Failed to execute the simulated trade. Please try again.",
        variant: "destructive",
      });
      console.error("Error executing simulation:", error);
    }
  });

  // Delete a simulation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/simulations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Simulation deleted",
        description: "The simulation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/simulations'] });
      setSelectedSimulation(null);
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete the simulation. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting simulation:", error);
    }
  });

  // Handle form submission
  async function onSubmit(values: TradeSimulationFormValues) {
    createMutation.mutate(values);
  }

  // Handle execution click
  function handleExecute(id: number) {
    executeMutation.mutate(id);
  }

  // Handle deletion click
  function handleDelete(id: number) {
    deleteMutation.mutate(id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulate Trade</CardTitle>
        <CardDescription>
          Test your arbitrage strategies without risking real assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="new-simulation">New Simulation</TabsTrigger>
            <TabsTrigger value="my-simulations">My Simulations</TabsTrigger>
          </TabsList>
          
          {/* New Simulation Tab */}
          <TabsContent value="new-simulation">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assetPair"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Pair</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset pair" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMON_PAIRS.map((pair) => (
                              <SelectItem key={pair} value={pair}>
                                {pair}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="initialAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Amount of the base asset to trade
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyExchange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy Exchange</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select buy exchange" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exchanges?.map((exchange) => (
                              <SelectItem key={exchange.id} value={exchange.name}>
                                {exchange.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sellExchange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sell Exchange</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sell exchange" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exchanges?.map((exchange) => (
                              <SelectItem key={exchange.id} value={exchange.name}>
                                {exchange.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple Arbitrage</SelectItem>
                            <SelectItem value="triangular">Triangular Arbitrage</SelectItem>
                            <SelectItem value="cross_dex">Cross-DEX Arbitrage</SelectItem>
                            <SelectItem value="flash_loan">Flash Loan Arbitrage</SelectItem>
                            <SelectItem value="statistical">Statistical Arbitrage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gasPriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gas Priority (for DEX)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gas priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maxSlippage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Slippage (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" max="5" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum allowed slippage (0-5%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="useFlashLoan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Use Flash Loan</FormLabel>
                          <FormDescription>
                            Use flash loans to increase position size
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="useMevProtection"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">MEV Protection</FormLabel>
                          <FormDescription>
                            Protect trades from MEV attacks
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending || isLoadingExchanges}
                >
                  {createMutation.isPending ? "Simulating..." : "Simulate Trade"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* My Simulations Tab */}
          <TabsContent value="my-simulations">
            {isLoadingSimulations ? (
              <div className="text-center py-4">Loading simulations...</div>
            ) : simulations && simulations.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                          Asset Pair
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                          Strategy
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                          Profit %
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {simulations.map((simulation) => (
                        <tr 
                          key={simulation.id}
                          className={`${selectedSimulation === simulation.id ? 'bg-muted/50' : ''}`}
                          onClick={() => setSelectedSimulation(selectedSimulation === simulation.id ? null : simulation.id)}
                        >
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {simulation.assetPair}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm capitalize">
                            {simulation.strategy?.replace(/_/g, ' ')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                            <span className={`${parseFloat(simulation.profitPercentage) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(simulation.profitPercentage).toFixed(2)}%
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
                              ${simulation.status === 'executed' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 
                                simulation.status === 'failed' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                                'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'}`}
                            >
                              {simulation.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecute(simulation.id);
                              }}
                              disabled={simulation.status === 'executed' || executeMutation.isPending}
                            >
                              Execute
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(simulation.id);
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Selected Simulation Details */}
                {selectedSimulation && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Simulation Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {simulations.filter(sim => sim.id === selectedSimulation).map(sim => (
                        <div key={sim.id} className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Asset Pair:</div>
                          <div>{sim.assetPair}</div>
                          
                          <div className="font-medium">Buy Exchange:</div>
                          <div>{sim.buyExchange}</div>
                          
                          <div className="font-medium">Sell Exchange:</div>
                          <div>{sim.sellExchange}</div>
                          
                          <div className="font-medium">Initial Amount:</div>
                          <div>{parseFloat(sim.initialAmount).toLocaleString()}</div>
                          
                          <div className="font-medium">Traded Amount:</div>
                          <div>{parseFloat(sim.tradedAmount).toLocaleString()}</div>
                          
                          <div className="font-medium">Exchange Fees:</div>
                          <div>{parseFloat(sim.exchangeFees).toLocaleString()}</div>
                          
                          <div className="font-medium">Gas Fees:</div>
                          <div>{parseFloat(sim.gasFees).toLocaleString()}</div>
                          
                          {sim.flashLoanFees && (
                            <>
                              <div className="font-medium">Flash Loan Fees:</div>
                              <div>{parseFloat(sim.flashLoanFees).toLocaleString()}</div>
                            </>
                          )}
                          
                          <div className="font-medium">Profit/Loss:</div>
                          <div className={`${parseFloat(sim.profitLoss) > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                            {parseFloat(sim.profitLoss).toLocaleString()}
                          </div>
                          
                          <div className="font-medium">Profit %:</div>
                          <div className={`${parseFloat(sim.profitPercentage) > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                            {parseFloat(sim.profitPercentage).toFixed(2)}%
                          </div>
                          
                          <div className="font-medium">Strategy:</div>
                          <div className="capitalize">{sim.strategy?.replace(/_/g, ' ')}</div>
                          
                          <div className="font-medium">Flash Loan:</div>
                          <div>{sim.useFlashLoan ? 'Yes' : 'No'}</div>
                          
                          <div className="font-medium">MEV Protection:</div>
                          <div>{sim.useMevProtection ? 'Yes' : 'No'}</div>
                          
                          <div className="font-medium">Date:</div>
                          <div>{new Date(sim.timestamp || '').toLocaleString()}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No simulations found. Create a new simulation to get started.</p>
                <Button onClick={() => setActiveTab("new-simulation")}>
                  Create New Simulation
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}