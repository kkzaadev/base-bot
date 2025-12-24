/*
 👨‍💻 Developer  : Zaidan Yusuf Akar
 💻 GitHub     : github.com/kkzaadev
 📝 Kkzaabot Made With Love And Sighs❤️👉👌💦
*/

import { startBot } from '#core'

console.log(`Start BaseBot ...`)

process.env.TZ = 'Asia/Jakarta' // Timezone your country
try {
	await startBot()
} catch (err) {
	console.error('Error startBot:', err.message)
	process.exit(1)
}

process.on('uncaughtException', async err => {
	console.error('❌ Uncaught Exception:', err)
	process.exit(1)
})

process.on('unhandledRejection', async reason => {
	console.error('❌ Unhandled Rejection:', reason)
	process.exit(1)
})
