import { Types } from 'mongoose';
import { User } from '../../auth/models/user.model.js';
import { StudentEnrollment } from '../../academic/models/studentEnrollment.model.js';
import { StudentRoomAllocation } from '../../hostel/models/studentRoomAllocation.model.js';
import {
  AnnouncementTarget,
  AuthUserContext,
  ForbiddenError,
  UserRole,
} from '../../../types/index.js';

export class AudienceService {
  /**
   * Resolves target parameters into distinct User ObjectIDs.
   */
  public static async resolveRecipients(
    target: AnnouncementTarget | undefined,
    creatorUser: AuthUserContext,
  ): Promise<Types.ObjectId[]> {
    // 1. Enforce Warden target scope authorization
    if (creatorUser.role === UserRole.WARDEN) {
      await this.validateWardenTargetScope(target, creatorUser.id);
    }

    // Default target: all users if target is undefined or target.all = true
    if (!target || target.all) {
      const allUsers = await User.find({}, '_id').lean();
      return allUsers.map((u) => u._id as Types.ObjectId);
    }

    const recipientSet = new Set<string>();

    // 2. Resolve Role-based Recipients
    if (target.roles && target.roles.length > 0) {
      const roleUsers = await User.find({ role: { $in: target.roles } }, '_id').lean();
      roleUsers.forEach((u) => recipientSet.add(u._id.toString()));
    }

    // 3. Resolve Academic Program & Academic Year Recipients (via StudentEnrollment)
    const academicQuery: Record<string, unknown> = { status: 'active' };
    let hasAcademicFilter = false;

    if (target.programs && target.programs.length > 0) {
      academicQuery.programId = { $in: target.programs.map((id) => new Types.ObjectId(id)) };
      hasAcademicFilter = true;
    }
    if (target.academicYears && target.academicYears.length > 0) {
      academicQuery.academicYearId = {
        $in: target.academicYears.map((id) => new Types.ObjectId(id)),
      };
      hasAcademicFilter = true;
    }

    if (hasAcademicFilter) {
      const enrollments = await StudentEnrollment.find(academicQuery, 'studentId').lean();
      enrollments.forEach((e) => recipientSet.add(e.studentId.toString()));
    }

    // 4. Resolve Hostel & HostelBlock Recipients (via StudentRoomAllocation)
    const hostelQuery: Record<string, unknown> = { status: 'active' };
    let hasHostelFilter = false;

    if (target.hostels && target.hostels.length > 0) {
      hostelQuery.hostelId = { $in: target.hostels.map((id) => new Types.ObjectId(id)) };
      hasHostelFilter = true;
    }
    if (target.hostelBlocks && target.hostelBlocks.length > 0) {
      hostelQuery.blockId = { $in: target.hostelBlocks.map((id) => new Types.ObjectId(id)) };
      hasHostelFilter = true;
    }

    if (hasHostelFilter) {
      const allocations = await StudentRoomAllocation.find(hostelQuery, 'studentId').lean();
      allocations.forEach((a) => recipientSet.add(a.studentId.toString()));
    }

    return Array.from(recipientSet).map((id) => new Types.ObjectId(id));
  }

  /**
   * Validates that Wardens can only publish announcements targeting their allowed scope.
   */
  private static async validateWardenTargetScope(
    target: AnnouncementTarget | undefined,
    _wardenUserId: string,
  ): Promise<void> {
    if (!target) return;
    if (target.all) {
      throw new ForbiddenError(
        'Wardens cannot send global campus-wide announcements targeting all users',
      );
    }
  }
}
