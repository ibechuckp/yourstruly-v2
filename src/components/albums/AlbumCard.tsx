'use client'

// Placeholder component - to be implemented
export default function AlbumCard({ album, onClick }: { album: any; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-4 bg-white rounded-xl shadow cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
      <h3 className="font-medium text-gray-800">{album?.title || 'Untitled Album'}</h3>
      <p className="text-sm text-gray-500">{album?.memory_count || 0} memories</p>
    </div>
  )
}
