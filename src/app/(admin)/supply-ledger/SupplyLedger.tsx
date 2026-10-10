'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  BookOpen,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Warehouse,
  Layers,
  Calendar,
  Clock,
  User,
  RefreshCw,
  FileText,
  ChevronDown,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';

interface StockRow {
  stock_id: string;
  project_id: string;
  warehouse_id: string;
  item_id: string;
  item_name: string;
  unit_id?: string;
  unit_name?: string;
  current_stock: string;
  low_level: string;
}

interface LedgerTransaction {
  id: string;
  stock_id?: string;
  warehouse_id: string;
  warehouse_name?: string;
  project_id: string;
  project_name?: string;
  project_code?: string;
  item_id: string;
  item_name?: string;
  unit_id?: string;
  unit_name?: string;
  staff_id: string;
  staff_name?: string;
  type?: 'in' | 'out' | string;
  qnty_in: string;
  qnty_out: string;
  current_stock: string;
  record_date: string;
  record_date_formatted?: string;
  record_time?: string;
  sys_remark?: string;
  active?: string;
}

interface SupplyLedgerProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockRow | null;
  projectName?: string;
  warehouseName?: string;
}

export default function SupplyLedger({
  isOpen,
  onClose,
  stock,
  projectName = '',
  warehouseName = ''
}: SupplyLedgerProps) {
  useModalEscape(isOpen, onClose, 200);

  const [ledgerList, setLedgerList] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fetch ledger transactions for a given page
  const fetchLedger = useCallback(
    async (pageToFetch: number, append: boolean = false) => {
      if (!stock) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zynapi.xlabz.space/webservices/v1/';

        const params = new URLSearchParams();
        params.set('project_id', String(stock.project_id));
        params.set('warehouse_id', String(stock.warehouse_id));
        params.set('item_id', String(stock.item_id));
        params.set('pagenum', String(pageToFetch));

        const endpoint = `${baseUrl}app/fetchWarehouseLedger?${params.toString()}`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`Server connection error (HTTP ${res.status})`);
        }

        const rawText = await res.text();
        const cleanedText = rawText.replace(/[\u0000-\u001f]/g, (ch) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return '';
        });

        let arr;
        try {
          arr = JSON.parse(cleanedText);
        } catch {
          throw new Error('Invalid JSON response received from server');
        }

        const data = Array.isArray(arr) ? arr[0] : arr;

        if (data && (String(data.Status) === '1' || data.Status === 1)) {
          const fetchedItems: LedgerTransaction[] = Array.isArray(data.ledger_data)
            ? data.ledger_data
            : Array.isArray(data.Data)
              ? data.Data
              : [];

          const total = parseInt(data.total_rows || '0', 10);
          const limit = parseInt(data.pagination_size || '10', 10);
          const calculatedTotalPages = parseInt(data.total_pages || '1', 10) || (total > 0 ? Math.ceil(total / limit) : 1);

          setTotalRows(total);
          setPageSize(limit > 0 ? limit : 10);
          setTotalPages(calculatedTotalPages);
          setCurrentPage(pageToFetch);

          if (append) {
            setLedgerList((prev) => {
              // Combine and deduplicate by transaction ID
              const existingIds = new Set(prev.map((item) => String(item.id)));
              const uniqueNewItems = fetchedItems.filter((item) => !existingIds.has(String(item.id)));
              return [...prev, ...uniqueNewItems];
            });
          } else {
            setLedgerList(fetchedItems);
          }
        } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
          if (!append) {
            setLedgerList([]);
            setTotalRows(0);
            setTotalPages(1);
          }
          if (data.Message && data.Message !== 'No records found' && data.Message !== 'No ledger records found') {
            toast.error(data.Message);
          }
        } else {
          if (!append) {
            setLedgerList([]);
            setTotalRows(0);
            setTotalPages(1);
          }
        }
      } catch (err: any) {
        console.error('Fetch Warehouse Ledger Error:', err);
        toast.error(err.message || 'Error fetching warehouse ledger records');
        if (!append) {
          setLedgerList([]);
          setTotalRows(0);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [stock]
  );

  // Trigger initial fetch when modal is opened
  useEffect(() => {
    if (isOpen && stock) {
      setCurrentPage(1);
      setTotalPages(1);
      setTotalRows(0);
      setLedgerList([]);
      fetchLedger(1, false);
    }
  }, [isOpen, stock, fetchLedger]);

  if (!isOpen || !stock) return null;

  // Handle load more records click
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore && !isLoading) {
      fetchLedger(currentPage + 1, true);
    }
  };

  const hasMore = currentPage < totalPages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-[#141a28] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] max-h-[920px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-gray-800 flex justify-between items-center bg-[#182032] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Stock Ledger
                {totalRows > 0 && (
                  <span className="text-xs font-mono font-normal text-blue-300 bg-blue-900/30 border border-blue-800/40 px-2 py-0.5 rounded-full">
                    {totalRows} transaction{totalRows === 1 ? '' : 's'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">Chronological stock ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLedger(1, false)}
              disabled={isLoading || isLoadingMore}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description / Summary Banner */}
        <div className="p-4 px-6 bg-[#0e1320] border-b border-gray-800/90 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Item */}
            <div className="flex items-center gap-2 min-w-0">
              <Boxes className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Item</div>
                <div className="font-bold text-white truncate" title={stock.item_name}>
                  {stock.item_name}
                </div>
              </div>
            </div>

            {/* Warehouse */}
            <div className="flex items-center gap-2 min-w-0">
              <Warehouse className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Warehouse</div>
                <div className="font-semibold text-gray-200 truncate" title={warehouseName}>
                  {warehouseName || `Warehouse #${stock.warehouse_id}`}
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Project</div>
                <div className="font-semibold text-gray-200 truncate" title={projectName}>
                  {projectName || `Project #${stock.project_id}`}
                </div>
              </div>
            </div>

            {/* Current Stock */}
            <div className="flex items-center justify-end sm:justify-start gap-2 min-w-0">
              <div className="text-right sm:text-left">
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">Closing Stock</div>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {stock.current_stock} {stock.unit_name || ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 bg-[#121724]">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-[#1a2234] border-b border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-14 text-center">SL</th>
                <th className="px-4 py-3 w-32">Date & Time</th>
                <th className="px-4 py-3 w-28 text-center">Type</th>
                <th className="px-4 py-3 w-24 text-right">In</th>
                <th className="px-4 py-3 w-24 text-right">Out</th>
                <th className="px-4 py-3 w-28 text-right">Balance</th>
                <th className="px-4 py-3 w-36">Recorded By</th>
                <th className="px-4 py-3 min-w-[240px]">System Remark</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-blue-500" />
                    <p className="text-sm font-medium">Fetching stock ledger entries...</p>
                  </td>
                </tr>
              ) : ledgerList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-500 italic">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-60" />
                    No chronological ledger entries found for this item and warehouse combination.
                  </td>
                </tr>
              ) : (
                ledgerList.map((row, idx) => {
                  const sl = idx + 1;
                  const isStockIn = parseInt(row.qnty_in || '0', 10) > 0 || row.type === 'in';
                  const isStockOut = parseInt(row.qnty_out || '0', 10) > 0 || row.type === 'out';
                  const unitLabel = row.unit_name || stock.unit_name || '';

                  return (
                    <tr
                      key={row.id || `${row.stock_id}-${idx}`}
                      className="hover:bg-[#1a2336] transition-colors"
                    >
                      {/* SL */}
                      <td className="px-4 py-3 text-center font-mono text-gray-400">{sl}</td>

                      {/* Date & Time */}
                      <td className="px-4 py-3 text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium text-white flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500 shrink-0" />
                            {row.record_date_formatted || row.record_date || '-'}
                          </span>
                          {row.record_time && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {row.record_time}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="px-4 py-3 text-center">
                        {isStockIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                            Stock IN
                          </span>
                        ) : isStockOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                            Stock OUT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-500/15 text-gray-300 border border-gray-500/30">
                            <Info className="w-3 h-3 text-gray-400" />
                            Initial
                          </span>
                        )}
                      </td>

                      {/* Qnty In */}
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {parseInt(row.qnty_in || '0', 10) > 0 ? (
                          <span className="text-emerald-400">
                            +{row.qnty_in} {unitLabel}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>

                      {/* Qnty Out */}
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {parseInt(row.qnty_out || '0', 10) > 0 ? (
                          <span className="text-rose-400">
                            -{row.qnty_out} {unitLabel}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>

                      {/* Balance Stock */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {row.current_stock} {unitLabel}
                      </td>

                      {/* Recorded By / Staff */}
                      <td className="px-4 py-3 text-gray-300">
                        <span className="inline-flex items-center gap-1 truncate max-w-[140px]" title={row.staff_name}>
                          <User className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate">{row.staff_name || `Staff #${row.staff_id}`}</span>
                        </span>
                      </td>

                      {/* System Remark */}
                      <td className="px-4 py-3 text-gray-400 max-w-sm whitespace-normal break-words text-[11px] leading-relaxed">
                        {row.sys_remark || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Load More Button Area (Appends records) */}
          {!isLoading && ledgerList.length > 0 && (
            <div className="p-4 border-t border-gray-800/80 bg-[#161c2b] flex items-center justify-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold bg-[#1e273b] hover:bg-[#2b3752] active:scale-95 text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-150 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      Loading Next Page...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-blue-400" />
                      Load More Records (Page {currentPage + 1} of {totalPages})
                    </>
                  )}
                </button>
              ) : (
                <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-gray-600" />
                  All {totalRows} chronological transactions loaded
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-gray-800 bg-[#182032] flex items-center justify-between text-xs text-gray-400 shrink-0">
          <div>
            Showing <span className="font-semibold text-white">{ledgerList.length}</span> of{' '}
            <span className="font-semibold text-white">{totalRows}</span> record{totalRows === 1 ? '' : 's'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-[#0e1320] hover:bg-gray-800 border border-gray-700/80 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
