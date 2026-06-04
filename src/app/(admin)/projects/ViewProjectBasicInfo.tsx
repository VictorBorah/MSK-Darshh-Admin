'use client';

import { X, MapPin, Copy, Mail, Calendar, Compass, Building, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useModalEscape } from '@/hooks/useModalEscape';
import { useTheme } from '@/components/providers/ThemeProvider';

// Brand icon components for premium look
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.538-.196 1.006.128.832.957z" />
  </svg>
);

interface ViewProjectBasicInfoProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    project_id: string;
    project_name: string;
    project_code: string;
    district: string;
    current_stage: string;
    site_address: string;
    start_date: string;
    site_coordinates: string;
  } | null;
}

export default function ViewProjectBasicInfo({ isOpen, onClose, project }: ViewProjectBasicInfoProps) {
  useModalEscape(isOpen, onClose, 200);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen || !project) return null;

  // Safe Coordinates extraction
  const getCoordinates = (coordsStr: string) => {
    if (!coordsStr) return null;
    const parts = coordsStr.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const coords = getCoordinates(project.site_coordinates);
  const mapLink = project.site_coordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.site_coordinates)}`
    : '';

  // Share handlers
  const copyCoordinates = () => {
    if (!project.site_coordinates) return;
    navigator.clipboard.writeText(project.site_coordinates);
    toast.success('Coordinates copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    if (!mapLink) return;
    const text = `Project Location for ${project.project_name}: ${mapLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaTelegram = () => {
    if (!mapLink) return;
    window.open(`https://telegram.me/share/url?url=${encodeURIComponent(mapLink)}&text=${encodeURIComponent(`Project Location for ${project.project_name}`)}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!mapLink) return;
    const subject = `Project Location: ${project.project_name}`;
    const body = `Here is the GPS location for the project ${project.project_name} (${project.project_code}):\n\nGoogle Maps Link: ${mapLink}\nCoordinates: ${project.site_coordinates}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Theme-aware styles configuration
  const modalBg = isDark ? 'bg-[#1c2130] border-gray-700/80' : 'bg-white border-slate-200';
  const headerBg = isDark ? 'bg-[#1c2130] border-gray-700/40' : 'bg-slate-50 border-slate-200';
  const labelColor = isDark ? 'text-gray-400' : 'text-slate-500';
  const textValColor = isDark ? 'text-white' : 'text-slate-900';
  const detailsBoxBg = isDark ? 'bg-[#121620] border-gray-800/60' : 'bg-slate-50/60 border-slate-200/50';

  return (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-opacity animate-in fade-in duration-200">
      <div className={`border rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative w-[700px] max-w-[95vw] overflow-hidden transition-all duration-300 ${modalBg}`}>
        
        {/* Header */}
        <div className={`px-6 py-4.5 border-b flex justify-between items-center ${headerBg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-600/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Landmark className="w-5 h-5" />
            </div>
            <h2 className={`text-[16px] font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Project Basic Info
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className={`transition-colors p-1.5 rounded-md border-0 bg-transparent ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
          
          {/* Section 1: Details Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 p-4.5 rounded-lg border ${detailsBoxBg}`}>
            
            {/* Project Name */}
            <div className="col-span-2 flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Project Name</span>
              <span className={`text-[14.5px] font-bold ${textValColor}`}>{project.project_name || '-'}</span>
            </div>

            {/* Project Code */}
            <div className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Project Code</span>
              <span className="text-[13.5px] font-bold text-blue-500 font-mono">{project.project_code || '-'}</span>
            </div>

            {/* District */}
            <div className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>District</span>
              <span className={`text-[13.5px] font-semibold ${textValColor}`}>{project.district || '-'}</span>
            </div>

            {/* Current Stage */}
            <div className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Current Stage</span>
              <span className="text-[13px] font-semibold text-amber-500">{project.current_stage || '-'}</span>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Start Date</span>
              <span className={`text-[13px] font-semibold ${textValColor} flex items-center gap-1.5`}>
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                {project.start_date || '-'}
              </span>
            </div>

            {/* Site Address */}
            <div className="col-span-2 md:col-span-3 flex flex-col gap-1 mt-1 border-t border-gray-700/10 md:border-t-0 pt-2 md:pt-0">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>Site Address</span>
              <span className={`text-[13.5px] font-semibold ${textValColor}`}>{project.site_address || '-'}</span>
            </div>

          </div>

          {/* Section 2: Maps and Sharing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Google Map embed */}
            <div className="flex flex-col gap-2">
              <span className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${labelColor}`}>
                <Compass className="w-4 h-4 text-blue-500" /> GPS Map Location
              </span>
              
              <div className={`w-full h-[250px] rounded-lg overflow-hidden border ${isDark ? 'border-gray-800 bg-[#121620]' : 'border-slate-200 bg-slate-50'} flex items-center justify-center`}>
                {coords ? (
                  <iframe
                    title="Project GPS Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <MapPin className="w-8 h-8 text-gray-500 animate-bounce" />
                    <span className="text-xs text-gray-400">GPS location coordinate data not set</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sharing links */}
            <div className="flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className={`text-[12px] font-bold uppercase tracking-wider ${labelColor}`}>Share Coordinates</span>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Export this project's site location link instantly over Messaging, Email, or Clipboard channels.
                </p>
              </div>

              {/* Coordinates display box */}
              {project.site_coordinates && (
                <div className={`px-3 py-2.5 rounded-lg border font-mono text-[12.5px] font-semibold flex items-center justify-between ${isDark ? 'bg-[#121620] border-gray-800 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="truncate mr-2">{project.site_coordinates}</span>
                  <button 
                    onClick={copyCoordinates}
                    className={`p-1.5 rounded hover:bg-opacity-80 transition-colors shrink-0 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20`}
                    title="Copy Coordinates"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Share Channels Grid */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* WhatsApp */}
                <button
                  onClick={shareViaWhatsApp}
                  disabled={!project.site_coordinates}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs text-white bg-[#25D366] hover:bg-[#20ba59] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-[1.02]"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  WhatsApp
                </button>

                {/* Telegram */}
                <button
                  onClick={shareViaTelegram}
                  disabled={!project.site_coordinates}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs text-white bg-[#0088cc] hover:bg-[#0077b3] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-[1.02]"
                >
                  <TelegramIcon className="w-4 h-4" />
                  Telegram
                </button>

                {/* Email */}
                <button
                  onClick={shareViaEmail}
                  disabled={!project.site_coordinates}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-[1.02] ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
                >
                  <Mail className="w-4 h-4" />
                  Email Location
                </button>

                {/* Copy Coordinates */}
                <button
                  onClick={copyCoordinates}
                  disabled={!project.site_coordinates}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-[1.02] ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
                >
                  <Copy className="w-4 h-4" />
                  Copy Coords
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
