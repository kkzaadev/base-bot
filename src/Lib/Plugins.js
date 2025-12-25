/*
 ─── Info ────────────────────────────
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev

 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { log } from '#utils'

/** Path to the plugins directory */
const pluginsPath = join(process.cwd(), 'src', 'Plugins')

/** Array containing all loaded plugins */
export let plugins = []

/** Recursively loads all plugins from a directory and its subdirectories */
export async function loadPlugins(directory) {
	const loadedPlugins = []

	try {
		const files = readdirSync(directory)

		for (const file of files) {
			const fullPath = join(directory, file)
			const stats = statSync(fullPath)

			if (stats.isDirectory()) {
				const subPlugins = await loadPlugins(fullPath)
				loadedPlugins.push(...subPlugins)
			} else if (file.endsWith('.js')) {
				try {
					const module = await import(pathToFileURL(fullPath).href + '?cacheBust=' + Date.now())
					const exported = module.default || module
					const list = Array.isArray(exported) ? exported : [exported]

					for (const plugin of list) {
						if (plugin.Commands && typeof plugin.handle === 'function') {
							loadedPlugins.push(plugin)
						}
					}
				} catch (error) {
					log.error(`Failed to load plugin: ${fullPath} : ${error}`)
				}
			}
		}
	} catch (error) {
		log.error(`Failed to read directory: ${directory} - ${error.message}`)
	}

	return loadedPlugins
}

/** Reloads all plugins from the plugins directory */
export async function reloadPlugins() {
	plugins = await loadPlugins(pluginsPath)
	if (plugins.length === 0) {
		log.warn('No plugins loaded.')
	} else {
		const totalCommands = plugins.reduce((sum, p) => sum + p.Commands.length, 0)
		log.info(`Loaded ${plugins.length} plugins with ${totalCommands} commands`)
	}
	return plugins
}
