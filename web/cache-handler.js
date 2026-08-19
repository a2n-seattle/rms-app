/**
 * No-op Next.js cache handler (https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath).
 *
 * This app never needs server-side response/fetch caching -- every backend
 * fetch already forces `cache: "no-store"` (web/lib/api/client.ts), and
 * on-demand revalidation was replaced with client-side router.refresh()
 * (see GH-395/GH-397). Supplying an explicit handler that always misses
 * signals to Next (and any hosting adapter inspecting `hasCustomCacheHandler`)
 * that no cache storage is needed, which may also avoid Amplify Hosting's
 * own managed-cache injection for this app -- see GH-395 for the
 * `tableName: null` crash that injection produces.
 */
class CacheHandler {
    async get() {
        return null
    }

    async set() {}

    async revalidateTag() {}

    resetRequestCache() {}
}

module.exports = CacheHandler
