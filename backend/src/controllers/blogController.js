const prisma = require("../lib/prisma");
const slugify = require("slugify");

class BlogController {
  // ==================== PUBLIC ====================

  // GET /api/blog
  async getPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;
      const { category, tag, search, sort = "createdAt" } = req.query;

      const where = { status: "PUBLISHED" };

      if (category) {
        where.categories = { some: { slug: category } };
      }
      if (tag) {
        where.tags = { has: tag };
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ];
      }

      let orderBy = { createdAt: "desc" };
      if (sort === "viewCount") orderBy = { viewCount: "desc" };
      else if (sort === "title") orderBy = { title: "asc" };

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            categories: { select: { id: true, name: true, slug: true } },
            _count: { select: { comments: true } },
          },
        }),
        prisma.blogPost.count({ where }),
      ]);

      res.json({
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get blog posts error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /api/blog/categories
  async getCategories(req, res) {
    try {
      const categories = await prisma.blogCategory.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: true } } },
      });
      res.json({ data: categories });
    } catch (error) {
      console.error("Get blog categories error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /api/blog/tags
  async getTags(req, res) {
    try {
      const posts = await prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { tags: true },
      });
      const tagSet = new Set();
      posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
      res.json({ data: Array.from(tagSet).sort() });
    } catch (error) {
      console.error("Get blog tags error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /api/blog/:slug
  async getPostBySlug(req, res) {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug: req.params.slug },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true } },
        },
      });

      if (!post || (post.status !== "PUBLISHED" && (!req.user || (req.user.id !== post.authorId && req.user.role !== "ADMIN")))) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      // Increment view count
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      });

      res.json({ data: { ...post, viewCount: post.viewCount + 1 } });
    } catch (error) {
      console.error("Get blog post error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /api/blog/:slug/comments
  async getComments(req, res) {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug: req.params.slug },
        select: { id: true },
      });
      if (!post) return res.status(404).json({ error: "Blog post not found" });

      const comments = await prisma.blogComment.findMany({
        where: { blogPostId: post.id, parentId: null, isApproved: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            where: { isApproved: true },
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });

      res.json({ data: comments });
    } catch (error) {
      console.error("Get blog comments error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // POST /api/blog/:slug/comments (auth required)
  async createComment(req, res) {
    try {
      const { content, parentId } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      const post = await prisma.blogPost.findUnique({
        where: { slug: req.params.slug },
        select: { id: true },
      });
      if (!post) return res.status(404).json({ error: "Blog post not found" });

      if (parentId) {
        const parent = await prisma.blogComment.findUnique({ where: { id: parentId } });
        if (!parent || parent.blogPostId !== post.id) {
          return res.status(400).json({ error: "Invalid parent comment" });
        }
      }

      const comment = await prisma.blogComment.create({
        data: {
          content: content.trim(),
          userId: req.user.id,
          blogPostId: post.id,
          parentId: parentId || null,
          isApproved: req.user.role === "ADMIN" || req.user.role === "EDITOR",
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      res.status(201).json({ data: comment });
    } catch (error) {
      console.error("Create blog comment error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ==================== AUTHENTICATED (blog.create) ====================

  // POST /api/blog (create blog post)
  async createPost(req, res) {
    try {
      const { title, content, excerpt, thumbnailUrl, tags, categoryIds, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      let slug = slugify(title, { lower: true, strict: true, locale: "vi" });
      // Ensure unique slug
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const data = {
        title,
        slug,
        content,
        excerpt: excerpt || content.replace(/<[^>]*>/g, "").substring(0, 200),
        thumbnailUrl: thumbnailUrl || null,
        tags: tags || [],
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        authorId: req.user.id,
      };

      if (categoryIds && categoryIds.length > 0) {
        data.categories = { connect: categoryIds.map((id) => ({ id })) };
      }

      const post = await prisma.blogPost.create({
        data,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: { select: { id: true, name: true, slug: true } },
        },
      });

      res.status(201).json({ data: post });
    } catch (error) {
      console.error("Create blog post error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // PUT /api/blog/:id (update blog post)
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { title, content, excerpt, thumbnailUrl, tags, categoryIds, status } = req.body;

      const post = await prisma.blogPost.findUnique({ where: { id } });
      if (!post) return res.status(404).json({ error: "Blog post not found" });

      // Only author or admin can update
      if (post.authorId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own posts" });
      }

      const data = {};
      if (title !== undefined) {
        data.title = title;
        data.slug = slugify(title, { lower: true, strict: true, locale: "vi" });
        // Check slug uniqueness
        const existing = await prisma.blogPost.findFirst({
          where: { slug: data.slug, NOT: { id } },
        });
        if (existing) data.slug = `${data.slug}-${Date.now().toString(36)}`;
      }
      if (content !== undefined) data.content = content;
      if (excerpt !== undefined) data.excerpt = excerpt;
      if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
      if (tags !== undefined) data.tags = tags;
      if (status !== undefined) data.status = status;

      if (categoryIds !== undefined) {
        data.categories = {
          set: [],
          connect: categoryIds.map((id) => ({ id })),
        };
      }

      const updated = await prisma.blogPost.update({
        where: { id },
        data,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          categories: { select: { id: true, name: true, slug: true } },
        },
      });

      res.json({ data: updated });
    } catch (error) {
      console.error("Update blog post error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // DELETE /api/blog/:id
  async deletePost(req, res) {
    try {
      const { id } = req.params;

      const post = await prisma.blogPost.findUnique({ where: { id } });
      if (!post) return res.status(404).json({ error: "Blog post not found" });

      if (post.authorId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only delete your own posts" });
      }

      await prisma.blogPost.delete({ where: { id } });
      res.json({ message: "Blog post deleted" });
    } catch (error) {
      console.error("Delete blog post error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /api/blog/my-posts (auth required — get current user's posts)
  async getMyPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const where = { authorId: req.user.id };
      if (status) where.status = status;

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            categories: { select: { id: true, name: true, slug: true } },
            _count: { select: { comments: true } },
          },
        }),
        prisma.blogPost.count({ where }),
      ]);

      res.json({
        data: posts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error("Get my blog posts error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ==================== ADMIN ====================

  // GET /api/blog/admin/all (all posts, any status)
  async adminGetAllPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { status, search } = req.query;

      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { author: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            categories: { select: { id: true, name: true, slug: true } },
            _count: { select: { comments: true } },
          },
        }),
        prisma.blogPost.count({ where }),
      ]);

      res.json({
        data: posts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error("Admin get all blog posts error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // POST /api/blog/categories (admin create category)
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const slug = slugify(name, { lower: true, strict: true, locale: "vi" });
      const category = await prisma.blogCategory.create({
        data: { name, slug },
      });
      res.status(201).json({ data: category });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Category already exists" });
      }
      console.error("Create blog category error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // PUT /api/blog/categories/:id
  async updateCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const slug = slugify(name, { lower: true, strict: true, locale: "vi" });
      const category = await prisma.blogCategory.update({
        where: { id: req.params.id },
        data: { name, slug },
      });
      res.json({ data: category });
    } catch (error) {
      if (error.code === "P2025") return res.status(404).json({ error: "Category not found" });
      if (error.code === "P2002") return res.status(409).json({ error: "Category already exists" });
      console.error("Update blog category error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // DELETE /api/blog/categories/:id
  async deleteCategory(req, res) {
    try {
      await prisma.blogCategory.delete({ where: { id: req.params.id } });
      res.json({ message: "Category deleted" });
    } catch (error) {
      if (error.code === "P2025") return res.status(404).json({ error: "Category not found" });
      console.error("Delete blog category error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new BlogController();
