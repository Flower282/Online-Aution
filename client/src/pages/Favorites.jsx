import { useEffect } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavoriteAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import socket, { ensureSocketConnected } from "../utils/socket";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

export default function Favorites() {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["favoriteAuctions"],
        queryFn: getFavoriteAuctions,
        staleTime: 0, // Always consider data stale to ensure fresh data
        refetchInterval: 0.2 * 1000, // Auto-refresh every 15 seconds (fallback)
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnReconnect: true, // Refetch when network reconnects
    });

    // 🔄 Force refresh when navigating to this page
    useEffect(() => {
        console.log('✨ Favorites page mounted - Refreshing data');
        refetch();
    }, [refetch]); // Run only on mount

    // 🔥 Real-time updates via Socket.io
    useEffect(() => {
        let cleanedUp = false;

        const initSocket = async () => {
            try {
                await ensureSocketConnected();

                if (cleanedUp) return;

                console.log('🔵 Favorites: Listening for like updates');

                // Listen for like/unlike events
                socket.on('auction:like:updated', (update) => {
                    console.log('📡 Favorites: Like update received:', update);

                    // Invalidate favorites query to refresh the list
                    queryClient.invalidateQueries({ queryKey: ["favoriteAuctions"] });

                    // If current user unliked something, remove it from list immediately
                    if (update.userId === user?.user?._id && !update.isLiked) {
                        console.log('🗑️ Current user unliked, refreshing list');
                        refetch();
                    }
                });
            } catch (error) {
                console.error('Failed to connect socket:', error);
            }
        };

        initSocket();

        return () => {
            cleanedUp = true;
            console.log('🔴 Favorites: Cleanup socket listeners');
            socket.off('auction:like:updated');
        };
    }, [queryClient, refetch, user?.user?._id]);

    if (isLoading) return <LoadingScreen />;

    // Handle error state
    if (error) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
                <main className="max-w-5xl mx-auto px-8 py-10">
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lỗi Tải Danh Sách</h2>
                        <p className="text-gray-600 mb-6">{error.message || "Không thể tải danh sách yêu thích"}</p>
                        <button
                            onClick={() => refetch()}
                            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            Thử Lại
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Handle empty or undefined data
    const auctions = data?.auctions || [];

    // Sort: active auctions first, then ended auctions
    const sortedAuctions = [...auctions].sort((a, b) => {
        const aEnded = a.isEnded || (a.timeLeft !== undefined && a.timeLeft <= 0);
        const bEnded = b.isEnded || (b.timeLeft !== undefined && b.timeLeft <= 0);
        if (aEnded && !bEnded) return 1; // a ended, b active -> b first
        if (!aEnded && bEnded) return -1; // a active, b ended -> a first
        return 0; // Keep original order for same status
    });

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            <main className="max-w-5xl mx-auto px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-red-600 mb-2">
                        Đấu Giá Yêu Thích
                    </h1>
                    <p className="text-gray-600">
                        Những sản phẩm đấu giá bạn đã yêu thích
                    </p>
                </div>

                {/* Count */}
                <div className="mb-8">
                    <div className="inline-block px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-gray-600">Tổng cộng: </span>
                        <span className="font-bold text-gray-800">{auctions.length}</span>
                        <span className="text-gray-600"> đấu giá</span>
                    </div>
                </div>

                {/* Auctions grid */}
                {auctions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có yêu thích</h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa yêu thích đấu giá nào. Hãy khám phá và thêm vào danh sách!
                        </p>
                        <a
                            href="/auctions"
                            className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            Khám Phá Đấu Giá
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedAuctions.map((auction) => (
                            <div key={auction._id}>
                                <AuctionCard
                                    auction={auction}
                                    onClick={() => navigate(`/auction/${auction._id}`)}
                                    onLikeUpdate={refetch}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

