'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import { changelogMarkdown } from '@/data/changelogData';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  GitCommit,
  Calendar,
  Tag,
  Search,
  Copy,
  Check,
  Download,
  Code2,
  FileText,
  Sparkles,
  Layers,
  Filter,
  RefreshCw,
  Eye,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReleaseItem {
  id: string;
  date: string;
  title: string;
  fullHeading: string;
  rawMarkdown: string;
  renderedHtml: string;
  hasAdded: boolean;
  hasChanged: boolean;
  hasFixed: boolean;
  hasSecurity: boolean;
}

export default function Changelog() {
  const { frontendVersion } = useAuth();
  const [content, setContent] = useState<string>(changelogMarkdown);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'rendered' | 'raw'>('timeline');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [expandedReleases, setExpandedReleases] = useState<Record<string, boolean>>({});

  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }, []);

  // Attempt to fetch latest changelog.md from public folder for live updates, fallback to bundled data
  const refreshChangelog = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/changelog.md?_t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          setContent(text);
          toast.success('Changelog updated to latest release notes');
        }
      } else {
        toast('Using bundled changelog data');
      }
    } catch {
      toast('Using bundled changelog data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Parse markdown into structured releases
  const releases = useMemo<ReleaseItem[]>(() => {
    const rawBlocks = content.split(/(?=^##\s+\[)/m);
    const parsedList: ReleaseItem[] = [];

    rawBlocks.forEach((block, index) => {
      const headerMatch = block.match(/^##\s+\[([\d-]+)\]\s*-\s*(.+)$/m);
      if (headerMatch) {
        const date = headerMatch[1];
        const title = headerMatch[2].trim();
        const fullHeading = `[${date}] - ${title}`;

        // Strip the ## line for body rendering inside card
        const bodyMarkdown = block.replace(/^##\s+\[([\d-]+)\]\s*-\s*.+$/m, '').trim();
        const renderedHtml = marked.parse(bodyMarkdown) as string;

        parsedList.push({
          id: `release-${index}-${date}`,
          date,
          title,
          fullHeading,
          rawMarkdown: block,
          renderedHtml,
          hasAdded: /###\s+Added/i.test(block),
          hasChanged: /###\s+Changed/i.test(block),
          hasFixed: /###\s+Fixed/i.test(block),
          hasSecurity: /###\s+Security/i.test(block)
        });
      }
    });

    return parsedList;
  }, [content]);

  // Filtered releases based on search query and category
  const filteredReleases = useMemo(() => {
    return releases.filter((rel) => {
      // Category filter
      if (activeCategory === 'added' && !rel.hasAdded) return false;
      if (activeCategory === 'changed' && !rel.hasChanged) return false;
      if (activeCategory === 'fixed' && !rel.hasFixed) return false;
      if (activeCategory === 'security' && !rel.hasSecurity) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rel.title.toLowerCase().includes(q);
        const matchDate = rel.date.toLowerCase().includes(q);
        const matchContent = rel.rawMarkdown.toLowerCase().includes(q);
        return matchTitle || matchDate || matchContent;
      }

      return true;
    });
  }, [releases, activeCategory, searchQuery]);

  // Overall rendered HTML for the full document view
  const fullRenderedHtml = useMemo(() => {
    return marked.parse(content) as string;
  }, [content]);

  // Copy raw markdown to clipboard
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      toast.success('Changelog markdown copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Download changelog.md file
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'changelog.md';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded changelog.md');
  };

  // Toggle single release collapse
  const toggleCollapse = (id: string) => {
    setExpandedReleases((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate statistics
  const totalReleases = releases.length;
  const latestRelease = releases[0];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
              <GitCommit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                System Changelog
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 tracking-normal">
                  v{frontendVersion || '1.0.1'}
                </span>
              </h1>
              <p className="text-[13px] text-[#8b9bb4] mt-0.5">
                Chronological ledger of features, architecture updates, fixes, and security enhancements across ZYN modules.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={refreshChangelog}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191e2b] hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold rounded-md border border-gray-700 transition-colors shadow-sm"
            title="Refresh changelog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191e2b] hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold rounded-md border border-gray-700 transition-colors shadow-sm"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy .md'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            title="Download Changelog Markdown File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalReleases}</div>
            <div className="text-[12px] text-gray-400 font-medium">Logged Releases</div>
          </div>
        </div>

        <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-base font-bold text-white truncate">{latestRelease?.date || 'Today'}</div>
            <div className="text-[12px] text-gray-400 font-medium">Latest Deployment</div>
          </div>
        </div>

        <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white">v{frontendVersion || '1.0.1'}</div>
            <div className="text-[12px] text-gray-400 font-medium">Active Production</div>
          </div>
        </div>

        <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live & Deployed
            </div>
            <div className="text-[12px] text-gray-400 font-medium">Development Status</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters & View Toggle */}
      <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search release notes, features, fixes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#11141e] border border-gray-700/80 rounded-md pl-9 pr-8 py-2 text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#11141e] p-1 rounded-md border border-gray-800 shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Timeline Cards</span>
            </button>

            <button
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                viewMode === 'rendered'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Document</span>
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                viewMode === 'raw'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw Markdown</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Active in Timeline Mode) */}
        {viewMode === 'timeline' && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-800/80 text-xs">
            <span className="text-gray-400 font-semibold flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-teal-400" /> Filter:
            </span>

            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              All Entries ({releases.length})
            </button>

            <button
              onClick={() => setActiveCategory('added')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeCategory === 'added'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-emerald-300 border border-transparent'
              }`}
            >
              Added
            </button>

            <button
              onClick={() => setActiveCategory('changed')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeCategory === 'changed'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-sky-300 border border-transparent'
              }`}
            >
              Changed
            </button>

            <button
              onClick={() => setActiveCategory('fixed')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeCategory === 'fixed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-amber-300 border border-transparent'
              }`}
            >
              Fixed
            </button>

            <button
              onClick={() => setActiveCategory('security')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeCategory === 'security'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-gray-800/60 text-gray-400 hover:text-purple-300 border border-transparent'
              }`}
            >
              Security
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {filteredReleases.length === 0 ? (
            <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-12 text-center">
              <AlertCircle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No releases match your criteria</h3>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search terms or clearing the category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredReleases.map((rel, idx) => {
              const isCollapsed = expandedReleases[rel.id] === true;
              return (
                <div
                  key={rel.id}
                  className="bg-[#191e2b] border border-gray-800/90 rounded-lg overflow-hidden shadow-sm hover:border-gray-700 transition-all"
                >
                  {/* Release Card Header */}
                  <div
                    onClick={() => toggleCollapse(rel.id)}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                  >
                    <div className="flex items-start md:items-center gap-3 flex-1 flex-col md:flex-row">
                      {/* Date Badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold shrink-0 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{rel.date}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                        {rel.title}
                      </h2>
                    </div>

                    {/* Category Tags & Collapse Arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      {rel.hasAdded && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          Added
                        </span>
                      )}
                      {rel.hasChanged && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-950/60 text-sky-400 border border-sky-500/30">
                          Changed
                        </span>
                      )}
                      {rel.hasFixed && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          Fixed
                        </span>
                      )}
                      {rel.hasSecurity && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-950/60 text-purple-400 border border-purple-500/30">
                          Security
                        </span>
                      )}

                      <div className="p-1 rounded text-gray-400 hover:text-white transition-colors">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Release Content */}
                  {!isCollapsed && (
                    <div className="px-5 pb-5 pt-1 border-t border-gray-800/60 bg-[#161a25]/50">
                      <div
                        className="changelog-prose pt-3"
                        dangerouslySetInnerHTML={{ __html: rel.renderedHtml }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Full Document View */}
      {viewMode === 'rendered' && (
        <div className="bg-[#191e2b] border border-gray-800 rounded-lg p-6 md:p-8 shadow-sm">
          <div
            className="changelog-prose max-w-none"
            dangerouslySetInnerHTML={{ __html: fullRenderedHtml }}
          />
        </div>
      )}

      {/* Raw Markdown View */}
      {viewMode === 'raw' && (
        <div className="bg-[#0f1422] border border-gray-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-[#191e2b] border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" /> changelog.md ({content.split('\n').length} lines)
            </span>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-5 font-mono text-xs md:text-[13px] text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
