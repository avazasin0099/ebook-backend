import { Op } from 'sequelize';
import { Contact } from '../../database/models';
import { NotFoundError } from '../../utils/errors';

export interface CreateContactDTO {
  name: string;
  phone: string;
  topic: string;
  message: string;
  submittedAt?: string | Date;
}

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'PENDING' | 'RESOLVED' | 'ARCHIVED' | 'ALL';
}

export class ContactsService {
  public async create(data: CreateContactDTO) {
    const contact = await Contact.create({
      name: data.name,
      phone: data.phone,
      topic: data.topic,
      message: data.message,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : new Date(),
      status: 'PENDING',
    });
    return contact;
  }

  public async list(params: ContactQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.search}%` } },
        { phone: { [Op.like]: `%${params.search}%` } },
        { topic: { [Op.like]: `%${params.search}%` } },
        { message: { [Op.like]: `%${params.search}%` } },
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit,
      offset,
      order: [['submittedAt', 'DESC']],
    });

    return {
      contacts: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    };
  }

  public async getById(id: string) {
    const contact = await Contact.findByPk(id);
    if (!contact) {
      throw new NotFoundError('Contact inquiry not found');
    }
    return contact;
  }

  public async updateStatus(id: string, status: 'PENDING' | 'RESOLVED' | 'ARCHIVED', adminNotes?: string) {
    const contact = await this.getById(id);
    const updateData: any = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    return await contact.update(updateData);
  }

  public async delete(id: string) {
    const contact = await this.getById(id);
    await contact.destroy();
    return true;
  }
}

export const contactsService = new ContactsService();
