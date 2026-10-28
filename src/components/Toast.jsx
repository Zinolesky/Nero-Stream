import React from 'react'
import { useApp } from '../context/AppContext'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'

export const Toast = () => {
  const { toast } = useApp()
  if (!toast) return null

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      default:
        return <Info className="w-5 h-5 text-rose-400 shrink-0" />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-slate-700/80 text-slate-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      {getIcon()}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  )
}
