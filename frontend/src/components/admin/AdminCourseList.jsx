import React, { useState, useEffect } from 'react';
import { getCourses, updateCourse, deleteCourse } from '../../services/courseService';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';
import useConfirm from '../../hooks/useConfirm';
import ConfirmWindow from '../ui/ConfirmWindow';

const AdminCourseList = ({ onAddCourse, onEditCourse }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { confirm, modalProps } = useConfirm();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleTogglePublish = async (course) => {
    const confirmed = await confirm({
      title: course.isPublished ? 'Unpublish Course?' : 'Publish Course?',
      description: course.isPublished
        ? 'Users will no longer see this course.'
        : 'This course will be visible to all users.',
      confirmLabel: course.isPublished ? 'Unpublish' : 'Publish',
      variant: course.isPublished ? 'warning' : 'success',
      icon: course.isPublished ? 'visibility_off' : 'visibility',
    });
    if (!confirmed) return;

    try {
      await updateCourse(course._id, { isPublished: !course.isPublished });
      setCourses(courses.map(c =>
        c._id === course._id ? { ...c, isPublished: !c.isPublished } : c
      ));
      dispatch(addToast({
        type: 'success',
        message: course.isPublished ? 'Course unpublished' : 'Course published!',
        subMessage: course.title,
      }));
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to update course',
        subMessage: 'Please try again.',
      }));
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: 'Delete Course?',
      description: `"${title}" will be permanently removed including all its content.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      variant: 'danger',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c._id !== id));
      dispatch(addToast({
        type: 'success',
        message: 'Course deleted',
        subMessage: 'The course has been removed.',
      }));
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to delete course',
        subMessage: 'Please try again.',
      }));
    }
  };

  if (loading) return <div className="p-8 text-on-surface/60">Loading courses...</div>;

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Manage Courses</h2>
          <p className="text-on-surface/60 text-sm mt-1">Create, edit, publish, and delete finance courses.</p>
        </div>
        <button 
          onClick={onAddCourse}
          className="px-6 py-3 bg-primary text-white rounded-xl font-label tracking-widest text-[11px] uppercase font-bold hover:bg-primary/90 flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="p-10 text-center bg-surface-bright rounded-2xl border border-outline-variant/30 text-on-surface/50">
          No courses found. Start by adding one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="bg-surface-bright rounded-2xl border border-outline-variant/30 overflow-hidden flex flex-col relative group">
              {/* Draft/Published Badge */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={() => handleTogglePublish(course)}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-label tracking-wider font-bold shadow-sm backdrop-blur-md transition-colors ${
                    course.isPublished ? 'bg-primary/90 text-white' : 'bg-outline-variant/80 text-on-surface hover:bg-outline-variant'
                  }`}
                  title={course.isPublished ? "Click to unpublish" : "Click to publish"}
                >
                  {course.isPublished ? 'Published' : 'Draft'}
                </button>
              </div>

              {course.thumbnail ? (
                <div className="h-32 overflow-hidden bg-outline-variant/10">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ) : (
                <div className={`h-32 flex items-center justify-center relative overflow-hidden transition-transform duration-500 ${
                  course.category === 'budgeting' ? 'bg-linear-to-br from-blue-500/20 to-indigo-500/10' :
                  course.category === 'investing' ? 'bg-linear-to-br from-emerald-500/20 to-teal-500/10' :
                  course.category === 'saving' ? 'bg-linear-to-br from-amber-500/20 to-orange-500/10' :
                  course.category === 'debt' ? 'bg-linear-to-br from-rose-500/20 to-red-500/10' :
                  course.category === 'taxes' ? 'bg-linear-to-br from-purple-500/20 to-fuchsia-500/10' :
                  course.category === 'crypto' ? 'bg-linear-to-br from-violet-500/20 to-purple-500/10' :
                  'bg-linear-to-br from-primary/20 to-secondary/10'
                }`}>
                  <span className={`material-symbols-outlined text-[48px] opacity-40 group-hover:scale-110 transition-transform duration-500 ${
                     course.category === 'budgeting' ? 'text-blue-500' :
                     course.category === 'investing' ? 'text-emerald-500' :
                     course.category === 'saving' ? 'text-amber-500' :
                     course.category === 'debt' ? 'text-rose-500' :
                     course.category === 'taxes' ? 'text-purple-500' :
                     course.category === 'crypto' ? 'text-violet-500' :
                     'text-primary'
                  }`}>
                    {course.category === 'budgeting' ? 'account_balance_wallet' :
                     course.category === 'investing' ? 'trending_up' :
                     course.category === 'saving' ? 'savings' :
                     course.category === 'debt' ? 'money_off' :
                     course.category === 'taxes' ? 'request_quote' :
                     course.category === 'crypto' ? 'currency_bitcoin' :
                     'school'}
                  </span>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] text-primary font-bold font-label uppercase tracking-widest mb-1">{course.category}</span>
                <h3 className="text-lg font-bold font-headline mb-2 line-clamp-2">{course.title}</h3>
                
                <div className="flex justify-between items-center text-xs text-on-surface/60 mb-4 mt-auto pt-4 border-t border-outline-variant/20">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                    {course.questions?.length} Qs
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">stars</span>
                    {course.totalPoints} pts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => onEditCourse(course)}
                    className="py-2.5 bg-outline-variant/10 text-on-surface rounded-lg font-label text-[10px] uppercase tracking-wider font-bold hover:bg-outline-variant/20 transition-colors flex justify-center items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(course._id, course.title)}
                    className="py-2.5 bg-red-500/10 text-red-500 rounded-lg font-label text-[10px] uppercase tracking-wider font-bold hover:bg-red-500/20 transition-colors flex justify-center items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <ConfirmWindow {...modalProps} />
    </>
  );
};

export default AdminCourseList;
