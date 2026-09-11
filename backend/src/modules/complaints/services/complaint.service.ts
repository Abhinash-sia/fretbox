import crypto from 'crypto';
import { Types } from 'mongoose';
import { Complaint, IComplaint } from '../models/complaint.model.js';
import { ComplaintAssignment } from '../models/complaintAssignment.model.js';
import { ComplaintAudit } from '../models/complaintAudit.model.js';
import { User } from '../../auth/models/user.model.js';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintAuditAction,
  UserRole,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  AiClassificationStatus,
  AuthUserContext,
} from '../../../types/index.js';
import { ComplaintClassificationService } from '../../ai/complaint-classification/services/complaint-classification.service.js';

export class ComplaintService {
  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `FBX-${year}-${randomHex}`;
  }

  public async createComplaint(data: {
    studentId: string;
    title: string;
    description: string;
    category: ComplaintCategory;
    priority?: ComplaintPriority;
    hostelId?: string;
    blockId?: string;
    roomId?: string;
    assetId?: string;
    preferredTimeSlot?: string;
  }): Promise<IComplaint> {
    const student = await User.findById(data.studentId);
    if (!student) {
      throw new NotFoundError('Student user not found', 'USER_NOT_FOUND');
    }

    const ticketNumber = this.generateTicketNumber();

    const complaint = await Complaint.create({
      ticketNumber,
      studentId: new Types.ObjectId(data.studentId),
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority || ComplaintPriority.MEDIUM,
      status: ComplaintStatus.OPEN,
      hostelId: data.hostelId ? new Types.ObjectId(data.hostelId) : undefined,
      blockId: data.blockId ? new Types.ObjectId(data.blockId) : undefined,
      roomId: data.roomId ? new Types.ObjectId(data.roomId) : undefined,
      assetId: data.assetId ? new Types.ObjectId(data.assetId) : undefined,
      preferredTimeSlot: data.preferredTimeSlot?.trim(),
    });

    await ComplaintAudit.create({
      complaintId: complaint._id,
      performedByUserId: new Types.ObjectId(data.studentId),
      action: ComplaintAuditAction.CREATED,
      newStatus: ComplaintStatus.OPEN,
      notes: 'Complaint registered',
    });

    return complaint;
  }

  public async getComplaints(
    filterOptions: {
      category?: ComplaintCategory;
      status?: ComplaintStatus;
      priority?: ComplaintPriority;
      studentId?: string;
      assignedToStaffId?: string;
      hostelId?: string;
      blockId?: string;
      roomId?: string;
      assetId?: string;
      search?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.category) filter.category = filterOptions.category;
    if (filterOptions.status) filter.status = filterOptions.status;
    if (filterOptions.priority) filter.priority = filterOptions.priority;
    if (filterOptions.studentId) filter.studentId = filterOptions.studentId;
    if (filterOptions.assignedToStaffId) filter.assignedToStaffId = filterOptions.assignedToStaffId;
    if (filterOptions.hostelId) filter.hostelId = filterOptions.hostelId;
    if (filterOptions.blockId) filter.blockId = filterOptions.blockId;
    if (filterOptions.roomId) filter.roomId = filterOptions.roomId;
    if (filterOptions.assetId) filter.assetId = filterOptions.assetId;
    if (filterOptions.search) {
      filter.$or = [
        { ticketNumber: { $regex: filterOptions.search, $options: 'i' } },
        { title: { $regex: filterOptions.search, $options: 'i' } },
        { description: { $regex: filterOptions.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('studentId assignedToStaffId hostelId blockId roomId assetId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Complaint.countDocuments(filter),
    ]);

    return { complaints, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getComplaintById(id: string): Promise<{
    complaint: IComplaint;
    assignments: unknown[];
    audits: unknown[];
  }> {
    const complaint = await Complaint.findById(id).populate(
      'studentId assignedToStaffId hostelId blockId roomId assetId',
    );
    if (!complaint) {
      throw new NotFoundError('Complaint not found', 'COMPLAINT_NOT_FOUND');
    }

    const [assignments, audits] = await Promise.all([
      ComplaintAssignment.find({ complaintId: id })
        .populate('assignedToStaffId assignedByUserId')
        .sort({ createdAt: -1 }),
      ComplaintAudit.find({ complaintId: id })
        .populate('performedByUserId')
        .sort({ createdAt: -1 }),
    ]);

    return { complaint, assignments, audits };
  }

  public async assignComplaint(data: {
    complaintId: string;
    assignedToStaffId: string;
    assignedByUserId: string;
    notes?: string;
  }): Promise<IComplaint> {
    const complaint = await Complaint.findById(data.complaintId);
    if (!complaint) {
      throw new NotFoundError('Complaint not found', 'COMPLAINT_NOT_FOUND');
    }

    const staff = await User.findById(data.assignedToStaffId);
    if (
      !staff ||
      (staff.role !== UserRole.STAFF &&
        staff.role !== UserRole.WARDEN &&
        staff.role !== UserRole.ADMINISTRATOR)
    ) {
      throw new BadRequestError('Assigned user must be STAFF, WARDEN, or ADMINISTRATOR');
    }

    const previousAssigneeId = complaint.assignedToStaffId;

    // Deactivate current active assignments
    await ComplaintAssignment.updateMany(
      { complaintId: complaint._id, isActive: true },
      { isActive: false, unassignedAt: new Date() },
    );

    // Create new assignment
    await ComplaintAssignment.create({
      complaintId: complaint._id,
      assignedToStaffId: data.assignedToStaffId,
      assignedByUserId: data.assignedByUserId,
      notes: data.notes?.trim(),
      assignedAt: new Date(),
      isActive: true,
    });

    const isReassignment = !!previousAssigneeId;
    complaint.assignedToStaffId = new Types.ObjectId(data.assignedToStaffId);
    if (complaint.status === ComplaintStatus.OPEN) {
      complaint.status = ComplaintStatus.ASSIGNED;
    }

    await complaint.save();

    await ComplaintAudit.create({
      complaintId: complaint._id,
      performedByUserId: data.assignedByUserId,
      action: isReassignment ? ComplaintAuditAction.REASSIGNED : ComplaintAuditAction.ASSIGNED,
      previousAssigneeId: previousAssigneeId
        ? new Types.ObjectId(previousAssigneeId.toString())
        : undefined,
      newAssigneeId: new Types.ObjectId(data.assignedToStaffId),
      notes: data.notes?.trim() || `Assigned to ${staff.name}`,
    });

    return complaint.populate('studentId assignedToStaffId hostelId blockId roomId assetId');
  }

  public async updateComplaintStatus(data: {
    complaintId: string;
    status: ComplaintStatus;
    performedByUserId: string;
    userRole: UserRole;
    notes?: string;
    resolutionNotes?: string;
  }): Promise<IComplaint> {
    const complaint = await Complaint.findById(data.complaintId);
    if (!complaint) {
      throw new NotFoundError('Complaint not found', 'COMPLAINT_NOT_FOUND');
    }

    const previousStatus = complaint.status;

    // Role-based restrictions
    if (data.userRole === UserRole.STUDENT) {
      const studentOwnerId = (complaint.studentId || complaint.createdBy)?.toString();
      if (studentOwnerId !== data.performedByUserId) {
        throw new ForbiddenError('Students can only update their own complaints');
      }
      // Students can only REOPEN or CLOSE or CANCEL
      if (data.status !== ComplaintStatus.REOPENED && data.status !== ComplaintStatus.CLOSED) {
        throw new ForbiddenError('Students can only close or reopen resolved complaints');
      }
    }

    if (data.status === previousStatus) {
      return complaint;
    }

    complaint.status = data.status;

    let auditAction = ComplaintAuditAction.STATUS_CHANGED;

    if (data.status === ComplaintStatus.RESOLVED) {
      auditAction = ComplaintAuditAction.RESOLVED;
      complaint.resolvedAt = new Date();
      if (data.resolutionNotes) {
        complaint.resolutionNotes = data.resolutionNotes.trim();
      }
      const createdAt = complaint.createdAt || new Date();
      const diffMs = complaint.resolvedAt.getTime() - createdAt.getTime();
      complaint.resolutionTimeMinutes = Math.round(diffMs / (1000 * 60));
    } else if (data.status === ComplaintStatus.CLOSED) {
      auditAction = ComplaintAuditAction.CLOSED;
      complaint.closedAt = new Date();
    } else if (data.status === ComplaintStatus.REOPENED) {
      auditAction = ComplaintAuditAction.REOPENED;
      complaint.resolvedAt = undefined;
      complaint.closedAt = undefined;
      complaint.resolutionTimeMinutes = undefined;
    }

    await complaint.save();

    await ComplaintAudit.create({
      complaintId: complaint._id,
      performedByUserId: data.performedByUserId,
      action: auditAction,
      previousStatus,
      newStatus: data.status,
      notes: data.notes?.trim() || data.resolutionNotes?.trim(),
    });

    return complaint.populate('studentId assignedToStaffId hostelId blockId roomId assetId');
  }

  public async getComplaintMetrics(hostelId?: string) {
    const filter: Record<string, unknown> = {};
    if (hostelId) filter.hostelId = hostelId;

    const complaints = await Complaint.find(filter);
    const total = complaints.length;

    const statusCounts: Record<string, number> = {
      open: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      reopened: 0,
    };
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    const categoryCounts: Record<string, number> = {};

    let totalResolutionTimeMinutes = 0;
    let resolvedCount = 0;

    const now = new Date().getTime();
    let pendingUnder24h = 0;
    let pending24to72h = 0;
    let pendingOver72h = 0;

    for (const c of complaints) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;

      if (c.resolutionTimeMinutes !== undefined && c.resolutionTimeMinutes !== null) {
        totalResolutionTimeMinutes += c.resolutionTimeMinutes;
        resolvedCount += 1;
      }

      // Ageing calculation for active/unresolved complaints
      if (
        c.status === ComplaintStatus.OPEN ||
        c.status === ComplaintStatus.ASSIGNED ||
        c.status === ComplaintStatus.IN_PROGRESS ||
        c.status === ComplaintStatus.REOPENED
      ) {
        const createdAt = c.createdAt || new Date();
        const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
        if (ageHours < 24) {
          pendingUnder24h += 1;
        } else if (ageHours <= 72) {
          pending24to72h += 1;
        } else {
          pendingOver72h += 1;
        }
      }
    }

    const averageResolutionTimeHours =
      resolvedCount > 0
        ? Math.round((totalResolutionTimeMinutes / resolvedCount / 60) * 10) / 10
        : 0;

    return {
      total,
      statusCounts,
      priorityCounts,
      categoryCounts,
      resolutionMetrics: {
        totalResolved: resolvedCount,
        averageResolutionTimeHours,
        totalResolutionTimeMinutes,
      },
      ageingMetrics: {
        pendingUnder24h,
        pending24to72h,
        pendingOver72h,
      },
    };
  }

  public async getRecurringIssues(threshold = 3) {
    const pipeline = [
      {
        $group: {
          _id: {
            hostelId: '$hostelId',
            blockId: '$blockId',
            roomId: '$roomId',
            category: '$category',
          },
          count: { $sum: 1 },
          complaintIds: { $push: '$_id' },
          tickets: { $push: '$ticketNumber' },
          lastReportedAt: { $max: '$createdAt' },
        },
      },
      {
        $match: {
          count: { $gte: threshold },
        },
      },
      {
        $sort: { count: -1 as const },
      },
    ];

    const recurring = await Complaint.aggregate(pipeline);
    return recurring;
  }

  public async classifyComplaintWithAi(
    complaintId: string,
    userContext: AuthUserContext,
  ): Promise<IComplaint> {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new NotFoundError('Complaint not found', 'COMPLAINT_NOT_FOUND');
    }

    // Ownership / Scope validation
    if (userContext.role === UserRole.STUDENT) {
      const studentIdStr = (complaint.studentId || complaint.createdBy)?.toString();
      if (studentIdStr !== userContext.id) {
        throw new ForbiddenError('Students can only classify their own complaints');
      }
    }

    const aiService = new ComplaintClassificationService();
    const classification = await aiService.classify({
      title: complaint.title,
      description: complaint.description,
    });

    complaint.aiClassification = classification;
    await complaint.save();

    await ComplaintAudit.create({
      complaintId: complaint._id,
      performedByUserId: new Types.ObjectId(userContext.id),
      action: ComplaintAuditAction.AI_CLASSIFIED,
      notes: `AI classification run (${classification.status}): category=${classification.category}, priority=${classification.priority}, confidence=${classification.confidence}`,
    });

    return complaint;
  }

  public async applyAiClassification(
    complaintId: string,
    userContext: AuthUserContext,
    override?: { category?: ComplaintCategory; priority?: ComplaintPriority },
  ): Promise<IComplaint> {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new NotFoundError('Complaint not found', 'COMPLAINT_NOT_FOUND');
    }

    if (!complaint.aiClassification) {
      throw new BadRequestError('Complaint has not been classified by AI yet');
    }

    const newCategory = override?.category || complaint.aiClassification.category;
    const newPriority = override?.priority || complaint.aiClassification.priority;

    const oldCategory = complaint.category;
    const oldPriority = complaint.priority;

    complaint.category = newCategory;
    complaint.priority = newPriority;
    complaint.aiClassification.status = AiClassificationStatus.APPLIED;

    await complaint.save();

    await ComplaintAudit.create({
      complaintId: complaint._id,
      performedByUserId: new Types.ObjectId(userContext.id),
      action: ComplaintAuditAction.AI_APPLIED,
      notes: `Applied AI recommendation: category (${oldCategory} -> ${newCategory}), priority (${oldPriority} -> ${newPriority})`,
    });

    return complaint;
  }
}
