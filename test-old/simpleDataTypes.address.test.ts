/* eslint-disable @stylistic/space-in-parens */
/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - ADDRESS type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError } from '../src/types'


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
				expect(() => encodeBuffer(
					// @ts-expect-error testing errors
					{ type : 'address', value : value },
					help.strictMode
				)).toThrow(OSCEncodeError)
			})

			test(`NON-STRICT ${passSTD?'PASS':'FAIL'} :: ${humanName}`, () => {
				if ( passSTD ) {
					expect(() => encodeBuffer(
						// @ts-expect-error testing errors
						{ type : 'address', value : value },
						help.regularMode
					)).not.toThrow()
				} else {
					expect(() => encodeBuffer(
						// @ts-expect-error testing errors
						{ type : 'address', value : value },
						help.regularMode
					)).toThrow(OSCEncodeError)
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
			expect(encodeBuffer(
				{ type : 'address', value : a },
				help.regularMode
			).buffer.length).toEqual(b)
		})
	})
	describe('decodeBufferChunk', () => {
		describe('good address', () => {
			const input    = help.stringBuffer(8, '/hello')
			const expected = help.getSimpleExpected({ type : 'address', value : '/hello'})
			test('STRICT :: PASS', () => {
				expect(decodeBuffer('a', input, help.strictMode)).toEqual(expected)
			})
			test('NON-STRICT :: PASS', () => {
				expect(decodeBuffer('a', input, help.regularMode)).toEqual(expected)
			})
		})

		describe('no leading slash', () => {
			const input    = help.stringBuffer(8, 'hello')
			const expected = help.getSimpleExpected({ type : 'address', value : 'hello'})
			test('STRICT :: FAIL', () => {
				expect(() => decodeBuffer('a', input, help.strictMode)).toThrow('address must start with a slash')
			})
			test('NON-STRICT :: PASS', () => {
				expect(decodeBuffer('a', input, help.regularMode)).toEqual(expected)
			})
		})

		describe('non-buffer', () => {
			const input    = 'hello'
			test('STRICT :: FAIL', () => {
				// @ts-expect-error testing errors
				expect(() => decodeBuffer('a', input, help.strictMode)).toThrow('buffer expected')
			})
			test('NON-STRICT :: FAIL', () => {
				// @ts-expect-error testing errors
				expect(() => decodeBuffer('a', input, help.regularMode)).toThrow('buffer expected')
			})
		})

		describe('incorrectly padded buffer', () => {
			const input    = help.stringBuffer(6, '/hello')
			const expected = help.getSimpleExpected({ type : 'address', value : '/hello'})
			test('STRICT :: FAIL', () => {
				expect(() => decodeBuffer('a', input, help.strictMode)).toThrow('null character')
			})
			test('NON-STRICT :: PASS', () => {
				expect(decodeBuffer('a', input, help.regularMode)).toEqual(expected)
			})
		})

		describe('empty address', () => {
			const input    = help.stringBuffer(4, '')
			test('STRICT :: FAIL', () => {
				expect(() => decodeBuffer('a', input, help.strictMode)).toThrow(OSCDecodeError)
			})
			test('NON-STRICT :: FAIL', () => {
				expect(() => decodeBuffer('a', input, help.regularMode)).toThrow(OSCDecodeError)
			})
		})
	})
})
