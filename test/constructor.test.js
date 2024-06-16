/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - class constructor */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}
const osc = require('../index.js')

describe('library initialization', () => {
	test('no options', () => {
		const thisOSC = new osc.simpleOscLib()
		const theseOpts = {
			asciiOnly      : false,
			blockCharacter : '¦',
			debugCharacter : '•',
			preprocessor   : expect.any(Function),
			strictAddress  : false,
			strictMode     : false,
		}
		expect(thisOSC.options).toEqual(theseOpts)
	})
	test('strict mode options', () => {
		const thisOSC = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})
		const theseOpts = {
			asciiOnly      : true,
			blockCharacter : '¦',
			debugCharacter : '•',
			preprocessor   : expect.any(Function),
			strictAddress  : true,
			strictMode     : true,
		}
		expect(thisOSC.options).toEqual(theseOpts)
	})
	test('invalid preprocessor', () => {
		expect(() => new osc.simpleOscLib({preprocessor : 'hi'})).toThrow(TypeError)
	})
})