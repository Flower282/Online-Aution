import { Link } from "react-router";

export default function AuctionCard({ auction }) {
  const timeLeft = auction.timeLeft || 0;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const sellerName = auction?.sellerName || auction?.seller?.name;
  const isSellerInactive = auction?.sellerActive === false || sellerName === "Tài khoản bị vô hiệu hóa";
  const isEnded = timeLeft <= 0; // Check timeLeft in milliseconds instead of daysLeft

  return (
    <div className={`bg-white border-2 rounded-2xl shadow-lg transition-all duration-300 ${isEnded
      ? 'border-gray-300 opacity-60'
      : isSellerInactive
        ? 'border-red-200 opacity-75'
        : 'border-sky-100 hover:shadow-2xl hover:scale-105 transform'
      }`}>
      <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-sky-50 to-cyan-50">
        <img
          src={auction.itemPhoto || "https://picsum.photos/300"}
          alt={auction.itemName}
          className="object-contain aspect-[4/3] w-96"
        />
        <div className="absolute top-3 right-3 bg-gradient-to-r from-sky-400 to-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
          {auction.itemCategory}
        </div>
        {isEnded && (
          <div className="absolute top-3 left-3 bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
            Đã kết thúc
          </div>
        )}
        {!isEnded && isSellerInactive && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
            Không khả dụng
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-gray-900">
          {auction.itemName}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {auction.itemDescription}
        </p>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Current Price:</span>
            <span className="font-bold text-xl text-sky-600">
              ${auction.currentPrice || auction.startingPrice}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Bids:</span>
            <span className="text-sm font-bold text-gray-700 bg-sky-50 px-3 py-1 rounded-full">{auction.bidsCount}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Time Left:</span>
            <span className={`text-sm font-bold ${isEnded ? 'text-gray-500' : 'text-red-600'}`}>
              {daysLeft > 0 ? `${daysLeft} days` : "Đã kết thúc"}
            </span>
          </div>
        </div>

        <div className="border-t-2 border-sky-100 pt-4">
          <p className={`text-xs mb-4 font-medium ${isSellerInactive ? 'text-red-500' : 'text-gray-500'}`}>
            Seller: {sellerName}
          </p>
          <Link to={`/auction/${auction._id}`}>
            <button className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${isEnded
              ? 'bg-gray-500 hover:bg-gray-600 text-white shadow-md'
              : isSellerInactive
                ? 'bg-gray-400 hover:bg-gray-500 text-white shadow-md'
                : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600 shadow-md hover:shadow-lg transform hover:scale-105'
              }`}>
              {isEnded ? 'Xem kết quả' : isSellerInactive ? 'Xem thông tin' : 'View Details'}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
