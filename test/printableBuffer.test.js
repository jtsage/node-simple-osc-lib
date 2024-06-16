/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - printBuffer Function */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const testMessages = [
	{
		message : {
			address : '/dca/1/fader',
			args : [{ value : 0.7498, type : 'float' }],
		},
		/* cSpell:disable */
		resultBare    : '¦/dca¦/1/f¦ader¦••••¦,f••¦??¿¿¦',
		resultDefault : '[24]  :: ¦/dca¦/1/f¦ader¦••••¦,f••¦??¿¿¦',
		resultNoBar   : '[24]  :: /dca/1/fader••••,f••??¿¿',
		resultTilde   : '[24]  :: ¦/dca¦/1/f¦ader¦~~~~¦,f~~¦??¿¿¦',
		/* cSpell:enable */
	},
	{
		message : {
			address : '/bus/08/mix/on',
			args : [{ value : 1, type : 'integer' }],
		},
		/* cSpell:disable */
		resultBare    : '¦/bus¦/08/¦mix/¦on••¦,i••¦[..]¦',
		resultDefault : '[24]  :: ¦/bus¦/08/¦mix/¦on••¦,i••¦[..]¦',
		resultNoBar   : '[24]  :: /bus/08/mix/on••,i••[..]',
		resultTilde   : '[24]  :: ¦/bus¦/08/¦mix/¦on~~¦,i~~¦[..]¦',
		/* cSpell:enable */
	},
	{
		message : {
			address : '/dca/1/config/name',
			args : [{ value : 'TESTER', type : 'string' }],
		},
		/* cSpell:disable */
		resultBare    : '¦/dca¦/1/c¦onfi¦g/na¦me••¦,s••¦TEST¦ER••¦',
		resultDefault : '[32]  :: ¦/dca¦/1/c¦onfi¦g/na¦me••¦,s••¦TEST¦ER••¦',
		resultNoBar   : '[32]  :: /dca/1/config/name••,s••TESTER••',
		resultTilde   : '[32]  :: ¦/dca¦/1/c¦onfi¦g/na¦me~~¦,s~~¦TEST¦ER~~¦',
		/* cSpell:enable */
	},
]

const osc = require('../index.js')
const oscRegular = new osc.simpleOscLib()

describe('printableBuffer', () => {
	describe.each(testMessages)('Test $message.address', ({message, resultBare, resultDefault, resultNoBar, resultTilde}) => {
		const thisBuffer = oscRegular.buildMessage(message)
		test(`Default value == ${resultDefault}`, () => {
			expect(oscRegular.printableBuffer(thisBuffer)).toEqual(resultDefault)
		})
		test(`Tilde value   == ${resultTilde}`, () => {
			expect(oscRegular.printableBuffer(thisBuffer, '~')).toEqual(resultTilde)
		})
		test(`No Bar value  == ${resultNoBar}`, () => {
			expect(oscRegular.printableBuffer(thisBuffer, null, '')).toEqual(resultNoBar)
		})
		test(`Bare value    == ${resultBare}`, () => {
			expect(oscRegular.printableBuffer(thisBuffer, null, null, true)).toEqual(resultBare)
		})
	})
	test('invalid input', () => {
		expect(() => oscRegular.printableBuffer('hello')).toThrow(TypeError)
	})
})