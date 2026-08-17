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
import { OSCColor, OSCDecodeError, OSCEncodeError } from '../src/types'

const makeColorBuffer = ( r : number, g : number, b : number, a : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeUInt8( r, 0 )
	buffer.writeUInt8( g, 1 )
	buffer.writeUInt8( b, 2 )
	buffer.writeUInt8( a, 3 )
	return buffer
}

describe( 'type :: COLOR', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : '!==4 element array', value : ['a', 'b']},
			{ humanName : 'non numeric array', value : ['a', 'b', 'c', 'd']},
			{ humanName : 'out-of-bounds array (high)', value : [365, 0, 0, 0]},
			{ humanName : 'out-of-bounds array (low)', value : [-2, 0, 0, 0]},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => encodeBuffer( { type : 'color', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )

		test.each( [
			[[255, 255, 255, 255], 4],
			[[0, 0, 0, 255], 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( encodeBuffer( { type : 'color', value : a as OSCColor }, help.regularMode ).buffer.length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good color', () => {
			const input    = makeColorBuffer( 255, 125, 100, 255 )
			const expected = help.getSimpleExpected( { type : 'color', value : [255, 125, 100, 255] } )
			expect( decodeBuffer( 'r', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => decodeBuffer( 'r', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => decodeBuffer( 'r', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'char pair (buffer leftover)', () => {
			const input = Buffer.alloc( 4 )
			input.write( 'bye', 4 )
			const color = makeColorBuffer( 255, 125, 100, 255 )
			const expected = help.getSimpleExpected( { type : 'color', value : [255, 125, 100, 255] }, false )
			const result = decodeBuffer( 'r', Buffer.concat( [color, input] ), help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
