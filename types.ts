
export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  department: string;
  joinedDate: string;
  isApproved: boolean;
  currentProjectId?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  team: string[]; // User IDs
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkIn: string; // ISO String
  checkOut?: string; // ISO String
  latIn: number;
  longIn: number;
  latOut?: number;
  longOut?: number;
  faceIn: string; // base64
  faceOut?: string; // base64
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  durationMinutes?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  projectId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  deadline: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: 'SICK' | 'VACATION' | 'CASUAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}
