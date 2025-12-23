import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuction } from "../api/auction.js";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";

export const CreateAuction = () => {
  const fileInputRef = useRef();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    itemCategory: "",
    startingPrice: "",
    itemEndDate: "",
    itemPhoto: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createAuction,
    onSuccess: (data) => {
      setFormData({
        itemName: "",
        itemDescription: "",
        itemCategory: "",
        startingPrice: "",
        itemEndDate: "",
        itemPhoto: "",
      });
      setError("");
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      queryClient.invalidateQueries({ queryKey: ["allAuction"] });
      queryClient.invalidateQueries({ queryKey: ["myauctions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      navigate(`/auction/${data.newAuction._id}`);
    },
    onError: (error) =>
      setError(error?.response?.data?.message || "Something went wrong"),
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/create" } });
    }
  }, [user, navigate]);

  const categories = [
    "Điện tử",
    "Đồ cổ",
    "Nghệ thuật",
    "Sách",
    "Quần áo",
    "Đồ sưu tầm",
    "Nhà cửa & Vườn",
    "Trang sức",
    "Nhạc cụ",
    "Thể thao",
    "Đồ chơi",
    "Xe cộ",
    "Khác",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);

      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }

      if (fileSizeMB > 5) {
        setError(`File size must be less than 5 MB.`);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        itemPhoto: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemPhoto) {
      setError("Please upload an image.");
      return;
    }

    // Validate starting price minimum
    const priceValue = parseFloat(formData.startingPrice);
    if (!priceValue || priceValue < 1) {
      setError("Giá khởi điểm phải từ 1 (1,000 VNĐ) trở lên.");
      return;
    }

    const end = new Date(formData.itemEndDate);
    const now = new Date();

    // Validate end time is after now (start time will be set to now automatically)
    if (end <= now) {
      setError("Thời gian kết thúc phải sau thời điểm hiện tại.");
      return;
    }

    // Validate minimum duration (at least 2 minutes for testing)
    const durationMinutes = (end - now) / (1000 * 60);
    if (durationMinutes < 2) {
      setError("Đấu giá phải diễn ra ít nhất 2 phút.");
      return;
    }

    // Multiply starting price by 1000 before submitting
    const dataToSubmit = {
      ...formData,
      startingPrice: priceValue * 1000
    };

    mutate(dataToSubmit);
  };

  //   today datetime (for datetime-local input)
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  // Min end date = now + 2 minutes (for testing)
  const minEnd = new Date(now.getTime() + 2 * 60 * 1000);
  const minEndDate = new Date(minEnd.getTime() - minEnd.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  // Max end date = now + 15 days
  const maxEnd = new Date();
  maxEnd.setDate(maxEnd.getDate() + 15);
  const maxEndDate = new Date(maxEnd.getTime() - maxEnd.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center" data-aos="fade-down">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            Tạo sản phẩm đấu giá
          </h1>
          <p className="text-gray-700"> Tạo sản phẩm đấu giá cho mùa Giáng sinh </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg border-2 border-emerald-200" data-aos="fade-up" data-aos-delay="200">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div data-aos="fade-up" data-aos-delay="300">
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tên sản phẩm <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              {/* Item Description */}
              <div data-aos="fade-up" data-aos-delay="350">
                <label
                  htmlFor="itemDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mô tả sản phẩm <span className="text-emerald-600">*</span>
                </label>
                <textarea
                  id="itemDescription"
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical"
                  placeholder="Nhập mô tả chi tiết của sản phẩm bao gồm điều kiện, đặc điểm, và thông tin liên quan"
                  required
                />
              </div>

              {/* Category and Starting Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-aos="fade-up" data-aos-delay="400">
                {/* Item Category */}
                <div>
                  <label
                    htmlFor="itemCategory"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Loại <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    id="itemCategory"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value=""> Chọn loại </option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starting Price */}
                <div>
                  <label
                    htmlFor="startingPrice"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Giá khởi điểm <span className="text-emerald-600">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        id="startingPrice"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleInputChange}
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 pr-20 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="50"
                        required
                      />

                    </div>
                    {formData.startingPrice && parseFloat(formData.startingPrice) > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        <p className="text-sm text-emerald-700">
                          = <span className="font-bold text-lg text-emerald-800">
                            {(parseFloat(formData.startingPrice) * 1000).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div data-aos="fade-up" data-aos-delay="450">
                <label
                  htmlFor="itemEndDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Thời gian kết thúc <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="itemEndDate"
                  name="itemEndDate"
                  value={formData.itemEndDate}
                  onChange={handleInputChange}
                  min={minEndDate}
                  max={maxEndDate}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chọn ngày và giờ kết thúc (tối thiểu sau 2 phút từ thời điểm hiện tại)
                </p>

              </div>

              {/* Item Photo */}
              <div data-aos="fade-up" data-aos-delay="500">
                <label
                  htmlFor="itemPhoto"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ảnh sản phẩm <span className="text-emerald-600">*</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="itemPhoto"
                    name="itemPhoto"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept="image/*"
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {formData.itemPhoto && (
                    <div className="mt-3" data-aos="zoom-in">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img
                        src={URL.createObjectURL(formData.itemPhoto)}
                        alt="Preview"
                        className="w-32 h-32 object-cover border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, itemPhoto: "" }));
                          fileInputRef.current.value = "";
                        }}
                        className="mt-2 text-sm text-emerald-600 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-emerald-200" data-aos="fade-up" data-aos-delay="550">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-md hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  {isPending ? "Đang tạo đấu giá..." : "Tạo sản phẩm đấu giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
