import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingAuctions, approveAuction, rejectAuction } from "../../api/admin";
import { Clock, CheckCircle, XCircle, AlertCircle, Package, ExternalLink } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";
import { useNavigate } from "react-router";
import { formatCurrency } from "../../utils/formatCurrency";

const PendingAuctions = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [auctionToApprove, setAuctionToApprove] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [toast, setToast] = useState(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
            queryClient.invalidateQueries({ queryKey: ["adminAllAuctions"] }); // ✅ Added for admin test page

            const message = data?.data?.durationHours
                ? `Auction approved! Countdown timer started (${data.data.durationHours}h) ⏰✅`
                : "Auction approved successfully! Countdown timer has started! ⏰✅";

            setShowApproveModal(false);
            setAuctionToApprove(null);
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
            queryClient.invalidateQueries({ queryKey: ["adminAllAuctions"] }); // ✅ Added for admin test page
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

    const handleApprove = (auction) => {
        setAuctionToApprove(auction);
        setShowApproveModal(true);
    };

    const handleApproveConfirm = () => {
        if (auctionToApprove) {
            approveMutation.mutate(auctionToApprove._id);
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
                {/* Toast Notification Popup */}
                {toast && (
                    <>
                        <style>{`
                            @keyframes slideDown {
                                from {
                                    opacity: 0;
                                    transform: translateY(-100px) scale(0.95);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0) scale(1);
                                }
                            }
                            
                            @keyframes shrink {
                                from {
                                    width: 100%;
                                }
                                to {
                                    width: 0%;
                                }
                            }
                            
                            @keyframes bounceIn {
                                0% {
                                    opacity: 0;
                                    transform: scale(0.3);
                                }
                                50% {
                                    opacity: 1;
                                    transform: scale(1.05);
                                }
                                70% {
                                    transform: scale(0.9);
                                }
                                100% {
                                    transform: scale(1);
                                }
                            }
                            
                            .toast-popup {
                                animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                            }
                            
                            .toast-progress {
                                animation: shrink 3s linear forwards;
                            }
                            
                            .animate-bounce-in {
                                animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                            }
                        `}</style>

                        {/* Popup Content */}
                        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
                            <div
                                className={`toast-popup pointer-events-auto ${toast.type === "success"
                                    ? "bg-white border-2 border-green-500"
                                    : "bg-white border-2 border-red-500"
                                    } rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${toast.type === "success"
                                            ? "bg-green-100"
                                            : "bg-red-100"
                                            }`}>
                                            {toast.type === "success" ? (
                                                <CheckCircle className="w-7 h-7 text-green-600" />
                                            ) : (
                                                <XCircle className="w-7 h-7 text-red-600" />
                                            )}
                                        </div>

                                        {/* Message */}
                                        <div className="flex-1 pt-1">
                                            <h3 className={`text-lg font-bold mb-1 ${toast.type === "success" ? "text-green-800" : "text-red-800"
                                                }`}>
                                                {toast.type === "success" ? "✨ Success!" : "⚠️ Error"}
                                            </h3>
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                {toast.message}
                                            </p>
                                        </div>

                                        {/* Close Button */}
                                        <button
                                            onClick={() => setToast(null)}
                                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-1 bg-gray-200">
                                    <div
                                        className={`toast-progress absolute top-0 left-0 h-full ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
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

                {/* Auctions List */}
                {auctions.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-lg text-center border-2 border-green-200">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Pending Auctions</h3>
                        <p className="text-gray-500">All auctions have been reviewed! 🎉</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Item Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Category</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Starting Price</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Duration</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Seller</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Submitted</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-yellow-100">
                                    {auctions.map((auction) => (
                                        <tr
                                            key={auction._id}
                                            className="hover:bg-yellow-50 transition-colors group"
                                        >
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {auction.itemName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">
                                                            {auction.itemDescription}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    {auction.itemCategory}
                                                </span>
                                            </td>
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <p className="font-semibold text-green-600">{formatCurrency(auction.startingPrice)}</p>
                                            </td>
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <p className="text-sm font-medium text-blue-600">
                                                    {calculateDuration(auction.itemStartDate, auction.itemEndDate)}
                                                </p>
                                                <p className="text-xs text-gray-500">after approval</p>
                                            </td>
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <p className="font-medium text-gray-900">{auction.seller.name}</p>
                                                <p className="text-xs text-gray-500">{auction.seller.email}</p>
                                            </td>
                                            <td
                                                className="px-6 py-4 cursor-pointer"
                                                onClick={() => navigate(`/auction/${auction._id}`)}
                                            >
                                                <p className="text-sm text-gray-600">
                                                    {new Date(auction.createdAt).toLocaleDateString("vi-VN")}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(auction.createdAt).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(auction);
                                                        }}
                                                        disabled={approveMutation.isPending}
                                                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRejectClick(auction);
                                                        }}
                                                        disabled={rejectMutation.isPending}
                                                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl pointer-events-auto border-2 border-green-300 animate-bounce-in">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <h2 className="text-2xl font-bold text-gray-800">Approve Auction</h2>
                        </div>
                        <p className="text-gray-700 text-center text-lg mb-6">
                            Are you sure you want to approve this auction?
                        </p>
                        <p className="text-center text-gray-600 mb-6">
                            <strong className="text-red-600">{auctionToApprove?.itemName}</strong>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setAuctionToApprove(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveConfirm}
                                disabled={approveMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
                            >
                                {approveMutation.isPending ? "Approving..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl pointer-events-auto border-2 border-red-300 animate-bounce-in">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <h2 className="text-2xl font-bold text-gray-800">Reject Auction</h2>
                        </div>
                        <p className="text-gray-700 text-center text-lg mb-4">
                            Are you sure you want to reject this auction?
                        </p>
                        <p className="text-center text-gray-600 mb-4">
                            <strong className="text-red-600">{selectedAuction?.itemName}</strong>
                        </p>
                        <p className="text-sm text-gray-600 mb-2">Please provide a rejection reason:</p>
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
                                {rejectMutation.isPending ? "Rejecting..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingAuctions;

