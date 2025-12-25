/*
 ─── Info ────────────────────────────
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev
 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	italic: '\x1b[3m',
	dim: '\x1b[2m',
	info: '\x1b[32m',
	warn: '\x1b[33m',
	error: '\x1b[31m',
	debug: '\x1b[34m',
	cyan: '\x1b[36m',
	magenta: '\x1b[35m',
	white: '\x1b[97m',
	brightCyan: '\x1b[96m',
	brightGreen: '\x1b[92m',
	brightYellow: '\x1b[93m',
	brightBlue: '\x1b[94m'
}

/**
 * User type color mapping
 */
// const USER_TYPE_COLORS = {
// 	owner: COLORS.error,
// 	pro: COLORS.brightCyan,
// 	basic: COLORS.info,
// 	free: COLORS.dim
// }

/**
 * Returns current date/time components
 */
function getTimeComponents() {
	const now = new Date()
	return {
		hours: now.getHours().toString().padStart(2, '0'),
		minutes: now.getMinutes().toString().padStart(2, '0'),
		seconds: now.getSeconds().toString().padStart(2, '0'),
		date: now.getDate().toString().padStart(2, '0'),
		month: (now.getMonth() + 1).toString().padStart(2, '0'),
		year: now.getFullYear().toString().slice(-2)
	}
}

/**
 * Returns formatted timestamp string
 */
function timestamp() {
	const { hours, minutes, seconds, date, month, year } = getTimeComponents()
	return `${month}/${date}/${year} [ ${hours}:${minutes}:${seconds} ]`
}

/**
 * Formats an argument for logging
 */
function formatArg(arg) {
	if (arg instanceof Error) return arg.stack ?? arg.message
	if (typeof arg === 'object' && arg !== null) {
		try {
			return JSON.stringify(arg, null, 2)
		} catch {
			return String(arg)
		}
	}
	return arg
}

/**
 * Logger utility with colored output
 */
export const log = {
	info(...args) {
		const prefix = `${COLORS.dim}${COLORS.cyan}${timestamp()}${COLORS.reset} ${COLORS.info}[ INFO ]${COLORS.reset}`
		console.log(prefix, ...args.map(formatArg))
	},
	warn(...args) {
		const prefix = `${COLORS.dim}${COLORS.cyan}${timestamp()}${COLORS.reset} ${COLORS.warn}[ WARN ]${COLORS.reset}`
		console.warn(prefix, ...args.map(formatArg))
	},
	error(...args) {
		const prefix = `${COLORS.dim}${COLORS.cyan}${timestamp()}${COLORS.reset} ${COLORS.error}[ ERROR ]${COLORS.reset}`
		console.error(prefix, ...args.map(formatArg))
	},
	debug(...args) {
		const prefix = `${COLORS.dim}${COLORS.cyan}${timestamp()}${COLORS.reset} ${COLORS.debug}[ DEBUG ]${COLORS.reset}`
		console.log(prefix, ...args.map(formatArg))
	}
}

/**
 * Logs a formatted message with user information
 */
export function logMessage(pushname, content, senderAlt /*, userType */) {
	const { hours, minutes, seconds, date, month, year } = getTimeComponents()

	const dateStr = `${COLORS.dim}${COLORS.cyan}${month}/${date}/${year}${COLORS.reset}`
	const time = `${COLORS.cyan}[ ${hours}:${minutes}:${seconds} ]${COLORS.reset}`
	const user = `${COLORS.italic}${COLORS.magenta}[ ${senderAlt} ]${COLORS.reset}`
	// const type = `${COLORS.italic}${USER_TYPE_COLORS[userType] || COLORS.dim}[ ${userType.toUpperCase()} ]${COLORS.reset}`
	const name = `${COLORS.italic}${COLORS.warn}[ ${pushname} ]${COLORS.reset}`
	const message = `${COLORS.white}${content}${COLORS.reset}`

	console.log(`${dateStr} ${time} ${user} ${name}`)
	console.log(message)
}
