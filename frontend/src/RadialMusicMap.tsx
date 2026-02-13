import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { SearchTrack } from './api'
import './RadialMusicMap.css'

const CATEGORY_COLORS: Record<string, string> = {
  chill: '#4a90d9',
  upbeat: '#e85d04',
  energy: '#d62828',
  groove: '#2d6a4f',
}

const CATEGORIES = ['chill', 'upbeat', 'energy', 'groove'] as const

function assignCategory(index: number): (typeof CATEGORIES)[number] {
  return CATEGORIES[index % CATEGORIES.length]
}

export interface RadialMusicMapProps {
  centerTrack: SearchTrack
  relatedTracks: SearchTrack[]
  onAddToPlaylist?: (track: SearchTrack) => void
  onSelectCenter?: (track: SearchTrack) => void
}

export function RadialMusicMap({
  centerTrack,
  relatedTracks,
  onAddToPlaylist,
}: RadialMusicMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredTrack, setHoveredTrack] = useState<SearchTrack | null>(null)

  useEffect(() => {
    if (!svgRef.current || relatedTracks.length === 0) return

    const width = 600
    const height = 600
    const centerX = width / 2
    const centerY = height / 2
    const innerRadius = 80
    const outerRadius = 240
    const centerRadius = 50

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', `translate(${centerX},${centerY})`)

    const tracksWithCategory = relatedTracks.map((t, i) => ({
      ...t,
      category: assignCategory(i),
      angleIndex: i,
    }))

    const angleScale = d3
      .scaleLinear()
      .domain([0, relatedTracks.length])
      .range([0, 2 * Math.PI])

    // Center node
    const centerG = g
      .append('g')
      .attr('class', 'center-node')
      .style('opacity', 0)
      .transition()
      .duration(400)
      .style('opacity', 1)

    centerG
      .append('circle')
      .attr('r', centerRadius)
      .attr('fill', CATEGORY_COLORS.chill)
      .attr('fill-opacity', 0.3)
      .attr('stroke', CATEGORY_COLORS.chill)
      .attr('stroke-width', 2)

    centerG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('class', 'center-title')
      .text(centerTrack.title.length > 20 ? centerTrack.title.slice(0, 20) + '…' : centerTrack.title)

    centerG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 8)
      .attr('class', 'center-artist')
      .text(centerTrack.artist)

    // Outer ring segments and labels
    tracksWithCategory.forEach((track, i) => {
      const startAngle = angleScale(i)
      const endAngle = angleScale(i + 1)
      const midAngle = (startAngle + endAngle) / 2
      const labelRadius = (innerRadius + outerRadius) / 2
      const x = Math.cos(midAngle - Math.PI / 2) * labelRadius
      const y = Math.sin(midAngle - Math.PI / 2) * labelRadius

      const arc = d3
        .arc<{ startAngle: number; endAngle: number }>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle)

      const segmentG = g
        .append('g')
        .attr('class', 'segment')
        .attr('data-video-id', track.yt_video_id)
        .style('opacity', 0)

      segmentG
        .transition()
        .delay(100 + i * 40)
        .duration(400)
        .style('opacity', 1)

      const color = CATEGORY_COLORS[track.category]

      segmentG
        .append('path')
        .attr('d', arc({ startAngle, endAngle }))
        .attr('fill', color)
        .attr('fill-opacity', 0.5)
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).attr('fill-opacity', 0.85)
          setHoveredTrack(track)
        })
        .on('mouseleave', function () {
          d3.select(this).attr('fill-opacity', 0.5)
          setHoveredTrack(null)
        })
        .on('click', () => onAddToPlaylist?.(track))

      const title = track.title.length > 12 ? track.title.slice(0, 12) + '…' : track.title
      segmentG
        .append('text')
        .attr('x', x)
        .attr('y', y - 6)
        .attr('text-anchor', 'middle')
        .attr('class', 'segment-title')
        .attr('pointer-events', 'none')
        .text(title)

      segmentG
        .append('text')
        .attr('x', x)
        .attr('y', y + 6)
        .attr('text-anchor', 'middle')
        .attr('class', 'segment-artist')
        .attr('pointer-events', 'none')
        .text(track.artist.length > 12 ? track.artist.slice(0, 12) + '…' : track.artist)
    })

    return () => {
      svg.selectAll('*').remove()
    }
  }, [centerTrack, relatedTracks, onAddToPlaylist])

  return (
    <div className="radial-map-wrap">
      <svg ref={svgRef} className="radial-map-svg" />
      {hoveredTrack && (
        <div className="radial-map-tooltip">
          <strong>{hoveredTrack.title}</strong> — {hoveredTrack.artist}
          <br />
          <small>Click to add to playlist</small>
        </div>
      )}
    </div>
  )
}
