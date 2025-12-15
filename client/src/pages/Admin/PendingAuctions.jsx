import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingAuctions, approveAuction, rejectAuction } from "../../api/admin";
import { Clock, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";

const PendingAuctions = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [toast, setToast] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["pendingAuctions", currentPage],
        queryFn: () => getPendingAuctions(currentPage, 10),
    });

    const approveMutation = useMutation({
        mutationFn: approveAuction,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pendingAuctions"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
            queryClient.invalidateQueries({ queryKey: ["allAuction"] });

            const message = data?.data?.durationHours
                ? `Auction approved! Countdown timer started (${data.data.durationHours}h) ⏰✅`
                : "Auction approved successfully! Countdown timer has started! ⏰✅";

            setToast({ message, type: "success" });
            setTimeout(() => setToast(null), 4000);
        },
        onError: (error) => {
            setToast({ message: error.message || "Failed to approve auction", type: "error" });
            setTimeout(() => setToast(null), 3000);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ auctionId, reason }) => rejectAuction(auctionId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pendingAuctions"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
            setShowRejectModal(false);
            setSelectedAuction(null);
            setRejectionReason("");
            setToast({ message: "Auction rejected successfully! ❌", type: "success" });
            setTimeout(() => setToast(null), 3000);
        },
        onError: (error) => {
            setToast({ message: error.message || "Failed to reject auction", type: "error" });
            setTimeout(() => setToast(null), 3000);
        },
    });

    const handleApprove = (auctionId) => {
        if (window.confirm("Are you sure you want to approve this auction?")) {
            approveMutation.mutate(auctionId);
        }
    };

    const handleRejectClick = (auction) => {
        setSelectedAuction(auction);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (!rejectionReason.trim()) {
            setToast({ message: "Please provide a rejection reason", type: "error" });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        rejectMutation.mutate({ auctionId: selectedAuction._id, reason: rejectionReason });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationMs = end - start;
        const hours = Math.round(durationMs / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    };

    if (isLoading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg">
                        <p className="text-red-700 font-semibold">❌ {error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    const auctions = data?.data?.auctions || [];
    const pagination = data?.data?.pagination || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Toast Notification */}
                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${toast.type === "success"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                            }`}
                    >
                        {toast.message}
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-green-600 mb-2">
                        🎅 Pending Auctions
                    </h1>
                    <p className="text-gray-600">
                        Review and approve auction submissions ({pagination.totalPending || 0} pending)
                    </p>
                </div>

                {/* Auctions Grid */}
                {auctions.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-lg text-center border-2 border-green-200">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Pending Auctions</h3>
                        <p className="text-gray-500">All auctions have been reviewed! 🎉</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {auctions.map((auction) => (
                            <div
                                key={auction._id}
                                className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Image */}
                                <div className="relative h-64 bg-gray-100">
                                    <img
                                        src={auction.itemPhoto || "https://picsum.photos/400/300"}
                                        alt={auction.itemName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Pending
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        {auction.itemName}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {auction.itemDescription}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Category</p>
                                            <p className="font-semibold text-gray-800">{auction.itemCategory}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Starting Price</p>
                                            <p className="font-semibold text-green-600">${auction.startingPrice}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Requested Duration</p>
                                            <p className="font-semibold text-blue-600">
                                                {calculateDuration(auction.itemStartDate, auction.itemEndDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Will End After Approval</p>
                                            <p className="font-semibold text-purple-600">
                                                {calculateDuration(auction.itemStartDate, auction.itemEndDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Seller Info */}
                                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                        <p className="text-sm text-gray-500">Seller</p>
                                        <p className="font-semibold text-gray-800">{auction.seller.name}</p>
                                        <p className="text-sm text-gray-600">{auction.seller.email}</p>
                                    </div>

                                    {/* Submitted Date */}
                                    <p className="text-xs text-gray-500 mb-3">
                                        Submitted: {formatDate(auction.createdAt)}
                                    </p>

                                    {/* Info: Timer will reset on approval */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-blue-700 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-semibold">Note:</span> Countdown timer will start from NOW when you approve this auction.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(auction._id)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            {approveMutation.isPending ? "Approving..." : "Approve"}
                                        </button>
                                        <button
                                            onClick={() => handleRejectClick(auction)}
                                            disabled={rejectMutation.isPending}
                                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={!pagination.hasPrevPage}
                            className="px-4 py-2 bg-white border-2 border-red-200 rounded-lg font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 bg-white border-2 border-green-200 rounded-lg font-semibold">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-4 py-2 bg-white border-2 border-red-200 rounded-lg font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <h2 className="text-2xl font-bold text-gray-800">Reject Auction</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            You are about to reject <strong>{selectedAuction?.itemName}</strong>. Please provide
                            a reason:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:border-red-500 focus:outline-none resize-none"
                            rows="4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedAuction(null);
                                    setRejectionReason("");
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={rejectMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                            >
                                {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingAuctions;

