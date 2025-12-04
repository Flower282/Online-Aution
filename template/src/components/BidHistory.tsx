import { User } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface Bid {
  id: string;
  bidder: string;
  amount: number;
  time: Date;
}

interface BidHistoryProps {
  bids: Bid[];
}

export function BidHistory({ bids }: BidHistoryProps) {
  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  return (
    <div className="space-y-3">
      <h3>Historial de pujas</h3>
      <ScrollArea className="h-[300px] rounded-lg border p-4">
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Aún no hay pujas</p>
            <p className="text-sm">¡Sé el primero en pujar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid, index) => (
              <div 
                key={bid.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{bid.bidder}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(bid.time)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${bid.amount.toLocaleString()}</p>
                  {index === 0 && (
                    <span className="text-xs text-primary">Puja más alta</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}