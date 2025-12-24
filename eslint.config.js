import js from '@eslint/js'
import globals from 'globals'

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,mjs,cjs}'],

		languageOptions: {
			globals: {
				...globals.node
			},
			ecmaVersion: 'latest',
			sourceType: 'module'
		},

		rules: {
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'no-var': 'error',
			eqeqeq: ['error', 'smart']
		}
	}
]
