import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Upload, FileUp, X, CheckCircle, AlertTriangle, ArrowLeft, Loader2, Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STEPS = ['upload', 'preview', 'success'];

/**
 * CSV Upload Modal — 3-step process:
 * Step 1: Upload/Drag&Drop file + template download
 * Step 2: Preview parsed data with validation
 * Step 3: Success summary
 */
const CsvUploadModal = ({ onClose, onImportComplete }) => {
  const { getToken } = useAuth();

  const [step, setStep] = useState('upload');
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [excludedRows, setExcludedRows] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // ----- STEP 1: File handling -----
  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    setIsLoading(true);

    // Parse CSV client-side
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setIsLoading(false);
        alert('The file appears to be empty or invalid.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Map CSV columns to product fields
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      // Validate
      const errors = [];
      rows.forEach((row, idx) => {
        const rowErrors = [];
        if (!row.name) rowErrors.push('Missing product name');
        if (!row.category) rowErrors.push('Missing category');
        if (!row.sellingprice && row.sellingPrice && !row.sellingprice) {
          // check both casings
        }
        const sellingPrice = row.sellingprice || row.sellingPrice;
        if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
          rowErrors.push('Invalid selling price');
        }
        const buyingPrice = row.buyingprice || row.buyingPrice;
        if (buyingPrice && (isNaN(Number(buyingPrice)) || Number(buyingPrice) < 0)) {
          rowErrors.push('Invalid buying price');
        }
        const quantity = row.quantity;
        if (quantity && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
          rowErrors.push('Invalid quantity');
        }

        if (rowErrors.length > 0) {
          errors.push({ row: idx + 2, errors: rowErrors, data: row }); // +2 for header row + 1-based
        }
      });

      setParsedData(rows);
      setValidationErrors(errors);
      setExcludedRows(new Set());
      setIsLoading(false);
      setStep('preview');
    };

    reader.readAsText(selectedFile);
  }, [getToken]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const toggleExcludeRow = (rowIndex) => {
    setExcludedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  // ----- STEP 2 → STEP 3: Import -----
  const handleImport = async () => {
    setIsLoading(true);

    const validRows = parsedData
      .filter((_, idx) => !excludedRows.has(idx))
      .filter((_, idx) => !validationErrors.some(e => e.row === idx + 2));

    if (validRows.length === 0) {
      setIsLoading(false);
      return;
    }

    const token = await getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/products/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: validRows }),
      });

      const result = await response.json();

      if (result.success) {
        setImportResult(result.data);
        setStep('success');
        if (onImportComplete) onImportComplete(result.data);
      } else {
        alert(result.message || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----- Template download -----
  const handleDownloadTemplate = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_BASE_URL}/products/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dukaflow_product_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error:', err);
    }
  };

  // ----- Reset -----
  const handleReset = () => {
    setStep('upload');
    setParsedData(null);
    setValidationErrors([]);
    setExcludedRows(new Set());
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
      <div className="bg-white rounded-[20px] p-6 sm:p-8 max-w-[560px] w-full shadow-xl max-h-[90vh] overflow-y-auto relative">

        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* ==================== STEP 1: UPLOAD ==================== */}
        {step === 'upload' && (
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-12 h-12 sm:w-12 sm:h-12 w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
              <Upload size={24} className="text-[#312E81]" />
            </div>

            <h2 className="text-xl sm:text-xl text-lg font-bold text-[#1E293B] mt-4">
              Import Products from CSV
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              Upload a CSV or Excel file with your product data
            </p>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-6 w-full border-2 border-dashed rounded-xl p-8 sm:p-10 cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#312E81] bg-[#EEF2FF]'
                  : 'border-[#CBD5E1] bg-neutral-50 hover:border-[#312E81] hover:bg-[#EEF2FF]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileUp size={32} className="text-neutral-400 mx-auto" />
              <p className="text-sm text-[#64748B] mt-3">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                CSV, XLSX up to 5MB
              </p>
            </div>

            {/* Template download */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 mt-4 text-sm text-[#312E81] hover:underline font-medium"
            >
              <Download size={16} />
              Download template CSV →
            </button>

            {/* Template columns info */}
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              {['name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'size', 'color', 'brand', 'expiryDate'].map(col => (
                <span key={col} className="px-2 py-0.5 bg-neutral-100 rounded text-[11px] text-[#64748B] font-mono">
                  {col}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-8 w-full">
              <button
                onClick={onClose}
                className="flex-1 h-11 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                disabled
                className="flex-1 h-11 bg-[#312E81]/40 text-white rounded-xl text-sm font-semibold cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 2: PREVIEW ==================== */}
        {step === 'preview' && parsedData && (
          <div>
            {/* Back button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold text-[#1E293B]">
              Preview: {parsedData.length} product{parsedData.length !== 1 ? 's' : ''} found
            </h2>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <AlertTriangle size={16} />
                  {validationErrors.length} row{validationErrors.length !== 1 ? 's' : ''} ha{validationErrors.length === 1 ? 's' : 've'} errors and will be skipped
                </div>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-xs text-orange-600 pl-6">
                      Row {err.row}: {err.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview table */}
            <div className="mt-4 border border-[#CBD5E1] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr>
                    <th className="w-10 py-2 px-2">
                      <span className="sr-only">Include</span>
                    </th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[#64748B]">Name</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[#64748B]">Category</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748B]">Buy Price</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748B]">Sell Price</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748B]">Qty</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-[#64748B]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, idx) => {
                    const rowNum = idx + 2; // CSV row number
                    const hasError = validationErrors.some(e => e.row === rowNum);
                    const isExcluded = excludedRows.has(idx);

                    return (
                      <tr
                        key={idx}
                        className={`border-t border-neutral-100 ${isExcluded ? 'opacity-40' : ''}`}
                      >
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => toggleExcludeRow(idx)}
                            disabled={hasError}
                            className="w-4 h-4 rounded border-neutral-300 text-[#312E81] focus:ring-[#312E81]"
                          />
                        </td>
                        <td className="py-2 px-2 text-[#1E293B] font-medium text-xs">{row.name || row.Name || '—'}</td>
                        <td className="py-2 px-2 text-[#64748B] text-xs">{row.category || row.Category || '—'}</td>
                        <td className="py-2 px-2 text-right text-xs text-[#1E293B]">
                          {row.buyingprice || row.buyingPrice || row.BuyingPrice || '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-xs text-[#E8835C] font-semibold">
                          {row.sellingprice || row.sellingPrice || row.SellingPrice || '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-xs text-[#1E293B]">
                          {row.quantity || row.Quantity || '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {hasError ? (
                            <AlertTriangle size={16} className="text-orange-500 mx-auto" />
                          ) : isExcluded ? (
                            <X size={16} className="text-neutral-400 mx-auto" />
                          ) : (
                            <CheckCircle size={16} className="text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Valid count */}
            <p className="mt-3 text-sm text-[#64748B]">
              {parsedData.filter((_, idx) => !excludedRows.has(idx) && !validationErrors.some(e => e.row === idx + 2)).length} valid products ready to import
            </p>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReset}
                className="flex-1 h-11 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || parsedData.filter((_, idx) => !excludedRows.has(idx) && !validationErrors.some(e => e.row === idx + 2)).length === 0}
                className="flex-1 h-11 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] disabled:bg-[#312E81]/40 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Import {parsedData.filter((_, idx) => !excludedRows.has(idx) && !validationErrors.some(e => e.row === idx + 2)).length} Products
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: SUCCESS ==================== */}
        {step === 'success' && importResult && (
          <div className="flex flex-col items-center text-center py-4">
            {/* Animated checkmark */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scaleIn">
              <CheckCircle size={48} className="text-green-500" />
            </div>

            <h2 className="text-xl font-bold text-[#1E293B] mt-5">
              Import Complete!
            </h2>

            <p className="text-[15px] text-[#64748B] mt-2">
              {importResult.imported} product{importResult.imported !== 1 ? 's' : ''} added to your inventory
            </p>

            {importResult.skipped > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                {importResult.skipped} row{importResult.skipped !== 1 ? 's' : ''} skipped due to errors
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
              <button
                onClick={() => {
                  onClose();
                  if (onImportComplete) onImportComplete(importResult);
                }}
                className="flex-1 h-11 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm font-semibold"
              >
                View Products
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-11 border border-[#CBD5E1] text-[#64748B] rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvUploadModal;
