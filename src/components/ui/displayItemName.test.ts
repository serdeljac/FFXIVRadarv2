import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import displayItemName from './displayItemName.vue'
import { fetchItemIconUrl } from '../api/itemIcon.ts'

vi.mock('../api/itemIcon.ts', () => ({
    fetchItemIconUrl: vi.fn(),
}))

const ICON_URL = 'https://v2.xivapi.com/api/asset?path=ui%2Ficon%2Fa.tex&format=png'

describe('displayItemName', () => {
    beforeEach(() => {
        vi.mocked(fetchItemIconUrl).mockReset()
    })

    it('renders the item name from the `item` prop', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(ICON_URL)

        const wrapper = mount(displayItemName, { props: { item: 'Ice Crystal' } })
        await flushPromises()

        expect(wrapper.text()).toContain('Ice Crystal')
    })

    it('looks the icon up by the item name', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(ICON_URL)

        mount(displayItemName, { props: { item: 'Gold Ore' } })
        await flushPromises()

        expect(fetchItemIconUrl).toHaveBeenCalledWith('Gold Ore')
    })

    it('renders the image with the resolved src and the name as alt text', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(ICON_URL)

        const wrapper = mount(displayItemName, { props: { item: 'Ice Crystal' } })
        await flushPromises()

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe(ICON_URL)
        expect(img.attributes('alt')).toBe('Ice Crystal')
    })

    it('places the image and the name beside each other in a single row', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(ICON_URL)

        const wrapper = mount(displayItemName, { props: { item: 'Ice Crystal' } })
        await flushPromises()

        const root = wrapper.find('.itemName')
        const children = Array.from(root.element.children)
        expect(children).toHaveLength(2)
        expect(children[0].tagName).toBe('IMG')
        expect(children[1].textContent).toContain('Ice Crystal')
    })

    it('still renders the name when the icon cannot be resolved', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(null)

        const wrapper = mount(displayItemName, { props: { item: 'Unknown Item' } })
        await flushPromises()

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.text()).toContain('Unknown Item')
    })

    it('holds the icon slot while the lookup is pending so rows do not shift', async () => {
        vi.mocked(fetchItemIconUrl).mockReturnValue(new Promise(() => {}))

        const wrapper = mount(displayItemName, { props: { item: 'Ice Crystal' } })

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.itemName_icon--pending').exists()).toBe(true)
    })

    it('re-resolves when the item prop changes', async () => {
        vi.mocked(fetchItemIconUrl).mockResolvedValue(ICON_URL)

        const wrapper = mount(displayItemName, { props: { item: 'Ice Crystal' } })
        await flushPromises()

        await wrapper.setProps({ item: 'Fire Crystal' })
        await flushPromises()

        expect(fetchItemIconUrl).toHaveBeenLastCalledWith('Fire Crystal')
        expect(wrapper.text()).toContain('Fire Crystal')
    })

    it('ignores a stale response that lands after the prop moved on', async () => {
        // Slow request for the first item, fast one for the second.
        let resolveFirst: (v: string | null) => void = () => {}
        vi.mocked(fetchItemIconUrl)
            .mockImplementationOnce(() => new Promise((r) => { resolveFirst = r }))
            .mockResolvedValueOnce(null)

        const wrapper = mount(displayItemName, { props: { item: 'Slow Item' } })
        await wrapper.setProps({ item: 'Fast Item' })
        await flushPromises()

        resolveFirst('https://example.test/stale.png')
        await flushPromises()

        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.text()).toContain('Fast Item')
    })
})
