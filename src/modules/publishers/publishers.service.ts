import { Publisher, Book } from '../../database/models';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class PublishersService {
  public async listAll() {
    return await Publisher.findAll({
      order: [['name', 'ASC']],
      include: [
        {
          model: Book,
          as: 'books',
          attributes: ['id', 'title', 'coverImageUrl', 'salePrice'],
          where: { status: 'PUBLISHED' },
          required: false,
        },
      ],
    });
  }

  public async getById(id: string) {
    const publisher = await Publisher.findByPk(id, {
      include: [
        {
          model: Book,
          as: 'books',
          where: { status: 'PUBLISHED' },
          required: false,
        },
      ],
    });

    if (!publisher) {
      throw new NotFoundError('Publisher not found');
    }

    return publisher;
  }

  public async create(data: {
    name: string;
    description?: string;
    logoUrl?: string;
    contactEmail?: string;
    website?: string;
  }) {
    const existing = await Publisher.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError('A publisher with this name already exists');
    }
    return await Publisher.create(data);
  }

  public async update(id: string, data: Partial<{
    name: string;
    description?: string;
    logoUrl?: string;
    contactEmail?: string;
    website?: string;
  }>) {
    const publisher = await Publisher.findByPk(id);
    if (!publisher) {
      throw new NotFoundError('Publisher not found');
    }
    return await publisher.update(data);
  }

  public async delete(id: string) {
    const publisher = await Publisher.findByPk(id);
    if (!publisher) {
      throw new NotFoundError('Publisher not found');
    }
    await publisher.destroy();
  }
}

export const publishersService = new PublishersService();
