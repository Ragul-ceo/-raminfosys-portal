
import { User, UserRole, Task, Project } from './types';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Cloud Migration', client: 'Global Tech', status: 'ACTIVE', team: ['3'] },
  { id: 'p2', name: 'ERP Security', client: 'Raminfosys Internal', status: 'ACTIVE', team: ['3', '4'] }
];

export const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Admin Director', 
    email: 'admin@raminfosys.com', 
    username: '', 
    password: '', 
    role: UserRole.ADMIN, 
    department: 'Management', 
    joinedDate: '2023-01-01',
    isApproved: true
  },
  { 
    id: '2', 
    name: 'Sarah HR', 
    email: 'hr@raminfosys.com', 
    username: 'hr_lead', 
    password: 'password123', 
    role: UserRole.HR, 
    department: 'Human Resources', 
    joinedDate: '2023-02-15',
    isApproved: true
  },
  { 
    id: '3', 
    name: 'John Doe', 
    email: 'john@raminfosys.com', 
    username: 'john_dev', 
    password: 'password123', 
    role: UserRole.EMPLOYEE, 
    department: 'Engineering', 
    joinedDate: '2023-06-10',
    isApproved: true,
    currentProjectId: 'p1'
  },
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Database Indexing', description: 'Optimize SQL queries', assignedTo: '3', assignedBy: '2', projectId: 'p1', status: 'IN_PROGRESS', deadline: '2025-01-15' },
];