import { MessMenu, IMessMenu } from '../models/messMenu.model.js';
import { MessFeedback, IMessFeedback } from '../models/messFeedback.model.js';
import { Hostel } from '../models/hostel.model.js';
import { User } from '../../auth/models/user.model.js';
import {
  MealType,
  MessFeedbackSummary,
  UserRole,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../types/index.js';

export class MessService {
  // --- Mess Menu CRUD ---
  public async createMenu(data: {
    hostelId?: string;
    date: Date | string;
    mealType: MealType;
    items: string[];
    description?: string;
    isPublished?: boolean;
    createdByUserId: string;
  }): Promise<IMessMenu> {
    const menuDate = new Date(data.date);
    menuDate.setUTCHours(0, 0, 0, 0);

    if (data.hostelId) {
      const hostel = await Hostel.findById(data.hostelId);
      if (!hostel) throw new NotFoundError('Hostel not found', 'HOSTEL_NOT_FOUND');
    }

    const existing = await MessMenu.findOne({
      date: menuDate,
      mealType: data.mealType,
      hostelId: data.hostelId || null,
    });

    if (existing) {
      throw new ConflictError(
        `Mess menu already exists for date ${menuDate.toISOString().split('T')[0]} and meal '${data.mealType}'`,
        'MENU_DUPLICATE',
      );
    }

    return MessMenu.create({
      hostelId: data.hostelId,
      date: menuDate,
      mealType: data.mealType,
      items: data.items.map((i) => i.trim()).filter((i) => i.length > 0),
      description: data.description?.trim(),
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      createdByUserId: data.createdByUserId,
    });
  }

  public async getMenus(
    filterOptions: {
      date?: Date | string;
      startDate?: Date | string;
      endDate?: Date | string;
      hostelId?: string;
      mealType?: MealType;
      isPublished?: boolean;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.date) {
      const targetDate = new Date(filterOptions.date);
      targetDate.setUTCHours(0, 0, 0, 0);
      filter.date = targetDate;
    } else if (filterOptions.startDate || filterOptions.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filterOptions.startDate) {
        const start = new Date(filterOptions.startDate);
        start.setUTCHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (filterOptions.endDate) {
        const end = new Date(filterOptions.endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.date = dateFilter;
    }

    if (filterOptions.hostelId) filter.hostelId = filterOptions.hostelId;
    if (filterOptions.mealType) filter.mealType = filterOptions.mealType;
    if (filterOptions.isPublished !== undefined) filter.isPublished = filterOptions.isPublished;

    const skip = (page - 1) * limit;
    const [menus, total] = await Promise.all([
      MessMenu.find(filter)
        .populate('hostelId createdByUserId')
        .skip(skip)
        .limit(limit)
        .sort({ date: 1, mealType: 1 }),
      MessMenu.countDocuments(filter),
    ]);

    return { menus, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getMenuById(id: string): Promise<IMessMenu> {
    const menu = await MessMenu.findById(id).populate('hostelId createdByUserId');
    if (!menu) {
      throw new NotFoundError('Mess menu not found', 'MENU_NOT_FOUND');
    }
    return menu;
  }

  public async updateMenu(
    id: string,
    data: {
      items?: string[];
      description?: string;
      isPublished?: boolean;
    },
  ): Promise<IMessMenu> {
    const menu = await MessMenu.findById(id);
    if (!menu) {
      throw new NotFoundError('Mess menu not found', 'MENU_NOT_FOUND');
    }

    if (data.items !== undefined) {
      const cleanItems = data.items.map((i) => i.trim()).filter((i) => i.length > 0);
      if (cleanItems.length === 0) {
        throw new BadRequestError('Mess menu must contain at least one item');
      }
      menu.items = cleanItems;
    }
    if (data.description !== undefined) menu.description = data.description.trim();
    if (data.isPublished !== undefined) menu.isPublished = data.isPublished;

    return menu.save();
  }

  public async deleteMenu(id: string): Promise<void> {
    const menu = await MessMenu.findById(id);
    if (!menu) {
      throw new NotFoundError('Mess menu not found', 'MENU_NOT_FOUND');
    }
    await MessMenu.findByIdAndDelete(id);
    await MessFeedback.deleteMany({ menuId: id });
  }

  // --- Feedback ---
  public async submitFeedback(data: {
    menuId: string;
    studentId: string;
    rating: number;
    comments?: string;
  }): Promise<IMessFeedback> {
    const menu = await MessMenu.findById(data.menuId);
    if (!menu) {
      throw new NotFoundError('Mess menu not found', 'MENU_NOT_FOUND');
    }

    const student = await User.findById(data.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestError('Feedback can only be submitted by students');
    }

    // Upsert feedback
    const feedback = await MessFeedback.findOneAndUpdate(
      { menuId: data.menuId, studentId: data.studentId },
      {
        rating: data.rating,
        comments: data.comments?.trim(),
      },
      { new: true, upsert: true, runValidators: true },
    );

    return feedback;
  }

  public async getFeedbackSummary(menuId: string): Promise<MessFeedbackSummary> {
    await this.getMenuById(menuId);

    const feedbacks = await MessFeedback.find({ menuId });
    const totalFeedbackCount = feedbacks.length;

    const ratingDistribution: MessFeedbackSummary['ratingDistribution'] = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalRating = 0;
    for (const f of feedbacks) {
      totalRating += f.rating;
      if (f.rating >= 1 && f.rating <= 5) {
        ratingDistribution[f.rating as 1 | 2 | 3 | 4 | 5] += 1;
      }
    }

    const averageRating =
      totalFeedbackCount > 0 ? Math.round((totalRating / totalFeedbackCount) * 10) / 10 : 0;

    return {
      menuId,
      averageRating,
      totalFeedbackCount,
      ratingDistribution,
    };
  }

  public async getFeedbacksByMenu(menuId: string, page = 1, limit = 20) {
    await this.getMenuById(menuId);
    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      MessFeedback.find({ menuId })
        .populate('studentId', 'name email avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      MessFeedback.countDocuments({ menuId }),
    ]);

    return { feedbacks, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
