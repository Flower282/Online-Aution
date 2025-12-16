import AuctionCard from "../components/AuctionCard.jsx";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats } from "../api/auction.js";
import LoadingScreen from "../components/LoadingScreen.jsx";

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardStats(),
    staleTime: 5 * 1000, // Consider data fresh for 5 seconds
    refetchInterval: 5000, // Auto refresh every 5 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
  });

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error.message || "Failed to load dashboard data"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle undefined or null data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-6">Unable to load dashboard statistics. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Christmas Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Total Auctions
            </h3>
            <p className="text-4xl font-extrabold text-red-600 mt-2">
              {data.totalAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-rose-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Active Auctions
            </h3>
            <p className="text-4xl font-extrabold text-rose-600 mt-2">
              {data.activeAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-pink-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Your Auctions</h3>
            <p className="text-4xl font-extrabold text-pink-600 mt-2">
              {data.userAuctionCount}
            </p>
          </div>
        </div>

        {/* All Auctions Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">All Auctions</h2>
            <Link
              to="/auction"
              className="text-sky-600 hover:text-sky-700 font-bold text-sm hover:underline transition-colors"
            >
              View More →
            </Link>
          </div>

          {!data.latestAuctions || data.latestAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-sky-100">
              <p className="text-gray-600 text-xl font-medium">
                No auctions available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.latestAuctions.map((auction) => (
                <div key={auction._id} className="scale-95 hover:scale-100 transition-transform">
                  <AuctionCard auction={auction} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Auctions Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Your Christmas Auctions</h2>
            <Link
              to="/myauction"
              className="text-red-600 hover:text-red-700 font-bold text-sm hover:underline transition-colors"
            >
              View More →
            </Link>
          </div>

          {!data.latestUserAuctions || data.latestUserAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-red-200">
              <p className="text-gray-600 text-xl font-medium mb-6">
                You haven't created any auctions yet.
              </p>
              <Link to="/create">
                <button className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                  Create Your First Auction
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.latestUserAuctions.map((auction) => {
                const endDateValue = auction.itemEndDate || auction.endDate || auction.itemEndTime;
                const isEnded = auction.timeLeft ? auction.timeLeft <= 0 : endDateValue ? new Date(endDateValue) <= new Date() : false;
                return (
                  <div
                    key={auction._id}
                    className={`w-full scale-95 hover:scale-100 transition-transform ${isEnded ? "opacity-40 grayscale blur-[1px]" : ""}`}
                  >
                    <AuctionCard auction={auction} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
