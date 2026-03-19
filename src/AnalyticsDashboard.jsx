import React, { useMemo, useState } from 'react';
import {
  Filter,
  Target,
  TrendingUp,
  AlertCircle,
  Activity,
  Calendar,
  Zap,
  Timer,
  Percent,
  DollarSign,
  Users,
  Award,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  PieChart,
  Sparkles
} from 'lucide-react';

// --- HELPER: Normalize date ---
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d+$/.test(dateStr))) {
    const num = Number(dateStr);
    if (num > 20000 && num < 60000) {
      return new Date(Math.round((num - 25569) * 86400 * 1000));
    }
  }
  if (typeof dateStr === 'string') {
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [_, y, m, d] = isoMatch.map(Number);
      return new Date(y, m - 1, d);
    }
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      const [_, m, d, y] = usMatch.map(Number);
      return new Date(y, m - 1, d);
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

// --- 0. KPI Cards ---
// Uses aggregatedData (one row per rep, already summed) for accurate counts
const AnalyticsKPICards = ({ aggregatedData, roleConfig }) => {
  const totals = useMemo(() => {
    const cash = aggregatedData.reduce((acc, curr) => acc + (curr.cashCollected || 0), 0);
    const revenue = aggregatedData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const closes = aggregatedData.reduce((acc, curr) => acc + (curr.closes || 0), 0);
    const liveCalls = aggregatedData.reduce((acc, curr) => acc + (curr.liveCalls || 0), 0);
    const sets = aggregatedData.reduce((acc, curr) => acc + (curr.sets || 0), 0);
    const dials = aggregatedData.reduce((acc, curr) => acc + (curr.dials || 0), 0);
    const dmsSent = aggregatedData.reduce((acc, curr) => acc + (curr.dmsSent || 0), 0);
    const replies = aggregatedData.reduce((acc, curr) => acc + (curr.replies || 0), 0);
    // Each row in aggregatedData IS a distinct rep — just count rows with activity
    const reps = aggregatedData.filter(d => (d.dials || 0) > 0 || (d.connections || 0) > 0 || (d.sets || 0) > 0 || (d.dmsSent || 0) > 0 || (d.liveCalls || 0) > 0).length;
    return { cash, revenue, closes, liveCalls, sets, dials, dmsSent, replies, reps };
  }, [aggregatedData]);

  const fields = roleConfig?.fields || {};
  const isCloser = 'closes' in fields && !('dials' in fields);
  const isDM = 'dmsSent' in fields;

  const collectionRate = totals.revenue > 0 ? ((totals.cash / totals.revenue) * 100).toFixed(1) : null;
  const cashPerClose = totals.closes > 0 ? (totals.cash / totals.closes).toFixed(0) : null;
  const closeRate = totals.liveCalls > 0 ? ((totals.closes / totals.liveCalls) * 100).toFixed(1) : null;
  const showRate = totals.sets > 0 ? ((totals.liveCalls / totals.sets) * 100).toFixed(1) : null;
  const replyRate = totals.dmsSent > 0 ? ((totals.replies / totals.dmsSent) * 100).toFixed(1) : null;
  const cashPerSet = totals.sets > 0 ? (totals.cash / totals.sets).toFixed(0) : null;

  const cards = useMemo(() => {
    const base = [
      { label: 'Collection Rate', value: collectionRate != null ? `${collectionRate}%` : '—', sub: 'Cash vs Rev', icon: Percent },
      { label: 'Active Reps', value: String(totals.reps), sub: 'In period', icon: Users },
    ];
    if (isCloser) {
      return [
        base[0],
        { label: 'Cash / Close', value: cashPerClose != null ? `$${Number(cashPerClose).toLocaleString()}` : '—', sub: 'Avg Value', icon: DollarSign },
        { label: 'Close Rate', value: closeRate != null ? `${closeRate}%` : '—', sub: 'Closes / Calls', icon: Award },
        base[1],
      ];
    }
    return [
      base[0],
      { label: isDM ? 'Reply Rate' : 'Show Rate', value: isDM ? (replyRate ? `${replyRate}%` : '—') : (showRate ? `${showRate}%` : '—'), sub: isDM ? 'Replies / DMs' : 'Shows / Sets', icon: Award },
      { label: 'Cash / Set', value: cashPerSet != null ? `$${Number(cashPerSet).toLocaleString()}` : '—', sub: 'Rev per Book', icon: DollarSign },
      base[1],
    ];
  }, [aggregatedData, roleConfig, totals]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white border border-[#E4E7EC] rounded-lg p-5 flex flex-col justify-between hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{card.label}</p>
                <p className="text-[22px] font-semibold text-[#111827] tabular-nums">{card.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className="p-2 rounded-md bg-gray-50 border border-[#E4E7EC] text-gray-400">
                <Icon size={16} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 1. Funnel Health Chart ---
const FunnelChart = ({ data, roleConfig }) => {
  const funnelStages = roleConfig?.funnel || [];

  if (funnelStages.length === 0) {
    return (
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 flex items-center justify-center text-gray-400 h-64">
        <p className="text-sm">No funnel stages defined for this role.</p>
      </div>
    );
  }

  const funnelData = funnelStages.map((stage) => {
    const total = data.reduce((acc, curr) => acc + (curr[stage.key] || 0), 0);
    return { ...stage, value: total };
  });

  const maxValue = Math.max(...funnelData.map((d) => d.value), 1);
  const topValue = funnelData[0]?.value || 0;
  const bottomValue = funnelData[funnelData.length - 1]?.value || 0;
  const overallConversion = topValue > 0 ? ((bottomValue / topValue) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[#111827] mb-6 flex items-center gap-2">
            <Filter size={15} className="text-gray-400" strokeWidth={1.5} /> Funnel Health
        </h3>
        <div className="space-y-5">
            {funnelData.map((stage, idx) => {
            const prevValue = idx > 0 ? funnelData[idx - 1].value : stage.value;
            const conversion = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '0.0';
            const percentOfMax = (stage.value / maxValue) * 100;
            const retention = topValue > 0 ? ((stage.value / topValue) * 100).toFixed(1) : '0.0';

            return (
                <div key={stage.key} className="group">
                    <div className="flex items-end justify-between text-xs text-gray-500 mb-1.5 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {stage.label}
                        </span>
                        <span className="text-[#111827] font-medium tabular-nums text-sm">{stage.value.toLocaleString()}</span>
                    </div>
                    
                    <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                        className="h-full rounded-full transition-all duration-700 ease-out bg-[#111827]"
                        style={{ width: `${Math.max(percentOfMax, 1)}%`, opacity: 1 - (idx * 0.15) }}
                        />
                    </div>

                    {idx > 0 && (
                        <div className="flex items-center justify-end gap-3 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-400">
                                {retention}% retention
                            </span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-[#E4E7EC]">
                                {conversion}% conv
                            </span>
                        </div>
                    )}
                </div>
            );
            })}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-[#E4E7EC] flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Overall Efficiency</span>
          <span className="text-sm font-semibold text-[#111827] bg-gray-50 px-2.5 py-1 rounded-md border border-[#E4E7EC]">
              {overallConversion}%
          </span>
      </div>
    </div>
  );
};

// --- 2. Revenue Forecast ---
const RevenueForecast = ({ data, dateRange, monthlyGoal }) => {
  const totalCash = data.reduce((acc, curr) => acc + (curr.cashCollected || 0), 0);
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projection = dayOfMonth > 0 ? (totalCash / dayOfMonth) * daysInMonth : totalCash;
  const progress = (dayOfMonth / daysInMonth) * 100;
  const goalNum = monthlyGoal != null && monthlyGoal !== '' ? Number(String(monthlyGoal).replace(/[^0-9.-]/g, '')) : null;
  const useGoal = goalNum != null && !isNaN(goalNum) && goalNum > 0;
  const target = useGoal ? goalNum : projection;
  const revenueProgress = target > 0 ? Math.min((totalCash / target) * 100, 100) : 0;

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#111827] mb-5 flex items-center gap-2">
        <TrendingUp size={15} className="text-gray-400" strokeWidth={1.5} /> Revenue Forecast
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 rounded-md p-3.5 border border-[#E4E7EC]">
          <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wider mb-1">Current</p>
          <p className="text-xl font-semibold text-[#111827] tabular-nums">${totalCash.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3.5 border border-[#E4E7EC]">
          <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wider mb-1">
            {useGoal ? 'Monthly Goal' : 'Projected EOM'}
          </p>
          <p className="text-xl font-semibold text-green-600 tabular-nums">${Math.round(target).toLocaleString()}</p>
        </div>
      </div>
      <div className="relative pt-1">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 tabular-nums">
          <span>Day 1</span>
          <span>Day {dayOfMonth}</span>
          <span>Day {daysInMonth}</span>
        </div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 w-px bg-gray-300 z-20" style={{ left: `${progress}%` }} title="Today" />
          <div className="h-full bg-gray-700 rounded-full relative z-10 transition-all duration-700" style={{ width: `${revenueProgress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {useGoal ? (
            <><strong className="text-[#111827]">{revenueProgress.toFixed(0)}%</strong> to goal. {totalCash >= target ? ' Goal reached!' : ` $${(target - totalCash).toLocaleString()} to go.`}</>
          ) : (
            <>You are {Math.round(progress)}% through the month.</>
          )}
        </p>
      </div>
    </div>
  );
};

// --- 3. Trend Velocity Lines ---
const toRepKey = (item) => (item.displayName || (item.name && String(item.name).trim()) || 'Unknown').trim();
const toDisplayName = (s) => (s && s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())) || s;

const TrendVelocityChart = ({ data, roleConfig }) => {
  const [metric, setMetric] = useState('cash');
  const fields = roleConfig?.fields || {};
  const volumeKey = 'dials' in fields ? 'dials' : 'dmsSent' in fields ? 'dmsSent' : 'liveCalls';
  const volumeLabel = fields[volumeKey]?.label || 'Volume';

  const getMetricValue = useMemo(() => (item) => {
      if (metric === 'cash') return item.cashCollected || 0;
      if (metric === 'volume') return Number(item[volumeKey]) || 0;
      if (metric === 'rate') {
        if ('sets' in item && item.sets > 0) return ((item.liveCalls||0)/item.sets)*100;
        return 0;
      }
      return 0;
  }, [metric, volumeKey]);

  const { groupedData, sortedDates, topPerformers, teamAverageByDate, maxVal } = useMemo(() => {
    const groups = {};
    data.forEach((item) => {
      if (!item.date) return;
      const parsed = normalizeDate(item.date);
      if (!parsed) return;
      const d = parsed.toISOString().split('T')[0];
      const repKey = toRepKey(item);
      if (!groups[d]) groups[d] = {};
      const v = getMetricValue(item);
      groups[d][repKey] = (groups[d][repKey] || 0) + v;
    });
    const sorted = Object.keys(groups).sort();
    const totals = {};
    data.forEach((item) => { totals[toRepKey(item)] = (totals[toRepKey(item)] || 0) + getMetricValue(item); });
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
    const teamAvg = {};
    sorted.forEach((date) => {
      const vals = Object.values(groups[date] || {});
      teamAvg[date] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    });
    const allVals = Object.values(groups).flatMap((day) => Object.values(day));
    const max = Math.max(...allVals, ...Object.values(teamAvg), 1);
    return { groupedData: groups, sortedDates: sorted, topPerformers: top, teamAverageByDate: teamAvg, maxVal: max };
  }, [data, getMetricValue]);

  if (sortedDates.length < 2) return <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 lg:col-span-2 flex items-center justify-center text-gray-400 min-h-[200px]"><p className="text-sm">Not enough date range for trend chart.</p></div>;

  // Chart dimensions in SVG units
  const W = 1000;
  const H = 400;
  const padL = 0;
  const padR = 0;
  const padT = 10;
  const padB = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (i) => padL + (i / Math.max(sortedDates.length - 1, 1)) * plotW;
  const toY = (val) => padT + plotH - (maxVal > 0 ? (val / maxVal) * plotH : 0);

  // Build smooth path using monotone cubic interpolation
  const buildSmoothPath = (points) => {
    if (points.length < 2) return '';
    if (points.length === 2) return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
    
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const buildAreaPath = (points) => {
    const linePath = buildSmoothPath(points);
    if (!linePath) return '';
    return `${linePath}L${points[points.length-1].x},${padT + plotH}L${points[0].x},${padT + plotH}Z`;
  };

  const colors = ['#111827', '#6b7280', '#d1d5db'];
  const fillOpacities = [0.06, 0.04, 0.03];
  const avgColor = '#9ca3af';
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const formatVal = (v) => metric === 'cash' ? `$${Math.round(v).toLocaleString()}` : Math.round(v).toLocaleString();
  const formatDate = (d) => { const parts = d.split('-'); return `${parseInt(parts[1])}/${parseInt(parts[2])}`; };

  // Pick ~6 evenly spaced date labels
  const maxLabels = Math.min(sortedDates.length, 7);
  const labelStep = Math.max(1, Math.floor((sortedDates.length - 1) / (maxLabels - 1)));
  const labelIndices = [];
  for (let i = 0; i < sortedDates.length; i += labelStep) labelIndices.push(i);
  if (labelIndices[labelIndices.length - 1] !== sortedDates.length - 1) labelIndices.push(sortedDates.length - 1);

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2"><Activity size={15} className="text-gray-400" strokeWidth={1.5} /> Trend Velocity</h3>
        <div className="flex items-center bg-gray-50 rounded-md p-0.5 border border-[#E4E7EC]">
          {[{ key: 'cash', label: 'Cash' }, { key: 'volume', label: volumeLabel }, { key: 'rate', label: 'Rate %' }].map((m) => (
            <button key={m.key} type="button" onClick={() => setMetric(m.key)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${metric === m.key ? 'bg-white text-[#111827] shadow-sm border border-[#E4E7EC]' : 'text-gray-400 hover:text-gray-600'}`}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[10px] text-gray-400 tabular-nums pr-3 w-16 text-right shrink-0" style={{ height: 280 }}>
          {gridLines.slice().reverse().map((pct, i) => (
            <span key={i}>{formatVal(maxVal * pct)}</span>
          ))}
        </div>

        {/* SVG chart */}
        <div className="flex-1" style={{ height: 280 }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            {/* Gridlines */}
            {gridLines.map((pct, i) => (
              <line key={i} x1={padL} x2={W - padR} y1={toY(maxVal * pct)} y2={toY(maxVal * pct)} stroke="#f3f4f6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}

            {/* Area fills */}
            {topPerformers.map((name, idx) => {
              const points = sortedDates.map((date, i) => ({ x: toX(i), y: toY(groupedData[date][name] || 0) }));
              return <path key={`area-${name}`} d={buildAreaPath(points)} fill={colors[idx]} opacity={fillOpacities[idx]} />;
            })}

            {/* Smooth lines */}
            {topPerformers.map((name, idx) => {
              const points = sortedDates.map((date, i) => ({ x: toX(i), y: toY(groupedData[date][name] || 0) }));
              return (
                <g key={name}>
                  <path d={buildSmoothPath(points)} fill="none" stroke={colors[idx]} strokeWidth={idx === 0 ? 2 : 1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill={colors[idx]} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <title>{toDisplayName(name)}: {formatVal(groupedData[sortedDates[i]][name] || 0)} ({formatDate(sortedDates[i])})</title>
                    </circle>
                  ))}
                </g>
              );
            })}

            {/* Team average dashed line */}
            <path
              d={buildSmoothPath(sortedDates.map((date, i) => ({ x: toX(i), y: toY(teamAverageByDate[date] || 0) })))}
              fill="none" stroke={avgColor} strokeWidth="1" strokeDasharray="6,4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* X-axis date labels */}
      <div className="flex ml-16" style={{ paddingRight: 0 }}>
        <div className="flex-1 flex justify-between text-[10px] text-gray-400 tabular-nums mt-1">
          {labelIndices.map((i) => (
            <span key={i}>{formatDate(sortedDates[i])}</span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 mt-4 justify-end border-t border-[#E4E7EC] pt-3">
          {topPerformers.map((name, idx) => (
            <div key={name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
              {toDisplayName(name)}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <div className="w-4 h-0.5 border-t border-dashed border-gray-400" />Team Avg
          </div>
      </div>
    </div>
  );
};

// --- 4. Efficiency Matrix ---
// Uses aggregatedData (one row per rep) so each rep gets exactly one dot
const EfficiencyMatrix = ({ aggregatedData, roleConfig }) => {
  const volumeKey = Object.keys(roleConfig?.fields || {})[0] || 'dials';
  const revenueKey = 'cashCollected';
  const volumeLabel = roleConfig?.fields?.[volumeKey]?.label || 'Volume';
  const maxVol = Math.max(...aggregatedData.map((d) => d[volumeKey] || 0), 10);
  const maxRev = Math.max(...aggregatedData.map((d) => d[revenueKey] || 0), 1000);

  const avgVol = aggregatedData.length > 0 ? aggregatedData.reduce((a,b) => a + (b[volumeKey]||0), 0) / aggregatedData.length : maxVol/2;
  const avgRev = aggregatedData.length > 0 ? aggregatedData.reduce((a,b) => a + (b[revenueKey]||0), 0) / aggregatedData.length : maxRev/2;

  const avgX = (avgVol / maxVol) * 100;
  const avgY = (avgRev / maxRev) * 100;

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2"><Target size={15} className="text-gray-400" strokeWidth={1.5} /> Efficiency Matrix</h3>
        <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-[#111827]" />Rep</span>
      </div>
      <p className="text-xs text-gray-400 mb-5">Compare <strong className="text-gray-500">{volumeLabel}</strong> (x) vs. <strong className="text-gray-500">Revenue</strong> (y)</p>
      <div className="flex-1 flex gap-2">
        {/* Y-axis labels in flow */}
        <div className="flex flex-col justify-between text-[10px] font-medium text-gray-400 tabular-nums py-1 w-16 text-right shrink-0">
            <span>${maxRev.toLocaleString()}</span>
            <span>${Math.round(maxRev/2).toLocaleString()}</span>
            <span>$0</span>
        </div>
        <div className="flex-1 relative border-l border-b border-[#E4E7EC] min-h-[320px]">
        <div className="absolute inset-0">
          <div className="absolute left-0 right-0 h-px border-t border-dashed border-gray-200 z-0" style={{ bottom: `${Math.min(Math.max(avgY, 10), 90)}%` }} />
          <div className="absolute top-0 bottom-0 w-px border-r border-dashed border-gray-200 z-0" style={{ left: `${Math.min(Math.max(avgX, 10), 90)}%` }} />
          
          <div className="absolute top-2 right-2 text-[10px] font-medium text-green-500/60 uppercase">Stars</div>
          <div className="absolute top-2 left-2 text-[10px] font-medium text-gray-400/60 uppercase">Snipers</div>
          <div className="absolute bottom-2 right-2 text-[10px] font-medium text-gray-400/60 uppercase">Grinders</div>
          <div className="absolute bottom-2 left-2 text-[10px] font-medium text-red-400/60 uppercase">Concern</div>
        </div>

        {aggregatedData.map((setter, idx) => {
          const vol = setter[volumeKey] || 0;
          const rev = setter[revenueKey] || 0;
          const x = Math.min(Math.max((vol / maxVol) * 100, 2), 98);
          const y = Math.min(Math.max((rev / maxRev) * 100, 2), 98);
          return (
            <div key={setter.displayName || idx} className="absolute w-3 h-3 -ml-1.5 -mb-1.5 rounded-full bg-[#111827] border-2 border-white hover:scale-[2] hover:z-50 transition-transform cursor-pointer group" style={{ left: `${x}%`, bottom: `${y}%` }}>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg flex flex-col gap-0.5">
                <span className="font-medium">{setter.displayName}</span>
                <span className="text-[10px] text-gray-400">{volumeLabel}: {vol.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400">Cash: ${rev.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
      
      {/* X-axis labels in layout flow */}
      <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 tabular-nums mt-1 ml-[4.5rem]">
          <span>0</span>
          <span className="uppercase tracking-wider">{volumeLabel}</span>
          <span>{maxVol.toLocaleString()}</span>
      </div>
    </div>
  );
};

// --- 5. Day of Week Analysis ---
const DayOfWeekAnalysis = ({ data }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = useMemo(() => {
    const stats = new Array(7).fill(0);
    data.forEach((item) => { if (!item.date) return; const d = normalizeDate(item.date); if (d) stats[d.getDay()] += item.cashCollected || 0; });
    return stats;
  }, [data]);
  const maxVal = Math.max(...dayStats, 1);
  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#111827] mb-5 flex items-center gap-2"><Calendar size={15} className="text-gray-400" strokeWidth={1.5} /> Day of Week</h3>
      <div className="flex items-end justify-between h-28 gap-2">
        {dayStats.map((val, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="w-full h-20 flex flex-col justify-end">
              <div className="w-full rounded-sm relative group-hover:bg-gray-300 transition-colors bg-gray-200" style={{ height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`, minHeight: val > 0 ? 4 : 0 }}>
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">${val.toLocaleString()}</div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-400">{days[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 6. Golden Ratio Cards ---
// Uses aggregatedData for accurate per-rep efficiency ratios
const GoldenRatioCards = ({ aggregatedData, roleConfig }) => {
  const totalCash = aggregatedData.reduce((acc, curr) => acc + (curr.cashCollected || 0), 0);
  const totalHours = aggregatedData.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const totalCloses = aggregatedData.reduce((acc, curr) => acc + (curr.closes || 0), 0);
  
  const fields = roleConfig?.fields || {};
  const hasDials = 'dials' in fields;
  const volumeKey = hasDials ? 'dials' : ('liveCalls' in fields ? 'liveCalls' : 'callsOnCalendar');
  const totalVolume = aggregatedData.reduce((acc, curr) => acc + (curr[volumeKey] || 0), 0);
  const volumeLabel = hasDials ? 'Cash Per Dial' : 'Cash Per Call';
  
  const efficiencyValue = totalVolume > 0 ? (totalCash / totalVolume).toFixed(2) : '0.00';
  const valuePerHour = totalHours > 0 ? (totalCash / totalHours).toFixed(2) : '0.00';
  const avgDealSize = totalCloses > 0 ? (totalCash / totalCloses).toFixed(0) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: volumeLabel, value: `$${efficiencyValue}`, icon: Zap },
        { label: 'Value Per Hour', value: `$${valuePerHour}`, icon: Timer },
        { label: 'Avg Deal Size', value: `$${Number(avgDealSize).toLocaleString()}`, icon: DollarSign },
      ].map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white border border-[#E4E7EC] rounded-lg p-4 flex items-center justify-between hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{card.label}</p><h3 className="text-lg font-semibold text-[#111827] tabular-nums">{card.value}</h3></div>
            <div className="p-2 bg-gray-50 rounded-md border border-[#E4E7EC] text-gray-400"><Icon size={16} strokeWidth={1.5} /></div>
          </div>
        );
      })}
    </div>
  );
};

// --- 7. AI Insights ---
const AIInsights = ({ data, aggregatedData, roleConfig, monthlyGoal }) => {
  const insights = useMemo(() => {
    const results = [];
    if (!data || data.length === 0) return results;

    const fields = roleConfig?.fields || {};
    const totalCash = aggregatedData.reduce((a, c) => a + (c.cashCollected || 0), 0);
    const totalRevenue = aggregatedData.reduce((a, c) => a + (c.revenue || 0), 0);
    const totalSets = aggregatedData.reduce((a, c) => a + (c.sets || 0), 0);
    const totalLiveCalls = aggregatedData.reduce((a, c) => a + (c.liveCalls || 0), 0);
    const totalCloses = aggregatedData.reduce((a, c) => a + (c.closes || 0), 0);
    const volumeKey = 'dials' in fields ? 'dials' : 'dmsSent' in fields ? 'dmsSent' : 'liveCalls';
    const totalVolume = aggregatedData.reduce((a, c) => a + (c[volumeKey] || 0), 0);
    const volumeLabel = fields[volumeKey]?.label || 'Volume';
    const isCloser = 'closes' in fields && !('dials' in fields) && !('dmsSent' in fields);

    // 1. Pace / Goal insight
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const goalNum = monthlyGoal != null && monthlyGoal !== '' ? Number(String(monthlyGoal).replace(/[^0-9.-]/g, '')) : null;

    if (goalNum && goalNum > 0) {
      const pct = ((totalCash / goalNum) * 100).toFixed(0);
      const timePct = ((dayOfMonth / daysInMonth) * 100).toFixed(0);
      const gap = goalNum - totalCash;
      const dailyNeeded = daysLeft > 0 ? gap / daysLeft : 0;
      const currentPace = dayOfMonth > 0 ? totalCash / dayOfMonth : 0;

      if (totalCash >= goalNum) {
        results.push({ type: 'success', icon: '🎯', title: 'Goal Reached!', body: `You've hit $${goalNum.toLocaleString()} with ${daysLeft} days to spare. Current total: $${totalCash.toLocaleString()}.` });
      } else if (Number(pct) >= Number(timePct)) {
        results.push({ type: 'positive', icon: '📈', title: 'On Pace for Goal', body: `${pct}% to goal with ${timePct}% of the month elapsed. Keep this pace and you'll exceed the target.` });
      } else {
        results.push({ type: 'warning', icon: '⚡', title: 'Pace Alert', body: `${pct}% to goal but ${timePct}% through the month. Need $${Math.round(dailyNeeded).toLocaleString()}/day to close the gap (current pace: $${Math.round(currentPace).toLocaleString()}/day).` });
      }
    } else if (totalCash > 0) {
      const dailyAvg = dayOfMonth > 0 ? totalCash / dayOfMonth : 0;
      const projected = dailyAvg * daysInMonth;
      results.push({ type: 'info', icon: '📊', title: 'Revenue Projection', body: `On pace for $${Math.round(projected).toLocaleString()} this month based on $${Math.round(dailyAvg).toLocaleString()}/day average.` });
    }

    // 2. Top performer insight
    if (aggregatedData.length >= 2) {
      const sorted = [...aggregatedData].sort((a, b) => (b.cashCollected || 0) - (a.cashCollected || 0));
      const top = sorted[0];
      const second = sorted[1];
      const lead = (top.cashCollected || 0) - (second.cashCollected || 0);
      if (top.cashCollected > 0) {
        results.push({ type: 'positive', icon: '🏆', title: 'Top Performer', body: `${top.displayName} leads with $${(top.cashCollected || 0).toLocaleString()} cash collected — $${lead.toLocaleString()} ahead of ${second.displayName}.` });
      }
    }

    // 3. Funnel bottleneck insight
    if (!isCloser && totalVolume > 0 && totalSets > 0 && totalLiveCalls >= 0) {
      const setRate = totalSets / totalVolume;
      const showRate = totalSets > 0 ? totalLiveCalls / totalSets : 0;
      const closeRate = totalLiveCalls > 0 ? totalCloses / totalLiveCalls : 0;

      const bottlenecks = [
        { label: `${volumeLabel} → Sets`, rate: setRate, stage: 'booking' },
        { label: 'Sets → Shows', rate: showRate, stage: 'show-up' },
        { label: 'Shows → Closes', rate: closeRate, stage: 'closing' },
      ].filter(b => b.rate < 1);

      const worst = bottlenecks.reduce((min, b) => b.rate < min.rate ? b : min, bottlenecks[0]);
      if (worst && worst.rate < 0.5) {
        results.push({ type: 'warning', icon: '🔍', title: 'Funnel Bottleneck', body: `${worst.label} conversion is ${(worst.rate * 100).toFixed(1)}% — this is your biggest drop-off. Focus coaching on ${worst.stage} skills.` });
      }
    }

    // 4. Day-of-week pattern
    const dayStats = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);
    data.forEach(item => {
      if (!item.date) return;
      const d = normalizeDate(item.date);
      if (d) {
        dayStats[d.getDay()] += item.cashCollected || 0;
        dayCounts[d.getDay()] += 1;
      }
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAvgs = dayStats.map((val, i) => dayCounts[i] > 0 ? val / dayCounts[i] : 0);
    const bestDayIdx = dayAvgs.indexOf(Math.max(...dayAvgs));
    const worstDayIdx = dayAvgs.filter((_, i) => dayCounts[i] > 0).length > 0
      ? dayAvgs.indexOf(Math.min(...dayAvgs.filter((v, i) => dayCounts[i] > 0)))
      : -1;

    if (dayAvgs[bestDayIdx] > 0 && worstDayIdx >= 0 && bestDayIdx !== worstDayIdx) {
      results.push({ type: 'info', icon: '📅', title: 'Best Day Pattern', body: `${dayNames[bestDayIdx]} averages $${Math.round(dayAvgs[bestDayIdx]).toLocaleString()} in cash — ${((dayAvgs[bestDayIdx] / (dayAvgs[worstDayIdx] || 1)) * 100 - 100).toFixed(0)}% more than ${dayNames[worstDayIdx]}.` });
    }

    // 5. Collection rate insight
    if (totalRevenue > 0 && totalCash > 0) {
      const collectionRate = (totalCash / totalRevenue) * 100;
      if (collectionRate < 40) {
        results.push({ type: 'warning', icon: '💰', title: 'Low Collection Rate', body: `Only ${collectionRate.toFixed(1)}% of revenue is collected upfront. Consider tightening payment terms or offering PIF incentives.` });
      } else if (collectionRate > 70) {
        results.push({ type: 'positive', icon: '💰', title: 'Strong Collections', body: `${collectionRate.toFixed(1)}% collection rate — cash flow is healthy with strong upfront payments.` });
      }
    }

    // 6. Rep consistency insight
    if (aggregatedData.length >= 3) {
      const cashValues = aggregatedData.map(r => r.cashCollected || 0).filter(v => v > 0);
      if (cashValues.length >= 3) {
        const avg = cashValues.reduce((a, b) => a + b, 0) / cashValues.length;
        const variance = cashValues.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / cashValues.length;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? (stdDev / avg) : 0;
        if (cv > 1) {
          results.push({ type: 'warning', icon: '📉', title: 'Uneven Performance', body: `Rep output varies significantly (${(cv * 100).toFixed(0)}% coefficient of variation). Top earners carry the team — focus on lifting underperformers.` });
        } else if (cv < 0.3 && aggregatedData.length >= 3) {
          results.push({ type: 'positive', icon: '⚖️', title: 'Balanced Team', body: `Performance across reps is well-balanced (${(cv * 100).toFixed(0)}% variation). The floor is strong.` });
        }
      }
    }

    return results.slice(0, 4); // Show max 4 insights
  }, [data, aggregatedData, roleConfig, monthlyGoal]);

  if (insights.length === 0) {
    return (
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 h-full min-h-[200px]">
        <Sparkles size={20} className="mb-2 text-gray-300" />
        <p className="text-sm">Insights will appear with more data.</p>
      </div>
    );
  }

  const typeStyles = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', body: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    positive: { bg: 'bg-green-50/50', border: 'border-green-200/60', title: 'text-green-700', body: 'text-green-600', iconBg: 'bg-green-100/80' },
    warning: { bg: 'bg-amber-50/50', border: 'border-amber-200/60', title: 'text-amber-700', body: 'text-amber-600', iconBg: 'bg-amber-100/80' },
    info: { bg: 'bg-gray-50', border: 'border-[#E4E7EC]', title: 'text-[#111827]', body: 'text-gray-500', iconBg: 'bg-gray-100' },
  };

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-6 flex flex-col">
      <h3 className="text-sm font-semibold text-[#111827] mb-4 flex items-center gap-2">
        <Sparkles size={15} className="text-gray-400" strokeWidth={1.5} /> AI Insights
      </h3>
      <div className="space-y-2.5 flex-1">
        {insights.map((insight, idx) => {
          const style = typeStyles[insight.type] || typeStyles.info;
          return (
            <div key={idx} className={`${style.bg} border ${style.border} rounded-lg px-3.5 py-2.5 transition-all hover:shadow-sm`}>
              <div className="flex items-start gap-2.5">
                <span className={`text-base leading-none mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center ${style.iconBg}`}>
                  {insight.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${style.title} mb-0.5`}>{insight.title}</p>
                  <p className={`text-[11px] leading-relaxed ${style.body}`}>{insight.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN EXPORT ---
export default function AnalyticsDashboard({ data, aggregatedData, roleConfig, dateRange, monthlyGoal }) {
  const safeData = Array.isArray(data) ? data : [];
  const safeAggregated = Array.isArray(aggregatedData) ? aggregatedData : [];
  if (safeData.length === 0 && safeAggregated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-lg border border-[#E4E7EC]">
        <AlertCircle size={24} className="mb-2 text-gray-300" strokeWidth={1.5} />
        <p className="text-sm">No data available for analytics.</p>
        <p className="text-xs text-gray-300 mt-1">Try selecting a different date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Per-rep aggregated data for KPIs, efficiency, and ratios */}
      <AnalyticsKPICards aggregatedData={safeAggregated} roleConfig={roleConfig} />
      
      <GoldenRatioCards aggregatedData={safeAggregated} roleConfig={roleConfig} />

      {/* Raw daily data for time-series and funnel analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelChart data={safeData} roleConfig={roleConfig} />
        <div className="flex flex-col gap-4">
          <RevenueForecast data={safeData} dateRange={dateRange} monthlyGoal={monthlyGoal} />
          <AIInsights data={safeData} aggregatedData={safeAggregated} roleConfig={roleConfig} monthlyGoal={monthlyGoal} />
        </div>
      </div>

      <DayOfWeekAnalysis data={safeData} />
      
      <TrendVelocityChart data={safeData} roleConfig={roleConfig} />
      
      {/* Per-rep aggregated data for scatter plot — one dot per rep */}
      <div className="grid grid-cols-1">
        <EfficiencyMatrix aggregatedData={safeAggregated} roleConfig={roleConfig} />
      </div>
    </div>
  );
}