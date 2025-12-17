import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login } from "../store/auth/authSlice";
import { Link } from "react-router";
import LoadingScreen from "../components/LoadingScreen";
import { resetAuthFlags } from "../utils/axiosConfig";
import { requestAccountReactivation } from "../api/reactivation";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isError, setIsError] = useState("");
  const [deactivatedInfo, setDeactivatedInfo] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      resetAuthFlags(); // Reset auth flags after successful login
      navigate("/");
    } catch (error) {
      console.log("Login Failed", error);

      // Check if user is deactivated
      if (error?.isDeactivated) {
        setDeactivatedInfo({
          email: error.email,
          hasRequested: error.hasRequestedReactivation
        });
        setIsError(error.error || "Tài khoản của bạn đã bị vô hiệu hóa.");
      } else {
        setIsError(error?.error || error || "something went wrong");
        setDeactivatedInfo(null);
      }

      setTimeout(() => {
        if (!error?.isDeactivated) {
          setIsError("");
        }
      }, 10000);
    }
  };

  const handleRequestReactivation = async () => {
    if (!deactivatedInfo?.email) return;

    try {
      setRequestLoading(true);
      await requestAccountReactivation(deactivatedInfo.email, "User requested account reactivation from login page");
      setRequestSuccess(true);
      setDeactivatedInfo({ ...deactivatedInfo, hasRequested: true });
      setIsError("Yêu cầu mở khóa đã được gửi. Admin sẽ xem xét yêu cầu của bạn.");
    } catch (error) {
      setIsError(error.message || "Không thể gửi yêu cầu. Vui lòng thử lại sau.");
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-white to-pink-50 page-transition">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Left Side - Fireplace Image */}
            <div className="hidden lg:block relative bg-gradient-to-br from-red-900 via-red-800 to-orange-900" data-aos="fade-up" data-aos-duration="1000" data-aos-easing="ease-out">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <img 
                    src="https://images.unsplash.com/photo-1512389098783-66b81f86e199?w=600&h=800&fit=crop" 
                    alt="Christmas Fireplace" 
                    className="w-full h-full object-cover rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Welcome to Christmas Season!</h2>
                    <p className="text-lg opacity-90">Cozy up and join our festive auction community</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white p-10 border-l-2 border-red-200" data-aos="zoom-in">
            <div className="text-center mb-8" data-aos="fade-down" data-aos-delay="100">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2"> Welcome Back!</h1>
              <p className="text-gray-700">Sign in to your Christmas account </p>
            </div>

            <form onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="200">
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
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
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
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
                  className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {isError && (
                <div className={`border-2 px-4 mb-5 py-3 rounded-lg font-medium ${requestSuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {isError}
                </div>
              )}

              {/* Reactivation Request Button */}
              {deactivatedInfo && !deactivatedInfo.hasRequested && !requestSuccess && (
                <button
                  type="button"
                  onClick={handleRequestReactivation}
                  disabled={requestLoading}
                  className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {requestLoading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu mở khóa tài khoản"}
                </button>
              )}

              {deactivatedInfo && deactivatedInfo.hasRequested && (
                <div className="mb-4 bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-lg font-medium text-center">
                  ✓ Yêu cầu đã được gửi. Vui lòng chờ admin xem xét.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {loading ? " Logging in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm">
              <Link to="#" className="text-red-600 hover:text-red-700 font-medium hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-red-600 font-bold hover:text-red-700 hover:underline"
              >
                Sign up now
              </Link>
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
