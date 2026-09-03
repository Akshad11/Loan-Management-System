import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { Landmark, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';

interface BankingIndicatorsTabProps {
  assessment: CreditAssessmentRecord;
}

export const BankingIndicatorsTab: React.FC<BankingIndicatorsTabProps> = ({
  assessment,
}) => {
  const bank = assessment.bankingIndicators;

  if (!bank) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-400">
        No bank statement analysis indicators available for this profile.
      </div>
    );
  }

  const hasHighBounces = bank.recentBounceCount > 0 || bank.inwardChequeReturnCount > 0;

  return (
    <div className="space-y-6">
      {/* Primary Account Profile */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <Landmark className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Primary Banking Operational Analysis
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Primary Operating Bank</span>
            <span className="font-semibold text-slate-900 text-sm">{bank.primaryBank}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Account Category</span>
            <span className="font-medium text-slate-800 uppercase">{bank.accountType.replace('_', ' ')}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Average Monthly Balance (AMB)</span>
            <span className="font-bold text-slate-900 text-sm">
              ₹{bank.averageMonthlyBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Salary Credit Regularity</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border text-[11px] ${
                bank.salaryCreditsStatus === 'REGULAR'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {bank.salaryCreditsStatus} (Avg: ₹{bank.salaryCreditAverage.toLocaleString('en-IN')})
            </span>
          </div>
        </div>
      </div>

      {/* Bounce & Risk Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Bounces & Dishonors */}
        <div className={`rounded-lg border p-5 shadow-sm bg-white ${hasHighBounces ? 'border-amber-300' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase">Cheque / NACH Returns</span>
            {hasHighBounces ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">ECS / NACH Bounces (Last 6m):</span>
              <span className={`font-bold ${bank.recentBounceCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {bank.recentBounceCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Inward Returns:</span>
              <span className="font-medium text-slate-800">{bank.inwardChequeReturnCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outward Returns:</span>
              <span className="font-medium text-slate-800">{bank.outwardChequeReturnCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Transaction Activity & Velocity */}
        <div className="rounded-lg border border-slate-200 p-5 shadow-sm bg-white">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase">Transaction Activity</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Credits:</span>
              <span className="font-medium text-slate-800">{bank.monthlyCreditTransactionCount} txn/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Debits:</span>
              <span className="font-medium text-slate-800">{bank.monthlyDebitTransactionCount} txn/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Balance Trend:</span>
              <span className="font-semibold text-emerald-700 uppercase">{bank.recentTransactionTrend}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Overdraft & Cash Proportion */}
        <div className="rounded-lg border border-slate-200 p-5 shadow-sm bg-white">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase">Limit & Cash Profile</span>
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Overdraft Usage:</span>
              <span className="font-semibold text-slate-800 uppercase">{bank.overdraftUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash Deposit Ratio:</span>
              <span className="font-bold text-slate-800">{bank.cashDepositPercentage}%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {bank.cashDepositPercentage > 20 ? (
                <span className="text-amber-600 font-medium">⚠️ High cash turnover requires scrutiny</span>
              ) : (
                <span className="text-emerald-600 font-medium">✓ Normal digital banking flow</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
