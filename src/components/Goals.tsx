import { useState, useEffect } from 'react';
import { supabase, Goal } from '../lib/supabase';
import { Target, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    goal_type: 'steps',
    target_value: '',
    timeframe: 'daily',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setGoals(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return;

    const goalData = {
      user_id: user.id,
      goal_type: formData.goal_type,
      target_value: parseInt(formData.target_value),
      current_value: 0,
      timeframe: formData.timeframe,
      is_active: true,
    };

    if (editingId) {
      await supabase
        .from('goals')
        .update({ ...goalData, updated_at: new Date().toISOString() })
        .eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('goals').insert([goalData]);
    }

    setFormData({ goal_type: 'steps', target_value: '', timeframe: 'daily' });
    setShowForm(false);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchGoals();
  };

  const editGoal = (goal: Goal) => {
    setFormData({
      goal_type: goal.goal_type,
      target_value: goal.target_value.toString(),
      timeframe: goal.timeframe,
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const updateProgress = async (goalId: string, currentValue: number) => {
    await supabase
      .from('goals')
      .update({ current_value: currentValue, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    fetchGoals();
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      steps: 'Steps',
      calories: 'Calories',
      workouts: 'Workouts',
    };
    return labels[type] || type;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Fitness Goals</h2>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ goal_type: 'steps', target_value: '', timeframe: 'daily' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Type
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="steps">Steps</option>
                <option value="calories">Calories</option>
                <option value="workouts">Workouts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeframe
              </label>
              <select
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              {editingId ? 'Update Goal' : 'Save Goal'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No goals set yet. Click "Add Goal" to create your first fitness goal!
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(goal.current_value, goal.target_value);
            return (
              <div
                key={goal.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {getGoalTypeLabel(goal.goal_type)} Goal
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{goal.timeframe}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editGoal(goal)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                    </span>
                    <span className="font-semibold text-amber-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Update progress..."
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const value = parseInt(input.value);
                        if (!isNaN(value)) {
                          updateProgress(goal.id, value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const value = parseInt(input.value);
                      if (!isNaN(value)) {
                        updateProgress(goal.id, value);
                        input.value = '';
                      }
                    }}
                    className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
