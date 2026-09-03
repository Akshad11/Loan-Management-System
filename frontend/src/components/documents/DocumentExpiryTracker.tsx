import React, { useState, useMemo } from 'react';
import { DocumentItem } from '../../types';
import {
  AlertOctagon,
  Clock,
  Send,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface DocumentExpiryTrackerProps {
  documents: DocumentItem[];
  onOpenViewer: (doc: DocumentItem) => void;
  onSendReminder: (docId: string) => void;
  onRenewDocument: (docId: string, newDate: string) => void;
}

export const DocumentExpiryTracker: React.FC<DocumentExpiryTrackerProps> = ({
  documents,
  onOpenViewer,
  onSendReminder,
  onRenewDocument,
}) => {
  const [remindedDocIds, setRemindedDocIds] = useState<Set<string>>(new Set());
  const [renewingDocId, setRenewingDocId] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('2028-12-31');

  // Categorize documents by expiry state
  const { expired, expiring30, expiring90 } = useMemo(() => {
    const today = new Date();
    const expiredList: DocumentItem[] = [];
    const expiring30List: DocumentItem[] = [];
    const expiring90List: DocumentItem[] = [];

    documents.forEach((doc) => {
      if (doc.isLifetimeValid || !doc.expiryDate) return;

      const expiry = new Date(doc.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0 || doc.status === 'EXPIRED') {
        expiredList.push(doc);
      } else if (diffDays <= 30) {
        expiring30List.push(doc);
      } else if (diffDays <= 90) {
        expiring90List.push(doc);
      }
    });

    return {
      expired: expiredList,
      expiring30: expiring30List,
      expiring90: expiring90List,
    };
  }, [documents]);

  const handleSendReminderClick = (docId: string) => {
    onSendReminder(docId);
    setRemindedDocIds((prev) => new Set(prev).add(docId));
  };

  const handleRenewSubmit = (docId: string) => {
    onRenewDocument(docId, newExpiryDate);
    setRenewingDocId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Document Expiry & Renewal Management</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Automated monitoring of document validity cycles, regulatory renewals, and customer notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-rose-50 text-rose-800 font-bold rounded border border-rose-200 text-xs">
            {expired.length} Expired
          </span>
          <span className="px-2 py-1 bg-amber-50 text-amber-800 font-bold rounded border border-amber-200 text-xs">
            {expiring30.length} Due &lt;30d
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-900 text-xs">Overdue / Expired</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-mono font-bold text-rose-900 mt-1">{expired.length}</p>
          <span className="text-[10px] text-rose-700">Immediate replacement mandatory</span>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-xs">Expiring &lt;30 Days</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-mono font-bold text-amber-900 mt-1">{expiring30.length}</p>
          <span className="text-[10px] text-amber-700">High-priority renewal cycle</span>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 text-xs">Expiring 31–90 Days</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-mono font-bold text-blue-900 mt-1">{expiring90.length}</p>
          <span className="text-[10px] text-blue-700">Standard advance notification</span>
        </div>
      </div>

      {/* Expired & Expiring Documents List */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
              <th className="p-3">Document Title</th>
              <th className="p-3">Borrower</th>
              <th className="p-3">Expiry Date</th>
              <th className="p-3">Urgency Status</th>
              <th className="p-3 text-right">Renewal & Notification Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...expired, ...expiring30, ...expiring90].length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  All active borrower documents have valid expiry dates. No renewals pending.
                </td>
              </tr>
            ) : (
              [...expired, ...expiring30, ...expiring90].map((doc) => {
                const isDocExpired = doc.status === 'EXPIRED' || (doc.expiryDate && new Date(doc.expiryDate) < new Date());
                const isReminded = remindedDocIds.has(doc.id);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{doc.documentTitle}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{doc.fileName}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{doc.customerName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{doc.customerNumber}</div>
                    </td>

                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900">{doc.expiryDate}</span>
                    </td>

                    <td className="p-3">
                      {isDocExpired ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                          EXPIRING SOON
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendReminderClick(doc.id)}
                          disabled={isReminded}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                            isReminded
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{isReminded ? 'Reminder Sent' : 'Send Reminder'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewingDocId(doc.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenViewer(doc)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline Renew Date Popover */}
                      {renewingDocId === doc.id && (
                        <div className="mt-2 p-2 bg-slate-100 border border-slate-300 rounded flex items-center gap-2 justify-end">
                          <span className="text-[10px] font-bold text-slate-700">New Expiry:</span>
                          <input
                            type="date"
                            value={newExpiryDate}
                            onChange={(e) => setNewExpiryDate(e.target.value)}
                            className="p-1 bg-white border border-slate-300 rounded text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenewSubmit(doc.id)}
                            className="px-2 py-1 bg-emerald-700 text-white font-bold rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenewingDocId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
