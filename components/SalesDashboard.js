import { useState, useEffect, useMemo } from 'react';
import Calendar from './Calendar';
import { supabase } from '../lib/supabase';

// Default per-day target used when average sales are below this number
const DEFAULT_DAILY_TARGET = 1000;

export default function SalesDashboard({ session, onSignOut }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-based
  const [daysData, setDaysData] = useState({});
  const [loading, setLoading] = useState(true);
  const userId = session.user.id;

  // Load data for the current month from supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .order('day', { ascending: true });
      if (error) {
        console.error('Error loading data', error);
      } else {
        const map = {};
        data.forEach((row) => {
          map[row.day] = {
            value: row.value ?? null,
            ly_value: row.ly_value ?? null,
          };
        });
        setDaysData(map);
      }
      setLoading(false);
    }
    loadData();
  }, [userId, currentYear, currentMonth]);

  // Handle updating a day (both value and ly_value)
  async function handleUpdate(day, value, lyValue) {
    setDaysData((prev) => ({
      ...prev,
      [day]: { value, ly_value: lyValue },
    }));
    // Persist to Supabase
    const { error } = await supabase.from('sales_daily').upsert(
      {
        user_id: userId,
        year: currentYear,
        month: currentMonth,
        day: day,
        value: value,
        ly_value: lyValue,
      },
      {
        onConflict: ['user_id', 'year', 'month', 'day'],
      }
    );
    if (error) {
      console.error('Error saving data', error);
    }
  }

  // Compute metrics: MTD actual, completed days count, average, projection, last year MTD and vs last year
  const metrics = useMemo(() => {
    let sum = 0;
    let completed = 0;
    let lySum = 0;
    for (const d in daysData) {
      const { value, ly_value } = daysData[d];
      if (value != null) {
        sum += Number(value);
        completed++;
      }
      if (ly_value != null) {
        lySum += Number(ly_value);
      }
    }
    const average = completed > 0 ? sum / completed : 0;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const projected = sum + (daysInMonth - completed) * Math.max(average, DEFAULT_DAILY_TARGET);
    return {
      sum,
      completed,
      average,
      projected,
      lySum,
      vsLy: sum - lySum,
      vsLyPercent: lySum > 0 ? ((sum - lySum) / lySum) * 100 : null,
    };
  }, [daysData, currentYear, currentMonth]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sales Dashboard</h1>
        <button onClick={onSignOut} className="text-sm text-blue-600 underline">
          Sign out
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-medium text-gray-700 mb-2">MTD Actual</h2>
          <div className="text-3xl font-bold">
            {metrics.sum.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">{metrics.completed} days recorded</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-medium text-gray-700 mb-2">Projected Total</h2>
          <div className="text-3xl font-bold">
            {metrics.projected.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-500">
            Uses average per recorded day or default of ${DEFAULT_DAILY_TARGET} if higher
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-medium text-gray-700 mb-2">Last Year (MTD)</h2>
          <div className="text-3xl font-bold">
            {metrics.lySum.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-medium text-gray-700 mb-2">Vs Last Year (MTD)</h2>
          <div className="text-3xl font-bold">
            {metrics.vsLy.toLocaleString()} {metrics.vsLy > 0 ? '▲' : metrics.vsLy < 0 ? '▼' : ''}
          </div>
          {metrics.vsLyPercent != null && (
            <div className="text-sm text-gray-500">
              {metrics.vsLyPercent > 0 ? '+' : ''}
              {metrics.vsLyPercent.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <Calendar
          year={currentYear}
          month={currentMonth}
          daysData={daysData}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}