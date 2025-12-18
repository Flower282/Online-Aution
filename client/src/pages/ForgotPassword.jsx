import { useState } from "react";
import { useNavigate } from "react-router";
import { requestPasswordReset } from "../api/auth";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const data = await requestPasswordReset(email);
            setStatus("success");
            setMessage(
                data.message ||
                "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (bao gồm cả spam)."
            );
        } catch (error) {
            setStatus("error");
            setMessage(error.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-pink-50 page-transition">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-red-100">
                    <h1 className="text-2xl font-extrabold text-center text-red-600 mb-2">
                        Quên mật khẩu
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {message && (
                            <div
                                className={`px-4 py-3 rounded-lg text-sm font-medium ${status === "success"
                                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                    : status === "error"
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            {status === "loading" ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="w-full mt-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        >
                            Quay lại đăng nhập
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;


