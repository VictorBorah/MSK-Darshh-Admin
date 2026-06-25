import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Trash2, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdditionalExpensesProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  paymentModes: any[];
  initialExpenses: any[];
  onAdd: (expenses: any[]) => void;
}

export default function AdditionalExpenses({
  isOpen,
  onClose,
  projectId,
  paymentModes,
  initialExpenses,
  onAdd
}: AdditionalExpensesProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const lastSearchedQuery = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with initialExpenses when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpensesList(initialExpenses || []);
      setItemSearch('');
      setSearchResults([]);
      setShowSearchDropdown(false);
      lastSearchedQuery.current = '';
    }
  }, [isOpen, initialExpenses]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic (debounced)
  useEffect(() => {
    if (itemSearch.length === 0) {
      if (lastSearchedQuery.current !== '') {
        lastSearchedQuery.current = '';
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
      return;
    }

    if (!projectId) return;

    if (itemSearch.length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    if (itemSearch === lastSearchedQuery.current) return;

    const performSearch = async () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearching(true);
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}app/searchItem?query_str=${encodeURIComponent(itemSearch)}&project_id=${projectId}`;

        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });

        const rawText = await res.text();
        let arr;
        try { arr = JSON.parse(rawText); } catch (e) { throw new Error('Invalid JSON response'); }
        const data = Array.isArray(arr) ? arr[0] : arr;

        if (data && String(data.Status) === '1' && data.items_data) {
          setSearchResults(data.items_data);
          setShowSearchDropdown(true);
          lastSearchedQuery.current = itemSearch;
        } else {
          setSearchResults([]);
          setShowSearchDropdown(true);
          lastSearchedQuery.current = itemSearch;
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [itemSearch, projectId]);

  const handleSelectItem = (item: any) => {
    // Prevent duplicate entries in expensesList
    const isDuplicate = expensesList.some(e => String(e.item_id) === String(item.item_id));
    if (isDuplicate) {
      toast.error('Item already added');
      return;
    }

    // Default payment mode is the first available one
    const defaultPaymentMode = paymentModes && paymentModes.length > 0 ? String(paymentModes[0].id) : '';

    const newExpense = {
      id: Math.random().toString(36).substr(2, 9),
      item_id: String(item.item_id),
      item_name: item.item_name,
      unit_price: item.default_price ? String(item.default_price).replace(/[^0-9.]/g, '') : '0.00',
      qnty: 1,
      payment_mode: defaultPaymentMode,
      total_price: item.default_price ? String(item.default_price).replace(/[^0-9.]/g, '') : '0.00'
    };

    setExpensesList(prev => [...prev, newExpense]);
    setItemSearch('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    lastSearchedQuery.current = '';
  };

  const handleRowChange = (rowId: string, field: string, value: any) => {
    setExpensesList(prev =>
      prev.map(row => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [field]: value };
          // Dynamically compute total price
          if (field === 'unit_price' || field === 'qnty') {
            const up = parseFloat(updatedRow.unit_price) || 0;
            const q = parseFloat(updatedRow.qnty) || 0;
            updatedRow.total_price = (up * q).toFixed(2);
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleRemoveRow = (rowId: string) => {
    setExpensesList(prev => prev.filter(row => row.id !== rowId));
  };

  const handleAddExpenses = () => {
    // Validation: qnty !== 0, unit_price !== 0 or empty, and payment_mode is not null or empty
    for (const expense of expensesList) {
      const up = parseFloat(expense.unit_price);
      const q = parseFloat(expense.qnty);

      if (isNaN(up) || up <= 0 || expense.unit_price === '') {
        toast.error(`Please enter a valid non-zero rate for "${expense.item_name}"`);
        return;
      }
      if (isNaN(q) || q <= 0) {
        toast.error(`Please enter a valid non-zero quantity for "${expense.item_name}"`);
        return;
      }
      if (!expense.payment_mode) {
        toast.error(`Please select a payment mode for "${expense.item_name}"`);
        return;
      }
    }

    onAdd(expensesList);
    onClose();
  };

  const grandTotal = expensesList.reduce((acc, row) => acc + (parseFloat(row.total_price) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`bg-[#232b3e] border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-[750px] max-w-[95vw] h-[80vh] max-h-[80vh] rounded-xl'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[15px] font-bold text-white tracking-wide uppercase">
            Add additional expenses
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Toggle Size"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#161a25] flex flex-col gap-6">
          {/* Search Item field */}
          <div className="flex flex-col gap-2" ref={searchContainerRef}>
            <label className="text-[13px] font-medium text-gray-300">Search item</label>
            <div className="relative">
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Type Item Name here..."
                className="w-full bg-[#1b202c] border border-gray-600 rounded pl-9 pr-8 py-2 text-white text-[13px] focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />

              <div className="absolute right-2 top-2.5 flex items-center gap-2">
                {isSearching && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                {itemSearch && (
                  <button
                    onClick={() => {
                      setItemSearch('');
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Clear Search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#191e2b] border border-gray-700 rounded shadow-2xl z-[150] max-h-[220px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-gray-400 text-center italic">No items found</div>
                  ) : (
                    <ul className="py-1">
                      {searchResults.map((result: any) => (
                        <li
                          key={result.item_id}
                          onClick={() => handleSelectItem(result)}
                          className="px-4 py-2 hover:bg-[#11141e] cursor-pointer text-[13px] text-gray-300 border-b border-gray-700/50 last:border-0 transition-colors flex justify-between items-center"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{result.item_name}</span>
                            <span className="text-[11px] text-gray-500">{result.category_name} &bull; {result.unit_name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 italic mt-0.5">Min. 3 Characters</span>
          </div>

          {/* Table */}
          <div className="flex-1 bg-[#1b202c] border border-gray-700 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[350px]">
              <table className="w-full text-[13px] text-left">
                <thead className="bg-[#232b3e] text-gray-400 border-b border-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold w-12 text-center">SL</th>
                    <th className="px-4 py-2.5 font-semibold">ITEM</th>
                    <th className="px-4 py-2.5 font-semibold w-24 text-center">RATE</th>
                    <th className="px-4 py-2.5 font-semibold w-24 text-center">QNTY</th>
                    <th className="px-4 py-2.5 font-semibold w-40 text-center">PAYMENT MODE</th>
                    <th className="px-4 py-2.5 font-semibold w-24 text-right">TOTAL</th>
                    <th className="px-4 py-2.5 font-semibold w-16 text-center">REMOVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {expensesList.map((row, index) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-400">{index + 1}.</td>
                      <td className="px-4 py-3 text-white font-medium break-words max-w-[150px]">
                        {row.item_name}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unit_price}
                          onChange={(e) => handleRowChange(row.id, 'unit_price', e.target.value)}
                          className="w-full bg-white text-gray-900 text-center font-medium border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={row.qnty}
                          onChange={(e) => handleRowChange(row.id, 'qnty', e.target.value)}
                          className="w-full bg-white text-gray-900 text-center font-medium border border-gray-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.payment_mode}
                          onChange={(e) => handleRowChange(row.id, 'payment_mode', e.target.value)}
                          className="w-full bg-[#11141e] border border-gray-600 rounded px-2 py-1 text-white text-[13px] focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Select Mode</option>
                          {paymentModes?.map((mode: any) => (
                            <option key={mode.id} value={String(mode.id)}>
                              {mode.mode}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 font-semibold">
                        {parseFloat(row.total_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expensesList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 italic">
                        No additional expenses added. Search and select items above to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700 bg-[#1b202c] shrink-0 flex justify-between items-center">
          <div className="border border-green-500/50 bg-[#142323] px-4 py-2 rounded-md">
            <span className="text-[13px] font-semibold text-green-400">
              Total additional expenses: &nbsp; ₹ {grandTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded font-medium text-[13px] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAddExpenses}
              disabled={expensesList.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded font-medium text-[13px] transition-colors shadow-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
