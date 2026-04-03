const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../lib/prisma");
const config = require("../config");

// Configure multer for audio files
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.uploadPath || "uploads", "audio");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Configure multer for image files
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.uploadPath || "uploads", "image");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for audio files
const audioFilter = (req, file, cb) => {
  const allowedMimes = [
    "audio/mpeg", // MP3
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Chỉ cho phép upload file audio (MP3, WAV, OGG, AAC, FLAC)"),
      false,
    );
  }
};

// File filter for image files
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Chỉ cho phép upload file hình ảnh (JPG, PNG, WEBP, GIF)"),
      false,
    );
  }
};

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 1536 * 1024 * 1024, // 1.5GB for audio
  },
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.maxFileSize, // uses config (1.5GB)
  },
});

// Universal upload for both image and audio
const universalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.mimetype.startsWith("image/") ? "image" : "audio";
    const uploadDir = path.join(config.uploadPath || "uploads", type);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const universalFilter = (req, file, cb) => {
  const allowedMimes = [
    // image
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Chỉ cho phép upload file hình ảnh (JPG, PNG, WEBP, GIF) hoặc audio (MP3, WAV, OGG, AAC, FLAC)",
      ),
      false,
    );
  }
};

const universalUpload = multer({
  storage: universalStorage,
  fileFilter: universalFilter,
  limits: {
    fileSize: 1536 * 1024 * 1024, // 1.5GB
  },
});

class MediaController {
  // Upload audio file
  async uploadAudio(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Không có file được upload",
        });
      }

      const audioUrl = `/uploads/audio/${req.file.filename}`;

      res.json({
        message: "Upload thành công",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: audioUrl,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Upload audio error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi upload file",
      });
    }
  }

  // Upload image file
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Không có file được upload",
        });
      }

      const imageUrl = `/uploads/image/${req.file.filename}`;

      res.json({
        message: "Upload thành công",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: imageUrl,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Upload image error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi upload file",
      });
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      const { type } = req.query; // 'audio' or 'image'

      if (!type || !["audio", "image"].includes(type)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Type phải là audio hoặc image",
        });
      }

      // Prevent path traversal
      const safeFilename = path.basename(filename);
      if (safeFilename !== filename || filename.includes("..")) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Tên file không hợp lệ",
        });
      }

      // Resolve upload path - ensure it's absolute
      let uploadBasePath = config.uploadPath || "./uploads";
      if (!path.isAbsolute(uploadBasePath)) {
        // If relative, resolve from project root
        uploadBasePath = path.join(process.cwd(), uploadBasePath);
      }

      const filePath = path.join(uploadBasePath, type, safeFilename);

      console.log(`[Media Delete] Attempting to delete file at: ${filePath}`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`[Media Delete] File not found at path: ${filePath}`);
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "File không tồn tại",
        });
      }

      // Verify it's actually in the upload directory (prevent escape attempts)
      const realPath = fs.realpathSync(filePath);
      const realUploadPath = fs.realpathSync(uploadBasePath);
      if (!realPath.startsWith(realUploadPath)) {
        console.error(
          `[Media Delete] Security check failed - path outside upload directory: ${realPath}`
        );
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Đường dẫn file không hợp lệ",
        });
      }

      // Delete file
      try {
        fs.unlinkSync(filePath);
        console.log(`[Media Delete] Successfully deleted file: ${filePath}`);
      } catch (fsError) {
        console.error(
          `[Media Delete] Failed to delete file at ${filePath}:`,
          fsError.message,
          fsError.code
        );
        return res.status(403).json({
          success: false,
          error: "Permission Denied",
          message: `Lỗi xóa file: ${fsError.message}`,
        });
      }

      res.json({
        success: true,
        message: "File đã được xóa",
      });
    } catch (error) {
      console.error(
        "[Media Delete] Unexpected error:",
        error.message,
        error.stack
      );
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi xóa file",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get file info
  async getFileInfo(req, res) {
    try {
      const { filename } = req.params;
      const { type } = req.query;

      if (!type || !["audio", "image"].includes(type)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Type phải là audio hoặc image",
        });
      }

      // Prevent path traversal
      const safeFilename = path.basename(filename);
      if (safeFilename !== filename || filename.includes("..")) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Tên file không hợp lệ",
        });
      }

      // Resolve upload path - ensure it's absolute
      let uploadBasePath = config.uploadPath || "./uploads";
      if (!path.isAbsolute(uploadBasePath)) {
        uploadBasePath = path.join(process.cwd(), uploadBasePath);
      }

      const filePath = path.join(uploadBasePath, type, safeFilename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: "Not Found",
          message: "File không tồn tại",
        });
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      res.json({
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        url: `/uploads/${type}/${filename}`,
      });
    } catch (error) {
      console.error("Get file info error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy thông tin file",
      });
    }
  }

  // List uploaded files
  async listFiles(req, res) {
    try {
      const { type } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!type || !["audio", "image"].includes(type)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Type phải là audio hoặc image",
        });
      }

      // Resolve upload path - ensure it's absolute
      let uploadBasePath = config.uploadPath || "./uploads";
      if (!path.isAbsolute(uploadBasePath)) {
        uploadBasePath = path.join(process.cwd(), uploadBasePath);
      }

      const dirPath = path.join(uploadBasePath, type);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        return res.json({
          files: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }

      // Get all files
      const allFiles = fs.readdirSync(dirPath);
      const total = allFiles.length;

      // Paginate
      const skip = (page - 1) * limit;
      const files = allFiles
        .slice(skip, skip + limit)
        .map((filename) => {
          const filePath = path.join(dirPath, filename);
          const stats = fs.statSync(filePath);

          return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            url: `/uploads/${type}/${filename}`,
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        files,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("List files error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy danh sách file",
      });
    }
  }

  // GET /api/media - Get all media files with search and pagination
  async getMediaFiles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        type = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        isActive: true,
        ...(search && {
          OR: [
            { filename: { contains: search, mode: "insensitive" } },
            { originalName: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(type && { type }),
      };

      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      const [mediaFiles, total] = await Promise.all([
        prisma.media.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy,
        }),
        prisma.media.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          mediaFiles,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching media files:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch media files",
      });
    }
  }

  // POST /api/media/upload - Upload and save media file to database
  async uploadMediaToDatabase(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { file } = req;
      const type = file.mimetype.startsWith("image/") ? "image" : "audio";
      const url = `/uploads/${type}/${file.filename}`;

      const mediaFile = await prisma.media.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
          type,
        },
      });

      res.status(201).json({
        success: true,
        data: mediaFile,
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
      });
    }
  }

  // DELETE /api/media/:id - Delete media file
  async deleteMediaFile(req, res) {
    try {
      const { id } = req.params;

      const existingMedia = await prisma.media.findUnique({
        where: { id },
      });

      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          message: "Media file not found",
        });
      }

      // Delete physical file
      const filePath = path.join(
        config.uploadPath || "./uploads",
        existingMedia.type,
        existingMedia.filename,
      );
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn("Could not delete physical file:", fileError.message);
      }

      // Delete database record
      await prisma.media.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Media file deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting media file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete media file",
      });
    }
  }

  // GET /api/media/search - Search media files for select dropdown
  async searchMediaFiles(req, res) {
    try {
      const { q = "", type = "", limit = 20 } = req.query;

      const where = {
        isActive: true,
        ...(type && { type }),
        ...(q && {
          OR: [
            { filename: { contains: q, mode: "insensitive" } },
            { originalName: { contains: q, mode: "insensitive" } },
          ],
        }),
      };

      const mediaFiles = await prisma.media.findMany({
        where,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filename: true,
          originalName: true,
          url: true,
          type: true,
          mimeType: true,
          size: true,
        },
      });

      res.json({
        success: true,
        data: mediaFiles,
      });
    } catch (error) {
      console.error("Error searching media files:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search media files",
      });
    }
  }

  // GET /api/media/usages - Get usageMap: { [filename]: [{type, title, slug}] }
  // Builds map by directly querying stories/chapters/filmReviews for all URL references.
  async getFileUsages(req, res) {
    try {
      // Query all entities that reference uploaded files
      const [stories, chapters, filmReviews] = await Promise.all([
        prisma.story.findMany({
          select: {
            title: true,
            slug: true,
            thumbnailUrl: true,
            type: true,
          },
        }),
        prisma.chapter.findMany({
          select: {
            number: true,
            title: true,
            audioUrl: true,
            story: { select: { title: true, slug: true } },
          },
        }),
        prisma.filmReview
          .findMany({
            select: { title: true, slug: true, thumbnailUrl: true },
          })
          .catch(() => []),
      ]);

      // Build URL → [usage descriptor] map
      const urlToUsages = {};
      const addUsage = (url, usage) => {
        if (!url) return;
        urlToUsages[url] = urlToUsages[url] || [];
        urlToUsages[url].push(usage);
      };

      for (const story of stories) {
        if (story.thumbnailUrl) {
          addUsage(story.thumbnailUrl, {
            type: story.type === "AUDIO" ? "Truyện audio" : "Truyện chữ",
            title: story.title,
            slug: story.slug,
          });
        }
      }

      for (const chapter of chapters) {
        if (chapter.audioUrl) {
          addUsage(chapter.audioUrl, {
            type: "Chương truyện",
            title: `${chapter.story?.title} – ${chapter.title || `Chương ${chapter.number}`}`,
            slug: chapter.story?.slug,
          });
        }
      }

      for (const film of filmReviews) {
        if (film.thumbnailUrl) {
          addUsage(film.thumbnailUrl, {
            type: "Phim",
            title: film.title,
            slug: film.slug,
          });
        }
      }

      // Scan filesystem to build usageMap keyed by filename
      // Resolve upload path - ensure it's absolute
      let uploadBasePath = config.uploadPath || "./uploads";
      if (!path.isAbsolute(uploadBasePath)) {
        uploadBasePath = path.join(process.cwd(), uploadBasePath);
      }

      const audioDir = path.join(uploadBasePath, "audio");
      const imageDir = path.join(uploadBasePath, "image");

      const audioFiles = fs.existsSync(audioDir)
        ? fs.readdirSync(audioDir)
        : [];
      const imageFiles = fs.existsSync(imageDir)
        ? fs.readdirSync(imageDir)
        : [];

      const usageMap = {};
      for (const filename of audioFiles) {
        usageMap[filename] = urlToUsages[`/uploads/audio/${filename}`] || [];
      }
      for (const filename of imageFiles) {
        usageMap[filename] = urlToUsages[`/uploads/image/${filename}`] || [];
      }

      res.json({ success: true, usageMap });
    } catch (error) {
      console.error("Error getting file usages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get file usages",
      });
    }
  }
}

module.exports = {
  MediaController: new MediaController(),
  uploadAudio: audioUpload.single("audio"),
  uploadImage: imageUpload.single("image"),
  // Accept `file` field name for universal uploads (frontend uses `file` in many places)
  uploadUniversal: universalUpload.single("file"),
};
