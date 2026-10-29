import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PROVIDERS, SANDBOX_MODES } from '../services/providers'
import {
  X,
  CheckCircle2,
  Server,
  Shield,
  Database,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react'

export const SettingsModal = () => {
  const {
    isDemoMode,
    providerId,
    updateProviderId,
    sandboxMode,
    updateSandboxMode,
    closeModal,
  } = useApp()

  const [selectedProvider, setSelectedProvider] = useState(providerId)
  const [selectedSandbox, setSelectedSandbox] = useState(sandboxMode)

  const handleSave = () => {
    updateProviderId(selectedProvider)
    updateSandboxMode(selectedSandbox)
    closeModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body (Fixed: overflow-x-hidden, no horizontal scroll) */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden text-slate-300">
          {/* Metadata Integration Card (Secure: API key is kept in .env and NOT exposed in UI) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  The Movie Database (TMDB) API
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit">
                <CheckCircle2 className="w-3 h-3" />
                {isDemoMode ? 'Demo Mode' : 'Connected & Active'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time metadata, artwork, cast rosters, and episodic rundowns are securely linked via your codebase configuration (<code className="text-rose-300 font-mono text-[11px]">.env</code>). Your private credentials are protected and never displayed in the app interface.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Private key securely loaded at build time</span>
            </div>
          </div>

          {/* Default Embed Server Provider */}
          <div className="space-y-3 pt-2">
            <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-400" />
              <span>Default Stream Server Provider</span>
            </label>
            <p className="text-xs text-slate-400">
              Choose which player host loads by default. You can also switch instantly during video playback.
            </p>

            {/* Single column on mobile to prevent horizontal scrolling */}
            <div className="space-y-2">
              {PROVIDERS.map((p) => {
                const isSelected = p.id === selectedProvider
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-600 text-white shadow-md shadow-rose-950/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{p.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-mono">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                      {p.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ad Mitigation Sandboxing */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Ad Mitigation & Iframe Sandboxing</span>
            </label>
            <p className="text-xs text-slate-400">
              Control the security sandbox applied to streaming frames.
            </p>

            <div className="space-y-2">
              {Object.values(SANDBOX_MODES).map((mode) => {
                const isSelected = selectedSandbox === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedSandbox(mode.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-600 text-white shadow-md shadow-rose-950/30'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{mode.name}</span>
                      {isSelected && (
                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {mode.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 shrink-0">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-950 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
