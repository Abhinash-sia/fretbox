export type UserRole =
  | 'student'
  | 'faculty'
  | 'security'
  | 'warden'
  | 'staff'
  | 'administrator';

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  description?: string;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export type RoleNavigation = Record<UserRole, NavGroup[]>;

export const ROLE_NAVIGATION: RoleNavigation = {
  student: [
    {
      groupName: 'Overview',
      items: [
        { title: 'Dashboard', href: '/student/dashboard', iconName: 'LayoutDashboard' },
        { title: 'Notifications', href: '/student/notifications', iconName: 'Bell', badge: 3, badgeVariant: 'warning' },
      ],
    },
    {
      groupName: 'Academics',
      items: [
        { title: 'Attendance', href: '/student/attendance', iconName: 'UserCheck' },
        { title: 'Timetable', href: '/student/timetable', iconName: 'Clock' },
        { title: 'Calendar', href: '/student/calendar', iconName: 'Calendar' },
      ],
    },
    {
      groupName: 'Campus Life',
      items: [
        { title: 'Hostel & Room', href: '/student/hostel', iconName: 'Building2' },
        { title: 'Complaints', href: '/student/complaints', iconName: 'Wrench' },
        { title: 'Gate Pass', href: '/student/gate-pass', iconName: 'QrCode', badge: 'Active', badgeVariant: 'success' },
        { title: 'Mess & Menu', href: '/student/mess', iconName: 'Utensils' },
        { title: 'Fees & Payments', href: '/student/fees', iconName: 'CreditCard' },
      ],
    },
  ],

  faculty: [
    {
      groupName: 'Academic Operations',
      items: [
        { title: 'Dashboard', href: '/faculty/dashboard', iconName: 'LayoutDashboard' },
        { title: 'My Classes', href: '/faculty/classes', iconName: 'BookOpen' },
        { title: 'Mark Attendance', href: '/faculty/attendance', iconName: 'UserCheck' },
        { title: 'Attendance Corrections', href: '/faculty/corrections', iconName: 'FileCheck' },
      ],
    },
    {
      groupName: 'Communication',
      items: [
        { title: 'Class Updates', href: '/faculty/updates', iconName: 'MessageSquare' },
        { title: 'Academic Calendar', href: '/faculty/calendar', iconName: 'Calendar' },
        { title: 'Notifications', href: '/faculty/notifications', iconName: 'Bell' },
      ],
    },
  ],

  staff: [
    {
      groupName: 'Workplace Tasks',
      items: [
        { title: 'Dashboard', href: '/staff/dashboard', iconName: 'LayoutDashboard' },
        { title: 'Assigned Complaints', href: '/staff/complaints/assigned', iconName: 'Wrench', badge: 5, badgeVariant: 'danger' },
        { title: 'Complaint Queue', href: '/staff/complaints/queue', iconName: 'ListCheck' },
        { title: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
      ],
    },
  ],

  warden: [
    {
      groupName: 'Hostel Operations',
      items: [
        { title: 'Dashboard', href: '/warden/dashboard', iconName: 'LayoutDashboard' },
        { title: 'Hostel Overview', href: '/warden/hostel', iconName: 'Building2' },
        { title: 'Residents', href: '/warden/residents', iconName: 'Users' },
        { title: 'Room Allocations', href: '/warden/rooms', iconName: 'Bed' },
      ],
    },
    {
      groupName: 'Approvals & Requests',
      items: [
        { title: 'Complaints', href: '/warden/complaints', iconName: 'Wrench', badge: 2, badgeVariant: 'warning' },
        { title: 'Gate Passes', href: '/warden/gate-passes', iconName: 'QrCode', badge: 4, badgeVariant: 'info' },
        { title: 'Mess Menu & Feedback', href: '/warden/mess', iconName: 'Utensils' },
      ],
    },
    {
      groupName: 'System',
      items: [
        { title: 'Campus Calendar', href: '/warden/calendar', iconName: 'Calendar' },
        { title: 'Notifications', href: '/warden/notifications', iconName: 'Bell' },
      ],
    },
  ],

  security: [
    {
      groupName: 'Gate Management',
      items: [
        { title: 'QR Scanner', href: '/security/scanner', iconName: 'QrCode' },
        { title: 'Gate Scan Events', href: '/security/events', iconName: 'ShieldCheck' },
        { title: 'Notifications', href: '/security/notifications', iconName: 'Bell' },
      ],
    },
  ],

  administrator: [
    {
      groupName: 'Command & Analytics',
      items: [
        { title: 'Operational Overview', href: '/admin/dashboard', iconName: 'LayoutDashboard' },
        { title: 'Campus Intelligence', href: '/admin/analytics', iconName: 'BarChart3' },
        { title: 'Demand Forecasting', href: '/admin/predictions', iconName: 'TrendingUp', badge: 'AI', badgeVariant: 'info' },
        { title: 'AI Assistant & RAG', href: '/admin/ai', iconName: 'Sparkles' },
      ],
    },
    {
      groupName: 'Operational Management',
      items: [
        { title: 'Complaints & Workload', href: '/admin/complaints', iconName: 'Wrench' },
        { title: 'Hostels & Allocations', href: '/admin/hostels', iconName: 'Building2' },
        { title: 'Facilities & Assets', href: '/admin/facilities', iconName: 'Box' },
        { title: 'Mess Operations', href: '/admin/mess', iconName: 'Utensils' },
        { title: 'Gate Passes & Logs', href: '/admin/gate-passes', iconName: 'ShieldCheck' },
      ],
    },
    {
      groupName: 'Administration & Finance',
      items: [
        { title: 'Announcements', href: '/admin/communication', iconName: 'Megaphone' },
        { title: 'Academic Calendar', href: '/admin/calendar', iconName: 'Calendar' },
        { title: 'Fees & Payments', href: '/admin/payments', iconName: 'CreditCard' },
      ],
    },
  ],
};
