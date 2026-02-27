'use client'

import { Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MemoryAlbum } from '@/types/album'

interface AlbumCardProps {
  album: MemoryAlbum;
  onClick?: () => void;
  onEdit?: (album: MemoryAlbum) => void;
  onDelete?: (album: MemoryAlbum) => void;
}

export default function AlbumCard({ album, onClick, onEdit, onDelete }: AlbumCardProps) {
  return (
    <div className="group relative p-4 bg-white rounded-xl shadow cursor-pointer hover:shadow-md transition-shadow">
      <Link href={`/dashboard/capsules/${album.id}`}>
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {album.cover_image_url ? (
            <img 
              src={album.cover_image_url} 
              alt={album.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No cover
            </div>
          )}
        </div>
        <h3 className="font-medium text-gray-800">{album.name || 'Untitled Album'}</h3>
        <p className="text-sm text-gray-500">{album.memory_ids?.length || 0} memories</p>
      </Link>
      
      {/* Edit/Delete buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(album); }}
              className="p-2 bg-white/90 rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(album); }}
              className="p-2 bg-white/90 rounded-lg shadow hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
