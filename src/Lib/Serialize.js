import { downloadMediaMessage, getContentType, isJidGroup, normalizeMessageContent } from 'baileys'
import { fileTypeFromBuffer } from 'file-type'
import { config } from '#config'

/** Serialize class for parsing and handling WhatsApp messages */
export class Serialize {
	/** Creates a serialized message instance with parsed properties */
	constructor(sock, message) {
		this.sock = sock
		this.chat = message.key.remoteJid
		this.key = message.key
		this.message = normalizeMessageContent(message.message)
		this.isGroup = isJidGroup(message.key.remoteJid)
		this.sender = !this.isGroup ? this.key.remoteJid : this.key.participant
		this.senderAlt = !this.isGroup ? this.key.remoteJidAlt : this.key.participantAlt
		this.type = getContentType(this.message)
		this.image = this.type === 'imageMessage'
		this.video = this.type === 'videoMessage'
		this.audio = this.type === 'audioMessage'
		this.sticker = this.type === 'stickerMessage' || this.type === 'lottieStickerMessage'
		this.pushName = message.pushName
		const content = this.message?.[this.type]
		this.contextInfo = typeof content === 'object' && content !== null ? content.contextInfo : undefined

		this.quoted =
			this.contextInfo?.stanzaId && this.contextInfo?.quotedMessage ? new Quoted(this.contextInfo, sock) : undefined

		this.text = this.message ? extract_text(this.message) : ''

		// Mentions
		this.mentions = this.contextInfo?.mentionedJid || []

		// Prefix & Command parsing
		const textTrimmed = (this.text || '').trim()
		const tokens = textTrimmed.replace(/\s+/g, ' ')
		const words = tokens.split(/\s+/)
		const firstToken = words[0]?.toLowerCase() || ''

		// Find matching prefix
		const prefixList = Array.isArray(config.prefix) ? config.prefix : ['.']
		this.prefix = prefixList.find(p => firstToken.startsWith(p)) || ''

		// Parse command
		if (this.prefix) {
			const afterPrefix = firstToken.slice(this.prefix.length)
			this.command = afterPrefix || words[1]?.toLowerCase() || ''
		} else {
			this.command = ''
		}

		// Calculate args position
		let argsStartIndex = 0
		if (this.prefix && this.command) {
			const afterPrefix = firstToken.slice(this.prefix.length)
			if (afterPrefix) {
				// .ping args... → skip firstToken
				argsStartIndex = firstToken.length
			} else {
				// . ping args... → skip prefix and command
				argsStartIndex = firstToken.length + 1 + this.command.length
			}
		}

		// args = normalized (extra spaces removed)
		this.args = tokens.slice(argsStartIndex).trim()

		// rawArgs = preserves original formatting (newlines, multiple spaces)
		const commandIndex = textTrimmed.toLowerCase().indexOf(this.command)
		this.rawArgs =
			this.command && commandIndex !== -1 ? textTrimmed.slice(commandIndex + this.command.length).trim() : ''

		Object.defineProperties(this, {
			contextInfo: {
				value: this.contextInfo,
				enumerable: false,
				writable: true,
				configurable: true
			},
			sock: {
				value: sock,
				enumerable: false,
				writable: true,
				configurable: true
			}
		})
	}

	/** Sends a reply message quoting the original message */
	async reply(text) {
		const msg = await this.sock.sendMessage(this.chat, { text }, { quoted: this })
		return new Serialize(this.sock, msg)
	}

	/** Edits the current message with new text */
	async edit(text) {
		if (this.image) {
			return await this.sock.sendMessage(this.chat, {
				edit: this.key,
				image: { url: '' },
				text
			})
		} else if (this.video) {
			return await this.sock.sendMessage(this.chat, {
				edit: this.key,
				video: { url: '' },
				text
			})
		} else {
			return await this.sock.sendMessage(this.chat, { edit: this.key, text })
		}
	}

	/** Sends a message (text, media buffer, or URL) without quoting */
	async send(content, options = {}) {
		const isBuffer = Buffer.isBuffer(content)
		const isUrl = typeof content === 'string' && /^https?:\/\//i.test(content)
		const isText = typeof content === 'string' && !isUrl

		if (isText) {
			const msg = await this.sock.sendMessage(this.chat, { text: content })
			return new Serialize(this.sock, msg)
		}

		let mediaType
		let detectedMimetype = options.mimetype

		if (isBuffer) {
			try {
				const fileType = await fileTypeFromBuffer(content)
				if (fileType) {
					detectedMimetype = detectedMimetype || fileType.mime
					mediaType = this.mimetypeToMediaType(fileType.mime)
				} else {
					mediaType = 'document'
					detectedMimetype = detectedMimetype || 'application/octet-stream'
				}
			} catch {
				mediaType = 'document'
				detectedMimetype = detectedMimetype || 'application/octet-stream'
			}
		} else {
			const detection = this.detectFromUrl(content, options.mimetype)
			mediaType = detection.type
			detectedMimetype = detectedMimetype || detection.mimetype
		}

		const mediaContent = isUrl ? { url: content } : content
		const messageData = {
			[mediaType]: mediaContent,
			...(options.caption && { caption: options.caption }),
			...(detectedMimetype && { mimetype: detectedMimetype }),
			...(options.filename && mediaType === 'document' && { fileName: options.filename }),
			...(options.gifPlayback && mediaType === 'video' && { gifPlayback: true })
		}

		const msg = await this.sock.sendMessage(this.chat, messageData)
		return new Serialize(this.sock, msg)
	}

	/** Blocks a user from messaging the bot */
	async Block(user) {
		const blocked = await this.sock.fetchBlocklist()

		if (!blocked.includes(user)) {
			await this.sock.updateBlockStatus(user, 'block')
			return true
		}
		return null
	}

	/** Unblocks a previously blocked user */
	async Unblock(user) {
		const blocked = await this.sock.fetchBlocklist()

		if (blocked.includes(user)) {
			await this.sock.updateBlockStatus(user, 'unblock')
			return true
		}
		return null
	}

	/** Forwards a message to another chat */
	async forward(jid, msg, opts = {}) {
		return await this.sock.sendMessage(
			jid,
			{
				forward: msg,
				contextInfo: {
					forwardingScore: opts?.forwardScore,
					isForwarded: opts?.forceForward
				}
			},
			{ quoted: this }
		)
	}

	/** Converts mimetype to Baileys media type (image, video, audio, document) */
	mimetypeToMediaType(mimetype) {
		if (mimetype.startsWith('image/')) return 'image'
		if (mimetype.startsWith('video/')) return 'video'
		if (mimetype.startsWith('audio/')) return 'audio'
		return 'document'
	}

	/** Detects media type from URL extension */
	detectFromUrl(url, mimetype) {
		if (mimetype) {
			return { type: this.mimetypeToMediaType(mimetype), mimetype }
		}

		const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
		const extMap = {
			jpg: { type: 'image', mimetype: 'image/jpeg' },
			jpeg: { type: 'image', mimetype: 'image/jpeg' },
			png: { type: 'image', mimetype: 'image/png' },
			gif: { type: 'image', mimetype: 'image/gif' },
			webp: { type: 'image', mimetype: 'image/webp' },
			mp4: { type: 'video', mimetype: 'video/mp4' },
			webm: { type: 'video', mimetype: 'video/webm' },
			mkv: { type: 'video', mimetype: 'video/x-matroska' },
			mp3: { type: 'audio', mimetype: 'audio/mpeg' },
			ogg: { type: 'audio', mimetype: 'audio/ogg' },
			wav: { type: 'audio', mimetype: 'audio/wav' },
			m4a: { type: 'audio', mimetype: 'audio/mp4' },
			pdf: { type: 'document', mimetype: 'application/pdf' }
		}

		return extMap[ext] || { type: 'document', mimetype: 'application/octet-stream' }
	}
}

/** Quoted class for handling quoted/replied messages */
class Quoted {
	/** Creates a quoted message instance */
	constructor(quoted, sock) {
		this.key = {
			remoteJid: quoted.remoteJid,
			id: quoted.stanzaId,
			participant: quoted.participant,
			participantAlt: undefined
		}
		this.sender = quoted.participant
		this.sender_alt = this.key.participantAlt
		this.message = normalizeMessageContent(quoted.quotedMessage)
		this.type = getContentType(this.message)
		this.image = this.type === 'imageMessage'
		this.video = this.type === 'videoMessage'
		this.audio = this.type === 'audioMessage'
		this.sticker = this.type === 'stickerMessage' || this.type === 'lottieStickerMessage'

		this.text = extract_text(this.message)
		this.sock = sock
		this.media = [this.image, this.video, this.audio, this.sticker].includes(true)
		this.viewonce = this.media && this.message?.[this.type]?.viewOnce === true

		Object.defineProperty(this, 'sock', { value: sock, enumerable: false })
	}

	/** Downloads the quoted media as a buffer */
	async download() {
		return await downloadMediaMessage(this, 'buffer', {})
	}
}

/** Extracts text content from various message types */
function extract_text(message) {
	if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text
	if (message?.conversation) return message.conversation
	if (message?.imageMessage?.caption) return message.imageMessage.caption
	if (message?.videoMessage?.caption) return message.videoMessage.caption
	if (message?.documentMessage?.caption) return message.documentMessage.caption
	if (message?.buttonsMessage?.contentText) return message.buttonsMessage.contentText
	if (message?.templateMessage?.hydratedTemplate?.hydratedContentText)
		return message.templateMessage.hydratedTemplate.hydratedContentText
	if (message?.listMessage?.description) return message.listMessage.description
	if (message?.protocolMessage?.editedMessage) {
		const text = extract_text(message.protocolMessage.editedMessage)
		if (text) return text
	}
	if (message?.ephemeralMessage?.message) {
		const text = extract_text(message.ephemeralMessage.message)
		if (text) return text
	}
	return undefined
}
