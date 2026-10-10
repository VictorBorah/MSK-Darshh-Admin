'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import {
  Boxes,
  RotateCcw,
  RefreshCcw,
  Loader2,
  ArrowRightLeft,
  BookOpen,
  Edit,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import UpdateStockModal from './UpdateStockModal';
import SupplyLedger from './SupplyLedger';
import TransferStockModal from './TransferStockModal';

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
  record_date?: string;
  record_time?: string;
  sys_remark?: string;
}

interface ProjectOption {
  project_id?: string;
  id?: string;
  project_name: string;
  project_code: string;
}

interface WarehouseOption {
  id: string;
  warehouse_name: string;
  default_warehouse?: string;
}

interface ItemOption {
  id: string;
  item_name: string;
}

export default function SupplyLedgerPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Lookups master data
  const [projectsList, setProjectsList] = useState<ProjectOption[]>([]);
  const [warehousesList, setWarehousesList] = useState<WarehouseOption[]>([]);
  const [itemsList, setItemsList] = useState<ItemOption[]>([]);
  const [isLookupsLoading, setIsLookupsLoading] = useState(false);

  // Filter States
  const [selectedProject, setSelectedProject] = useState<{ value: string; label: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ value: string; label: string } | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ value: string; label: string } | null>(null);

  // Table Data State
  const [stockList, setStockList] = useState<StockRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Update Stock Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedStockForUpdate, setSelectedStockForUpdate] = useState<StockRow | null>(null);

  // Supply Ledger Modal State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedStockForLedger, setSelectedStockForLedger] = useState<StockRow | null>(null);

  // Transfer Stock Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStockForTransfer, setSelectedStockForTransfer] = useState<StockRow | null>(null);

  // Quick lookup maps
  const projectsMap = useMemo(() => {
    const map = new Map<string, ProjectOption>();
    projectsList.forEach((p) => {
      const id = String(p.project_id || p.id);
      map.set(id, p);
    });
    return map;
  }, [projectsList]);

  const warehousesMap = useMemo(() => {
    const map = new Map<string, WarehouseOption>();
    warehousesList.forEach((w) => {
      map.set(String(w.id), w);
    });
    return map;
  }, [warehousesList]);

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Lookups (Projects & Items from sys/fetch_system_config, Warehouses from admin/fetchWarehouses)
  const fetchLookups = useCallback(async () => {
    setIsLookupsLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zynapi.xlabz.space/webservices/v1/';

      // 1. Fetch System Config for Items and Projects
      const configRes = await fetch(`${baseUrl}sys/fetch_system_config`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (configRes.ok) {
        const text = await configRes.text();
        const cleanedText = text.replace(/[\u0000-\u001f]/g, (ch) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return '';
        });
        const parsed = JSON.parse(cleanedText);
        const configData = Array.isArray(parsed) ? parsed[0] : parsed;

        if (configData && (String(configData.Status) === '1' || configData.Status === 1)) {
          if (Array.isArray(configData.items_data)) {
            setItemsList(configData.items_data);
          }
          if (Array.isArray(configData.projects_data)) {
            setProjectsList(configData.projects_data);
          }
        }
      }

      // 2. Fetch Warehouses master list
      const whRes = await fetch(`${baseUrl}admin/fetchWarehouses?pagenum=1`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (whRes.ok) {
        const whText = await whRes.text();
        const cleanedWhText = whText.replace(/[\u0000-\u001f]/g, (ch) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return '';
        });
        const parsedWh = JSON.parse(cleanedWhText);
        const whData = Array.isArray(parsedWh) ? parsedWh[0] : parsedWh;

        if (whData && Array.isArray(whData.warehouse_data)) {
          setWarehousesList(whData.warehouse_data);
        }
      }
    } catch (err) {
      console.error('Error loading lookups for warehouse stock:', err);
    } finally {
      setIsLookupsLoading(false);
    }
  }, []);

  // Fetch Warehouse Stock Data
  const fetchWarehouseStockData = useCallback(
    async (
      page = currentPage,
      projId = selectedProject?.value || '',
      itemId = selectedItem?.value || '',
      whId = selectedWarehouse?.value || ''
    ) => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://zynapi.xlabz.space/webservices/v1/';

        const params = new URLSearchParams();
        params.set('pagenum', String(page));

        if (projId && projId.trim() !== '') {
          params.set('project_id', projId.trim());
        }
        if (itemId && itemId.trim() !== '') {
          params.set('item_id', itemId.trim());
        }
        if (whId && whId.trim() !== '') {
          params.set('warehouse_id', whId.trim());
        }

        const endpoint = `${baseUrl}app/fetchWarehouseStock?${params.toString()}`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
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

        let parsed;
        try {
          parsed = JSON.parse(cleanedText);
        } catch {
          throw new Error('Invalid JSON received from server');
        }

        const data = Array.isArray(parsed) ? parsed[0] : parsed;

        if (data && (String(data.Status) === '1' || data.Status === 1)) {
          const list = Array.isArray(data.inventory_data) ? data.inventory_data : [];
          setStockList(list);

          const total = parseInt(data.total_rows || '0', 10);
          const paginationSize = parseInt(data.pagination_size || '10', 10);
          setTotalRows(total);
          setPageSize(paginationSize > 0 ? paginationSize : 10);
          setTotalPages(total && paginationSize ? Math.ceil(total / paginationSize) : 1);
          setCurrentPage(page);
        } else if (data && (String(data.Status) === '0' || data.Status === 0)) {
          setStockList([]);
          setTotalRows(0);
          setTotalPages(1);
          if (data.Message && data.Message !== 'No records found') {
            toast.error(data.Message);
          }
        } else {
          setStockList([]);
          setTotalRows(0);
          setTotalPages(1);
        }
      } catch (err: any) {
        console.error('Fetch warehouse stock error:', err);
        toast.error(err.message || 'Error fetching warehouse stock');
        setStockList([]);
        setTotalRows(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, selectedProject, selectedItem, selectedWarehouse]
  );

  // Initial lookup fetch
  useEffect(() => {
    if (isMounted) {
      fetchLookups();
    }
  }, [isMounted, fetchLookups]);

  // Refetch when filters or page change
  useEffect(() => {
    if (isMounted) {
      fetchWarehouseStockData(
        currentPage,
        selectedProject?.value || '',
        selectedItem?.value || '',
        selectedWarehouse?.value || ''
      );
    }
  }, [isMounted, currentPage, selectedProject, selectedItem, selectedWarehouse, fetchWarehouseStockData]);

  // Handle Reset filters
  const handleReset = () => {
    setSelectedProject(null);
    setSelectedItem(null);
    setSelectedWarehouse(null);
    setCurrentPage(1);
    fetchWarehouseStockData(1, '', '', '');
    toast.success('Filters reset to default');
  };

  // Handle Reload
  const handleReload = () => {
    fetchWarehouseStockData(
      currentPage,
      selectedProject?.value || '',
      selectedItem?.value || '',
      selectedWarehouse?.value || ''
    );
  };

  // Helper lookups
  const getProjectCode = (projectId: string) => {
    const proj = projectsMap.get(String(projectId));
    if (proj) {
      return proj.project_code || proj.project_name || `PROJ-${projectId}`;
    }
    return `PROJ-${projectId}`;
  };

  const getWarehouseName = (warehouseId: string) => {
    const wh = warehousesMap.get(String(warehouseId));
    if (wh) {
      return wh.warehouse_name;
    }
    return `Warehouse #${warehouseId}`;
  };

  // Transfer Button Action
  const handleTransfer = (row: StockRow) => {
    setSelectedStockForTransfer(row);
    setIsTransferModalOpen(true);
  };

  const handleViewLedger = (row: StockRow) => {
    setSelectedStockForLedger(row);
    setIsLedgerModalOpen(true);
  };

  const handleUpdate = (row: StockRow) => {
    setSelectedStockForUpdate(row);
    setIsUpdateModalOpen(true);
  };

  // Select dropdown styling for dark theme
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',
      minHeight: '36px',
      cursor: 'pointer'
    }),
    singleValue: (base: any) => ({ ...base, color: '#f3f4f6', fontSize: '13px', fontWeight: '500' }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '13px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#191e2b',
      border: '1px solid #374151',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#27324b' : 'transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      padding: '8px 12px'
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({ ...base, color: '#9ca3af', padding: '0 6px' }),
    clearIndicator: (base: any) => ({ ...base, color: '#9ca3af', padding: '0 6px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
    input: (base: any) => ({ ...base, color: '#fff' })
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 text-gray-300 bg-[#0e1320] min-h-full flex flex-col space-y-5">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse Stock</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time chronological warehouse inventory levels and stock movement ledger
          </p>
        </div>

        {/* Global Refresh indicator */}
        <div className="flex items-center gap-2">
          {isLookupsLoading && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing Master Config...
            </span>
          )}
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-[#141a28] border border-gray-800/80 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Filters Group: Project, Item, Warehouse */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Filter 1: Project */}
            <div className="flex items-center border border-gray-700/80 rounded-lg bg-[#0d121c] px-2 h-10 w-full sm:w-[220px]">
              <span className="text-[12px] font-semibold text-gray-400 px-2 uppercase tracking-wider whitespace-nowrap">
                Project
              </span>
              <div className="h-5 w-[1px] bg-gray-700/60 mr-1"></div>
              <Select
                options={[
                  { value: '', label: 'All Projects' },
                  ...projectsList.map((p) => ({
                    value: String(p.project_id || p.id),
                    label: p.project_code ? `${p.project_code} - ${p.project_name}` : p.project_name
                  }))
                ]}
                value={selectedProject}
                onChange={(val) => {
                  setSelectedProject(val && val.value !== '' ? val : null);
                  setCurrentPage(1);
                }}
                placeholder="All Projects"
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="flex-1"
                isClearable
              />
            </div>

            {/* Filter 2: Item */}
            <div className="flex items-center border border-gray-700/80 rounded-lg bg-[#0d121c] px-2 h-10 w-full sm:w-[240px]">
              <span className="text-[12px] font-semibold text-gray-400 px-2 uppercase tracking-wider whitespace-nowrap">
                Item
              </span>
              <div className="h-5 w-[1px] bg-gray-700/60 mr-1"></div>
              <Select
                options={[
                  { value: '', label: 'All Items' },
                  ...itemsList.map((item) => ({
                    value: String(item.id),
                    label: item.item_name
                  }))
                ]}
                value={selectedItem}
                onChange={(val) => {
                  setSelectedItem(val && val.value !== '' ? val : null);
                  setCurrentPage(1);
                }}
                placeholder="All Items"
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="flex-1"
                isClearable
              />
            </div>

            {/* Filter 3: Warehouse */}
            <div className="flex items-center border border-gray-700/80 rounded-lg bg-[#0d121c] px-2 h-10 w-full sm:w-[240px]">
              <span className="text-[12px] font-semibold text-gray-400 px-2 uppercase tracking-wider whitespace-nowrap">
                Warehouse
              </span>
              <div className="h-5 w-[1px] bg-gray-700/60 mr-1"></div>
              <Select
                options={[
                  { value: '', label: 'All Warehouses' },
                  ...warehousesList.map((wh) => ({
                    value: String(wh.id),
                    label: wh.warehouse_name
                  }))
                ]}
                value={selectedWarehouse}
                onChange={(val) => {
                  setSelectedWarehouse(val && val.value !== '' ? val : null);
                  setCurrentPage(1);
                }}
                placeholder="All Warehouses"
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                className="flex-1"
                isClearable
              />
            </div>
          </div>

          {/* Action Buttons: Reset & Reload */}
          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold bg-[#111624] hover:bg-[#1a2133] transition-colors shadow-sm"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={handleReload}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold bg-[#111624] hover:bg-[#1a2133] transition-colors shadow-sm disabled:opacity-50"
              title="Reload warehouse stock data"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              Reload
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Table Card */}
      <div className="bg-[#141a28] border border-gray-800/80 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1">
        <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-gray-700">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider bg-[#1a2234] border-b border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">SL</th>
                <th className="px-5 py-3.5">Project Code</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Item</th>
                <th className="px-5 py-3.5">Qnty</th>
                <th className="px-4 py-3.5 text-center w-28">Transfer</th>
                <th className="px-4 py-3.5 text-center w-32">View Ledger</th>
                <th className="px-4 py-3.5 text-center w-28">Update</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/70 bg-[#121724]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-blue-500" />
                    <p className="text-sm font-medium">Fetching warehouse stock levels...</p>
                  </td>
                </tr>
              ) : stockList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500 italic">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-60" />
                    No warehouse stock records found for the selected filters.
                  </td>
                </tr>
              ) : (
                stockList.map((row, idx) => {
                  const sl = (currentPage - 1) * pageSize + idx + 1;
                  const isLowStock = String(row.low_level) === '1' || row.low_level === '1';

                  return (
                    <tr
                      key={row.stock_id || `${row.warehouse_id}-${row.item_id}-${idx}`}
                      className="hover:bg-[#1a2336] transition-colors group"
                    >
                      {/* SL */}
                      <td className="px-5 py-3.5 text-center font-mono text-xs text-gray-400">{sl}</td>

                      {/* Project Code */}
                      <td className="px-5 py-3.5 font-medium text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#1d273d] text-blue-300 border border-blue-900/40">
                          {getProjectCode(row.project_id)}
                        </span>
                      </td>

                      {/* Warehouse */}
                      <td className="px-5 py-3.5 text-gray-300 font-medium">
                        {getWarehouseName(row.warehouse_id)}
                      </td>

                      {/* Item */}
                      <td className="px-5 py-3.5 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <span>{row.item_name}</span>
                          {isLowStock && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              title="Stock is at or below reorder level"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Qnty (Quantity + Unit) */}
                      <td className="px-5 py-3.5 font-semibold text-gray-100">
                        <span>
                          {row.current_stock}
                          {row.unit_name ? ` ${row.unit_name}` : ''}
                        </span>
                      </td>

                      {/* Transfer Action Button */}
                      <td className="px-4 py-3.5 text-center">
                        {(() => {
                          const stockNum = parseFloat(row.current_stock || '0');
                          const isZeroStock = isNaN(stockNum) || stockNum <= 0;
                          return (
                            <button
                              onClick={() => handleTransfer(row)}
                              disabled={isZeroStock}
                              className={`inline-flex items-center justify-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 ${
                                isZeroStock
                                  ? 'bg-gray-800/80 text-gray-500 border border-gray-700/50 cursor-not-allowed opacity-50'
                                  : 'bg-[#0070f3] hover:bg-blue-600 active:scale-95 text-white cursor-pointer'
                              }`}
                              title={
                                isZeroStock
                                  ? 'Zero stock available: cannot transfer'
                                  : `Initiate transfer for ${row.item_name}`
                              }
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Transfer
                            </button>
                          );
                        })()}
                      </td>

                      {/* View Ledger Action Button */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleViewLedger(row)}
                          className="inline-flex items-center justify-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] active:scale-95 text-slate-200 border border-slate-700/80 font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                          title={`View chronological ledger for ${row.item_name}`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          View Ledger
                        </button>
                      </td>

                      {/* Update Action Button */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleUpdate(row)}
                          className="inline-flex items-center justify-center gap-1.5 bg-[#059669] hover:bg-[#10b981] active:scale-95 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                          title={`Update stock count for ${row.item_name}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div className="p-4 border-t border-gray-800 bg-[#161c2b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div>
            Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span> ({totalRows} Total rows fetched)
          </div>

          <div className="flex items-center gap-4">
            {/* Rows Per Page Indicator */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <span className="font-semibold text-gray-200 bg-[#101522] border border-gray-700/70 px-2 py-1 rounded">
                {pageSize}
              </span>
            </div>

            {/* Pagination Prev & Next Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-700/80 bg-[#111624] text-gray-300 hover:text-white hover:bg-[#192033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>

              <button
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-700/80 bg-[#111624] text-gray-300 hover:text-white hover:bg-[#192033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Warehouse Stock Modal */}
      <UpdateStockModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedStockForUpdate(null);
        }}
        stock={selectedStockForUpdate}
        projectName={selectedStockForUpdate ? getProjectCode(selectedStockForUpdate.project_id) : ''}
        warehouseName={selectedStockForUpdate ? getWarehouseName(selectedStockForUpdate.warehouse_id) : ''}
        onSuccess={() => {
          fetchWarehouseStockData(
            currentPage,
            selectedProject?.value || '',
            selectedItem?.value || '',
            selectedWarehouse?.value || ''
          );
        }}
      />

      {/* Stock Ledger Modal */}
      <SupplyLedger
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setSelectedStockForLedger(null);
        }}
        stock={selectedStockForLedger}
        projectName={selectedStockForLedger ? getProjectCode(selectedStockForLedger.project_id) : ''}
        warehouseName={selectedStockForLedger ? getWarehouseName(selectedStockForLedger.warehouse_id) : ''}
      />

      {/* Transfer Stock Modal */}
      <TransferStockModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedStockForTransfer(null);
        }}
        stock={selectedStockForTransfer}
        projectsList={projectsList}
        warehousesList={warehousesList}
        itemsList={itemsList}
        onSuccess={() => {
          fetchWarehouseStockData(
            currentPage,
            selectedProject?.value || '',
            selectedItem?.value || '',
            selectedWarehouse?.value || ''
          );
        }}
      />
    </div>
  );
}
