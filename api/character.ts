import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCharacter, EDGE_CACHE_HEADER } from './_lodestone.js'

// Thin Vercel entry point — all scraping/caching logic lives in
// ./_lodestone.ts (underscore-prefixed, so Vercel's file-based routing
// doesn't turn it into its own endpoint) so it can also be reused by a
// dev-only Vite middleware for `npm run dev` (see vite.config.ts) without
// needing `vercel dev` running locally.
//
// The .js extension on the import (pointing at a .ts source file) is
// required, not a typo: this project's package.json has "type": "module",
// so Node's native ESM loader enforces explicit extensions on relative
// imports at runtime. Vercel's build emits api/character.ts and
// api/_lodestone.ts as separate files rather than bundling them together, so
// without the extension the deployed function crashes with
// ERR_MODULE_NOT_FOUND (vite dev and vercel dev are both more lenient about
// this, which is why it only surfaced once deployed).
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
        // Don't let a Lodestone hiccup turn into a stampede of retries.
        res.setHeader('Cache-Control', 'public, s-maxage=60')
        return res.status(502).json({ error: err?.message ?? 'Failed to load character profile' })
    }
}
