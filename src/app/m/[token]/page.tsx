import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicMemoryView from '@/components/photobook/PublicMemoryView'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

async function fetchMemoryData(token: string, email?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = new URL(`/api/qr/${token}`, baseUrl)
  
  if (email) {
    url.searchParams.set('email', email)
  }
  
  try {
    const response = await fetch(url.toString(), {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'not_found' }
      }
      if (response.status === 403) {
        const data = await response.json()
        return { error: 'access_denied', message: data.message, reason: data.reason }
      }
      return { error: 'unknown' }
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch memory:', error)
    return { error: 'fetch_failed' }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const data = await fetchMemoryData(token)
  
  if (data.error || !data.content) {
    return {
      title: 'Shared Memory - YoursTruly',
      description: 'A memory shared with you on YoursTruly'
    }
  }
  
  const content = data.content
  const title = content.title || 'Shared Memory'
  const description = content.description || content.ai_summary || `A ${content.memory_type || 'memory'} shared with you on YoursTruly`
  const image = content.memory_media?.[0]?.file_url
  
  return {
    title: `${title} - YoursTruly`,
    description,
    openGraph: {
      title: `${title} - Shared via YoursTruly`,
      description,
      images: image ? [{ url: image }] : undefined,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Shared via YoursTruly`,
      description,
      images: image ? [image] : undefined
    }
  }
}

export default async function PublicMemoryPage({ 
  params,
  searchParams 
}: PageProps) {
  const { token } = await params
  const { email } = await searchParams
  
  const data = await fetchMemoryData(token, email)
  
  if (data.error === 'not_found') {
    notFound()
  }
  
  return (
    <PublicMemoryView 
      token={token}
      data={data}
    />
  )
}
