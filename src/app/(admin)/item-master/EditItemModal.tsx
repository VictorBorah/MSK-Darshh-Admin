import { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, Loader2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditItemModalProps {
  isOpen: boolean;
  itemId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditItemModal({ isOpen, itemId, onClose, onSuccess }: EditItemModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Master data lists
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    category_id: '',
    item_name: '',
    item_code: '',
    default_gst: '',
    vendor_id: '',
    unit_id: '',
    status: 1
  });

  const [isSaving, setIsSaving] = useState(false);

  // Add Category States
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [addCatData, setAddCatData] = useState({ category: '', description: '' });
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Add Unit States
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [addUnitData, setAddUnitData] = useState({ unit: '', abv: '' });
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  // Add Vendor States
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [addVendorData, setAddVendorData] = useState({ 
    vendor_name: '', 
    vendor_mobile: '', 
    vendor_address: '', 
    vendor_gst: '', 
    vendor_email: '' 
  });
  const [isAddingVendor, setIsAddingVendor] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchData();
    } else {
      // Reset State
      setFormData({
        category_id: '',
        item_name: '',
        item_code: '',
        default_gst: '',
        vendor_id: '',
        unit_id: '',
        status: 1
      });
    }
  }, [isOpen, itemId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      
      // Fetch Master Data
      const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}sys/fetch_projects_cfg_data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cfgRawText = await cfgRes.text();
      let cfgArr;
      try { cfgArr = JSON.parse(cfgRawText); } catch(e) { throw new Error('Invalid JSON for sys data'); }
      const cfgData = Array.isArray(cfgArr) ? cfgArr[0] : cfgArr;

      if (cfgData && String(cfgData.Status) === "1") {
        if (cfgData.item_categories_data) setCategories(cfgData.item_categories_data);
        if (cfgData.vendors) setVendors(cfgData.vendors);
        if (cfgData.units_data) setUnits(cfgData.units_data);
      } else {
        toast.error('Failed to load system dependencies.');
      }

      // Fetch Item Details
      const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/getItemDetails?item_id=${itemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detailsRawText = await detailsRes.text();
      let detailsArr;
      try { detailsArr = JSON.parse(detailsRawText); } catch(e) { throw new Error('Invalid JSON for item details'); }
      const detailsData = Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

      if (detailsData && String(detailsData.Status) === "1" && detailsData.item_data) {
        const iData = detailsData.item_data;
        setFormData({
          category_id: iData.category_id || '',
          item_name: iData.item_name || '',
          item_code: iData.item_code || '',
          default_gst: iData.default_gst || '',
          vendor_id: iData.default_vendor_id || '',
          unit_id: iData.unit_id || '',
          status: parseInt(iData.status) === 1 ? 1 : 0
        });
      } else {
        toast.error('Failed to load item details.');
      }

    } catch (e) {
      console.error(e);
      toast.error('Network error fetching configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!addCatData.category.trim()) {
      toast.error('Category name is mandatory.');
      return;
    }
    setIsAddingCat(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      payload.append('category', addCatData.category);
      if (addCatData.description) payload.append('description', addCatData.description);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveItemCategory`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1") {
        toast.success(response.Message || 'Category Added Successfully');
        
        const newCatId = String(response.master_category_id);
        const newCatName = response.master_category_name || addCatData.category;
        
        setCategories(prev => [...prev, {
          master_category_id: newCatId,
          master_category_name: newCatName
        }]);
        
        setFormData(prev => ({ ...prev, category_id: newCatId }));
        
        setShowAddCatModal(false);
        setAddCatData({ category: '', description: '' });
      } else {
        toast.error(response.Message || 'Failed to add category');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error communicating with endpoint.');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!addUnitData.unit.trim() || !addUnitData.abv.trim()) {
      toast.error('Both Unit name and Abbreviation are mandatory.');
      return;
    }
    setIsAddingUnit(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      payload.append('unit', addUnitData.unit);
      payload.append('abv', addUnitData.abv);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/saveUnit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1") {
        toast.success(response.Message || 'Unit Added Successfully');
        const newUnitId = String(response.id);
        
        setUnits(prev => [...prev, {
          id: newUnitId,
          unit: addUnitData.unit,
          abbv: addUnitData.abv
        }]);
        
        setFormData(prev => ({ ...prev, unit_id: newUnitId }));
        
        setShowAddUnitModal(false);
        setAddUnitData({ unit: '', abv: '' });
      } else {
        toast.error(response.Message || 'Failed to add unit');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error communicating with endpoint.');
    } finally {
      setIsAddingUnit(false);
    }
  };

  const handleSaveVendor = async () => {
    if (!addVendorData.vendor_name.trim() || !addVendorData.vendor_mobile.trim()) {
      toast.error('Vendor Name and Mobile Number are mandatory fields.');
      return;
    }
    setIsAddingVendor(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      payload.append('vendor_name', addVendorData.vendor_name);
      payload.append('vendor_mobile', addVendorData.vendor_mobile);
      if (addVendorData.vendor_address) payload.append('vendor_address', addVendorData.vendor_address);
      if (addVendorData.vendor_gst) payload.append('vendor_gst', addVendorData.vendor_gst);
      if (addVendorData.vendor_email) payload.append('vendor_email', addVendorData.vendor_email);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/addVendor`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1") {
        toast.success(response.Message || 'Vendor Added Successfully');
        
        const newVendorId = String(response.id);
        const newVendorName = response.vendor_name || addVendorData.vendor_name;
        
        setVendors(prev => [...prev, {
          id: newVendorId,
          vendor_name: newVendorName
        }]);
        
        setFormData(prev => ({ ...prev, vendor_id: newVendorId }));
        
        setShowAddVendorModal(false);
        setAddVendorData({ vendor_name: '', vendor_mobile: '', vendor_address: '', vendor_gst: '', vendor_email: '' });
      } else {
        toast.error(response.Message || 'Failed to add vendor');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error communicating with endpoint.');
    } finally {
      setIsAddingVendor(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!formData.item_code.trim() || !formData.item_name.trim() || !formData.category_id || formData.default_gst === '' || !formData.unit_id) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    if (!itemId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = new FormData();
      payload.append('items_csv', itemId);
      payload.append('status', String(formData.status));
      payload.append('category', formData.category_id);
      payload.append('item_name', formData.item_name);
      payload.append('item_code', formData.item_code);
      payload.append('gst_value', String(formData.default_gst));
      payload.append('unit_id', formData.unit_id);
      
      if (formData.vendor_id) {
        payload.append('vendor_id', formData.vendor_id);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}app/patchItem`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      const data = await res.json();
      const response = Array.isArray(data) ? data[0] : data;

      if (String(response.Status) === "1") {
        toast.success(response.Message || 'Item Updated');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.Message || 'Failed to update item');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error communicating with endpoint.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c2130] w-[600px] max-w-[95vw] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
          <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide flex items-center gap-2">
             <Edit3 className="w-5 h-5 text-blue-400" />
             Edit Item
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1 rounded-md hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-5 bg-[#161a25] max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading Item Details...</p>
             </div>
          ) : (
            <>
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] text-[#ccd6f6] font-medium block">Category <span className="text-red-400">*</span></label>
                    <button 
                      onClick={(e) => { e.preventDefault(); setShowAddCatModal(true); }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-transparent border-none outline-none"
                    >
                      + Add New Category
                    </button>
                  </div>
                  <Select
                    value={categories.find(c => String(c.master_category_id) === String(formData.category_id)) ? { value: String(formData.category_id), label: categories.find(c => String(c.master_category_id) === String(formData.category_id))?.master_category_name } : null}
                    options={categories.map((c: any) => ({ value: String(c.master_category_id), label: c.master_category_name }))}
                    onChange={(val: any) => setFormData({ ...formData, category_id: val ? val.value : '' })}
                    placeholder="Select category..."
                    styles={{
                      control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '40px', boxShadow: 'none' }),
                      menuPortal: base => ({ ...base, zIndex: 99999 }),
                      menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                      option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                      singleValue: base => ({ ...base, color: '#e2e8f0' }),
                      input: base => ({ ...base, color: '#e2e8f0' })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Item Code <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="E.g. ST-500"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Item Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="E.g. Steel Fe500"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] text-[#ccd6f6] font-medium block">Default Vendor</label>
                    <button 
                      onClick={(e) => { e.preventDefault(); setShowAddVendorModal(true); }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-transparent border-none outline-none"
                    >
                      + Add New Vendor
                    </button>
                  </div>
                  <Select
                    value={vendors.find(v => String(v.id) === String(formData.vendor_id)) ? { value: String(formData.vendor_id), label: vendors.find(v => String(v.id) === String(formData.vendor_id))?.vendor_name } : null}
                    options={vendors.map((v: any) => ({ value: String(v.id), label: String(v.vendor_name) }))}
                    onChange={(val: any) => setFormData({ ...formData, vendor_id: val ? val.value : '' })}
                    placeholder="Select default vendor..."
                    isClearable
                    styles={{
                      control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '40px', boxShadow: 'none' }),
                      menuPortal: base => ({ ...base, zIndex: 99999 }),
                      menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                      option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                      singleValue: base => ({ ...base, color: '#e2e8f0' }),
                      input: base => ({ ...base, color: '#e2e8f0' })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] text-[#ccd6f6] font-medium block">Unit <span className="text-red-400">*</span></label>
                    <button 
                      onClick={(e) => { e.preventDefault(); setShowAddUnitModal(true); }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-transparent border-none outline-none"
                    >
                      + Add New Unit
                    </button>
                  </div>
                  <Select
                    value={units.find(u => String(u.id) === String(formData.unit_id)) ? { value: String(formData.unit_id), label: units.find(u => String(u.id) === String(formData.unit_id))?.unit } : null}
                    options={units.map((u: any) => ({ value: String(u.id), label: String(u.unit) }))}
                    onChange={(val: any) => setFormData({ ...formData, unit_id: val ? val.value : '' })}
                    placeholder="Select unit..."
                    styles={{
                      control: (base, state) => ({ ...base, backgroundColor: '#1e293b', borderColor: state.isFocused ? '#3b82f6' : '#334155', minHeight: '40px', boxShadow: 'none' }),
                      menuPortal: base => ({ ...base, zIndex: 99999 }),
                      menu: base => ({ ...base, backgroundColor: '#1f2536', border: '1px solid #374151' }),
                      option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent', color: state.isSelected ? '#fff' : '#e2e8f0', cursor: 'pointer' }),
                      singleValue: base => ({ ...base, color: '#e2e8f0' }),
                      input: base => ({ ...base, color: '#e2e8f0' })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Default GST (%) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={formData.default_gst}
                    onChange={(e) => setFormData({ ...formData, default_gst: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="18.00"
                  />
                </div>
                <div>
                   <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Status</label>
                   <div className="flex items-center h-[40px]">
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="sr-only peer" 
                         checked={formData.status === 1}
                         onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                       />
                       <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                     </label>
                     <span className="ml-3 text-sm font-medium text-gray-300">
                       {formData.status === 1 ? 'Active' : 'Disabled'}
                     </span>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateItem}
            disabled={loading || isSaving}
            className="px-6 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded transition-colors shadow-sm flex items-center justify-center min-w-[120px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Item'}
          </button>
        </div>

      </div>

      {/* ADD CATEGORY NESTED MODAL */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c2130] w-[450px] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
            {isAddingCat && (
              <div className="absolute inset-0 bg-[#1c2130]/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-blue-300 font-medium tracking-wide animate-pulse">Pushing Category...</p>
              </div>
            )}
            
            <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
              <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide">Add New Category</h2>
              <button onClick={() => setShowAddCatModal(false)} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 bg-[#161a25]">
              <div>
                <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Category Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addCatData.category}
                  onChange={(e) => setAddCatData({ ...addCatData, category: e.target.value })}
                  className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                  placeholder="E.g. Electrical Components"
                />
              </div>
              <div>
                <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Description <span className="text-gray-500 ml-1">(Optional)</span></label>
                <textarea
                  value={addCatData.description}
                  onChange={(e) => setAddCatData({ ...addCatData, description: e.target.value })}
                  className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md p-3 text-[#e2e8f0] text-sm transition-colors outline-none min-h-[80px]"
                  placeholder="Description of category..."
                />
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3">
              <button
                onClick={() => setShowAddCatModal(false)}
                disabled={isAddingCat}
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isAddingCat}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded transition-colors shadow-sm"
              >
                Add Category
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ADD UNIT NESTED MODAL */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c2130] w-[450px] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
            {isAddingUnit && (
              <div className="absolute inset-0 bg-[#1c2130]/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-blue-300 font-medium tracking-wide animate-pulse">Pushing Unit...</p>
              </div>
            )}
            
            <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
              <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide">Add New Unit</h2>
              <button onClick={() => setShowAddUnitModal(false)} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 bg-[#161a25]">
              <div>
                <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Unit Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addUnitData.unit}
                  onChange={(e) => setAddUnitData({ ...addUnitData, unit: e.target.value })}
                  className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                  placeholder="E.g. Kilogram"
                />
              </div>
              <div>
                <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Abbreviation <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addUnitData.abv}
                  onChange={(e) => setAddUnitData({ ...addUnitData, abv: e.target.value })}
                  className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                  placeholder="E.g. KG"
                />
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3">
              <button
                onClick={() => setShowAddUnitModal(false)}
                disabled={isAddingUnit}
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUnit}
                disabled={isAddingUnit}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded transition-colors shadow-sm"
              >
                Add Unit
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ADD VENDOR NESTED MODAL */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c2130] w-[550px] max-w-[95vw] border border-gray-700/80 rounded-xl shadow-2xl flex flex-col relative overflow-hidden">
            {isAddingVendor && (
              <div className="absolute inset-0 bg-[#1c2130]/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-blue-300 font-medium tracking-wide animate-pulse">Pushing Vendor...</p>
              </div>
            )}
            
            <div className="px-5 py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1e2436]">
              <h2 className="text-[16px] text-[#e2e8f0] font-semibold tracking-wide">Add New Vendor</h2>
              <button onClick={() => setShowAddVendorModal(false)} className="text-gray-400 hover:text-white transition-colors outline-none bg-transparent border-none p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5 bg-[#161a25] max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Vendor Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={addVendorData.vendor_name}
                    onChange={(e) => setAddVendorData({ ...addVendorData, vendor_name: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="E.g. XYZ Materials"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Mobile Number <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={addVendorData.vendor_mobile}
                    onChange={(e) => setAddVendorData({ ...addVendorData, vendor_mobile: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="10-digit Mobile No."
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Address <span className="text-gray-500 ml-1">(Optional)</span></label>
                <textarea
                  value={addVendorData.vendor_address}
                  onChange={(e) => setAddVendorData({ ...addVendorData, vendor_address: e.target.value })}
                  className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md p-3 text-[#e2e8f0] text-sm transition-colors outline-none min-h-[60px]"
                  placeholder="Enter vendor address..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">GST Number <span className="text-gray-500 ml-1">(Optional)</span></label>
                  <input
                    type="text"
                    value={addVendorData.vendor_gst}
                    onChange={(e) => setAddVendorData({ ...addVendorData, vendor_gst: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none uppercase"
                    placeholder="E.g. 29ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#ccd6f6] font-medium mb-1.5 block">Email <span className="text-gray-500 ml-1">(Optional)</span></label>
                  <input
                    type="email"
                    value={addVendorData.vendor_email}
                    onChange={(e) => setAddVendorData({ ...addVendorData, vendor_email: e.target.value })}
                    className="w-full bg-[#1e293b] border border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md h-[40px] px-3 text-[#e2e8f0] text-sm transition-colors outline-none"
                    placeholder="vendor@example.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-gray-700/50 bg-[#1e2436] flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowAddVendorModal(false)}
                disabled={isAddingVendor}
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVendor}
                disabled={isAddingVendor}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded transition-colors shadow-sm"
              >
                Add Vendor
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
