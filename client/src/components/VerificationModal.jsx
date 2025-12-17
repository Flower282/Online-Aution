import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
    getVerificationStatus,
    verifyPhone,
    verifyEmail,
    submitIdentityCard
} from '../api/verification';
import {
    CiPhone,
    CiMail,
    CiCreditCard1,
    CiCircleCheck,
    CiCircleRemove,
    CiUser,
    CiCalendar
} from 'react-icons/ci';
import { HiOutlineIdentification, HiOutlineShieldCheck } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';

export default function VerificationModal({ isOpen, onClose, onVerified: _onVerified }) {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [identityData, setIdentityData] = useState({
        number: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        placeOfOrigin: '',
        placeOfResidence: '',
        issueDate: '',
        expiryDate: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditingPhone, setIsEditingPhone] = useState(false);

    // Query trạng thái xác minh
    const { data: verificationStatus, isLoading, refetch } = useQuery({
        queryKey: ['verificationStatus'],
        queryFn: getVerificationStatus,
        enabled: isOpen,
        refetchOnWindowFocus: false
    });

    // Mutation xác minh phone
    const phoneMutation = useMutation({
        mutationFn: verifyPhone,
        onSuccess: async (data) => {
            const wasEditing = isEditingPhone;
            setIsEditingPhone(false);
            setError('');
            setPhoneNumber('');

            // Đợi refetch hoàn thành để cập nhật UI
            await refetch();
            queryClient.invalidateQueries(['verificationStatus']);

            if (wasEditing) {
                // Đang edit số điện thoại -> ở yên tab phone
                setSuccess('Cập nhật số điện thoại thành công!');
            } else {
                // Xác minh lần đầu -> chuyển sang Email
                setSuccess(data.message + ' Chuyển sang xác minh Email...');
                setTimeout(() => {
                    setActiveTab('email');
                    setSuccess('');
                }, 1500);
            }
        },
        onError: (err) => {
            setError(err.message);
            setSuccess('');
        }
    });

    // Mutation xác minh email
    const emailMutation = useMutation({
        mutationFn: verifyEmail,
        onSuccess: async (data) => {
            setError('');

            // Đợi refetch hoàn thành để cập nhật UI
            await refetch();
            queryClient.invalidateQueries(['verificationStatus']);

            // Kiểm tra CCCD
            const identityStatus = newStatus?.identityCard?.status;
            if (identityStatus === 'approved') {
                // Tất cả đã hoàn thành
                setSuccess('Xác minh email thành công! Tài khoản đã được xác minh hoàn tất.');
            } else {
                // Chuyển sang tab CCCD
                const message = identityStatus === 'pending'
                    ? 'Xác minh email thành công! CCCD đang chờ duyệt.'
                    : data.message + ' Chuyển sang xác minh CCCD...';
                setSuccess(message);
                setTimeout(() => {
                    setActiveTab('identity');
                    setSuccess('');
                }, 1500);
            }
        },
        onError: (err) => {
            setError(err.message);
            setSuccess('');
        }
    });

    // Mutation gửi CCCD
    const identityMutation = useMutation({
        mutationFn: submitIdentityCard,
        onSuccess: async (data) => {
            setSuccess(data.message);
            setError('');
            // Reset form CCCD
            setIdentityData({
                number: '',
                fullName: '',
                dateOfBirth: '',
                gender: '',
                placeOfOrigin: '',
                placeOfResidence: '',
                issueDate: '',
                expiryDate: ''
            });
            // Đợi refetch hoàn thành để cập nhật UI
            await refetch();
            queryClient.invalidateQueries(['verificationStatus']);
        },
        onError: (err) => {
            setError(err.message);
            setSuccess('');
        }
    });

    // Reset error/success và editing state khi đổi tab
    useEffect(() => {
        setError('');
        setSuccess('');
        setIsEditingPhone(false);
        setPhoneNumber('');
    }, [activeTab]);

    // Tự động chọn tab phù hợp khi mở modal lần đầu
    useEffect(() => {
        // Không tự động chuyển tab nếu đang edit số điện thoại
        if (isEditingPhone) return;

        if (isOpen && verificationStatus) {
            const phoneVerified = verificationStatus.phone?.isVerified;
            const emailVerified = verificationStatus.email?.isVerified;
            const identityStatus = verificationStatus.identityCard?.status;

            // Chọn tab đầu tiên chưa hoàn thành
            if (!phoneVerified) {
                setActiveTab('phone');
            } else if (!emailVerified) {
                setActiveTab('email');
            } else if (identityStatus !== 'approved' && identityStatus !== 'pending') {
                setActiveTab('identity');
            }
        }
    }, [isOpen, verificationStatus, isEditingPhone]);

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        if (!phoneNumber.trim()) {
            setError('Vui lòng nhập số điện thoại');
            return;
        }
        phoneMutation.mutate(phoneNumber);
    };

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        emailMutation.mutate();
    };

    const handleIdentitySubmit = (e) => {
        e.preventDefault();
        if (!identityData.number || !identityData.fullName || !identityData.dateOfBirth) {
            setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }

        const formData = new FormData();
        Object.keys(identityData).forEach(key => {
            if (identityData[key]) {
                formData.append(key, identityData[key]);
            }
        });

        identityMutation.mutate(formData);
    };

    const handleIdentityChange = (e) => {
        const { name, value } = e.target;
        setIdentityData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    const isFullyVerified = verificationStatus?.isVerified;
    const phoneVerified = verificationStatus?.phone?.isVerified;
    const emailVerified = verificationStatus?.email?.isVerified;
    const identityStatus = verificationStatus?.identityCard?.status;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Overlay */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HiOutlineShieldCheck className="w-8 h-8 text-white" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Xác minh tài khoản</h2>
                                    <p className="text-emerald-100 text-sm">
                                        Hoàn thành xác minh để sử dụng đầy đủ tính năng
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <IoClose className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="mt-4 flex items-center gap-2">
                            <div className={`flex-1 h-2 rounded-full ${phoneVerified ? 'bg-white' : 'bg-white/30'}`} />
                            <div className={`flex-1 h-2 rounded-full ${emailVerified ? 'bg-white' : 'bg-white/30'}`} />
                            <div className={`flex-1 h-2 rounded-full ${identityStatus === 'approved' ? 'bg-white' : 'bg-white/30'}`} />
                        </div>
                        <p className="text-emerald-100 text-xs mt-2">
                            {isFullyVerified ? '✅ Đã xác minh hoàn tất' :
                                `${[phoneVerified, emailVerified, identityStatus === 'approved'].filter(Boolean).length}/3 bước hoàn thành`}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 mb-6">
                                    <button
                                        onClick={() => setActiveTab('phone')}
                                        className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'phone'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <CiPhone className="w-5 h-5" />
                                        <span className="font-medium">Số điện thoại</span>
                                        {phoneVerified && <CiCircleCheck className="w-5 h-5 text-green-500" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('email')}
                                        className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'email'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <CiMail className="w-5 h-5" />
                                        <span className="font-medium">Email</span>
                                        {emailVerified && <CiCircleCheck className="w-5 h-5 text-green-500" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('identity')}
                                        className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'identity'
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <HiOutlineIdentification className="w-5 h-5" />
                                        <span className="font-medium">CCCD</span>
                                        {identityStatus === 'approved' && <CiCircleCheck className="w-5 h-5 text-green-500" />}
                                        {identityStatus === 'pending' && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Đang chờ</span>
                                        )}
                                    </button>
                                </div>

                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                        <CiCircleRemove className="w-5 h-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                        <CiCircleCheck className="w-5 h-5 flex-shrink-0" />
                                        {success}
                                    </div>
                                )}

                                {/* Tab Content */}
                                {activeTab === 'phone' && (
                                    <div className="space-y-4">
                                        {phoneVerified && !isEditingPhone ? (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CiCircleCheck className="w-10 h-10 text-green-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">Số điện thoại đã xác minh</h3>
                                                <p className="text-gray-500 mb-4">{verificationStatus?.phone?.number}</p>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingPhone(true);
                                                        setPhoneNumber('');
                                                        setError('');
                                                        setSuccess('');
                                                    }}
                                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
                                                >
                                                    Đổi số điện thoại khác
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                                {isEditingPhone && (
                                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                                                        <p className="font-medium">⚠️ Đổi số điện thoại</p>
                                                        <p className="text-xs mt-1">Số hiện tại: {verificationStatus?.phone?.number}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {isEditingPhone ? 'Số điện thoại mới' : 'Số điện thoại'}
                                                    </label>
                                                    <div className="relative">
                                                        <CiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="tel"
                                                            value={phoneNumber}
                                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                                            placeholder="0912 345 678"
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Nhập số điện thoại Việt Nam (10 số)
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    {isEditingPhone && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEditingPhone(false);
                                                                setPhoneNumber('');
                                                                setError('');
                                                            }}
                                                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                                        >
                                                            Hủy
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={phoneMutation.isPending}
                                                        className={`${isEditingPhone ? 'flex-1' : 'w-full'} py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                                    >
                                                        {phoneMutation.isPending ? 'Đang xử lý...' : (isEditingPhone ? 'Cập nhật số mới' : 'Xác minh số điện thoại')}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'email' && (
                                    <div className="space-y-4">
                                        {emailVerified ? (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CiCircleCheck className="w-10 h-10 text-green-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">Email đã xác minh</h3>
                                                <p className="text-gray-500">{user?.user?.email}</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                                <div className="text-center py-4">
                                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <CiMail className="w-10 h-10 text-blue-600" />
                                                    </div>
                                                    <p className="text-gray-600 mb-2">
                                                        Email của bạn: <strong>{user?.user?.email}</strong>
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Nhấn nút bên dưới để xác minh email
                                                    </p>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={emailMutation.isPending}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {emailMutation.isPending ? 'Đang xác minh...' : 'Xác minh email'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'identity' && (
                                    <div className="space-y-4">
                                        {identityStatus === 'approved' ? (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CiCircleCheck className="w-10 h-10 text-green-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">CCCD đã xác minh</h3>
                                                <p className="text-gray-500">{verificationStatus?.identityCard?.fullName}</p>
                                                <p className="text-gray-400 text-sm">{verificationStatus?.identityCard?.number}</p>
                                            </div>
                                        ) : identityStatus === 'pending' ? (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">Đang chờ xác minh</h3>
                                                <p className="text-gray-500">Thông tin CCCD của bạn đang được xem xét</p>
                                                <p className="text-sm text-gray-400 mt-2">
                                                    Thời gian xử lý: 1-3 ngày làm việc
                                                </p>
                                            </div>
                                        ) : identityStatus === 'rejected' ? (
                                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <h4 className="font-medium text-red-700 mb-1">Xác minh bị từ chối</h4>
                                                <p className="text-red-600 text-sm">
                                                    {verificationStatus?.identityCard?.rejectionReason || 'Thông tin không hợp lệ'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Vui lòng kiểm tra và gửi lại thông tin chính xác.
                                                </p>
                                            </div>
                                        ) : null}

                                        {(identityStatus === 'not_submitted' || identityStatus === 'rejected') && (
                                            <form onSubmit={handleIdentitySubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Số CCCD <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <CiCreditCard1 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="number"
                                                                value={identityData.number}
                                                                onChange={handleIdentityChange}
                                                                placeholder="123456789012"
                                                                maxLength={12}
                                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Họ và tên <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <CiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                name="fullName"
                                                                value={identityData.fullName}
                                                                onChange={handleIdentityChange}
                                                                placeholder="Nguyễn Văn A"
                                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Ngày sinh <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <CiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                name="dateOfBirth"
                                                                value={identityData.dateOfBirth}
                                                                onChange={handleIdentityChange}
                                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Giới tính
                                                        </label>
                                                        <select
                                                            name="gender"
                                                            value={identityData.gender}
                                                            onChange={handleIdentityChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        >
                                                            <option value="">Chọn giới tính</option>
                                                            <option value="male">Nam</option>
                                                            <option value="female">Nữ</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Quê quán
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="placeOfOrigin"
                                                            value={identityData.placeOfOrigin}
                                                            onChange={handleIdentityChange}
                                                            placeholder="Tỉnh/Thành phố"
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Nơi thường trú
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="placeOfResidence"
                                                            value={identityData.placeOfResidence}
                                                            onChange={handleIdentityChange}
                                                            placeholder="Địa chỉ"
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Ngày cấp
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="issueDate"
                                                            value={identityData.issueDate}
                                                            onChange={handleIdentityChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Ngày hết hạn
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="expiryDate"
                                                            value={identityData.expiryDate}
                                                            onChange={handleIdentityChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={identityMutation.isPending}
                                                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {identityMutation.isPending ? 'Đang gửi...' : 'Gửi thông tin xác minh'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            🔒 Thông tin của bạn được bảo mật và chỉ sử dụng cho mục đích xác minh
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

