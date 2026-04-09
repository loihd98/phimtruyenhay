"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { RootState } from "../../store";
import { getMediaUrl } from "../../utils/media";
import apiClient from "@/utils/api";
import AffiliateLinkSelect from "./AffiliateLinkSelect";
import { MediaSelectModal } from "./AdminMediaManager";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface Affiliate {
  id: string;
  provider: string;
  targetUrl: string;
  label?: string;
}

interface StoryFormData {
  title: string;
  description: string;
  type: "TEXT" | "AUDIO";
  genreIds: string[];
  thumbnailUrl: string;
  affiliateId?: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  chapter1Title?: string;
  chapter1AudioUrl?: string;
  initViewCount: number;
}

interface TextChapterDraft {
  id?: string;
  number: number;
  title: string;
  content: string;
  audioUrl: string;
  audioPreview: string;
  affiliateId: string;
  isLocked: boolean;
  expanded: boolean;
  uploadingAudio: boolean;
  uploadProgress: number;
}

interface AudioChapterDraft {
  id?: string;
  number: number;
  title: string;
  audioUrl: string;
  audioPreview: string;
  isLocked: boolean;
  expanded: boolean;
  uploadingAudio: boolean;
  uploadProgress: number;
}

interface AdminStoryFormProps {
  storyId?: string;
  defaultType?: "TEXT" | "AUDIO";
  onCloseModal?: () => void;
  onSuccess?: () => void;
}

const AdminStoryForm: React.FC<AdminStoryFormProps> = ({
  storyId,
  defaultType,
  onCloseModal,
  onSuccess,
}) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const lockedType = !storyId && defaultType ? defaultType : undefined;
  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    description: "",
    type: lockedType ?? "TEXT",
    genreIds: [],
    thumbnailUrl: "",
    affiliateId: "",
    status: "DRAFT",
    chapter1Title: "Chương 1",
    chapter1AudioUrl: "",
    initViewCount: 1000,
  });

  const [genres, setGenres] = useState<Genre[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showImageSelectModal, setShowImageSelectModal] = useState(false);
  const [chapter1AudioPreview, setChapter1AudioPreview] = useState<string>("");
  const [showChapter1AudioModal, setShowChapter1AudioModal] = useState(false);
  const [uploadingChapter1, setUploadingChapter1] = useState(false);
  const [chapter1AudioProgress, setChapter1AudioProgress] = useState(0);

  // TEXT chapters accordion
  const emptyChapter = (num: number): TextChapterDraft => ({
    number: num,
    title: `Chương ${num}`,
    content: "",
    audioUrl: "",
    audioPreview: "",
    affiliateId: "",
    isLocked: false,
    expanded: num === 1,
    uploadingAudio: false,
    uploadProgress: 0,
  });
  const [textChapters, setTextChapters] = useState<TextChapterDraft[]>([emptyChapter(1)]);
  const [chapterAudioModalIdx, setChapterAudioModalIdx] = useState<number>(-1);

  const addTextChapter = () =>
    setTextChapters((prev) => [...prev, emptyChapter(prev.length + 1)]);

  const removeTextChapter = (idx: number) =>
    setTextChapters((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((ch, i) => ({ ...ch, number: i + 1 }));
    });

  const updateTextChapter = <K extends keyof TextChapterDraft>(
    idx: number,
    field: K,
    value: TextChapterDraft[K]
  ) => setTextChapters((prev) => prev.map((ch, i) => (i === idx ? { ...ch, [field]: value } : ch)));

  const toggleChapterExpand = (idx: number) =>
    setTextChapters((prev) =>
      prev.map((ch, i) => (i === idx ? { ...ch, expanded: !ch.expanded } : ch))
    );

  const uploadChapterAudio = async (idx: number, file: File) => {
    if (!file.type.startsWith("audio/")) { toast.error("Vui lòng chọn file audio"); return; }
    if (file.size > 1536 * 1024 * 1024) { toast.error("File audio không được vượt quá 1.5GB"); return; }
    updateTextChapter(idx, "uploadingAudio", true);
    updateTextChapter(idx, "uploadProgress", 0);
    updateTextChapter(idx, "audioPreview", URL.createObjectURL(file));
    try {
      const url = await uploadFile(file, "audio", (percent) => updateTextChapter(idx, "uploadProgress", percent));
      updateTextChapter(idx, "audioUrl", url);
    } catch {
      toast.error(`Lỗi upload audio chương ${idx + 1}`);
      updateTextChapter(idx, "audioPreview", "");
    } finally {
      updateTextChapter(idx, "uploadingAudio", false);
    }
  };

  // AUDIO chapters accordion
  const emptyAudioChapter = (num: number): AudioChapterDraft => ({
    number: num,
    title: `Chương ${num}`,
    audioUrl: "",
    audioPreview: "",
    isLocked: false,
    expanded: num === 1,
    uploadingAudio: false,
    uploadProgress: 0,
  });
  const [audioChapters, setAudioChapters] = useState<AudioChapterDraft[]>([emptyAudioChapter(1)]);
  const [audioChapterModalIdx, setAudioChapterModalIdx] = useState<number>(-1);

  const addAudioChapter = () =>
    setAudioChapters((prev) => [...prev, emptyAudioChapter(prev.length + 1)]);

  const removeAudioChapter = (idx: number) =>
    setAudioChapters((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((ch, i) => ({ ...ch, number: i + 1 }));
    });

  const updateAudioChapter = <K extends keyof AudioChapterDraft>(
    idx: number,
    field: K,
    value: AudioChapterDraft[K]
  ) => setAudioChapters((prev) => prev.map((ch, i) => (i === idx ? { ...ch, [field]: value } : ch)));

  const toggleAudioChapterExpand = (idx: number) =>
    setAudioChapters((prev) =>
      prev.map((ch, i) => (i === idx ? { ...ch, expanded: !ch.expanded } : ch))
    );

  const uploadAudioChapterFile = async (idx: number, file: File) => {
    if (!file.type.startsWith("audio/")) { toast.error("Vui lòng chọn file audio"); return; }
    if (file.size > 1536 * 1024 * 1024) { toast.error("File audio không được vượt quá 1.5GB"); return; }
    updateAudioChapter(idx, "uploadingAudio", true);
    updateAudioChapter(idx, "uploadProgress", 0);
    updateAudioChapter(idx, "audioPreview", URL.createObjectURL(file));
    try {
      const url = await uploadFile(file, "audio", (percent) => updateAudioChapter(idx, "uploadProgress", percent));
      updateAudioChapter(idx, "audioUrl", url);
    } catch {
      toast.error(`Lỗi upload audio chương ${idx + 1}`);
      updateAudioChapter(idx, "audioPreview", "");
    } finally {
      updateAudioChapter(idx, "uploadingAudio", false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
    if (storyId) {
      fetchStoryData();
    }
  }, [storyId]);

  // Re-fetch genres whenever the story type changes
  useEffect(() => {
    fetchGenres(formData.type);
  }, [formData.type]);

  const fetchGenres = async (type?: "TEXT" | "AUDIO") => {
    try {
      const t = type ?? formData.type;
      const response = await apiClient.get(`/stories/genres?type=${t}`);
      if (response.data) {
        setGenres(response.data.genres || []);
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const response = await apiClient.get("/admin/affiliate-links");
      if (response.data) {
        // Handle both old and new response formats
        const affiliateLinks =
          response.data.data?.affiliateLinks ||
          response.data.affiliateLinks ||
          [];
        setAffiliates(affiliateLinks);
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast.error("Không thể tải danh sách affiliate links");
    }
  };

  const fetchStoryData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/admin/stories/${storyId}`);

      if (response.data && response.data.success && response.data.data) {
        const story = response.data.data.story;

        setFormData({
          title: story.title || "",
          description: story.description || "",
          type: story.type || "TEXT",
          genreIds: story.genres?.map((g: any) => g.id) || [],
          thumbnailUrl: story.thumbnailUrl || "",
          affiliateId: story.affiliateId || "",
          status: story.status || "DRAFT",
          chapter1Title: story.chapters?.find((c: any) => c.number === 1)?.title || "Chương 1",
          chapter1AudioUrl: story.chapters?.find((c: any) => c.number === 1)?.audioUrl || "",
          initViewCount: story.viewCount ?? 1000,
        });

        const ch1AudioUrl = story.chapters?.find((c: any) => c.number === 1)?.audioUrl;
        if (ch1AudioUrl) {
          setChapter1AudioPreview(getMediaUrl(ch1AudioUrl));
        }

        if (story.thumbnailUrl) {
          setThumbnailPreview(getMediaUrl(story.thumbnailUrl));
        }

        // Populate text chapters from API
        if ((story.type || "TEXT") === "TEXT" && story.chapters?.length > 0) {
          setTextChapters(
            story.chapters
              .sort((a: any, b: any) => a.number - b.number)
              .map((ch: any) => ({
                id: ch.id,
                number: ch.number,
                title: ch.title || `Chương ${ch.number}`,
                content: "",
                audioUrl: ch.audioUrl || "",
                audioPreview: ch.audioUrl ? getMediaUrl(ch.audioUrl) : "",
                affiliateId: ch.affiliateId || "",
                isLocked: ch.isLocked ?? false,
                expanded: false,
                uploadingAudio: false,
              }))
          );
        }

        // Populate audio chapters from API
        if (story.type === "AUDIO" && story.chapters?.length > 0) {
          setAudioChapters(
            story.chapters
              .sort((a: any, b: any) => a.number - b.number)
              .map((ch: any) => ({
                id: ch.id,
                number: ch.number,
                title: ch.title || `Chương ${ch.number}`,
                audioUrl: ch.audioUrl || "",
                audioPreview: ch.audioUrl ? getMediaUrl(ch.audioUrl) : "",
                isLocked: ch.isLocked ?? false,
                expanded: false,
                uploadingAudio: false,
              }))
          );
        }
      } else {
        console.error("Invalid response format:", response.data);
        setError(
          "Không thể tải thông tin truyện - định dạng phản hồi không hợp lệ"
        );
      }
    } catch (error: any) {
      console.error("Error fetching story:", error);
      setError(
        `Không thể tải thông tin truyện: ${error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Clear selected genres when type changes so stale IDs don't cross tables
      if (name === "type") {
        next.genreIds = [];
      }
      return next;
    });
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: checked
        ? [...prev.genreIds, genreId]
        : prev.genreIds.filter((id) => id !== genreId),
    }));
  };

  const uploadFile = async (
    file: File,
    type: "image" | "audio",
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    const fileKey = type === "audio" ? "audio" : "image";

    const formData = new FormData();
    formData.append(fileKey, file);

    const response = await apiClient.post(`media/upload/${type}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 0,
      onUploadProgress: onProgress
        ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
        : undefined,
    });

    return response.data.file.url;
  };

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const errorMsg = "Vui lòng chọn file hình ảnh";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = "File hình ảnh không được vượt quá 5MB";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const filename = await uploadFile(file, "image");
      setFormData((prev) => ({ ...prev, thumbnailUrl: filename }));
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      setError("Có lỗi xảy ra khi upload hình ảnh");
      setThumbnailPreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleChapter1AudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Vui lòng chọn file audio");
      return;
    }
    if (file.size > 1536 * 1024 * 1024) {
      toast.error("File audio không được vượt quá 1.5GB");
      return;
    }
    try {
      setUploadingChapter1(true);
      setChapter1AudioProgress(0);
      setChapter1AudioPreview(URL.createObjectURL(file));
      const url = await uploadFile(file, "audio", (percent) => setChapter1AudioProgress(percent));
      setFormData((prev) => ({ ...prev, chapter1AudioUrl: url }));
    } catch {
      toast.error("Có lỗi xảy ra khi upload audio chương 1");
      setChapter1AudioPreview("");
    } finally {
      setUploadingChapter1(false);
    }
  };

  // Media selection handlers
  const handleImageSelect = (media: any) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: media.url }));
    setThumbnailPreview(getMediaUrl(media.url));
    setShowImageSelectModal(false);
  };

  const handleChapter1AudioSelect = (media: any) => {
    setFormData((prev) => ({ ...prev, chapter1AudioUrl: media.url }));
    setChapter1AudioPreview(getMediaUrl(media.url));
    setShowChapter1AudioModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      const errorMsg = "Vui lòng nhập tiêu đề truyện";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (!formData.description.trim()) {
      const errorMsg = "Vui lòng nhập mô tả truyện";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.genreIds.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất một thể loại";
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const url = storyId ? `admin/stories/${storyId}` : "admin/stories";

      const method = storyId ? "put" : "post";

      // For create, send initViewCount; for update send viewCount so backend applies it
      const payload = storyId
        ? { ...formData, viewCount: formData.initViewCount }
        : formData;

      const response = await apiClient[method](url, payload);

      if (response.status >= 200 && response.status < 300) {
        // For TEXT: create or update chapters
        if (formData.type === "TEXT") {
          const sid = storyId || response.data.story?.id || response.data.data?.story?.id;
          if (sid) {
            for (const ch of textChapters) {
              try {
                if (ch.id) {
                  // Update existing chapter
                  const updatePayload: any = {
                    title: ch.title || `Chương ${ch.number}`,
                    isLocked: ch.isLocked,
                    audioUrl: ch.audioUrl || null,
                    affiliateId: ch.affiliateId || null,
                  };
                  if (ch.content.trim()) updatePayload.content = ch.content;
                  await apiClient.put(`admin/chapters/${ch.id}`, updatePayload);
                } else {
                  // Create new chapter
                  await apiClient.post(`admin/stories/${sid}/chapters`, {
                    number: ch.number,
                    title: ch.title || `Chương ${ch.number}`,
                    content: ch.content,
                    audioUrl: ch.audioUrl || null,
                    affiliateId: ch.affiliateId || null,
                    isLocked: ch.isLocked,
                  });
                }
              } catch (chErr: any) {
                toast.error(`Lỗi chương ${ch.number}: ${chErr.response?.data?.message || chErr.message}`);
              }
            }
          }
        }

        // For AUDIO: create or update audio chapters
        if (formData.type === "AUDIO") {
          const sid = storyId || response.data.story?.id || response.data.data?.story?.id;
          if (sid) {
            for (const ch of audioChapters) {
              try {
                if (ch.id) {
                  await apiClient.put(`admin/chapters/${ch.id}`, {
                    title: ch.title || `Chương ${ch.number}`,
                    isLocked: ch.isLocked,
                    audioUrl: ch.audioUrl || null,
                  });
                } else {
                  await apiClient.post(`admin/stories/${sid}/chapters`, {
                    number: ch.number,
                    title: ch.title || `Chương ${ch.number}`,
                    content: "",
                    audioUrl: ch.audioUrl || null,
                    isLocked: ch.isLocked,
                  });
                }
              } catch (chErr: any) {
                toast.error(`Lỗi chương audio ${ch.number}: ${chErr.response?.data?.message || chErr.message}`);
              }
            }
          }
        }

        const successMessage = storyId ? "Cập nhật truyện thành công!" : "Tạo truyện thành công!";

        toast.success(successMessage);

        // Reset form if creating new story
        if (!storyId) {
          setFormData({
            title: "",
            description: "",
            type: lockedType ?? "TEXT",
            genreIds: [],
            thumbnailUrl: "",
            affiliateId: "",
            status: "DRAFT",
            chapter1Title: "Chương 1",
            chapter1AudioUrl: "",
            initViewCount: 1000,
          });
          setThumbnailPreview("");
          setChapter1AudioPreview("");
          setTextChapters([emptyChapter(1)]);
          setAudioChapters([emptyAudioChapter(1)]);
        }

        // Call success callback to refresh parent list
        if (onSuccess) {
          onSuccess();
        }

        if (onCloseModal) {
          onCloseModal();
        }
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi lưu truyện";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && storyId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 ">
        {/* Error & Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề truyện *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề truyện..."
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại truyện *
              </label>
              {lockedType ? (
                <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed">
                  {lockedType === "AUDIO" ? "🎧 Truyện audio" : "📖 Truyện chữ"}
                </div>
              ) : (
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TEXT">📖 Truyện chữ</option>
                  <option value="AUDIO">🎧 Truyện audio</option>
                </select>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">📝 Bản nháp</option>
                <option value="PUBLISHED">🌟 Đã xuất bản</option>
                <option value="HIDDEN">👁️ Ẩn</option>
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
                value={formData.initViewCount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, initViewCount: Math.max(0, parseInt(e.target.value) || 0) }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Số view hiển thị (mặc định: 1000)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thể loại * (chọn ít nhất 1)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700">
                {genres.map((genre) => (
                  <label key={genre.id} className="flex items-center py-1">
                    <input
                      type="checkbox"
                      checked={formData.genreIds.includes(genre.id)}
                      onChange={(e) =>
                        handleGenreChange(genre.id, e.target.checked)
                      }
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 dark:text-white">
                      {genre.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Affiliate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Liên kết affiliate (tùy chọn)
              </label>
              <AffiliateLinkSelect
                value={formData.affiliateId}
                onChange={(affiliateId) =>
                  setFormData((prev) => ({
                    ...prev,
                    affiliateId: affiliateId || "",
                  }))
                }
                placeholder="Chọn affiliate link..."
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Người dùng sẽ được chuyển đến link này khi click vào thumbnail
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hình ảnh thumbnail
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowImageSelectModal(true)}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  📁 Chọn từ thư viện
                </button>
              </div>
              {thumbnailPreview && (
                <div className="mt-2">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="rounded-md object-cover w-[200px] h-[250px]"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
        {/* Description */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả truyện..."
            required
          />
        </div>

        {/* Chapters accordion for TEXT type */}
        {formData.type === "TEXT" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                📖 Danh sách chương ({textChapters.length})
              </h3>
              <button
                type="button"
                onClick={addTextChapter}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Thêm chương
              </button>
            </div>

            <div className="space-y-2">
              {textChapters.map((chapter, idx) => (
                <div
                  key={idx}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 cursor-pointer select-none"
                    onClick={() => toggleChapterExpand(idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        #{chapter.number}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {chapter.title || `Chương ${chapter.number}`}
                      </span>
                      {chapter.isLocked && <span className="text-xs shrink-0">🔒</span>}
                      {chapter.id && (
                        <span className="text-xs text-green-600 dark:text-green-400 shrink-0">(có sẵn)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {textChapters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeTextChapter(idx); }}
                          className="text-xs text-red-600 hover:text-red-800 px-1"
                        >
                          Xóa
                        </button>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${chapter.expanded ? "rotate-180" : ""
                          }`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Body */}
                  {chapter.expanded && (
                    <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
                      {/* Affiliate link */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          🔗 Link Affiliate (tùy chọn)
                        </label>
                        <AffiliateLinkSelect
                          value={chapter.affiliateId}
                          onChange={(affiliateId) =>
                            updateTextChapter(idx, "affiliateId", affiliateId || "")
                          }
                          placeholder="Chọn affiliate link..."
                          className="w-full text-sm"
                        />
                      </div>
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Tiêu đề chương
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateTextChapter(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder={`Chương ${chapter.number}`}
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Nội dung văn bản{!chapter.id && idx === 0 ? " *" : ""}
                          {chapter.id && (
                            <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                              (bỏ trống để giữ nguyên nội dung cũ)
                            </span>
                          )}
                        </label>
                        <textarea
                          value={chapter.content}
                          onChange={(e) => updateTextChapter(idx, "content", e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập nội dung chương..."
                        />
                      </div>

                      {/* Audio upload */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          File audio (tùy chọn)
                        </label>
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              {chapter.uploadingAudio ? (
                                <span className="flex items-center justify-center gap-1">
                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                                  {chapter.uploadProgress > 0 ? `${chapter.uploadProgress}%` : "Đang upload..."}
                                </span>
                              ) : (
                                "📂 Chọn file audio"
                              )}
                            </div>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              disabled={chapter.uploadingAudio}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadChapterAudio(idx, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setChapterAudioModalIdx(idx)}
                            disabled={chapter.uploadingAudio}
                            className="px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            🎵 Thư viện
                          </button>
                        </div>
                        {chapter.uploadingAudio && chapter.uploadProgress > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${chapter.uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {chapter.audioPreview && (
                          <audio
                            controls
                            className="w-full mt-2 h-8"
                            onError={() => {
                              updateTextChapter(idx, "audioPreview", "");
                              updateTextChapter(idx, "audioUrl", "");
                              toast.error(`File audio chương ${chapter.number} bị thiếu, vui lòng upload lại.`);
                            }}
                          >
                            <source src={chapter.audioPreview} />
                          </audio>
                        )}
                        {chapter.audioUrl && !chapter.audioPreview && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Đã có audio</p>
                        )}
                      </div>


                      {/* isLocked */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chapter.isLocked}
                          onChange={(e) => updateTextChapter(idx, "isLocked", e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">🔒 Khóa chương</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chapters accordion for AUDIO type */}
        {formData.type === "AUDIO" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                🎧 Danh sách chương audio ({audioChapters.length})
              </h3>
              <button
                type="button"
                onClick={addAudioChapter}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
              >
                + Thêm chương
              </button>
            </div>

            <div className="space-y-2">
              {audioChapters.map((chapter, idx) => (
                <div
                  key={idx}
                  className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 cursor-pointer select-none"
                    onClick={() => toggleAudioChapterExpand(idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0">
                        #{chapter.number}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {chapter.title || `Chương ${chapter.number}`}
                      </span>
                      {chapter.isLocked && <span className="text-xs shrink-0">🔒</span>}
                      {chapter.audioUrl && <span className="text-xs text-green-600 dark:text-green-400 shrink-0">🎵</span>}
                      {chapter.id && (
                        <span className="text-xs text-green-600 dark:text-green-400 shrink-0">(có sẵn)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {audioChapters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeAudioChapter(idx); }}
                          className="text-xs text-red-600 hover:text-red-800 px-1"
                        >
                          Xóa
                        </button>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${chapter.expanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Body */}
                  {chapter.expanded && (
                    <div className="p-4 space-y-3 bg-white dark:bg-gray-800">
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Tiêu đề chương
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateAudioChapter(idx, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder={`Chương ${chapter.number}`}
                        />
                      </div>

                      {/* Audio upload */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          File audio{idx === 0 && !chapter.id ? " *" : ""}
                        </label>
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs text-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              {chapter.uploadingAudio ? (
                                <span className="flex items-center justify-center gap-1">
                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600" />
                                  {chapter.uploadProgress > 0 ? `${chapter.uploadProgress}%` : "Đang upload..."}
                                </span>
                              ) : (
                                "📂 Chọn file audio"
                              )}
                            </div>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              disabled={chapter.uploadingAudio}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadAudioChapterFile(idx, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAudioChapterModalIdx(idx)}
                            disabled={chapter.uploadingAudio}
                            className="px-3 py-2 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            🎵 Thư viện
                          </button>
                        </div>
                        {chapter.uploadingAudio && chapter.uploadProgress > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${chapter.uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {chapter.audioPreview && (
                          <audio
                            controls
                            className="w-full mt-2 h-8"
                            onError={() => {
                              updateAudioChapter(idx, "audioPreview", "");
                              updateAudioChapter(idx, "audioUrl", "");
                              toast.error(`File audio chương ${chapter.number} bị thiếu, vui lòng upload lại.`);
                            }}
                          >
                            <source src={chapter.audioPreview} />
                          </audio>
                        )}
                        {chapter.audioUrl && !chapter.audioPreview && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Đã có audio</p>
                        )}
                      </div>

                      {/* isLocked */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chapter.isLocked}
                          onChange={(e) => updateAudioChapter(idx, "isLocked", e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">🔒 Khóa chương</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCloseModal}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || uploading || uploadingChapter1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang lưu...
              </div>
            ) : storyId ? (
              "Cập nhật"
            ) : (
              "Tạo mới"
            )}
          </button>
        </div>
      </div>

      {/* Media Selection Modals */}
      <MediaSelectModal
        isOpen={showImageSelectModal}
        onClose={() => setShowImageSelectModal(false)}
        onSelect={handleImageSelect}
        type="image"
        title="Chọn hình ảnh từ thư viện"
      />

      <MediaSelectModal
        isOpen={chapterAudioModalIdx >= 0}
        onClose={() => setChapterAudioModalIdx(-1)}
        onSelect={(media: any) => {
          if (chapterAudioModalIdx >= 0) {
            updateTextChapter(chapterAudioModalIdx, "audioUrl", media.url);
            updateTextChapter(chapterAudioModalIdx, "audioPreview", getMediaUrl(media.url));
          }
          setChapterAudioModalIdx(-1);
        }}
        type="audio"
        title="Chọn audio cho chương"
      />

      <MediaSelectModal
        isOpen={audioChapterModalIdx >= 0}
        onClose={() => setAudioChapterModalIdx(-1)}
        onSelect={(media: any) => {
          if (audioChapterModalIdx >= 0) {
            updateAudioChapter(audioChapterModalIdx, "audioUrl", media.url);
            updateAudioChapter(audioChapterModalIdx, "audioPreview", getMediaUrl(media.url));
          }
          setAudioChapterModalIdx(-1);
        }}
        type="audio"
        title="Chọn audio cho chương"
      />

      <MediaSelectModal
        isOpen={showChapter1AudioModal}
        onClose={() => setShowChapter1AudioModal(false)}
        onSelect={handleChapter1AudioSelect}
        type="audio"
        title="Chọn audio cho Chương 1"
      />
    </form>
  );
};

export default AdminStoryForm;
