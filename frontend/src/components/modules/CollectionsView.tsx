import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { CurrencyDisplay } from '../shared/CurrencyDisplay';
import { KPIBlock } from '../shared/KPIBlock';
import { formatDate } from '../../utils/formatters';
import { AlertOctagon, PhoneCall, FileText, Send, Download } from 'lucide-react';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { loanApi } from '../../services/apiClient';
import { TableSkeleton } from '../shared/LoadingSkeleton';

export const CollectionsView: React.FC<{ onNavigate: (mod: string) => void }> = ({ onNavigate }) => {
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await loanApi.getAll();
      const list = res?.loans || (Array.isArray(res) ? res : []);
      setLoans(list);
    } catch (err) {
      console.error('Failed to load loans for collections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const overdueAccounts = loans.filter((l) => (l.dpd && l.dpd > 0) || l.status === 'OVERDUE');

  const grossOverdueAmount = overdueAccounts.reduce(
    (sum, a) => sum + Number(a.overdueAmount || 0),
    0
  );
  const totalExposureAtRisk = overdueAccounts.reduce(
    (sum, a) => sum + Number(a.outstandingPrincipal || 0),
    0
  );

  const columns: ColumnDef<any>[] = [
    {
      key: 'loanAccountNumber',
      header: 'Loan Account #',
      sortable: true,
      copyable: true,
      copyValue: (r) => r.loanAccountNumber || r.accountNumber,
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {r.loanAccountNumber || r.accountNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Borrower Name',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{r.customerName}</div>
          <div className="text-[11px] text-slate-500">{r.branchName || r.branch}</div>
        </div>
      ),
    },
    {
      key: 'dpd',
      header: 'DPD',
      sortable: true,
      align: 'center',
      cell: (r) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
            r.dpd > 30 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {r.dpd || 0} Days
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      sortable: true,
      cell: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'overdueAmount',
      header: 'Overdue Installment',
      sortable: true,
      align: 'right',
      cell: (r) => <CurrencyDisplay amount={Number(r.overdueAmount || 0)} size="sm" variant="negative" alignRight />,
    },
    {
      key: 'outstandingPrincipal',
      header: 'Total Principal at Risk',
      sortable: true,
      align: 'right',
      cell: (r) => <CurrencyDisplay amount={Number(r.outstandingPrincipal || 0)} size="sm" alignRight />,
    },
    {
      key: 'nextDueDate',
      header: 'Default Since / Next Due',
      sortable: true,
      cell: (r) => <span className="text-xs text-slate-600">{r.nextDueDate ? formatDate(r.nextDueDate) : '-'}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collections & Delinquency Management"
        subtitle="Manage overdue loan recoveries, DPD bucket escalations, and automated demand notices."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Collections', active: true }]}
        onHomeClick={() => onNavigate('dashboard')}
      />

      {/* Collection Workload KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPIBlock
          title="Active Overdue Accounts"
          value={overdueAccounts.length}
          subtext="Under active field follow-up"
          badgeText={overdueAccounts.length > 0 ? 'Action' : 'Clean'}
          badgeVariant={overdueAccounts.length > 0 ? 'danger' : 'success'}
          alert={overdueAccounts.length > 0}
          icon={<AlertOctagon className="w-4 h-4" />}
        />
        <KPIBlock
          title="Gross Overdue Amount"
          value={grossOverdueAmount}
          isCurrency
          subtext="Cumulative unpaid EMIs"
          icon={<AlertOctagon className="w-4 h-4" />}
        />
        <KPIBlock
          title="Total Exposure at Risk"
          value={totalExposureAtRisk}
          isCurrency
          subtext="Principal on delinquent loans"
          icon={<AlertOctagon className="w-4 h-4" />}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          id="collections-table"
          columns={columns}
          data={overdueAccounts}
          searchKey="customerName"
          searchPlaceholder="Search delinquent accounts..."
          pageSizeOptions={[5, 10, 25]}
          initialPageSize={10}
          emptyMessage="No delinquent or overdue loan accounts found."
          onRowClick={(acc) => {
            setSelectedAccount(acc);
            setShowNoticeModal(true);
          }}
          rowActions={[
            {
              label: 'Issue Demand Notice',
              onClick: (acc) => {
                setSelectedAccount(acc);
                setShowNoticeModal(true);
              },
            },
          ]}
        />
      )}

      <ConfirmationDialog
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onConfirm={() => {
          setShowNoticeModal(false);
        }}
        title="Issue Formal Loan Demand Notice"
        description={`Send a formal statutory overdue recall notice to ${selectedAccount?.customerName} for overdue amount of ₹${Number(selectedAccount?.overdueAmount || 0).toLocaleString('en-IN')}.`}
        confirmLabel="Issue Demand Notice"
        variant="danger"
      />
    </div>
  );
};
