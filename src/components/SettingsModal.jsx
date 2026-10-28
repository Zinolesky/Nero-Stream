import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PROVIDERS, SANDBOX_MODES } from '../services/providers'
import { tmdb } from '../services/tmdb'
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  Server,
  Shield,
  ExternalLink,
  Trash2,
  HelpCircle,
} from 'lucide-react'

export const SettingsModal = () => {
  const {
    apiKey,
    updateApiKey,
    isDemoMode,
    providerId,
    updateProviderId,
    sandboxMode,
    updateSandboxMode,
    closeModal,
  } = useApp()

  const [inputKey, setInputKey] = useState(apiKey || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleTestKey = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await tmdb.testApiKey(inputKey)
    setTesting(false)
    setTestResult(res)
    if (res.valid) {
      updateApiKey(inputKey)
    }
  }

  const handleSave = () => {
    updateApiKey(inputKey)
    closeModal()
  }

  const handleClear = () => {
    setInputKey('')
    updateApiKey('')
    setTestResult(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">App Settings & Metadata Key</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* TMDB API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>The Movie Database (TMDB) API Key</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isDemoMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isDemoMode ? 'Demo Mode' : 'Live Key Active'}
                </span>
              </label>

              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Provides real-time access to millions of movies, TV shows, cast rosters, trending categories, and episode lists. Your key is stored securely in your browser's local storage.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value)
                  setTestResult(null)
                }}
                placeholder="Paste your 32-character TMDB API key..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                onClick={handleTestKey}
                disabled={testing || !inputKey.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
              >
                {testing ? 'Verifying...' : 'Verify Key'}
              </button>
              {inputKey && (
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Clear key and reset to demo mode"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.valid
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {testResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Key verified successfully! Full TMDB live catalog is enabled.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{testResult.error}</span>
                  </>
                )}
              </div>
            )}

            {/* How to get a free key guidance */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>How to get a free TMDB key in 60 seconds:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                <li>Create a free account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noreferrer" className="text-rose-400 hover:underline">themoviedb.org</a>.</li>
                <li>Go to Account Settings &gt; <strong>API</strong> &gt; Request an API Key (choose Developer).</li>
                <li>Copy your <strong>API Key (v3 auth)</strong> and paste it above.</li>
              </ol>
            </div>
          </div>

          {/* Default Embed Server Provider */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-400" />
              <span>Default Stream Server Provider</span>
            </label>
            <p className="text-xs text-slate-400">
              Select which aggregator host to load by default. You can also switch servers on-the-fly directly inside the player view.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDERS.map((p) => {
                const isSelected = p.id === providerId
                return (
                  <button
                    key={p.id}
                    onClick={() => updateProviderId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-600 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs">{p.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-rose-300 font-mono">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ad Mitigation Sandboxing */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Ad Mitigation & Iframe Sandboxing</span>
            </label>
            <div className="space-y-2">
              {Object.values(SANDBOX_MODES).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => updateSandboxMode(mode.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    sandboxMode === mode.id
                      ? 'bg-rose-950/40 border-rose-600 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{mode.name}</span>
                    {sandboxMode === mode.id && <span className="text-xs text-rose-400 font-bold">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/50">
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
