import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { SystemUnderStudy, InterviewQuestion } from '../types';
import { api } from '../lib/api';

interface SystemsViewProps {
  systems: SystemUnderStudy[];
  onRefreshSystems: () => void;
  onLaunchInterviewForSystem: (system: SystemUnderStudy) => void;
}

export const SystemsView: React.FC<SystemsViewProps> = ({
  systems,
  onRefreshSystems,
  onLaunchInterviewForSystem,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemUnderStudy | null>(systems[0] || null);
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemType, setNewSystemType] = useState('Enterprise Application');
  const [newSystemDesc, setNewSystemDesc] = useState('');
  const [newSystemLifecycle, setNewSystemLifecycle] = useState<'existing' | 'proposed' | 'modernization'>('existing');
  const [isCreating, setIsCreating] = useState(false);

  // AI question suggestions
  const [suggestedQuestions, setSuggestedQuestions] = useState<InterviewQuestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemName.trim()) return;

    setIsCreating(true);
    try {
      const res = await api.systems.create({
        name: newSystemName,
        type: newSystemType,
        description: newSystemDesc,
        lifecycleState: newSystemLifecycle,
        targetRoles: ['End User', 'Operational Lead', 'System Architect'],
      });
      onRefreshSystems();
      setSelectedSystem(res.system);
      setShowCreateModal(false);
      setNewSystemName('');
      setNewSystemDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create system');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedSystem) return;
    setIsSuggesting(true);
    try {
      const res = await api.gemini.suggestQuestions({
        systemName: selectedSystem.name,
        systemType: selectedSystem.type,
        role: selectedSystem.targetRoles[0] || 'Stakeholder',
      });
      setSuggestedQuestions(res.questions);
    } catch (err: any) {
      alert(err.message || 'Suggestion failed');
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-heading">
            Systems & Interview Guides
          </h2>
          <p className="text-xs text-slate-400">
            Define system scope, target stakeholder personas, and generate AI questionnaires
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register System</span>
        </button>
      </div>

      {/* Grid: Systems List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Systems List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Systems ({systems.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {systems.map((sys) => {
              const isSelected = selectedSystem?.id === sys.id;
              return (
                <div
                  key={sys.id}
                  onClick={() => {
                    setSelectedSystem(sys);
                    setSuggestedQuestions([]);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{sys.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      {sys.lifecycleState}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{sys.description}</p>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {sys.type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected System Details & AI Questioning Protocol */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSystem ? (
            <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    System Profile
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5 font-heading">
                    {selectedSystem.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">{selectedSystem.description}</p>
                </div>

                <button
                  onClick={() => onLaunchInterviewForSystem(selectedSystem)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Target Stakeholders:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSystem.targetRoles?.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Question Protocol Generator */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gemini AI Question Protocol</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Auto-generate categorized questions covering workflows and pain points
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isSuggesting}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                  >
                    <span>{isSuggesting ? 'Generating...' : 'Generate with AI'}</span>
                  </button>
                </div>

                {suggestedQuestions.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {suggestedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400">
                            {q.category}
                          </span>
                          <span className="text-xs font-semibold text-white">{q.questionText}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">Rationale: {q.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
              Select a system to view details and questioning guide.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Create System */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full my-6 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">Register System Under Study</h3>
            <form onSubmit={handleCreateSystem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">System Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Supply Chain ERP"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Type / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Supply Chain, FinTech, EMR/EHR"
                  value={newSystemType}
                  onChange={(e) => setNewSystemType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Lifecycle State</label>
                <select
                  value={newSystemLifecycle}
                  onChange={(e: any) => setNewSystemLifecycle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="existing">Existing Legacy System</option>
                  <option value="modernization">Modernization & Migration</option>
                  <option value="proposed">Proposed Greenfield System</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Scope & Problem Statement</label>
                <textarea
                  rows={3}
                  placeholder="Describe the operational goals, pain points, and boundaries..."
                  value={newSystemDesc}
                  onChange={(e) => setNewSystemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {isCreating ? 'Saving...' : 'Save System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
