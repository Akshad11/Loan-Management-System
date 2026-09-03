import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { formatINR } from '../../utils/formatters';

export interface DisbursementTrendItem {
  month: string;
  amount: number;
}

export interface CollectionTrendItem {
  month: string;
  actual: number;
  target: number;
  efficiency?: number;
}

export interface DpdBucketItem {
  bucket: string;
  count: number;
  amount: number;
  percentage?: number;
}

export const DisbursementTrendChart: React.FC<{
  data?: DisbursementTrendItem[];
  height?: number;
}> = ({ data = [], height = 260 }) => {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Disbursement Trend (Monthly Volume)
          </h4>
          <p className="text-[11px] text-slate-500">Gross disbursed principal in INR across branches</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-900">{formatINR(totalAmount)}</span>
          <span className="text-[10px] text-slate-500 block">Total Volume</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No disbursement records found
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(value: any) => [formatINR(Number(value)), 'Disbursed Amount']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxShadow: 'none',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Bar dataKey="amount" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const CollectionTrendChart: React.FC<{
  data?: CollectionTrendItem[];
  height?: number;
}> = ({ data = [], height = 260 }) => {
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Collection Performance vs Target
          </h4>
          <p className="text-[11px] text-slate-500">Expected vs Actual EMI recoveries</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-700">{formatINR(totalActual)}</span>
          <span className="text-[10px] text-slate-500 block">Total Recovered</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No collection records found
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatINR(Number(value)),
                  name === 'actual' ? 'Actual Collected' : 'Expected Target',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Expected Target"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Collected"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0f172a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const DPDDistributionChart: React.FC<{
  data?: DpdBucketItem[];
}> = ({ data = [] }) => {
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const totalExposure = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Portfolio Delinquency & DPD Buckets
          </h4>
          <p className="text-[11px] text-slate-500">Days Past Due exposure breakdown</p>
        </div>
        <span className="text-xs font-bold text-slate-900">{totalCount} Accounts Total</span>
      </div>

      <div className="space-y-2.5 pt-1">
        {data.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No active loan accounts</div>
        ) : (
          data.map((bucket) => {
            const isNpa = bucket.bucket.includes('NPA') || bucket.bucket.includes('61') || bucket.bucket.includes('90');
            const isWarning = bucket.bucket.includes('1–30') || bucket.bucket.includes('31–60') || bucket.bucket.includes('SMA');
            const pct = totalExposure > 0 ? ((bucket.amount / totalExposure) * 100).toFixed(1) : '0';

            return (
              <div key={bucket.bucket} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{bucket.bucket}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 tabular-nums">{bucket.count} loans</span>
                    <span className="font-bold text-slate-900 tabular-nums">{formatINR(bucket.amount)}</span>
                    <span className="text-slate-500 w-10 text-right font-mono text-[11px]">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isNpa ? 'bg-rose-600' : isWarning ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
