import React from 'react';
import {
  FilePlus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Plus,
  Move,
  Lock,
  Eye,
  CheckCircle2,
  Workflow,
  PenTool,
  Upload,
  Layers,
  Heading as HeadingIcon,
  AlignLeft,
} from 'lucide-react';
import {
  FormSchemaDefinition,
  FormPageDefinition,
  FormFieldDefinition,
  FormFieldLayout,
} from '../../types/formBuilderTypes';

interface FormCanvasProps {
  schema: FormSchemaDefinition;
  activePageIndex: number;
  selectedFieldId: string | null;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onUpdatePageTitle: (index: number, title: string) => void;
  onSelectField: (field: FormFieldDefinition) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (field: FormFieldDefinition) => void;
  onMoveField: (fieldId: string, direction: 'UP' | 'DOWN') => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  schema,
  activePageIndex,
  selectedFieldId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onUpdatePageTitle,
  onSelectField,
  onDeleteField,
  onDuplicateField,
  onMoveField,
}) => {
  const activePage = schema.pages[activePageIndex] || schema.pages[0];

  const getWidthClass = (width: FormFieldLayout) => {
    switch (width) {
      case '1_COL':
        return 'col-span-12 md:col-span-4';
      case '2_COL':
        return 'col-span-12 md:col-span-6';
      case '3_COL':
        return 'col-span-12 md:col-span-8';
      case 'FULL_WIDTH':
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100/70 overflow-hidden">
      {/* Page Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1.5 py-2">
          {schema.pages.map((page, idx) => (
            <div
              key={page.id}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                activePageIndex === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => onSelectPage(idx)}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] flex items-center justify-center">
                {idx + 1}
              </span>
              <input
                type="text"
                value={page.title}
                onChange={(e) => onUpdatePageTitle(idx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`bg-transparent font-bold focus:outline-none border-b border-transparent focus:border-white text-xs max-w-[140px] truncate ${
                  activePageIndex === idx ? 'text-white' : 'text-slate-800'
                }`}
              />
              {schema.pages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(idx);
                  }}
                  className={`p-0.5 rounded hover:bg-black/10 transition-colors ${
                    activePageIndex === idx ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={onAddPage}
            className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 border border-dashed border-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Page</span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-500">
          Page {activePageIndex + 1} of {schema.pages.length}
        </div>
      </div>

      {/* Canvas Paper Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
          {/* Active Page Header */}
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-900">{activePage?.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{activePage?.description || 'Custom form section'}</p>
          </div>

          {/* Sections & Fields */}
          {activePage?.sections?.map((section) => (
            <div key={section.id} className="space-y-3">
              {section.title && (
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}

              <div className="grid grid-cols-12 gap-4">
                {section.fields.map((field) => {
                  const isSelected = selectedFieldId === field.id;
                  const widthClass = getWidthClass(field.width);

                  return (
                    <div
                      key={field.id}
                      onClick={() => onSelectField(field)}
                      className={`${widthClass} group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Floating Field Controls */}
                      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveField(field.id, 'UP');
                          }}
                          title="Move Up"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                        >
                          <ChevronLeft className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveField(field.id, 'DOWN');
                          }}
                          title="Move Down"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                        >
                          <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateField(field);
                          }}
                          title="Duplicate"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteField(field.id);
                          }}
                          title="Delete"
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Field Preview Rendering */}
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {field.label || 'Untitled Field'}
                          </span>
                          {field.required && (
                            <span className="text-rose-500 font-bold text-xs">*</span>
                          )}
                          {field.condition && (
                            <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              <Workflow className="w-2.5 h-2.5" />
                              <span>Rule</span>
                            </span>
                          )}
                        </div>

                        {field.description && (
                          <p className="text-[11px] text-slate-400">{field.description}</p>
                        )}

                        {/* Interactive Lookalike Input */}
                        {field.type === 'TEXTAREA' ? (
                          <div className="h-16 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-400">
                            {field.placeholder || 'Long text paragraph entry...'}
                          </div>
                        ) : field.type === 'SELECT' ? (
                          <div className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center justify-between text-xs text-slate-400">
                            <span>{field.placeholder || '-- Select Option --'}</span>
                            <span className="text-slate-400">▼</span>
                          </div>
                        ) : field.type === 'YES_NO' ? (
                          <div className="flex space-x-2">
                            <div className="px-4 py-1.5 bg-blue-50 border border-blue-300 rounded-lg text-xs font-bold text-blue-800">
                              Yes
                            </div>
                            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                              No
                            </div>
                          </div>
                        ) : field.type === 'SIGNATURE' ? (
                          <div className="h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 space-x-2">
                            <PenTool className="w-4 h-4 text-blue-500" />
                            <span>Digital Signature Pad Area</span>
                          </div>
                        ) : field.type === 'FILE' || field.type === 'MULTI_FILE' ? (
                          <div className="h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-xs text-slate-400 space-x-2">
                            <Upload className="w-4 h-4 text-blue-500" />
                            <span>Upload documents here</span>
                          </div>
                        ) : (
                          <div className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center text-xs text-slate-400 font-medium">
                            {field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {activePage?.sections?.[0]?.fields?.length === 0 && (
            <div className="p-12 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Plus className="w-8 h-8 text-slate-300" />
              <span className="text-sm font-bold text-slate-700">This page has no fields yet</span>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose components from the left palette to add form fields to this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
