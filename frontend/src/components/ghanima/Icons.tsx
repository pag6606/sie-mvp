/**
 * Iconos Ghanima — Sistema de iconos SVG stroke-based
 *
 * Cada icono es un SVG inline con viewBox="0 0 24 24",
 * strokeWidth 1.5/1.2, strokeLinecap round, strokeLinejoin round.
 *
 * Uso:
 *   <Icons.Users className="w-4 h-4 text-[#8A6A18]" />
 *   <Icons.Book className="w-4 h-4" />
 */

interface IconProps {
  className?: string
  size?: number
}

function mkIcon(paths: React.ReactNode): React.FC<IconProps> {
  return ({ className = '', size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}

export const Grid       = mkIcon(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>)
export const Users      = mkIcon(<><circle cx="8" cy="8" r="3.5" /><path d="M2 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.8" /><path d="M16 20a5 5 0 0 1 5.5-5" /></>)
export const Book       = mkIcon(<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15.5a.5.5 0 0 1-.8.4L17 18l-2.2 1.9a.5.5 0 0 1-.6 0L12 18l-2.2 1.9a.5.5 0 0 1-.6 0L7 18l-2.2 1.9a.5.5 0 0 1-.8-.4z" />)
export const Layers     = mkIcon(<><path d="M2 12 12 5l10 7-10 7z" /><path d="m6 14 6 4 6-4" /><path d="m6 17 6 4 6-4" /></>)
export const Clipboard  = mkIcon(<><rect x="5" y="4" width="14" height="17" rx="1" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M8 11h8M8 15h5" /></>)
export const Shield     = mkIcon(<><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>)
export const Spark      = mkIcon(<><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>)
export const Plus       = mkIcon(<><path d="M12 5v14M5 12h14" /></>)
export const Edit       = mkIcon(<path d="M14 4l6 6L8 22H2v-6z" />)
export const Trash      = mkIcon(<><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /></>)
export const Eye        = mkIcon(<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>)
export const ChevRight  = mkIcon(<path d="m9 6 6 6-6 6" />)
export const ChevLeft   = mkIcon(<path d="m15 6-6 6 6 6" />)
export const Alert      = mkIcon(<><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18v.5" /></>)
export const Check      = mkIcon(<path d="m5 12 5 5L20 7" />)
export const Info       = mkIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 8v.5" /></>)
export const Mail       = mkIcon(<><rect x="3" y="5" width="18" height="14" /><path d="m3 7 9 6 9-6" /></>)
export const Clock      = mkIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const Calendar   = mkIcon(<><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></>)
export const Gear       = mkIcon(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.8a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.8-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.8a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></>)
export const Search     = mkIcon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)
export const Bell       = mkIcon(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></>)
export const Help       = mkIcon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.5c0 1.5-2.4 2-2.4 3.5" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></>)
export const Doc        = mkIcon(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></>)
export const List       = mkIcon(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>)
export const Download   = mkIcon(<><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>)
export const Upload     = mkIcon(<><path d="M12 21V9m0 0-4 4m4-4 4 4" /><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" /></>)
export const Clone      = mkIcon(<><rect x="3" y="3" width="14" height="14" /><rect x="7" y="7" width="14" height="14" fill="none" /></>)
export const Menu       = mkIcon(<><path d="M3 6h18M3 12h18M3 18h18" /></>)
export const X          = mkIcon(<><path d="M6 6l12 12M18 6L6 18" /></>)
export const Key        = mkIcon(<><circle cx="8" cy="14" r="4" /><path d="m12 12 9-9M17 7l3 3M14 10l3 3" /></>)
export const Chart      = mkIcon(<><path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" /></>)
export const Home       = mkIcon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>)
export const Filter     = mkIcon(<path d="M22 3H2l8 9.46V19l4 2v-8.54z" />)
export const Lotus      = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M 100 41.8 Q 128 81.4, 100 121 Q 72 81.4, 100 41.8 Z" transform="rotate(-75 100 121)" />
    <path d="M 100 41.8 Q 128 81.4, 100 121 Q 72 81.4, 100 41.8 Z" transform="rotate(75 100 121)" />
    <path d="M 100 28.6 Q 130 74.8, 100 121 Q 70 74.8, 100 28.6 Z" transform="rotate(-45 100 121)" />
    <path d="M 100 28.6 Q 130 74.8, 100 121 Q 70 74.8, 100 28.6 Z" transform="rotate(45 100 121)" />
    <path d="M 100 17.2 Q 132 69.1, 100 121 Q 68 69.1, 100 17.2 Z" transform="rotate(-22 100 121)" />
    <path d="M 100 17.2 Q 132 69.1, 100 121 Q 68 69.1, 100 17.2 Z" transform="rotate(22 100 121)" />
    <path d="M 100 8.4 Q 134 64.7, 100 121 Q 66 64.7, 100 8.4 Z" />
    <circle cx="100" cy="128" r="9" fill="none" strokeWidth={1} opacity={0.7} />
  </svg>
)

const Icons = {
  Grid, Users, Book, Layers, Clipboard, Shield, Spark,
  Plus, Edit, Trash, Eye, ChevRight, ChevLeft,
  Alert, Check, Info, Mail, Clock, Calendar, Gear,
  Search, Bell, Help, Doc, List, Download, Upload,
  Clone, Menu, X, Key, Chart, Home, Filter, Lotus,
}

export default Icons
