import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getMyAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Clock, CheckCircle, XCircle, Filter, ChevronDown } from "lucide-react";

export const MyAuction = () => {
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // New: status filter

  const { data, isLoading, error } = useQuery({
    queryKey: ["myauctions"],
    queryFn: getMyAuctions,
    staleTime: 30 * 1000,
    refetchInterval: 10000, // Auto refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-emerald-200">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-600 mb-4">Error Loading Your Auctions</h2>
              <p className="text-gray-600 mb-6">{error.message || "Failed to load your auctions"}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-colors font-semibold"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Handle empty or undefined data
  const auctions = data || [];

  const categories = [
    "all",
    ...new Set(auctions.map((auction) => auction.itemCategory)),
  ];

  // Apply category and status filters
  let filteredAuctions = filter === "all"
    ? auctions
    : auctions.filter((auction) => auction.itemCategory === filter);

  if (statusFilter !== "all") {
    filteredAuctions = filteredAuctions.filter((auction) => auction.status === statusFilter);
  }

  // Sort: active auctions first, then ended auctions (only for approved status)
  if (statusFilter === "all" || statusFilter === "approved") {
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      // Check if auction is ended based on itemEndDate
      const aEnded = a.itemEndDate ? new Date(a.itemEndDate) < new Date() : false;
      const bEnded = b.itemEndDate ? new Date(b.itemEndDate) < new Date() : false;
      if (aEnded && !bEnded) return 1; // a ended, b active -> b first
      if (!aEnded && bEnded) return -1; // a active, b ended -> a first
      return 0; // Keep original order for same status
    });
  }

  // Count auctions by status
  const statusCounts = {
    all: auctions.length,
    pending: auctions.filter(a => a.status === 'pending').length,
    approved: auctions.filter(a => a.status === 'approved').length,
    rejected: auctions.filter(a => a.status === 'rejected').length,
  };

  // Status badge component
  const StatusBadge = ({ status, reason: _reason }) => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      },
      approved: {
        icon: CheckCircle,
        label: 'Approved',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      },
      rejected: {
        icon: XCircle,
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-300',
      },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${config.className} flex items-center gap-1`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8" data-aos="fade-down">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            My Christmas Auctions
          </h1>
          <p className="text-gray-700">Manage your auction listings </p>
        </div>

        {/* Filters Menu - Horizontal Layout */}
        <div className="mb-10 bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4" data-aos="fade-up" data-aos-delay="100">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Filter Icon & Label */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-red-600" />
              <span className="text-lg font-bold text-gray-900">Lọc:</span>
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sản phẩm
              </label>
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer hover:border-red-400 transition-colors"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "Tất cả sản phẩm" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex-1 min-w-[300px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${statusFilter === "all"
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 shadow-md"
                    }`}
                >
                  Tất cả ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${statusFilter === "pending"
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-yellow-200 hover:bg-yellow-50 shadow-md"
                    }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${statusFilter === "approved"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-emerald-200 hover:bg-emerald-50 shadow-md"
                    }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approved ({statusCounts.approved})
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${statusFilter === "rejected"
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-red-200 hover:bg-red-50 shadow-md"
                    }`}
                >
                  <XCircle className="w-4 h-4" />
                  Rejected ({statusCounts.rejected})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {filter === "all" ? "All My Auctions" : `${filter} Auctions`}
            <span className="text-base font-normal text-gray-500 ml-3">
              ({filteredAuctions.length} items)
            </span>
          </h2>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-emerald-200" data-aos="fade-up" data-aos-delay="300">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">
                {auctions.length === 0 ? " No Auctions Yet" : "No auctions found in this category"}
              </p>
              <p className="text-gray-500 text-base">
                {auctions.length === 0 ? " Create your first Christmas auction to get started!" : "Try selecting a different category"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 place-items-center gap-8">
            {filteredAuctions.map((auction, index) => (
              <div key={auction._id} className="relative w-full" data-aos="fade-up" data-aos-delay={300 + index * 50}>
                {/* Status Badge Overlay */}
                <div className="absolute top-4 right-4 z-10">
                  <StatusBadge status={auction.status} />
                </div>

                {/* Auction Card */}
                <AuctionCard auction={auction} />

                {/* Rejection Reason (if rejected) */}
                {auction.status === 'rejected' && auction.rejectionReason && (
                  <div className="mt-3 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{auction.rejectionReason}</p>
                  </div>
                )}

                {/* Pending Message */}
                {auction.status === 'pending' && (
                  <div className="mt-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700">
                      This auction is waiting for admin approval.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
