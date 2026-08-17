/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - INTEGER type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError } from '../src/types'

const makeIntegerBuffer = ( value : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeInt32BE( value )
	return buffer
}

describe( 'type :: INTEGER', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'bigint', value : BigInt( 45 )},
			{ humanName : 'float', value : 69.69 },
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => encodeBuffer( { type : 'integer', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )

		test.each( [
			[0, 4],
			[12, 4],
			[486, 4],
			[135435345, 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( encodeBuffer( { type : 'integer', value : a }, help.regularMode ).buffer.length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'zero integer', () => {
			const input    = makeIntegerBuffer( 0 )
			const expected = help.getSimpleExpected( { type : 'integer', value : 0 } )
			expect( decodeBuffer( 'i', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'good positive integer', () => {
			const input    = makeIntegerBuffer( 53 )
			const expected = help.getSimpleExpected( { type : 'integer', value : 53 } )
			expect( decodeBuffer( 'i', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'good negative integer', () => {
			const input    = makeIntegerBuffer( -32 )
			const expected = help.getSimpleExpected( { type : 'integer', value : -32 } )
			expect( decodeBuffer( 'i', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => decodeBuffer( 'i', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => decodeBuffer( 'i', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'integer pair (buffer leftover)', () => {
			const input = Buffer.alloc( 8 )
			input.writeInt32BE( 384 )
			input.write( 'bye', 4 )
			const expected = help.getSimpleExpected( { type : 'integer', value : 384 }, false )
			const result = decodeBuffer( 'i', input, help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
