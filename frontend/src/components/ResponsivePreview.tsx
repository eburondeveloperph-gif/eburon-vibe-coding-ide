"use client";

import React from 'react'
import { Monitor, Tablet, Smartphone, RefreshCcw, ExternalLink, X } from 'lucide-react'

type DeviceType = 'web' | 'tablet' | 'mobile'

export const ResponsivePreview: React.FC<{
  url: string
  refreshToken?: number
  onClose: () => void
}> = ({ url, refreshToken, onClose }) => {
  const [device, setDevice] = React.useState<DeviceType>('web')
  const [reloadCount, setReloadCount] = React.useState(0)

  React.useEffect(() => {
    if (typeof refreshToken !== 'undefined') {
      setReloadCount((c) => c + 1)
    }
  }, [refreshToken])

  const getWidth = () => {
    switch (device) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      default: return '100%'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden border-t" style={{ borderColor: 'var(--vscode-panel-border)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: 'var(--vscode-surface)', borderColor: 'var(--vscode-panel-border)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border rounded-md p-0.5" style={{ borderColor: 'var(--vscode-panel-border)', background: 'var(--vscode-contrast)' }}>
            <button
              onClick={() => setDevice('web')}
              className={`p-1.5 rounded ${device === 'web' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Web View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded ${device === 'tablet' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded ${device === 'mobile' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-4 w-px bg-gray-700 mx-1" />
          
          <button
            onClick={() => setReloadCount(c => c + 1)}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          
          <span className="text-xs text-gray-400 truncate max-w-[200px]" title={url}>
            {url}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-red-500 text-gray-400 hover:text-white transition-colors"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4 flex justify-center">
        <div 
          className="bg-white shadow-2xl transition-all duration-300 ease-in-out h-full"
          style={{ 
            width: getWidth(),
            borderRadius: device === 'web' ? '0' : '12px',
            overflow: 'hidden',
            border: device === 'web' ? 'none' : '8px solid #333'
          }}
        >
          <iframe
            key={`preview-frame-${reloadCount}`}
            src={url}
            title="App Preview"
            className="w-full h-full border-none"
            style={{ colorScheme: 'light' }}
          />
        </div>
      </div>
    </div>
  )
}
