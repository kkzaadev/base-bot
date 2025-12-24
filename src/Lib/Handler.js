/*
 ─── Info ────────────────────────────
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev

 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { log } from '#utils'

/**
 * Array containing all loaded handlers sorted by priority
 * @type {Array<Object>}
 */
export const handlers = []

/**
 * Recursively loads all handler files from a directory and its subdirectories
 * Each handler must export an object with a `process` function
 * @param {string} dir - The directory path to scan for handlers
 * @returns {Promise<void>}
 */
async function loadHandlers(dir) {
	const files = await fs.promises.readdir(dir)

	for (const file of files) {
		const fullPath = path.join(dir, file)
		const stats = await fs.promises.stat(fullPath)

		if (stats.isDirectory()) {
			await loadHandlers(fullPath)
		} else if (file.endsWith('.js')) {
			try {
				const module = await import(pathToFileURL(fullPath).href + `?update=${Date.now()}`)
				const handler = module.default || module

				if (typeof handler.process === 'function') {
					if (typeof handler.priority === 'undefined') {
						handler.priority = 100
					}
					handlers.push(handler)
				}
			} catch (err) {
				log.error(`Failed to load handler ${fullPath}: ${err.message}`)
			}
		}
	}
}

/**
 * Initializes all handlers from the Handlers directory
 * Loads all handlers and sorts them by priority (lower priority runs first)
 * @returns {Promise<void>}
 */
export async function initHandlers() {
	const handlersDir = path.join(process.cwd(), 'src', 'Handlers')
	await loadHandlers(handlersDir)
	handlers.sort((a, b) => a.priority - b.priority)
	log.info('Load All Handler done...')
}

/**
 * Pre-processes a message through all registered handlers
 * Handlers are executed in order of priority until one returns false
 * @param {Object} sock - The WhatsApp socket instance
 * @param {Object} messageInfo - The serialized message object
 * @returns {Promise<boolean>} Returns false if processing should stop, true otherwise
 */
export async function preProcess(sock, messageInfo) {
	let stopProcessing = false

	for (const handler of handlers) {
		if (stopProcessing) break

		try {
			const result = await handler.process(sock, messageInfo)

			if (result === false) {
				stopProcessing = true
				return false
			}
		} catch (err) {
			log.error(`Error in handler ${handler.name || 'anonymous'}: ${err.message}`)
		}
	}

	return true
}
