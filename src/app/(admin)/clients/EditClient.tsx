'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Loader2, 
  AlertTriangle,
  IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
  client_id: string;
  client_name: string;
  client_address: string | null;
  contract_amount?: string;
  client_mobile_1: string;
  client_mobile_2: string;
  client_email: string;
  added_on: string;
}

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

export default function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [contractAmount, setContractAmount] = useState('0.00');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate fields when modal opens with selected client details
  useEffect(() => {
    if (isOpen && client) {
      setClientName(client.client_name || '');
      setEmail(client.client_email || '');
      setMobile1(client.client_mobile_1 || '');
      setMobile2(client.client_mobile_2 || '');
      setContractAmount(client.contract_amount || '0.00');
      setAddress(client.client_address || '');
    } else {
      setClientName('');
      setEmail('');
      setMobile1('');
      setMobile2('');
      setContractAmount('0.00');
      setAddress('');
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Client Name is mandatory');
      return;
    }
    if (!mobile1.trim()) {
      toast.error('Mobile 1 is mandatory');
      return;
    }
    if (!address.trim()) {
      toast.error('Address is mandatory');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('at_ki8Xq1iV');
      const payload = {
        client_id: client.client_id,
        client_name: clientName.trim(),
        email: email.trim(),
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim(),
        contract_amount: contractAmount.trim() || '0.00',
        address: address.trim()
      };

      const formData = new FormData();
      formData.append('json_data', JSON.stringify([payload]));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}admin/patchClient`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let arr;
      try { arr = JSON.parse(text); } catch { throw new Error('Invalid JSON response'); }
      const data = Array.isArray(arr) ? arr[0] : arr;

      if (data && (String(data.Status) === '1' || data.Status === 1)) {
        toast.success(data.Message || 'Client details updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data?.Message || 'Failed to update client details');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error occurred while updating client details';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <form 
        onSubmit={handleSubmit}
        className="bg-[#232b3e] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden w-[600px] max-w-[95vw] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#293653] shrink-0">
          <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" /> Edit Client: {client.client_name}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#11141e] flex flex-col gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          
          {/* Client Name (Mandatory) */}
          <div className="space-y-1">
            <label className="text-[12px] text-gray-400 block font-semibold">
              Client Name <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. John Cena"
              className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Email Address (Optional) */}
          <div className="space-y-1">
            <label className="text-[12px] text-gray-400 block font-semibold">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. client@domain.com"
              className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Mobiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mobile 1 (Mandatory) */}
            <div className="space-y-1">
              <label className="text-[12px] text-gray-400 block font-semibold">
                Mobile 1 <span className="text-red-400">*</span>
              </label>
              <input 
                type="number" 
                value={mobile1}
                onChange={(e) => setMobile1(e.target.value)}
                placeholder="e.g. 9954871105"
                className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Mobile 2 (Optional) */}
            <div className="space-y-1">
              <label className="text-[12px] text-gray-400 block font-semibold">Mobile 2</label>
              <input 
                type="number" 
                value={mobile2}
                onChange={(e) => setMobile2(e.target.value)}
                placeholder="e.g. 4512021478"
                className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Contract Amount (Optional) */}
          <div className="space-y-1">
            <label className="text-[12px] text-gray-400 block font-semibold">Contract Amount</label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="number" 
                step="0.01"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                placeholder="e.g. 548000.00"
                className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg pl-10 pr-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Permanent Address (Mandatory) */}
          <div className="space-y-1">
            <label className="text-[12px] text-gray-400 block font-semibold">
              Address <span className="text-red-400">*</span>
            </label>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Biswanath Chariali, Tezpur"
              rows={3}
              className="w-full bg-[#161a25] border border-gray-600 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Fields marked in * are mandatory
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1f2536] flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-[13px] font-semibold transition-colors border border-gray-700"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
