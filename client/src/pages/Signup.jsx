import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signup } from "../store/auth/authSlice";
import { Link } from "react-router";
import LoadingScreen from "../components/LoadingScreen";
import { resetAuthFlags } from "../utils/axiosConfig";

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isError, setIsError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(signup(formData)).unwrap();
      resetAuthFlags(); // Reset auth flags after successful signup
      navigate("/");
    } catch (error) {
      console.log("Signup Failed", error);
      setIsError(error || "something went wrong");
      setTimeout(() => {
        setIsError("");
      }, 10000);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col page-transition" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Side - Signup Form */}
            <div className="bg-white p-6 sm:p-8 lg:p-10 border-r-2 border-emerald-200 overflow-y-auto max-h-[90vh] lg:max-h-[600px]" data-aos="zoom-in">
              <div className="text-center mb-6" data-aos="fade-down" data-aos-delay="100">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-600 mb-2">
                  Join Us Today!
                </h1>
                <p className="text-sm sm:text-base text-gray-700">Create your Christmas account to get started</p>
              </div>

              <form onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="200">
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Họ và tên                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />

                </div>

                {isError && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 mb-4 py-3 rounded-lg font-medium text-sm">
                    {isError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {loading ? "Creating account..." : "Đăng ký"}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="text-red-600 font-bold hover:text-red-700 hover:underline"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            {/* Right Side - Fireplace Image */}
            <div className="hidden lg:block relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <img
                    src="/photo-151.jpg"
                    alt="Christmas Fireplace"
                    className="w-full h-full object-cover rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Start Your Journey!</h2>
                    <p className="text-lg opacity-90">Join our festive auction community today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
