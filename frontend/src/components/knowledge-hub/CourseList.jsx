import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCourses, getCourseById, submitCourseAnswers } from '../../services/courseService';

const CourseList = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [completedPopup, setCompletedPopup] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId) => {
    setSelectedCourse(courseId);
    setResult(null);
    setAnswers({});
    try {
      const res = await getCourseById(courseId);
      setCourseDetails(res.data);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    }
  };

  const handleOptionChange = (qIndex, optIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseDetails) return;
    
    // Ensure all questions are answered
    const answersArray = courseDetails.questions.map((_, i) => answers[i] !== undefined ? answers[i] : -1);
    if (answersArray.includes(-1)) {
      alert("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCourseAnswers(selectedCourse, answersArray);
      setResult(res);
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to submit. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-on-surface/60">Loading courses...</div>;
  }

  if (selectedCourse && courseDetails) {
    return (
      <div className="bg-surface rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm border border-outline-variant/30">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="text-primary font-label text-[11px] mb-6 uppercase tracking-wider hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Courses
        </button>
        
        <h2 className="text-3xl font-headline font-bold text-on-surface mb-2">{courseDetails.title}</h2>
        <p className="text-on-surface/70 mb-6">{courseDetails.description}</p>
        
        {result ? (
          <div className={`p-6 rounded-xl border ${result.data.passed ? 'bg-primary/10 border-primary' : 'bg-red-500/10 border-red-500'}`}>
            <h3 className="text-xl font-bold mb-4 font-headline">
              {result.data.passed ? 'Passed!' : 'Not Passed'}
            </h3>
            <p className="mb-2">Score: <strong>{result.data.score}%</strong> (Required: {result.data.passingScore}%)</p>
            {result.data.passed && (
              <p className="text-primary font-bold mb-6">Points Earned: +{result.data.pointsEarned}</p>
            )}
            
            <div className="space-y-4 mt-6">
              <h4 className="font-bold border-b border-outline-variant/30 pb-2">Results Breakdown:</h4>
              {result.data.results.map((r, i) => (
                <div key={i} className={`p-4 rounded-lg bg-surface-bright border ${r.isCorrect ? 'border-primary/50' : 'border-red-500/50'}`}>
                  <p className="font-bold flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: r.isCorrect ? 'var(--color-primary)' : 'var(--color-error)' }}>
                      {r.isCorrect ? 'check_circle' : 'cancel'}
                    </span>
                    {i + 1}. {r.question}
                  </p>
                  {r.explanation && (
                    <p className="text-sm text-on-surface/70 mt-2 bg-on-surface/5 p-3 rounded">{r.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {courseDetails.questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-surface-bright p-5 rounded-xl border border-outline-variant/20">
                  <p className="font-bold mb-4 font-body text-on-surface">{qIndex + 1}. {q.question}</p>
                  <div className="space-y-3">
                    {q.options.map((opt, optIndex) => (
                      <label key={optIndex} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-outline-variant/10 transition-colors border border-transparent has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          value={optIndex}
                          checked={answers[qIndex] === optIndex}
                          onChange={() => handleOptionChange(qIndex, optIndex)}
                          className="accent-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-primary text-white py-4 rounded-xl font-label tracking-[0.1em] text-[12px] uppercase font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
          </form>
        )}
      </div>
    );
  }

  const newCourses = courses.filter((course) => !course.isCompleted);
  const completedCourses = courses.filter((course) => course.isCompleted);

  const CourseCard = ({ course, isCompleted }) => (
    <div 
      key={course._id} 
      className={`bg-surface-bright rounded-2xl border ${isCompleted ? 'border-primary/50 bg-primary/5 opacity-80' : 'border-outline-variant/30'} overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col`}
      onClick={() => isCompleted ? setCompletedPopup(course) : handleSelectCourse(course._id)}
    >
      {course.thumbnail ? (
        <div className="h-40 overflow-hidden bg-outline-variant/10 relative">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-surface text-primary rounded-full p-1.5 shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`h-40 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 ${
          course.category === 'budgeting' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10' :
          course.category === 'investing' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10' :
          course.category === 'saving' ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10' :
          course.category === 'debt' ? 'bg-gradient-to-br from-rose-500/20 to-red-500/10' :
          course.category === 'taxes' ? 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10' :
          course.category === 'crypto' ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/10' :
          'bg-gradient-to-br from-primary/20 to-secondary/10'
        }`}>
          <span className={`material-symbols-outlined text-[64px] opacity-40 transform group-hover:scale-110 transition-transform duration-500 ${
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
          <div className="absolute top-4 left-4 font-headline uppercase tracking-widest text-[10px] font-bold opacity-30 mix-blend-overlay">
            {course.category}
          </div>
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-surface/80 text-primary rounded-full p-1.5 shadow-md flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <span className="px-2 py-1 bg-outline-variant/10 text-on-surface/70 text-[10px] font-label uppercase tracking-wider rounded">
            {course.category}
          </span>
          <span className={`px-2 py-1 text-[10px] font-label uppercase tracking-wider rounded ${
            course.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
            course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {course.difficulty}
          </span>
        </div>
        
        <h3 className="text-lg font-bold font-headline mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-on-surface/60 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
        
        <div className="flex justify-between items-center text-sm font-medium border-t border-outline-variant/20 pt-4 mt-auto">
          <span className="flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            {course.totalPoints} pts
          </span>
          <span className="text-on-surface/50 text-[12px] uppercase font-label tracking-wider flex items-center gap-1">
            {isCompleted ? <span className="material-symbols-outlined text-[14px] text-green-600">done_all</span> : null}
            {course.questions?.length || 0} Questions
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Finance Courses</h1>
          <p className="text-on-surface/60 text-sm mt-1">Enhance your financial knowledge, pass quizzes, and earn XP points.</p>
        </div>
      </div>
      
      {courses.length === 0 ? (
        <div className="p-10 text-center bg-surface-bright rounded-2xl border border-outline-variant/30 text-on-surface/50">
          No courses available right now. Check back later!
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active / New Courses Section */}
          <div>
            <h2 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              Available Courses
            </h2>
            {newCourses.length === 0 ? (
              <div className="p-8 text-center bg-surface-bright rounded-2xl border border-dashed border-outline-variant/50 text-on-surface/50">
                You've completed all available courses! Check back soon for new content.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newCourses.map(course => <CourseCard key={course._id} course={course} isCompleted={false} />)}
              </div>
            )}
          </div>

          {/* Completed Courses Section */}
          {completedCourses.length > 0 && (
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">task_alt</span>
                Completed Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCourses.map(course => <CourseCard key={course._id} course={course} isCompleted={true} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Course Popup Modal */}
      {completedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative">
            <button 
              onClick={() => setCompletedPopup(null)}
              className="absolute top-4 right-4 text-on-surface/50 hover:text-on-surface bg-outline-variant/10 hover:bg-outline-variant/30 rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                <span className="material-symbols-outlined text-3xl">emoji_events</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Course Completed!</h2>
              <p className="text-on-surface/70 text-sm line-clamp-2">{completedPopup.title}</p>
            </div>
            
            <div className="space-y-4 bg-surface-bright p-5 rounded-xl border border-outline-variant/20 mb-6">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <span className="text-on-surface/60 text-sm font-label uppercase tracking-wider">Score</span>
                <span className="font-bold text-lg text-primary">{completedPopup.userScore}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <span className="text-on-surface/60 text-sm font-label uppercase tracking-wider">Points Earned</span>
                <span className="font-bold text-lg text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">stars</span>
                  {completedPopup.userPointsEarned || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface/60 text-sm font-label uppercase tracking-wider">Completed On</span>
                <span className="font-bold text-sm text-on-surface">
                  {completedPopup.completedAt ? new Date(completedPopup.completedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setCompletedPopup(null)}
              className="w-full bg-primary text-white py-3 rounded-xl font-label tracking-widest text-xs uppercase font-bold hover:bg-primary/90 transition-all shadow-md"
            >
              Awesome
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
