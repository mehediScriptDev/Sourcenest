import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

export default function Icon() {
  const filePath = join(process.cwd(), 'public', 'images', 'sourcenet.png')
  const imageBuffer = readFileSync(filePath)

  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
