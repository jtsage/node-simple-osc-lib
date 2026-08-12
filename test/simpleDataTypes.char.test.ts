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

import * as osc from '../src/index'

const getSimpleExpected = ( type : string, value : osc.OSCArgTypes, emptyBuffer = true ) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc( 0 ) : expect.any( Buffer ),
		type          : type,
		value         : value,
	}
}

const makeCharBuffer = ( value : string ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeUInt32BE( value.charCodeAt( 0 ) )
	return buffer
}

const oscRegular = new osc.simpleOscLib()

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
			expect( () => oscRegular.encodeBufferChunk( 'c', value ) ).toThrow( TypeError )
		} )

		test.each( [
			['a', 4],
			['d', 4],
			['X', 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( oscRegular.encodeBufferChunk( 'c', a ).length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good char', () => {
			const input    = makeCharBuffer( 'A' )
			const expected = getSimpleExpected( 'char', 'A' )
			expect( oscRegular.decodeBufferChunk( 'c', input ) ).toEqual( expected )
		} )
		test( 'non-ASCII char', () => {
			const input    = makeCharBuffer( '❤️' )
			expect( () => oscRegular.decodeBufferChunk( 'c', input ) ).toThrow( TypeError )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => oscRegular.decodeBufferChunk( 'c', input ) ).toThrow( TypeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => oscRegular.decodeBufferChunk( 'c', input ) ).toThrow( RangeError )
		} )
		test( 'char pair (buffer leftover)', () => {
			const input = Buffer.alloc( 8 )
			input.writeUint32BE( 'A'.charCodeAt( 0 ) )
			input.write( 'bye', 4 )
			const expected = getSimpleExpected( 'char', 'A', false )
			const result = oscRegular.decodeBufferChunk( 'c', input )
			expect( result ).toEqual( expected )
			expect( result.buffer_remain.length ).toEqual( 4 )
		} )
	} )
} )
