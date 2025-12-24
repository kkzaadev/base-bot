import { config } from '#config'
import { start } from './Client.js'

const COLORS = {
	reset: '\x1b[0m',
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',
	bold: '\x1b[1m',
	boldYellow: '\x1b[1;33m',
	boldCyan: '\x1b[1;36m'
}

const TERMINAL_WIDTH = process.stdout.columns || 45

const horizontalLine = (length = TERMINAL_WIDTH, char = '=') => char.repeat(length)

export async function startBanner(options = {}) {
	const { borderChar = '=', color = 'cyan' } = options
	const mainColor = COLORS[color] || COLORS.cyan
	console.log(
		`\n${mainColor}${horizontalLine(TERMINAL_WIDTH, borderChar)}${COLORS.reset}\n` +
			`${mainColor}           KKZAA BOT${COLORS.reset}\n` +
			`${mainColor}${horizontalLine(TERMINAL_WIDTH, borderChar)}${COLORS.reset}\n` +
			`${COLORS.boldYellow}Base Bot${COLORS.reset}\n` +
			`${COLORS.green}Name Bot  :${COLORS.reset} ${config.botname || 'Unknown'}\n` +
			`${COLORS.green}Developer :${COLORS.reset} Zaidan Yusuf Akbar\n` +
			`${COLORS.green}Github    :${COLORS.reset} kkzaadev\n` +
			`${mainColor}${horizontalLine(TERMINAL_WIDTH, borderChar)}${COLORS.reset}\n` +
			`${COLORS.boldCyan}            Made With Love${COLORS.reset}\n` +
			`${mainColor}${horizontalLine(TERMINAL_WIDTH, borderChar)}${COLORS.reset}\n`
	)
}

export async function startBot() {
	await startBanner()
	start()
}
