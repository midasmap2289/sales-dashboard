import { useMemo } from 'react';

/**
 * Calendar component renders a monthly grid with two inputs per day: current year revenue and last year revenue.
 * It calls onUpdate(day, value, lyValue) whenever either field loses focus.
 */
export default function Calendar({ year, month, daysData, onUpdate }) {
  // Compute number of days in month and the day of week the month starts on (Monday=0).
  const { weeks, weekTotals } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // Sunday=0
    // Convert Sunday=0 to Monday=0 index
    const offset = (firstDayOfWeek + 6) % 7;
    const weeks = [];
    const weekTotals = [];
    let currentWeek = new Array(7).fill(null);
    let day = 1;
    let idx = 0;
    // Prepend empty days for offset
    for (let i = 0; i < offset; i++) {
      currentWeek[i] = null;
      idx++;
    }
    while (day <= daysInMonth) {
      currentWeek[idx] = day;
      idx++;
      if (idx === 7) {
        weeks.push(currentWeek);
        // compute weekly total
        const total = currentWeek.reduce((sum, d) => {
          if (!d || !daysData[d] || daysData[d].value == null) return sum;
          return sum + Number(daysData[d].value);
        }, 0);
        weekTotals.push(total);
        currentWeek = new Array(7).fill(null);
        idx = 0;
      }
      day++;
    }
    // Push last week if not empty
    if (idx > 0) {
      weeks.push(currentWeek);
      const total = currentWeek.reduce((sum, d) => {
        if (!d || !daysData[d] || daysData[d].value == null) return sum;
        return sum + Number(daysData[d].value);
      }, 0);
      weekTotals.push(total);
    }
    return { weeks, weekTotals };
  }, [year, month, daysData]);

  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            {weekdayNames.map((name) => (
              <th key={name} className="p-2 border-b text-sm font-medium text-center">
                {name}
              </th>
            ))}
            <th className="p-2 border-b text-sm font-medium text-right">Wk Total</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi} className="align-top">
              {week.map((d, di) => (
                <td key={di} className="p-1 border">
                  {d ? (
                    <div className="flex flex-col items-stretch">
                      <div className="text-xs font-semibold mb-1">{d}</div>
                      {/* input for current year */}
                      <input
                        type="number"
                        className="border rounded p-1 text-xs mb-1"
                        value={daysData[d]?.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          onUpdate(d, val, daysData[d]?.ly_value ?? null);
                        }}
                        placeholder="TY"
                      />
                      {/* input for last year */}
                      <input
                        type="number"
                        className="border rounded p-1 text-xs"
                        value={daysData[d]?.ly_value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          onUpdate(d, daysData[d]?.value ?? null, val);
                        }}
                        placeholder="LY"
                      />
                      {/* arrow indicator */}
                      <div className="text-center mt-1 text-xs">
                        {(() => {
                          const { value, ly_value } = daysData[d] || {};
                          if (value == null || ly_value == null) return null;
                          if (value > ly_value) return <span className="text-green-600">▲</span>;
                          if (value < ly_value) return <span className="text-red-600">▼</span>;
                          return <span className="text-gray-500">—</span>;
                        })()}
                      </div>
                    </div>
                  ) : null}
                </td>
              ))}
              <td className="p-1 border text-right text-xs font-semibold">{weekTotals[wi] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
