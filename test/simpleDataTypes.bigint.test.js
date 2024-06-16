/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - BIG INTEGER type */

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

const makeBigIntegerBuffer = (value) => {
	const buffer = Buffer.alloc(8)
	buffer.writeBigInt64BE(value)
	return buffer
}

const oscRegular = new osc.simpleOscLib()

describe('type :: BIGINT', () => {
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'float', value : 69.69 },
			{ humanName : 'integer', value : 69 },
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
			{ humanName : 'buffer', value : Buffer.alloc(4)},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('h', value)).toThrow(TypeError)
		})

		test.each([
			[BigInt(4), 8],
			[BigInt(486), 8],
			[BigInt(9007199254740991), 8],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('h', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good positive integer', () => {
			const input    = makeBigIntegerBuffer(BigInt(53))
			const expected = getSimpleExpected('bigint', BigInt(53))
			expect(oscRegular.decodeBufferChunk('h', input)).toEqual(expected)
		})
		test('good negative integer', () => {
			const input    = makeBigIntegerBuffer(BigInt(-9007199254740991))
			const expected = getSimpleExpected('bigint', BigInt(-9007199254740991))
			expect(oscRegular.decodeBufferChunk('h', input)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('h', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(7)
			expect(() => oscRegular.decodeBufferChunk('h', input)).toThrow(RangeError)
		})
		test('bigint pair (buffer leftover)', () => {
			const input = Buffer.alloc(12)
			input.writeBigInt64BE(BigInt(384))
			input.write('bye', 8)
			const expected = getSimpleExpected('bigint', BigInt(384), false)
			const result = oscRegular.decodeBufferChunk('h', input)
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})
