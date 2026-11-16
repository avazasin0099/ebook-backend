import { Author, Book } from '../../database/models';
import { NotFoundError } from '../../utils/errors';

export class AuthorsService {
  public async listAll() {
    return await Author.findAll({
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
    const author = await Author.findByPk(id, {
      include: [
        {
          model: Book,
          as: 'books',
          where: { status: 'PUBLISHED' },
          required: false,
        },
      ],
    });

    if (!author) {
      throw new NotFoundError('Author not found');
    }

    return author;
  }

  public async create(data: {
    name: string;
    biography?: string;
    photoUrl?: string;
    website?: string;
  }) {
    return await Author.create(data);
  }

  public async update(id: string, data: Partial<{
    name: string;
    biography?: string;
    photoUrl?: string;
    website?: string;
  }>) {
    const author = await Author.findByPk(id);
    if (!author) {
      throw new NotFoundError('Author not found');
    }
    return await author.update(data);
  }

  public async delete(id: string) {
    const author = await Author.findByPk(id);
    if (!author) {
      throw new NotFoundError('Author not found');
    }
    await author.destroy();
  }
}

export const authorsService = new AuthorsService();
