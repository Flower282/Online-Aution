import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuction } from "../api/auction.js";
import { useRef } from "react";
import { useNavigate } from "react-router";

export const CreateAuction = () => {
  const fileInputRef = useRef();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    itemCategory: "",
    startingPrice: "",
    itemStartDate: "",
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
        itemStartDate: "",
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

  const categories = [
    "Electronics",
    "Antiques",
    "Art",
    "Books",
    "Clothing",
    "Collectibles",
    "Home & Garden",
    "Jewelry",
    "Musical Instruments",
    "Sports",
    "Toys",
    "Vehicles",
    "Other",
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

    const start = new Date(formData.itemStartDate);
    const end = new Date(formData.itemEndDate);
    const now = new Date();

    // Validate start time
    if (start < now) {
      setError("Start time cannot be in the past.");
      return;
    }

    // Validate end time is after start time
    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    // Validate minimum duration (at least 2 minutes for testing)
    const durationMinutes = (end - start) / (1000 * 60);
    if (durationMinutes < 2) {
      setError("Auction must run for at least 2 minutes.");
      return;
    }

    mutate(formData);
  };

  //   today datetime (for datetime-local input)
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  //   today+15 days
  const maxStart = new Date();
  maxStart.setDate(maxStart.getDate() + 15);
  const maxStartDate = new Date(maxStart.getTime() - maxStart.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  //   max end date (start date + 15 days)
  let maxEndDate = "";
  let minEndDate = "";
  if (formData.itemStartDate) {
    const startDate = new Date(formData.itemStartDate);

    // Min end date = start date + 2 minutes (for testing)
    const minEnd = new Date(startDate.getTime() + 2 * 60 * 1000);
    minEndDate = new Date(minEnd.getTime() - minEnd.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    // Max end date = start date + 15 days
    const maxEnd = new Date(startDate);
    maxEnd.setDate(maxEnd.getDate() + 15);
    maxEndDate = new Date(maxEnd.getTime() - maxEnd.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            Create Christmas Auction
          </h1>
          <p className="text-gray-700">List your item for the Christmas season </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div>
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter the name of your item"
                  required
                />
              </div>

              {/* Item Description */}
              <div>
                <label
                  htmlFor="itemDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Item Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="itemDescription"
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-vertical"
                  placeholder="Provide a detailed description of your item including condition, features, and any relevant information"
                  required
                />
              </div>

              {/* Category and Starting Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Category */}
                <div>
                  <label
                    htmlFor="itemCategory"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="itemCategory"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select a category</option>
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
                    Starting Price ($) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="startingPrice"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>

              {/* Start and End Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date & Time */}
                <div>
                  <label
                    htmlFor="itemStartDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    🕐 Auction Start (Date & Time) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="itemStartDate"
                    name="itemStartDate"
                    min={today}
                    value={formData.itemStartDate}
                    max={maxStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chọn ngày và giờ bắt đầu đấu giá
                  </p>
                </div>

                {/* End Date & Time */}
                <div>
                  <label
                    htmlFor="itemEndDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    🕐 Auction End (Date & Time) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="itemEndDate"
                    name="itemEndDate"
                    value={formData.itemEndDate}
                    onChange={handleInputChange}
                    min={minEndDate || formData.itemStartDate}
                    max={maxEndDate}
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                    disabled={!formData.itemStartDate}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.itemStartDate
                      ? "Chọn ngày và giờ kết thúc (tối thiểu sau 2 phút)"
                      : "Vui lòng chọn thời gian bắt đầu trước"}
                  </p>
                </div>
              </div>

              {/* Item Photo */}
              <div>
                <label
                  htmlFor="itemPhoto"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  📷 Item Photo <span className="text-red-600">*</span>
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="itemPhoto"
                    name="itemPhoto"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept="image/*"
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {formData.itemPhoto && (
                    <div className="mt-3">
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
                        className="mt-2 text-sm text-red-600 hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-red-200">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-3 px-6 rounded-md hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  {isPending ? " Creating Auction..." : "🎄 Create Auction"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <HelpSection />
      </main>
    </div>
  );
};

export const HelpSection = () => {
  return (
    <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-red-900 mb-3">
        💡 Tips for Creating a Successful Christmas Auction
      </h3>
      <ul className="space-y-2 text-red-800 text-sm">
        <li className="flex items-start">
          <span className="text-red-600 mr-2">📷</span>
          Use clear, high-quality photos that show your item from multiple angles
        </li>
        <li className="flex items-start">
          <span className="text-red-600 mr-2">📝</span>
          Write detailed descriptions including condition, dimensions, and any flaws
        </li>
        <li className="flex items-start">
          <span className="text-red-600 mr-2">💰</span>
          Set a reasonable starting price to attract bidders
        </li>
        <li className="flex items-start">
          <span className="text-red-600 mr-2">⏰</span>
          Choose appropriate auction duration (tối thiểu 1 giờ, khuyến nghị 3-7 ngày)
        </li>
        <li className="flex items-start">
          <span className="text-red-600 mr-2">🕐</span>
          Bạn có thể chọn chính xác giờ và phút cho thời gian bắt đầu/kết thúc
        </li>
        <li className="flex items-start">
          <span className="text-red-600 mr-2">🏷️</span>
          Select the most accurate category to help buyers find your item
        </li>
      </ul>
    </div>
  );
};
