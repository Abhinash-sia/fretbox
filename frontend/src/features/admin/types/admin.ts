export interface DateWindow {
  from: string;
  to: string;
}

export interface OverviewAnalytics {
  timeRange: DateWindow;
  complaints: {
    total: number;
    active: number;
    resolved: number;
    closed: number;
  };
  attendance: {
    averagePercentage: number;
    totalSessions: number;
  };
  hostel: {
    totalCapacity: number;
    occupiedBeds: number;
    occupancyPercentage: number;
  };
  mess: {
    averageRating: number;
    totalFeedback: number;
  };
  gate: {
    totalEvents: number;
  };
  communication: {
    totalNotifications: number;
    readPercentage: number;
    actionPercentage: number;
  };
}

export interface ComplaintAnalytics {
  timeRange: DateWindow;
  statusBreakdown: Record<string, number>;
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  resolutionTime: {
    averageMinutes: number;
    averageHours: number;
    resolvedCount: number;
  };
  activeComplaints: {
    count: number;
    averageAgeHours: number;
    ageingBuckets: {
      under24h: number;
      between24and48h: number;
      between48and72h: number;
      between3and7d: number;
      over7d: number;
    };
  };
}

export interface WorkloadStaffItem {
  staffId: string;
  staffName: string;
  staffEmail: string;
  activeComplaints: number;
  resolvedComplaints: number;
  averageResolutionHours: number;
}

export interface LocationHotspot {
  hostelId?: string;
  hostelName?: string;
  blockId?: string;
  blockName?: string;
  roomId?: string;
  roomNumber?: string;
  count: number;
  categories: string[];
}

export interface AssetHotspot {
  assetId: string;
  assetName: string;
  assetTag: string;
  category: string;
  count: number;
}

export interface CategoryHotspot {
  category: string;
  count: number;
}

export interface RecurringIssuesAnalytics {
  windowDays: number;
  locationHotspots: LocationHotspot[];
  assetHotspots: AssetHotspot[];
  categoryHotspots: CategoryHotspot[];
}

export interface CourseAttendanceItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalRecords: number;
  attendedRecords: number;
  attendancePercentage: number;
}

export interface SectionAttendanceItem {
  sectionId: string;
  sectionName: string;
  totalRecords: number;
  attendedRecords: number;
  attendancePercentage: number;
}

export interface AttendanceAnalytics {
  timeRange: DateWindow;
  totalSessions: number;
  totalAttendanceRecords: number;
  attendedRecords: number;
  overallAttendancePercentage: number;
  courseBreakdown: CourseAttendanceItem[];
  sectionBreakdown: SectionAttendanceItem[];
}

export interface LowAttendanceStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalConducted: number;
  attended: number;
  attendancePercentage: number;
}

export interface LowAttendanceResponse {
  threshold: number;
  totalLowAttendanceStudents: number;
  page: number;
  limit: number;
  totalPages: number;
  students: LowAttendanceStudent[];
}

export interface HostelWiseItem {
  hostelId: string;
  hostelName: string;
  hostelCode: string;
  roomCount: number;
  totalCapacity: number;
  occupiedCount: number;
  availableBeds: number;
  occupancyPercentage: number;
}

export interface HostelAnalytics {
  totalHostels: number;
  totalBlocks: number;
  totalRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  overallOccupancyPercentage: number;
  hostelWiseBreakdown: HostelWiseItem[];
}

export interface FacilityAssetComplaintItem {
  assetId: string;
  assetName: string;
  assetTag: string;
  category: string;
  complaintCount: number;
}

export interface FacilityAnalytics {
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  inactiveAssets: number;
  categoryBreakdown: Record<string, number>;
  topComplaintAssets: FacilityAssetComplaintItem[];
}

export interface MealTypeItem {
  mealType: string;
  averageRating: number;
  totalFeedback: number;
}

export interface MessAnalytics {
  timeRange: DateWindow;
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  mealTypeBreakdown: MealTypeItem[];
}

export interface GateBreakdownItem {
  gateId: string;
  count: number;
}

export interface DailyGateEventItem {
  date: string;
  count: number;
}

export interface GateAnalytics {
  timeRange: DateWindow;
  totalEvents: number;
  exitCount: number;
  entryCount: number;
  gateBreakdown: GateBreakdownItem[];
  dailyEvents: DailyGateEventItem[];
}

export interface CommunicationAnalytics {
  timeRange: DateWindow;
  totalNotifications: number;
  deliveredNotifications: number;
  pendingNotifications: number;
  failedNotifications: number;
  readNotifications: number;
  actionedNotifications: number;
  readPercentage: number;
  actionPercentage: number;
  announcementsByStatus: Record<string, number>;
}
