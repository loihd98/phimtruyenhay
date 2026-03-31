"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/utils/api";
import { usePermissions } from "../../hooks/usePermissions";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

const AdminBlogCategoryManager: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("blog.category.create");
  const canUpdate = hasPermission("blog.category.update");
  const canDelete = hasPermission("blog.category.delete");

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<BlogCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/blog/categories");
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      toast.error("Có lỗi xảy ra khi tải danh mục blog");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormName("");
    setShowForm(true);
  };

  const handleEdit = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Tên danh mục là bắt buộc");
      return;
    }
    try {
      setSaving(true);
      if (editingCategory) {
        await apiClient.put(`/blog/categories/${editingCategory.id}`, { name: formName.trim() });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await apiClient.post("/blog/categories", { name: formName.trim() });
        toast.success("Tạo danh mục thành công");
      }
      setShowForm(false);
      setFormName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error("Danh mục đã tồn tại");
      } else {
        toast.error(error?.response?.data?.error || "Có lỗi xảy ra");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await apiClient.delete(`/blog/categories/${deletingCategory.id}`);
      toast.success("Xóa danh mục thành công");
      setDeletingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Có lỗi xảy ra khi xóa");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Danh mục Blog</h2>
          <p className="text-sm text-zinc-400 mt-1">Quản lý danh mục cho bài viết blog</p>
        </div>
        {canCreate && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm danh mục
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
            <p>Chưa có danh mục blog nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">/{cat.slug}</p>
                    {cat._count && (
                      <p className="text-xs text-zinc-400 mt-1">{cat._count.posts} bài viết</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {canUpdate && (
                      <button onClick={() => handleEdit(cat)} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors" title="Sửa">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeletingCategory(cat)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors" title="Xóa">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141420] border border-white/[0.08] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</h3>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 mb-4"
              placeholder="Tên danh mục"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setFormName(""); setEditingCategory(null); }} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {editingCategory ? "Cập nhật" : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141420] border border-white/[0.08] rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Xóa danh mục?</h3>
            <p className="text-zinc-400 text-sm mb-6">Bạn có chắc chắn muốn xóa danh mục &quot;{deletingCategory.name}&quot;?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingCategory(null)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm">Hủy</button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogCategoryManager;
