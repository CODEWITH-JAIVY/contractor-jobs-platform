export type Role = 'USER' | 'CONTRACTOR' | 'ADMIN';
export type JobStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'APPLIED' | 'ACCEPTED' | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ABSENT';

export type AuthResponse = { token: string; userId: number; role: Role; newUser: boolean };
export type GoogleAuthResponse = {
  token: string | null; userId: number | null; role: Role | null; newUser: boolean;
  needsPhone: boolean; email: string | null; name: string | null;
};

export type Job = {
  id: number; contractorId: number; contractorName: string; title: string; description?: string | null;
  location: string; salary?: number | null; workersNeeded?: number | null; status: JobStatus; createdAt: string;
};

export type ContractorInfo = {
  userId: number; name: string; city?: string | null; companyName: string; workType?: string | null;
  experienceYears?: number | null; about?: string | null; verified: boolean; followers: number;
};

export type Applicant = {
  applicationId: number; userId: number; name: string; phone: string; city?: string | null;
  status: ApplicationStatus; appliedAt: string; skills?: string | null; experienceYears?: number | null; about?: string | null;
};

export type MyApplication = { id: number; jobId: number; jobTitle: string; location: string; status: ApplicationStatus; createdAt: string };
export type NotificationItem = { id: number; jobId?: number | null; title: string; body?: string | null; read: boolean; createdAt: string };
export type WorkerProfile = { skills?: string | null; experienceYears?: number | null; about?: string | null };

export type AttendanceEntry = {
  date: string; status: AttendanceStatus; overtimeHours: number; note?: string | null;
  dailyWage?: number | null; overtimeRate?: number | null;
};
export type AttendanceSettings = { dailyWage: number | null; overtimeRate: number | null };
export type AttendanceSummary = {
  month: string; presentDays: number; halfDays: number; absentDays: number; workedDays: number; overtimeHours: number;
  daysAmount: number; overtimeAmount: number; totalAmount: number; receivedThisMonth: number; balance: number;
};
export type Payment = { id: number; date: string; amount: number; note?: string | null };

export type AdminContractor = {
  userId: number; name: string; phone: string; city?: string | null; companyName: string;
  workType?: string | null; experienceYears?: number | null; verified: boolean;
};
