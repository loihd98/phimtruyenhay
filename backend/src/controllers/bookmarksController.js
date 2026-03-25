const prisma = require("../lib/prisma");

class BookmarksController {
  // Create bookmark
  async createBookmark(req, res) {
    try {
      const { storyId, chapterId, filmReviewId } = req.body;

      // Validate that at least one target is provided
      if (!storyId && !chapterId && !filmReviewId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Cần cung cấp storyId, chapterId hoặc filmReviewId",
        });
      }

      // Cannot mix story and film bookmarks
      if (filmReviewId && (storyId || chapterId)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Không thể bookmark truyện và phim cùng lúc",
        });
      }

      if (filmReviewId) {
        const filmReview = await prisma.filmReview.findUnique({
          where: { id: filmReviewId },
          select: { id: true, title: true },
        });

        if (!filmReview) {
          return res.status(404).json({
            error: "Not Found",
            message: "Film review không tồn tại",
          });
        }

        const existingBookmark = await prisma.bookmark.findFirst({
          where: { userId: req.user.id, filmReviewId },
        });

        if (existingBookmark) {
          return res.status(400).json({
            error: "Conflict",
            message: "Bookmark đã tồn tại",
          });
        }

        const bookmark = await prisma.bookmark.create({
          data: {
            userId: req.user.id,
            filmReviewId,
          },
          include: {
            filmReview: {
              select: {
                id: true,
                slug: true,
                title: true,
                thumbnailUrl: true,
              },
            },
          },
        });

        return res.status(201).json({
          message: "Bookmark đã được tạo",
          bookmark,
        });
      }

      // If storyId provided, verify story exists
      if (storyId) {
        const story = await prisma.story.findUnique({
          where: { id: storyId },
          select: { id: true, title: true },
        });

        if (!story) {
          return res.status(404).json({
            error: "Not Found",
            message: "Truyện không tồn tại",
          });
        }
      }

      // If chapterId provided, verify chapter exists
      if (chapterId) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: chapterId },
          select: { id: true, title: true, storyId: true },
        });

        if (!chapter) {
          return res.status(404).json({
            error: "Not Found",
            message: "Chương không tồn tại",
          });
        }

        // If both storyId and chapterId provided, ensure they match
        if (storyId && chapter.storyId !== storyId) {
          return res.status(400).json({
            error: "Bad Request",
            message: "Chương không thuộc truyện được chỉ định",
          });
        }
      }

      // Check if bookmark already exists
      const existingBookmark = await prisma.bookmark.findFirst({
        where: {
          userId: req.user.id,
          storyId: storyId || null,
          chapterId: chapterId || null,
        },
      });

      if (existingBookmark) {
        return res.status(400).json({
          error: "Conflict",
          message: "Bookmark đã tồn tại",
        });
      }

      // Create bookmark
      const bookmark = await prisma.bookmark.create({
        data: {
          userId: req.user.id,
          storyId: storyId || null,
          chapterId: chapterId || null,
        },
        include: {
          story: storyId
            ? {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  thumbnailUrl: true,
                  type: true,
                  author: {
                    select: {
                      name: true,
                    },
                  },
                },
              }
            : undefined,
          chapter: chapterId
            ? {
                select: {
                  id: true,
                  number: true,
                  title: true,
                  story: {
                    select: {
                      id: true,
                      slug: true,
                      title: true,
                      thumbnailUrl: true,
                      type: true,
                    },
                  },
                },
              }
            : undefined,
        },
      });

      res.status(201).json({
        message: "Bookmark đã được tạo",
        bookmark,
      });
    } catch (error) {
      console.error("Create bookmark error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi tạo bookmark",
      });
    }
  }

  // Delete bookmark
  async deleteBookmark(req, res) {
    try {
      const { id } = req.params;

      // Get bookmark
      const bookmark = await prisma.bookmark.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!bookmark) {
        return res.status(404).json({
          error: "Not Found",
          message: "Bookmark không tồn tại",
        });
      }

      // Check permission
      if (bookmark.userId !== req.user.id) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Bạn không có quyền xóa bookmark này",
        });
      }

      // Delete bookmark
      await prisma.bookmark.delete({
        where: { id },
      });

      res.json({
        message: "Bookmark đã được xóa",
      });
    } catch (error) {
      console.error("Delete bookmark error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi xóa bookmark",
      });
    }
  }

  // Toggle bookmark (create if not exists, delete if exists)
  async toggleBookmark(req, res) {
    try {
      const { storyId, chapterId, filmReviewId } = req.body;

      // Validate input
      if (!storyId && !chapterId && !filmReviewId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Cần cung cấp storyId, chapterId hoặc filmReviewId",
        });
      }

      // Film review bookmark toggle
      if (filmReviewId) {
        const existingBookmark = await prisma.bookmark.findFirst({
          where: { userId: req.user.id, filmReviewId },
        });

        if (existingBookmark) {
          await prisma.bookmark.delete({ where: { id: existingBookmark.id } });
          return res.json({ message: "Bookmark đã được xóa", action: "removed" });
        } else {
          const bookmark = await prisma.bookmark.create({
            data: { userId: req.user.id, filmReviewId },
            include: {
              filmReview: {
                select: { id: true, slug: true, title: true, thumbnailUrl: true },
              },
            },
          });
          return res.status(201).json({ message: "Bookmark đã được tạo", action: "added", bookmark });
        }
      }

      // Check if bookmark exists
      const existingBookmark = await prisma.bookmark.findFirst({
        where: {
          userId: req.user.id,
          storyId: storyId || null,
          chapterId: chapterId || null,
        },
      });

      if (existingBookmark) {
        // Delete existing bookmark
        await prisma.bookmark.delete({
          where: { id: existingBookmark.id },
        });

        return res.json({
          message: "Bookmark đã được xóa",
          action: "removed",
        });
      } else {
        // Create new bookmark
        const bookmark = await prisma.bookmark.create({
          data: {
            userId: req.user.id,
            storyId: storyId || null,
            chapterId: chapterId || null,
          },
          include: {
            story: storyId
              ? {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    thumbnailUrl: true,
                    type: true,
                  },
                }
              : undefined,
            chapter: chapterId
              ? {
                  select: {
                    id: true,
                    number: true,
                    title: true,
                  },
                }
              : undefined,
          },
        });

        return res.status(201).json({
          message: "Bookmark đã được tạo",
          action: "added",
          bookmark,
        });
      }
    } catch (error) {
      console.error("Toggle bookmark error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi toggle bookmark",
      });
    }
  }

  // Check if item is bookmarked
  async checkBookmark(req, res) {
    try {
      const { storyId, chapterId, filmReviewId } = req.query;

      if (!storyId && !chapterId && !filmReviewId) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Cần cung cấp storyId, chapterId hoặc filmReviewId",
        });
      }

      let bookmark;
      if (filmReviewId) {
        bookmark = await prisma.bookmark.findFirst({
          where: { userId: req.user.id, filmReviewId },
          select: { id: true, createdAt: true },
        });
      } else {
        bookmark = await prisma.bookmark.findFirst({
          where: {
            userId: req.user.id,
            storyId: storyId || null,
            chapterId: chapterId || null,
          },
          select: { id: true, createdAt: true },
        });
      }

      res.json({
        isBookmarked: !!bookmark,
        bookmark: bookmark || null,
      });
    } catch (error) {
      console.error("Check bookmark error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi kiểm tra bookmark",
      });
    }
  }

  // Get user's bookmarks (handled in users controller, but keep for direct access)
  async getUserBookmarks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { type } = req.query; // "TEXT", "AUDIO", "FILM", or undefined for all

      const where = { userId: req.user.id };

      if (type === "FILM") {
        where.filmReviewId = { not: null };
        where.storyId = null;
      } else if (type === "TEXT" || type === "AUDIO") {
        where.filmReviewId = null;
        where.story = { is: { type } };
      }

      const bookmarks = await prisma.bookmark.findMany({
        where,
        include: {
          story: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              type: true,
              viewCount: true,
              updatedAt: true,
              author: {
                select: {
                  name: true,
                },
              },
              textGenres: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              audioGenres: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          chapter: {
            select: {
              id: true,
              number: true,
              title: true,
              updatedAt: true,
              story: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  thumbnailUrl: true,
                  type: true,
                },
              },
            },
          },
          filmReview: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              rating: true,
              viewCount: true,
              categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              author: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      const total = await prisma.bookmark.count({ where });

      res.json({
        bookmarks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get user bookmarks error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Có lỗi xảy ra khi lấy danh sách bookmark",
      });
    }
  }
}

module.exports = new BookmarksController();
