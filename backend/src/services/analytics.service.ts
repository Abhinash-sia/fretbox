import { Types } from 'mongoose';
import { Complaint } from '../models/complaint.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { AttendanceRecord } from '../models/attendanceRecord.model.js';
import { Hostel } from '../models/hostel.model.js';
import { HostelBlock } from '../models/hostelBlock.model.js';
import { Room } from '../models/room.model.js';
import { StudentRoomAllocation } from '../models/studentRoomAllocation.model.js';
import { FacilityAsset } from '../models/facilityAsset.model.js';
import { MessFeedback } from '../models/messFeedback.model.js';
import { GateEvent } from '../models/gateEvent.model.js';
import { Announcement } from '../models/announcement.model.js';
import { Notification } from '../models/notification.model.js';
import {
  AttendanceStatus,
  ComplaintStatus,
  AllocationStatus,
  NotificationDeliveryStatus,
} from '../types/index.js';

export interface DateFilter {
  from?: Date;
  to?: Date;
}

export class AnalyticsService {
  /**
   * Parse default 30-day date window if dates are omitted.
   */
  private static parseDateWindow(fromStr?: string, toStr?: string): { from: Date; to: Date } {
    const to = toStr ? new Date(toStr) : new Date();
    const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  /**
   * 1. GET /overview
   */
  public static async getOverview(fromStr?: string, toStr?: string, hostelIdScope?: string) {
    const { from, to } = this.parseDateWindow(fromStr, toStr);

    const complaintMatch: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: to },
    };
    if (hostelIdScope) {
      complaintMatch.hostelId = new Types.ObjectId(hostelIdScope);
    }

    // Complaints Aggregation
    const complaintStats = await Complaint.aggregate([
      { $match: complaintMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      ComplaintStatus.OPEN,
                      ComplaintStatus.ASSIGNED,
                      ComplaintStatus.IN_PROGRESS,
                      ComplaintStatus.REOPENED,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', ComplaintStatus.RESOLVED] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', ComplaintStatus.CLOSED] }, 1, 0] },
          },
        },
      },
    ]);

    const complaints = complaintStats[0] || { total: 0, active: 0, resolved: 0, closed: 0 };

    // Attendance Aggregation (present + late) / total * 100
    const attendanceStats = await AttendanceRecord.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          attendedRecords: {
            $sum: {
              $cond: [
                { $in: ['$status', [AttendanceStatus.PRESENT, AttendanceStatus.LATE]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalAttendanceRecords = attendanceStats[0]?.totalRecords || 0;
    const attendedRecords = attendanceStats[0]?.attendedRecords || 0;
    const avgAttendancePercentage =
      totalAttendanceRecords > 0
        ? Math.round((attendedRecords / totalAttendanceRecords) * 10000) / 100
        : 0;

    const totalSessions = await AttendanceSession.countDocuments({
      sessionDate: { $gte: from, $lte: to },
    });

    // Hostel Occupancy Aggregation
    const hostelMatch: Record<string, unknown> = { isActive: true };
    if (hostelIdScope) {
      hostelMatch._id = new Types.ObjectId(hostelIdScope);
    }
    const hostelDocs = await Hostel.find(hostelMatch).lean();
    const hostelIds = hostelDocs.map((h) => h._id);

    const [totalCapacityRes, activeAllocationsRes] = await Promise.all([
      Room.aggregate([
        { $match: { hostelId: { $in: hostelIds } } },
        { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } },
      ]),
      StudentRoomAllocation.countDocuments({
        hostelId: { $in: hostelIds },
        status: AllocationStatus.ACTIVE,
      }),
    ]);

    const totalCapacity = totalCapacityRes[0]?.totalCapacity || 0;
    const occupiedBeds = activeAllocationsRes;
    const hostelOccupancyPercentage =
      totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 10000) / 100 : 0;

    // Mess Feedback Rating Aggregation
    const messStats = await MessFeedback.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
        },
      },
    ]);
    const avgMessRating = messStats[0]?.avgRating
      ? Math.round(messStats[0].avgRating * 100) / 100
      : 0;

    // Gate Events Aggregation
    const gateEventCount = await GateEvent.countDocuments({
      scannedAt: { $gte: from, $lte: to },
    });

    // Communication Aggregation
    const commStats = await Notification.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          readCount: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } },
          actionCount: { $sum: { $cond: [{ $ne: ['$actionAt', null] }, 1, 0] } },
        },
      },
    ]);
    const totalNotifs = commStats[0]?.totalNotifications || 0;
    const readCount = commStats[0]?.readCount || 0;
    const actionCount = commStats[0]?.actionCount || 0;

    const readPercentage =
      totalNotifs > 0 ? Math.round((readCount / totalNotifs) * 10000) / 100 : 0;
    const actionPercentage =
      totalNotifs > 0 ? Math.round((actionCount / totalNotifs) * 10000) / 100 : 0;

    return {
      timeRange: { from, to },
      complaints: {
        total: complaints.total,
        active: complaints.active,
        resolved: complaints.resolved,
        closed: complaints.closed,
      },
      attendance: {
        averagePercentage: avgAttendancePercentage,
        totalSessions,
      },
      hostel: {
        totalCapacity,
        occupiedBeds,
        occupancyPercentage: hostelOccupancyPercentage,
      },
      mess: {
        averageRating: avgMessRating,
        totalFeedback: messStats[0]?.totalFeedback || 0,
      },
      gate: {
        totalEvents: gateEventCount,
      },
      communication: {
        totalNotifications: totalNotifs,
        readPercentage,
        actionPercentage,
      },
    };
  }

  /**
   * 2. GET /complaints
   */
  public static async getComplaintAnalytics(
    query: {
      from?: string;
      to?: string;
      hostelId?: string;
      blockId?: string;
      category?: string;
      priority?: string;
      status?: string;
      assignedStaffId?: string;
    },
    hostelIdScope?: string,
  ) {
    const { from, to } = this.parseDateWindow(query.from, query.to);
    const matchFilter: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: to },
    };

    const effectiveHostelId = hostelIdScope || query.hostelId;
    if (effectiveHostelId) {
      matchFilter.hostelId = new Types.ObjectId(effectiveHostelId);
    }
    if (query.blockId) {
      matchFilter.blockId = new Types.ObjectId(query.blockId);
    }
    if (query.category) {
      matchFilter.category = query.category;
    }
    if (query.priority) {
      matchFilter.priority = query.priority;
    }
    if (query.status) {
      matchFilter.status = query.status;
    }
    if (query.assignedStaffId) {
      matchFilter.assignedTo = new Types.ObjectId(query.assignedStaffId);
    }

    const now = new Date();

    const [statusFacet, categoryFacet, priorityFacet, resolutionTimeFacet, ageingFacet] =
      await Promise.all([
        // Status Breakdown
        Complaint.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Category Distribution
        Complaint.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        // Priority Distribution
        Complaint.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        // Resolution Time Aggregation (in minutes)
        Complaint.aggregate([
          {
            $match: {
              ...matchFilter,
              resolvedAt: { $ne: null },
            },
          },
          {
            $project: {
              resolutionTimeMinutes: {
                $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgResolutionMinutes: { $avg: '$resolutionTimeMinutes' },
              count: { $sum: 1 },
            },
          },
        ]),
        // Active Complaint Age & Ageing Buckets
        Complaint.aggregate([
          {
            $match: {
              ...matchFilter,
              status: {
                $in: [
                  ComplaintStatus.OPEN,
                  ComplaintStatus.ASSIGNED,
                  ComplaintStatus.IN_PROGRESS,
                  ComplaintStatus.REOPENED,
                ],
              },
            },
          },
          {
            $project: {
              ageHours: {
                $divide: [{ $subtract: [now, '$createdAt'] }, 1000 * 60 * 60],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalActive: { $sum: 1 },
              avgAgeHours: { $avg: '$ageHours' },
              under24h: { $sum: { $cond: [{ $lt: ['$ageHours', 24] }, 1, 0] } },
              between24and48h: {
                $sum: {
                  $cond: [
                    { $and: [{ $gte: ['$ageHours', 24] }, { $lt: ['$ageHours', 48] }] },
                    1,
                    0,
                  ],
                },
              },
              between48and72h: {
                $sum: {
                  $cond: [
                    { $and: [{ $gte: ['$ageHours', 48] }, { $lt: ['$ageHours', 72] }] },
                    1,
                    0,
                  ],
                },
              },
              between3and7d: {
                $sum: {
                  $cond: [
                    { $and: [{ $gte: ['$ageHours', 72] }, { $lt: ['$ageHours', 168] }] },
                    1,
                    0,
                  ],
                },
              },
              over7d: { $sum: { $cond: [{ $gte: ['$ageHours', 168] }, 1, 0] } },
            },
          },
        ]),
      ]);

    const statusBreakdown = statusFacet.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryDistribution = categoryFacet.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const priorityDistribution = priorityFacet.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const avgResolutionMinutes = resolutionTimeFacet[0]?.avgResolutionMinutes || 0;
    const avgResolutionHours = Math.round((avgResolutionMinutes / 60) * 100) / 100;

    const ageingData = ageingFacet[0] || {
      totalActive: 0,
      avgAgeHours: 0,
      under24h: 0,
      between24and48h: 0,
      between48and72h: 0,
      between3and7d: 0,
      over7d: 0,
    };

    return {
      timeRange: { from, to },
      statusBreakdown,
      categoryDistribution,
      priorityDistribution,
      resolutionTime: {
        averageMinutes: Math.round(avgResolutionMinutes * 100) / 100,
        averageHours: avgResolutionHours,
        resolvedCount: resolutionTimeFacet[0]?.count || 0,
      },
      activeComplaints: {
        count: ageingData.totalActive,
        averageAgeHours: Math.round((ageingData.avgAgeHours || 0) * 100) / 100,
        ageingBuckets: {
          under24h: ageingData.under24h,
          between24and48h: ageingData.between24and48h,
          between48and72h: ageingData.between48and72h,
          between3and7d: ageingData.between3and7d,
          over7d: ageingData.over7d,
        },
      },
    };
  }

  /**
   * 3. GET /workload
   */
  public static async getWorkloadAnalytics(
    query: { from?: string; to?: string; hostelId?: string },
    hostelIdScope?: string,
  ) {
    const { from, to } = this.parseDateWindow(query.from, query.to);
    const matchFilter: Record<string, unknown> = {
      createdAt: { $gte: from, $lte: to },
      assignedTo: { $exists: true, $ne: null },
    };

    const effectiveHostelId = hostelIdScope || query.hostelId;
    if (effectiveHostelId) {
      matchFilter.hostelId = new Types.ObjectId(effectiveHostelId);
    }

    const workload = await Complaint.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$assignedTo',
          activeComplaints: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      ComplaintStatus.OPEN,
                      ComplaintStatus.ASSIGNED,
                      ComplaintStatus.IN_PROGRESS,
                      ComplaintStatus.REOPENED,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          resolvedComplaints: {
            $sum: {
              $cond: [
                { $in: ['$status', [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]] },
                1,
                0,
              ],
            },
          },
          totalResolutionMinutes: {
            $sum: {
              $cond: [
                { $ne: ['$resolvedAt', null] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60] },
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff',
        },
      },
      { $unwind: '$staff' },
      {
        $project: {
          staffId: '$_id',
          staffName: '$staff.name',
          staffEmail: '$staff.email',
          activeComplaints: 1,
          resolvedComplaints: 1,
          averageResolutionHours: {
            $cond: [
              { $gt: ['$resolvedComplaints', 0] },
              {
                $round: [
                  {
                    $divide: [{ $divide: ['$totalResolutionMinutes', '$resolvedComplaints'] }, 60],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { activeComplaints: -1 } },
    ]);

    return workload;
  }

  /**
   * 4. GET /recurring-issues
   */
  public static async getRecurringIssues(windowDays = 30, limit = 10, hostelIdScope?: string) {
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const matchFilter: Record<string, unknown> = {
      createdAt: { $gte: from },
    };

    if (hostelIdScope) {
      matchFilter.hostelId = new Types.ObjectId(hostelIdScope);
    }

    const [locationHotspots, assetHotspots, categoryHotspots] = await Promise.all([
      // Group by location (hostelId, blockId, roomId)
      Complaint.aggregate([
        { $match: { ...matchFilter, hostelId: { $exists: true } } },
        {
          $group: {
            _id: {
              hostelId: '$hostelId',
              blockId: '$blockId',
              roomId: '$roomId',
            },
            count: { $sum: 1 },
            categories: { $addToSet: '$category' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'hostels',
            localField: '_id.hostelId',
            foreignField: '_id',
            as: 'hostel',
          },
        },
        {
          $lookup: {
            from: 'hostelblocks',
            localField: '_id.blockId',
            foreignField: '_id',
            as: 'block',
          },
        },
        {
          $lookup: {
            from: 'rooms',
            localField: '_id.roomId',
            foreignField: '_id',
            as: 'room',
          },
        },
        {
          $project: {
            hostelId: '$_id.hostelId',
            hostelName: { $arrayElemAt: ['$hostel.name', 0] },
            blockId: '$_id.blockId',
            blockName: { $arrayElemAt: ['$block.name', 0] },
            roomId: '$_id.roomId',
            roomNumber: { $arrayElemAt: ['$room.roomNumber', 0] },
            count: 1,
            categories: 1,
          },
        },
      ]),
      // Group by asset
      Complaint.aggregate([
        { $match: { ...matchFilter, assetId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$assetId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'facilityassets',
            localField: '_id',
            foreignField: '_id',
            as: 'asset',
          },
        },
        { $unwind: '$asset' },
        {
          $project: {
            assetId: '$_id',
            assetName: '$asset.name',
            assetTag: '$asset.assetTag',
            category: '$asset.category',
            count: 1,
          },
        },
      ]),
      // Group by category
      Complaint.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
          $project: {
            category: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    return {
      windowDays,
      locationHotspots,
      assetHotspots,
      categoryHotspots,
    };
  }

  /**
   * 5. GET /attendance
   */
  public static async getAttendanceAnalytics(query: {
    from?: string;
    to?: string;
    academicYear?: string;
    semester?: string;
    program?: string;
    course?: string;
    section?: string;
  }) {
    const { from, to } = this.parseDateWindow(query.from, query.to);

    const sessionMatch: Record<string, unknown> = {
      sessionDate: { $gte: from, $lte: to },
    };

    if (query.course) sessionMatch.courseId = new Types.ObjectId(query.course);
    if (query.section) sessionMatch.sectionId = new Types.ObjectId(query.section);
    if (query.academicYear) sessionMatch.academicYearId = new Types.ObjectId(query.academicYear);
    if (query.semester) sessionMatch.semesterId = new Types.ObjectId(query.semester);

    const sessions = await AttendanceSession.find(sessionMatch, '_id').lean();
    const sessionIds = sessions.map((s) => s._id);

    const [overallRecordStats, courseBreakdown, sectionBreakdown] = await Promise.all([
      AttendanceRecord.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            attendedRecords: {
              $sum: {
                $cond: [
                  { $in: ['$status', [AttendanceStatus.PRESENT, AttendanceStatus.LATE]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      // Attendance by Course
      AttendanceRecord.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        {
          $lookup: {
            from: 'attendancesessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session',
          },
        },
        { $unwind: '$session' },
        {
          $group: {
            _id: '$session.courseId',
            totalRecords: { $sum: 1 },
            attendedRecords: {
              $sum: {
                $cond: [
                  { $in: ['$status', [AttendanceStatus.PRESENT, AttendanceStatus.LATE]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        {
          $project: {
            courseId: '$_id',
            courseCode: '$course.code',
            courseName: '$course.name',
            totalRecords: 1,
            attendedRecords: 1,
            attendancePercentage: {
              $cond: [
                { $gt: ['$totalRecords', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$attendedRecords', '$totalRecords'] }, 100] },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
      ]),
      // Attendance by Section
      AttendanceRecord.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        {
          $lookup: {
            from: 'attendancesessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session',
          },
        },
        { $unwind: '$session' },
        {
          $group: {
            _id: '$session.sectionId',
            totalRecords: { $sum: 1 },
            attendedRecords: {
              $sum: {
                $cond: [
                  { $in: ['$status', [AttendanceStatus.PRESENT, AttendanceStatus.LATE]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'classsections',
            localField: '_id',
            foreignField: '_id',
            as: 'section',
          },
        },
        { $unwind: '$section' },
        {
          $project: {
            sectionId: '$_id',
            sectionName: '$section.name',
            totalRecords: 1,
            attendedRecords: 1,
            attendancePercentage: {
              $cond: [
                { $gt: ['$totalRecords', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$attendedRecords', '$totalRecords'] }, 100] },
                    2,
                  ],
                },
                0,
              ],
            },
          },
        },
      ]),
    ]);

    const totalRecords = overallRecordStats[0]?.totalRecords || 0;
    const attendedRecords = overallRecordStats[0]?.attendedRecords || 0;
    const overallPercentage =
      totalRecords > 0 ? Math.round((attendedRecords / totalRecords) * 10000) / 100 : 0;

    return {
      timeRange: { from, to },
      totalSessions: sessionIds.length,
      totalAttendanceRecords: totalRecords,
      attendedRecords,
      overallAttendancePercentage: overallPercentage,
      courseBreakdown,
      sectionBreakdown,
    };
  }

  /**
   * 6. GET /attendance/low
   */
  public static async getLowAttendanceStudents(query: {
    threshold?: number;
    academicYear?: string;
    semester?: string;
    program?: string;
    section?: string;
    course?: string;
    page?: string;
    limit?: string;
  }) {
    const threshold = query.threshold !== undefined ? query.threshold : 75;
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const enrollmentMatch: Record<string, unknown> = { status: 'active' };
    if (query.program) enrollmentMatch.programId = new Types.ObjectId(query.program);
    if (query.academicYear) enrollmentMatch.academicYearId = new Types.ObjectId(query.academicYear);

    const studentStats = await AttendanceRecord.aggregate([
      {
        $group: {
          _id: '$studentId',
          totalConducted: { $sum: 1 },
          attended: {
            $sum: {
              $cond: [
                { $in: ['$status', [AttendanceStatus.PRESENT, AttendanceStatus.LATE]] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          studentId: '$_id',
          totalConducted: 1,
          attended: 1,
          attendancePercentage: {
            $cond: [
              { $gt: ['$totalConducted', 0] },
              {
                $round: [{ $multiply: [{ $divide: ['$attended', '$totalConducted'] }, 100] }, 2],
              },
              0,
            ],
          },
        },
      },
      { $match: { attendancePercentage: { $lt: threshold } } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: 1,
          studentName: { $ifNull: ['$student.name', 'Student'] },
          studentEmail: { $ifNull: ['$student.email', ''] },
          totalConducted: 1,
          attended: 1,
          attendancePercentage: 1,
        },
      },
      { $sort: { attendancePercentage: 1 } },
    ]);

    const paginated = studentStats.slice(skip, skip + limitNum);

    return {
      threshold,
      totalLowAttendanceStudents: studentStats.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(studentStats.length / limitNum),
      students: paginated,
    };
  }

  /**
   * 7. GET /hostels
   */
  public static async getHostelAnalytics(hostelIdScope?: string) {
    const hostelMatch: Record<string, unknown> = { isActive: true };
    if (hostelIdScope) {
      hostelMatch._id = new Types.ObjectId(hostelIdScope);
    }

    const hostels = await Hostel.find(hostelMatch).lean();
    const hostelIds = hostels.map((h) => h._id);

    const [blocksCount, roomsCount, capacityRes, activeAllocationsRes, hostelWiseStats] =
      await Promise.all([
        HostelBlock.countDocuments({ hostelId: { $in: hostelIds } }),
        Room.countDocuments({ hostelId: { $in: hostelIds } }),
        Room.aggregate([
          { $match: { hostelId: { $in: hostelIds } } },
          { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } },
        ]),
        StudentRoomAllocation.countDocuments({
          hostelId: { $in: hostelIds },
          status: AllocationStatus.ACTIVE,
        }),
        Room.aggregate([
          { $match: { hostelId: { $in: hostelIds } } },
          {
            $group: {
              _id: '$hostelId',
              roomCount: { $sum: 1 },
              totalCapacity: { $sum: '$capacity' },
              occupiedCount: { $sum: '$occupiedCount' },
            },
          },
          {
            $lookup: {
              from: 'hostels',
              localField: '_id',
              foreignField: '_id',
              as: 'hostel',
            },
          },
          { $unwind: '$hostel' },
          {
            $project: {
              hostelId: '$_id',
              hostelName: '$hostel.name',
              hostelCode: '$hostel.code',
              roomCount: 1,
              totalCapacity: 1,
              occupiedCount: 1,
              availableBeds: { $subtract: ['$totalCapacity', '$occupiedCount'] },
              occupancyPercentage: {
                $cond: [
                  { $gt: ['$totalCapacity', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$occupiedCount', '$totalCapacity'] }, 100] },
                      2,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ]),
      ]);

    const totalCapacity = capacityRes[0]?.totalCapacity || 0;
    const occupiedBeds = activeAllocationsRes;
    const availableBeds = Math.max(totalCapacity - occupiedBeds, 0);
    const overallOccupancyPercentage =
      totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 10000) / 100 : 0;

    return {
      totalHostels: hostels.length,
      totalBlocks: blocksCount,
      totalRooms: roomsCount,
      totalCapacity,
      occupiedBeds,
      availableBeds,
      overallOccupancyPercentage,
      hostelWiseBreakdown: hostelWiseStats,
    };
  }

  /**
   * 8. GET /facilities
   */
  public static async getFacilityAnalytics(hostelIdScope?: string) {
    const matchFilter: Record<string, unknown> = {};
    if (hostelIdScope) {
      matchFilter.hostelId = new Types.ObjectId(hostelIdScope);
    }

    const [statusStats, categoryStats, complaintCounts] = await Promise.all([
      FacilityAsset.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      FacilityAsset.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { assetId: { $exists: true, $ne: null } } },
        { $group: { _id: '$assetId', complaintCount: { $sum: 1 } } },
        { $sort: { complaintCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'facilityassets',
            localField: '_id',
            foreignField: '_id',
            as: 'asset',
          },
        },
        { $unwind: '$asset' },
        {
          $project: {
            assetId: '$_id',
            assetName: '$asset.name',
            assetTag: '$asset.assetTag',
            category: '$asset.category',
            complaintCount: 1,
          },
        },
      ]),
    ]);

    const statusCounts = statusStats.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryBreakdown = categoryStats.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalAssets = (Object.values(statusCounts) as number[]).reduce((a, b) => a + b, 0);

    return {
      totalAssets,
      activeAssets: statusCounts.active || 0,
      maintenanceAssets: statusCounts.maintenance || 0,
      inactiveAssets: statusCounts.retired || statusCounts.inactive || 0,
      categoryBreakdown,
      topComplaintAssets: complaintCounts,
    };
  }

  /**
   * 9. GET /mess
   */
  public static async getMessAnalytics(fromStr?: string, toStr?: string) {
    const { from, to } = this.parseDateWindow(fromStr, toStr);

    const [ratingStats, ratingDist, mealTypeStats] = await Promise.all([
      MessFeedback.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
      MessFeedback.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      MessFeedback.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $lookup: {
            from: 'messmenus',
            localField: 'menuId',
            foreignField: '_id',
            as: 'menu',
          },
        },
        { $unwind: '$menu' },
        {
          $group: {
            _id: '$menu.mealType',
            avgRating: { $avg: '$rating' },
            totalFeedback: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalFeedback = ratingStats[0]?.totalFeedback || 0;
    const avgRating = ratingStats[0]?.avgRating
      ? Math.round(ratingStats[0].avgRating * 100) / 100
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDist.forEach((item) => {
      ratingDistribution[item._id] = item.count;
    });

    const mealTypeBreakdown = mealTypeStats.map((item) => ({
      mealType: item._id,
      averageRating: Math.round(item.avgRating * 100) / 100,
      totalFeedback: item.totalFeedback,
    }));

    return {
      timeRange: { from, to },
      totalFeedback,
      averageRating: avgRating,
      ratingDistribution,
      mealTypeBreakdown,
    };
  }

  /**
   * 10. GET /gates
   */
  public static async getGateAnalytics(fromStr?: string, toStr?: string) {
    const { from, to } = this.parseDateWindow(fromStr, toStr);

    const [eventTypes, gateBreakdown, dailyEvents] = await Promise.all([
      GateEvent.aggregate([
        { $match: { scannedAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
      ]),
      GateEvent.aggregate([
        { $match: { scannedAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$gateId', count: { $sum: 1 } } },
      ]),
      GateEvent.aggregate([
        { $match: { scannedAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const typeCounts = eventTypes.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalEvents = (Object.values(typeCounts) as number[]).reduce((a, b) => a + b, 0);

    return {
      timeRange: { from, to },
      totalEvents,
      exitCount: typeCounts.exit || 0,
      entryCount: typeCounts.entry || 0,
      gateBreakdown: gateBreakdown.map((g) => ({ gateId: g._id, count: g.count })),
      dailyEvents: dailyEvents.map((d) => ({ date: d._id, count: d.count })),
    };
  }

  /**
   * 11. GET /communication
   */
  public static async getCommunicationAnalytics(fromStr?: string, toStr?: string) {
    const { from, to } = this.parseDateWindow(fromStr, toStr);

    const [announcementStats, notificationStats] = await Promise.all([
      Announcement.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ['$deliveryStatus', NotificationDeliveryStatus.PENDING] }, 1, 0],
              },
            },
            deliveredCount: {
              $sum: {
                $cond: [{ $eq: ['$deliveryStatus', NotificationDeliveryStatus.DELIVERED] }, 1, 0],
              },
            },
            failedCount: {
              $sum: {
                $cond: [{ $eq: ['$deliveryStatus', NotificationDeliveryStatus.FAILED] }, 1, 0],
              },
            },
            readCount: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } },
            actionCount: { $sum: { $cond: [{ $ne: ['$actionAt', null] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const announcementCounts = announcementStats.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const notifData = notificationStats[0] || {
      totalNotifications: 0,
      pendingCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      readCount: 0,
      actionCount: 0,
    };

    const totalNotifs = notifData.totalNotifications;
    const readPercentage =
      totalNotifs > 0 ? Math.round((notifData.readCount / totalNotifs) * 10000) / 100 : 0;
    const actionPercentage =
      totalNotifs > 0 ? Math.round((notifData.actionCount / totalNotifs) * 10000) / 100 : 0;

    return {
      timeRange: { from, to },
      announcements: {
        total: (Object.values(announcementCounts) as number[]).reduce((a, b) => a + b, 0),
        draft: announcementCounts.draft || 0,
        published: announcementCounts.published || 0,
        cancelled: announcementCounts.cancelled || 0,
        expired: announcementCounts.expired || 0,
      },
      notifications: {
        total: totalNotifs,
        pending: notifData.pendingCount,
        delivered: notifData.deliveredCount,
        failed: notifData.failedCount,
        read: notifData.readCount,
        actioned: notifData.actionCount,
        readPercentage,
        actionPercentage,
      },
    };
  }
}
