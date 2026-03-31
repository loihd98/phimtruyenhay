"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/utils/api";
import { usePermissions } from "../../hooks/usePermissions";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnailUrl?: string;
  content?: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatar?: string };
  categories?: BlogCategory[];
  _count?: { comments: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminBlogManager: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("blog.create");
  const canUpdate = hasPermission("blog.update");
  const canDelete = hasPermission("blog.delete");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await apiClient.get(`/blog/admin/all?${params}`);
      const { data, pagination: pg } = response.data;
      setPosts(data || []);
      if (pg) setPagination(pg);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách bài blog");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/blog/categories");
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormExcerpt("");
    setFormThumbnail("");
    setFormTags("");
    setFormStatus("DRAFT");
    setFormCategoryIds([]);
    setEditingPost(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content || "");
    setFormExcerpt(post.excerpt || "");
    setFormThumbnail(post.thumbnailUrl || "");
    setFormTags(post.tags?.join(", ") || "");
    setFormStatus(post.status);
    setFormCategoryIds(post.categories?.map((c) => c.id) || []);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Tiêu đề và nội dung là bắt buộc");
      return;
    }
    try {
      setSaving(true);
      const data = {
        title: formTitle.trim(),
        content: formContent.trim(),
        excerpt: formExcerpt.trim() || undefined,
        thumbnailUrl: formThumbnail.trim() || undefined,
        tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
        categoryIds: formCategoryIds,
        status: formStatus,
      };

      if (editingPost) {
        await apiClient.put(`/blog/${editingPost.id}`, data);
        toast.success("Cập nhật bài blog thành công");
      } else {
        await apiClient.post("/blog", data);
        toast.success("Tạo bài blog thành công");
      }
      setShowForm(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    try {
      await apiClient.delete(`/blog/${deletingPost.id}`);
      toast.success("Xóa bài blog thành công");
      setDeletingPost(null);
      fetchPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Có lỗi xảy ra khi xóa");
    }
  };

  const handleCategoryToggle = (catId: string) => {
    setFormCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý Blog</h2>
          <p className="text-sm text-zinc-400 mt-1">Quản lý bài viết blog của trang web</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài viết
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            className="flex-1 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/50 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-primary-500/50 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors text-sm font-medium">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            <p>Chưa có bài blog nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Tiêu đề</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden sm:table-cell">Tác giả</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden md:table-cell">Danh mục</th>
                  <th className="text-center px-4 py-3 text-zinc-400 font-medium">Trạng thái</th>
                  <th className="text-center px-4 py-3 text-zinc-400 font-medium hidden sm:table-cell">Lượt xem</th>
                  <th className="text-center px-4 py-3 text-zinc-400 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white line-clamp-1">{post.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{new Date(post.updatedAt).toLocaleDateString("vi-VN")}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{post.author?.name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {post.categories?.slice(0, 2).map((c) => (
                          <span key={c.id} className="text-[10px] px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full">{c.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        post.status === "PUBLISHED" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {post.status === "PUBLISHED" ? "Xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-400 hidden sm:table-cell">{post.viewCount}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canUpdate && (
                          <button onClick={() => handleEdit(post)} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors" title="Sửa">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeletingPost(post)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors" title="Xóa">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-sm text-zinc-500">
              Trang {pagination.page}/{pagination.totalPages} ({pagination.total} bài viết)
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page <= 1} className="px-3 py-1 text-sm rounded-lg bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] disabled:opacity-40 transition-colors">Trước</button>
              <button onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 text-sm rounded-lg bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] disabled:opacity-40 transition-colors">Sau</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141420] border border-white/[0.08] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#141420] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white">{editingPost ? "Chỉnh sửa bài blog" : "Tạo bài blog mới"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tiêu đề *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50" placeholder="Nhập tiêu đề bài viết" />
              </div>
              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tóm tắt</label>
                <textarea value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none" placeholder="Tóm tắt ngắn gọn (tùy chọn)" />
              </div>
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nội dung *</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={10} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 resize-y font-mono text-sm" placeholder="Nội dung bài viết (hỗ trợ HTML)" />
              </div>
              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Ảnh đại diện (URL)</label>
                <input type="text" value={formThumbnail} onChange={(e) => setFormThumbnail(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50" placeholder="https://..." />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tags (phân cách bằng dấu phẩy)</label>
                <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50" placeholder="tag1, tag2, tag3" />
              </div>
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => handleCategoryToggle(cat.id)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formCategoryIds.includes(cat.id) ? "bg-primary-500 text-white" : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"}`}>
                      {cat.name}
                    </button>
                  ))}
                  {categories.length === 0 && <p className="text-zinc-500 text-sm">Chưa có danh mục nào</p>}
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Trạng thái</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-primary-500/50">
                  <option value="DRAFT">Nháp</option>
                  <option value="PUBLISHED">Xuất bản</option>
                </select>
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {editingPost ? "Cập nhật" : "Tạo bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141420] border border-white/[0.08] rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Xóa bài blog?</h3>
              <p className="text-zinc-400 text-sm mb-6">Bạn có chắc chắn muốn xóa &quot;{deletingPost.title}&quot;? Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeletingPost(null)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">Hủy</button>
                <button onClick={handleDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm">Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogManager;
