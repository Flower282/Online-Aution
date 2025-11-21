import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { login } from "../store/auth/authSlice";
import { Link } from "react-router";
import LoadingScreen from "../components/LoadingScreen";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isError, setIsError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      navigate("/");
    } catch (error) {
      console.log("Login Failed", error);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-10 rounded-2xl shadow-2xl border-2 border-sky-100">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500 mb-2">Welcome Back!</h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit}>
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
                  className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
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
                  className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {isError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 mb-5 py-3 rounded-lg font-medium">
                  {isError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-3 px-4 rounded-lg hover:from-sky-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {loading ? "Logging in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm">
              <Link to="#" className="text-sky-600 hover:text-sky-700 font-medium hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-sky-600 font-bold hover:text-sky-700 hover:underline"
              >
                Sign up now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
