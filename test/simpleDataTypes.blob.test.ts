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

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError } from '../src/types'

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
			expect(() => encodeBuffer({ type : 'blob', value : value}, help.regularMode)).toThrow(OSCEncodeError)
		})

		test.each([
			// Buffer size to 4-byte, plus 4 for size field
			[Buffer.from('b'), 8],
			[Buffer.from('by'), 8],
			[Buffer.from('bye'), 8],
			[Buffer.from('head'), 12],
			[Buffer.from('headless'), 16],
		])('Test expected length %s -> %i', (a, b) => {
			expect(encodeBuffer({ type : 'blob', value : a}, help.regularMode).buffer.length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		test('good buffer', () => {
			const input    = Buffer.from('hello')
			const sender   = Buffer.alloc(12)
			sender.write('hello', 4)
			sender.writeUInt32BE(5)

			const expected = help.getSimpleExpected({ type : 'blob', value : input })
			expect(decodeBuffer('b', sender, help.regularMode)).toEqual(expected)
		})

		test('good buffer (strict)', () => {
			const input    = Buffer.from('hello')
			const sender   = Buffer.alloc(12)
			sender.write('hello', 4)
			sender.writeUInt32BE(5)

			const expected = help.getSimpleExpected({ type : 'blob', value : input })
			expect(decodeBuffer('b', sender, help.strictMode)).toEqual(expected)
		})

		test('non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect(() => decodeBuffer('b', input, help.regularMode)).toThrow(OSCDecodeError)
		})

		test('insufficiently padded buffer', () => {
			// minimum is 8, size field is 4, plus min 4 for data.
			const input    = Buffer.alloc(4)
			expect(() => decodeBuffer('b', input, help.regularMode)).toThrow(OSCDecodeError)
		})

		test('buffer too small (under run)', () => {
			const input   = Buffer.alloc(8)
			input.write('hell', 4)
			input.writeUInt32BE(5) // 'hello'
			expect(() => decodeBuffer('b', input, help.regularMode)).toThrow('underrun')
		})

		test('non-strict read incorrectly padded', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)

			const expected = help.getSimpleExpected({ type : 'blob', value : Buffer.from('hello') } )
			
			expect(decodeBuffer('b', malformedBuffer, help.regularMode)).toEqual(expected)
		})

		test('strict read incorrectly padded', () => {
			const malformedBuffer = Buffer.alloc(9)
			malformedBuffer.writeUInt32BE(5)
			malformedBuffer.write('hello', 4)
			
			expect(() => decodeBuffer('b', malformedBuffer, help.strictMode)).toThrow('not 4-byte')
		})

		test('strict read correctly padded (not end null - 0-3 nulls to pad.)', () => {
			const malformedBuffer = Buffer.alloc(8)
			malformedBuffer.writeUInt32BE(4)
			malformedBuffer.write('hell', 4)
			
			const expected = help.getSimpleExpected({ type : 'blob', value : Buffer.from('hell') } )
			
			expect(decodeBuffer('b', malformedBuffer, help.strictMode)).toEqual(expected)
		})

		test('buffer pair (buffer leftover)', () => {
			const input    = Buffer.from('hello')
			const sender   = Buffer.alloc(16)
			sender.write('hello', 4)
			sender.writeUInt32BE(5)
			sender.write('bye', 12) // string on end
			
			const expected = help.getSimpleExpected({ type : 'blob', value : input }, false)
			const result = decodeBuffer('b', sender, help.regularMode)
			expect(result).toEqual(expected)
			expect(result.remain.length).toEqual(4)
		})


		test('round robin', () => {
			const inputString  = 'hello'
			const inputBuffer  = Buffer.from(inputString)
			const encodedBlock = encodeBuffer( { type : 'blob', value : inputBuffer }, help.regularMode)
			const decodedBlock = decodeBuffer('b', encodedBlock.buffer, help.regularMode)

			const expected = help.getSimpleExpected( { type : 'blob', value : inputBuffer } )
			
			expect(decodedBlock).toEqual(expected)
		})
	})
})
