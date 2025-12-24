import { groupCache } from '#core'

export function showAllCache() {
	const keys = groupCache.keys()
	console.log('\n========== ALL CACHE ==========')
	console.log(`Total Groups Cached: ${keys.length}`)

	keys.forEach(groupId => {
		const group = groupCache.get(groupId)
		console.log(`\n[${group?.subject || 'Unknown'}]`)
		console.log(`Group ID: ${groupId}`)
		console.log(`Participants: ${group?.participants?.length || 0}`)
		console.log(`Admins: ${group?.participants?.filter(p => p.admin).length || 0}`)
	})
	console.log('================================\n')
}

/**
 * Tampilkan detail cache untuk grup tertentu
 */
export function showGroupCache(groupId) {
	const group = groupCache.get(groupId)

	if (!group) {
		console.log(`\n❌ Cache not found for: ${groupId}\n`)
		return
	}

	console.log('\n========== GROUP CACHE DETAIL ==========')
	console.log(JSON.stringify(group, null, 2))
	console.log('=========================================\n')
}

/**
 * Tampilkan ringkasan cache
 */
export function showCacheStats() {
	const keys = groupCache.keys()
	const stats = groupCache.getStats()

	console.log('\n========== CACHE STATS ==========')
	console.log(`Total Groups: ${keys.length}`)
	console.log(`Cache Hits: ${stats.hits}`)
	console.log(`Cache Misses: ${stats.misses}`)
	console.log(`Keys: ${stats.keys}`)
	console.log(`Used Memory: ${(stats.vsize / 1024 / 1024).toFixed(2)} MB`)
	console.log('=================================\n')
}

/**
 * Export cache ke JSON file (untuk backup/debugging)
 */
export function exportCache() {
	const keys = groupCache.keys()
	const data = {}

	keys.forEach(key => {
		data[key] = groupCache.get(key)
	})

	console.log('\n========== CACHE EXPORT ==========')
	console.log(JSON.stringify(data, null, 2))
	console.log('==================================\n')
}
