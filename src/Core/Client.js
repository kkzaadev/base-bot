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
import qrcode from 'qrcode-terminal'
import { Serialize, cachedGroupMetadata, MetadataCache } from '#lib'
import { log, showAllCache, showGroupCache } from '#utils'

const logger = MAIN_LOGGER({ level: 'silent' })
let qrCount = 0
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
		printQRInTerminal: false,
		generateHighQualityLinkPreview: true,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		msgRetryCounterCache,
		cachedGroupMetadata
	})

	if (!sock.authState.creds.registered && config.usePairing) {
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
		const { connection, lastDisconnect, qr } = update

		if (qr != null && !config.usePairing) {
			qrCount++
			log.info('Displaying QR Code')
			qrcode.generate(qr, { small: true }, qrcodeStr => {
				console.log(qrcodeStr)
			})
			log.info(`Please scan with WhatsApp app! (Try ${qrCount}/5)`)

			if (qrCount >= 5) {
				log.error('Timeout: Too many QR display attempts, please try again')
				process.exit(0)
			}
		}

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
		// if you want to do debugging you can remove //
		// log.debug(JSON.stringify(messages, null, 2))
		// log.debug(JSON.stringify(type, null, 2))
		if (type !== 'notify') return
		/**
		 * you can use it like this
		 * const msg = messages[0]
		 * or like this : for (const msg of messages) {}
		 */
		const msg = messages[0]
		const m = new Serialize(sock, msg)
		// log.debug(JSON.stringify(m, null, 2))

		await processCommand(sock, m)
	})

	sock.ev.on('groups.update', async updates => {
		try {
			// log.debug(JSON.stringify(updates, null, 2))
			const m = new MetadataCache(sock)
			await m.updateGroup(updates)
			// log.debug('Groups updated successfully')
			// showAllCache()
			// for (const update of updates) {
			// 	if (update.id) showGroupCache(update.id)
			// }
		} catch (error) {
			log.warn(`[ERROR] Failed to update groups: ${error.message}`)
		}
	})

	sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
		// log.debug(JSON.stringify({ id, participants, action }, null, 2))
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
			// log.debug('Participants updated successfully')
			// showAllCache()
			//showGroupCache(id)
		} catch (error) {
			log.warn(`[ERROR] Failed to update participants: ${error.message}`)
		}
	})
}
