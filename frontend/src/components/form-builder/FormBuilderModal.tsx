import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Send,
  Eye,
  Edit3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import {
  LoanProductRecord,
  FormSchemaDefinition,
  FormFieldDefinition,
  FieldType,
} from '../../types/formBuilderTypes';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldConfigPanel } from './FieldConfigPanel';
import { DynamicFormRenderer } from '../forms/DynamicFormRenderer';
import { HOME_LOAN_FORM_SCHEMA } from '../../config/systemTemplates';

interface FormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LoanProductRecord;
  currentUser: { id: string; name: string; roleName: string };
  onPublishSuccess: () => void;
}

export const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  isOpen,
  onClose,
  product,
  currentUser,
  onPublishSuccess,
}) => {
  const [schema, setSchema] = useState<FormSchemaDefinition>(
    product.activeFormVersion?.schemaJson || HOME_LOAN_FORM_SCHEMA
  );
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedField, setSelectedField] = useState<FormFieldDefinition | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (product.activeFormVersion?.schemaJson) {
      setSchema(product.activeFormVersion.schemaJson);
    } else {
      const cloned = JSON.parse(JSON.stringify(HOME_LOAN_FORM_SCHEMA));
      cloned.metadata = {
        productCode: product.code,
        productName: product.name,
        estimatedCompletionMinutes: 10,
      };
      setSchema(cloned);
    }
  }, [product]);

  if (!isOpen) return null;

  // Flatten all field IDs across pages for dependency picker
  const allFieldIds = schema.pages.flatMap((page) =>
    page.sections.flatMap((sec) =>
      sec.fields.map((f) => ({ id: f.id, label: f.label || f.id }))
    )
  );

  // Handlers for Pages
  const handleAddPage = () => {
    const newPageNum = schema.pages.length + 1;
    const newPage = {
      id: `page_${Date.now()}`,
      pageNumber: newPageNum,
      title: `Page ${newPageNum}`,
      description: 'Section description',
      sections: [
        {
          id: `sec_${Date.now()}`,
          title: 'General Information',
          columns: 2,
          fields: [],
        },
      ],
    };

    setSchema((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageIndex(schema.pages.length);
  };

  const handleDeletePage = (pageIdx: number) => {
    if (schema.pages.length <= 1) return;
    const updated = schema.pages.filter((_, i) => i !== pageIdx);
    setSchema((prev) => ({ ...prev, pages: updated }));
    setActivePageIndex(Math.max(0, pageIdx - 1));
  };

  const handleUpdatePageTitle = (pageIdx: number, title: string) => {
    const pages = [...schema.pages];
    if (pages[pageIdx]) {
      pages[pageIdx].title = title;
      setSchema((prev) => ({ ...prev, pages }));
    }
  };

  // Handlers for Fields
  const handleAddField = (type: FieldType) => {
    const activePage = schema.pages[activePageIndex];
    if (!activePage) return;

    const newFieldId = `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const newField: FormFieldDefinition = {
      id: newFieldId,
      type,
      label: `New ${type.replace('_', ' ').toLowerCase()}`,
      placeholder: `Enter ${type.toLowerCase()}...`,
      required: false,
      width: type === 'SIGNATURE' || type === 'ADDRESS' || type === 'DESCRIPTION' ? 'FULL_WIDTH' : '1_COL',
      options: ['SELECT', 'RADIO', 'MULTI_SELECT'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };

    const pages = [...schema.pages];
    const targetSection = pages[activePageIndex].sections[0] || {
      id: `sec_${Date.now()}`,
      title: 'Section',
      columns: 2,
      fields: [],
    };

    targetSection.fields.push(newField);
    pages[activePageIndex].sections[0] = targetSection;

    setSchema((prev) => ({ ...prev, pages }));
    setSelectedField(newField);
  };

  const handleUpdateField = (updated: FormFieldDefinition) => {
    const pages = [...schema.pages];
    for (const page of pages) {
      for (const sec of page.sections) {
        const idx = sec.fields.findIndex((f) => f.id === updated.id);
        if (idx !== -1) {
          sec.fields[idx] = updated;
          break;
        }
      }
    }
    setSchema((prev) => ({ ...prev, pages }));
    setSelectedField(updated);
  };

  const handleDeleteField = (fieldId: string) => {
    const pages = [...schema.pages];
    for (const page of pages) {
      for (const sec of page.sections) {
        sec.fields = sec.fields.filter((f) => f.id !== fieldId);
      }
    }
    setSchema((prev) => ({ ...prev, pages }));
    if (selectedField?.id === fieldId) setSelectedField(null);
  };

  const handleDuplicateField = (field: FormFieldDefinition) => {
    const cloned: FormFieldDefinition = {
      ...JSON.parse(JSON.stringify(field)),
      id: `${field.id}_copy_${Date.now().toString().slice(-3)}`,
      label: `${field.label} (Copy)`,
    };
    const pages = [...schema.pages];
    pages[activePageIndex].sections[0].fields.push(cloned);
    setSchema((prev) => ({ ...prev, pages }));
    setSelectedField(cloned);
  };

  const handleMoveField = (fieldId: string, direction: 'UP' | 'DOWN') => {
    const pages = [...schema.pages];
    const sec = pages[activePageIndex].sections[0];
    if (!sec) return;

    const idx = sec.fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sec.fields.length) return;

    const temp = sec.fields[idx];
    sec.fields[idx] = sec.fields[targetIdx];
    sec.fields[targetIdx] = temp;

    setSchema((prev) => ({ ...prev, pages }));
  };

  // Actions: Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/loan-products/${product.id}/form-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaJson: schema,
          changeSummary: 'Form draft saved from visual designer.',
          savedBy: currentUser.name,
        }),
      });
      if (!res.ok) throw new Error('Failed to save draft schema');
      setBannerMessage({ type: 'success', text: 'Draft form schema saved successfully!' });
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Actions: Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/loan-products/${product.id}/form-builder/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaJson: schema,
          changeSummary: `Published form version for ${product.name}`,
          publishedBy: currentUser.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to publish form');
      }

      setBannerMessage({
        type: 'success',
        text: 'New immutable form version published successfully and activated!',
      });
      onPublishSuccess();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col">
      {/* Top Header */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white">{product.name} — Application Form Builder</h1>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                {product.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Design custom multi-page questions, layouts & validation rules</p>
          </div>
        </div>

        {/* Toolbar Center Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isPreviewMode
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Publish Form'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional Feedback Banner */}
      {bannerMessage && (
        <div
          className={`px-6 py-2 text-xs font-semibold flex items-center justify-between ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      {isPreviewMode ? (
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Live Form Simulator Mode
              </span>
              <span className="text-xs text-slate-500">How applicants will experience this form</span>
            </div>
            <DynamicFormRenderer
              schema={schema}
              onSubmitForm={async (resp) => {
                alert('Preview Submission Successful! Responses:\n' + JSON.stringify(resp, null, 2));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Palette */}
          <FieldPalette onAddField={handleAddField} />

          {/* Center: Interactive Canvas */}
          <FormCanvas
            schema={schema}
            activePageIndex={activePageIndex}
            selectedFieldId={selectedField?.id || null}
            onSelectPage={setActivePageIndex}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onUpdatePageTitle={handleUpdatePageTitle}
            onSelectField={setSelectedField}
            onDeleteField={handleDeleteField}
            onDuplicateField={handleDuplicateField}
            onMoveField={handleMoveField}
          />

          {/* Right: Field Properties Inspector */}
          <FieldConfigPanel
            field={selectedField}
            allFieldIds={allFieldIds}
            onChange={handleUpdateField}
            onClose={() => setSelectedField(null)}
          />
        </div>
      )}
    </div>
  );
};
