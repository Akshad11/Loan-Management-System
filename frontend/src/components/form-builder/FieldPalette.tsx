import React from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  ListFilter,
  CheckSquare,
  CircleDot,
  Upload,
  Layers,
  Image as ImageIcon,
  PenTool,
  Mail,
  Phone,
  MapPin,
  ToggleLeft,
  Heading,
  FileText,
  Minus,
  Calculator,
  Plus,
} from 'lucide-react';
import { FieldType } from '../../types/formBuilderTypes';

interface FieldPaletteItem {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  category: 'Text' | 'Numeric' | 'Choices' | 'Uploads' | 'Legal' | 'Layout';
}

const FIELD_PALETTE_ITEMS: FieldPaletteItem[] = [
  // Text & Contact
  { type: 'TEXT', label: 'Short Text', icon: <Type className="w-4 h-4" />, category: 'Text' },
  { type: 'TEXTAREA', label: 'Long Text / Textarea', icon: <AlignLeft className="w-4 h-4" />, category: 'Text' },
  { type: 'EMAIL', label: 'Email Address', icon: <Mail className="w-4 h-4" />, category: 'Text' },
  { type: 'PHONE', label: 'Phone Number', icon: <Phone className="w-4 h-4" />, category: 'Text' },
  { type: 'ADDRESS', label: 'Structured Address', icon: <MapPin className="w-4 h-4" />, category: 'Text' },

  // Numeric & Financial
  { type: 'NUMBER', label: 'Numeric Value', icon: <Hash className="w-4 h-4" />, category: 'Numeric' },
  { type: 'CURRENCY', label: 'Currency Amount (₹)', icon: <DollarSign className="w-4 h-4" />, category: 'Numeric' },
  { type: 'PERCENTAGE', label: 'Percentage (%)', icon: <Percent className="w-4 h-4" />, category: 'Numeric' },
  { type: 'CALCULATED', label: 'Calculated Field', icon: <Calculator className="w-4 h-4" />, category: 'Numeric' },
  { type: 'DATE', label: 'Date Picker', icon: <Calendar className="w-4 h-4" />, category: 'Numeric' },
  { type: 'DATETIME', label: 'Date & Time', icon: <Clock className="w-4 h-4" />, category: 'Numeric' },

  // Choices & Selection
  { type: 'SELECT', label: 'Dropdown Select', icon: <ListFilter className="w-4 h-4" />, category: 'Choices' },
  { type: 'RADIO', label: 'Radio Options', icon: <CircleDot className="w-4 h-4" />, category: 'Choices' },
  { type: 'CHECKBOX', label: 'Consent Checkbox', icon: <CheckSquare className="w-4 h-4" />, category: 'Choices' },
  { type: 'MULTI_SELECT', label: 'Multi-Select', icon: <Layers className="w-4 h-4" />, category: 'Choices' },
  { type: 'YES_NO', label: 'Yes / No Selector', icon: <ToggleLeft className="w-4 h-4" />, category: 'Choices' },

  // Uploads
  { type: 'FILE', label: 'Single Document File', icon: <Upload className="w-4 h-4" />, category: 'Uploads' },
  { type: 'MULTI_FILE', label: 'Multiple Files Upload', icon: <Layers className="w-4 h-4" />, category: 'Uploads' },
  { type: 'IMAGE', label: 'Image / Photo Capture', icon: <ImageIcon className="w-4 h-4" />, category: 'Uploads' },

  // Legal
  { type: 'SIGNATURE', label: 'Digital Signature Pad', icon: <PenTool className="w-4 h-4" />, category: 'Legal' },

  // Layout
  { type: 'HEADING', label: 'Section Heading', icon: <Heading className="w-4 h-4" />, category: 'Layout' },
  { type: 'DESCRIPTION', label: 'Rich Text / Notice', icon: <FileText className="w-4 h-4" />, category: 'Layout' },
  { type: 'DIVIDER', label: 'Divider Line', icon: <Minus className="w-4 h-4" />, category: 'Layout' },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  const categories: FieldPaletteItem['category'][] = [
    'Text',
    'Numeric',
    'Choices',
    'Uploads',
    'Legal',
    'Layout',
  ];

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50/80 p-4 overflow-y-auto flex flex-col space-y-4">
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Field Palette</h3>
        <p className="text-[11px] text-slate-500">Click or drag elements into the form canvas</p>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const items = FIELD_PALETTE_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                {cat} Elements
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAddField(item.type)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-900 shadow-sm hover:shadow transition-all group text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
