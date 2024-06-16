/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - buildMessage */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}
const osc = require('../index.js')

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('buildMessage Output', () => {
	test('two strings with nested array (bang)', () => {
		const oscMessage = {
			address : '/hello',
			args    : [
				[[
					{type : 'bang', value : null },
		
				]],
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		const expected = Buffer.from(`/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}`)
		expect(oscRegular.buildMessage(oscMessage)).toEqual(expected)
	})
	test('two strings with nested garbage (fail)', () => {
		const oscMessage = {
			address : '/hello',
			args    : [
				[['hello']],
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('strict mode fails with non slash address', () => {
		const oscMessage = {
			address : 'hello',
			args    : [
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		expect(() => oscStrict.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('address is required (empty)', () => {
		const oscMessage = {
			address : '',
			args    : [
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('address is ascii-only', () => {
		const oscMessage = {
			address : '/ÄÄBB',
			args    : [
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('address is required (missing)', () => {
		const oscMessage = {
			args    : [
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('arguments are optional', () => {
		const oscMessage = {
			address : '/hello',
		}
		const expected = Buffer.from(`/hello${osc.null}${osc.null}`)
		expect(oscRegular.buildMessage(oscMessage)).toEqual(expected)
	})
	test('arguments must be an array', () => {
		const oscMessage = {
			address : 'hello',
			args    : 'hello there',
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})
	test('arguments must be correct type', () => {
		const oscMessage = {
			address : 'hello',
			args    : [{ type : 'string', blag : 'me' }],
		}
		expect(() => oscRegular.buildMessage(oscMessage)).toThrow(osc.OSCSyntaxError)
	})

	describe('standard message build', () => {
		test.each([
			['/-show/prepos/current', 1, 'integer', 32],
			['/-show/prepos', 1, 'integer', 24],
			['/bus/14/mix/fader', 0.4878, 'float', 28],
			['/dca/1/fader', 0.7498, 'float', 24],
			['/dca/1/on', 1, 'integer', 20],
			['/bus/08/mix/on', 1, 'integer', 24],
			['/bus/08/config/name', 'HEAD', 'string', 32],
			['/dca/1/config/name', 'TESTER', 'string', 32],
		])('build osc buffer (%s) [%s:%s] and check size (%i bytes)', (a, b, c, expected) => {
			const thisMessage = {
				address : a,
				args : [{type : c, value : b}],
			}
			const thisBuild = oscRegular.buildMessage(thisMessage)

			expect(thisBuild.length).toEqual(expected)
		})
	})
})