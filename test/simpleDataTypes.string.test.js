/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - STRING type */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc = require('../index.js')

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
const oscCoerce  = new osc.simpleOscLib({coerceStrings : true})
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})


describe('type :: STRING', () => {
	describe('encodeBufferChunk', () => {
		describe.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'number',  passCOR : true,  passSTD : false,  value : 69 },
			{ humanName : 'object',  passCOR : true,  passSTD : false,  value : {} },
			{ humanName : 'array',   passCOR : true,  passSTD : false,  value : [] },
			{ humanName : 'null',    passCOR : false, passSTD : false,  value : null },
			{ humanName : 'buffer',  passCOR : true,  passSTD : false,  value : Buffer.alloc(4) },
			{ humanName : 'odd OBJ', passCOR : false, passSTD : false,  value : Object.create(null) },
		])('Test with $humanName', ({humanName, value, passSTD, passCOR}) => {
			test(`STRICT FAIL :: ${humanName}`, () => {
				expect(() => oscStrict.encodeBufferChunk('s', value)).toThrow(TypeError)
			})
			test(`NON-STRICT ${ passSTD ? 'PASS' : 'FAIL'} :: ${humanName}`, () => {
				if ( passSTD ) {
					expect(() => oscRegular.encodeBufferChunk('s', value)).not.toThrow()
				} else {
					expect(() => oscRegular.encodeBufferChunk('s', value)).toThrow(TypeError)
				}
			})
			test(`COERCED ${ passCOR ? 'PASS' : 'FAIL'} :: ${humanName}`, () => {
				if ( passCOR ) {
					expect(() => oscCoerce.encodeBufferChunk('s', value)).not.toThrow()
				} else {
					expect(() => oscCoerce.encodeBufferChunk('s', value)).toThrow(TypeError)
				}
			})
		})
		describe('unicode string', () => {
			const input    ='he❤️'
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.encodeBufferChunk('S', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(() => oscRegular.encodeBufferChunk('S', input)).not.toThrow()
			})
		})

		test.each([
			['h', 4],
			['he', 4],
			['hel', 4],
			['hell', 8],
			['hello', 8],
			['helloW', 8],
			['helloWo', 8],
			['helloWorld', 12],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('s', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		describe('good string', () => {
			const input    = makeStringBuffer(8, 'hello')
			const expected = getSimpleExpected('string', 'hello')
			test('STRICT :: PASS', () => {
				expect(oscStrict.decodeBufferChunk('s', input)).toEqual(expected)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
			})
		})
		describe('unicode string', () => {
			const input    = makeStringBuffer(12, 'he❤️')
			const expected = getSimpleExpected('string', 'he❤️')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('S', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('S', input)).toEqual(expected)
			})
		})
		describe('non-buffer', () => {
			const input    = 'hello'
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(TypeError)
			})
			test('NON-STRICT :: FAIL', () => {
				expect(() => oscRegular.decodeBufferChunk('s', input)).toThrow(TypeError)
			})
		})
		describe('no null character', () => {
			const input    = makeStringBuffer(4, 'hell')
			const expected = getSimpleExpected('string', 'hell')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
			})
		})
		describe('insufficiently padded buffer', () => {
			const input    = makeStringBuffer(6, '/hello')
			const expected = getSimpleExpected('string', '/hello')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(RangeError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
			})
		})
		describe('incorrectly padded buffer', () => {
			const input    = makeStringBuffer(4, `by${osc.null}e`)
			const expected = getSimpleExpected('string', 'by')
			test('STRICT :: FAIL', () => {
				expect(() => oscStrict.decodeBufferChunk('s', input)).toThrow(osc.OSCSyntaxError)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
			})
		})
		describe('empty string', () => {
			const input    = makeStringBuffer(4, '')
			const expected = getSimpleExpected('string', '')
			test('STRICT :: PASS', () => {
				expect(oscStrict.decodeBufferChunk('s', input)).toEqual(expected)
			})
			test('NON-STRICT :: PASS', () => {
				expect(oscRegular.decodeBufferChunk('s', input)).toEqual(expected)
			})
		})
		describe('string pair (buffer leftover)', () => {
			const input = Buffer.from(`hel${osc.null}bye${osc.null}`)
			const expected = getSimpleExpected('string', 'hel', false)
			test('STRICT :: PASS', () => {
				const result = oscStrict.decodeBufferChunk('s', input)
				expect(result).toEqual(expected)
				expect(result.buffer_remain.length).toEqual(4)
			})
			test('NON-STRICT :: PASS', () => {
				const result = oscRegular.decodeBufferChunk('s', input)
				expect(result).toEqual(expected)
				expect(result.buffer_remain.length).toEqual(4)
			})
		})
	})
})
