export default {
	Commands: ['ping'],
	async handle(sock, m) {
		const start = Date.now()
		const sent = await m.send('Pinging...')
		const end = Date.now()
		await sent.edit(`${end - start} ms`)
	}
}
