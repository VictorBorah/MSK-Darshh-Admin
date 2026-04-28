'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const SearchableSelect = ({ options, value, onChange, name, placeholder = "Select Option" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => String(o.value) === String(value));

  const filteredOptions = options
    .filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5); // display max 5 options

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none cursor-pointer flex justify-between items-center"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
      >
        <span className="truncate pr-2">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#e5e7eb] border border-gray-300 rounded shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-300 bg-white relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
            <input
              type="text"
              className="w-full bg-transparent text-black text-[13px] pl-6 pr-2 py-0.5 focus:outline-none font-medium placeholder:text-gray-400"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-[13px] cursor-pointer font-medium ${String(opt.value) === String(value) ? 'bg-blue-100 text-blue-800' : 'text-black hover:bg-gray-200'}`}
                onClick={() => {
                  onChange({ target: { name, value: String(opt.value), type: 'select' } });
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            )) : (
              <div className="px-3 py-2 text-[13px] text-gray-500 italic">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function SystemSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [sysData, setSysData] = useState<any>({});
  const [tdsOptions, setTdsOptions] = useState<any[]>([]);
  const [budgetHeads, setBudgetHeads] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('at_ki8Xq1iV');
        const [appRes, sysRes, cfgRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/admin/fetchAppData`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_system_config`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const appText = await appRes.text();
        const sysText = await sysRes.text();
        const cfgText = await cfgRes.text();

        let appArr, sysArr, cfgArr;
        try { appArr = JSON.parse(appText); } catch (e) { }
        try { sysArr = JSON.parse(sysText); } catch (e) { }
        try { cfgArr = JSON.parse(cfgText); } catch (e) { }

        const appData = Array.isArray(appArr) ? appArr[0] : appArr;
        const sysConfigData = Array.isArray(sysArr) ? sysArr[0] : sysArr;
        const projCfgData = Array.isArray(cfgArr) ? cfgArr[0] : cfgArr;

        if (appData && String(appData.Status) === '1') {
          setSysData(appData.System_Data || {});
        } else {
          toast.error('Failed to load system settings');
        }

        if (sysConfigData && String(sysConfigData.Status) === '1') {
          setTdsOptions(sysConfigData.tds_options || []);
        }

        if (projCfgData && String(projCfgData.Status) === '1') {
          setBudgetHeads(projCfgData.budget_heads_array || []);
        }
      } catch (err) {
        toast.error('An error occurred while fetching settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setSysData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? '1' : '0') : value
    }));
  };

  // Safe resolvers for Pagination values
  const paginationVal = sysData?.paginationRowNum || sysData?.pagination_size || '10';
  const reportsVal = sysData?.reports_rownum || sysData?.paginationReportSize || '200';

  // Dynamically inject backend values if they aren't standard to ensure Auto-Selection works
  const pagOptions = [10, 20, 50, 100, 200, 500];
  if (paginationVal && !pagOptions.includes(Number(paginationVal))) pagOptions.push(Number(paginationVal));
  const repOptions = [10, 20, 50, 100, 200, 500];
  if (reportsVal && !repOptions.includes(Number(reportsVal))) repOptions.push(Number(reportsVal));

  pagOptions.sort((a, b) => a - b);
  repOptions.sort((a, b) => a - b);

  return (
    <div className="p-4 md:p-8 relative min-h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-300 font-medium text-[13px] tracking-wide">Loading Settings...</p>
        </div>
      )}

      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-white mb-1">Settings <span className="text-yellow-400 text-[12px]">[Under Development]</span></h1>
        <p className="text-[13px] text-[#8b9bb4] font-medium tracking-wide">These settings apply globally to the entire system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Column 1: App information */}
        <div className="bg-[#1b202c] rounded-lg p-6 border border-gray-800 shadow-sm flex flex-col gap-6">
          <div className="w-full">
            <h2 className="text-[14px] font-bold text-white mb-2">App information</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">App name</label>
            <input
              type="text"
              name="appName"
              onChange={handleInputChange}
              value={sysData?.appName || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">App Abbreviation</label>
            <input
              type="text"
              name="appAbbreviation"
              onChange={handleInputChange}
              value={sysData?.appAbbreviation || 'ZYN'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">H.O Address</label>
            <textarea
              name="hoAddress"
              onChange={handleInputChange}
              rows={4}
              value={sysData?.hoAddress || 'Biswanath Chariali,\nPIN: 784176\nAssam'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Phone 1</label>
            <input
              type="text"
              name="phone1"
              onChange={handleInputChange}
              value={sysData?.phone1 || '+91-9954817725'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Phone 2</label>
            <input
              type="text"
              name="phone2"
              onChange={handleInputChange}
              value={sysData?.phone2 || '+91-5542127801'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Company Email</label>
            <input
              type="text"
              name="companyEmail"
              onChange={handleInputChange}
              value={sysData?.companyEmail || 'helpdesk@zynnetwork.in'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Column 2: App Settings */}
        <div className="bg-[#1b202c] rounded-lg p-6 border border-gray-800 shadow-sm flex flex-col gap-6">
          <div className="w-full">
            <h2 className="text-[14px] font-bold text-white mb-2">App Settings</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">API Base URI</label>
            <input
              type="text"
              name="appBaseUrl"
              onChange={handleInputChange}
              value={sysData?.appBaseUrl || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">S3 Compatible Bucket URI</label>
            <input
              type="text"
              name="s3BucketBasePath"
              onChange={handleInputChange}
              value={sysData?.s3BucketBasePath || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">S3 Compatible Bucket Name</label>
            <input
              type="text"
              name="s3BucketName"
              onChange={handleInputChange}
              value={sysData?.s3BucketName || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Pagination Size in UI (Rows)</label>
            <SearchableSelect
              name="paginationRowNum"
              onChange={handleInputChange}
              value={paginationVal}
              options={pagOptions.map(opt => ({ value: String(opt), label: `${opt} Rows` }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Pagination Size for Reports (Rows)</label>
            <SearchableSelect
              name="reports_rownum"
              onChange={handleInputChange}
              value={reportsVal}
              options={repOptions.map(opt => ({ value: String(opt), label: `${opt} Rows` }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Cookie Session Timeout (Seconds)</label>
            <input
              type="text"
              name="cookieTimeout"
              onChange={handleInputChange}
              value={sysData?.cookieTimeout || '3600'}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">SMS PE ID</label>
            <input
              type="text"
              name="smsPEId"
              onChange={handleInputChange}
              value={sysData?.smsPEId || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Column 3: App Settings continued */}
        <div className="bg-[#1b202c] rounded-lg p-6 border border-gray-800 shadow-sm flex flex-col gap-6">
          <div className="w-full">
            <h2 className="text-[14px] font-bold text-white mb-2">App Settings</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Upload Max File Size (MB)</label>
            <input
              type="text"
              name="fileMaxSize"
              onChange={handleInputChange}
              value={sysData?.fileMaxSize || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Default GST Rate (%)</label>
            <input
              type="text"
              name="default_gst"
              onChange={handleInputChange}
              value={sysData?.default_gst || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Default CGST Rate (%)</label>
            <input
              type="text"
              name="default_cgst_rate"
              onChange={handleInputChange}
              value={sysData?.default_cgst_rate || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Default SGST Rate (%)</label>
            <input
              type="text"
              name="default_sgst_rate"
              onChange={handleInputChange}
              value={sysData?.default_sgst_rate || ''}
              className="w-full bg-[#e5e7eb] border-0 rounded text-black text-[13px] px-3 py-2.5 font-bold focus:outline-none"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3 mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendEmail" onChange={handleInputChange} checked={String(sysData?.sendEmail) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Send Emails</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendEmailForDemand" onChange={handleInputChange} checked={String(sysData?.sendEmailForDemand) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Send Email for every demand</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendEmailForPo" onChange={handleInputChange} checked={String(sysData?.sendEmailForPo) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Send Email for every purchase order</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendEmailForPoFulfillment" onChange={handleInputChange} checked={String(sysData?.sendEmailForPoFulfillment) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Send Email for every purchase order fulfillment</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="sendEmailForPayment" onChange={handleInputChange} checked={String(sysData?.sendEmailForPayment) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Send Email for every payment request</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="showDemandsInAdmin" onChange={handleInputChange} checked={String(sysData?.showDemandsInAdmin) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Show demands panel in Admin</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="gst_inclusive" onChange={handleInputChange} checked={String(sysData?.gst_inclusive) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">GST is inclusive</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="autoTdsDeduction" onChange={handleInputChange} checked={String(sysData?.autoTdsDeduction) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Auto TDS Deduction</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="auto_create_demands_from_diff" onChange={handleInputChange} checked={String(sysData?.auto_create_demands_from_diff) === '1'} className="w-4 h-4 bg-transparent border-white text-white rounded cursor-pointer" />
              <span className="text-[12px] font-normal text-white">Auto create new demand for differences in purchases</span>
            </label>
          </div>

        </div>

        {/* Column 4: App Settings TDS */}
        <div className="bg-[#1b202c] rounded-lg p-6 border border-gray-800 shadow-sm flex flex-col gap-6">
          <div className="w-full">
            <h2 className="text-[14px] font-bold text-white mb-2">App Settings</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Select TDS Option 1</label>
            <SearchableSelect
              name="tds_percent1"
              onChange={handleInputChange}
              value={sysData?.tds_percent1 ? String(sysData.tds_percent1) : ''}
              options={tdsOptions.map((opt: any) => ({ value: String(opt.id), label: `${parseFloat(opt.tds_option).toFixed(2)}%` }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Select TDS Option 2</label>
            <SearchableSelect
              name="tds_percent2"
              onChange={handleInputChange}
              value={sysData?.tds_percent2 ? String(sysData.tds_percent2) : ''}
              options={tdsOptions.map((opt: any) => ({ value: String(opt.id), label: `${parseFloat(opt.tds_option).toFixed(2)}%` }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Default Budget head for Purchases</label>
            <SearchableSelect
              name="purchase_budget_head"
              onChange={handleInputChange}
              value={sysData?.purchase_budget_head ? String(sysData.purchase_budget_head) : ''}
              options={budgetHeads.map((head: any) => ({ value: String(head.id), label: head.head }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-normal text-white tracking-wide">Default Budget head for Payments</label>
            <SearchableSelect
              name="payment_budget_head"
              onChange={handleInputChange}
              value={sysData?.payment_budget_head ? String(sysData.payment_budget_head) : ''}
              options={budgetHeads.map((head: any) => ({ value: String(head.id), label: head.head }))}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
