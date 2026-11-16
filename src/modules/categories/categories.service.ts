import { Category, Book } from '../../database/models';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class CategoriesService {
  public async listAll() {
    return await Category.findAll({
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
      include: [{ model: Category, as: 'subcategories' }],
    });
  }

  public async getBySlug(slug: string) {
    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Book,
          as: 'books',
          where: { status: 'PUBLISHED' },
          required: false,
        },
      ],
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  public async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    displayOrder?: number;
  }) {
    const existing = await Category.findOne({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictError('A category with this slug already exists');
    }

    return await Category.create(data);
  }

  public async update(id: string, data: Partial<{
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    displayOrder?: number;
  }>) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await Category.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new ConflictError('A category with this slug already exists');
      }
    }

    return await category.update(data);
  }

  public async delete(id: string) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    await category.destroy();
  }
}

export const categoriesService = new CategoriesService();
