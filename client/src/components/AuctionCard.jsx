import { Link } from "react-router";

export default function AuctionCard({ auction }) {
  const daysLeft = Math.ceil(auction.timeLeft / (1000 * 60 * 60 * 24));
  return (
    <div className="bg-white border-2 border-sky-100 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
      <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-sky-50 to-cyan-50">
        <img
          src={auction.itemPhoto || "https://picsum.photos/300"}
          alt={auction.itemName}
          className="object-contain aspect-[4/3] w-96"
        />
        <div className="absolute top-3 right-3 bg-gradient-to-r from-sky-400 to-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
          {auction.itemCategory}
        </div>
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
            <span className="text-sm font-bold text-red-600">
              {daysLeft > 0 ? `${daysLeft} days` : "Ended"}
            </span>
          </div>
        </div>

        <div className="border-t-2 border-sky-100 pt-4">
          <p className="text-xs text-gray-500 mb-4 font-medium">
            Seller: {auction?.sellerName || auction?.seller?.name}
          </p>
          <Link to={`/auction/${auction._id}`}>
            <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-3 px-4 rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
