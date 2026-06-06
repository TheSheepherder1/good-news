import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          padding: '0 60px',
          gap: '40px',
        }}
      >
        <div style={{ fontSize: 80 }}>😊</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            The Good I Found
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#6b7280',
            }}
          >
            Stories of Kindness, Progress, and Hope from Around the World
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            thegoodifound.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 400 },
  )
}
