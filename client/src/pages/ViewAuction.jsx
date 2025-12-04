import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeBid, viewAuction, deleteAuction } from "../api/auction.js";
import { useSelector } from "react-redux";
import LoadingScreen from "../components/LoadingScreen.jsx";
import Toast from "../components/Toast.jsx";

export const ViewAuction = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inputRef = useRef();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["viewAuctions", id],
    queryFn: () => viewAuction(id),
    staleTime: 30 * 1000,
    placeholderData: () => undefined,
  });

  const placeBidMutate = useMutation({
    mutationFn: ({ bidAmount, id }) => placeBid({ bidAmount, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      if (inputRef.current) inputRef.current.value = "";
      setToast({ message: "Đặt giá thành công!", type: "success" });
    },
    onError: (error) => {
      setToast({ message: error.message || "Không thể đặt giá. Vui lòng thử lại.", type: "error" });
    },
  });

  const deleteAuctionMutate = useMutation({
    mutationFn: (id) => deleteAuction(id),
    onSuccess: () => {
      // Invalidate all auction-related queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["allAuction"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["myauctions"] });
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });

      setToast({ message: "Xóa auction thành công!", type: "success" });
      // Navigate after a short delay to show the toast
      setTimeout(() => navigate("/auction"), 1000);
    },
    onError: (error) => {
      setToast({ message: error.message || "Không thể xóa auction. Vui lòng thử lại.", type: "error" });
    },
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteAuctionMutate.mutate(id);
    setShowDeleteConfirm(false);
  };

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-100 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Auction</h2>
          <p className="text-gray-600 mb-6">{error.message || "Failed to load auction details"}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auction" className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold">
              Back to Auctions
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle undefined data
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-yellow-100 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Auction Not Found</h2>
          <p className="text-gray-600 mb-6">This auction may have been removed or doesn't exist.</p>
          <Link to="/auction" className="inline-block bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors font-semibold">
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Check if seller is inactive
  const isSellerInactive = data.seller?.isActive === false;

  const handleBidSubmit = (e) => {
    e.preventDefault();
    let bidAmount = e.target.bidAmount.value.trim();
    placeBidMutate.mutate({ bidAmount, id });
  };

  const daysLeft = Math.ceil(
    Math.max(0, new Date(data.itemEndDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isActive = Math.max(0, new Date(data.itemEndDate) - new Date()) > 0;

  return (
    <div className="min-h-screen bg-gray-50  mx-auto container">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4 grid grid-cols-1 place-items-center content-start">
            <div className="max-w-xl aspect-square bg-white rounded-md shadow-md border border-gray-200 overflow-hidden flex items-center justify-center">
              <img
                src={data.itemPhoto || "https://picsum.photos/601"}
                alt={data.itemName}
                className="h-full w-full object-fill"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                  {data.itemCategory}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {isActive ? "Active" : "Ended"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {data.itemName}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {data.itemDescription}
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Starting Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${data.startingPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${data.currentPrice}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.bids.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Left</p>
                  <p
                    className={`text-lg font-semibold ${isActive ? "text-red-600" : "text-gray-500"
                      }`}
                  >
                    {isActive ? `${daysLeft} days` : "Ended"}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning if auction ended */}
            {!isActive && (
              <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-md shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Đấu giá đã kết thúc</h3>
                    <p className="text-gray-700 text-sm">
                      Phiên đấu giá này đã kết thúc. Không thể đặt giá thêm.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if seller is inactive */}
            {isSellerInactive && isActive && (
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-md shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Không thể đấu giá</h3>
                    <p className="text-red-700 text-sm">
                      Tài khoản người bán đã bị vô hiệu hóa. Bạn có thể xem thông tin nhưng không thể đặt giá cho phiên đấu giá này.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bid Form */}
            {data.seller._id != user.user._id && isActive && !isSellerInactive && (
              <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="bidAmount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bid Amount (minimum: ${data.currentPrice + 1} maximum: $
                      {data.currentPrice + 10})
                    </label>
                    <input
                      type="number"
                      name="bidAmount"
                      id="bidAmount"
                      ref={inputRef}
                      min={data.currentPrice + 1}
                      max={data.currentPrice + 10}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your bid amount"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Place Bid
                  </button>
                </form>
              </div>
            )}

            {/* Seller Info */}
            <div className={`p-6 rounded-md shadow-md border ${isSellerInactive
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200'
              }`}>
              <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
              <p className={`font-medium ${isSellerInactive ? 'text-red-700' : 'text-gray-900'
                }`}>
                {isSellerInactive ? 'Tài khoản bị vô hiệu hóa' : data.seller.name}
              </p>
              {isSellerInactive && (
                <p className="text-xs text-red-600 mt-2">
                  Tài khoản này đã bị vô hiệu hóa bởi quản trị viên
                </p>
              )}
            </div>

            {/* Admin Delete Button */}
            {user?.user?.role === "admin" && (
              <div className="bg-white p-6 rounded-md shadow-md border border-red-200">
                <h3 className="text-lg font-semibold mb-3 text-red-600">Admin Actions</h3>
                <button
                  onClick={handleDelete}
                  disabled={deleteAuctionMutate.isPending}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteAuctionMutate.isPending ? "Deleting..." : "Delete Auction"}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  ⚠️ This action cannot be undone. All bids will be permanently deleted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bid History</h2>
          <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
            {data.bids.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bids yet. Be the first to bid!
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {data.bids.map((bid, index) => (
                  <div
                    key={index}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {bid.bidder?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(bid.bidTime).toLocaleDateString()} at{" "}
                        {new Date(bid.bidTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        ${bid.bidAmount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this auction? This action cannot be undone and all bids will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
