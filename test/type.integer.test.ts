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

import { OSCTypeInteger, OSCTypeError, OSCDecodeError, OSCType } from '../src/type'

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
			expect( () => new OSCTypeInteger( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			[0, 4],
			[12, 4],
			[486, 4],
			[135435345, 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeInteger( b ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'integer', value : 75 } )
			const expected = makeIntegerBuffer( 75 )

			expect( output.value ).toEqual( 75 )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'integer' )
			expect( output.typeChar ).toEqual( 'i' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeInteger )
		} )

		test( 'from value', () => {
			const output = OSCType.fromValue( 75 )
			const expected = makeIntegerBuffer( 75 )

			expect( output.value ).toEqual( 75 )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'integer' )
			expect( output.typeChar ).toEqual( 'i' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeInteger )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'zero integer', () => {
			const input  = makeIntegerBuffer( 0 )
			const output = OSCTypeInteger.fromBuffer( input )
			expect( output.value ).toEqual( 0 )
		} )
		test( 'good positive integer', () => {
			const input    = makeIntegerBuffer( 53 )
			const output = OSCTypeInteger.fromBuffer( input )
			expect( output.value ).toEqual( 53 )
		} )
		test( 'good negative integer', () => {
			const input    = makeIntegerBuffer( -32 )
			const output = OSCTypeInteger.fromBuffer( input )
			expect( output.value ).toEqual( -32 )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeInteger.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => OSCTypeInteger.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
