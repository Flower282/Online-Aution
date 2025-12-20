import { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "../api/contact";
import { useSelector } from "react-redux";

export const Contact = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.user?.role === "admin";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isError, setIsError] = useState("");

  // Auto-fill name and email for logged-in users
  useEffect(() => {
    if (user?.user && user.user.role !== "admin") {
      setFormData((prev) => ({
        ...prev,
        name: user.user.name || "",
        email: user.user.email || "",
      }));
    }
  }, [user]);

  const { isPending, mutate } = useMutation({
    mutationFn: () => sendMessage(formData),
    onSuccess: () => {
      setFormData({
        name: user?.user?.role !== "admin" ? user.user.name : "",
        email: user?.user?.role !== "admin" ? user.user.email : "",
        subject: "",
        message: "",
      });
      setSubmitted(true);
    },
    onError: (error) => {
      setIsError(error?.response?.data?.error || "something went wrong");
      setTimeout(() => {
        setIsError("");
      }, 10000);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-center mb-3" data-aos="fade-down">🎅 Liên Hệ Với Chúng Tôi</h1>
        <p className="text-center text-gray-700 mb-8 text-base" data-aos="fade-up" data-aos-delay="100">Chúng tôi rất muốn nghe từ bạn!</p>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-8" data-aos="zoom-in" data-aos-delay="200">
          {isAdmin ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 mb-5 shadow-lg">
                <svg
                  className="h-9 w-9 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                👋 Xin chào Admin!
              </h2>
              <p className="text-gray-600 text-base">
                Với tư cách quản trị viên, bạn có quyền truy cập đầy đủ vào hệ thống. 
                Nếu cần hỗ trợ kỹ thuật, vui lòng liên hệ đội ngũ phát triển trực tiếp.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 mb-5 shadow-lg">
                <svg
                  className="h-9 w-9 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                🎁 Cảm ơn bạn!
              </h2>
              <p className="text-gray-600 mb-7 text-base">
                Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi sớm nhất có thể.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-base hover:underline"
              >
                Gửi tin nhắn khác →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div data-aos="fade-right" data-aos-delay="250">
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Tên Của Bạn
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={user?.user && user.user.role !== "admin"}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="300">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Địa Chỉ Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={user?.user && user.user.role !== "admin"}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="email.cua.ban@example.com"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="350">
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Tiêu Đề
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="Chúng tôi có thể giúp gì cho bạn?"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="400">
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Tin Nhắn
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Hãy cho chúng tôi biết suy nghĩ của bạn..."
                ></textarea>
              </div>
              {/* Error Message */}
              {isError && (
                <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-sm font-medium" data-aos="fade-in">
                  {isError}
                </div>
              )}

              <div className="flex justify-end pt-2" data-aos="fade-up" data-aos-delay="450">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex justify-center items-center px-7 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-md hover:shadow-lg transition-all"
                >
                  {isPending ? (
                    "Đang gửi..."
                  ) : (
                    <>
                      Gửi Tin Nhắn
                      <FiSend className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};
