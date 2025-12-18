import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { resetPasswordWithToken } from "../api/auth";
import { CiCircleCheck, CiCircleRemove } from "react-icons/ci";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("idle"); // idle | submitting | success | error
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });

    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Token đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu quên mật khẩu lại.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        if (!form.password || form.password.length < 6) {
            setStatus("error");
            setMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setStatus("error");
            setMessage("Mật khẩu nhập lại không khớp.");
            return;
        }

        setStatus("submitting");
        setMessage("");

        try {
            const data = await resetPasswordWithToken({
                token,
                newPassword: form.password,
            });
            setStatus("success");
            setMessage(data.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");

            // Tự động chuyển hướng về trang đăng nhập sau 5 giây
            setTimeout(() => {
                navigate("/login");
            }, 5000);
        } catch (error) {
            setStatus("error");
            setMessage(error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
        }
    };

    const renderContent = () => {
        if (!token) {
            return null;
        }

        if (status === "success") {
            return (
                <div className="text-center">
                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CiCircleCheck className="w-10 h-10 text-cyan-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu thành công!</h2>
                    <p className="text-gray-600 mb-4">{message}</p>
                    <p className="text-sm text-gray-500">
                        Tự động chuyển hướng về trang đăng nhập sau 5 giây...
                    </p>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Mật khẩu mới
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Nhập lại mật khẩu mới
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {message && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm font-medium ${status === "error"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                    >
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    {status === "submitting" ? "Đang đặt lại mật khẩu..." : "Đặt lại mật khẩu"}
                </button>
            </form>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-pink-50 page-transition">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-red-100">
                    <h1 className="text-2xl font-extrabold text-center text-red-600 mb-2">
                        Đặt lại mật khẩu
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        Nhập mật khẩu mới cho tài khoản của bạn.
                    </p>

                    {!token && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CiCircleRemove className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                Token không hợp lệ
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu
                                quên mật khẩu.
                            </p>
                        </div>
                    )}

                    {token && renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ResetPassword;


