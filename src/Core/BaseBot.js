/*
 ─── Info ────────────────────────────
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev

 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

import { jidNormalizedUser } from 'baileys'
import { config } from '#config'
import { plugins, preProcess, isAdmin, MetadataCache } from '#lib'
import { log, logMessage } from '#utils'

/** Main function to process incoming commands */
export async function processCommand(sock, m) {
	const { chat, isGroup, sender, text, senderAlt, prefix, command, pushName, args, rawArgs, mentions } = m

	// Check if sender is owner
	const isOwner = config.owner?.includes(senderAlt)

	try {
		const shouldContinue = await preProcess(sock, m)
		if (!shouldContinue) return

		if (text?.trim() && prefix) {
			logMessage(pushName, text, senderAlt)
		}

		if (
			(config.botMode?.toLowerCase() === 'private' && isGroup) ||
			(config.botMode?.toLowerCase() === 'group' && !isGroup)
		) {
			if (!isOwner) return
		}

		// Find and execute matching plugin
		for (const plugin of plugins) {
			if (plugin.Commands.includes(command)) {
				// Check owner-only restriction
				if (plugin.OnlyOwner && !isOwner) {
					return await sock.sendMessage(chat, { text: '_This command is only for owner!_' })
				}

				// Check group-only restriction
				if (plugin.OnlyGroup && !isGroup) {
					return await sock.sendMessage(chat, { text: '_This command is only for groups!_' })
				}

				// Check admin-only restriction
				if (isGroup && plugin.OnlyAdmin) {
					const cache = new MetadataCache(sock)
					const metadata = await cache.getGroupMetadata(chat)
					if (!metadata) return

					const userIsAdmin = isAdmin(metadata, sender)
					const botId = jidNormalizedUser(sock.user.id)
					const botLid = sock.user.lid ? jidNormalizedUser(sock.user.lid) : null
					const botIsAdmin = isAdmin(metadata, botId) || (botLid && isAdmin(metadata, botLid))

					if (!userIsAdmin) {
						return await sock.sendMessage(chat, { text: '_You are not a group admin!_' })
					}
					if (!botIsAdmin) {
						return await sock.sendMessage(chat, { text: '_Bot is not a group admin!_' })
					}
				}

				try {
					await plugin.handle(sock, m, { args, rawArgs, command, prefix, mentions })
				} catch (e) {
					log.error(`Plugin error "${command}": ${e.message}`)
					log.warn(e.stack)
				}

				return
			}
		}
	} catch (error) {
		log.error(`processCommand error: ${error.message}`)
	}
}
