import { useEffect, useState } from 'react';
import { X, Award } from 'lucide-react';
import BadgeIcon from '../gamification/BadgeIcon';
import api from '../../services/api';

export default function BadgePicker({ onSelect, onClose }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/play/badges')
      .then((res) => {
        const earned = res.data.data.filter((b) => b.earned);
        setBadges(earned);
      })
      .catch(() => setError('Could not load your badges.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-300" />
          <span className="text-sm font-semibold text-white">Share a Badge</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 max-h-56 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-sm text-red-400 py-5">{error}</p>}
        {!loading && !error && badges.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-5">No badges earned yet!</p>
        )}
        {!loading && !error && badges.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <button
                key={badge._id}
                onClick={() => onSelect(badge._id)}
                title={badge.name}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition group"
              >
                <div className="w-12 h-12">
                  <BadgeIcon badgeKey={badge.key} earned={true} />
                </div>
                <span className="text-[10px] text-slate-500 text-center leading-tight line-clamp-2 group-hover:text-slate-700">
                  {badge.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}