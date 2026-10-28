import React from 'react'
import { useApp } from '../context/AppContext'
import { X, Layers, Server, Shield, Database, Cloud, Code } from 'lucide-react'

export const ArchitectureInfoModal = () => {
  const { closeModal } = useApp()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">System Architecture: Option 2 Embed Aggregator</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-slate-300 text-sm leading-relaxed">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs sm:text-sm">
            <strong>Architecture Principle:</strong> Delivers modern commercial movies and TV series without storing video files locally or paying for media storage and streaming bandwidth. The browser connects metadata directly to TMDB and delegates video delivery to third-party embed aggregators.
          </div>

          {/* ASCII Diagram Box */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" />
              Core System Architecture Flow
            </h3>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] sm:text-xs text-rose-300 font-mono overflow-x-auto leading-relaxed">
{`+-----------------------------------------------------------+
|                     Client Browser                        |
|                                                           |
|  +---------------------+      +------------------------+  |
|  |   TMDB API Layer    |      |     Iframe Player      |  |
|  |  (Posters, Cast,    |      |  (Dynamically rendered |  |
|  |   Seasons/Episodes) |      |   via Provider URL)    |  |
|  +----------+----------+      +-----------+------------+  |
+-------------|-----------------------------|---------------+
              |                             |
              v                             v
     [api.themoviedb.org]        [Third-Party Embed Host]
     Free Metadata & Images      HLS / MP4 Stream Delivery`}
            </pre>
          </div>

          {/* Movies vs TV Series Routing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                1. Movies Routing
              </h4>
              <p className="text-xs text-slate-400">
                Requires only a single unique TMDB or IMDb identifier.
              </p>
              <code className="block p-2 rounded bg-black/60 text-emerald-400 font-mono text-[11px] break-all border border-slate-800">
                https://vidsrc.to/embed/movie/&#123;tmdb_id&#125;
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                2. TV Series Nested Routing
              </h4>
              <p className="text-xs text-slate-400">
                Queries TMDB for seasons and episodes, rendering dynamic pickers for:
              </p>
              <code className="block p-2 rounded bg-black/60 text-emerald-400 font-mono text-[11px] break-all border border-slate-800">
                https://vidsrc.to/embed/tv/&#123;tmdb_id&#125;/&#123;season&#125;/&#123;episode&#125;
              </code>
            </div>
          </div>

          {/* Key Engineering Pillars */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-400" />
              Practical Engineering Considerations
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <h5 className="font-semibold text-white text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Provider Fallbacks (Multi-Server Rotation)
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  Because third-party providers face occasional domain rotation or ISP blocks, this app maintains an array of 6 independent provider mirrors (VidSrc, VidLink, Embed.su, VidSrc XYZ, AutoEmbed, MultiEmbed) with a one-click server toggle in the player bar.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <h5 className="font-semibold text-white text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ad Mitigation & Sandboxing
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  Stream hosts monetize via intrusive pop-unders. By omitting <code className="text-rose-300 font-mono">allow-top-navigation</code> from the iframe sandbox (<code className="text-rose-300 font-mono">sandbox="allow-scripts allow-same-origin allow-forms"</code>), your parent browsing window is immune to aggressive URL redirects.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <h5 className="font-semibold text-white text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  100% Free Static Deployment
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  Because all computation is client-side and media is streamed directly between the embed host and the user's browser, this application can be hosted completely free on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  )
}
