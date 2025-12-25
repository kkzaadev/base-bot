const numberBot = '6285133890257' // number bot
const prefix = ['.'] // prefix bot
const owner = ['6285133890257'] // owner numbers (without @s.whatsapp.net)
const botMode = 'group' // 'group' or 'private' or 'both'

export const config = {
	phone: numberBot,
	prefix,
	owner: owner.map(num => `${num}@s.whatsapp.net`),
	botMode
}
