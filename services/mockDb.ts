
import { User, Task, LeaveRequest, AttendanceRecord, UserRole, Project, Announcement } from '../types';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_PROJECTS } from '../constants';
import { getAppState, saveAppState, supabase } from './supabase';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || (window as any).__BACKEND_URL__ || '';
// Prefer same-origin serverless API if no BACKEND_URL configured
const API_STATE_PATH = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, '')}/state` : '/api/state';

class MockDB {
  private users: User[] = [];
  private tasks: Task[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private projects: Project[] = [];
  private announcements: Announcement[] = [];

  constructor() {
    this.load();
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('ram_')) {
        this.load();
      }
    });
  }
  

  public load() {
    const get = (key: string, def: any) => {
      const item = localStorage.getItem(key);
      try {
        return item ? JSON.parse(item) : def;
      } catch (e) {
        console.error(`Error parsing ${key}`, e);
        return def;
      }
    };
      this.users = get('ram_users', INITIAL_USERS);
    
      // Try to sync from backend `/state` first (same-origin by default), else Supabase app_state (non-blocking)
      try {
        void fetch(API_STATE_PATH).then(r => r.ok ? r.json() : null).then((s) => {
            if (!s) return;
            if (s.users) localStorage.setItem('ram_users', JSON.stringify(s.users));
            if (s.tasks) localStorage.setItem('ram_tasks', JSON.stringify(s.tasks));
            if (s.leaves) localStorage.setItem('ram_leaves', JSON.stringify(s.leaves));
            if (s.attendance) localStorage.setItem('ram_attendance', JSON.stringify(s.attendance));
            if (s.projects) localStorage.setItem('ram_projects', JSON.stringify(s.projects));
            if (s.announcements) localStorage.setItem('ram_comms', JSON.stringify(s.announcements));
            this.users = JSON.parse(localStorage.getItem('ram_users') || '[]');
            this.tasks = JSON.parse(localStorage.getItem('ram_tasks') || '[]');
            this.leaves = JSON.parse(localStorage.getItem('ram_leaves') || '[]');
            this.attendance = JSON.parse(localStorage.getItem('ram_attendance') || '[]');
            this.projects = JSON.parse(localStorage.getItem('ram_projects') || '[]');
            this.announcements = JSON.parse(localStorage.getItem('ram_comms') || '[]');
            window.dispatchEvent(new Event('storage'));
          }).catch(() => {});
        } else if (supabase) {
          void getAppState().then((s) => {
            if (!s) return;
            if (s.users) localStorage.setItem('ram_users', JSON.stringify(s.users));
            if (s.tasks) localStorage.setItem('ram_tasks', JSON.stringify(s.tasks));
            if (s.leaves) localStorage.setItem('ram_leaves', JSON.stringify(s.leaves));
            if (s.attendance) localStorage.setItem('ram_attendance', JSON.stringify(s.attendance));
            if (s.projects) localStorage.setItem('ram_projects', JSON.stringify(s.projects));
            if (s.announcements) localStorage.setItem('ram_comms', JSON.stringify(s.announcements));
            this.users = JSON.parse(localStorage.getItem('ram_users') || '[]');
            this.tasks = JSON.parse(localStorage.getItem('ram_tasks') || '[]');
            this.leaves = JSON.parse(localStorage.getItem('ram_leaves') || '[]');
            this.attendance = JSON.parse(localStorage.getItem('ram_attendance') || '[]');
            this.projects = JSON.parse(localStorage.getItem('ram_projects') || '[]');
            this.announcements = JSON.parse(localStorage.getItem('ram_comms') || '[]');
            window.dispatchEvent(new Event('storage'));
          }).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    this.tasks = get('ram_tasks', INITIAL_TASKS);
    this.leaves = get('ram_leaves', []);
    this.attendance = get('ram_attendance', []);
    this.projects = get('ram_projects', INITIAL_PROJECTS);
    this.announcements = get('ram_comms', [
      {
        id: 'a1',
        title: 'Welcome to the New ERP',
        content: 'We have successfully migrated to the Raminfosys v5.3 Gateway. Please verify your identity for check-in.',
        author: 'System Admin',
        date: new Date().toISOString(),
        priority: 'NORMAL'
      }
    ]);
    
  }

  private save() {
    localStorage.setItem('ram_users', JSON.stringify(this.users));
    localStorage.setItem('ram_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('ram_leaves', JSON.stringify(this.leaves));
    localStorage.setItem('ram_attendance', JSON.stringify(this.attendance));
    localStorage.setItem('ram_projects', JSON.stringify(this.projects));
    localStorage.setItem('ram_comms', JSON.stringify(this.announcements));
    window.dispatchEvent(new Event('storage'));

    // Fire-and-forget remote sync (keep UI responsive)
    try {
      const payload = {
        users: this.users,
        tasks: this.tasks,
        leaves: this.leaves,
        attendance: this.attendance,
        projects: this.projects,
        announcements: this.announcements
      };
      // Prefer same-origin backend if available
      try {
        void fetch(API_STATE_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => { if (!r.ok) console.warn('backend /state POST failed', r.status); }).catch(e => console.warn('backend /state POST error', e));
      } catch (e) { console.warn('save() backend POST failed', e); }

      // Also attempt Supabase as fallback
      if (supabase) {
        void saveAppState(payload).catch((err) => console.warn('async saveAppState failed', err));
      }
    } catch (e) { console.warn('save() supabase sync failed', e); }
  }

  // Ensure remote app_state is persisted and return success flag
  public async syncRemote(): Promise<boolean> {
    try {
      const payload = {
        users: this.users,
        tasks: this.tasks,
        leaves: this.leaves,
        attendance: this.attendance,
        projects: this.projects,
        announcements: this.announcements
      };
      // Prefer backend POST if available
      if (BACKEND_URL) {
        try {
          const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) return true;
        } catch (e) {
          console.warn('syncRemote POST /state failed', e);
        }
      }

      if (!supabase) return false;
      return await saveAppState(payload);
    } catch (e) {
      console.warn('syncRemote failed', e);
      return false;
    }
  }

  getProjects() { this.load(); return [...this.projects]; }
  getUsers() { this.load(); return [...this.users]; }
  
  async createUser(u: Partial<User>) {
    this.load();
    const newUser: User = { 
      id: `u_${Math.random().toString(36).substr(2, 9)}`, 
      name: '', 
      email: '', 
      username: '', 
      password: '', 
      role: UserRole.EMPLOYEE, 
      department: 'General', 
      joinedDate: new Date().toISOString(), 
      isApproved: false, 
      ...u 
    };
    this.users = [...this.users, newUser]; 
    this.save(); 
    // try to persist to remote and surface failure via console
    try {
      const ok = await this.syncRemote();
      if (!ok) console.warn('createUser: remote sync failed (check Supabase permissions)');
    } catch (e) { console.warn('createUser sync error', e); }
    return newUser;
  }
  
  async updateUser(id: string, data: Partial<User>) {
    this.load();
    this.users = this.users.map(u => u.id === id ? { ...u, ...data } : u);
    this.save();
    try {
      const ok = await this.syncRemote();
      if (!ok) console.warn('updateUser: remote sync failed (check Supabase permissions)');
    } catch (e) { console.warn('updateUser sync error', e); }
  }

  getAttendance() { this.load(); return [...this.attendance]; }
  
  logAttendance(userId: string, userName: string, type: 'IN' | 'OUT', lat: number, lng: number, face: string) {
    this.load();
    
    if (type === 'IN') {
      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}`,
        userId,
        userName,
        checkIn: new Date().toISOString(),
        latIn: lat,
        longIn: lng,
        faceIn: face,
        status: 'PENDING'
      };
      this.attendance = [newRecord, ...this.attendance];
    } else {
      // Find the most recent 'IN' record for this user that doesn't have a check-out
      const recordIndex = this.attendance.findIndex(a => a.userId === userId && !a.checkOut);
      if (recordIndex !== -1) {
        const checkOutTime = new Date().toISOString();
        const checkInTime = this.attendance[recordIndex].checkIn;
        const duration = Math.floor((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / (1000 * 60));
        
        this.attendance[recordIndex] = {
          ...this.attendance[recordIndex],
          checkOut: checkOutTime,
          latOut: lat,
          longOut: lng,
          faceOut: face,
          durationMinutes: duration
        };
      } else {
        // No open check-in found, create a checkout-only record (unusual but logged)
        const orphanRecord: AttendanceRecord = {
          id: `att_out_${Date.now()}`,
          userId,
          userName,
          checkIn: 'N/A',
          checkOut: new Date().toISOString(),
          latIn: 0, longIn: 0, // Invalid
          latOut: lat,
          longOut: lng,
          faceIn: 'N/A',
          faceOut: face,
          status: 'PENDING'
        };
        this.attendance = [orphanRecord, ...this.attendance];
      }
    }
    this.save();
  }

  approveAttendance(id: string, status: 'APPROVED' | 'REJECTED') {
    this.load();
    this.attendance = this.attendance.map(a => a.id === id ? { ...a, status } : a);
    this.save();
  }

  getTasks() { this.load(); return [...this.tasks]; }
  addTask(t: Task) { this.load(); this.tasks = [...this.tasks, t]; this.save(); }
  updateTaskStatus(id: string, status: Task['status']) {
    this.load();
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, status } : t);
    this.save();
  }

  getLeaves() { this.load(); return [...this.leaves]; }
  requestLeave(l: LeaveRequest) { this.load(); this.leaves = [...this.leaves, l]; this.save(); }
  updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    this.load();
    this.leaves = this.leaves.map(l => l.id === id ? { ...l, status } : l);
    this.save();
  }

  getAnnouncements() { this.load(); return [...this.announcements]; }
  postAnnouncement(a: Announcement) { this.load(); this.announcements = [a, ...this.announcements]; this.save(); }
}

export const db = new MockDB();