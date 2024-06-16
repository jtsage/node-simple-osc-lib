/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - ADDRESS type */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc  = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const makeStringBuffer = (size, content) => {
	const buffer = Buffer.alloc(size)
	buffer.write(content)
	return buffer
}

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('type :: ADDRESS', () => {
	describe('encodeBufferChunk', () => {
		describe.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'number', value : 69, passSTD : false},
			{ humanName : 'object', value : {}, passSTD : false},
			{ humanName : 'array', value : [], passSTD : false},
			{ humanName : 'null', value : null, passSTD : false},
			{ humanName : 'non-ascii', value : '/hi❤️', passSTD : false},
			{ humanName : 'buffer', value : Buffer.alloc(4), passSTD : false},
			{ humanName : 'no lead slash', value : 'hello', passSTD : true},
		])('Test with $value address', ({humanName, value, passSTD}) => {
			test(`STRICT FAIL :: ${humanName}`, () => {
				expect(() => oscStrict.encodeBufferChunk('A', value)).toThrow(osc.OSCSyntaxError)
			})
			test(`NON-STRICT ${passSTD?'PASS':'FAIL'} :: ${humanName}`, () => {
				if ( passSTD ) {
					expect(() => oscRegular.encodeBufferChunk('A', value)).not.toThrow()
				} else {
					expect(() => oscRegular.encodeBufferChunk('A', value)).toThrow(osc.OSCSyntaxError)
				}
			})
		})

		test.each([
			['/h', 4],
			['/he', 4],
			['/hel', 8],
			['/hell', 8],
			['/hello', 8],
			['/helloW', 8],
			['/helloWo', 12],
			['/helloWorld', 12],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('A', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		describe('good address', () => {
			const input    = makeStringBuffer(8, '/hello')
			const expected = getSimpleExpected('address', '/hello')
			test('STRICT :: PASS', () => {
				expect(oscStrict.decodeBufferChunk('A', input)).toEqual(expected)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('A', input)).toEqual(expected)
			})
		})
		describe('no leading slash', () => {
			const input    = makeStringBuffer(8, 'hello')
			const expected = getSimpleExpected('address', 'hello')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('A', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('A', input)).toEqual(expected)
			})
		})
		describe('non-buffer', () => {
			const input    = 'hello'
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('A', input)).toThrow(TypeError)
			})
			test('NON-STRICT :: FAIL', () => {
				expect(() => oscRegular.decodeBufferChunk('A', input)).toThrow(TypeError)
			})
		})
		describe('incorrectly padded buffer', () => {
			const input    = makeStringBuffer(6, '/hello')
			const expected = getSimpleExpected('address', '/hello')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('A', input)).toThrow(RangeError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('A', input)).toEqual(expected)
			})
		})
		describe('empty address', () => {
			const input    = makeStringBuffer(4, '')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('A', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: FAIL', () => {
				expect(() => oscRegular.decodeBufferChunk('A', input)).toThrow(osc.OSCSyntaxError)
			})
		})
	})
})
