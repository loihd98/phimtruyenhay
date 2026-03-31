"use client";

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AudioPlayer from "../audio/AudioPlayer";

interface LayoutContentProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const audioPlayerOpen = useSelector((state: RootState) => state.ui.audioPlayerOpen);

  return (
    <div
      className="min-h-screen transition-colors duration-200"
    >
      <Navbar />

      <main className="flex-1">{children}</main>

      <Footer />

      {/* Audio Player */}
      {audioPlayerOpen && <AudioPlayer />}

      {/* Global Loading Overlay */}
      <div
        id="loading-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 z-50 items-center justify-center"
        style={{ display: "none" }}
      >
        <div className="bg-cinema-card border border-cinema-border rounded-lg p-6 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="text-white">Đang tải...</span>
        </div>
      </div>

      {/* Toast Notifications Container */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2">
        {/* Toasts will be dynamically added here */}
      </div>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return <LayoutContent>{children}</LayoutContent>;
};

export default Layout;
