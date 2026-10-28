import React from 'react'
import { useApp } from '../context/AppContext'
import { Play, Shield, Server, Layers, Heart } from 'lucide-react'

export const Footer = () => {
  const { openSettings, openArchInfo } = useApp()

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-20 text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white">
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            </div>
            <span className="text-base font-black tracking-tight text-white">
              Stream<span className="text-rose-500">Vault</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Built strictly on the <strong>Option 2 Embed Aggregator Architecture</strong>. Metadata and artwork are retrieved from TMDB; video streams are dynamically delegated to third-party embed servers with multi-server rotation and anti-redirect iframe sandboxing.
          </p>
          <p className="text-[11px] text-slate-600">
            No video files or streams are hosted, stored, or processed on this server.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Architecture
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={openArchInfo} className="hover:text-rose-400 transition-colors">
                  Option 2 System Breakdown
                </button>
              </li>
              <li>
                <span className="text-slate-500">Multi-Server Fallback Arrays</span>
              </li>
              <li>
                <span className="text-slate-500">Iframe Sandboxing Rules</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Services & APIs
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-rose-400 transition-colors"
                >
                  The Movie Database (TMDB)
                </a>
              </li>
              <li>
                <button onClick={openSettings} className="hover:text-rose-400 transition-colors">
                  Configure TMDB API Key
                </button>
              </li>
              <li>
                <span className="text-slate-500">VidSrc / VidLink / Embed.su</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
        <span>© {new Date().getFullYear()} StreamVault • Open Architecture Starter</span>
        <div className="flex items-center gap-4">
          <button onClick={openArchInfo} className="hover:text-slate-400 transition-colors">
            Architecture Specs
          </button>
          <span>•</span>
          <button onClick={openSettings} className="hover:text-slate-400 transition-colors">
            Settings
          </button>
        </div>
      </div>
    </footer>
  )
}
