/*
 ─── Info ────────────────────────────
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev

 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

import { groupCache } from '#core'
import { isJidBroadcast, isJidStatusBroadcast, jidNormalizedUser } from 'baileys'

/**
 * Helper functions for checking participant status
 */
function isParticipant(metadata, jid) {
	if (!metadata?.participants) return false
	const targetNumber = jid?.match(/^\d+/)?.[0]
	return metadata.participants.some(p => {
		const pLid = p.id?.match(/^\d+/)?.[0]
		const pPhone = p.phoneNumber?.match(/^\d+/)?.[0]
		return pLid === targetNumber || pPhone === targetNumber
	})
}

function isAdmin(metadata, jid) {
	if (!metadata?.participants) return false
	const targetNumber = jid?.match(/^\d+/)?.[0]
	const participant = metadata.participants.find(p => {
		const pLid = p.id?.match(/^\d+/)?.[0]
		const pPhone = p.phoneNumber?.match(/^\d+/)?.[0]
		return pLid === targetNumber || pPhone === targetNumber
	})
	return participant?.admin === 'admin' || participant?.admin === 'superadmin'
}

/**
 * Group class for managing group operations
 */
export class Group {
	constructor(id, sock) {
		this.id = id
		this.sock = sock
		this.metadata = groupCache.get(id) || null
	}

	async ensureMetadata() {
		if (!this.metadata) {
			this.metadata = await this.sock.groupMetadata(this.id)
			groupCache.set(this.id, this.metadata)
		}
		return this.metadata
	}

	async promote(participant) {
		await this.ensureMetadata()
		if (!isParticipant(this.metadata, participant)) return null
		if (isAdmin(this.metadata, participant)) return null
		await this.sock.groupParticipantsUpdate(this.id, [participant], 'promote')
		return true
	}

	async demote(participant) {
		await this.ensureMetadata()
		if (!isParticipant(this.metadata, participant)) return null
		if (!isAdmin(this.metadata, participant)) return null
		await this.sock.groupParticipantsUpdate(this.id, [participant], 'demote')
		return true
	}

	async remove(participant) {
		await this.ensureMetadata()
		if (!isParticipant(this.metadata, participant)) return null
		await this.sock.groupParticipantsUpdate(this.id, [participant], 'remove')
		return true
	}

	async add(participant) {
		return await this.sock.groupParticipantsUpdate(this.id, [participant], 'add')
	}

	async leave() {
		return await this.sock.groupLeave(this.id)
	}

	async setName(name) {
		return await this.sock.groupUpdateSubject(this.id, name)
	}

	async setDescription(description) {
		return await this.sock.groupUpdateDescription(this.id, description)
	}

	async setMemberAddMode(mode) {
		await this.ensureMetadata()
		if (mode === 'admin_add' && !this.metadata.memberAddMode) return null
		if (mode === 'all_member_add' && this.metadata.memberAddMode) return null
		await this.sock.groupMemberAddMode(this.id, mode)
		return true
	}

	async setEphemeral(duration) {
		await this.ensureMetadata()
		if (this.metadata.ephemeralDuration === duration) return null
		await this.sock.groupToggleEphemeral(this.id, duration)
		return true
	}

	async kickAll() {
		await this.ensureMetadata()
		const botId = jidNormalizedUser(this.sock.user?.id)
		const participants = this.metadata.participants
			.filter(p => p.admin === null && p.id !== botId && p.id !== this.metadata.owner)
			.map(p => p.id)

		if (participants.length === 0) return null
		return await this.sock.groupParticipantsUpdate(this.id, participants, 'remove')
	}

	async getInviteCode() {
		const invite = await this.sock.groupInviteCode(this.id)
		return `https://chat.whatsapp.com/${invite}`
	}

	async revokeInvite() {
		const invite = await this.sock.groupRevokeInvite(this.id)
		return `https://chat.whatsapp.com/${invite}`
	}

	async setJoinApproval(mode) {
		await this.ensureMetadata()
		if (mode === 'on' && this.metadata.joinApprovalMode) return null
		if (mode === 'off' && !this.metadata.joinApprovalMode) return null
		await this.sock.groupJoinApprovalMode(this.id, mode)
		return true
	}

	async setAnnouncement(mode) {
		await this.ensureMetadata()
		if (mode === 'announcement' && this.metadata.announce) return null
		if (mode === 'not_announcement' && !this.metadata.announce) return null
		await this.sock.groupSettingUpdate(this.id, mode)
		return true
	}

	async setRestricted(mode) {
		await this.ensureMetadata()
		if (mode === 'locked' && this.metadata.restrict) return null
		if (mode === 'unlocked' && !this.metadata.restrict) return null
		await this.sock.groupSettingUpdate(this.id, mode)
		return true
	}
}

/**
 * MetadataCache class for caching group metadata
 */

export class MetadataCache {
	constructor(sock) {
		this.sock = sock
	}

	async getGroupMetadata(chat) {
		if (!groupCache.has(chat)) {
			const metadata = await this.sock.groupMetadata(chat)
			groupCache.set(chat, metadata)
		}
		return groupCache.get(chat)
	}

	clearGroupCache(chat) {
		if (groupCache.has(chat)) {
			groupCache.del(chat)
		}
	}

	clearAllCache() {
		groupCache.flushAll()
	}

	async updateParticipant(chat, participants, action = 'add') {
		if (!groupCache.has(chat)) {
			try {
				const metadata = await this.sock.groupMetadata(chat)
				groupCache.set(chat, metadata)
			} catch (err) {
				console.log(`Gagal mengambil metadata grup ${chat}:`, err.message)
				return
			}
		}

		const group = groupCache.get(chat)
		if (!group) return

		participants.forEach(p => {
			const lid = p.id
			const phoneJid = p.phoneNumber

			const lidNumber = lid?.match(/^\d+/)?.[0]
			const phoneNumber = phoneJid?.match(/^\d+/)?.[0]

			if (!lidNumber && !phoneNumber) return

			const index = group.participants.findIndex(gp => {
				const gpLidNumber = gp.id?.match(/^\d+/)?.[0]
				const gpPhoneNumber = gp.phoneNumber?.match(/^\d+/)?.[0]

				return (lidNumber && gpLidNumber === lidNumber) || (phoneNumber && gpPhoneNumber === phoneNumber)
			})

			if (action === 'add') {
				if (index === -1) {
					group.participants.push({
						id: lid,
						phoneNumber: phoneJid,
						admin: p.admin || null
					})
				}
			} else if (action === 'remove') {
				if (index !== -1) {
					group.participants.splice(index, 1)
				}
			} else if (action === 'promote') {
				if (index !== -1) {
					group.participants[index].admin = 'admin'
				}
			} else if (action === 'demote') {
				if (index !== -1) {
					group.participants[index].admin = null
				}
			}
		})

		group.size = group.participants.length
	}

	findParticipant(number) {
		const targetNumber = number?.match(/^\d+/)?.[0]
		if (!targetNumber) return null

		const keys = groupCache.keys()
		for (const groupId of keys) {
			const group = groupCache.get(groupId)
			if (!group) continue

			const participant = group.participants?.find(p => {
				const pLidNumber = p.id?.match(/^\d+/)?.[0]
				const pPhoneNumber = p.phoneNumber?.match(/^\d+/)?.[0]

				return pLidNumber === targetNumber || pPhoneNumber === targetNumber
			})

			if (participant) {
				return {
					groupId: group.id,
					subject: group.subject,
					participant,
					total_participants: group.size || group.participants.length
				}
			}
		}

		return null
	}

	upsertGroup(groups) {
		if (!Array.isArray(groups)) return

		groups.forEach(group => {
			if (!group.id) return

			if (isJidBroadcast(group.id) || isJidStatusBroadcast(group.id)) {
				console.warn(`Lewati upsert untuk broadcast: ${group.id}`)
				return
			}

			const existing = groupCache.get(group.id)

			groupCache.set(group.id, {
				...group,
				participants: group.participants || existing?.participants || []
			})
		})
	}

	async updateGroup(updates) {
		if (!Array.isArray(updates)) return

		for (const update of updates) {
			if (!update.id) continue

			if (isJidBroadcast(update.id) || isJidStatusBroadcast(update.id)) {
				console.warn(`Lewati update untuk broadcast: ${update.id}`)
				continue
			}

			if (!groupCache.has(update.id)) {
				try {
					const metadata = await this.sock.groupMetadata(update.id)
					groupCache.set(update.id, metadata)
				} catch (err) {
					console.log(`Gagal mengambil metadata grup ${update.id}:`, err.message)
					continue
				}
			}

			const group = groupCache.get(update.id)
			if (!group) continue

			Object.keys(update).forEach(key => {
				if (key !== 'id' && update[key] !== undefined) {
					group[key] = update[key]
				}
			})
		}
	}
}

export async function cachedGroupMetadata(jid) {
	return groupCache.get(jid)
}
