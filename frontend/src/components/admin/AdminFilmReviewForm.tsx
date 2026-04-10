"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/utils/api";
import { getMediaUrl } from "@/utils/media";
import AffiliateLinkSelect from "./AffiliateLinkSelect";

interface FilmCategory {
  id: string;
  name: string;
  slug: string;
}

interface EpisodeFormData {
  id?: string;
  episodeNum: number;
  title: string;
  videoUrl: string;
  duration: string;
  language: string;
}

interface FilmReview {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  rating: number;
  reviewLink: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  affiliateId?: string;
  categories?: FilmCategory[];
  actors?: Array<{ id: string; name: string; slug: string; avatar?: string }>;
}

interface AdminFilmReviewFormProps {
  review?: FilmReview;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminFilmReviewForm: React.FC<AdminFilmReviewFormProps> = ({
  review,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    rating: 7,
    reviewLink: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
    initViewCount: 1000,
    language: "VIETSUB",
    totalEpisodes: 1,
    isMovie: true,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [actorNames, setActorNames] = useState<string[]>([]);
  const [actorInput, setActorInput] = useState("");
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeFormData[]>([]);
  const [savingEpisodes, setSavingEpisodes] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<
    FilmCategory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (review) {
      setFormData({
        title: review.title,
        description: review.description || "",
        thumbnailUrl: review.thumbnailUrl || "",
        rating: review.rating,
        reviewLink: review.reviewLink,
        status: review.status,
        initViewCount: (review as any).viewCount ?? 1000,
        language: (review as any).language || "VIETSUB",
        totalEpisodes: (review as any).totalEpisodes || 1,
        isMovie: (review as any).isMovie !== false,
      });
      setTags(review.tags || []);
      setSelectedCategoryIds(
        review.categories?.map((c) => c.id) || []
      );
      setActorNames(review.actors?.map((a) => a.name) || []);
      setAffiliateId(review.affiliateId || null);
      // Fetch existing episodes
      fetchEpisodes(review.id);
    }
  }, [review]);

  const fetchEpisodes = async (filmId: string) => {
    try {
      const response = await apiClient.get(`/film-reviews/${filmId}/episodes`);
      const data = response.data?.data || [];
      setEpisodes(
        data.map((ep: any) => ({
          id: ep.id,
          episodeNum: ep.episodeNum,
          title: ep.title || "",
          videoUrl: ep.videoUrl,
          duration: ep.duration ? String(ep.duration) : "",
          language: ep.language || "VIETSUB",
        }))
      );
    } catch {
      // Film may not have slug-based episode endpoint working, try by slug
      try {
        const slug = (review as any)?.slug;
        if (slug) {
          const response = await apiClient.get(`/film-reviews/${slug}/episodes`);
          const data = response.data?.data || [];
          setEpisodes(
            data.map((ep: any) => ({
              id: ep.id,
              episodeNum: ep.episodeNum,
              title: ep.title || "",
              videoUrl: ep.videoUrl,
              duration: ep.duration ? String(ep.duration) : "",
              language: ep.language || "VIETSUB",
            }))
          );
        }
      } catch {
        // No episodes yet
      }
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.get(
        "/admin/film-categories?limit=100"
      );
      setAvailableCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Tiêu đề phải có ít nhất 3 ký tự";
    }

    if (formData.isMovie) {
      if (!formData.reviewLink.trim()) {
        newErrors.reviewLink = "Link review là bắt buộc";
      } else {
        try {
          new URL(formData.reviewLink.trim());
        } catch {
          newErrors.reviewLink = "Link review không hợp lệ";
        }
      }
    }

    if (formData.rating < 0 || formData.rating > 10) {
      newErrors.rating = "Đánh giá phải từ 0 đến 10";
    }

    if (
      formData.thumbnailUrl.trim() &&
      !formData.thumbnailUrl.trim().startsWith("http") &&
      !formData.thumbnailUrl.trim().startsWith("/")
    ) {
      newErrors.thumbnailUrl = "URL ảnh không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
        rating: Number(formData.rating),
        reviewLink: formData.reviewLink.trim() || undefined,
        status: formData.status,
        tags,
        categoryIds: selectedCategoryIds,
        actorNames,
        affiliateId: affiliateId || null,
        language: formData.language,
        totalEpisodes: formData.isMovie ? 1 : (episodes.length || Number(formData.totalEpisodes) || 1),
        isMovie: formData.isMovie,
      };

      const viewCountValue = Math.max(0, Number(formData.initViewCount) || 0);

      if (review) {
        await apiClient.put(
          `/admin/film-reviews/${review.id}`,
          { ...payload, viewCount: viewCountValue }
        );
        toast.success("Cập nhật review phim thành công!");
      } else {
        await apiClient.post("/admin/film-reviews", { ...payload, initViewCount: viewCountValue });
        toast.success("Tạo review phim thành công!");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Film review form error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lưu review phim";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" || name === "initViewCount" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ cho phép upload file ảnh (JPG, PNG, WEBP, GIF)");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File ảnh không được vượt quá 10MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      const response = await apiClient.post("/admin/media/upload/image", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0,
      });

      const imageUrl = response.data.file?.url || response.data.url;
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: imageUrl }));
        toast.success("Upload ảnh thành công!");
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi upload ảnh");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Tag management
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // Actor management
  const handleAddActor = () => {
    const trimmed = actorInput.trim();
    if (trimmed && !actorNames.includes(trimmed)) {
      setActorNames((prev) => [...prev, trimmed]);
      setActorInput("");
    }
  };

  const handleActorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddActor();
    }
  };

  const handleRemoveActor = (actor: string) => {
    setActorNames((prev) => prev.filter((a) => a !== actor));
  };

  // Category management
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Episode management
  const handleAddEpisode = () => {
    const nextNum = episodes.length > 0 ? Math.max(...episodes.map(e => e.episodeNum)) + 1 : 1;
    setEpisodes((prev) => [
      ...prev,
      { episodeNum: nextNum, title: "", videoUrl: "", duration: "", language: formData.language },
    ]);
  };

  const handleRemoveEpisode = (index: number) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEpisodeChange = (index: number, field: keyof EpisodeFormData, value: string | number) => {
    setEpisodes((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, [field]: value } : ep))
    );
  };

  const handleSaveEpisodes = async () => {
    if (!review) {
      toast.error("Vui lòng lưu phim trước, sau đó chỉnh sửa để thêm tập");
      return;
    }

    // Validate episodes
    for (const ep of episodes) {
      if (!ep.videoUrl.trim()) {
        toast.error(`Tập ${ep.episodeNum}: Link video là bắt buộc`);
        return;
      }
    }

    setSavingEpisodes(true);
    try {
      // Get existing episode IDs
      const existingIds = new Set(episodes.filter(e => e.id).map(e => e.id));

      // Fetch current episodes from server to determine what to delete
      let serverEpisodes: any[] = [];
      try {
        const slug = (review as any)?.slug || review.id;
        const resp = await apiClient.get(`/film-reviews/${slug}/episodes`);
        serverEpisodes = resp.data?.data || [];
      } catch { /* no existing episodes */ }

      // Delete episodes that are on server but not in our local list
      for (const serverEp of serverEpisodes) {
        if (!existingIds.has(serverEp.id)) {
          await apiClient.delete(`/admin/film-reviews/episodes/${serverEp.id}`);
        }
      }

      // Create or update episodes
      for (const ep of episodes) {
        const payload = {
          episodeNum: Number(ep.episodeNum),
          title: ep.title.trim() || null,
          videoUrl: ep.videoUrl.trim(),
          duration: ep.duration ? Number(ep.duration) : null,
          language: ep.language,
        };

        if (ep.id) {
          await apiClient.put(`/admin/film-reviews/episodes/${ep.id}`, payload);
        } else {
          const resp = await apiClient.post(`/admin/film-reviews/${review.id}/episodes`, payload);
          // Update local episode with server ID
          ep.id = resp.data?.data?.id;
        }
      }

      // Update totalEpisodes on the film
      await apiClient.put(`/admin/film-reviews/${review.id}`, {
        totalEpisodes: episodes.length,
      });

      toast.success(`Đã lưu ${episodes.length} tập thành công!`);
    } catch (error: any) {
      console.error("Save episodes error:", error);
      toast.error(error.response?.data?.error || "Lỗi khi lưu danh sách tập");
    } finally {
      setSavingEpisodes(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {review ? "Chỉnh sửa review phim" : "Tạo review phim mới"}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nhập tiêu đề review phim..."
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.title ? "border-red-500" : ""
              }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Mô tả / Nội dung review
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            value={formData.description}
            onChange={handleChange}
            placeholder="Nhập nội dung review phim..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Review Link - only for phim lẻ (movies) */}
          {formData.isMovie && (
            <div>
              <label
                htmlFor="reviewLink"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Link Review (YouTube/Blog...) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="reviewLink"
                name="reviewLink"
                value={formData.reviewLink}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.reviewLink ? "border-red-500" : ""
                  }`}
              />
              {errors.reviewLink && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.reviewLink}
                </p>
              )}
            </div>
          )}

          {/* Thumbnail Upload */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Ảnh thumbnail
            </label>
            {/* Upload button */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang upload...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload ảnh
                  </>
                )}
              </button>
              {formData.thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, thumbnailUrl: "" }))}
                  className="px-3 py-2 text-red-600 hover:text-red-700 text-sm border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* URL input as fallback */}
            <input
              type="text"
              id="thumbnailUrl"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="Hoặc nhập URL ảnh trực tiếp..."
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm ${errors.thumbnailUrl ? "border-red-500" : ""
                }`}
            />
            {errors.thumbnailUrl && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.thumbnailUrl}
              </p>
            )}
            {/* Image preview */}
            {formData.thumbnailUrl && (
              <div className="mt-3 relative inline-block">
                <img
                  src={getMediaUrl(formData.thumbnailUrl)}
                  alt="Preview"
                  loading="lazy"
                  decoding="async"
                  className="w-32 h-44 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded text-white text-[10px] px-1.5 py-0.5 text-center truncate">
                  {formData.thumbnailUrl.split("/").pop()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating */}
          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <span className="text-yellow-500">⭐</span> Đánh giá (0-10)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="rating"
                name="rating"
                min="0"
                max="10"
                step="0.5"
                value={formData.rating}
                onChange={handleChange}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <span
                className={`text-lg font-bold min-w-[3rem] text-center ${formData.rating >= 8
                  ? "text-green-500"
                  : formData.rating >= 5
                    ? "text-yellow-500"
                    : formData.rating > 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
              >
                {formData.rating}
              </span>
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.rating}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Trạng thái
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Xuất bản</option>
            </select>
          </div>

          {/* View Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              👁️ View count
            </label>
            <input
              type="number"
              min="0"
              name="initViewCount"
              value={formData.initViewCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="1000"
            />
            <p className="mt-1 text-xs text-gray-500">Số view hiển thị (mặc định: 1000)</p>
          </div>
        </div>

        {/* Language & Episodes Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🌐 Ngôn ngữ
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="VIETSUB">Vietsub</option>
              <option value="THUYET_MINH">Thuyết Minh</option>
              <option value="LONG_TIENG">Lồng Tiếng</option>
              <option value="RAW">Raw</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🎬 Loại phim
            </label>
            <select
              name="isMovie"
              value={formData.isMovie ? "true" : "false"}
              onChange={(e) => {
                const isMovieType = e.target.value === "true";
                setFormData((prev) => ({
                  ...prev,
                  isMovie: isMovieType,
                  totalEpisodes: isMovieType ? 1 : prev.totalEpisodes,
                  // Clear reviewLink when switching to series mode
                  reviewLink: isMovieType ? prev.reviewLink : "",
                }));
                // Reset episodes when switching to single movie
                if (isMovieType) {
                  setEpisodes([]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="true">Phim lẻ</option>
              <option value="false">Phim bộ</option>
            </select>
          </div>

          {/* Total Episodes */}
          {!formData.isMovie && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📺 Tổng số tập
              </label>
              <input
                type="number"
                min="1"
                readOnly
                value={episodes.length || formData.totalEpisodes}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Tự động tính từ danh sách tập bên dưới</p>
            </div>
          )}
        </div>

        {/* Episodes Array Form */}
        {!formData.isMovie && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Danh sách tập phim ({episodes.length} tập)
              </h4>
              <div className="flex items-center gap-2">
                {review && episodes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveEpisodes}
                    disabled={savingEpisodes}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {savingEpisodes ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>💾 Lưu tập</>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddEpisode}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Thêm tập
                </button>
              </div>
            </div>

            {episodes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625" /></svg>
                <p className="text-sm">Chưa có tập nào. Bấm &quot;Thêm tập&quot; để bắt đầu.</p>
                {!review && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      💡 Hướng dẫn: Bạn có thể thêm tập ở đây. Sau khi lưu phim, bấm "💾 Lưu tập" để lưu danh sách tập.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {episodes.map((ep, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Episode Number Badge */}
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {ep.episodeNum}
                      </div>

                      {/* Episode Fields */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Ep Number */}
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-medium text-gray-500 mb-1">Số tập</label>
                          <input
                            type="number"
                            min="1"
                            value={ep.episodeNum}
                            onChange={(e) => handleEpisodeChange(index, "episodeNum", Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Title */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-medium text-gray-500 mb-1">Tiêu đề tập</label>
                          <input
                            type="text"
                            value={ep.title}
                            onChange={(e) => handleEpisodeChange(index, "title", e.target.value)}
                            placeholder={`Tập ${ep.episodeNum}`}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                        </div>

                        {/* Video URL */}
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-medium text-gray-500 mb-1">Link video <span className="text-red-400">*</span></label>
                          <input
                            type="url"
                            value={ep.videoUrl}
                            onChange={(e) => handleEpisodeChange(index, "videoUrl", e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className={`w-full px-2 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 ${!ep.videoUrl.trim() ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                          />
                        </div>

                        {/* Duration */}
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-medium text-gray-500 mb-1">Phút</label>
                          <input
                            type="number"
                            min="0"
                            value={ep.duration}
                            onChange={(e) => handleEpisodeChange(index, "duration", e.target.value)}
                            placeholder="45"
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Language */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-gray-500 mb-1">Ngôn ngữ</label>
                          <select
                            value={ep.language}
                            onChange={(e) => handleEpisodeChange(index, "language", e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="VIETSUB">Vietsub</option>
                            <option value="THUYET_MINH">TM</option>
                            <option value="LONG_TIENG">LT</option>
                            <option value="RAW">Raw</option>
                          </select>
                        </div>

                        {/* Status indicator */}
                        <div className="sm:col-span-1 flex items-end pb-1">
                          {ep.id ? (
                            <span className="text-[10px] text-green-500 font-medium">✓ Đã lưu</span>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-medium">● Mới</span>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(index)}
                        className="flex-shrink-0 mt-5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa tập"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Danh mục phim
          </label>
          {loadingCategories ? (
            <div className="text-sm text-gray-500">Đang tải danh mục...</div>
          ) : availableCategories.length === 0 ? (
            <div className="text-sm text-gray-500">
              Chưa có danh mục nào. Hãy tạo danh mục trước.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategoryIds.includes(cat.id)
                    ? "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300"
                    : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                >
                  {selectedCategoryIds.includes(cat.id) && (
                    <span className="mr-1">✓</span>
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Diễn viên
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={actorInput}
              onChange={(e) => setActorInput(e.target.value)}
              onKeyDown={handleActorKeyDown}
              placeholder="Nhập tên diễn viên và nhấn Enter..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleAddActor}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Thêm
            </button>
          </div>
          {actorNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actorNames.map((actor) => (
                <span
                  key={actor}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {actor}
                  <button
                    type="button"
                    onClick={() => handleRemoveActor(actor)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Affiliate Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Affiliate Link
          </label>
          <AffiliateLinkSelect
            value={affiliateId || undefined}
            onChange={(id) => setAffiliateId(id)}
            placeholder="Chọn affiliate link cho phim..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Khi người dùng click vào card phim sẽ hiện popup dẫn đến link affiliate này
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Nhập tag và nhấn Enter..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Thêm
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {review ? "Cập nhật review" : "Tạo review mới"}
          </button>
        </div>
      </form>
    </div>
  );
};

export { AdminFilmReviewForm };
export default AdminFilmReviewForm;
