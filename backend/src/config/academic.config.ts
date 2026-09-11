/**
 * Academic & Attendance Business Configuration
 */

export const ACADEMIC_CONFIG = {
  /**
   * Default minimum required attendance percentage.
   * If a student's calculated attendance percentage falls below this threshold,
   * `isLowAttendance` will be set to `true`.
   */
  LOW_ATTENDANCE_THRESHOLD: 75.0,
};

/**
 * Calculates attendance percentage strictly following Fretbox business rules:
 * - Present = attended
 * - Late = attended
 * - Absent = not attended
 * - Excused = not attended for percentage calculation
 *
 * Formula:
 *   attendancePercentage = ((present + late) / totalConductedSessions) * 100
 */
export const calculateAttendancePercentage = (
  presentCount: number,
  lateCount: number,
  totalConductedSessions: number,
): { percentage: number; isLowAttendance: boolean; attendedSessions: number } => {
  const attendedSessions = presentCount + lateCount;

  if (totalConductedSessions <= 0) {
    return {
      percentage: 0.0,
      isLowAttendance: false,
      attendedSessions: 0,
    };
  }

  const rawPercentage = (attendedSessions / totalConductedSessions) * 100;
  const percentage = Number(rawPercentage.toFixed(2));
  const isLowAttendance = percentage < ACADEMIC_CONFIG.LOW_ATTENDANCE_THRESHOLD;

  return {
    percentage,
    isLowAttendance,
    attendedSessions,
  };
};
