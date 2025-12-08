import { Link } from "react-router";
import { Heart, TrendingUp, Gift, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { useState } from "react";
import { toggleLikeAuction } from "../api/auction";
import { toast } from "sonner";

export default function AuctionCard({ auction, onClick, onLikeUpdate }) {
  const timeLeft = auction.timeLeft || 0;
  const sellerName = auction?.sellerName || auction?.seller?.name;
  const isSellerInactive = auction?.sellerActive === false || sellerName === "Tài khoản bị vô hiệu hóa";
  const isEnded = timeLeft <= 0;
  const currentPrice = auction.currentPrice || auction.startingPrice;
  const startingPrice = auction.startingPrice;
  const bidIncrease = startingPrice > 0 ? ((currentPrice - startingPrice) / startingPrice) * 100 : 0;

  const [isLiked, setIsLiked] = useState(auction.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(auction.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Calculate end time for countdown
  const endTime = new Date(Date.now() + timeLeft);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const result = await toggleLikeAuction(auction._id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      if (onLikeUpdate) onLikeUpdate();
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast.error(error.message);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-2 border-red-200 hover:border-red-400 bg-gradient-to-br from-white to-red-50">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-100" onClick={handleClick}>
        {/* Christmas lights decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-700 to-red-500 christmas-sparkle"></div>

        <img
          src={auction.itemPhoto || "https://picsum.photos/400"}
          alt={auction.itemName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Sparkle effect */}
        <Sparkles className="absolute top-4 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-400 animate-pulse drop-shadow-lg" />

        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 backdrop-blur transition-all duration-300 ${
            isLiked 
              ? 'bg-red-500 hover:bg-red-600 text-white scale-110' 
              : 'bg-white/90 hover:bg-red-100 text-red-500'
          } shadow-lg hover:shadow-xl`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
        
        {likesCount > 0 && (
          <Badge className="absolute top-12 right-2 bg-white/95 text-red-600 border border-red-200 shadow-md">
            ❤️ {likesCount}
          </Badge>
        )}

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

      <CardContent className="p-5 space-y-4 bg-gradient-to-b from-white via-white to-red-50/30" onClick={handleClick}>
        <div>
          <h3 className="line-clamp-1 text-lg font-bold text-red-900 mb-1">{auction.itemName}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{auction.itemDescription}</p>
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-red-700 font-semibold flex items-center gap-1">
                🎄 Giá hiện tại
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-red-600 via-red-700 to-green-600 bg-clip-text text-transparent drop-shadow-sm">
                  ${currentPrice?.toLocaleString()}
                </span>
                {bidIncrease > 0 && (
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-bold text-green-700">+{bidIncrease.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 flex items-center gap-1.5 font-medium">
              <Gift className="h-4 w-4 text-red-500" />
              {auction.bidsCount || 0} lượt đấu giá
            </span>
            {!isEnded ? (
              <CountdownTimer endTime={endTime} compact />
            ) : (
              <span className="text-gray-500 font-medium">❄️ Đã kết thúc</span>
            )}
          </div>
        </div>

        <Link to={`/auction/${auction._id}`}>
          <Button
            className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] py-6 text-base"
            onClick={(e) => {
              e.stopPropagation();
            }}
            disabled={isSellerInactive && !isEnded}
          >
            {isEnded ? '🎁 Xem kết quả' : isSellerInactive ? '⚠️ Không khả dụng' : '🎅 Đấu giá ngay'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
