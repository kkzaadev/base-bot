/*
 Plugin: Check Admin
 Command: .cekadmin
 Description: Check if bot and sender are admin in this group
*/

import { jidNormalizedUser } from 'baileys'
import { isAdmin, MetadataCache } from '#lib'

export default {
	Commands: ['cekadmin', 'checkadmin'],
	OnlyGroup: true,
	async handle(sock, m) {
		const cache = new MetadataCache(sock)
		const metadata = await cache.getGroupMetadata(m.chat)
		if (!metadata) {
			return await m.reply('Failed to get group metadata')
		}
		const botId = jidNormalizedUser(sock.user.id)
		const botLid = sock.user.lid ? jidNormalizedUser(sock.user.lid) : null
		const botIsAdmin = isAdmin(metadata, botId) || (botLid && isAdmin(metadata, botLid))
		const senderIsAdmin = isAdmin(metadata, m.sender)
		const text = ` *Admin Status*

 *Bot:* ${botIsAdmin ? 'Admin' : 'Not Admin'}
 *You:* ${senderIsAdmin ? 'Admin' : 'Not Admin'}`

		await m.reply(text)
	}
}
