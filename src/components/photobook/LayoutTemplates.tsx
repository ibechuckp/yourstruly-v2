'use client'

import { LAYOUT_TEMPLATES } from './types'

interface LayoutTemplatesProps {
  onSelect: (layoutType: string) => void
}

export default function LayoutTemplates({ onSelect }: LayoutTemplatesProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {LAYOUT_TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className="group p-4 rounded-xl border-2 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
        >
          {/* Layout Preview */}
          <div className="aspect-[4/5] bg-gray-700/50 rounded-lg mb-3 overflow-hidden p-2">
            <div className="w-full h-full relative">
              {/* Render layout preview based on type */}
              {template.id === 'single' && (
                <div className="w-full h-full bg-gray-600/50 rounded border border-white/10" />
              )}
              {template.id === 'two-horizontal' && (
                <div className="w-full h-full flex flex-col gap-1">
                  <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'two-vertical' && (
                <div className="w-full h-full flex gap-1">
                  <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'three-top-heavy' && (
                <div className="w-full h-full flex flex-col gap-1">
                  <div className="flex-[2] bg-gray-600/50 rounded border border-white/10" />
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                </div>
              )}
              {template.id === 'three-bottom-heavy' && (
                <div className="w-full h-full flex flex-col gap-1">
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                  <div className="flex-[2] bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'grid-2x2' && (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                  <div className="bg-gray-600/50 rounded border border-white/10" />
                  <div className="bg-gray-600/50 rounded border border-white/10" />
                  <div className="bg-gray-600/50 rounded border border-white/10" />
                  <div className="bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'collage-5' && (
                <div className="w-full h-full flex flex-col gap-1">
                  <div className="flex-1 flex gap-1">
                    <div className="flex-[2] bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                </div>
              )}
              {template.id === 'hero-left' && (
                <div className="w-full h-full flex gap-1">
                  <div className="flex-[2] bg-gray-600/50 rounded border border-white/10" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                </div>
              )}
              {template.id === 'hero-right' && (
                <div className="w-full h-full flex gap-1">
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                    <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                  </div>
                  <div className="flex-[2] bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'full-bleed' && (
                <div className="w-full h-full bg-gray-600/50 rounded border-2 border-dashed border-white/20" />
              )}
              {template.id === 'text-left' && (
                <div className="w-full h-full flex gap-1">
                  <div className="flex-1 flex flex-col justify-center px-1">
                    <div className="h-1 bg-white/30 rounded mb-1" />
                    <div className="h-1 bg-white/20 rounded mb-1 w-3/4" />
                    <div className="h-1 bg-white/20 rounded w-1/2" />
                  </div>
                  <div className="flex-1 bg-gray-600/50 rounded border border-white/10" />
                </div>
              )}
              {template.id === 'text-bottom' && (
                <div className="w-full h-full flex flex-col gap-1">
                  <div className="flex-[3] bg-gray-600/50 rounded border border-white/10" />
                  <div className="flex-1 flex flex-col justify-center px-1">
                    <div className="h-1 bg-white/30 rounded mb-1 w-3/4 mx-auto" />
                    <div className="h-1 bg-white/20 rounded w-1/2 mx-auto" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Template Info */}
          <h3 className="text-white font-medium text-sm group-hover:text-amber-400 transition-colors">
            {template.name}
          </h3>
          <p className="text-white/50 text-xs mt-1">
            {template.photoSlots} photo{template.photoSlots !== 1 ? 's' : ''}
            {template.hasTextArea && ' + text'}
          </p>
        </button>
      ))}
    </div>
  )
}
