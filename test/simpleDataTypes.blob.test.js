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

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('type :: BLOB', () => {
	describe('encodeBufferChunk', () => {
		test.each([
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : ['a', 'b']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			expect(() => oscRegular.encodeBufferChunk('b', value)).toThrow(TypeError)
		})

		test.each([
			// Buffer size to 4-byte, plus 4 for size field
			[Buffer.from('bye'), 8],
			[Buffer.from('headless'), 16],
		])('Test expected length %s -> %i', (a, b) => {
			expect(oscRegular.encodeBufferChunk('b', a).length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good buffer', () => {
			const input    = Buffer.from('hello')
			const sender   = Buffer.alloc(12)
			sender.write('hello', 4)
			sender.writeUInt32BE(5)

			const expected = getSimpleExpected('blob', input)
			expect(oscRegular.decodeBufferChunk('b', sender)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			expect(() => oscRegular.decodeBufferChunk('b', input)).toThrow(TypeError)
		})
		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(4)
			expect(() => oscRegular.decodeBufferChunk('b', input)).toThrow(RangeError)
		})
		test('buffer too small (under run)', () => {
			const input   = Buffer.alloc(8)
			input.write('hell', 4)
			input.writeUInt32BE(5) // 'hello'
			expect(() => oscRegular.decodeBufferChunk('b', input)).toThrow(RangeError)
		})
		test('non-strict read incorrectly padded', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)

			const expected = getSimpleExpected('blob', Buffer.from('hello'))
			
			expect(oscRegular.decodeBufferChunk('b', malformedBuffer)).toEqual(expected)
		})
		test('strict read incorrectly padded', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)
			
			expect(() => oscStrict.decodeBufferChunk('b', malformedBuffer)).toThrow(RangeError)
		})
		test('buffer pair (buffer leftover)', () => {
			const input    = Buffer.from('hello')
			const sender   = Buffer.alloc(16)
			sender.write('hello', 4)
			sender.writeUInt32BE(5)
			sender.write('bye', 12) // string on end
			
			const expected = getSimpleExpected('blob', input, false)
			const result = oscRegular.decodeBufferChunk('b', sender)
			expect(result).toEqual(expected)
			expect(result.buffer_remain.length).toEqual(4)
		})
	})
})

// describe('blobs', () => {
// 	test('decode non-padded buffer (non-strict)', () => {
// 		const malformedBuffer = Buffer.alloc(9)
// 		malformedBuffer.writeUInt32BE(5)
// 		malformedBuffer.write('hello', 4)

// 		const expected = getSimpleExpected('blob', Buffer.from('hello'))
		
// 		expect(oscRegular.decodeBufferChunk('b', malformedBuffer)).toEqual(expected)
// 	})

// 	test('fail decode non-padded buffer (strict)', () => {
// 		const malformedBuffer = Buffer.alloc(9)
// 		malformedBuffer.writeUInt32BE(5)
// 		malformedBuffer.write('hello', 4)
		
// 		expect(() => oscStrict.decodeBufferChunk('b', malformedBuffer)).toThrow(osc.OSCSyntaxError)
// 	})

// 	test('round robin', () => {
// 		const inputString  = 'hello'
// 		const inputBuffer  = Buffer.from(inputString)
// 		const encodedBlock = oscRegular.encodeBufferChunk('b', inputBuffer)
// 		const decodedBlock = oscRegular.decodeBufferChunk('b', encodedBlock)

// 		const expected = getSimpleExpected('blob', inputBuffer)
		
// 		expect(decodedBlock).toEqual(expected)
// 	})
// })
