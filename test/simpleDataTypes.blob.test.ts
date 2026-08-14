/* eslint-disable @stylistic/space-in-parens */
/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - COLOR type */
/// <reference types="node" />
/// <reference types="jest" />

import * as osc from '../src/index'

const getSimpleExpected = ( value : osc.OSCArg, emptyBuffer = true ) => {
	return [
		value,
		emptyBuffer ? Buffer.alloc( 0 ) : expect.any( Buffer ),
	]
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		])('Test with $value ($humanName)', ({humanName, value}) => {
			// @ts-expect-error checking errors.
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

			const expected = getSimpleExpected({ type : 'blob', value : input })
			expect(oscRegular.decodeBufferChunk('b', sender)).toEqual(expected)
		})
		test('non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
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

			const expected = getSimpleExpected({ type : 'blob', value : Buffer.from('hello') } )
			
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
			
			const expected = getSimpleExpected({ type : 'blob', value : input }, false)
			const result = oscRegular.decodeBufferChunk('b', sender)
			expect(result).toEqual(expected)
			expect(result[1].length).toEqual(4)
		})

		test('decode non-padded buffer (non-strict)', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)

			const expected = getSimpleExpected({ type : 'blob', value : Buffer.from('hello') } )
			
			expect(oscRegular.decodeBufferChunk('b', malformedBuffer)).toEqual(expected)
		})

		test('fail decode non-padded buffer (strict)', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)
			
			expect(() => oscStrict.decodeBufferChunk('b', malformedBuffer)).toThrow(RangeError)
		})

		test('round robin', () => {
			const inputString  = 'hello'
			const inputBuffer  = Buffer.from(inputString)
			const encodedBlock = oscRegular.encodeBufferChunk('b', inputBuffer)
			const decodedBlock = oscRegular.decodeBufferChunk('b', encodedBlock)

			const expected = getSimpleExpected( { type : 'blob', value : inputBuffer } )
			
			expect(decodedBlock).toEqual(expected)
		})
	})
})
