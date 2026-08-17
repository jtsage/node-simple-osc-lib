/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - DOUBLE type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError } from '../src/types'

const makeDoubleBuffer = ( value : number ) => {
	const buffer = Buffer.alloc( 8 )
	buffer.writeDoubleBE( value )
	return buffer
}

describe( 'type :: DOUBLE', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => encodeBuffer( { type : 'double', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )

		test.each( [
			[12.6, 8],
			[486.0, 8],
			[135435345e-8, 8],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( encodeBuffer( { type : 'double', value : a }, help.regularMode ).buffer.length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good positive double', () => {
			const input    = makeDoubleBuffer( 53.865 )
			const expected = help.getSimpleExpected( { type : 'double', value : 53.865 } )
			expect( decodeBuffer( 'd', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'good negative double', () => {
			const input    = makeDoubleBuffer( -3265.4 )
			const expected = help.getSimpleExpected( { type : 'double', value : -3265.4 } )
			expect( decodeBuffer( 'd', input, help.regularMode ) ).toEqual( expected )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => decodeBuffer( 'd', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 7 )
			expect( () => decodeBuffer( 'd', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'double pair (buffer leftover)', () => {
			const input = Buffer.alloc( 12 )
			input.writeDoubleBE( 384.6 )
			input.write( 'bye', 8 )
			const expected = help.getSimpleExpected( { type : 'double', value : 384.6 }, false )
			const result = decodeBuffer( 'd', input, help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
