import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { changePassword, updateProfile } from "../api/user";
import { CiMail, CiUser, CiLock, CiCamera, CiPhone, CiLocationOn } from "react-icons/ci";
import { useSelector, useDispatch } from "react-redux";
import { HiOutlineShieldCheck, HiOutlineIdentification } from "react-icons/hi";
import { setUser } from "../store/auth/authSlice";
import VerificationModal from "../components/VerificationModal";
import { getProvinces, getWards } from "../utils/vietnamProvinces";
import { checkAuth } from "../store/auth/authSlice";
import axios from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../config/api";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  // Fetch user data if not available
  useEffect(() => {
    const fetchUserData = async () => {
      // If user is not loaded and not currently loading, fetch it
      if (!user && !loading) {
        console.log('🔄 User data not found, fetching...');
        try {
          await dispatch(checkAuth());
        } catch (error) {
          console.error('❌ Failed to fetch user data:', error);
        }
      } else if (user && !user.user) {
        // If user object exists but user.user is missing, try to fetch
        console.log('🔄 User.user not found, fetching user data...');
        try {
          const response = await axios.get(API_ENDPOINTS.USER, {
            withCredentials: true,
          });
          if (response.data) {
            dispatch(setUser({ user: response.data }));
            console.log('✅ User data fetched and updated');
          }
        } catch (error) {
          console.error('❌ Failed to fetch user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user, loading, dispatch]);

  // Debug: Check if user data exists
  useEffect(() => {
    console.log('🔍 Profile component - User data:', user);
    console.log('🔍 Profile component - User.user:', user?.user);
    console.log('🔍 Profile component - Location:', user?.user?.location);
  }, [user]);

  const [isError, setIsError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.user?.name || "",
    address: user?.user?.address || "",
    city: user?.user?.location?.city || "",
    ward: user?.user?.location?.ward || "",
    country: user?.user?.location?.country || "",
  });

  // Vietnam provinces data
  const [provinces, setProvinces] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [wards, setWards] = useState([]);
  const [selectedWardCode, setSelectedWardCode] = useState("");

  // Sync profileData with user.user whenever it changes
  useEffect(() => {
    if (user?.user) {
      // Backend stores ward in 'region' field, map it to 'ward' for frontend
      const wardValue = user.user.location?.ward ||
        (user.user.location?.region && user.user.location?.region !== "Unknown"
          ? user.user.location.region
          : "");

      setProfileData({
        name: user.user.name || "",
        address: user.user.address || "",
        city: user.user.location?.city || "",
        ward: wardValue, // Map from region field
        country: user.user.location?.country || "",
      });
    }
  }, [user?.user]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      const data = await getProvinces();
      setProvinces(data);

      // If user has city data, find and set the selected province code
      if (user?.user?.location?.city && data.length > 0) {
        const matchingProvince = data.find(p => p.name === user.user.location.city);
        if (matchingProvince) {
          setSelectedProvinceCode(matchingProvince.id);
          console.log('📍 Found matching province:', matchingProvince);
        }
      }
    };
    loadProvinces();
  }, [user?.user?.location?.city]);

  // Load wards when province changes
  useEffect(() => {
    const loadWards = async () => {
      if (selectedProvinceCode) {
        const data = await getWards(selectedProvinceCode);
        setWards(data);

        // After loading wards, try to sync selectedWardCode from current ward
        if (profileData.ward && data.length > 0) {
          const matchingWard = data.find(w => w.name === profileData.ward);
          if (matchingWard) {
            setSelectedWardCode(matchingWard.id);
            console.log('📍 Syncing ward code after load:', matchingWard);
          }
        }
      } else {
        setWards([]);
        setSelectedWardCode("");
      }
    };
    loadWards();
  }, [selectedProvinceCode, profileData.ward]);


  // Lấy trạng thái xác minh
  const verification = user?.user?.verification;
  const isVerified = verification?.isVerified;
  const phoneVerified = verification?.phone;
  const emailVerified = verification?.email;
  const identityCardStatus = verification?.identityCard;

  // Change password mutation
  const { mutate, isPending } = useMutation({
    mutationFn: () => changePassword(formData),
    onSuccess: () => {
      setSuccessMessage("Password Changed Successfully");
      setTimeout(() => {
        setSuccessMessage("");
      }, 10000);

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      setIsError(error?.response?.data?.error);
      setTimeout(() => {
        setIsError("");
      }, 10000);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      console.log('📤 Calling updateProfile with data:', data);
      return updateProfile(data);
    },
    onSuccess: (data) => {
      console.log('✅ Profile update success, response:', data);
      console.log('✅ Updated user data:', data.user);
      console.log('✅ Location in response:', data.user?.location);

      setSuccessMessage("Profile updated successfully");
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      // Update Redux store with new user data
      // Merge location object properly to ensure all fields are updated
      if (data.user) {
        const updatedUser = {
          ...user.user,
          ...data.user,
          location: {
            ...user.user.location,
            ...data.user.location
          }
        };
        dispatch(setUser({ user: updatedUser }));
        console.log('✅ Redux store updated with new location:', updatedUser.location);
      }

      // Exit edit mode
      setIsEditingProfile(false);
    },
    onError: (error) => {
      console.error('❌ Profile update error:', error);
      console.error('❌ Error response:', error?.response?.data);
      setIsError(error?.message || "Failed to update profile");
      setTimeout(() => {
        setIsError("");
      }, 5000);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const provinceName = selectedOption.text;
    const provinceCode = e.target.value;

    setSelectedProvinceCode(provinceCode);
    setProfileData((prev) => ({ ...prev, city: provinceName, ward: "" }));
    setSelectedWardCode("");
  };

  const handleWardChange = (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const wardName = selectedOption.text;
    const wardCode = e.target.value;

    console.log('🏘️ Ward selected:', { wardName, wardCode });

    setSelectedWardCode(wardCode);
    setProfileData((prev) => {
      const updated = { ...prev, ward: wardName };
      console.log('📝 ProfileData updated with ward:', updated);
      return updated;
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setIsError("Please enter all fields");
      setTimeout(() => {
        setIsError("");
      }, 10000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsError("New password and confirm password do not match.");
      setTimeout(() => {
        setIsError("");
      }, 10000);
      return;
    }
    mutate(formData);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();

    // Format data for backend - backend expects FLAT format, not location object
    // Backend only accepts: { name, address, city, region, country }
    // Map ward to region since backend doesn't have ward field
    const submitData = {
      name: profileData.name,
      address: profileData.address,
      city: profileData.city || "",
      region: profileData.ward || "", // Map ward to region (backend uses region field)
      country: "Việt Nam"
    };

    console.log('📤 Submitting profile data (flat format):', submitData);
    console.log('📤 Ward mapped to region:', profileData.ward);

    updateProfileMutation.mutate(submitData);
  };

  const handleEditProfile = () => {
    // When entering edit mode, sync selectedProvinceCode from current city
    if (user?.user?.location?.city && provinces.length > 0) {
      const matchingProvince = provinces.find(p => p.name === user.user.location.city);
      if (matchingProvince) {
        setSelectedProvinceCode(matchingProvince.id);
        console.log('📍 Syncing province code on edit:', matchingProvince);
      }
    }

    // Also sync selectedWardCode from current ward
    if (profileData.ward && wards.length > 0) {
      const matchingWard = wards.find(w => w.name === profileData.ward);
      if (matchingWard) {
        setSelectedWardCode(matchingWard.id);
        console.log('📍 Syncing ward code on edit:', matchingWard);
      }
    }

    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    // Reset to current user data
    if (user?.user) {
      setProfileData({
        name: user.user.name || "",
        address: user.user.address || "",
        city: user.user.location?.city || "",
        ward: user.user.location?.ward || "",
        country: user.user.location?.country || "",
      });
    }
    setIsEditingProfile(false);
  };

  // Show loading state while checking auth or fetching user data
  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Early return if user data is not available after loading
  if (!user || !user.user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">No user data available.</p>
          <p className="text-sm text-gray-500">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      {/* Main content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6" data-aos="fade-down">
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-500">
              Update your personal information and password
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-md" data-aos="fade-up" data-aos-delay="100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-center">
                <div className="relative mb-4 sm:mb-0">
                  <img
                    src={user.user.avatar}
                    alt="User avatar"
                    className="h-20 w-20 rounded-full bg-gray-200 mx-auto sm:mx-0"
                  />
                  <button className="absolute bottom-0 right-0 sm:right-0 bg-white rounded-full p-1 border border-gray-300 shadow-sm">
                    <CiCamera className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="ml-0 sm:ml-4 text-center sm:text-left">
                  <h2 className="text-lg font-medium text-gray-900">
                    {user.user.name}
                  </h2>
                  <p className="text-sm text-gray-500">{user.user.email}</p>
                </div>
              </div>
            </div>

            {/* Account Verification */}
            <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-md mb-6">
              <div className="px-4 py-5 sm:p-6" data-aos="fade-up" data-aos-delay="150">
                <div className="flex items-center justify-between mb-4" data-aos="fade-down" data-aos-delay="200">
                  <div className="flex items-center gap-2">
                    <HiOutlineShieldCheck className={`h-6 w-6 ${isVerified ? 'text-green-600' : 'text-amber-500'}`} />
                    <h3 className="text-lg font-medium text-gray-900">
                      Xác minh tài khoản
                    </h3>
                  </div>
                  {isVerified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ Đã xác minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      ○ Chưa xác minh
                    </span>
                  )}
                </div>

                {!isVerified && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <strong>⚠️ Lưu ý:</strong> Bạn cần xác minh tài khoản để nạp tiền, đặt cọc và tham gia đấu giá.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Số điện thoại */}
                  <div className={`p-4 rounded-lg border-2 ${phoneVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`} data-aos="zoom-in" data-aos-delay="250">
                    <div className="flex items-center gap-2 mb-2">
                      <CiPhone className={`h-5 w-5 ${phoneVerified ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-900">Số điện thoại</span>
                    </div>
                    <p className={`text-sm ${phoneVerified ? 'text-green-700' : 'text-gray-500'}`}>
                      {phoneVerified ? '✓ Đã xác minh' : '○ Chưa xác minh'}
                    </p>
                  </div>

                  {/* Email */}
                  <div className={`p-4 rounded-lg border-2 ${emailVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`} data-aos="zoom-in" data-aos-delay="300">
                    <div className="flex items-center gap-2 mb-2">
                      <CiMail className={`h-5 w-5 ${emailVerified ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-900">Email</span>
                    </div>
                    <p className={`text-sm ${emailVerified ? 'text-green-700' : 'text-gray-500'}`}>
                      {emailVerified ? '✓ Đã xác minh' : '○ Chưa xác minh'}
                    </p>
                  </div>

                  {/* CCCD */}
                  <div className={`p-4 rounded-lg border-2 ${identityCardStatus === 'approved' ? 'bg-green-50 border-green-200' :
                    identityCardStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                      identityCardStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                    }`} data-aos="zoom-in" data-aos-delay="350">
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineIdentification className={`h-5 w-5 ${identityCardStatus === 'approved' ? 'text-green-600' :
                        identityCardStatus === 'pending' ? 'text-yellow-600' :
                          identityCardStatus === 'rejected' ? 'text-red-600' :
                            'text-gray-400'
                        }`} />
                      <span className="font-medium text-gray-900">CCCD</span>
                    </div>
                    <p className={`text-sm ${identityCardStatus === 'approved' ? 'text-green-700' :
                      identityCardStatus === 'pending' ? 'text-yellow-700' :
                        identityCardStatus === 'rejected' ? 'text-red-700' :
                          'text-gray-500'
                      }`}>
                      {identityCardStatus === 'approved' ? '✓ Đã xác minh' :
                        identityCardStatus === 'pending' ? '⏳ Đang chờ duyệt' :
                          identityCardStatus === 'rejected' ? '✗ Bị từ chối' :
                            '○ Chưa xác minh'}
                    </p>
                  </div>
                </div>

                {!isVerified && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowVerificationModal(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <HiOutlineShieldCheck className="h-5 w-5" />
                      Xác minh tài khoản ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information Form */}
            <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-md mb-6">
              <form onSubmit={handleProfileSubmit}>
                <div className="px-4 py-5 sm:p-6" data-aos="fade-up" data-aos-delay="150">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Personal Information
                    </h3>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleEditProfile}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingProfile ? (
                    // Edit Mode - Show input fields
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="profileName"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Your full name"
                        />
                      </div>

                      {/* Email (readonly) */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={user.user.email}
                          disabled
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                        />
                      </div>

                      {/* Phone (readonly) */}
                      <div>
                        <label htmlFor="profilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          id="profilePhone"
                          value={user.user.phone || "Not provided"}
                          disabled
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label htmlFor="profileAddress" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          name="address"
                          id="profileAddress"
                          rows="2"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Your full address"
                        />
                      </div>

                      {/* City (Tỉnh/Thành phố) */}
                      <div>
                        <label htmlFor="profileCity" className="block text-sm font-medium text-gray-700 mb-1">
                          Tỉnh/Thành phố {provinces.length > 0 && `(${provinces.length})`}
                        </label>
                        <select
                          id="profileCity"
                          value={selectedProvinceCode}
                          onChange={handleProvinceChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">-- Chọn Tỉnh/Thành phố --</option>
                          {provinces.length === 0 && (
                            <option disabled>Đang tải...</option>
                          )}
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ward (Phường/Xã) */}
                      <div>
                        <label htmlFor="profileWard" className="block text-sm font-medium text-gray-700 mb-1">
                          Phường/Xã {wards.length > 0 && `(${wards.length})`}
                        </label>
                        <select
                          id="profileWard"
                          value={selectedWardCode}
                          onChange={handleWardChange}
                          disabled={!selectedProvinceCode}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Chọn Phường/Xã --</option>
                          {wards.length === 0 && selectedProvinceCode && (
                            <option disabled>Đang tải...</option>
                          )}
                          {wards.map((ward) => (
                            <option key={ward.id} value={ward.id}>
                              {ward.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Country */}
                      <div className="md:col-span-2">
                        <label htmlFor="profileCountry" className="block text-sm font-medium text-gray-700 mb-1">
                          Quốc gia
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="profileCountry"
                          value="Việt Nam"
                          disabled
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  ) : (
                    // View Mode - Show text only
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                          <CiUser className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">{profileData.name || "Not provided"}</span>
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                          <CiMail className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">{user.user.email}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
                          <CiPhone className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">{user.user.phone || "Not provided"}</span>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-md min-h-[48px]">
                          <CiLocationOn className="h-5 w-5 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-900">
                            {user.user.address || profileData.address || "Not provided"}
                          </span>
                        </div>
                      </div>

                      {/* City (Tỉnh/Thành phố) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tỉnh/Thành phố
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-900">
                            {user.user.location?.city || profileData.city || "Chưa cung cấp"}
                          </span>
                        </div>
                      </div>

                      {/* Ward (Phường/Xã) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phường/Xã
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-900">
                            {(() => {
                              // Try ward first, then region (in case backend uses region), then other fields
                              const wardValue = user.user.location?.ward ||
                                user.user.location?.region ||
                                user.user.location?.commune ||
                                user.user.location?.village ||
                                profileData.ward ||
                                profileData.region;
                              return wardValue && wardValue !== "Unknown" ? wardValue : "Chưa cung cấp";
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Country */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quốc gia
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-900">Việt Nam</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only show when editing */}
                  {isEditingProfile && (
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-md">
              <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
                {/* Password */}
                <div className="px-4 py-5 sm:p-6"  >
                  <h3 className="text-lg font-medium text-gray-900 mb-4"  >
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 gap-6">

                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Current Password
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your current password"
                      />

                    </div>

                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        New Password
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter new password"
                          minLength={8}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div >
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {isError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {isError}
                      </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                        {successMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="px-4 py-5 sm:p-6" >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled
                      className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={() => {
          setShowVerificationModal(false);
          setSuccessMessage("Tài khoản đã được xác minh thành công!");
          setTimeout(() => setSuccessMessage(""), 10000);
        }}
      />
    </div>
  );
}
