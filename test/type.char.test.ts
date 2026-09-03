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

import { OSCTypeChar, OSCTypeError, OSCType, OSCDecodeError } from '../src/type'

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
			expect( () => new OSCTypeChar( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			['a', 4],
			['d', 4],
			['X', 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeChar( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'char', value : 'a' } )
			const expected = makeCharBuffer( 'a' )

			expect( output.value ).toEqual( 'a' )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'char' )
			expect( output.debug ).toEqual( 'c::a' )
			expect( output.typeChar ).toEqual( 'c' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeChar )
			expect( output.toJSON() ).toEqual( { type : 'char', value : 'a' } )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good char', () => {
			const input = makeCharBuffer( 'A' )
			const output = OSCTypeChar.fromBuffer( input )

			expect( output.value ).toEqual( 'A' )
		} )
		test( 'non-ASCII char', () => {
			const input    = makeCharBuffer( '❤️' )
			expect( () => OSCTypeChar.fromBuffer( input ) ).toThrow( OSCTypeError )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeChar.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => OSCTypeChar.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
