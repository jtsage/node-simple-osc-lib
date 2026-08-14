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

import * as osc from '../src/index'

const getSimpleExpected = ( value : osc.OSCArg, emptyBuffer = true ) => {
	return [
		value,
		emptyBuffer ? Buffer.alloc( 0 ) : expect.any( Buffer ),
	]
}

const makeFloatBuffer = ( value : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeFloatBE( value )
	return buffer
}

const oscRegular = new osc.simpleOscLib()

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
			expect( () => oscRegular.encodeBufferChunk( 'f', value ) ).toThrow( TypeError )
		} )

		test.each( [
			[12.6, 4],
			[486.0, 4],
			[135435345e-8, 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( oscRegular.encodeBufferChunk( 'f', a ).length ).toEqual( b )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good positive float', () => {
			const input    = makeFloatBuffer( 53.865 )
			const expected = getSimpleExpected( { type : 'float', value :  53.865 } )
			expect( oscRegular.decodeBufferChunk( 'f', input )[0].value ).toBeCloseTo( expected[0].value as number )
		} )
		test( 'good negative float', () => {
			const input    = makeFloatBuffer( -3265.4 )
			const expected = getSimpleExpected( { type : 'float', value :  -3265.4 } )
			expect( oscRegular.decodeBufferChunk( 'f', input )[0].value ).toBeCloseTo( expected[0].value as number )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => oscRegular.decodeBufferChunk( 'f', input ) ).toThrow( TypeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => oscRegular.decodeBufferChunk( 'f', input ) ).toThrow( RangeError )
		} )
		test( 'float pair (buffer leftover)', () => {
			const input = Buffer.alloc( 8 )
			input.writeFloatBE( 384.6 )
			input.write( 'bye', 4 )
			const expected = getSimpleExpected( { type : 'float', value : 384.6 }, false )
			const result = oscRegular.decodeBufferChunk( 'f', input )
			expect( result[0].value ).toBeCloseTo( expected[0].value as number )
			expect( result[1].length ).toEqual( 4 )
		} )
	} )
} )
