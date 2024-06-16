/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - messageBuilder */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc  = require('../index.js')

const oscRegular = new osc.simpleOscLib()

const valueNameMap = {
	blob    : Buffer.from('AbCDeF'),
	float   : 69.69,
	integer : 20,
	string  : 'hello world',
}

describe('message builder', () => {
	test('build init fail (no address)', () => {
		expect(() => oscRegular.messageBuilder()).toThrow(TypeError)
	})

	const testBuilder = oscRegular.messageBuilder('/test')

	describe.each(Object.keys(valueNameMap))('Test build type %s', (buildType) => {
		describe.each(Object.keys(valueNameMap))('Test input of type %s,', (inputType) => {
			if ( buildType === inputType || (buildType === 'float' && inputType === 'integer') ) {
				test('type is valid', () => {
					expect(() => testBuilder[buildType](valueNameMap[inputType])).not.toThrow()
				})
				test('type is valid (shortcut)', () => {
					expect(() => testBuilder[buildType[0]](valueNameMap[inputType])).not.toThrow()
				})
			} else {
				test('type is invalid', () => {
					expect(() => testBuilder[buildType](valueNameMap[inputType])).toThrow(TypeError)
				})
			}
		})
	})

	describe('messageBuilder output', () => {
		const thisBuilder = oscRegular.messageBuilder('/test')
		
		thisBuilder
			.integer(20)
			.float(69.69)
			.string('hello world')
			.blob(Buffer.from('AaBbCc'))

		const results = Buffer.from('2f746573740000002c6966736200000000000014428b614868656c6c6f20776f726c6400000000064161426243630000', 'hex')
		const debug   = '[48]  :: ¦/tes¦t•••¦,ifs¦b•••¦[..]¦B¿aH¦hell¦o wo¦rld•¦[..]¦AaBb¦Cc••¦'
		
		test('buffer identical', () => {
			expect(thisBuilder.toBuffer()).toEqual(results)
		})

		test('debug identical', () => {
			expect(thisBuilder.toString()).toEqual(debug)
		})
	})

	// test('build empty ok', () => {
	// 	expect(oscRegular.messageBuilder('/hello').toBuffer().length).toEqual(12)
	// })
	// test('build empty roundtrip ok', () => {
	// 	const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').toBuffer())
	// 	expect(output.args.length).toEqual(0)
	// 	expect(output.address).toEqual('/hello')
	// })

	// test('build string ok', () => {
	// 	expect(oscRegular.messageBuilder('/hello').s('hello').toBuffer().length).toEqual(20)
	// })
	// test('build integer roundtrip ok', () => {
	// 	const input = 'howdy'
	// 	const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').s(input).toBuffer())
	// 	expect(output.args[0].value).toEqual(input)
	// })
	// test('build string fail (bad type)', () => {
	// 	expect(() => oscRegular.messageBuilder('/hello').s(20)).toThrow(TypeError)
	// })

	// test('build integer ok', () => {
	// 	expect(oscRegular.messageBuilder('/hello').i(20).toBuffer().length).toEqual(16)
	// })
	// test('build integer roundtrip ok', () => {
	// 	const input = 20
	// 	const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').i(input).toBuffer())
	// 	expect(output.args[0].value).toEqual(input)
	// })
	// test('build integer fail (bad type)', () => {
	// 	expect(() => oscRegular.messageBuilder('/hello').i(20.2022)).toThrow(TypeError)
	// })

	// test('build float ok', () => {
	// 	expect(oscRegular.messageBuilder('/hello').f(69.23).toBuffer().length).toEqual(16)
	// })
	// test('build float roundtrip ok', () => {
	// 	const input = 69.23
	// 	const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').f(input).toBuffer())
	// 	expect(output.args[0].value).toBeCloseTo(input)
	// })
	// test('build float fail (bad type)', () => {
	// 	expect(() => oscRegular.messageBuilder('/hello').f('not float')).toThrow(TypeError)
	// })

	// test('build buffer ok', () => {
	// 	expect(oscRegular.messageBuilder('/hello').b(Buffer.alloc(3)).toBuffer().length).toEqual(20)
	// })
	// test('build buffer roundtrip ok', () => {
	// 	const input = Buffer.alloc(3).fill('c')
	// 	const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').b(input).toBuffer())
	// 	expect(output.args[0].value).toEqual(input)
	// })
	// test('build buffer fail (bad type)', () => {
	// 	expect(() => oscRegular.messageBuilder('/hello').b('not buffer')).toThrow(TypeError)
	// })

	test.todo('string output')
})