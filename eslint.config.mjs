// @ts-check

import { defineConfig } from 'eslint/config'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'

export default defineConfig({
	files : ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],

	extends : [js.configs.recommended, tseslint.configs.recommended],

	languageOptions : {
		ecmaVersion : 2022,
		
		globals     : {
			...globals.browser,
			...globals.node,
			...globals.es2021,
			...globals.jest,
		},
		parserOptions : {
			requireConfigFile : false,
		},
		sourceType  : 'module',
	},
	plugins : {
		unicorn : eslintPluginUnicorn,
		'@stylistic' : stylistic,
	},
	rules : {

		'@stylistic/comma-dangle' : [
			'error',
			{
				'arrays'    : 'only-multiline',
				'exports'   : 'never',
				'functions' : 'never',
				'imports'   : 'never',
				'objects'   : 'always-multiline',
			}
		],
		'@stylistic/indent' : [
			'error',
			'tab',
			{ 'SwitchCase' : 1 },
		],
		'@stylistic/key-spacing' : [
			'error',
			{
				'afterColon'  : true,
				'beforeColon' : true,
				'mode'        : 'minimum',
			},
		],
		
		'@stylistic/no-trailing-spaces' : [
			'error',
			{
				'ignoreComments' : true,
				'skipBlankLines' : true,
			},
		],
		'no-unused-vars' : [
			'error',
			{
				'args'              : 'all',
				'argsIgnorePattern' : '^_',
				'varsIgnorePattern' : '^_|^client',
			},
		],
		'sort-keys' : [
			'warn',
			'asc',
			{
				'allowLineSeparatedGroups' : true,
				'caseSensitive'            : false,
				'minKeys'                  : 4,
				'natural'                  : true,
			}
		],

		'complexity'                      : ['warn', 30],
		'default-case'                    : 'error',
		'dot-notation'                    : 'error',
		'eqeqeq'                          : 'error',
		'no-await-in-loop'                : 'error',
		'no-console'                      : 'warn',
		'no-duplicate-imports'            : 'error',
		'no-else-return'                  : 'error',
		'no-global-assign'                : 'error',
		'no-implicit-coercion'            : 'error',
		'no-implicit-globals'             : 'error',
		'no-lonely-if'                    : 'error',
		'no-multi-str'                    : 'error',
		'no-param-reassign'               : 'error',
		'no-promise-executor-return'      : 'error',
		'no-sequences'                    : 'error',
		'no-shadow'                       : ['error', { 'builtinGlobals' : true }],
		'no-template-curly-in-string'     : 'error',
		'no-throw-literal'                : 'error',
		'no-unneeded-ternary'             : 'error',
		'no-unreachable-loop'             : 'error',
		'no-unused-expressions'           : 'error',
		'no-unused-private-class-members' : 'error',
		'no-useless-backreference'        : 'error',
		'no-useless-concat'               : 'error',
		'no-var'                          : 'error',
		'prefer-arrow-callback'           : 'error',
		'prefer-const'                    : 'error',
		'prefer-template'                 : 'error',
		'require-atomic-updates'          : 'error',
		
		'@stylistic/array-bracket-spacing' : ['error', 'never'],
		'@stylistic/arrow-parens'          : 'error',
		'@stylistic/comma-spacing'         : 'error',
		'@stylistic/function-call-spacing' : 'error',
		'@stylistic/keyword-spacing'       : 'error',
		'@stylistic/quotes'                : ['error', 'single'],
		'@stylistic/semi'                  : ['error', 'never'],

		'unicorn/catch-error-name'                 : ['error', { 'name' : 'err' }],
		'unicorn/consistent-destructuring'         : 'error',
		'unicorn/consistent-function-scoping'      : 'error',
		'unicorn/consistent-json-file-read'        : 'error',
		'unicorn/empty-brace-spaces'               : 'error',
		'unicorn/error-message'                    : 'error',
		'unicorn/escape-case'                      : 'error',
		'unicorn/explicit-length-check'            : ['error', { 'non-zero' : 'not-equal' }],
		'unicorn/new-for-builtins'                 : 'error',
		'unicorn/no-abusive-eslint-disable'        : 'error',
		'unicorn/no-array-callback-reference'      : 'error',
		'unicorn/no-array-method-this-argument'    : 'error',
		'unicorn/no-for-loop'                      : 'error',
		'unicorn/no-lonely-if'                     : 'error',
		'unicorn/no-this-assignment'               : 'error',
		'unicorn/no-unnecessary-await'             : 'error',
		'unicorn/no-unused-properties'             : 'error',
		'unicorn/no-useless-length-check'          : 'error',
		'unicorn/no-useless-spread'                : 'error',
		'unicorn/no-useless-switch-case'           : 'error',
		'unicorn/prefer-array-some'                : 'error',
		'unicorn/prefer-native-coercion-functions' : 'error',
		'unicorn/prefer-node-protocol'             : 'error',
		'unicorn/prefer-set-has'                   : 'error',
		'unicorn/prefer-single-call'               : 'error',
		'unicorn/prefer-spread'                    : 'error',
		'unicorn/require-array-join-separator'     : 'error',
		'unicorn/throw-new-error'                  : 'error',
	},
})
