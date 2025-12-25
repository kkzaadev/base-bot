import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
	delay,
	jidNormalizedUser
} from 'baileys'
import MAIN_LOGGER from 'pino'
import NodeCache from '@cacheable/node-cache'
import { processCommand } from './BaseBot.js'
import { config } from '#config'
import { Serialize, cachedGroupMetadata, MetadataCache } from '#lib'
import { log } from '#utils'

const logger = MAIN_LOGGER({ level: 'silent' })
const msgRetryCounterCache = new NodeCache()

/** Cache to store WhatsApp group metadata (TTL: 1 hour) */
export const groupCache = new NodeCache({ stdTTL: 60 * 60, useClones: false })
const phone = config.phone

/** Creates and starts the WhatsApp socket connection */
export const start = async () => {
	// Production Alternative: Use SQL/Redis by creating your own auth state implementation
	const { state, saveCreds } = await useMultiFileAuthState('session')
	const { version } = await fetchLatestBaileysVersion()

	const sock = makeWASocket({
		version,
		logger,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		msgRetryCounterCache,
		cachedGroupMetadata
	})

	if (!sock.authState.creds.registered) {
		await delay(10000)
		/**
		 * if you want to use custom pairing code
		 * const customPairingCode = 'BASEBOTS'
		 * const code = await sock.requestPairingCode(phone, customPairingCode)
		 */
		const code = await sock.requestPairingCode(phone)
		log.info(`PhoneNumber: ${phone}`)
		log.info(`Pairing Code: ${code.slice(0, 4)}-${code.slice(4)}`)
	}

	sock.ev.on('connection.update', update => {
		const { connection, lastDisconnect } = update

		if (connection === 'close') {
			if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
				start()
			} else {
				log.error('Connection closed. You are logged out.')
			}
		}

		if (connection === 'open') {
			log.info('Connected to WhatsApp')
		}
	})

	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('messages.upsert', async ({ messages, type }) => {
		if (type !== 'notify') return
		/**
		 * you can use it like this
		 * const msg = messages[0]
		 * or like this : for (const msg of messages) {}
		 */
		const msg = messages[0]
		const m = new Serialize(sock, msg)

		await processCommand(sock, m)
	})

	sock.ev.on('groups.update', async updates => {
		try {
			const m = new MetadataCache(sock)
			await m.updateGroup(updates)
		} catch (error) {
			log.warn(`[ERROR] Failed to update groups: ${error.message}`)
		}
	})

	sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
		if (action === 'remove') {
			const botKicked = participants.some(p => {
				const participantId = p.id || p
				return participantId === jidNormalizedUser(sock.user.id) || participantId === jidNormalizedUser(sock.user.lid)
			})

			if (botKicked) {
				groupCache.del(id)
				return
			}
		}

		try {
			const m = new MetadataCache(sock)
			await m.updateParticipant(id, participants, action)
		} catch (error) {
			log.warn(`[ERROR] Failed to update participants: ${error.message}`)
		}
	})
}
