/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - COLOR type */

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

const makeColorBuffer = (r, g, b, a) => {
	const buffer = Buffer.alloc(4)
	buffer.writeUInt8(r, 0)
	buffer.writeUInt8(g, 1)
	buffer.writeUInt8(b, 2)
	buffer.writeUInt8(a, 3)
	return buffer
}

const oscRegular = new osc.simpleOscLib()

describe('type :: COLOR', () => {
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc(4)},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : '!==4 element array', value : ['a', 'b']},
			{ humanName : 'non numeric array', value : ['a', 'b', 'c', 'd']},
			{ humanName : 'out-of-bounds array', value : [365, 0, 0, 0]},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('r', value)).toThrow(TypeError)
		})

		test.each([
			[[255, 255, 255, 255], 4],
			[[0, 0, 0, 255], 4],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('r', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good color', () => {
			const input    = makeColorBuffer(255, 125, 100, 255)
			const expected = getSimpleExpected('color', [255, 125, 100, 255])
			expect(oscRegular.decodeBufferChunk('r', input)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('r', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(3)
			expect(() => oscRegular.decodeBufferChunk('r', input)).toThrow(RangeError)
		})
		test('char pair (buffer leftover)', () => {
			const input = Buffer.alloc(4)
			input.write('bye', 4)
			const color = makeColorBuffer(255, 125, 100, 255)
			const expected = getSimpleExpected('color', [255, 125, 100, 255], false)
			const result = oscRegular.decodeBufferChunk('r', Buffer.concat([color, input]))
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})
