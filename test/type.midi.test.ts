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

import { OSCTypeMidi, OSCTypeError, OSCDecodeError, OSCType, OSCMidiArray } from '../src/type'

const makeMidiBuffer = ( p : number, s : number, d1 : number, d2 : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeUInt8( p, 0 )
	buffer.writeUInt8( s, 1 )
	buffer.writeUInt8( d1, 2 )
	buffer.writeUInt8( d2, 3 )
	return buffer
}

describe( 'type :: MIDI', () => {
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
			{ humanName : 'out-of-bounds port (high)', value : [365, 128, 0, 0]},
			{ humanName : 'out-of-bounds port (low)', value : [-6, 128, 0, 0]},
			{ humanName : 'out-of-bounds status (high)', value : [1, 444, 0, 0]},
			{ humanName : 'out-of-bounds status (low)', value : [1, 110, 0, 0]},
			{ humanName : 'out-of-bounds data 1 (high)', value : [1, 130, 129, 0]},
			{ humanName : 'out-of-bounds data 1 (low)', value : [1, 130, -2, 0]},
			{ humanName : 'out-of-bounds data 2 (high)', value : [1, 130, 34, 334]},
			{ humanName : 'out-of-bounds data 2 (low)', value : [1, 130, 34, -5]},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => new OSCTypeMidi( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			[[255, 250, 127, 127], 4],
			[[0, 130, 0, 127], 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeMidi( a as OSCMidiArray ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'midi', value : [0, 130, 0, 127] } )
			const expected = makeMidiBuffer( 0, 130, 0, 127 )

			expect( output.value ).toEqual( [0, 130, 0, 127] )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'midi' )
			expect( output.typeChar ).toEqual( 'm' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeMidi )
		} )
		
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good midi', () => {
			const input  = makeMidiBuffer( 1, 130, 100, 50 )
			const output = OSCTypeMidi.fromBuffer( input )
			expect( output.value ).toEqual( [1, 130, 100, 50] )
		} )

		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => OSCTypeMidi.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => OSCTypeMidi.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
