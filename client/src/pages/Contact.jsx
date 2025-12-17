import { useState } from "react";
import { FiSend } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "../api/contact";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isError, setIsError] = useState("");

  const { isPending, mutate } = useMutation({
    mutationFn: () => sendMessage(formData),
    onSuccess: () => {
      setFormData({
        name: "",
        email: "",
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
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-center mb-3" data-aos="fade-down">🎅 Contact Us</h1>
        <p className="text-center text-gray-700 mb-8 text-base" data-aos="fade-up" data-aos-delay="100">We'd love to hear from you! ❤️</p>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-8" data-aos="zoom-in" data-aos-delay="200">
          {submitted ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-gradient-to-r from-red-500 to-red-700 mb-5 shadow-lg">
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
                🎁 Thank you!
              </h2>
              <p className="text-gray-600 mb-7 text-base">
                We've received your message and will get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-red-600 hover:text-red-700 font-bold text-base hover:underline"
              >
                Send another message →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div data-aos="fade-right" data-aos-delay="250">
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="300">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="350">
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="How can we help you?"
                />
              </div>

              <div data-aos="fade-right" data-aos-delay="400">
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                  placeholder="Tell us what's on your mind..."
                ></textarea>
              </div>
              {/* Error Message */}
              {isError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium" data-aos="fade-in">
                  {isError}
                </div>
              )}

              <div className="flex justify-end pt-2" data-aos="fade-up" data-aos-delay="450">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex justify-center items-center px-7 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-md hover:shadow-lg transition-all"
                >
                  {isPending ? (
                    "🎅 Sending..."
                  ) : (
                    <>
                      🎄 Send Message
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