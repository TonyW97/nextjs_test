// Simple arrow shape
const CursorImage = () => <svg><path fill="currentColor" d="M8.482,0l8.482,20.36L8.322,17.412,0,20.36Z" transform="translate(11 22.57) rotate(-48)" /></svg>

// Give cursor absolute x/y positioning
export default function Cursor ({ x = 0, y = 0 }) {
  return (
    <div style={{
      color: 'black',
      position: 'absolute',
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.5s cubic-bezier(.17, .93, .38, 1)'
    }}>
      <CursorImage />
    </div>
  )
}