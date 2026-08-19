/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - FLOAT type */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCTypeFloat, OSCTypeError, OSCDecodeError, OSCType } from '../src/type'

const makeFloatBuffer = ( value : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeFloatBE( value )
	return buffer
}

describe( 'type :: FLOAT', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => new OSCTypeFloat( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			[12.6, 4],
			[486.0, 4],
			[135435345e-8, 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeFloat( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'float', value : 365.25 } )
			const expected = makeFloatBuffer( 365.25 )

			expect( output.value ).toEqual( 365.25 )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'float' )
			expect( output.typeChar ).toEqual( 'f' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeFloat )
		} )

		test( 'from value', () => {
			const output = OSCType.fromValue( 365.25 )
			const expected = makeFloatBuffer( 365.25 )

			expect( output.value ).toEqual( 365.25 )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'float' )
			expect( output.typeChar ).toEqual( 'f' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeFloat )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good positive float', () => {
			const input  = makeFloatBuffer( 53.865 )
			const output = OSCTypeFloat.fromBuffer( input )
			expect( output.value ).toBeCloseTo( 53.865 )
		} )
		test( 'good negative float', () => {
			const input    = makeFloatBuffer( -3265.4 )
			const output = OSCTypeFloat.fromBuffer( input )
			expect( output.value ).toBeCloseTo( -3265.4 )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeFloat.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => OSCTypeFloat.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
