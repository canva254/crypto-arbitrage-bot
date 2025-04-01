import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Exchange } from '@shared/schema';
import { Loader, KeySquare, CheckCircle, AlertCircle, LockKeyhole } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

/**
 * API Keys Manager Component
 * 
 * This component allows users to manage API keys for exchanges 
 * and blockchain wallets for actual trading execution
 */
export function ApiKeysManager() {
  const { toast } = useToast();
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiPassphrase, setApiPassphrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  
  // Fetch exchanges
  const { 
    data: exchanges = [], 
    isLoading: isLoadingExchanges,
    isError: isExchangesError,
  } = useQuery({
    queryKey: ['/api/exchanges'],
    select: (data: Exchange[]) => data.sort((a, b) => a.name.localeCompare(b.name)),
  });
  
  // Mutation for updating API keys
  const updateApiKeysMutation = useMutation({
    mutationFn: async ({ exchangeId, keys }: { 
      exchangeId: number, 
      keys: { 
        apiKey: string; 
        apiSecret: string; 
        additionalParams?: { [key: string]: string } 
      } 
    }) => {
      return apiRequest(`/api/exchanges/${exchangeId}/keys`, 'PATCH', keys);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchanges'] });
      toast({
        title: 'API Keys Updated',
        description: 'Your API keys have been securely updated.',
        variant: 'default',
      });
      
      // Reset form
      setApiKey('');
      setApiSecret('');
      setApiPassphrase('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating API Keys',
        description: error.message || 'Failed to update API keys. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const handleUpdateApiKeys = () => {
    if (!selectedExchange) return;
    
    // Basic validation
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast({
        title: 'Missing API Keys',
        description: 'Both API key and secret are required.',
        variant: 'destructive',
      });
      return;
    }
    
    // Prepare keys object based on exchange name
    let keys = {
      apiKey,
      apiSecret,
    };
    
    // Add passphrase for exchanges that require it
    if (['Coinbase', 'Kucoin'].includes(selectedExchange.name) && apiPassphrase) {
      keys = {
        ...keys,
        additionalParams: { password: apiPassphrase }
      };
    }
    
    // Update API keys
    updateApiKeysMutation.mutate({ 
      exchangeId: selectedExchange.id, 
      keys 
    });
  };
  
  // Filter CEXes and DEXes
  const cexes = exchanges.filter(e => e.exchangeType === 'cex');
  const dexes = exchanges.filter(e => e.exchangeType === 'dex');
  
  // Determine if selected exchange requires a passphrase
  const requiresPassphrase = selectedExchange && 
    ['Coinbase', 'Kucoin'].includes(selectedExchange.name);
    
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-primary">API Keys Manager</CardTitle>
        <CardDescription>
          Configure exchange API keys and blockchain wallets to enable real trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cex" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cex">Centralized Exchanges</TabsTrigger>
            <TabsTrigger value="dex">Decentralized Exchanges</TabsTrigger>
          </TabsList>
          
          {/* CEX Content */}
          <TabsContent value="cex">
            {isLoadingExchanges ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : isExchangesError ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load exchanges. Please try again.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {cexes.map(exchange => (
                    <Button
                      key={exchange.id}
                      variant={selectedExchange?.id === exchange.id ? "default" : "outline"}
                      className="h-20 justify-start relative overflow-hidden"
                      onClick={() => {
                        setSelectedExchange(exchange);
                        setApiKey('');
                        setApiSecret('');
                        setApiPassphrase('');
                      }}
                    >
                      <div className="text-left">
                        <div className="font-bold">{exchange.name}</div>
                        <div className="text-sm opacity-85">
                          {exchange.apiKey ? (
                            <span className="flex items-center text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              API Keys Set
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground">
                              <KeySquare className="h-3 w-3 mr-1" />
                              No API Keys
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className={`absolute top-0 right-0 h-2 w-2 m-2 rounded-full ${
                        exchange.status === 'online' ? 'bg-green-500' :
                        exchange.status === 'offline' ? 'bg-red-500' :
                        exchange.status === 'rate_limited' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                    </Button>
                  ))}
                </div>
                
                {selectedExchange && (
                  <div className="bg-card rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Configure {selectedExchange.name} API Keys
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          placeholder="Enter API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          type="password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="apiSecret">API Secret</Label>
                        <Input
                          id="apiSecret"
                          placeholder="Enter API secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          type="password"
                        />
                      </div>
                      
                      {requiresPassphrase && (
                        <div className="space-y-2">
                          <Label htmlFor="apiPassphrase">API Passphrase</Label>
                          <Input
                            id="apiPassphrase"
                            placeholder="Enter API passphrase"
                            value={apiPassphrase}
                            onChange={(e) => setApiPassphrase(e.target.value)}
                            type="password"
                          />
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleUpdateApiKeys}
                        disabled={updateApiKeysMutation.isPending}
                        className="w-full"
                      >
                        {updateApiKeysMutation.isPending ? (
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <LockKeyhole className="h-4 w-4 mr-2" />
                        )}
                        Save API Keys
                      </Button>
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        Your API keys are stored securely and are used only for trading operations. 
                        Make sure to set appropriate permissions on your exchange account.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* DEX Content */}
          <TabsContent value="dex">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Blockchain Wallet Configuration
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key (Ethereum-compatible)</Label>
                  <Input
                    id="privateKey"
                    placeholder="Enter wallet private key (0x...)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    type="password"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used for DEX trading across Ethereum, Polygon, BSC, and other EVM chains.
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <LockKeyhole className="h-4 w-4 mr-2" />
                      Set Private Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Security Warning</DialogTitle>
                      <DialogDescription>
                        You're about to set a private key for blockchain operations. This is a sensitive action that should be performed with caution.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        For production systems, we recommend:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                        <li>Using a dedicated wallet with limited funds</li>
                        <li>Implementing proper security measures</li>
                        <li>Starting with small amounts for testing</li>
                        <li>Considering hardware wallets or more secure approaches</li>
                      </ul>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button className="bg-primary text-primary-foreground">
                        I Understand, Set Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Supported Networks</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {dexes.map(dex => (
                      <div key={dex.id} className="text-sm">
                        • {dex.name} ({dex.network})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Securely execute arbitrage trades across exchanges and blockchains
        </p>
      </CardFooter>
    </Card>
  );
}