import { groupCache } from '#core'
import { log } from './Logger.js'

export function showAllCache() {
	const keys = groupCache.keys()
	log.debug('\n========== ALL CACHE ==========')
	log.debug(`Total Groups Cached: ${keys.length}`)

	keys.forEach(groupId => {
		const group = groupCache.get(groupId)
		log.debug(`\n[${group?.subject || 'Unknown'}]`)
		log.debug(`Group ID: ${groupId}`)
		log.debug(`Participants: ${group?.participants?.length || 0}`)
		log.debug(`Admins: ${group?.participants?.filter(p => p.admin).length || 0}`)
	})
	log.debug('================================\n')
}

/**
 * Tampilkan detail cache untuk grup tertentu
 */
export function showGroupCache(groupId) {
	const group = groupCache.get(groupId)

	if (!group) {
		log.debug(`Cache not found for: ${groupId}`)
		return
	}

	log.debug('\n========== GROUP CACHE DETAIL ==========')
	log.debug(JSON.stringify(group, null, 2))
	log.debug('=========================================\n')
}

/**
 * Tampilkan ringkasan cache
 */
export function showCacheStats() {
	const keys = groupCache.keys()
	const stats = groupCache.getStats()

	log.debug('\n========== CACHE STATS ==========')
	log.debug(`Total Groups: ${keys.length}`)
	log.debug(`Cache Hits: ${stats.hits}`)
	log.debug(`Cache Misses: ${stats.misses}`)
	log.debug(`Keys: ${stats.keys}`)
	log.debug(`Used Memory: ${(stats.vsize / 1024 / 1024).toFixed(2)} MB`)
	log.debug('=================================\n')
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

	log.debug('\n========== CACHE EXPORT ==========')
	log.debug(JSON.stringify(data, null, 2))
	log.debug('==================================\n')
}
