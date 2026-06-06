import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'The Good I Found — Good News Every Day'
export const size = { width: 1200, height: 1200 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          padding: '80px',
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 24 }}>😊</div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          The Good I Found
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Stories of Kindness, Progress, and Hope from Around the World
        </div>
        <div
          style={{
            marginTop: 56,
            fontSize: 28,
            color: '#10b981',
            fontWeight: 600,
          }}
        >
          thegoodifound.com
        </div>
      </div>
    ),
    size,
  )
}
