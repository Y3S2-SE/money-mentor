import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCourses, getCourseById, submitCourseAnswers } from '../../services/courseService';
import Lottie from 'lottie-react';
import { toast } from 'react-hot-toast';

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
  const [lotties, setLotties] = useState({});

  useEffect(() => {
    fetchCourses();
    loadLotties();
  }, []);

  const loadLotties = async () => {
    const medal = (await import('../../assets/lottie/medal.json')).default;
    const coins = (await import('../../assets/lottie/coins_drop.json')).default;
    setLotties({ medal, coins });
  };

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (error) {
      toast.error('Failed to fetch courses');
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
      toast.error('Failed to fetch course details');
    }
  };

  const handleOptionChange = (qIndex, optIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseDetails) return;

    const answersArray = courseDetails.questions.map((_, i) => answers[i] !== undefined ? answers[i] : -1);
    if (answersArray.includes(-1)) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCourseAnswers(selectedCourse, answersArray);
      setResult(res);
      if (res.data.passed) {
        toast.success(`Course passed! +${res.data.pointsEarned} XP`, { icon: '🎉' });
      } else {
        toast.error('Keep trying! You need a passing score.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-on-surface/40 text-sm font-medium">Loading courses...</p>
      </div>
    );
  }

  if (selectedCourse && courseDetails) {
    return (
      <div className="bg-white rounded-3xl p-6 md:p-10 max-w-4xl mx-auto shadow-sm border border-outline-variant/10 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-2 text-on-surface/50 hover:text-primary transition-colors text-[11px] font-bold uppercase tracking-widest mb-8 group"
        >
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          Back to Courses
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-widest rounded-lg border border-primary/20">
              {courseDetails.category}
            </span>
            <span className="px-3 py-1 bg-surface-container-high text-on-surface/60 text-[10px] uppercase font-bold tracking-widest rounded-lg border border-outline-variant/20 capitalize">
              {courseDetails.difficulty}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-3 tracking-tight">{courseDetails.title}</h2>
          <p className="text-on-surface-variant text-base max-w-2xl leading-relaxed">{courseDetails.description}</p>
        </div>

        {result ? (
          <div className={`p-8 rounded-[32px] border ${result.data.passed ? 'bg-primary-fixed-dim/5 border-primary/20' : 'bg-red-50 border-red-100'}`}>
            <div className="flex flex-col items-center text-center mb-10">
              {result.data.passed ? (
                <div className="w-24 h-24 mb-4">
                  {lotties.medal && <Lottie animationData={lotties.medal} loop={false} />}
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl">error</span>
                </div>
              )}
              <h3 className="text-2xl font-bold font-headline text-on-surface">
                {result.data.passed ? 'Mastery Achieved!' : 'Not Quite There Yet'}
              </h3>
              <div className="mt-4 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40">Score</p>
                  <p className={`text-2xl font-bold ${result.data.passed ? 'text-primary' : 'text-red-500'}`}>{result.data.score}%</p>
                </div>
                <div className="h-8 w-px bg-outline-variant/20" />
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40">Reward</p>
                  <p className="text-2xl font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[24px]">stars</span>
                    +{result.data.passed ? result.data.pointsEarned : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface/40 px-2">Results Breakdown</h4>
              {result.data.results.map((r, i) => (
                <div key={i} className={`p-5 rounded-2xl bg-white border ${r.isCorrect ? 'border-primary/20' : 'border-red-100'} shadow-sm`}>
                  <div className="flex gap-4">
                    <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold ${r.isCorrect ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm leading-snug">{r.question}</p>
                      {r.explanation && (
                        <div className="mt-3 p-3 bg-surface-bright rounded-xl border border-outline-variant/10 flex gap-3">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
                          <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{r.explanation}</p>
                        </div>
                      )}
                    </div>
                    <span className={`material-symbols-outlined ${r.isCorrect ? 'text-primary' : 'text-red-500'}`}>
                      {r.isCorrect ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedCourse(null)}
              className="w-full mt-10 bg-primary text-white py-4 rounded-2xl font-bold tracking-widest text-xs uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Continue Exploring
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {courseDetails.questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-surface-bright p-6 md:p-8 rounded-[32px] border border-outline-variant/10 shadow-sm hover:border-primary/20 transition-colors">
                  <p className="font-bold mb-6 font-body text-on-surface text-lg leading-snug">
                    <span className="text-primary mr-2">0{qIndex + 1}.</span> {q.question}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <label key={optIndex} className="relative flex items-center group cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          value={optIndex}
                          checked={answers[qIndex] === optIndex}
                          onChange={() => handleOptionChange(qIndex, optIndex)}
                          className="peer sr-only"
                        />
                        <div className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-white group-hover:border-primary/30 peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-outline-variant/30 peer-checked:border-primary flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
                          </div>
                          <span className="text-sm font-bold text-on-surface-variant peer-checked:text-on-surface">{opt}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold tracking-widest text-xs uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              )}
              {submitting ? 'Submitting Answers...' : 'Complete Quiz'}
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
      className={`group relative bg-white rounded-[32px] border ${isCompleted ? 'border-primary/10' : 'border-outline-variant/10'} overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col h-full`}
      onClick={() => isCompleted ? setCompletedPopup(course) : handleSelectCourse(course._id)}
    >
      {course.thumbnail && (
        <div className="h-44 overflow-hidden relative bg-surface-container-low shrink-0">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />

          {/* Verification / Badge Overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-2.5 py-1 bg-white/70 backdrop-blur-md text-[9px] font-bold uppercase tracking-widest rounded-lg border border-white/20 shadow-sm">
              {course.category}
            </span>
          </div>

          {isCompleted && (
            <div className="absolute top-4 right-4 w-10 h-10 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
              <span className="material-symbols-outlined text-[20px] font-bold">verified</span>
            </div>
          )}
        </div>
      )}

      {/* Absolute badge right top if no thumbnail */}
      {!course.thumbnail && isCompleted && (
        <div className="absolute top-6 right-6 w-8 h-8 bg-primary-fixed text-on-primary-fixed rounded-xl flex items-center justify-center shadow-sm animate-in zoom-in duration-300 z-10 border border-primary-fixed-dim">
          <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
        </div>
      )}

      <div className={`p-6 flex flex-col flex-1 ${!course.thumbnail ? 'pt-8 relative' : ''}`}>
        <div className="flex items-center gap-2 mb-3 pr-10">
          {!course.thumbnail && (
            <span className="px-2.5 py-0.5 bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-widest rounded-lg border border-outline-variant/20 shadow-sm text-[9px]">
              {course.category}
            </span>
          )}
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-full border ${course.difficulty === 'beginner' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            course.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              'bg-red-50 text-red-600 border-red-100'
            }`}>
            {course.difficulty}
          </span>
        </div>

        <h3 className="text-xl font-bold font-headline text-on-surface mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-on-surface-variant text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>

        <div className="flex justify-between items-center text-sm font-medium border-t border-outline-variant/10 pt-5 mt-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">stars</span>
              <span className="font-bold tracking-tighter">{course.totalPoints} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-on-surface/30 text-[10px] uppercase font-bold tracking-widest">
            <span className="material-symbols-outlined text-[14px]">quiz</span>
            {course.questions?.length || 0} Questions
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-1000">
      {courses.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[32px] border border-outline-variant/10 text-on-surface/30">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">inventory_2</span>
          </div>
          <h4 className="font-bold text-on-surface/60">No courses available right now</h4>
          <p className="text-sm">Check back later for new learning materials!</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Active / New Courses Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                </div>
                Available Courses
              </h2>
              {newCourses.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/30 bg-surface-container px-3 py-1 rounded-full">
                  {newCourses.length} Learning Path{newCourses.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {newCourses.length === 0 ? (
              <div className="p-10 text-center bg-surface-container-low rounded-[32px] border border-dashed border-primary/20 text-on-surface/40 flex flex-col items-center">
                <div className="w-54 h-54 mb-2">
                  {lotties.coins && <Lottie animationData={lotties.coins} loop={true} />}
                </div>
                <h4 className="font-bold text-primary">Full Content Mastery!</h4>
                <p className="text-sm max-w-xs mx-auto mt-2">You've completed every course available. Stay tuned for advanced modules coming soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {newCourses.map(course => <CourseCard key={course._id} course={course} isCompleted={false} />)}
              </div>
            )}
          </section>

          {/* Completed Courses Section */}
          {completedCourses.length > 0 && (
            <section className="opacity-80 hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-headline font-bold text-on-surface/60 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  </div>
                  Completed Archive
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {completedCourses.map(course => <CourseCard key={course._id} course={course} isCompleted={true} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Completed Course Popup Modal */}
      {completedPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-outline-variant/10 p-10 rounded-[40px] shadow-2xl max-w-sm w-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl transition-colors group-hover:bg-primary/10" />

            <button
              onClick={() => setCompletedPopup(null)}
              className="absolute top-6 right-6 text-on-surface/30 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-4">
                {lotties.medal && <Lottie animationData={lotties.medal} loop={true} />}
              </div>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-2 tracking-tight">Level Up!</h2>
              <p className="text-on-surface-variant text-sm font-medium">{completedPopup.title}</p>
            </div>

            <div className="space-y-4 bg-surface-bright p-6 rounded-3xl border border-outline-variant/10 mb-8 shadow-inner">
              <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                <span className="text-on-surface/40 text-[10px] font-bold uppercase tracking-widest">Final Grade</span>
                <span className="font-bold text-xl text-primary">{completedPopup.userScore}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                <span className="text-on-surface/40 text-[10px] font-bold uppercase tracking-widest">Experience</span>
                <span className="font-bold text-xl text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[20px]">stars</span>
                  {completedPopup.userPointsEarned || 0} XP
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface/40 text-[10px] font-bold uppercase tracking-widest">Mastery Date</span>
                <span className="font-bold text-sm text-on-surface">
                  {completedPopup.completedAt ? new Date(completedPopup.completedAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCompletedPopup(null)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold tracking-widest text-xs uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Collect Rewards
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
