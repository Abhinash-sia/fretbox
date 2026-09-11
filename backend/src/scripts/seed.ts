import { getEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Department } from '../models/department.model.js';
import { Program } from '../models/program.model.js';
import { AcademicYear } from '../models/academicYear.model.js';
import { Semester } from '../models/semester.model.js';
import { Course } from '../models/course.model.js';
import { ClassSection } from '../models/classSection.model.js';
import { FacultyAssignment } from '../models/facultyAssignment.model.js';
import { StudentEnrollment } from '../models/studentEnrollment.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { AttendanceRecord } from '../models/attendanceRecord.model.js';
import { Hostel } from '../models/hostel.model.js';
import { HostelBlock } from '../models/hostelBlock.model.js';
import { Room } from '../models/room.model.js';
import { StudentRoomAllocation } from '../models/studentRoomAllocation.model.js';
import { FacilityAsset } from '../models/facilityAsset.model.js';
import { Complaint } from '../models/complaint.model.js';
import { ComplaintAssignment } from '../models/complaintAssignment.model.js';
import { ComplaintAudit } from '../models/complaintAudit.model.js';
import { MessMenu } from '../models/messMenu.model.js';
import { MessFeedback } from '../models/messFeedback.model.js';
import { GatePass } from '../models/gatePass.model.js';
import { GateEvent } from '../models/gateEvent.model.js';
import { Announcement } from '../models/announcement.model.js';
import { Notification } from '../models/notification.model.js';
import { FaqDocument } from '../models/faqDocument.model.js';
import { passwordService } from '../services/password.service.js';
import {
  UserRole,
  FaqCategory,
  AttendanceStatus,
  SessionStatus,
  HostelCategory,
  RoomStatus,
  AllocationStatus,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintAuditAction,
  MealType,
  GatePassStatus,
  GateEventType,
  AnnouncementPriority,
  AnnouncementStatus,
  NotificationType,
  NotificationDeliveryStatus,
} from '../types/index.js';
import { logger } from '../config/logger.js';

const seedUsers = [
  {
    name: 'Demo Student 1',
    email: 'student@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STUDENT,
  },
  {
    name: 'Demo Student 2',
    email: 'student2@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STUDENT,
  },
  {
    name: 'Demo Faculty',
    email: 'faculty@fretbox.demo',
    password: 'Password123!',
    role: UserRole.FACULTY,
  },
  {
    name: 'Demo Security',
    email: 'security@fretbox.demo',
    password: 'Password123!',
    role: UserRole.SECURITY,
  },
  {
    name: 'Demo Warden',
    email: 'warden@fretbox.demo',
    password: 'Password123!',
    role: UserRole.WARDEN,
  },
  {
    name: 'Demo Staff',
    email: 'staff@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STAFF,
  },
  {
    name: 'Demo Admin',
    email: 'admin@fretbox.demo',
    password: 'Password123!',
    role: UserRole.ADMINISTRATOR,
  },
];

async function seed() {
  logger.info('Starting manual development seed script (B0 + B1 + B2 + B3)...');
  const env = getEnv();

  try {
    await connectDB(env.MONGODB_URI);

    // 1. Seed Users
    const userMap = new Map<string, string>();
    for (const userData of seedUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        const passwordHash = await passwordService.hashPassword(userData.password);
        user = await User.create({
          name: userData.name,
          email: userData.email,
          passwordHash,
          role: userData.role,
          isActive: true,
        });
        logger.info({ email: userData.email, role: userData.role }, 'Seeded test account');
      }
      userMap.set(userData.email, user._id.toString());
    }

    const facultyId = userMap.get('faculty@fretbox.demo')!;
    const student1Id = userMap.get('student@fretbox.demo')!;
    const student2Id = userMap.get('student2@fretbox.demo')!;
    const staffId = userMap.get('staff@fretbox.demo')!;
    const wardenId = userMap.get('warden@fretbox.demo')!;
    const adminId = userMap.get('admin@fretbox.demo')!;
    logger.info({ adminId }, 'Loaded Demo Admin ID');

    // 2. Department
    let dept = await Department.findOne({ code: 'CSE' });
    if (!dept) {
      dept = await Department.create({
        name: 'Computer Science and Engineering',
        code: 'CSE',
        isActive: true,
      });
      logger.info('Seeded Department: CSE');
    }

    // 3. Program
    let prog = await Program.findOne({ code: 'BTECH-CS' });
    if (!prog) {
      prog = await Program.create({
        name: 'Bachelor of Technology in Computer Science',
        code: 'BTECH-CS',
        departmentId: dept._id,
        durationYears: 4,
        isActive: true,
      });
      logger.info('Seeded Program: BTECH-CS');
    }

    // 4. Academic Year
    let acadYear = await AcademicYear.findOne({
      $or: [{ name: '2025-2026' }, { yearCode: '2025-2026' }],
    });
    if (!acadYear) {
      acadYear = await AcademicYear.create({
        name: '2025-2026',
        yearCode: '2025-2026',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-05-31'),
        isCurrent: true,
      });
      logger.info('Seeded Academic Year: 2025-2026');
    }

    // 5. Semester
    let sem = await Semester.findOne({
      $or: [
        { programId: prog._id, semesterNumber: 5 },
        { academicYearId: acadYear._id, number: 5 },
      ],
    });
    if (!sem) {
      sem = await Semester.create({
        academicYearId: acadYear._id,
        programId: prog._id,
        semesterNumber: 5,
        number: 5,
        name: 'Semester 5',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-12-20'),
        isActive: true,
      });
      logger.info('Seeded Semester 5');
    }

    // 6. Course
    let course = await Course.findOne({ code: 'CS501' });
    if (!course) {
      course = await Course.create({
        code: 'CS501',
        name: 'Database Management Systems',
        departmentId: dept._id,
        programId: prog._id,
        semesterId: sem._id,
        credits: 4,
        description: 'Relational databases, indexing, and SQL.',
        isActive: true,
      });
      logger.info('Seeded Course: CS501');
    }

    // 7. Class Section
    let section = await ClassSection.findOne({ name: 'CS501-A' });
    if (!section) {
      section = await ClassSection.create({
        name: 'CS501-A',
        courseId: course._id,
        academicYearId: acadYear._id,
        programId: prog._id,
        semesterId: sem._id,
        capacity: 60,
        isActive: true,
      });
      logger.info('Seeded Class Section: CS501-A');
    }

    // 8. Faculty Assignment
    let facAssign = await FacultyAssignment.findOne({
      facultyId,
      classSectionId: section._id,
    });
    if (!facAssign) {
      facAssign = await FacultyAssignment.create({
        facultyId,
        courseId: course._id,
        semesterId: sem._id,
        academicYearId: acadYear._id,
        classSectionId: section._id,
        role: 'primary',
      });
      logger.info('Seeded Faculty Assignment');
    }

    // 9. Student Enrollments
    let enrollIndex = 1;
    for (const sId of [student1Id, student2Id]) {
      let enroll = await StudentEnrollment.findOne({
        studentId: sId,
        classSectionId: section._id,
      });
      if (!enroll) {
        enroll = await StudentEnrollment.create({
          studentId: sId,
          classSectionId: section._id,
          academicYearId: acadYear._id,
          semesterId: sem._id,
          rollNumber: `CS202500${enrollIndex}`,
          enrolledAt: new Date('2025-08-05'),
        });
      }
      enrollIndex += 1;
    }
    logger.info('Seeded Student Enrollments');

    // 10. Attendance Sessions & Records
    let session = await AttendanceSession.findOne({ classSectionId: section._id });
    if (!session) {
      session = await AttendanceSession.create({
        classSectionId: section._id,
        courseId: course._id,
        facultyId,
        createdByFacultyId: facultyId,
        date: new Date('2025-09-01'),
        startTime: '09:00',
        endTime: '10:00',
        topic: 'Introduction to Normalization',
        status: SessionStatus.COMPLETED,
      });

      await AttendanceRecord.create({
        attendanceSessionId: session._id,
        sessionId: session._id,
        studentId: student1Id,
        status: AttendanceStatus.PRESENT,
        markedBy: facultyId,
        markedByFacultyId: facultyId,
      });

      await AttendanceRecord.create({
        attendanceSessionId: session._id,
        sessionId: session._id,
        studentId: student2Id,
        status: AttendanceStatus.ABSENT,
        markedBy: facultyId,
        markedByFacultyId: facultyId,
      });

      logger.info('Seeded Attendance Session & Records');
    }

    // --- Phase B3 Operations Domain Seeding ---

    // 11. Hostel
    let hostel = await Hostel.findOne({ code: 'BHA' });
    if (!hostel) {
      hostel = await Hostel.create({
        name: 'Boys Hostel A',
        code: 'BHA',
        category: HostelCategory.BOYS,
        capacity: 100,
        description: 'Main residential block for male engineering students',
        isActive: true,
      });
      logger.info('Seeded Hostel: Boys Hostel A');
    }

    // 12. Hostel Block
    let block = await HostelBlock.findOne({ hostelId: hostel._id, code: 'B1' });
    if (!block) {
      block = await HostelBlock.create({
        hostelId: hostel._id,
        name: 'Block 1',
        code: 'B1',
        floors: 3,
        description: 'West Wing',
        isActive: true,
      });
      logger.info('Seeded Hostel Block: Block 1');
    }

    // 13. Rooms
    let room101 = await Room.findOne({ blockId: block._id, roomNumber: '101' });
    if (!room101) {
      room101 = await Room.create({
        hostelId: hostel._id,
        hostelBlockId: block._id,
        blockId: block._id,
        roomNumber: '101',
        floor: 1,
        floorNumber: 1,
        capacity: 2,
        occupiedCount: 1,
        status: RoomStatus.AVAILABLE,
      });
      logger.info('Seeded Room: 101');
    }

    let room102 = await Room.findOne({ blockId: block._id, roomNumber: '102' });
    if (!room102) {
      room102 = await Room.create({
        hostelId: hostel._id,
        hostelBlockId: block._id,
        blockId: block._id,
        roomNumber: '102',
        floor: 1,
        floorNumber: 1,
        capacity: 2,
        occupiedCount: 0,
        status: RoomStatus.AVAILABLE,
      });
      logger.info('Seeded Room: 102');
    }

    // 14. Room Allocation
    let alloc = await StudentRoomAllocation.findOne({
      studentId: student1Id,
      status: AllocationStatus.ACTIVE,
    });
    if (!alloc) {
      alloc = await StudentRoomAllocation.create({
        studentId: student1Id,
        hostelId: hostel._id,
        blockId: block._id,
        roomId: room101._id,
        allocatedByUserId: wardenId,
        allocatedAt: new Date('2025-08-10'),
        status: AllocationStatus.ACTIVE,
        remarks: 'Semester 5 allocation',
      });
      logger.info('Seeded Room Allocation for Student 1');
    }

    // 15. Facility Assets
    let asset = await FacilityAsset.findOne({ assetTag: 'WP-B1-F1' });
    if (!asset) {
      asset = await FacilityAsset.create({
        name: 'RO Water Purifier',
        assetCode: 'WP-B1-F1',
        assetTag: 'WP-B1-F1',
        category: AssetCategory.WATER,
        locationType: 'block',
        status: AssetStatus.ACTIVE,
        condition: AssetCondition.GOOD,
        hostelId: hostel._id,
        blockId: block._id,
        locationText: '1st Floor Common Corridor',
        notes: 'Serviced in July 2025',
      });
      logger.info('Seeded Facility Asset: RO Water Purifier');
    }

    // 16. Complaint & Ticket Lifecycle
    let complaint = await Complaint.findOne({ ticketNumber: 'FBX-2026-DEMO01' });
    if (!complaint) {
      complaint = await Complaint.create({
        ticketNumber: 'FBX-2026-DEMO01',
        studentId: student1Id,
        title: 'Water filter leakage on 1st Floor',
        description: 'RO Water filter WP-B1-F1 is leaking water on the floor.',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.ASSIGNED,
        hostelId: hostel._id,
        blockId: block._id,
        assetId: asset._id,
        assignedToStaffId: staffId,
        preferredTimeSlot: 'Morning 10 AM - 12 PM',
      });

      await ComplaintAssignment.create({
        complaintId: complaint._id,
        assignedToStaffId: staffId,
        assignedByUserId: wardenId,
        notes: 'Assigned to plumbing staff',
        assignedAt: new Date(),
        isActive: true,
      });

      await ComplaintAudit.create({
        complaintId: complaint._id,
        performedByUserId: student1Id,
        action: ComplaintAuditAction.CREATED,
        newStatus: ComplaintStatus.OPEN,
        notes: 'Complaint registered by student',
      });

      await ComplaintAudit.create({
        complaintId: complaint._id,
        performedByUserId: wardenId,
        action: ComplaintAuditAction.ASSIGNED,
        previousStatus: ComplaintStatus.OPEN,
        newStatus: ComplaintStatus.ASSIGNED,
        newAssigneeId: staffId,
        notes: 'Assigned to staff',
      });

      logger.info('Seeded Complaint FBX-2026-DEMO01 with audit trail');
    }

    // 17. Mess Menu & Feedback
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let menu = await MessMenu.findOne({ date: today, mealType: MealType.BREAKFAST });
    if (!menu) {
      menu = await MessMenu.create({
        hostelId: hostel._id,
        date: today,
        mealType: MealType.BREAKFAST,
        items: ['Masala Dosa', 'Sambar', 'Coconut Chutney', 'Tea / Coffee'],
        description: 'South Indian Breakfast',
        isPublished: true,
        createdByUserId: wardenId,
      });

      await MessFeedback.create({
        menuId: menu._id,
        studentId: student1Id,
        rating: 5,
        comments: 'Excellent dosa and hot coffee!',
      });

      logger.info('Seeded Mess Menu & Student Feedback');
    }

    // 18. Gate Passes & Gate Events
    let gatePass1 = await GatePass.findOne({ passNumber: 'FBX-GP-2026-DEMO01' });
    if (!gatePass1) {
      const securityId = userMap.get('security@fretbox.demo')!;
      const outTime = new Date();
      outTime.setHours(outTime.getHours() - 1);
      const returnTime = new Date();
      returnTime.setHours(returnTime.getHours() + 5);

      gatePass1 = await GatePass.create({
        passNumber: 'FBX-GP-2026-DEMO01',
        studentId: student1Id,
        reason: 'Weekend Home Visit',
        destination: 'Home',
        outDateTime: outTime,
        expectedReturnDateTime: returnTime,
        status: GatePassStatus.USED,
        approvedBy: wardenId,
        usedAt: new Date(),
      });

      await GateEvent.create({
        gatePassId: gatePass1._id,
        studentId: student1Id,
        securityUserId: securityId,
        eventType: GateEventType.EXIT,
        gateId: 'main-gate',
        scannedAt: new Date(),
      });

      // Pending Pass for Student 2
      await GatePass.create({
        passNumber: 'FBX-GP-2026-DEMO02',
        studentId: student2Id,
        reason: 'Library Books Purchase',
        destination: 'City Center Mall',
        outDateTime: new Date(),
        expectedReturnDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: GatePassStatus.PENDING,
      });

      logger.info('Seeded Gate Passes & Gate Event');
    }

    // 10. B5 Announcements & Notifications
    let announcement1 = await Announcement.findOne({ title: 'End Semester Exam Timetable' });
    if (!announcement1 && adminId && student1Id) {
      announcement1 = await Announcement.create({
        title: 'End Semester Exam Timetable',
        body: 'The end semester examination schedule has been published on the campus portal.',
        createdBy: adminId,
        target: { all: true },
        priority: AnnouncementPriority.HIGH,
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      });

      await Notification.create([
        {
          recipientId: student1Id,
          announcementId: announcement1._id,
          type: NotificationType.ANNOUNCEMENT,
          title: 'End Semester Exam Timetable',
          body: 'The end semester examination schedule has been published on the campus portal.',
          priority: AnnouncementPriority.HIGH,
          deliveryStatus: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
          readAt: new Date(),
        },
        {
          recipientId: student2Id,
          announcementId: announcement1._id,
          type: NotificationType.ANNOUNCEMENT,
          title: 'End Semester Exam Timetable',
          body: 'The end semester examination schedule has been published on the campus portal.',
          priority: AnnouncementPriority.HIGH,
          deliveryStatus: NotificationDeliveryStatus.PENDING,
        },
      ]);

      logger.info('Seeded B5 Announcements & Notifications');
    }

    // 16. Seed Approved Campus FAQ Knowledge Documents
    const faqCount = await FaqDocument.countDocuments();
    if (faqCount === 0) {
      await FaqDocument.create([
        {
          title: 'Hostel Curfew & Entry Rules',
          category: FaqCategory.HOSTEL,
          content:
            'Hostel gates close at 10:00 PM for all undergraduate students. Students entering after 10:00 PM must present an approved late gate pass issued by their hostel warden.',
          tags: ['hostel', 'curfew', 'timing', 'gate pass'],
          isApproved: true,
          targetRoles: [UserRole.STUDENT, UserRole.WARDEN],
        },
        {
          title: 'Minimum Attendance Requirement Policy',
          category: FaqCategory.ACADEMIC,
          content:
            'Students must maintain a minimum of 75% attendance in each enrolled course to be eligible to sit for the end-semester examinations. Medical excuses must be submitted within 3 working days.',
          tags: ['attendance', 'academic', 'policy', 'exam'],
          isApproved: true,
          targetRoles: [UserRole.STUDENT, UserRole.FACULTY],
        },
        {
          title: 'Mess Timings & Feedback System',
          category: FaqCategory.MESS,
          content:
            'Mess operating hours: Breakfast 7:30 AM - 9:30 AM, Lunch 12:30 PM - 2:30 PM, Evening Snacks 5:00 PM - 6:00 PM, Dinner 7:30 PM - 9:30 PM. Daily feedback can be submitted via Fretbox app.',
          tags: ['mess', 'timing', 'food', 'feedback'],
          isApproved: true,
          targetRoles: [UserRole.STUDENT],
        },
      ]);
      logger.info('Seeded Approved Campus FAQ Knowledge Documents');
    }

    // 17. Seed Continuous Historical Complaint Data for B9 Demand Prediction (45+ days)
    const existingComplaintCount = await Complaint.countDocuments();
    if (existingComplaintCount < 10) {
      const historicalComplaints = [];
      const baseDate = new Date();
      baseDate.setHours(10, 0, 0, 0);

      const categories = Object.values(ComplaintCategory);
      const priorities = Object.values(ComplaintPriority);
      const statuses = Object.values(ComplaintStatus);

      for (let dayOffset = 50; dayOffset >= 1; dayOffset--) {
        const targetDate = new Date(baseDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        // Generate pseudo-random complaint volume between 2 and 8 per day with seasonal weekly pattern
        const dayOfWeek = targetDate.getDay();
        const baseVolume = dayOfWeek === 0 || dayOfWeek === 6 ? 2 : 5; // Higher on weekdays
        const complaintCountForDay = baseVolume + (dayOffset % 3);

        for (let c = 0; c < complaintCountForDay; c++) {
          const category = categories[(dayOffset + c) % categories.length];
          const priority = priorities[(dayOffset + c) % priorities.length];
          const status = statuses[(dayOffset + c) % statuses.length];

          historicalComplaints.push({
            ticketNumber: `FBX-HIST-${dayOffset}-${c}`,
            studentId: student1Id,
            createdBy: student1Id,
            title: `Historical ${category} issue #${c + 1}`,
            description: `Automated historical complaint for day -${dayOffset} testing prediction engine.`,
            category,
            priority,
            status,
            createdAt: targetDate,
            updatedAt: targetDate,
          });
        }
      }

      await Complaint.insertMany(historicalComplaints);
      logger.info('Seeded Continuous Historical Complaint Data (50 days) for B9 Demand Prediction');
    }

    logger.info('Seed completed successfully! Log in using student@fretbox.demo / Password123!');
  } catch (err) {
    logger.error({ err }, 'Error running seed script');
  } finally {
    await disconnectDB();
  }
}

seed();
