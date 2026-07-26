import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchItemIconUrl, itemIconAssetUrl, _resetItemIconCache } from './itemIcon.ts'

const ICON_PATH = 'ui/icon/020000/020494_hr1.tex'

function mockSearchResponse(path: string | null) {
    return {
        ok: true,
        json: async () => ({ results: path ? [{ fields: { Icon: { path } } }] : [] }),
    }
}

describe('itemIconAssetUrl', () => {
    it('builds an asset URL with the path encoded', () => {
        const url = itemIconAssetUrl(ICON_PATH)
        expect(url).toContain('/api/asset?')
        expect(url).toContain(`path=${encodeURIComponent(ICON_PATH)}`)
        expect(url).toContain('format=png')
        // The raw slashes must not survive into the query string.
        expect(url).not.toContain(ICON_PATH)
    })
})

describe('fetchItemIconUrl', () => {
    beforeEach(() => {
        _resetItemIconCache()
        vi.stubGlobal('fetch', vi.fn())
    })
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('resolves an icon URL for a known item', async () => {
        vi.mocked(fetch).mockResolvedValue(mockSearchResponse(ICON_PATH) as any)

        const url = await fetchItemIconUrl('Ice Crystal')

        expect(url).toBe(itemIconAssetUrl(ICON_PATH))
        const requested = vi.mocked(fetch).mock.calls[0][0] as string
        expect(requested).toContain('sheets=Item')
        expect(requested).toContain(encodeURIComponent('Name="Ice Crystal"'))
    })

    it('returns null when the item has no match', async () => {
        vi.mocked(fetch).mockResolvedValue(mockSearchResponse(null) as any)
        await expect(fetchItemIconUrl('Nonexistent Item')).resolves.toBeNull()
    })

    it('returns null on a non-ok response', async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({}) } as any)
        await expect(fetchItemIconUrl('Ice Crystal')).resolves.toBeNull()
    })

    it('returns null when the request throws, rather than propagating', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('offline'))
        await expect(fetchItemIconUrl('Ice Crystal')).resolves.toBeNull()
    })

    it('returns null for an empty name without hitting the network', async () => {
        await expect(fetchItemIconUrl('')).resolves.toBeNull()
        expect(fetch).not.toHaveBeenCalled()
    })

    it('caches by name so a repeat lookup makes no second request', async () => {
        vi.mocked(fetch).mockResolvedValue(mockSearchResponse(ICON_PATH) as any)

        const first = await fetchItemIconUrl('Ice Crystal')
        const second = await fetchItemIconUrl('Ice Crystal')

        expect(second).toBe(first)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('dedupes concurrent lookups of the same item into one request', async () => {
        // The mining table renders ~50 rows at once and repeats names heavily,
        // so simultaneous callers must share a single in-flight request.
        vi.mocked(fetch).mockResolvedValue(mockSearchResponse(ICON_PATH) as any)

        const results = await Promise.all([
            fetchItemIconUrl('Gold Ore'),
            fetchItemIconUrl('Gold Ore'),
            fetchItemIconUrl('Gold Ore'),
        ])

        expect(new Set(results).size).toBe(1)
        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('keeps separate entries for different items', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(mockSearchResponse('ui/icon/a.tex') as any)
            .mockResolvedValueOnce(mockSearchResponse('ui/icon/b.tex') as any)

        const a = await fetchItemIconUrl('Item A')
        const b = await fetchItemIconUrl('Item B')

        expect(a).not.toBe(b)
        expect(fetch).toHaveBeenCalledTimes(2)
    })
})
