import { useState, useEffect } from 'react';
import { supabase, DailyStat } from '../lib/supabase';
import { Activity, Flame, TrendingUp } from 'lucide-react';

export default function DailyStats() {
  const [todayStats, setTodayStats] = useState<DailyStat | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    steps: '',
    calories_burned: '',
  });

  useEffect(() => {
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (data) {
      setTodayStats(data);
      setFormData({
        steps: data.steps.toString(),
        calories_burned: data.calories_burned.toString(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return;

    const statsData = {
      user_id: user.id,
      date: today,
      steps: parseInt(formData.steps),
      calories_burned: parseInt(formData.calories_burned),
      updated_at: new Date().toISOString(),
    };

    if (todayStats) {
      await supabase
        .from('daily_stats')
        .update(statsData)
        .eq('id', todayStats.id);
    } else {
      await supabase.from('daily_stats').insert([statsData]);
    }

    setIsEditing(false);
    fetchTodayStats();
  };

  const handleEdit = () => {
    if (todayStats) {
      setFormData({
        steps: todayStats.steps.toString(),
        calories_burned: todayStats.calories_burned.toString(),
      });
    } else {
      setFormData({
        steps: '0',
        calories_burned: '0',
      });
    }
    setIsEditing(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Today's Stats</h2>
        </div>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          {todayStats ? 'Update' : 'Add Stats'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Steps
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories Burned
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.calories_burned}
                onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Save Stats
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : todayStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Steps</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {todayStats.steps.toLocaleString()}
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Calories Burned</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">
              {todayStats.calories_burned.toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No stats recorded for today. Click "Add Stats" to get started!
        </div>
      )}
    </div>
  );
}
