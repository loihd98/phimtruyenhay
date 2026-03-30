"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePermissions } from "../../hooks/usePermissions";
import { User } from "../../types";
import { AdminTab } from "../../types/admin";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User | null;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { id: AdminTab; label: string; permission?: string }[];
  permission?: string; // Group-level permission
}

/**
 * TAB_PERMISSION_MAP — maps sidebar tabs to required permission codes.
 * Tabs not in this map default to ADMIN-only.
 * "ADMIN_ONLY" means the tab is hidden for non-ADMIN roles entirely.
 */
const TAB_PERMISSION_MAP: Partial<Record<AdminTab, string | "ADMIN_ONLY">> = {
  dashboard: "admin.dashboard.view",
  stories: "story_text.view",
  "audio-stories": "story_audio.view",
  genres: "story_text.view",
  "audio-genres": "story_audio.view",
  "film-reviews": "film.view",
  "film-categories": "film.view",
  users: "ADMIN_ONLY",
  comments: "ADMIN_ONLY",
  media: "ADMIN_ONLY",
  roles: "ADMIN_ONLY",
  settings: "ADMIN_ONLY",
  "affiliate-links": "ADMIN_ONLY",
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  isOpen = false,
  onClose,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["audio", "text", "film"]);

  const isAdmin = user?.role === "ADMIN";

  /**
   * Check if a tab should be visible based on permissions
   */
  const canSeeTab = (tabId: AdminTab): boolean => {
    if (isAdmin) return true;
    const requiredPermission = TAB_PERMISSION_MAP[tabId];
    if (!requiredPermission) return true; // No permission required
    if (requiredPermission === "ADMIN_ONLY") return false; // Only ADMIN
    return hasPermission(requiredPermission);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleMenuClick = (itemId: AdminTab) => {
    onTabChange(itemId);
    if (onClose) onClose();
  };

  const menuGroups: MenuGroup[] = [
    {
      id: "audio",
      label: "Truyện Audio",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      items: [
        { id: "audio-stories" as AdminTab, label: "Quản lý truyện audio" },
        { id: "audio-genres" as AdminTab, label: "Thể loại audio" },
      ],
    },
    {
      id: "text",
      label: "Truyện Text",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      items: [
        { id: "stories" as AdminTab, label: "Quản lý truyện text" },
        { id: "genres" as AdminTab, label: "Thể loại text" },
      ],
    },
    {
      id: "film",
      label: "Phim",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      items: [
        { id: "film-reviews" as AdminTab, label: "Quản lý phim" },
        { id: "film-categories" as AdminTab, label: "Thể loại phim" },
      ],
    },
  ];

  const standaloneItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard" as AdminTab,
      label: t("admin.dashboard"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-4-2-4 2V5z" />
        </svg>
      ),
    },
    {
      id: "affiliate-links" as AdminTab,
      label: "Affiliate Links",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: "users" as AdminTab,
      label: t("admin.users.title"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      id: "comments" as AdminTab,
      label: "Quản lý bình luận",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "media" as AdminTab,
      label: t("admin.media.title1"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "settings" as AdminTab,
      label: t("admin.settings.title"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "roles" as AdminTab,
      label: "Phân quyền",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const isTabInGroup = (groupId: string) => {
    const group = menuGroups.find((g) => g.id === groupId);
    return group?.items.some((item) => item.id === activeTab) || false;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-700 to-blue-800">
          <h2 className="text-lg font-bold text-white">📊 Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-blue-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-blue-400 font-medium">
                {user?.role || t("admin.role")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Dashboard standalone item */}
          {canSeeTab("dashboard") && (
          <button
            onClick={() => handleMenuClick("dashboard")}
            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${activeTab === "dashboard"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <span className="mr-3">{standaloneItems[0].icon}</span>
            <span>{standaloneItems[0].label}</span>
          </button>
          )}

          {/* Collapsible Menu Groups */}
          {menuGroups.map((group) => {
            // Filter items by permission
            const visibleItems = group.items.filter((item) => canSeeTab(item.id));
            if (visibleItems.length === 0) return null;

            return (
            <div key={group.id} className="mt-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isTabInGroup(group.id)
                  ? "bg-gray-800 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{group.icon}</span>
                  <span>{group.label}</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${expandedGroups.includes(group.id) ? "rotate-180" : ""
                    }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Submenu items */}
              <div
                className={`overflow-hidden transition-all duration-200 ${expandedGroups.includes(group.id) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-700 pl-3">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 ${activeTab === item.id
                        ? "bg-blue-600/20 text-blue-400 font-medium"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-3 ${activeTab === item.id ? "bg-blue-400" : "bg-gray-600"
                        }`}></span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            );
          })}

          {/* Divider */}
          <div className="border-t border-gray-700 my-2"></div>

          {/* Standalone items (skip dashboard, already rendered) */}
          {standaloneItems.slice(1).filter((item) => canSeeTab(item.id)).map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${activeTab === item.id
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="text-xs text-gray-500 text-center">
            <div className="font-medium text-gray-400">vivutruyenhay.com Admin</div>
            <div className="mt-1">Version 1.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
