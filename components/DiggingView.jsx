'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

const CENTER_RADIUS = 40
const RELATED_RADIUS = 28

function buildGraphData(metadata) {
  if (!metadata) return { nodes: [], links: [] }

  const center = {
    id: 'center',
    title: metadata.title,
    artist: metadata.artist,
    thumbnail: metadata.thumbnail ?? (metadata.videoId ? `https://img.youtube.com/vi/${metadata.videoId}/mqdefault.jpg` : null),
    isCenter: true,
  }

  const related = (metadata.related ?? []).map((r, i) => ({
    id: `related-${i}`,
    title: r.title ?? 'Unknown',
    artist: r.artist ?? '',
    thumbnail: r.thumbnail ?? (r.videoId ? `https://img.youtube.com/vi/${r.videoId}/mqdefault.jpg` : null),
    videoId: r.videoId,
    isCenter: false,
  }))

  const nodes = [center, ...related]
  const links = related.map((_, i) => ({
    source: 'center',
    target: `related-${i}`,
  }))

  return { nodes, links }
}

export default function DiggingView({ graphData, onSearch, dark = false }) {
  const fgRef = useRef()
  const containerRef = useRef()
  const [imgCache, setImgCache] = useState({})
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })

  const { nodes, links } = useMemo(() => buildGraphData(graphData), [graphData])

  // Preload images when graph data changes
  useEffect(() => {
    if (!graphData) return
    const cache = {}
    const toLoad = [graphData, ...(graphData.related ?? [])]
    let loaded = 0
    const total = toLoad.filter((n) => n.thumbnail || n.videoId).length

    toLoad.forEach((node, idx) => {
      const url = node.thumbnail ?? (node.videoId ? `https://img.youtube.com/vi/${node.videoId}/mqdefault.jpg` : null)
      if (!url) return
      const id = idx === 0 ? 'center' : `related-${idx - 1}`
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        cache[id] = img
        loaded++
        if (loaded >= total) setImgCache((c) => ({ ...c, ...cache }))
      }
      img.onerror = () => {
        loaded++
        if (loaded >= total) setImgCache((c) => ({ ...c, ...cache }))
      }
      img.src = url
    })

    if (total === 0) setImgCache({})
  }, [graphData])

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const radius = node.isCenter ? CENTER_RADIUS : RELATED_RADIUS
      const img = imgCache[node.id]

      ctx.save()

      // Circular clip
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.clip()

      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, node.x - radius, node.y - radius, radius * 2, radius * 2)
      } else {
        ctx.fillStyle = '#e5e7eb'
        ctx.fillRect(node.x - radius, node.y - radius, radius * 2, radius * 2)
      }

      ctx.restore()

      // Border
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = node.isCenter ? '#3b82f6' : '#9ca3af'
      ctx.lineWidth = node.isCenter ? 2 : 1
      ctx.stroke()
    },
    [imgCache]
  )

  const handleNodeClick = useCallback(
    (node) => {
      if (node.isCenter) return
      const query = [node.title, node.artist].filter(Boolean).join(' ')
      if (query && onSearch) onSearch(query)
    },
    [onSearch]
  )

  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      fgRef.current.zoomToFit(400, 40)
    }
  }, [nodes.length, graphData])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {}
      if (width && height) setDimensions({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!graphData) {
    return (
      <div className={`flex-1 flex items-center justify-center min-h-[300px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Search for a track in the Omnibox above to explore related songs.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full flex-1 min-h-[300px]">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode="replace"
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = node.isCenter ? CENTER_RADIUS : RELATED_RADIUS
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
          ctx.fill()
        }}
        onNodeClick={handleNodeClick}
        linkColor={dark ? '#4b5563' : '#d1d5db'}
        linkWidth={1}
        backgroundColor={dark ? '#0a0a0a' : '#ffffff'}
        nodeLabel={(node) => `${node.title}${node.artist ? ` - ${node.artist}` : ''}`}
      />
    </div>
  )
}
