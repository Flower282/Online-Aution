import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineShieldExclamation } from 'react-icons/hi';
import VerificationModal from './VerificationModal';

/**
 * Component hiển thị thông báo yêu cầu xác minh tài khoản
 * @param {string} message - Thông báo tuỳ chỉnh
 * @param {function} onVerified - Callback khi xác minh xong
 * @param {string} className - Class CSS tuỳ chỉnh
 */
export default function VerificationRequired({
    message = 'Bạn cần xác minh tài khoản để sử dụng chức năng này',
    onVerified,
    className = ''
}) {
    const [showModal, setShowModal] = useState(false);
    const { user } = useSelector((state) => state.auth);

    const verification = user?.user?.verification;
    const isVerified = verification?.isVerified;

    // Nếu đã xác minh thì không hiển thị gì
    if (isVerified) return null;

    return (
        <>
            <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <HiOutlineShieldExclamation className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-medium text-emerald-800 mb-1">
                            Tài khoản chưa xác minh
                        </h4>
                        <p className="text-emerald-700 text-sm mb-3">
                            {message}
                        </p>

                        {/* Trạng thái chi tiết */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verification?.phone
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {verification?.phone ? '✓' : '○'} Số điện thoại
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verification?.email
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {verification?.email ? '✓' : '○'} Email
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verification?.identityCard === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : verification?.identityCard === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {verification?.identityCard === 'approved' ? '✓' :
                                    verification?.identityCard === 'pending' ? '⏳' : '○'} CCCD
                            </span>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm"
                        >
                            <HiOutlineShieldExclamation className="w-4 h-4" />
                            Xác minh ngay
                        </button>
                    </div>
                </div>
            </div>

            <VerificationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onVerified={() => {
                    setShowModal(false);
                    if (onVerified) onVerified();
                }}
            />
        </>
    );
}

/**
 * Hook kiểm tra trạng thái xác minh
 */
export function useVerification() {
    const { user } = useSelector((state) => state.auth);
    const verification = user?.user?.verification;

    return {
        isVerified: verification?.isVerified || false,
        phoneVerified: verification?.phone || false,
        emailVerified: verification?.email || false,
        identityCardStatus: verification?.identityCard || 'not_submitted',
        verification
    };
}

