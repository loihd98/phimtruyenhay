"use client";

import React, { useState } from "react";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

interface FormStatus {
  type: "idle" | "loading" | "success" | "error";
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
  });

  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });

  const categories = [
    { value: "general", label: "Câu hỏi chung" },
    { value: "technical", label: "Hỗ trợ kỹ thuật" },
    { value: "account", label: "Vấn đề tài khoản" },
    { value: "content", label: "Nội dung truyện" },
    { value: "bug", label: "Báo lỗi" },
    { value: "feature", label: "Đề xuất tính năng" },
    { value: "legal", label: "Pháp lý / DMCA" },
    { value: "other", label: "Khác" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Đang gửi tin nhắn..." });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            "Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "general",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau hoặc gửi email trực tiếp đến hideonstorms@gmail.com",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Message */}
      {status.type !== "idle" && (
        <div
          className={`p-4 rounded-lg animate-fade-in ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
              : status.type === "error"
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
              : "bg-primary-500/5 /20 border border-primary-500/20 text-primary-400 "
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {status.type === "success"
                ? "✅"
                : status.type === "error"
                ? "❌"
                : "⏳"}
            </span>
            {status.message}
          </div>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-zinc-400 mb-2"
        >
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="Nhập họ và tên của bạn"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-zinc-400 mb-2"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="Nhập địa chỉ email của bạn"
        />
      </div>

      {/* Category Field */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-semibold text-zinc-400 mb-2"
        >
          Loại yêu cầu <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Field */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-semibold text-zinc-400 mb-2"
        >
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="Tóm tắt ngắn gọn vấn đề của bạn"
        />
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-zinc-400 mb-2"
        >
          Nội dung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-vertical"
          placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu của bạn..."
        />
        <p className="text-xs text-zinc-500 mt-1">
          Tối thiểu 10 ký tự. Càng chi tiết càng giúp chúng tôi hỗ trợ bạn tốt
          hơn.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-white/[0.04] p-4 rounded-lg">
        <div className="flex items-start">
          <span className="text-primary-400 mr-2 mt-0.5">🔒</span>
          <div className="text-sm text-zinc-500">
            <p className="font-semibold mb-1">Quyền riêng tư được bảo vệ</p>
            <p>
              Thông tin của bạn sẽ được mã hóa và chỉ được sử dụng để phản hồi
              yêu cầu này. Xem{" "}
              <a
                href="/privacy"
                className="text-primary-400  hover:underline"
              >
                Chính sách bảo mật
              </a>{" "}
              để biết thêm chi tiết.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status.type === "loading"}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
          status.type === "loading"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary-500 hover:bg-primary-600  hover: active:transform active:scale-95"
        }`}
      >
        {status.type === "loading" ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Đang gửi...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">📤</span>
            Gửi tin nhắn
          </div>
        )}
      </button>

      {/* Alternative Contact */}
      <div className="text-center pt-4 border-t border-white/[0.06]">
        <p className="text-sm text-zinc-500">
          Hoặc gửi email trực tiếp đến:{" "}
          <a
            href="mailto:hideonstorms@gmail.com"
            className="text-primary-400  hover:underline font-medium"
          >
            hideonstorms@gmail.com
          </a>
        </p>
      </div>
    </form>
  );
}
