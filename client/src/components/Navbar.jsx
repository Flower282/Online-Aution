import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/auth/authSlice";
import {
  MdOutlineCreate,
  MdOutlineDashboard,
  MdMailOutline,
  MdAttachMoney,
  MdMenuOpen,
  MdOutlineAccountCircle,
  MdOutlineHome,
  MdOutlinePrivacyTip,
  MdAdminPanelSettings,
} from "react-icons/md";
import {
  IoCloseSharp,
  IoDocumentTextOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { RiAuctionLine } from "react-icons/ri";

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // User logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  //this will prevent body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40 border-b-2 border-sky-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <RiAuctionLine className="h-7 w-7 text-sky-500 group-hover:text-sky-600 transition-colors" />
              <span className="text-xl font-bold text-sky-600 group-hover:text-sky-700 transition-colors">
                Online Auction
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {(user ? getNavLinks(user.user.role) : navMenu).map((item) => (
                <NavLink
                  to={item.link}
                  key={item.link}
                  className={({ isActive }) =>
                    isActive
                      ? "text-sky-600 hover:text-sky-700 font-semibold border-b-2 border-sky-500 pb-1"
                      : "text-gray-600 hover:text-sky-600 font-medium transition-colors"
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="text-sky-600 hover:text-sky-700 focus:outline-none transition-colors"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <MdMenuOpen className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isMenuOpen ? "opacity-70" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-white to-sky-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-between items-center p-4 border-b-2 border-sky-200 bg-white">
          <div className="flex items-center space-x-2">
            <RiAuctionLine className="h-6 w-6 text-sky-500" />
            <span className="text-xl font-bold text-sky-600">
              Online Auction
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-sky-600 hover:text-sky-700 focus:outline-none pr-2 transition-colors"
            aria-label="Close menu"
          >
            <IoCloseSharp className="h-6 w-6" />
          </button>
        </div>

        {user && (
          <div className="p-4 border-b border-sky-200 bg-sky-50/50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden ring-2 ring-sky-300">
                {user.user.avatar ? (
                  <img
                    src={user.user.avatar}
                    alt={user.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MdOutlineAccountCircle className="h-10 w-10 text-sky-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sky-700">{user.user.name}</p>
                <p className="text-sm text-sky-600 truncate">
                  {user.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4">
          <ul className="space-y-1">
            {(user ? getNavLinks(user.user.role) : navMenu).map((item) => (
              <li key={item.link}>
                <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center py-3 px-3 text-sky-600 hover:text-sky-700 font-semibold bg-sky-100 rounded-lg transition-all"
                      : "flex items-center py-3 px-3 text-gray-600 hover:text-sky-600 hover:bg-sky-50 font-medium rounded-lg transition-all"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="mt-6 pt-6 border-t border-sky-200">
              <ul className="space-y-4">
                {protectedNavLink.slice(4, 7).map((item) => (
                  <li key={item.link}>
                    <NavLink
                      to={item.link}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center py-3 px-3 text-sky-600 hover:text-sky-700 font-semibold bg-sky-100 rounded-lg transition-all"
                          : "flex items-center py-3 px-3 text-gray-600 hover:text-sky-600 hover:bg-sky-50 font-medium rounded-lg transition-all"
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <button
                    className="flex items-center w-full py-3 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium text-left cursor-pointer rounded-lg transition-all"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <IoLogOutOutline className="mr-3 h-5 w-5" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-sky-200 space-y-3">
              <Link
                to="/login"
                className="block w-full py-3 px-4 text-center text-sky-600 font-semibold border-2 border-sky-500 rounded-lg hover:bg-sky-50 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="block w-full py-3 px-4 text-center bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 shadow-md hover:shadow-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};
export const LoginSignup = () => {
  return (
    <>
      <Link
        to="/login"
        className="px-6 py-2.5 text-sky-600 font-semibold border-2 border-sky-500 rounded-lg hover:bg-sky-50 transition-all hidden md:block"
      >
        Log in
      </Link>
      <Link
        to="/signup"
        className="px-6 py-2.5 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 shadow-md hover:shadow-lg transition-all hidden md:block"
      >
        Sign up
      </Link>
    </>
  );
};

const navMenu = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "About",
    link: "/about",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  // Temporarily hidden Legal link
  // {
  //   name: "Legal",
  //   link: "/legal",
  // },
];

const protectedNavLink = [
  {
    name: "Dashboard",
    link: "/",
  },
  {
    name: "Create Auction",
    link: "/create",
  },
  {
    name: "View Auction",
    link: "/auction",
  },
  {
    name: "My Auction",
    link: "/myauction",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  {
    name: "Profile",
    link: "/profile",
  },
  {
    name: "Privacy",
    link: "/privacy",
  },
];

const adminNavLink = [
  {
    name: "Admin Panel",
    link: "/admin",
  },
  {
    name: "Create Auction",
    link: "/create",
  },
  {
    name: "View Auction",
    link: "/auction",
  },
];

// Helper function to get navigation links based on user role
const getNavLinks = (userRole) => {
  if (userRole === 'admin') {
    return adminNavLink;
  }
  return protectedNavLink.slice(0, 4);
};
