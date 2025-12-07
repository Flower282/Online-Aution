import { useState } from "react";
import { X, User, Package, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { CountdownTimer } from "./CountdownTimer";
import { BidHistory } from "./BidHistory";
import { Alert, AlertDescription } from "./ui/alert";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Auction } from "./AuctionCard";

interface AuctionDetailProps {
  auction: Auction;
  onClose: () => void;
  bids: Array<{ id: string; bidder: string; amount: number; time: Date }>;
  onPlaceBid: (amount: number) => void;
}

export function AuctionDetail({ auction, onClose, bids, onPlaceBid }: AuctionDetailProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  
  const minimumBid = auction.currentBid + 50;
  const suggestedBids = [
    minimumBid,
    minimumBid + 100,
    minimumBid + 250,
    minimumBid + 500
  ];

  const handleBidSubmit = () => {
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount)) {
      setError("Por favor ingresa un monto válido");
      return;
    }
    
    if (amount < minimumBid) {
      setError(`La puja mínima es $${minimumBid.toLocaleString()}`);
      return;
    }
    
    onPlaceBid(amount);
    setBidAmount("");
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-background rounded-lg shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background">
            <h2>Detalles de la subasta</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Left column - Images and description */}
            <div className="space-y-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <ImageWithFallback
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3>Descripción</h3>
                  <p className="text-muted-foreground mt-2">
                    {auction.description}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Este artículo está en excelente condición y ha sido cuidadosamente verificado. 
                    Incluye garantía del vendedor y autenticidad verificada. La subasta finaliza 
                    automáticamente cuando el temporizador llegue a cero.
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Condición</p>
                      <p>{auction.condition || "Excelente"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Garantía</p>
                      <p>Verificado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Vendedor</p>
                      <p>{auction.seller}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Categoría</p>
                      <p>{auction.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Bidding */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary">{auction.category}</Badge>
                <h2 className="mt-2">{auction.title}</h2>
              </div>
              
              <div className="p-6 rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Puja actual</span>
                  <span className="text-3xl font-medium text-primary">
                    ${auction.currentBid.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {auction.totalBids} puja{auction.totalBids !== 1 ? 's' : ''}
                  </span>
                  <span className="text-muted-foreground">
                    Precio inicial: ${auction.startingBid.toLocaleString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Tiempo restante</span>
                  <CountdownTimer endTime={auction.endTime} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Tu puja (mínimo ${minimumBid.toLocaleString()})
                  </label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(e.target.value);
                          setError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleBidSubmit();
                          }
                        }}
                        placeholder={minimumBid.toString()}
                        className="pl-7"
                      />
                    </div>
                    <Button onClick={handleBidSubmit} className="px-8">
                      Pujar
                    </Button>
                  </div>
                  {error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Pujas rápidas</span>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedBids.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => {
                          setBidAmount(amount.toString());
                          setError("");
                        }}
                      >
                        ${amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <BidHistory bids={bids} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}