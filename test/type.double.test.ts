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

import { OSCTypeDouble, OSCTypeError, OSCDecodeError, OSCType } from '../src/type'

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
			expect( () => new OSCTypeDouble( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			[12.6, 8],
			[486.0, 8],
			[135435345e-8, 8],
			[Infinity, 8]
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeDouble( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'double', value : 365.25 } )
			const expected = makeDoubleBuffer( 365.25 )

			expect( output.value ).toEqual( 365.25 )
			expect( output.bufLen ).toEqual( 8 )
			expect( output.type ).toEqual( 'double' )
			expect( output.typeChar ).toEqual( 'd' )
			expect( output.debug ).toEqual( '..d..8..' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeDouble )
			expect( output.toJSON() ).toEqual( { type : 'double', value : 365.25 } )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good zero', () => {
			const input  = makeDoubleBuffer( 0 )
			const output = OSCTypeDouble.fromBuffer( input )
			expect( output.value ).toEqual( 0 )
		} )
		test( 'infinity', () => {
			const input  = makeDoubleBuffer( Infinity )
			const output = OSCTypeDouble.fromBuffer( input )
			expect( output.value ).toEqual( Infinity )
		} )
		test( 'good positive double', () => {
			const input  = makeDoubleBuffer( 53.865 )
			const output = OSCTypeDouble.fromBuffer( input )
			expect( output.value ).toEqual( 53.865 )
		} )
		test( 'good negative double', () => {
			const input  = makeDoubleBuffer( -3265.4 )
			const output = OSCTypeDouble.fromBuffer( input )
			expect( output.value ).toEqual( -3265.4 )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeDouble.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 7 )
			expect( () => OSCTypeDouble.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
