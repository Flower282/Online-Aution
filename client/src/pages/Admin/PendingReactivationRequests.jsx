import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../../components/LoadingScreen';
import Toast from '../../components/Toast';
import { getPendingReactivationRequests, reactivateUser, rejectReactivationRequest } from '../../api/admin';

const PendingReactivationRequests = () => {
    const queryClient = useQueryClient();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToApprove, setUserToApprove] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [userToReject, setUserToReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await getPendingReactivationRequests();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            setError(error.message || 'Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApproveClick = (user) => {
        setUserToApprove(user);
        setShowConfirmModal(true);
    };

    const handleRejectClick = (user) => {
        setUserToReject(user);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleApproveConfirm = async () => {
        if (!userToApprove) return;

        try {
            setProcessingId(userToApprove._id);
            await reactivateUser(userToApprove._id);
            setToast({ message: `Đã kích hoạt lại tài khoản cho ${userToApprove.name}`, type: 'success' });
            // Refresh list
            await fetchRequests();
            // Invalidate navbar query cache to update badge count
            queryClient.invalidateQueries({ queryKey: ['pendingReactivationsCount'] });
            setShowConfirmModal(false);
            setUserToApprove(null);
        } catch (error) {
            setToast({ message: error.message || 'Không thể kích hoạt tài khoản', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveCancel = () => {
        setShowConfirmModal(false);
        setUserToApprove(null);
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setUserToReject(null);
        setRejectReason('');
    };

    const handleRejectConfirm = async () => {
        if (!userToReject) return;

        try {
            setProcessingId(userToReject._id);
            await rejectReactivationRequest(userToReject._id, rejectReason);
            setToast({ message: `Đã từ chối yêu cầu kích hoạt lại của ${userToReject.name}`, type: 'success' });
            await fetchRequests();
            queryClient.invalidateQueries({ queryKey: ['pendingReactivationsCount'] });
            setShowRejectModal(false);
            setUserToReject(null);
            setRejectReason('');
        } catch (error) {
            setToast({ message: error.message || 'Không thể từ chối yêu cầu', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        // If same day (days = 0), show relative time
        if (diffInDays === 0) {
            if (diffInMinutes < 1) {
                return 'Just now';
            } else if (diffInMinutes < 60) {
                return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
            } else {
                return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
            }
        }

        // Otherwise show full date
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-red-600 mb-2">Yêu Cầu Kích Hoạt Lại Chờ Duyệt</h1>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Stats Card */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-500 rounded-lg shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Tổng Yêu Cầu Chờ Duyệt</p>
                            <p className="text-4xl font-bold mt-1">{requests.length}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Requests List */}
                {requests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không Có Yêu Cầu Chờ Duyệt</h3>
                            <p className="text-gray-500">Không có yêu cầu kích hoạt lại nào đang chờ phê duyệt.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người Dùng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày Yêu Cầu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tin Nhắn
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hành Động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {request.avatar ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={request.avatar}
                                                                alt={request.name}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-orange-500 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-white">
                                                                    {request.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{request.name}</div>
                                                        <div className="text-sm text-gray-500">{request.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(request.reactivationRequest?.requestedAt)}</div>
                                                <div className="text-xs text-gray-500">
                                                    {request.reactivationRequest?.requestedAt &&
                                                        `${Math.floor((Date.now() - new Date(request.reactivationRequest.requestedAt)) / (1000 * 60 * 60 * 24))} days ago`
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-md">
                                                    {request.reactivationRequest?.message || 'Không có tin nhắn'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleApproveClick(request)}
                                                    disabled={processingId === request._id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                                                >
                                                    {processingId === request._id && userToApprove?._id === request._id ? (
                                                        <>
                                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Đang xử lý...
                                                        </>
                                                    ) : (
                                                        <>Approve</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(request)}
                                                    disabled={processingId === request._id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Confirm Approve Modal */}
                {showConfirmModal && userToApprove && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-emerald-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Xác Nhận Kích Hoạt</h3>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-700 mb-3">
                                    Bạn có chắc chắn muốn <span className="font-semibold text-emerald-600">kích hoạt lại</span> tài khoản cho:
                                </p>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        {userToApprove.avatar ? (
                                            <img
                                                src={userToApprove.avatar}
                                                alt={userToApprove.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-emerald-600">
                                                    {userToApprove.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900">{userToApprove.name}</p>
                                            <p className="text-sm text-gray-500">{userToApprove.email}</p>
                                        </div>
                                    </div>
                                    {userToApprove.reactivationRequest?.message && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1">Lý do yêu cầu:</p>
                                            <p className="text-sm text-gray-700 italic">"{userToApprove.reactivationRequest.message}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleApproveCancel}
                                    disabled={processingId}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleApproveConfirm}
                                    disabled={processingId}
                                    className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {processingId ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>Confirm</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && userToReject && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
                        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-red-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Từ chối yêu cầu kích hoạt</h3>
                            </div>

                            <div className="mb-4 text-sm text-gray-700">
                                <p>
                                    Bạn có chắc muốn <span className="font-semibold text-red-600">từ chối</span> yêu cầu kích hoạt lại tài khoản của:
                                </p>
                                <p className="mt-1 font-semibold text-gray-900">{userToReject.name}</p>
                                <p className="text-xs text-gray-500">{userToReject.email}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lý do (tùy chọn)
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Nhập lý do từ chối để người dùng có thể hiểu rõ hơn..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleRejectCancel}
                                    disabled={processingId}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRejectConfirm}
                                    disabled={processingId}
                                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {processingId ? "Đang xử lý..." : "Xác nhận từ chối"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default PendingReactivationRequests;

