import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Bot, FileText, CheckSquare, Square, Zap, 
  GraduationCap, Clipboard, Printer, CheckCircle, RefreshCw, 
  HelpCircle, ChevronRight, BookOpen, Clock, Download, Compass, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Article, MediaResource, ClubEvent, ClubFeedItem, UserProfile } from '../types';
import { generateCustomSynthesis, generateStudentPlaybook } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  articles: Article[];
  mediaResources: MediaResource[];
  events: ClubEvent[];
  clubFeedItems: ClubFeedItem[];
}

// Inline custom Markdown formatter for structured, eye-catching text output
function SynthesisMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 font-sans text-gray-800 leading-relaxed text-sm md:text-base">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm md:text-base font-black text-[#004d39] mt-6 mb-2 tracking-tight flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
              <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0" />
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base md:text-lg font-black text-gray-900 mt-7 mb-2 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#006a4e] rounded-full shrink-0" />
              {trimmed.replace('## ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg md:text-xl font-black text-[#006a4e] mt-8 mb-4 tracking-tighter">
              {trimmed.replace('# ', '')}
            </h2>
          );
        }
        
        // Bold/Key terms markers like **term**
        let renderedLine: React.ReactNode = line;
        if (line.includes('**')) {
          const parts = line.split('**');
          renderedLine = parts.map((part, pIdx) => pIdx % 2 === 1 ? (
            <strong key={pIdx} className="font-extrabold text-gray-950 bg-blue-50 px-1 py-0.5 rounded text-[13px] md:text-[14px] border border-blue-100/40">
              {part}
            </strong>
          ) : part);
        }

        // Bullets
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 bg-[#006a4e] rounded-full mt-2 shrink-0" />
              <span className="flex-1 text-xs md:text-sm text-gray-600 font-medium">{trimmed.slice(2)}</span>
            </div>
          );
        }
        
        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-black text-[#006a4e] shrink-0 text-xs mt-1">{numMatch[1]}.</span>
              <span className="flex-1 text-xs md:text-sm text-gray-600 font-medium">{numMatch[2]}</span>
            </div>
          );
        }

        // Divider
        if (trimmed === '---') {
          return <hr key={idx} className="border-gray-100 my-4" />;
        }

        // Standard Paragraph
        if (trimmed === '') return <div key={idx} className="h-1.5" />;
        
        return <p key={idx} className="text-xs md:text-sm text-gray-600 font-semibold">{renderedLine}</p>;
      })}
    </div>
  );
}

export default function AICampusSynthesizer({ profile, articles, mediaResources, events, clubFeedItems }: Props) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [synthesisStyle, setSynthesisStyle] = useState<'summary' | 'notes' | 'exam' | 'career'>('summary');
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customResult, setCustomResult] = useState('');
  
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbook, setPlaybook] = useState<any>(() => {
    const saved = localStorage.getItem('ru_student_synthesized_playbook');
    return saved ? JSON.parse(saved) : null;
  });

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ru_student_synthesis_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('ru_student_synthesis_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleResourceSelection = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleGenerateCustom = async () => {
    if (selectedResources.length === 0) return;
    
    setLoadingCustom(true);
    setCustomResult('');

    // Gather selected articles & media items
    const selectedItems = [
      ...articles.filter(a => selectedResources.includes(a.id || '')).map(a => ({
        title: a.title,
        contentOrDesc: a.content,
        type: 'Article/Guide'
      })),
      ...mediaResources.filter(m => selectedResources.includes(m.id || '')).map(m => ({
        title: m.title,
        contentOrDesc: m.description,
        type: `Multimedia Vault File (${m.type})`
      }))
    ];

    const studentProfileStr = `
      - Department: ${profile.studentDNA?.dept || 'Not Specified'}
      - Goals: ${profile.studentDNA?.goals || 'Not Specified'}
      - Study Year: ${profile.studentDNA?.year || 'Not Specified'}
      - Top Strengths: ${profile.studentDNA?.topStrengths || 'Not Specified'}
      - Motivations: ${profile.studentDNA?.motivation || 'Not Specified'}
    `;

    try {
      const result = await generateCustomSynthesis(selectedItems, synthesisStyle, studentProfileStr);
      setCustomResult(result || "Synthesis complete, but empty output was received.");
    } catch (e) {
      console.error(e);
      setCustomResult("Failed to complete AI synthesis. Please check your GEMINI_API_KEY.");
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleGeneratePlaybook = async () => {
    setPlaybookLoading(true);
    
    const studentProfileStr = `
      - Department: ${profile.studentDNA?.dept || 'Not Specified'}
      - Year: ${profile.studentDNA?.year || 'Not Specified'}
      - Career Goals: ${profile.studentDNA?.goals || 'Not Specified'}
      - Strengths: ${profile.studentDNA?.topStrengths || 'Not Specified'}
      - Obstacles: ${profile.studentDNA?.majorObstacle || 'Not Specified'}
      - Work Style: ${profile.studentDNA?.workStyle || 'Not Specified'}
    `;

    try {
      const data = await generateStudentPlaybook(studentProfileStr, articles, mediaResources, clubFeedItems, events);
      if (data) {
        setPlaybook(data);
        localStorage.setItem('ru_student_synthesized_playbook', JSON.stringify(data));
        
        // Reset checklist for new playbook
        const newChecklist: Record<string, boolean> = {};
        data.tacticalToDos?.forEach((todo: string) => {
          newChecklist[todo] = false;
        });
        setChecklist(newChecklist);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to synthesize Playbook. Verify your API Key configuration.");
    } finally {
      setPlaybookLoading(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(customResult);
    alert("Copied synthesized analysis to clipboard!");
  };

  const handlePrintResult = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>RU Informer AI Synthesis Report</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              h1 { color: #004d39; border-bottom: 2px solid #004d39; padding-bottom: 10px; }
              h2, h3, h4 { color: #006a4e; margin-top: 30px; }
              p, li { font-size: 14px; }
              strong { color: #000; }
            </style>
          </head>
          <body>
            <h1>AI Campus Synthesis Report</h1>
            <p><strong>Prepared for:</strong> ${profile.displayName || 'RU Student'}</p>
            <p><strong>Department:</strong> ${profile.studentDNA?.dept || 'Not Specified'}</p>
            <hr />
            <div>${customResult.replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const selectAllResources = () => {
    const allIds = [
      ...articles.map(a => a.id || ''),
      ...mediaResources.map(m => m.id || '')
    ].filter(id => id !== '');
    
    setSelectedResources(
      selectedResources.length === allIds.length ? [] : allIds
    );
  };

  return (
    <div className="space-y-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#004d39] to-[#003829] rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-48 h-48 text-[#ffd700]" />
        </div>
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Bot className="w-3.5 h-3.5 text-[#ffd700]" />
            Synthesizer Engine v3.5
          </div>
          <h2 className="text-2xl md:text-5xl font-display font-black tracking-tight leading-tight">
            AI Intelligence & Synthesis Center
          </h2>
          <p className="text-xs md:text-base text-white/70 font-medium leading-relaxed italic">
            "Every guideline, research brief, syllabus checklist, and extra-curricular milestone dynamically synthesized into your custom information demand."
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: DNA Playbook */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 pb-5 mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-display font-black text-gray-900">Personalized Playbook</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Grounded to your Student DNA</p>
              </div>
              <button 
                onClick={handleGeneratePlaybook}
                disabled={playbookLoading}
                className="p-3 bg-[#006a4e]/5 text-[#006a4e] hover:bg-[#006a4e] hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Synthesize Playbook"
              >
                <RefreshCw className={cn("w-4 h-4", playbookLoading && "animate-spin")} />
              </button>
            </div>

            {playbookLoading ? (
              <div className="py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#006a4e] animate-spin mx-auto" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Synthesizing full campus landscape...</p>
              </div>
            ) : playbook ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/20 rounded-2xl border border-blue-50/50">
                  <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest block mb-2">Executive AI Insight</span>
                  <p className="text-xs md:text-sm text-gray-700 font-bold leading-relaxed italic">
                    "{playbook.executiveSummary}"
                  </p>
                </div>

                {/* TSC Match */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">TSC Club & Event Strategy</span>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    {playbook.tscAlignment}
                  </p>
                </div>

                {/* Vault Study list */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Vault Resource Takeaways</span>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    {playbook.multimediaStudyGuide}
                  </p>
                </div>

                {/* Tactical checklists */}
                {playbook.tacticalToDos && playbook.tacticalToDos.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest block">Playbook Milestones ({Object.values(checklist).filter(Boolean).length}/{playbook.tacticalToDos.length})</span>
                    <div className="space-y-2">
                      {playbook.tacticalToDos.map((todo: string, idx: number) => {
                        const isDone = !!checklist[todo];
                        return (
                          <div 
                            key={idx}
                            onClick={() => setChecklist(prev => ({ ...prev, [todo]: !isDone }))}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                              isDone ? "bg-blue-50/50 border-blue-100 text-gray-400" : "bg-gray-50/50 border-gray-100 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <button className="shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-[#006a4e]" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300" />
                              )}
                            </button>
                            <span className={cn("text-xs font-semibold leading-tight", isDone && "line-through font-medium")}>
                              {todo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto border border-gray-100">
                  <Compass className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-800 uppercase tracking-wider">No synthesized playbook active</p>
                  <p className="text-[10px] text-gray-400 font-medium">Trigger an automated synthesis to scan the entire RU landscape matching your DNA.</p>
                </div>
                <button 
                  onClick={handleGeneratePlaybook}
                  className="px-6 py-2.5 bg-[#006a4e] text-[#ffd700] rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                >
                  Synthesize My Playbook
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: On-Demand Custom Synthesizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-lg md:text-xl font-display font-black text-gray-900">On-Demand Custom Synthesizer</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-6">Select documents, choose style, synthesize</p>

            <div className="space-y-6">
              {/* Document List Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select live documents to synthesize ({selectedResources.length} selected)</span>
                  <button 
                    onClick={selectAllResources}
                    className="text-[10px] font-black text-[#006a4e] uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    {selectedResources.length === (articles.length + mediaResources.length) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2">
                  {articles.map(art => {
                    const isSelected = selectedResources.includes(art.id || '');
                    return (
                      <div 
                        key={art.id}
                        onClick={() => toggleResourceSelection(art.id || '')}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left",
                          isSelected ? "bg-blue-50/40 border-blue-100/50" : "bg-white border-transparent hover:bg-gray-50"
                        )}
                      >
                        <button className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#006a4e]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-gray-800 truncate">{art.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Article</span>
                            <span className="text-[8px] font-bold text-gray-400 truncate">By {art.authorName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {mediaResources.map(media => {
                    const isSelected = selectedResources.includes(media.id || '');
                    return (
                      <div 
                        key={media.id}
                        onClick={() => toggleResourceSelection(media.id || '')}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left",
                          isSelected ? "bg-blue-50/40 border-blue-100/50" : "bg-white border-transparent hover:bg-gray-50"
                        )}
                      >
                        <button className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#006a4e]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-gray-800 truncate">{media.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded">{media.type}</span>
                            <span className="text-[8px] font-bold text-gray-400 truncate">{media.description.slice(0, 50)}...</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {articles.length === 0 && mediaResources.length === 0 && (
                    <p className="text-xs text-gray-400 font-bold text-center py-8 italic">No live document feeds available to synthesize.</p>
                  )}
                </div>
              </div>

              {/* Demand Type Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Choose synthesis style (User Information Demand)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'summary', label: 'Executive Summary', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'notes', label: 'Study Notes', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'exam', label: 'Exam prep kit', icon: <HelpCircle className="w-3.5 h-3.5" /> },
                    { id: 'career', label: 'Career Road map', icon: <Zap className="w-3.5 h-3.5" /> }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSynthesisStyle(style.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                        synthesisStyle === style.id 
                          ? "bg-[#006a4e] text-[#ffd700] border-[#006a4e]" 
                          : "bg-white text-gray-400 border-gray-100 hover:text-gray-900"
                      )}
                    >
                      {style.icon}
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Synthesize Button */}
              <button
                onClick={handleGenerateCustom}
                disabled={loadingCustom || selectedResources.length === 0}
                className="w-full py-4 bg-[#006a4e] text-[#ffd700] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-all shadow-md shadow-[#006a4e]/10 disabled:grayscale disabled:opacity-50"
              >
                {loadingCustom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing & Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Synthesize with AI ({selectedResources.length} Items)
                  </>
                )}
              </button>

              {/* Custom Result Render */}
              <AnimatePresence>
                {customResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-6 md:p-8 border border-blue-50 rounded-3xl bg-blue-50/10 space-y-6 text-left relative"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-800 uppercase tracking-widest">
                        <CheckSquare className="w-4 h-4 text-[#006a4e]" />
                        Synthesized Result Ready
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={handleCopyResult}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
                          title="Copy Report"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handlePrintResult}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
                          title="Print Report"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-inner max-h-96 overflow-y-auto">
                      <SynthesisMarkdown text={customResult} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
