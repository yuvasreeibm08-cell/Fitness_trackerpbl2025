import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartData {
  date: string;
  steps: number;
  calories: number;
  workouts: number;
}

export default function ProgressCharts() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeMetric, setActiveMetric] = useState<'steps' | 'calories' | 'workouts'>('steps');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    setIsLoading(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data: statsData } = await supabase
      .from('daily_stats')
      .select('date, steps, calories_burned')
      .gte('date', startDate)
      .order('date', { ascending: true });

    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('date')
      .gte('date', startDate);

    const workoutsByDate: { [key: string]: number } = {};
    workoutsData?.forEach((workout) => {
      workoutsByDate[workout.date] = (workoutsByDate[workout.date] || 0) + 1;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const stat = statsData?.find(s => s.date === dateStr);
      last7Days.push({
        date: dateStr,
        steps: stat?.steps || 0,
        calories: stat?.calories_burned || 0,
        workouts: workoutsByDate[dateStr] || 0,
      });
    }

    setChartData(last7Days);
    setIsLoading(false);
  };

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      steps: 'Steps',
      calories: 'Calories',
      workouts: 'Workouts',
    };
    return labels[metric];
  };

  const getMetricColor = (metric: string) => {
    const colors: { [key: string]: string } = {
      steps: 'bg-blue-600',
      calories: 'bg-orange-600',
      workouts: 'bg-green-600',
    };
    return colors[metric];
  };

  const maxValue = Math.max(...chartData.map(d => d[activeMetric])) || 1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateAverage = () => {
    const sum = chartData.reduce((acc, d) => acc + d[activeMetric], 0);
    return Math.round(sum / chartData.length);
  };

  const calculateTrend = () => {
    if (chartData.length < 2) return 0;
    const recent = chartData.slice(-3).reduce((acc, d) => acc + d[activeMetric], 0) / 3;
    const previous = chartData.slice(0, 3).reduce((acc, d) => acc + d[activeMetric], 0) / 3;
    return Math.round(((recent - previous) / previous) * 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <BarChart3 className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Progress Overview</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['steps', 'calories', 'workouts'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeMetric === metric
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getMetricLabel(metric)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading chart data...</div>
      ) : chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available yet. Start tracking your fitness activities!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">7-Day Average</p>
              <p className="text-2xl font-bold text-gray-800">
                {calculateAverage().toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <p className="text-sm text-gray-600">Trend</p>
              </div>
              <p className={`text-2xl font-bold ${
                calculateTrend() >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateTrend() >= 0 ? '+' : ''}{calculateTrend()}%
              </p>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((data, index) => {
              const value = data[activeMetric];
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center h-48">
                    <div
                      className={`w-full ${getMetricColor(activeMetric)} rounded-t-lg transition-all duration-300 hover:opacity-80 relative group`}
                      style={{ height: `${height}%`, minHeight: value > 0 ? '8px' : '0' }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-center whitespace-nowrap">
                    {formatDate(data.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
