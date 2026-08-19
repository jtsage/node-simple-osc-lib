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

import { OSCTypeColor, OSCTypeError, OSCType, OSCDecodeError, OSCColorArray } from '../src/type'

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
			{ humanName : 'out-of-bounds array (non-int)', value : [12.4, 0, 0, 0]},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => new OSCTypeColor( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			[[255, 255, 255, 255], 4],
			[[0, 0, 0, 255], 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeColor( a as OSCColorArray ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const color : OSCColorArray = [23, 45, 250, 0]
			const output = OSCType.fromObject( { type : 'color', value : color } )
			const expected = makeColorBuffer( ...color )

			expect( output.value ).toEqual( color )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'color' )
			expect( output.typeChar ).toEqual( 'r' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeColor )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good color', () => {
			const input  = makeColorBuffer( 255, 125, 100, 255 )
			const output = OSCTypeColor.fromBuffer( input )

			expect( output.value ).toEqual( [255, 125, 100, 255] )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeColor.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => OSCTypeColor.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
