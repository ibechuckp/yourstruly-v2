'use client'

import { 
  LAYOUT_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  LayoutTemplate,
  getPhotoSlots,
  getTextSlots
} from '@/lib/photobook/templates'

interface LayoutTemplatesProps {
  onSelect: (layoutType: string) => void
}

// Render a mini preview of a template based on its slots
function TemplatePreview({ template }: { template: LayoutTemplate }) {
  const photoSlots = getPhotoSlots(template)
  const textSlots = getTextSlots(template)
  
  return (
    <div 
      className="w-full h-full relative"
      style={{ 
        backgroundColor: template.background?.startsWith('linear') 
          ? undefined 
          : template.background || '#f8f8f8',
        backgroundImage: template.background?.startsWith('linear') 
          ? template.background 
          : undefined,
      }}
    >
      {/* Photo slots */}
      {photoSlots.map((slot) => (
        <div
          key={slot.id}
          className="absolute bg-gray-500/40 border border-white/20"
          style={{
            left: `${slot.position.x}%`,
            top: `${slot.position.y}%`,
            width: `${slot.position.width}%`,
            height: `${slot.position.height}%`,
            borderRadius: slot.style?.borderRadius 
              ? `${slot.style.borderRadius * 2}%`
              : '4px',
          }}
        />
      ))}
      
      {/* Text slots */}
      {textSlots.map((slot) => (
        <div
          key={slot.id}
          className="absolute flex flex-col justify-center px-1"
          style={{
            left: `${slot.position.x}%`,
            top: `${slot.position.y}%`,
            width: `${slot.position.width}%`,
            height: `${slot.position.height}%`,
          }}
        >
          <div className="h-0.5 bg-gray-600/50 rounded mb-0.5 w-3/4" 
            style={{ 
              marginLeft: slot.style?.textAlign === 'center' ? 'auto' : 0,
              marginRight: slot.style?.textAlign === 'center' ? 'auto' : 
                           slot.style?.textAlign === 'right' ? 0 : 'auto',
            }}
          />
          <div className="h-0.5 bg-gray-600/30 rounded w-1/2"
            style={{ 
              marginLeft: slot.style?.textAlign === 'center' ? 'auto' : 0,
              marginRight: slot.style?.textAlign === 'center' ? 'auto' : 
                           slot.style?.textAlign === 'right' ? 0 : 'auto',
            }}
          />
        </div>
      ))}
      
      {/* QR slots */}
      {template.slots.filter(s => s.type === 'qr').map((slot) => (
        <div
          key={slot.id}
          className="absolute flex items-center justify-center"
          style={{
            left: `${slot.position.x}%`,
            top: `${slot.position.y}%`,
            width: `${slot.position.width}%`,
            height: `${slot.position.height}%`,
          }}
        >
          <div className="w-2/3 h-2/3 border-2 border-gray-600/50 rounded-sm grid grid-cols-3 grid-rows-3 gap-px p-0.5">
            <div className="bg-gray-600/50" />
            <div className="bg-gray-600/30" />
            <div className="bg-gray-600/50" />
            <div className="bg-gray-600/30" />
            <div className="bg-gray-600/50" />
            <div className="bg-gray-600/30" />
            <div className="bg-gray-600/50" />
            <div className="bg-gray-600/30" />
            <div className="bg-gray-600/50" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LayoutTemplates({ onSelect }: LayoutTemplatesProps) {
  const categories = [
    { key: 'single', label: 'Single Photo', templates: TEMPLATES_BY_CATEGORY.single },
    { key: 'multi', label: 'Multi Photo', templates: TEMPLATES_BY_CATEGORY.multi },
    { key: 'special', label: 'Special', templates: TEMPLATES_BY_CATEGORY.special },
  ]
  
  return (
    <div className="space-y-6 p-4 max-h-[60vh] overflow-y-auto">
      {categories.map(({ key, label, templates }) => (
        <div key={key}>
          <h3 className="text-white/70 text-sm font-medium mb-3">{label}</h3>
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template) => {
              const photoCount = getPhotoSlots(template).length
              const textCount = getTextSlots(template).length
              
              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template.id)}
                  className="group p-3 rounded-xl border-2 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
                >
                  {/* Layout Preview */}
                  <div className="aspect-[4/5] bg-white rounded-lg mb-3 overflow-hidden">
                    <TemplatePreview template={template} />
                  </div>
                  
                  {/* Template Info */}
                  <h4 className="text-white font-medium text-sm group-hover:text-amber-400 transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-white/50 text-xs mt-1">
                    {photoCount > 0 && `${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
                    {photoCount > 0 && textCount > 0 && ' + '}
                    {textCount > 0 && `${textCount} text`}
                    {photoCount === 0 && textCount === 0 && 'Special'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
