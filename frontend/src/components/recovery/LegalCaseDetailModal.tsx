import React, { useState } from 'react';
import {
  X,
  Scale,
  Landmark,
  Calendar,
  DollarSign,
  User,
  Phone,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  LegalCaseRecord,
  LegalCaseEventType,
  CreateLegalCasePayload,
} from '../../types/recoveryTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface LegalCaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  legalCase?: LegalCaseRecord | null;
  recoveryCaseId?: string;
  claimDefaultAmount?: number;
  onCreate?: (payload: CreateLegalCasePayload) => void;
  onAddEvent?: (
    legalCaseId: string,
    eventType: LegalCaseEventType,
    notes: string,
    referenceNumber?: string,
    nextHearingDate?: string
  ) => void;
  currentUser?: { name: string; id: string; roleName: string };
}

export const LegalCaseDetailModal: React.FC<LegalCaseDetailModalProps> = ({
  isOpen,
  onClose,
  legalCase,
  recoveryCaseId,
  claimDefaultAmount = 0,
  onCreate,
  onAddEvent,
  currentUser,
}) => {
  const isCreating = !legalCase;

  // Form states for creation
  const [caseType, setCaseType] = useState<any>('DEMAND_NOTICE_138');
  const [jurisdiction, setJurisdiction] = useState<string>('Panaji District Commercial Court');
  const [courtOrForum, setCourtOrForum] = useState<string>('Court of Judicial Magistrate First Class (JMFC)');
  const [courtCaseNumber, setCourtCaseNumber] = useState<string>('');
  const [filingDate, setFilingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nextHearingDate, setNextHearingDate] = useState<string>('');
  const [advocateName, setAdvocateName] = useState<string>('Adv. Rohan Verlekar');
  const [advocateContact, setAdvocateContact] = useState<string>('+91 98221 44552');
  const [externalCounsel, setExternalCounsel] = useState<string>('Verlekar & Associates');
  const [claimAmount, setClaimAmount] = useState<string>(claimDefaultAmount ? claimDefaultAmount.toString() : '');
  const [notes, setNotes] = useState<string>('');

  // Form states for adding court hearing event
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [eventType, setEventType] = useState<LegalCaseEventType>('HEARING_HELD');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eventNotes, setEventNotes] = useState<string>('');
  const [eventNextHearing, setEventNextHearing] = useState<string>('');
  const [eventRef, setEventRef] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCaseId || !onCreate) return;

    onCreate({
      recoveryCaseId,
      caseType,
      jurisdiction,
      courtOrForum,
      courtCaseNumber: courtCaseNumber.trim() || undefined,
      filingDate,
      nextHearingDate: nextHearingDate || undefined,
      advocateName: advocateName.trim() || undefined,
      advocateContact: advocateContact.trim() || undefined,
      externalCounsel: externalCounsel.trim() || undefined,
      claimAmount: claimAmount ? parseFloat(claimAmount) : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalCase || !onAddEvent || !eventNotes.trim()) return;

    onAddEvent(
      legalCase.id,
      eventType,
      eventNotes.trim(),
      eventRef.trim() || undefined,
      eventNextHearing || undefined
    );
    setShowEventForm(false);
    setEventNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isCreating ? 'File & Institute Legal Case' : `Legal Proceedings: ${legalCase.legalCaseNumber}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isCreating
                  ? 'Initiate statutory legal court action on delinquent recovery case'
                  : `Court: ${legalCase.courtOrForum} • Ref: ${legalCase.courtCaseNumber || legalCase.legalCaseNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isCreating ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Legal Action Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="SECTION_138_NI_ACT">Section 138 NI Act (Criminal Complaint)</option>
                    <option value="SUMMARY_SUIT_ORDER_37">Summary Suit (Order 37 CPC)</option>
                    <option value="REGULAR_CIVIL_SUIT">Regular Civil Recovery Suit</option>
                    <option value="ARBITRATION">Arbitration Proceedings</option>
                    <option value="SARFAESI_SECURED">SARFAESI Enforcement</option>
                    <option value="DRT_RECOVERY">DRT Recovery Application</option>
                    <option value="INSOLVENCY_IBC">Insolvency / IBC Application</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Court / Tribunal Forum <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courtOrForum}
                    onChange={(e) => setCourtOrForum(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Court Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Court Case / Filing Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CC/1042/2026 or Filing No. 8921"
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Filing Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Next Hearing Date
                  </label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Advocate Name
                  </label>
                  <input
                    type="text"
                    value={advocateName}
                    onChange={(e) => setAdvocateName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Advocate Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={advocateContact}
                    onChange={(e) => setAdvocateContact(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    External Law Firm
                  </label>
                  <input
                    type="text"
                    value={externalCounsel}
                    onChange={(e) => setExternalCounsel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Claim Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Case Brief & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record summary of plaint, cause of action, and prayers made before court..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm"
                >
                  File & Save Case Record
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Snapshot Cards */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Case Status</span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 mt-1">
                    {legalCase.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim Amount</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatCurrencyINR(legalCase.claimAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Next Hearing</span>
                  <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">
                    {legalCase.nextHearingDate ? formatDate(legalCase.nextHearingDate) : 'Not Scheduled'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Advocate</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
                    {legalCase.advocateName || 'Not Assigned'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-700" />
                  Court Proceedings & Hearing Timeline
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Hearing / Order
                </button>
              </div>

              {/* Event Logging Sub-form */}
              {showEventForm && (
                <form
                  onSubmit={handleEventSubmit}
                  className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Event / Hearing Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as LegalCaseEventType)}
                        className="w-full px-3 py-1.5 border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="HEARING_HELD">Court Hearing Held</option>
                        <option value="SUMMONS_ISSUED">Court Summons Issued</option>
                        <option value="SUMMONS_SERVED">Summons Served on Accused</option>
                        <option value="BAILABLE_WARRANT">Bailable Warrant Issued</option>
                        <option value="NBW_ISSUED">Non-Bailable Warrant Issued</option>
                        <option value="INTERIM_ORDER">Interim Attachment / Order</option>
                        <option value="FINAL_DECREE">Final Decree / Judgment Passed</option>
                        <option value="EXECUTION_FILED">Execution Petition Filed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Hearing / Order Date
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-purple-950 mb-1">
                        Next Adjourned Date
                      </label>
                      <input
                        type="date"
                        value={eventNextHearing}
                        onChange={(e) => setEventNextHearing(e.target.value)}
                        className="w-full px-3 py-1.5 border border-purple-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-purple-950 mb-1">
                      Court Proceedings / Order Summary <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Record what transpired before the judge, appearances, orders passed, or directions given..."
                      value={eventNotes}
                      onChange={(e) => setEventNotes(e.target.value)}
                      className="w-full p-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm"
                    >
                      Save Court Event
                    </button>
                  </div>
                </form>
              )}

              {/* Hearing Timeline List */}
              <div className="space-y-2.5">
                {legalCase.events && legalCase.events.length > 0 ? (
                  legalCase.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {formatDate(evt.eventDate)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{evt.notes}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Logged by: {evt.actorName} ({evt.actorRole})</span>
                        {evt.nextHearingDate && (
                          <span className="font-medium text-purple-700">
                            Next Hearing: {formatDate(evt.nextHearingDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No court hearing events recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
