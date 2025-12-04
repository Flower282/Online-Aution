import { Link } from "react-router";
import { Heart, TrendingUp, Gift, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CountdownTimer } from "./CountdownTimer";

export default function AuctionCard({ auction, onClick }) {
  const timeLeft = auction.timeLeft || 0;
  const sellerName = auction?.sellerName || auction?.seller?.name;
  const isSellerInactive = auction?.sellerActive === false || sellerName === "Tài khoản bị vô hiệu hóa";
  const isEnded = timeLeft <= 0;
  const currentPrice = auction.currentPrice || auction.startingPrice;
  const startingPrice = auction.startingPrice;
  const bidIncrease = startingPrice > 0 ? ((currentPrice - startingPrice) / startingPrice) * 100 : 0;

  // Calculate end time for countdown
  const endTime = new Date(Date.now() + timeLeft);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-2 border-red-200 hover:border-red-400 bg-gradient-to-br from-white to-red-50">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-100" onClick={handleClick}>
        {/* Christmas lights decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 via-red-700 to-red-500 christmas-sparkle"></div>

        <img
          src={auction.itemPhoto || "https://picsum.photos/400"}
          alt={auction.itemName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Sparkle effect */}
        <Sparkles className="absolute top-4 right-4 h-5 w-5 text-yellow-500 animate-pulse" />

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-red-100/80 backdrop-blur hover:bg-red-200 text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            // Add to favorites functionality
          }}
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg">
          🎅 {auction.itemCategory}
        </Badge>
        {isEnded && (
          <Badge className="absolute bottom-2 left-2 bg-gray-600 text-white">
            ❄️ Đã kết thúc
          </Badge>
        )}
        {!isEnded && isSellerInactive && (
          <Badge className="absolute bottom-2 left-2 bg-destructive text-white">
            ⚠️ Không khả dụng
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3 bg-white/80 backdrop-blur" onClick={handleClick}>
        <div>
          <h3 className="line-clamp-1 text-red-900">{auction.itemName}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{auction.itemDescription}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-red-600 font-medium">🎄 Giá hiện tại</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
                ${currentPrice?.toLocaleString()}
              </span>
              {bidIncrease > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-semibold">+{bidIncrease.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Gift className="h-3 w-3" />
              {auction.bidsCount || 0} lượt đấu giá
            </span>
            {!isEnded ? (
              <CountdownTimer endTime={endTime} compact />
            ) : (
              <span className="text-gray-500">❄️ Đã kết thúc</span>
            )}
          </div>
        </div>

        <Link to={`/auction/${auction._id}`}>
          <Button
            className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={(e) => {
              e.stopPropagation();
            }}
            disabled={isSellerInactive && !isEnded}
          >
            {isEnded ? '🎁 Xem kết quả' : isSellerInactive ? '⚠️ Không khả dụng' : '❤️ Đấu giá ngay'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
