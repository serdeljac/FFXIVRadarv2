const BASE_URL = 'https://v2.xivapi.com'

// Shared across every component instance: a page of 50 nodes repeats item names
// often (crystals, clusters, shards), and each miss is a network round trip.
// The promise itself is cached rather than the resolved value, so rows that
// mount in the same tick share one request instead of racing.
const cache = new Map<string, Promise<string | null>>()

/** Turns an Icon.path from the Item sheet into a fetchable PNG asset URL. */
export function itemIconAssetUrl(path: string): string {
    return `${BASE_URL}/api/asset?path=${encodeURIComponent(path)}&format=png`
}

/**
 * Resolves an item's icon URL by exact name via xivapi.
 * Returns null when the item is unknown or the lookup fails — callers are
 * expected to still render the name.
 */
export function fetchItemIconUrl(name: string): Promise<string | null> {
    if (!name) return Promise.resolve(null)

    const cached = cache.get(name)
    if (cached) return cached

    const pending = resolveItemIcon(name)
    cache.set(name, pending)
    return pending
}

async function resolveItemIcon(name: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`Name="${name}"`)
        const res = await fetch(
            `${BASE_URL}/api/search?sheets=Item&query=${query}&fields=Icon.path&limit=1`
        )
        if (!res.ok) return null

        const data = await res.json()
        const path = data?.results?.[0]?.fields?.Icon?.path
        return path ? itemIconAssetUrl(path) : null
    } catch {
        // Network or parse failure — the row degrades to name-only.
        return null
    }
}

/** Test seam: clears the module-level cache between cases. */
export function _resetItemIconCache(): void {
    cache.clear()
}
