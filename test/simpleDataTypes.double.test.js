/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - DOUBLE type */

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
		value         : expect.closeTo(value),
	}
}

const makeDoubleBuffer = (value) => {
	const buffer = Buffer.alloc(8)
	buffer.writeDoubleBE(value)
	return buffer
}

const oscRegular = new osc.simpleOscLib()

describe('type :: DOUBLE', () => {
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('d', value)).toThrow(TypeError)
		})

		test.each([
			[12.6, 8],
			[486.0, 8],
			[135435345e-8, 8],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('d', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good positive double', () => {
			const input    = makeDoubleBuffer(53.865)
			const expected = getSimpleExpected('double', 53.865)
			expect(oscRegular.decodeBufferChunk('d', input)).toEqual(expected)
		})
		test('good negative double', () => {
			const input    = makeDoubleBuffer(-3265.4)
			const expected = getSimpleExpected('double', -3265.4)
			expect(oscRegular.decodeBufferChunk('d', input)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('d', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(7)
			expect(() => oscRegular.decodeBufferChunk('d', input)).toThrow(RangeError)
		})
		test('double pair (buffer leftover)', () => {
			const input = Buffer.alloc(12)
			input.writeDoubleBE(384.6)
			input.write('bye', 8)
			const expected = getSimpleExpected('double', 384.6, false)
			const result = oscRegular.decodeBufferChunk('d', input)
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})
