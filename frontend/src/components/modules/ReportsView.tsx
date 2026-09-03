import React, { useState } from 'react';
import { PageHeader } from '../shared/PageHeader';
import { BarChart3, Download, FileSpreadsheet, Calendar, Filter, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const ReportsView: React.FC<{ onNavigate: (mod: string) => void }> = ({ onNavigate }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (reportName: string) => {
    setDownloading(reportName);
    setTimeout(() => {
      setDownloading(null);
      alert(`Report "${reportName}" exported and downloaded successfully.`);
    }, 600);
  };

  const reports = [
    {
      id: 'REP-01',
      title: 'Disbursement & Sourcing Performance (Monthly)',
      category: 'OPERATIONAL',
      description: 'Comprehensive branch-wise and product-wise disbursement totals, fees earned, and pipeline conversions.',
      format: 'XLSX / CSV',
      frequency: 'Daily & Monthly',
    },
    {
      id: 'REP-02',
      title: 'Portfolio Quality & DPD Delinquency Master',
      category: 'RISK & COLLECTIONS',
      description: 'Granular Days Past Due (DPD) ageing report (1-30, 31-60, 61-90, 90+ NPA) with borrower details and collateral valuation.',
      format: 'XLSX / PDF',
      frequency: 'Daily EOD',
    },
    {
      id: 'REP-03',
      title: 'NACH Settlement & Demand Recovery Reconciliation',
      category: 'FINANCIAL & ACCOUNTS',
      description: 'Installment billing vs actual realization, auto-debit bounce rates, and penalty fee collection register.',
      format: 'XLSX',
      frequency: 'Daily',
    },
    {
      id: 'REP-04',
      title: 'RBI Regulatory Compliance & SMA Reporting',
      category: 'STATUTORY COMPLIANCE',
      description: 'Standard Special Mention Account (SMA-0, SMA-1, SMA-2) classification data ready for central banking filing.',
      format: 'XML / XLSX',
      frequency: 'Monthly & Quarterly',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational & Regulatory Reports"
        subtitle="Generate certified portfolio summaries, statutory returns, financial statements, and performance analytics."
        breadcrumbs={[{ label: 'Reports' }, { label: 'Reports Directory', active: true }]}
        onHomeClick={() => onNavigate('dashboard')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div key={rep.id} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {rep.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">{rep.frequency}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{rep.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{rep.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Format: {rep.format}</span>
              <button
                type="button"
                onClick={() => handleDownload(rep.title)}
                disabled={downloading === rep.title}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
              >
                {downloading === rep.title ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Generate & Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
