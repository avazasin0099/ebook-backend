import { Op } from 'sequelize';
import {
  sequelize,
  Book,
  Category,
  Author,
  Publisher,
  BookFile,
  BookPreview,
} from '../../database/models';
import { storageService } from '../../services/storage.service';
import { ConflictError, NotFoundError } from '../../utils/errors';

export interface BookQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export class BooksService {
  public async listPublic(params: BookQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const where: any = {
      status: params.status || 'PUBLISHED',
    };

    if (params.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${params.search}%` } },
        { description: { [Op.like]: `%${params.search}%` } },
      ];
    }

    if (params.language) {
      where.language = params.language;
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.salePrice = {};
      if (params.minPrice !== undefined) where.salePrice[Op.gte] = params.minPrice;
      if (params.maxPrice !== undefined) where.salePrice[Op.lte] = params.maxPrice;
    }

    let order: any = [['createdAt', 'DESC']];
    if (params.sort === 'price_asc') order = [['salePrice', 'ASC']];
    if (params.sort === 'price_desc') order = [['salePrice', 'DESC']];
    if (params.sort === 'popular') order = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];

    const categoryInclude: any = {
      model: Category,
      as: 'categories',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] },
    };

    if (params.category) {
      categoryInclude.where = { slug: params.category };
    }

    const { count, rows } = await Book.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        categoryInclude,
        {
          model: Author,
          as: 'authors',
          attributes: ['id', 'name', 'photoUrl'],
          through: { attributes: ['role'] },
        },
        {
          model: Publisher,
          as: 'publishers',
          attributes: ['id', 'name', 'logoUrl'],
          through: { attributes: [] },
        },
      ],
      attributes: {
        exclude: ['deletedAt'],
      },
    });

    return {
      books: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    };
  }

  public async getPublicByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    const book = await Book.findOne({
      where,
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] },
        },
        {
          model: Author,
          as: 'authors',
          attributes: ['id', 'name', 'biography', 'photoUrl'],
          through: { attributes: ['role'] },
        },
        {
          model: Publisher,
          as: 'publishers',
          attributes: ['id', 'name', 'description', 'logoUrl'],
          through: { attributes: [] },
        },
        {
          model: BookPreview,
          as: 'previews',
          attributes: ['id', 'previewType', 'storagePath', 'pageCount'],
        },
      ],
      attributes: {
        exclude: ['deletedAt'],
      },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    return book;
  }

  public async createBook(data: {
    title: string;
    slug: string;
    subtitle?: string;
    description: string;
    isbn?: string;
    language?: string;
    pageCount?: number;
    publishedDate?: string;
    basePrice: number;
    salePrice: number;
    currency?: string;
    availableFormats?: string;
    isFeatured?: boolean;
    categoryIds?: string[];
    authorIds?: string[];
    publisherIds?: string[];
  }) {
    const existing = await Book.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError('A book with this slug already exists');
    }

    const transaction = await sequelize.transaction();
    try {
      const book = await Book.create(
        {
          ...data,
          status: 'DRAFT',
        },
        { transaction }
      );

      if (data.categoryIds?.length) {
        await (book as any).setCategories(data.categoryIds, { transaction });
      }

      if (data.authorIds?.length) {
        await (book as any).setAuthors(data.authorIds, { transaction });
      }

      if (data.publisherIds?.length) {
        await (book as any).setPublishers(data.publisherIds, { transaction });
      }

      await transaction.commit();
      return await this.getPublicByIdOrSlug(book.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async updateBook(
    id: string,
    data: Partial<{
      title: string;
      slug: string;
      subtitle?: string;
      description: string;
      isbn?: string;
      language?: string;
      pageCount?: number;
      publishedDate?: string;
      basePrice: number;
      salePrice: number;
      currency?: string;
      availableFormats?: string;
      isFeatured?: boolean;
      categoryIds?: string[];
      authorIds?: string[];
      publisherIds?: string[];
    }>
  ) {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (data.slug && data.slug !== book.slug) {
      const existing = await Book.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new ConflictError('A book with this slug already exists');
      }
    }

    const transaction = await sequelize.transaction();
    try {
      await book.update(data, { transaction });

      if (data.categoryIds !== undefined) {
        await (book as any).setCategories(data.categoryIds, { transaction });
      }

      if (data.authorIds !== undefined) {
        await (book as any).setAuthors(data.authorIds, { transaction });
      }

      if (data.publisherIds !== undefined) {
        await (book as any).setPublishers(data.publisherIds, { transaction });
      }

      await transaction.commit();
      return await this.getPublicByIdOrSlug(book.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    const book = await Book.findByPk(id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }
    return await book.update({ status });
  }

  public async attachCover(bookId: string, fileBuffer: Buffer, originalName: string) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new NotFoundError('Book not found');

    const result = await storageService.saveLocalFile(fileBuffer, 'covers', originalName);
    const coverUrl = `/api/v1/books/assets/${result.storagePath}`;
    await book.update({ coverImageUrl: coverUrl });
    return { coverImageUrl: coverUrl };
  }

  public async attachManuscript(
    bookId: string,
    fileBuffer: Buffer,
    originalName: string,
    format: 'EPUB' | 'PDF'
  ) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new NotFoundError('Book not found');

    const result = await storageService.saveLocalFile(fileBuffer, 'raw', originalName);

    const [bookFile] = await BookFile.findOrCreate({
      where: { bookId, format },
      defaults: {
        bookId,
        format,
        rawStoragePath: result.storagePath,
        fileSizeBytes: result.fileSizeBytes,
        checksumSha256: result.checksumSha256,
        encryptionAlgorithm: 'AES-256-CBC',
        isProcessed: false,
      },
    });

    await bookFile.update({
      rawStoragePath: result.storagePath,
      fileSizeBytes: result.fileSizeBytes,
      checksumSha256: result.checksumSha256,
      isProcessed: false,
    });

    return bookFile;
  }
}

export const booksService = new BooksService();
