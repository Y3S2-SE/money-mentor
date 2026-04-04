import { useEffect, useState } from 'react';
import { X, Award } from 'lucide-react';
import BadgeIcon from '../gamification/BadgeIcon';
import api from '../../services/api';

export default function BadgePicker({ onSelect, onClose }) {
  const [badges, setBadges]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/play/badges')
      .then((res) => {
        const earned = res.data.data.filter((b) => b.earned); // ← res.data.DATA
        setBadges(earned);
      })
      .catch(() => setError('Could not load your badges.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-950" />
          <span className="text-sm font-semibold text-slate-800">Share a Badge</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 max-h-64 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-950 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-400 py-6">{error}</p>
        )}

        {!loading && !error && badges.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">
            You haven't earned any badges yet!
          </p>
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
                <div className="w-14 h-14">
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