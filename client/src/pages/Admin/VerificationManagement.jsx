import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingVerifications, reviewIdentityCard } from '../../api/verification';
import LoadingScreen from '../../components/LoadingScreen';
import Toast from '../../components/Toast';
import {
    HiOutlineIdentification,
    HiOutlineShieldCheck,
    HiOutlineShieldExclamation,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineEye,
    HiOutlineUser
} from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';

export default function VerificationManagement() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [userToReject, setUserToReject] = useState(null);

    // Query danh sách chờ xác minh
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['pendingVerifications'],
        queryFn: getPendingVerifications,
        refetchOnWindowFocus: true,
    });

    // Mutation duyệt CCCD
    const approveMutation = useMutation({
        mutationFn: (userId) => reviewIdentityCard(userId, 'approve'),
        onSuccess: () => {
            setToast({ message: 'Đã phê duyệt xác minh CCCD thành công!', type: 'success' });
            queryClient.invalidateQueries(['pendingVerifications']);
            queryClient.invalidateQueries(['pendingVerificationsCount']);
            setShowDetailModal(false);
            setSelectedUser(null);
        },
        onError: (error) => {
            setToast({ message: error.message || 'Không thể phê duyệt. Vui lòng thử lại.', type: 'error' });
        }
    });

    // Mutation từ chối CCCD
    const rejectMutation = useMutation({
        mutationFn: ({ userId, reason }) => reviewIdentityCard(userId, 'reject', reason),
        onSuccess: () => {
            setToast({ message: 'Đã từ chối xác minh CCCD.', type: 'success' });
            queryClient.invalidateQueries(['pendingVerifications']);
            queryClient.invalidateQueries(['pendingVerificationsCount']);
            setShowRejectModal(false);
            setShowDetailModal(false);
            setUserToReject(null);
            setRejectionReason('');
            setSelectedUser(null);
        },
        onError: (error) => {
            setToast({ message: error.message || 'Không thể từ chối. Vui lòng thử lại.', type: 'error' });
        }
    });

    const handleViewDetail = (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    const handleApprove = (userId) => {
        if (confirm('Bạn có chắc chắn muốn PHÊ DUYỆT xác minh CCCD này?')) {
            approveMutation.mutate(userId);
        }
    };

    const handleRejectClick = (user) => {
        setUserToReject(user);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (!rejectionReason.trim()) {
            setToast({ message: 'Vui lòng nhập lý do từ chối', type: 'error' });
            return;
        }
        rejectMutation.mutate({ userId: userToReject.id, reason: rejectionReason });
    };

    if (isLoading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md">
                    <h2 className="text-2xl font-bold text-emerald-600 mb-4">Lỗi tải dữ liệu</h2>
                    <p className="text-gray-600 mb-6">{error.message}</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const pendingUsers = data?.users || [];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <HiOutlineIdentification className="w-8 h-8 text-emerald-600" />
                        <h1 className="text-3xl font-bold text-red-600">Quản lý xác minh CCCD</h1>
                    </div>
                    <p className="text-gray-600">Xem xét và phê duyệt yêu cầu xác minh căn cước công dân của người dùng</p>
                </div>

                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md border border-emerald-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                    Chờ xác minh
                                </h3>
                                <p className="text-3xl font-bold text-emerald-600 mt-2">
                                    {pendingUsers.length}
                                </p>
                            </div>
                            <div className="bg-emerald-100 p-3 rounded-full">
                                <HiOutlineShieldExclamation className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>



                {/* Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <HiOutlineShieldExclamation className="w-5 h-5 text-emerald-500" />
                            Danh sách chờ xác minh ({pendingUsers.length})
                        </h3>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-16">
                            <HiOutlineShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Không có yêu cầu xác minh nào đang chờ</p>
                            <p className="text-gray-400 text-sm mt-2">Tất cả yêu cầu đã được xử lý</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người dùng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thông tin CCCD
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày gửi
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {user.avatar ? (
                                                            <img
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                <span className="text-lg font-medium text-emerald-700">
                                                                    {user.name?.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {user.identityCard?.fullName || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    CCCD: {user.identityCard?.number || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Sinh: {user.identityCard?.dateOfBirth
                                                        ? new Date(user.identityCard.dateOfBirth).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.identityCard?.submittedAt
                                                    ? new Date(user.identityCard.submittedAt).toLocaleString('vi-VN')
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(user)}
                                                        className="p-2 text-blue-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <HiOutlineEye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(user.id)}
                                                        disabled={approveMutation.isPending}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Phê duyệt"
                                                    >
                                                        <HiOutlineCheck className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectClick(user)}
                                                        disabled={rejectMutation.isPending}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Từ chối"
                                                    >
                                                        <HiOutlineX className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowDetailModal(false)}
                        />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineIdentification className="w-7 h-7 text-white" />
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Chi tiết xác minh CCCD</h2>
                                            <p className="text-emerald-100 text-sm">{selectedUser.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 rounded-full hover:bg-red-500/30 transition-colors"
                                    >
                                        <IoClose className="w-6 h-6 text-red-200 hover:text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User Info */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <HiOutlineUser className="w-5 h-5 text-emerald-600" />
                                            Thông tin tài khoản
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500">Tên người dùng</span>
                                                <p className="font-medium text-gray-900">{selectedUser.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Email</span>
                                                <p className="font-medium text-gray-900">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Ngày đăng ký</span>
                                                <p className="font-medium text-gray-900">
                                                    {selectedUser.createdAt
                                                        ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CCCD Info */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <HiOutlineIdentification className="w-5 h-5 text-emerald-600" />
                                            Thông tin CCCD
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    Số CCCD
                                                </span>
                                                <p className="font-medium text-gray-500 font-mono tracking-wider">
                                                    {selectedUser.identityCard?.number || '************'}
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Số CCCD gốc không được lưu trữ
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Họ và tên</span>
                                                <p className="font-medium text-gray-900">{selectedUser.identityCard?.fullName}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-xs text-gray-500">Ngày sinh</span>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedUser.identityCard?.dateOfBirth
                                                            ? new Date(selectedUser.identityCard.dateOfBirth).toLocaleDateString('vi-VN')
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Giới tính</span>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedUser.identityCard?.gender === 'male' ? 'Nam' :
                                                            selectedUser.identityCard?.gender === 'female' ? 'Nữ' : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    {(selectedUser.identityCard?.frontImage || selectedUser.identityCard?.backImage || selectedUser.identityCard?.selfieImage) && (
                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <HiOutlineEye className="w-5 h-5 text-emerald-600" />
                                                Hình ảnh CCCD
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {selectedUser.identityCard?.frontImage && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-gray-500">Mặt trước</span>
                                                        <img
                                                            src={selectedUser.identityCard.frontImage}
                                                            alt="CCCD mặt trước"
                                                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                )}
                                                {selectedUser.identityCard?.backImage && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-gray-500">Mặt sau</span>
                                                        <img
                                                            src={selectedUser.identityCard.backImage}
                                                            alt="CCCD mặt sau"
                                                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                )}
                                                {selectedUser.identityCard?.selfieImage && (
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-gray-500">Ảnh selfie</span>
                                                        <img
                                                            src={selectedUser.identityCard.selfieImage}
                                                            alt="Selfie với CCCD"
                                                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => handleRejectClick(selectedUser)}
                                    disabled={rejectMutation.isPending}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <HiOutlineX className="w-5 h-5" />
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedUser.id)}
                                    disabled={approveMutation.isPending}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <HiOutlineCheck className="w-5 h-5" />
                                    {approveMutation.isPending ? 'Đang xử lý...' : 'Phê duyệt'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && userToReject && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                setShowRejectModal(false);
                                setUserToReject(null);
                                setRejectionReason('');
                            }}
                        />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <HiOutlineX className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Từ chối xác minh</h3>
                                        <p className="text-sm text-gray-500">{userToReject.name}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Lý do từ chối <span className="text-emerald-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối xác minh..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setUserToReject(null);
                                            setRejectionReason('');
                                        }}
                                        className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleRejectConfirm}
                                        disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                    </button>
                                </div>
                            </div>
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
    );
}

