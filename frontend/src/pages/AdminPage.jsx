import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCourseList from '../components/admin/AdminCourseList';
import AdminCourseForm from '../components/admin/AdminCourseForm';
import { getCourseById } from '../services/courseService';
import AdminUserList from '../components/admin/AdminUserList';
import { addToast } from '../store/slices/toastSlice';
import { useDispatch } from 'react-redux';

const AdminPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('courses');
  const [showProfile, setShowProfile] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Courses state
  const [courseView, setCourseView] = useState('list'); // 'list', 'create', 'edit'
  const [editingCourse, setEditingCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const handleAddCourse = () => {
    setEditingCourse(null);
    setCourseView('create');
  };

  const handleEditCourse = async (course) => {
    setLoadingCourse(true);
    try {
      const res = await getCourseById(course._id);
      setEditingCourse(res.data);
      setCourseView('edit');
    } catch (error) {
      dispatch(addToast({                            
        type: 'error',
        message: 'Failed to load course',
        subMessage: 'Please try again.',
      }));
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleBackToList = (result) => {
    if (result === 'saved') {
      dispatch(addToast({
        type: 'success',
        message: courseView === 'edit' ? 'Course updated!' : 'Course created!',
        subMessage: editingCourse?.title || 'Changes have been saved.',
      }));
    }
    setEditingCourse(null);
    setCourseView('list');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage')); // trigger auth state update if app listens for it
    navigate('/auth', { replace: true });
  };

  return (
    <div className="flex flex-col h-screen bg-surface-bright font-body text-on-surface">
      {/* Top Navbar specific to Admin */}
      <div className="h-[72px] bg-white border-b border-outline-variant/20 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg leading-tight">Admin Portal</h1>
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface/50">MoneyMentor</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => { setActiveTab('courses'); setCourseView('list'); }}
            className={`font-label uppercase tracking-widest text-[11px] font-bold transition-all relative py-6 ${
              activeTab === 'courses' ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
            }`}
          >
            Manage Courses
            {activeTab === 'courses' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`font-label uppercase tracking-widest text-[11px] font-bold transition-all relative py-6 ${
              activeTab === 'users' ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
            }`}
          >
            Manage Users
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full bg-outline-variant/10 text-on-surface flex items-center justify-center hover:bg-outline-variant/20 transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-colors text-[11px] font-bold uppercase tracking-wider font-label"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:block">Logout</span>
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute top-14 right-20 w-72 bg-white rounded-2xl border border-outline-variant/20 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
               <h3 className="font-headline font-bold text-lg text-on-surface border-b border-outline-variant/20 pb-3 mb-4">Admin Profile</h3>
               <div className="space-y-4">
                  <div>
                    <span className="text-on-surface/50 text-[10px] uppercase font-label tracking-widest block mb-1">Username</span>
                    <span className="font-bold text-sm text-on-surface">{user.username || 'Admin User'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface/50 text-[10px] uppercase font-label tracking-widest block mb-1">Email</span>
                    <span className="font-medium text-sm text-on-surface/80">{user.email || 'admin@moneymentor.com'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface/50 text-[10px] uppercase font-label tracking-widest block mb-1">Role</span>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider rounded-lg border border-primary/20">
                      {user.role || 'Admin'}
                    </span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 w-full max-w-[1600px] mx-auto">
        {/* Mobile quick tabs since absolute centering hides on very small screens */}
        <div className="flex md:hidden gap-4 border-b border-outline-variant/30 mb-6">
          <button
            onClick={() => { setActiveTab('courses'); setCourseView('list'); }}
            className={`pb-3 font-label uppercase tracking-widest text-[10px] font-bold ${
              activeTab === 'courses' ? 'text-primary border-b-2 border-primary' : 'text-on-surface/50'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 font-label uppercase tracking-widest text-[10px] font-bold ${
              activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-on-surface/50'
            }`}
          >
            Users
          </button>
        </div>

        {activeTab === 'courses' && (
          <>
            {courseView === 'list' && (
              <AdminCourseList 
                onAddCourse={handleAddCourse} 
                onEditCourse={handleEditCourse} 
              />
            )}

            {loadingCourse && (
              <div className="flex items-center justify-center py-20 text-on-surface/50">
                <span className="material-symbols-outlined animate-spin mr-2">progress activity</span>
                Loading course...
              </div>
            )}

            {(courseView === 'create' || courseView === 'edit') && (
              <AdminCourseForm 
                initialData={editingCourse} 
                onBack={handleBackToList} 
              />
            )}
          </>
        )}

        {activeTab === 'users' && (
          <AdminUserList />
        )}
      </div>
    </div>
  );
};

export default AdminPage;