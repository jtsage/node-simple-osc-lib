/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - CHAR type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError } from '../src/types'

const makeCharBuffer = ( value : string ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeUInt32BE( value.charCodeAt( 0 ) )
	return buffer
}


describe( 'type :: CHAR', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => encodeBuffer( { type : 'char', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )

		test.each( [
			['a', 4],
			['d', 4],
			['X', 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( encodeBuffer( { type : 'char', value : a }, help.regularMode ).buffer.length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good char', () => {
			const input    = makeCharBuffer( 'A' )
			const expected = help.getSimpleExpected( { type : 'char', value : 'A' } )
			expect( decodeBuffer( 'c', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'non-ASCII char', () => {
			const input    = makeCharBuffer( '❤️' )
			expect( () => decodeBuffer( 'c', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => decodeBuffer( 'c', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => decodeBuffer( 'c', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'char pair (buffer leftover)', () => {
			const input = Buffer.alloc( 8 )
			input.writeUint32BE( 'A'.charCodeAt( 0 ) )
			input.write( 'bye', 4 )
			const expected = help.getSimpleExpected( { type : 'char', value : 'A' }, false )
			const result = decodeBuffer( 'c', input, help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
