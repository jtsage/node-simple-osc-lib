/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - INTEGER type */

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

const makeIntegerBuffer = (value) => {
	const buffer = Buffer.alloc(4)
	buffer.writeInt32BE(value)
	return buffer
}

const oscRegular = new osc.simpleOscLib()

describe('type :: INTEGER', () => {
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'bigint', value : BigInt(45)},
			{ humanName : 'float', value : 69.69 },
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
			{ humanName : 'buffer', value : Buffer.alloc(4)},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('i', value)).toThrow(TypeError)
		})

		test.each([
			[12, 4],
			[486, 4],
			[135435345, 4],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('i', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good positive integer', () => {
			const input    = makeIntegerBuffer(53)
			const expected = getSimpleExpected('integer', 53)
			expect(oscRegular.decodeBufferChunk('i', input)).toEqual(expected)
		})
		test('good negative integer', () => {
			const input    = makeIntegerBuffer(-32)
			const expected = getSimpleExpected('integer', -32)
			expect(oscRegular.decodeBufferChunk('i', input)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('i', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(3)
			expect(() => oscRegular.decodeBufferChunk('i', input)).toThrow(RangeError)
		})
		test('integer pair (buffer leftover)', () => {
			const input = Buffer.alloc(8)
			input.writeInt32BE(384)
			input.write('bye', 4)
			const expected = getSimpleExpected('integer', 384, false)
			const result = oscRegular.decodeBufferChunk('i', input)
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})
