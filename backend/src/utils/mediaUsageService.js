const prisma = require("../lib/prisma");

/**
 * MediaUsageService — Tracks where media files are used across entities
 */
class MediaUsageService {
  /**
   * Link a media file to an entity
   * @param {string} mediaId - Media record ID
   * @param {string} entityType - "story_text" | "story_audio" | "film"
   * @param {string} entityId - ID of the entity
   * @param {string} field - Field name e.g. "thumbnail", "audio_url"
   */
  async linkMedia(mediaId, entityType, entityId, field) {
    if (!mediaId || !entityType || !entityId || !field) return;

    await prisma.mediaUsage.upsert({
      where: {
        mediaId_entityType_entityId_field: {
          mediaId,
          entityType,
          entityId,
          field,
        },
      },
      update: {}, // No-op if already exists
      create: { mediaId, entityType, entityId, field },
    });
  }

  /**
   * Unlink a media file from an entity field
   */
  async unlinkMedia(mediaId, entityType, entityId, field) {
    if (!mediaId || !entityType || !entityId || !field) return;

    await prisma.mediaUsage.deleteMany({
      where: { mediaId, entityType, entityId, field },
    });
  }

  /**
   * Unlink all media from an entity (e.g., when deleting a story)
   */
  async unlinkAllFromEntity(entityType, entityId) {
    await prisma.mediaUsage.deleteMany({
      where: { entityType, entityId },
    });
  }

  /**
   * Get all usages for a media file
   */
  async getMediaUsages(mediaId) {
    return prisma.mediaUsage.findMany({
      where: { mediaId },
      include: {
        media: {
          select: { id: true, filename: true, originalName: true, url: true },
        },
      },
    });
  }

  /**
   * Check if a media file is in use anywhere
   * Returns { inUse: boolean, usages: MediaUsage[] }
   */
  async checkMediaInUse(mediaId) {
    const usages = await prisma.mediaUsage.findMany({
      where: { mediaId },
    });

    return {
      inUse: usages.length > 0,
      count: usages.length,
      usages,
    };
  }

  /**
   * Try to delete a media file — blocks if in use
   * Returns { deleted: boolean, message: string, usages?: MediaUsage[] }
   */
  async canDeleteMedia(mediaId) {
    const { inUse, count, usages } = await this.checkMediaInUse(mediaId);

    if (inUse) {
      return {
        canDelete: false,
        message: `Media đang được sử dụng bởi ${count} đối tượng. Hãy gỡ liên kết trước khi xóa.`,
        usages,
      };
    }

    return { canDelete: true, message: "Có thể xóa", usages: [] };
  }

  /**
   * Resolve mediaId from URL by searching the Media table
   */
  async findMediaIdByUrl(url) {
    if (!url) return null;
    const media = await prisma.media.findFirst({
      where: { url },
      select: { id: true },
    });
    return media?.id || null;
  }

  /**
   * Track media usage for a story (thumbnail + chapter audio)
   */
  async trackStoryMedia(story, entityType) {
    if (!story || !story.id) return;

    // Track thumbnail
    if (story.thumbnailUrl) {
      const mediaId = await this.findMediaIdByUrl(story.thumbnailUrl);
      if (mediaId) {
        await this.linkMedia(mediaId, entityType, story.id, "thumbnail");
      }
    }
  }

  /**
   * Track media usage for a chapter (audioUrl)
   */
  async trackChapterMedia(chapter, entityType) {
    if (!chapter || !chapter.id) return;

    if (chapter.audioUrl) {
      const mediaId = await this.findMediaIdByUrl(chapter.audioUrl);
      if (mediaId) {
        await this.linkMedia(mediaId, entityType, chapter.id, "audio_url");
      }
    }
  }
}

// Singleton
const mediaUsageService = new MediaUsageService();
module.exports = mediaUsageService;
