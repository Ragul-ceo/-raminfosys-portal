
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, AttendanceRecord, Task, LeaveRequest, Project, Announcement } from './types';
import { db } from './services/mockDb';
import Layout from './components/Layout';
import CameraCapture from './components/CameraCapture';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'IN' | 'OUT'>('IN');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TASKS' | 'LEAVES' | 'EMPLOYEES' | 'SETTINGS'>('OVERVIEW');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [appState, setAppState] = useState({
    tasks: [] as Task[],
    attendance: [] as AttendanceRecord[],
    leaves: [] as LeaveRequest[],
    users: [] as User[],
    projects: [] as Project[],
    announcements: [] as Announcement[]
  });

  const refreshState = useCallback(() => {
    db.load();
    setAppState({
      tasks: db.getTasks(),
      attendance: db.getAttendance(),
      leaves: db.getLeaves(),
      users: db.getUsers(),
      projects: db.getProjects(),
      announcements: db.getAnnouncements()
    });
  }, []);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 5000);
    window.addEventListener('storage', refreshState);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', refreshState);
    };
  }, [refreshState]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get('username') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    setLoginError(null);
    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 600));
    
    const user = db.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) {
      setLoginError('Authorization Failed.');
      setIsLoggingIn(false);
    } else if (!user.isApproved) {
      setLoginError('Account Restricted. Contact Administrator.');
      setIsLoggingIn(false);
    } else {
      setCurrentUser(user);
      setIsLoggingIn(false);
    }
  };

  // EXCEL EXPORT ENGINE
  const exportToExcel = (data: any[], fileName: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).filter(k => !k.includes('face') && !k.includes('id')).join(',');
    const rows = data.map(obj => 
      Object.entries(obj)
        .filter(([k]) => !k.includes('face') && !k.includes('id'))
        .map(([, v]) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.addTask({
      id: `t_${Date.now()}`,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      assignedTo: fd.get('assignedTo') as string,
      assignedBy: currentUser!.id,
      projectId: 'p1',
      status: 'TODO',
      deadline: fd.get('deadline') as string
    });
    refreshState();
    setShowAddTaskModal(false);
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await db.createUser({
        name: fd.get('name') as string,
        username: fd.get('username') as string,
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        department: fd.get('department') as string,
        role: fd.get('role') as UserRole,
        isApproved: true
      });
      // refresh after remote sync attempt
      refreshState();
      setShowAddUserModal(false);
    } catch (err) {
      console.error('handleAddUser failed', err);
      alert('Failed to create user. Check console for details.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const fd = new FormData(e.currentTarget);
    try {
      await db.updateUser(editingUser.id, {
        name: fd.get('name') as string,
        username: fd.get('username') as string,
        department: fd.get('department') as string,
        role: fd.get('role') as UserRole,
        isApproved: fd.get('isApproved') === 'on'
      });
      refreshState();
      setEditingUser(null);
    } catch (err) {
      console.error('handleUpdateUser failed', err);
      alert('Failed to update user. Check console for details.');
    }
  };

  const handleRequestLeave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const fd = new FormData(e.currentTarget);
    db.requestLeave({
      id: `l_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      startDate: fd.get('startDate') as string,
      endDate: fd.get('endDate') as string,
      reason: fd.get('reason') as string,
      type: fd.get('type') as LeaveRequest['type'],
      status: 'PENDING'
    });
    refreshState();
    setShowLeaveModal(false);
  };

  const isHR = currentUser?.role === UserRole.HR;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isEmployee = currentUser?.role === UserRole.EMPLOYEE;
  const canManage = isAdmin || isHR;

  // Analysis Data
  const workforceAnalysis = useMemo(() => {
    const analysisMap: Record<string, { name: string, totalMinutes: number, count: number }> = {};
    appState.attendance.forEach(a => {
      if (a.durationMinutes) {
        if (!analysisMap[a.userId]) analysisMap[a.userId] = { name: a.userName, totalMinutes: 0, count: 0 };
        analysisMap[a.userId].totalMinutes += a.durationMinutes;
        analysisMap[a.userId].count += 1;
      }
    });
    return Object.values(analysisMap);
  }, [appState.attendance]);

  // Absence Calculation
  const totalAbsenceDays = useMemo(() => {
    return appState.leaves
      .filter(l => l.status === 'APPROVED' && (canManage ? true : l.userId === currentUser?.id))
      .reduce((acc, l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return acc + diff;
      }, 0);
  }, [appState.leaves, canManage, currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-700">
          <Logo className="h-44 mb-12 float-anim" />
          <div className="bg-white p-12 rounded-[56px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-8 text-center uppercase">System Auth</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input label="Network UID" name="username" placeholder="Username" required />
              <Input label="Access Key" name="password" type="password" placeholder="••••••••" required />
              {loginError && <div className="text-rose-600 text-[11px] font-bold text-center bg-rose-50 py-3 rounded-2xl">{loginError}</div>}
              <button disabled={isLoggingIn} className="w-full bg-[#00599f] text-white font-black py-6 rounded-[24px] uppercase tracking-widest text-[11px] transition-all hover:bg-[#004a85] shadow-xl shadow-blue-900/10">Authorize Access</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        
        {/* DASHBOARD MODULE */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-12">
            <header className="flex flex-col sm:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter font-jakarta uppercase leading-none">Status Center</h1>
                <p className="text-slate-500 font-medium text-lg mt-2">Operational briefing for Node: {currentUser.name}</p>
              </div>
              <div className="flex gap-4">
                {canManage && (
                  <button 
                    onClick={() => exportToExcel(appState.attendance, 'Attendance_Report')}
                    className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Excel Report
                  </button>
                )}
              </div>
            </header>

            {/* Attendance Pre-Auth Protocol (Check-in/Out) */}
            {isEmployee && (
              <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-jakarta">Identity Session</h3>
                    <p className="text-slate-500 text-lg font-medium">Verify your location and presence to toggle work status.</p>
                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[24px] border border-slate-100 w-fit mt-6">
                      <button onClick={() => setAttendanceType('IN')} className={`px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${attendanceType === 'IN' ? 'bg-[#00599f] text-white shadow-lg' : 'text-slate-400'}`}>In</button>
                      <button onClick={() => setAttendanceType('OUT')} className={`px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${attendanceType === 'OUT' ? 'bg-[#b11e31] text-white shadow-lg' : 'text-slate-400'}`}>Out</button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCamera(true)}
                    className={`px-20 py-10 rounded-[42px] font-black text-[14px] uppercase tracking-[0.4em] text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${attendanceType === 'IN' ? 'bg-[#00599f] shadow-blue-900/20' : 'bg-[#b11e31] shadow-red-900/20'}`}
                  >
                    Start {attendanceType} Protocol
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Total Force" value={appState.users.length} icon="users" color="blue" />
              <StatCard label="Absence Days" value={totalAbsenceDays} icon="calendar" color="rose" />
              <StatCard label="Validation Queue" value={appState.attendance.filter(a => a.status === 'PENDING').length} icon="clock" color="amber" />
              <StatCard label="Active Tasks" value={appState.tasks.filter(t => t.status !== 'COMPLETED').length} icon="check-square" color="indigo" />
            </div>

            {/* Workforce Analysis (Admin/HR Only) */}
            {canManage && (
              <div className="bg-white rounded-[56px] p-12 lg:p-16 border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10 font-jakarta">Productivity Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {workforceAnalysis.map(stat => (
                    <div key={stat.name} className="p-8 bg-slate-50 rounded-[42px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.name}</p>
                       <div className="flex items-end gap-2">
                          <h4 className="text-4xl font-black text-slate-900">{(stat.totalMinutes/60).toFixed(1)}</h4>
                          <span className="text-[12px] font-bold text-slate-400 mb-2">HRS</span>
                       </div>
                       <div className="mt-6 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (stat.totalMinutes/480)*100)}%` }}></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Logs (Shared) */}
            <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter font-jakarta">Telemetry Logs</h3>
                <button onClick={refreshState} className="p-3 text-slate-400 hover:text-blue-600 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
              </div>
              <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {appState.attendance.filter(a => canManage ? true : a.userId === currentUser.id).map(a => (
                  <div key={a.id} className="p-8 bg-slate-50/50 rounded-[48px] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col xl:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-10 w-full xl:w-auto">
                      <div className="flex -space-x-10">
                        <img src={a.faceIn} className="w-24 h-24 rounded-[36px] object-cover border-4 border-white shadow-2xl z-10 hover:scale-110 transition duration-500" />
                        {a.faceOut && <img src={a.faceOut} className="w-24 h-24 rounded-[36px] object-cover border-4 border-white shadow-2xl hover:translate-x-5 transition duration-500" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-2xl tracking-tighter mb-2">{a.userName}</p>
                        <div className="flex flex-wrap gap-4">
                          <span className="px-4 py-1.5 bg-white rounded-xl border border-slate-100 text-[10px] font-black uppercase text-emerald-600 tracking-widest">In: {new Date(a.checkIn).toLocaleTimeString()}</span>
                          {a.checkOut && <span className="px-4 py-1.5 bg-white rounded-xl border border-slate-100 text-[10px] font-black uppercase text-rose-600 tracking-widest">Out: {new Date(a.checkOut).toLocaleTimeString()}</span>}
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetry Coordinates</p>
                          <p className="text-[11px] font-mono font-bold text-slate-500">LAT: {a.latIn} | LONG: {a.longIn}</p>
                          {a.latOut && <p className="text-[11px] font-mono font-bold text-slate-500">OUT LAT: {a.latOut} | LONG: {a.longOut}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10 w-full xl:w-auto justify-between xl:justify-end">
                      {a.durationMinutes && (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Time</p>
                          <p className="text-2xl font-black text-slate-900">{Math.floor(a.durationMinutes/60)}h {a.durationMinutes%60}m</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {/* Only HR can approve/reject attendance */}
                        {isHR && a.status === 'PENDING' ? (
                          <>
                            <button onClick={() => db.approveAttendance(a.id, 'APPROVED')} className="px-8 py-4 bg-[#00599f] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Approve</button>
                            <button onClick={() => db.approveAttendance(a.id, 'REJECTED')} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Deny</button>
                          </>
                        ) : (
                          <span className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{a.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLANNER MODULE (HR/Admin can Assign, Employees can Finish) */}
        {activeTab === 'TASKS' && (
          <div className="space-y-12">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none font-jakarta">Mission Hub</h1>
                <p className="text-slate-500 font-medium text-lg mt-2">Managing the deployment of operational objectives.</p>
              </div>
              <div className="flex gap-4">
                {canManage && (
                  <>
                    <button onClick={() => exportToExcel(appState.tasks, 'Task_Report')} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all">Export Tasks</button>
                    <button onClick={() => setShowAddTaskModal(true)} className="px-10 py-5 bg-[#00599f] text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl">Assign Mission</button>
                  </>
                )}
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {appState.tasks.filter(t => canManage ? true : t.assignedTo === currentUser.id).map(t => (
                <div key={t.id} className={`p-10 rounded-[56px] border bg-white shadow-sm hover:shadow-2xl transition-all ${t.status === 'COMPLETED' ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex justify-between items-start mb-10">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{t.status}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.deadline}</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 font-jakarta leading-tight mb-4">{t.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-12 min-h-[80px]">{t.description}</p>
                  <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{appState.users.find(u => u.id === t.assignedTo)?.name.charAt(0)}</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator {appState.users.find(u => u.id === t.assignedTo)?.name.split(' ')[0]}</span>
                    </div>
                    {t.assignedTo === currentUser.id && t.status !== 'COMPLETED' && (
                      <button onClick={() => db.updateTaskStatus(t.id, 'COMPLETED')} className="text-[#00599f] font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-100 pb-1">Finalize</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABSENCE MODULE */}
        {activeTab === 'LEAVES' && (
          <div className="space-y-12">
             <header className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none font-jakarta">Absence Hub</h1>
                <p className="text-slate-500 font-medium text-lg mt-2">Managing workforce availability and outages.</p>
              </div>
              {!canManage && (
                <button onClick={() => setShowLeaveModal(true)} className="bg-[#00599f] text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl">Request Absence</button>
              )}
            </header>
            <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-slate-300 text-[11px] font-black uppercase tracking-[0.3em] border-b border-slate-50">
                      <th className="pb-10 px-4">Operator</th>
                      <th className="pb-10 px-4">Protocol</th>
                      <th className="pb-10 px-4">Interval</th>
                      <th className="pb-10 px-4">Auth</th>
                      {canManage && <th className="pb-10 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appState.leaves.filter(l => canManage ? true : l.userId === currentUser.id).map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-10 px-4">
                           <p className="font-black text-slate-900 text-[18px]">{l.userName}</p>
                           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{l.reason}</p>
                        </td>
                        <td className="py-10 px-4"><span className="text-slate-600 font-black uppercase text-[11px] tracking-widest bg-slate-100 px-5 py-2 rounded-2xl">{l.type}</span></td>
                        <td className="py-10 px-4 font-bold text-slate-500 text-sm tracking-tighter">{l.startDate} → {l.endDate}</td>
                        <td className="py-10 px-4"><span className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : l.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{l.status}</span></td>
                        {canManage && l.status === 'PENDING' && (
                          <td className="py-10 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => db.updateLeaveStatus(l.id, 'APPROVED')} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition">✓</button>
                              <button onClick={() => db.updateLeaveStatus(l.id, 'REJECTED')} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition">✕</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* PERSONNEL REGISTRY (Admin/HR Only) */}
        {activeTab === 'EMPLOYEES' && canManage && (
          <div className="bg-white rounded-[56px] p-16 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-10 mb-20">
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-jakarta">Personnel Registry</h3>
              <div className="flex gap-4">
                <button onClick={() => exportToExcel(appState.users, 'Personnel_Directory')} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">Export Registry</button>
                <button onClick={() => setShowAddUserModal(true)} className="bg-[#00599f] text-white px-12 py-5.5 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95">Onboard Personnel</button>
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="text-slate-300 text-[11px] font-black uppercase tracking-[0.3em] border-b border-slate-50">
                    <th className="pb-10 px-4">Entity Identity</th>
                    <th className="pb-10 px-4">Cluster Unit</th>
                    <th className="pb-10 px-4">Access Tier</th>
                    {isAdmin && <th className="pb-10 px-4 text-right">Operation</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appState.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition group">
                      <td className="py-12 px-4">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white border border-slate-100 text-[#00599f] rounded-[28px] flex items-center justify-center font-black text-2xl group-hover:bg-[#00599f] group-hover:text-white transition-all">{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900 text-xl tracking-tight">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1 group-hover:text-[#00599f]">@{u.username}</p>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 block ${u.isApproved ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {u.isApproved ? 'Active' : 'Locked'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-12 px-4"><span className="text-slate-600 font-black uppercase text-[12px] tracking-widest bg-slate-100 px-5 py-2.5 rounded-2xl border border-slate-200/50">{u.department}</span></td>
                      <td className="py-12 px-4"><span className="bg-blue-50 text-[#00599f] px-6 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em]">{u.role}</span></td>
                      {/* Only Admin can configure/edit users */}
                      {isAdmin && (
                        <td className="py-12 px-4 text-right">
                          <button onClick={() => setEditingUser(u)} className="text-slate-400 hover:text-[#00599f] transition font-black text-[11px] uppercase tracking-widest">Configure</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* GLOBAL MODALS */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)} title="Modify Personnel Profile">
          <form onSubmit={handleUpdateUser} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <Input label="Full Name" name="name" defaultValue={editingUser.name} required />
              <Input label="Network UID" name="username" defaultValue={editingUser.username} required />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <Input label="Operational Cluster" name="department" defaultValue={editingUser.department} required />
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Tier</label>
                <select name="role" defaultValue={editingUser.role} className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none appearance-none transition-all">
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.HR}>HR Lead</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Access Status</span>
                  <span className="text-[14px] font-black text-slate-900 mt-1">{editingUser.isApproved ? 'System Authorized' : 'Access Restricted'}</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isApproved" defaultChecked={editingUser.isApproved} className="sr-only peer" />
                  <div className="w-16 h-9 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-[#00599f]"></div>
               </label>
            </div>

            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Update Record</button>
          </form>
        </Modal>
      )}

      {showAddUserModal && (
        <Modal onClose={() => setShowAddUserModal(false)} title="Initialize Profile">
          <form onSubmit={handleAddUser} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <Input label="Full Name" name="name" placeholder="John Doe" required />
              <Input label="Network UID" name="username" placeholder="jdoe_sys" required />
            </div>
            <Input label="Access Key" name="password" type="password" placeholder="••••••••" required />
            <div className="grid grid-cols-2 gap-8">
              <Input label="Operational Cluster" name="department" placeholder="Engineering" required />
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Tier</label>
                <select name="role" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none appearance-none transition-all">
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.HR}>HR Lead</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Onboard Entity</button>
          </form>
        </Modal>
      )}

      {showAddTaskModal && (
        <Modal onClose={() => setShowAddTaskModal(false)} title="Assign Objective">
          <form onSubmit={handleAddTask} className="space-y-8">
            <Input label="Protocol Title" name="title" placeholder="Database Migration" required />
            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Objective Description</label>
              <textarea name="description" className="w-full p-6 bg-slate-50 rounded-[32px] border border-slate-100 font-medium outline-none focus:bg-white h-32 resize-none transition-all" placeholder="Detail the operation scope..."></textarea>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Personnel</label>
                <select name="assignedTo" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none appearance-none transition-all">
                  {appState.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <Input label="Deadline" name="deadline" type="date" required />
            </div>
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Deploy Objective</button>
          </form>
        </Modal>
      )}

      {showLeaveModal && (
        <Modal onClose={() => setShowLeaveModal(false)} title="Absence Transmission">
          <form onSubmit={handleRequestLeave} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <Input label="Commencement" name="startDate" type="date" required />
              <Input label="Conclusion" name="endDate" type="date" required />
            </div>
            <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Category</label>
                <select name="type" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none appearance-none">
                  <option value="VACATION">Vacation</option>
                  <option value="SICK">Medical</option>
                  <option value="CASUAL">Personal</option>
                </select>
            </div>
            <Input label="Narrative" name="reason" placeholder="Explain the outage briefly..." required />
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Transmit Protocol</button>
          </form>
        </Modal>
      )}

      {showCamera && (
        <CameraCapture 
          onCapture={(data) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                db.logAttendance(
                  currentUser!.id,
                  currentUser!.name,
                  attendanceType,
                  pos.coords.latitude,
                  pos.coords.longitude,
                  data
                );
                refreshState();
                setShowCamera(false);
                alert(`${attendanceType} telemetry processed.`);
              },
              () => { alert('GPS telemetry required.'); setShowCamera(false); }
            );
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </Layout>
  );
};

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center z-[500] p-6 animate-in fade-in zoom-in-95 duration-500">
    <div className="bg-white rounded-[64px] p-12 lg:p-16 max-w-2xl w-full shadow-4xl overflow-y-auto max-h-[90vh] border border-white relative">
      <button onClick={onClose} className="absolute top-10 right-10 w-14 h-14 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full">✕</button>
      <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter font-jakarta uppercase">{title}</h3>
      <p className="text-slate-400 font-medium mb-12 uppercase text-xs tracking-widest">Ram Infosys Gateway Procedure</p>
      {children}
    </div>
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="space-y-3">
    <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{label}</label>
    <input 
      {...props} 
      className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-800 placeholder:text-slate-300 shadow-sm" 
    />
  </div>
);

const StatCard = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => {
  const iconPaths: Record<string, string> = {
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    layers: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    'check-square': "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  };
  const colorStyles: Record<string, string> = {
    blue: 'bg-[#00599f] shadow-blue-600/30',
    indigo: 'bg-indigo-600 shadow-indigo-600/30',
    amber: 'bg-amber-500 shadow-amber-500/30',
    rose: 'bg-rose-600 shadow-rose-600/30'
  };

  return (
    <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-[0.5] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition duration-700"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div className={`${colorStyles[color]} text-white p-5 rounded-[28px] shadow-2xl`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={iconPaths[icon]}></path></svg>
          </div>
        </div>
        <h4 className="text-7xl font-black text-slate-900 tracking-tighter font-jakarta mb-3 leading-none">{value}</h4>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] leading-tight">{label}</p>
      </div>
    </div>
  );
};

export default App;
