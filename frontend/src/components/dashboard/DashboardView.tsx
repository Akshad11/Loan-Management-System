import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import { PageHeader } from '../shared/PageHeader';
import { KPIBlock } from '../shared/KPIBlock';
import { WorkQueue } from './WorkQueue';
import {
  DisbursementTrendChart,
  CollectionTrendChart,
  DPDDistributionChart,
} from './DashboardCharts';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { CurrencyDisplay } from '../shared/CurrencyDisplay';
import { ErrorState } from '../shared/ErrorState';
import { KPISkeleton, TableSkeleton, ChartSkeleton } from '../shared/LoadingSkeleton';
import { formatDate, formatDateTime, formatINR } from '../../utils/formatters';
import { dashboardApi } from '../../services/apiClient';
import {
  RotateCcw,
  FileText,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  History,
  Check,
  Building,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (module: string, entityId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'applications' | 'loans'>('applications');

  const [statsData, setStatsData] = useState<{
    metrics: any;
    disbursementTrend: any[];
    collectionTrend: any[];
    dpdDistribution: any[];
    workQueue: any[];
    recentApplications: any[];
    recentLoans: any[];
    recentAudits: any[];
  }>({
    metrics: {
      totalCustomers: 0,
      totalActiveLoans: 0,
      totalLoans: 0,
      totalOutstandingPrincipal: 0,
      totalOverdueAmount: 0,
      totalDisbursedPrincipal: 0,
      totalRepaymentsCollected: 0,
      totalApplications: 0,
      pendingApplicationsCount: 0,
      pendingApprovalsCount: 0,
      pendingDisbursementsCount: 0,
    },
    disbursementTrend: [],
    collectionTrend: [],
    dpdDistribution: [],
    workQueue: [],
    recentApplications: [],
    recentLoans: [],
    recentAudits: [],
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardApi.getStats();
      setStatsData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Unable to load real-time portfolio statistics from database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardStats();
  };

  if (!user) return null;

  const { metrics, disbursementTrend, collectionTrend, dpdDistribution, workQueue, recentApplications, recentLoans, recentAudits } = statsData;

  // Define Columns for Recent Applications Table
  const applicationColumns: ColumnDef<any>[] = [
    {
      key: 'applicationNumber',
      header: 'Application #',
      sortable: true,
      copyable: true,
      copyValue: (r) => r.applicationNumber,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {r.applicationNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer Name',
      sortable: true,
      cell: (r) => (
        <div className="font-semibold text-xs text-slate-900">{r.customerName}</div>
      ),
    },
    {
      key: 'productName',
      header: 'Loan Product',
      sortable: true,
      cell: (r) => <span className="text-xs text-slate-700">{r.productName}</span>,
    },
    {
      key: 'requestedAmount',
      header: 'Requested Amount',
      sortable: true,
      align: 'right',
      cell: (r) => <CurrencyDisplay amount={r.requestedAmount} size="sm" alignRight />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      cell: (r) => <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  // Define Columns for Recent Loans Table
  const loanColumns: ColumnDef<any>[] = [
    {
      key: 'loanAccountNumber',
      header: 'Loan Account #',
      sortable: true,
      copyable: true,
      copyValue: (r) => r.loanAccountNumber,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {r.loanAccountNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{r.customerName}</div>
          <div className="text-[11px] text-slate-400">{r.branchName}</div>
        </div>
      ),
    },
    {
      key: 'principalAmount',
      header: 'Principal',
      sortable: true,
      align: 'right',
      cell: (r) => <CurrencyDisplay amount={r.principalAmount} size="sm" alignRight />,
    },
    {
      key: 'outstandingPrincipal',
      header: 'Outstanding Balance',
      sortable: true,
      align: 'right',
      cell: (r) => <CurrencyDisplay amount={r.outstandingPrincipal} size="sm" alignRight />,
    },
    {
      key: 'dpd',
      header: 'DPD',
      sortable: true,
      align: 'center',
      cell: (r) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
            r.dpd > 30 ? 'bg-rose-100 text-rose-800' : r.dpd > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {r.dpd || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  // Render Real Database-Backed KPI Blocks
  const renderRoleKPIs = () => {
    switch (user.role) {
      case 'loan_officer':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBlock
              title="Pipeline Applications"
              value={metrics.pendingApplicationsCount || 0}
              subtext={`${metrics.totalApplications || 0} total applications`}
              icon={<FileText className="w-4 h-4" />}
            />
            <KPIBlock
              title="Active Customers"
              value={metrics.totalCustomers || 0}
              subtext="Registered borrowers"
              icon={<Users className="w-4 h-4" />}
            />
            <KPIBlock
              title="Active Loans"
              value={metrics.totalActiveLoans || 0}
              subtext={`${metrics.totalLoans || 0} lifetime accounts`}
              icon={<Landmark className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Portfolio Value"
              value={metrics.totalOutstandingPrincipal || 0}
              isCurrency
              subtext="Current outstanding balance"
              icon={<Activity className="w-4 h-4" />}
            />
          </div>
        );

      case 'credit_officer':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBlock
              title="Underwriting Queue"
              value={metrics.pendingApplicationsCount || 0}
              subtext="Awaiting credit decision"
              badgeText={metrics.pendingApplicationsCount > 0 ? 'Action' : 'Clear'}
              badgeVariant={metrics.pendingApplicationsCount > 0 ? 'warning' : 'neutral'}
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Disbursed Volume"
              value={metrics.totalDisbursedPrincipal || 0}
              isCurrency
              subtext="Cumulative disbursement"
              icon={<Landmark className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Applications"
              value={metrics.totalApplications || 0}
              subtext="All loan categories"
              icon={<Activity className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Overdue Amount"
              value={metrics.totalOverdueAmount || 0}
              isCurrency
              subtext="Overdue principal + interest"
              badgeText={metrics.totalOverdueAmount > 0 ? 'Monitor' : 'Clean'}
              badgeVariant={metrics.totalOverdueAmount > 0 ? 'danger' : 'success'}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>
        );

      case 'approver':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBlock
              title="Pending Approvals"
              value={metrics.pendingApprovalsCount || 0}
              subtext="Committee queue"
              badgeText={metrics.pendingApprovalsCount > 0 ? 'Pending' : 'Done'}
              badgeVariant={metrics.pendingApprovalsCount > 0 ? 'warning' : 'neutral'}
              alert={metrics.pendingApprovalsCount > 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <KPIBlock
              title="Active Loan Accounts"
              value={metrics.totalActiveLoans || 0}
              subtext="Accounts under management"
              icon={<Landmark className="w-4 h-4" />}
            />
            <KPIBlock
              title="Portfolio Exposure"
              value={metrics.totalOutstandingPrincipal || 0}
              isCurrency
              subtext="Live book size"
              icon={<FileText className="w-4 h-4" />}
            />
            <KPIBlock
              title="Delinquent Exposure"
              value={metrics.totalOverdueAmount || 0}
              isCurrency
              subtext="Accounts with DPD > 0"
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>
        );

      case 'operations_officer':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBlock
              title="Disbursement Batches"
              value={metrics.pendingDisbursementsCount || 0}
              subtext="Batches pending authorization"
              badgeText={metrics.pendingDisbursementsCount > 0 ? 'Ready' : 'Zero'}
              badgeVariant={metrics.pendingDisbursementsCount > 0 ? 'warning' : 'neutral'}
              icon={<Landmark className="w-4 h-4" />}
            />
            <KPIBlock
              title="Disbursed Principal"
              value={metrics.totalDisbursedPrincipal || 0}
              isCurrency
              subtext="Total executed tranches"
              icon={<FileText className="w-4 h-4" />}
            />
            <KPIBlock
              title="Recoveries Collected"
              value={metrics.totalRepaymentsCollected || 0}
              isCurrency
              subtext="Total repayments posted"
              icon={<Activity className="w-4 h-4" />}
            />
            <KPIBlock
              title="Active Accounts"
              value={metrics.totalActiveLoans || 0}
              subtext="Servicing portfolio"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
          </div>
        );

      case 'management':
      case 'system_admin':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBlock
              title="Active Loan Portfolio"
              value={metrics.totalOutstandingPrincipal || 0}
              isCurrency
              subtext={`${metrics.totalActiveLoans || 0} active loan accounts`}
              icon={<Landmark className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Disbursed Volume"
              value={metrics.totalDisbursedPrincipal || 0}
              isCurrency
              subtext={`${metrics.totalLoans || 0} total loans`}
              icon={<FileText className="w-4 h-4" />}
            />
            <KPIBlock
              title="Total Collections"
              value={metrics.totalRepaymentsCollected || 0}
              isCurrency
              subtext="Total EMI recoveries posted"
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <KPIBlock
              title="Delinquent Overdue"
              value={metrics.totalOverdueAmount || 0}
              isCurrency
              subtext="Gross overdue balance"
              badgeText={metrics.totalOverdueAmount > 0 ? 'Action' : 'Clean'}
              badgeVariant={metrics.totalOverdueAmount > 0 ? 'danger' : 'success'}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>
        );
    }
  };

  if (error) {
    const isAuthError =
      error.toLowerCase().includes('user account not found') ||
      error.toLowerCase().includes('session') ||
      error.toLowerCase().includes('access denied');

    return (
      <ErrorState
        title={isAuthError ? 'Session Expired or Invalid' : 'Dashboard Offline'}
        message={error}
        onRetry={isAuthError ? () => logout() : handleRefresh}
        actionLabel={isAuthError ? 'Sign In Again' : 'Retry Request'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Operational Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <span className="text-xs bg-slate-100 text-slate-800 font-semibold px-2.5 py-0.5 rounded border border-slate-200">
              {user.roleTitle}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {user.branch}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Last updated: <span className="text-slate-800 font-medium tabular-nums">{formatDateTime(lastUpdated.toISOString())}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Blocks Grid */}
      {isLoading || isRefreshing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
          <KPISkeleton />
        </div>
      ) : (
        renderRoleKPIs()
      )}

      {/* Operational Work Queue Section */}
      <WorkQueue
        items={workQueue}
        isLoading={isLoading || isRefreshing}
        onActionClick={(item) => {
          onNavigate(item.targetModule || 'applications');
        }}
      />

      {/* Operational Charts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Operational & Risk Analytics
          </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartSkeleton height={260} />
            <ChartSkeleton height={260} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DisbursementTrendChart data={disbursementTrend} />
            <CollectionTrendChart data={collectionTrend} />
            <div className="lg:col-span-2">
              <DPDDistributionChart data={dpdDistribution} />
            </div>
          </div>
        )}
      </div>

      {/* Operational Data Tables Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 ${
                activeTab === 'applications'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Recent Applications ({recentApplications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loans')}
              className={`text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 ${
                activeTab === 'loans'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Loan Accounts ({recentLoans.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate(activeTab)}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
          >
            View All {activeTab === 'applications' ? 'Applications' : 'Loans'} →
          </button>
        </div>

        {activeTab === 'applications' ? (
          <DataTable
            id="recent-applications-table"
            columns={applicationColumns}
            data={recentApplications}
            searchKey="customerName"
            searchPlaceholder="Search by Customer name, APP-ID..."
            initialPageSize={5}
            pageSizeOptions={[5, 10, 25]}
            onRowClick={(app) => onNavigate('applications', app.id)}
            emptyMessage="No loan applications found in the database."
            rowActions={[
              {
                label: 'View Details',
                onClick: (app) => onNavigate('applications', app.id),
              },
            ]}
          />
        ) : (
          <DataTable
            id="recent-loans-table"
            columns={loanColumns}
            data={recentLoans}
            searchKey="customerName"
            searchPlaceholder="Search by Customer or Loan Account Number..."
            initialPageSize={5}
            pageSizeOptions={[5, 10, 25]}
            onRowClick={(loan) => onNavigate('loans', loan.id)}
            emptyMessage="No loan accounts found in the database."
            rowActions={[
              {
                label: 'View Ledger',
                onClick: (loan) => onNavigate('loans', loan.id),
              },
            ]}
          />
        )}
      </div>

      {/* Recent System & Audit Activity Feed */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-none">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Audit & Operational Activity
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Full Audit Trail →
          </button>
        </div>

        {recentAudits.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No audit logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAudits.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                      {log.entityType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                    <span>Actor: {log.userName || 'System'}</span>
                    <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
