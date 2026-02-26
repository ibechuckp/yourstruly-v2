// Shared types for gallery and photo components

export interface GalleryMediaItem {
  id: string
  file_url: string
  file_type: string
  location_lat: number | null
  location_lng: number | null
  taken_at: string | null
  created_at?: string
  exif_lat: number | null
  exif_lng: number | null
  memory_id: string
  memory?: {
    id: string
    title: string
    location_name: string
    location_lat: number | null
    location_lng: number | null
    memory_date?: string
    memory_type?: string
  }
}
