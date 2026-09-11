import crypto from 'crypto';
import { Types } from 'mongoose';
import { GatePass, IGatePassDocument } from '../models/gatePass.model.js';
import { GateEvent } from '../models/gateEvent.model.js';
import { User } from '../../auth/models/user.model.js';
import {
  GatePassStatus,
  GateEventType,
  UserRole,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../../types/index.js';

export class GatePassService {
  private generatePassNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `FBX-GP-${year}-${randomHex}`;
  }

  private generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async createGatePass(data: {
    studentId: string;
    reason: string;
    destination: string;
    outDateTime: Date | string;
    expectedReturnDateTime: Date | string;
  }): Promise<IGatePassDocument> {
    const student = await User.findById(data.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestError('Target user must exist and have STUDENT role');
    }

    const outDate = new Date(data.outDateTime);
    const returnDate = new Date(data.expectedReturnDateTime);

    if (returnDate <= outDate) {
      throw new BadRequestError('Expected return time must be after out time');
    }

    const passNumber = this.generatePassNumber();

    return GatePass.create({
      passNumber,
      studentId: new Types.ObjectId(data.studentId),
      reason: data.reason.trim(),
      destination: data.destination.trim(),
      outDateTime: outDate,
      expectedReturnDateTime: returnDate,
      status: GatePassStatus.PENDING,
    });
  }

  public async getGatePasses(
    filterOptions: {
      studentId?: string;
      status?: GatePassStatus;
      search?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.studentId) filter.studentId = filterOptions.studentId;
    if (filterOptions.status) filter.status = filterOptions.status;
    if (filterOptions.search) {
      filter.$or = [
        { passNumber: { $regex: filterOptions.search, $options: 'i' } },
        { destination: { $regex: filterOptions.search, $options: 'i' } },
        { reason: { $regex: filterOptions.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [gatePasses, total] = await Promise.all([
      GatePass.find(filter)
        .populate('studentId approvedBy', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      GatePass.countDocuments(filter),
    ]);

    return { gatePasses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getGatePassById(id: string): Promise<IGatePassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid gate pass ID format', 'INVALID_ID');
    }
    const pass = await GatePass.findById(id).populate('studentId approvedBy', 'name email role');
    if (!pass) {
      throw new NotFoundError('Gate pass not found', 'GATE_PASS_NOT_FOUND');
    }
    return pass;
  }

  public async cancelGatePass(id: string, studentId: string): Promise<IGatePassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid gate pass ID format', 'INVALID_ID');
    }
    const pass = await GatePass.findById(id);
    if (!pass) {
      throw new NotFoundError('Gate pass not found', 'GATE_PASS_NOT_FOUND');
    }

    if (pass.studentId.toString() !== studentId) {
      throw new ForbiddenError(
        'Students can only cancel their own gate pass',
        'GATE_PASS_FORBIDDEN',
      );
    }

    if (pass.status !== GatePassStatus.PENDING) {
      throw new BadRequestError(
        `Cannot cancel gate pass with status '${pass.status}'`,
        'GATE_PASS_INVALID_TRANSITION',
      );
    }

    pass.status = GatePassStatus.CANCELLED;
    pass.cancelledAt = new Date();
    return pass.save();
  }

  public async approveGatePass(
    id: string,
    approvedByUserId: string,
  ): Promise<{ gatePass: IGatePassDocument; qrPayload: string }> {
    const pass = await GatePass.findById(id);
    if (!pass) {
      throw new NotFoundError('Gate pass not found', 'GATE_PASS_NOT_FOUND');
    }

    if (pass.status !== GatePassStatus.PENDING) {
      throw new BadRequestError(
        `Cannot approve gate pass with status '${pass.status}'`,
        'GATE_PASS_INVALID_TRANSITION',
      );
    }

    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);

    pass.status = GatePassStatus.APPROVED;
    pass.tokenHash = tokenHash;
    pass.tokenIssuedAt = new Date();
    pass.approvedBy = new Types.ObjectId(approvedByUserId);

    await pass.save();

    return {
      gatePass: pass,
      qrPayload: rawToken,
    };
  }

  public async rejectGatePass(
    id: string,
    rejectedByUserId: string,
    rejectionReason: string,
  ): Promise<IGatePassDocument> {
    const pass = await GatePass.findById(id);
    if (!pass) {
      throw new NotFoundError('Gate pass not found', 'GATE_PASS_NOT_FOUND');
    }

    if (pass.status !== GatePassStatus.PENDING) {
      throw new BadRequestError(
        `Cannot reject gate pass with status '${pass.status}'`,
        'GATE_PASS_INVALID_TRANSITION',
      );
    }

    pass.status = GatePassStatus.REJECTED;
    pass.rejectedAt = new Date();
    pass.approvedBy = new Types.ObjectId(rejectedByUserId);
    pass.rejectionReason = rejectionReason.trim();

    return pass.save();
  }

  public async scanGatePass(data: { token: string; securityUserId: string; gateId?: string }) {
    const hashed = this.hashToken(data.token);

    // Explicitly select tokenHash to find matching pass
    const pass = await GatePass.findOne({ tokenHash: hashed }).select('+tokenHash');

    if (!pass) {
      throw new BadRequestError('Invalid or unapproved gate pass token', 'GATE_PASS_INVALID_TOKEN');
    }

    const now = new Date();

    // Check status
    if (pass.status === GatePassStatus.USED) {
      throw new BadRequestError('Gate pass has already been used', 'GATE_PASS_ALREADY_USED');
    }
    if (pass.status === GatePassStatus.CANCELLED) {
      throw new BadRequestError('Gate pass has been cancelled', 'GATE_PASS_CANCELLED');
    }
    if (pass.status === GatePassStatus.REJECTED) {
      throw new BadRequestError('Gate pass was rejected', 'GATE_PASS_NOT_APPROVED');
    }
    if (pass.status === GatePassStatus.EXPIRED || now > pass.expectedReturnDateTime) {
      if (pass.status !== GatePassStatus.EXPIRED) {
        pass.status = GatePassStatus.EXPIRED;
        await pass.save();
      }
      throw new BadRequestError('Gate pass validity window has expired', 'GATE_PASS_EXPIRED');
    }
    if (pass.status !== GatePassStatus.APPROVED) {
      throw new BadRequestError('Gate pass is not approved', 'GATE_PASS_NOT_APPROVED');
    }

    // Atomic consumption update to prevent concurrent double-scanning
    const consumedPass = await GatePass.findOneAndUpdate(
      {
        _id: pass._id,
        status: GatePassStatus.APPROVED,
        usedAt: { $exists: false },
      },
      {
        $set: {
          status: GatePassStatus.USED,
          usedAt: now,
        },
      },
      { new: true },
    ).populate('studentId', 'name email role');

    if (!consumedPass) {
      throw new ConflictError(
        'Gate pass was already used or consumed concurrently',
        'GATE_SCAN_CONFLICT',
      );
    }

    // Record GateEvent
    const gateEvent = await GateEvent.create({
      gatePassId: consumedPass._id,
      studentId: consumedPass.studentId._id || consumedPass.studentId,
      securityUserId: new Types.ObjectId(data.securityUserId),
      eventType: GateEventType.EXIT,
      gateId: data.gateId?.trim() || 'main-gate',
      scannedAt: now,
    });

    return {
      gatePass: consumedPass,
      gateEvent,
    };
  }
}
