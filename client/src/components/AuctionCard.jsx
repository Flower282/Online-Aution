import { Link } from "react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toggleLikeAuction } from "../api/auction";
import { toast } from "sonner";
import { formatCurrency } from "../utils/formatCurrency";

export default function AuctionCard({ auction, onClick, onLikeUpdate }) {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.user?.role === "admin";

  const timeLeft = auction.timeLeft || 0;
  const sellerName = auction?.sellerName || auction?.seller?.name;
  const isSellerInactive = auction?.sellerActive === false || sellerName === "Tài khoản bị vô hiệu hóa";
  const isEnded = timeLeft <= 0;
  const currentPrice = auction.currentPrice || auction.startingPrice;

  // Check auction status
  const isPending = auction.status === 'pending';
  const isRejected = auction.status === 'rejected';

  const [isLiked, setIsLiked] = useState(auction.isLikedByUser || false);
  const [isLiking, setIsLiking] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;

    // Optimistic update
    setIsLiked(!isLiked);

    try {
      const result = await toggleLikeAuction(auction._id);
      setIsLiked(result.isLiked);
      if (onLikeUpdate) onLikeUpdate();
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      toast.error(error.message);
    } finally {
      setIsLiking(false);
    }
  };

  // Calculate price increase percentage
  const startingPrice = auction.startingPrice || 0;
  const priceIncrease = startingPrice > 0
    ? (((currentPrice - startingPrice) / startingPrice) * 100).toFixed(0)
    : 0;

  // Format time remaining
  const formatTimeLeft = (milliseconds) => {
    if (milliseconds <= 0) return '0d 00:00:00';
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Link to={`/auction/${auction._id}`} onClick={handleClick}>
      <div className={`bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border flex flex-col h-full ${isEnded
        ? 'border-gray-300 opacity-70 grayscale-[30%]'
        : 'border-gray-200 hover:border-emerald-300'
        }`}>
        {/* Image Container */}
        <div className="relative w-full h-36 overflow-hidden bg-gray-50 flex-shrink-0">
          <img
            src={auction.itemPhoto || "https://picsum.photos/400"}
            alt={auction.itemName}
            className={`w-full h-full object-contain transition-transform duration-300 ${isEnded ? 'opacity-60' : 'group-hover:scale-105'
              }`}
          />

          {/* Like Button - Hidden for admin */}
          {!isAdmin && (
            <button
              className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-300 ${isLiked
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-110'
                : 'bg-white/90 hover:bg-emerald-50 text-emerald-500'
                } shadow-md hover:shadow-lg`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Status Badges */}
          {isPending && !isEnded && (
            <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Pending
            </div>
          )}
          {isRejected && !isEnded && (
            <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Rejected
            </div>
          )}
          {isEnded && (
            <>
              {/* Overlay for ended auctions */}
              <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                <span className="bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
                  ĐÃ KẾT THÚC
                </span>
              </div>
            </>
          )}
          {!isEnded && !isPending && !isRejected && isSellerInactive && (
            <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Inactive
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 bg-emerald-50/30">
          {/* Title */}
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase line-clamp-1">
            {auction.itemName}
          </h3>

          {/* Price Section with Pink Background */}
          <div className="bg-emerald-50 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-gray-600">Giá hiện tại</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(currentPrice)}
              </span>
              {priceIncrease > 0 && (
                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  ↗ +{priceIncrease}%
                </span>
              )}
            </div>
          </div>

          {/* Bid Count */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">

            <span className="font-medium">{auction.bidsCount || 0} lượt đấu giá</span>
          </div>

          {/* Time Remaining */}
          {!isEnded && timeLeft > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
              <span className="font-medium">{formatTimeLeft(timeLeft)}</span>
            </div>
          )}

          {/* Bid Now Button */}
          {!isEnded && !isPending && !isRejected && !isAdmin && (
            <button
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mt-auto text-sm"
              onClick={(e) => {
                if (onClick) {
                  e.preventDefault();
                  handleClick();
                }
                // Nếu không có onClick prop, để Link xử lý navigation
              }}
            >
              Đấu giá ngay
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
