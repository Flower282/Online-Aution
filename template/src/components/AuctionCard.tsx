import { Heart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface Auction {
  id: string;
  title: string;
  description: string;
  image: string;
  currentBid: number;
  startingBid: number;
  totalBids: number;
  endTime: Date;
  category: string;
  seller: string;
  condition?: string;
}

interface AuctionCardProps {
  auction: Auction;
  onClick: () => void;
}

export function AuctionCard({ auction, onClick }: AuctionCardProps) {
  const bidIncrease = ((auction.currentBid - auction.startingBid) / auction.startingBid) * 100;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative aspect-square overflow-hidden bg-muted" onClick={onClick}>
        <ImageWithFallback
          src={auction.image}
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur text-foreground hover:bg-background/90">
          {auction.category}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3" onClick={onClick}>
        <div>
          <h3 className="line-clamp-1">{auction.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{auction.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Puja actual</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-medium text-primary">
                ${auction.currentBid.toLocaleString()}
              </span>
              {bidIncrease > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+{bidIncrease.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{auction.totalBids} puja{auction.totalBids !== 1 ? 's' : ''}</span>
            <CountdownTimer endTime={auction.endTime} compact />
          </div>
        </div>
        
        <Button className="w-full" onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}>
          Pujar ahora
        </Button>
      </CardContent>
    </Card>
  );
}