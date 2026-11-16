import {
  BookPurchase,
  Book,
  Author,
  ReadingProgress,
  BookFile,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class LibraryService {
  public async getCustomerLibrary(userId: string) {
    const purchases = await BookPurchase.findAll({
      where: { userId, entitlementStatus: 'ACTIVE' },
      order: [['grantedAt', 'DESC']],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: [
            'id',
            'title',
            'slug',
            'subtitle',
            'coverImageUrl',
            'availableFormats',
            'language',
          ],
          include: [
            {
              model: Author,
              as: 'authors',
              attributes: ['id', 'name'],
              through: { attributes: [] },
            },
            {
              model: BookFile,
              as: 'files',
              attributes: ['id', 'format', 'fileSizeBytes', 'isProcessed'],
            },
          ],
        },
      ],
    });

    // Also fetch reading progress
    const progressList = await ReadingProgress.findAll({ where: { userId } });
    const progressMap = new Map(progressList.map((p) => [p.bookId, p]));

    return purchases.map((purchase) => {
      const book = (purchase as any).book;
      const progress = progressMap.get(purchase.bookId);

      return {
        purchaseId: purchase.id,
        grantedAt: purchase.grantedAt,
        expiresAt: purchase.expiresAt,
        book: {
          id: book?.id,
          title: book?.title,
          slug: book?.slug,
          subtitle: book?.subtitle,
          coverImageUrl: book?.coverImageUrl,
          availableFormats: book?.availableFormats,
          authors: book?.authors,
          files: book?.files,
        },
        readingProgress: progress
          ? {
              percentageComplete: Number(progress.percentageComplete),
              currentPage: progress.currentPage,
              totalPages: progress.totalPages,
              locatorJson: progress.locatorJson,
              lastReadAt: progress.lastReadAt,
            }
          : null,
      };
    });
  }

  public async getLibraryBook(userId: string, bookId: string) {
    const purchase = await BookPurchase.findOne({
      where: { userId, bookId, entitlementStatus: 'ACTIVE' },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            { model: Author, as: 'authors', through: { attributes: [] } },
            { model: BookFile, as: 'files', attributes: ['id', 'format', 'fileSizeBytes', 'isProcessed'] },
          ],
        },
      ],
    });

    if (!purchase) {
      throw new ForbiddenError('You do not own an active entitlement for this book');
    }

    const progress = await ReadingProgress.findOne({ where: { userId, bookId } });

    return {
      purchaseId: purchase.id,
      grantedAt: purchase.grantedAt,
      book: (purchase as any).book,
      readingProgress: progress,
    };
  }
}

export const libraryService = new LibraryService();
