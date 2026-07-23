import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCharacter, EDGE_CACHE_HEADER } from './_lodestone.js'

// GET-only Vercel endpoint for the Lodestone character profile. On success it
// serves the scraped data with the shared edge-cache header; on failure it
// still caches the error briefly so a Lodestone outage can't trigger a retry
// stampede. The `.js` import extension is mandatory (ESM "type": "module")
// even though the source is `.ts`, or the deployed function throws ERR_MODULE_NOT_FOUND.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method && req.method !== 'GET') {
        res.setHeader('Allow', 'GET')
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const data = await getCharacter()
        res.setHeader('Cache-Control', EDGE_CACHE_HEADER)
        return res.status(200).json(data)
    } catch (err: any) {
        console.error('[api/character] failed to load Lodestone profile', err)
        res.setHeader('Cache-Control', 'public, s-maxage=60')
        return res.status(502).json({ error: err?.message ?? 'Failed to load character profile' })
    }
}
