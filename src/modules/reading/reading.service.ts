import { ReadingProgress, Bookmark, ReadingActivity } from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class ReadingService {
  public async saveProgress(
    userId: string,
    data: {
      bookId: string;
      locatorJson: string;
      percentageComplete: number;
      currentPage?: number;
      totalPages?: number;
      deviceId?: string;
    }
  ) {
    const [progress] = await ReadingProgress.findOrCreate({
      where: { userId, bookId: data.bookId },
      defaults: {
        userId,
        bookId: data.bookId,
        locatorJson: data.locatorJson,
        percentageComplete: data.percentageComplete,
        currentPage: data.currentPage || null,
        totalPages: data.totalPages || null,
        lastReadAt: new Date(),
      },
    });

    await progress.update({
      locatorJson: data.locatorJson,
      percentageComplete: data.percentageComplete,
      currentPage: data.currentPage || progress.currentPage,
      totalPages: data.totalPages || progress.totalPages,
      lastReadAt: new Date(),
    });

    return progress;
  }

  public async getProgress(userId: string, bookId: string) {
    const progress = await ReadingProgress.findOne({
      where: { userId, bookId },
    });
    return progress;
  }

  public async createBookmark(
    userId: string,
    data: {
      bookId: string;
      locatorJson: string;
      title?: string;
      note?: string;
    }
  ) {
    return await Bookmark.create({
      userId,
      bookId: data.bookId,
      locatorJson: data.locatorJson,
      title: data.title || 'Bookmark',
      note: data.note || null,
    });
  }

  public async getBookmarks(userId: string, bookId: string) {
    return await Bookmark.findAll({
      where: { userId, bookId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async deleteBookmark(userId: string, bookmarkId: string) {
    const bookmark = await Bookmark.findByPk(bookmarkId);
    if (!bookmark) throw new NotFoundError('Bookmark not found');
    if (bookmark.userId !== userId) throw new ForbiddenError('Access denied');
    await bookmark.destroy();
  }

  public async logActivity(
    userId: string,
    data: {
      bookId: string;
      deviceId?: string;
      durationSeconds: number;
      sessionStart: Date;
      sessionEnd: Date;
    }
  ) {
    return await ReadingActivity.create({
      userId,
      bookId: data.bookId,
      deviceId: data.deviceId || null,
      durationSeconds: data.durationSeconds,
      sessionStart: data.sessionStart,
      sessionEnd: data.sessionEnd,
    });
  }
}

export const readingService = new ReadingService();
