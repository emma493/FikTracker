import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Info,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { FikFapAccount } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onAccountsImported: (accounts: FikFapAccount[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  userId,
  onClose,
  onAccountsImported,
}) => {
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      if (obj.fikfapEmail) {
        results.push(obj);
      }
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      setCsvText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError(null);
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) {
      setError('No valid accounts found in CSV. Please check formatting.');
      return;
    }

    setIsImporting(true);
    try {
      const accounts = await firebaseService.bulkImportAccounts(userId, parsed);
      onAccountsImported(accounts);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bulk import to Firebase failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const content = `fikfapEmail,fikfapUsername,label,targetBioLink,proxy\nuser1@example.com,user_one,Promo Account 1,https://onlyfans.com/demo,proxy.ip:8080\nuser2@example.com,user_two,Promo Account 2,https://linktr.ee/demo,`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fikfap_accounts_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#18181b] text-[#fafafa] border border-[#27272a]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#fafafa]">Bulk Import Accounts to Firebase</h2>
              <p className="text-xs text-[#a1a1aa]">Import multiple FikFap creator accounts via CSV file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload or Template banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090b] border border-[#27272a]">
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <Info className="w-4 h-4 text-[#a1a1aa]" />
              <span>CSV Columns: fikfapEmail, fikfapUsername, label, targetBioLink, proxy</span>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1 text-xs text-[#fafafa] hover:underline font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Select CSV File or Paste Below
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-[#a1a1aa] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              CSV Raw Content
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
              placeholder="fikfapEmail,fikfapUsername,..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#27272a] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-black bg-white hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Importing to Firestore...' : 'Import to Firebase'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
