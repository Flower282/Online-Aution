import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { verifyEmailToken } from '../api/verification';
import { CiCircleCheck, CiCircleRemove } from 'react-icons/ci';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const hasVerified = useRef(false); // Đảm bảo chỉ verify một lần
    const redirectTimeoutRef = useRef(null); // Lưu timeout để cleanup

    useEffect(() => {
        // Chỉ verify một lần
        if (hasVerified.current) {
            return;
        }

        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Token xác minh không hợp lệ. Vui lòng yêu cầu gửi lại email xác minh.');
            hasVerified.current = true;
            return;
        }

        // Đánh dấu đã bắt đầu verify
        hasVerified.current = true;

        // Xác minh email
        verifyEmailToken(token)
            .then((data) => {
                setStatus('success');
                setMessage(data.message || 'Email đã được xác minh thành công!');

                // Tự động chuyển hướng sau 5 giây (giữ nguyên trạng thái thành công)
                redirectTimeoutRef.current = setTimeout(() => {
                    navigate('/dashboard');
                }, 5000);
            })
            .catch((error) => {
                setStatus('error');
                setMessage(error.message || 'Không thể xác minh email. Vui lòng thử lại.');
            });

        // Cleanup function
        return () => {
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xác minh email...</h2>
                        <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CiCircleCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác minh thành công!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <div className="space-y-3">
                            <Link
                                to="/dashboard"
                                className="block w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                            >
                                Đi đến Dashboard
                            </Link>
                            <p className="text-sm text-gray-500">
                                Tự động chuyển hướng sau 5 giây...
                            </p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CiCircleRemove className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác minh thất bại</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <div className="space-y-3">
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                            >
                                Đăng nhập để yêu cầu gửi lại email
                            </Link>
                            <Link
                                to="/"
                                className="block w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

