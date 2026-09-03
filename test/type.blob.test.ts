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

import { OSCTypeBlob, OSCTypeError, OSCType } from '../src/type'

describe( 'type :: BLOB', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : ['a', 'b']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () =>  new OSCTypeBlob( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			// Buffer size to 4-byte, plus 4 for size field
			[Buffer.from( 'b' ), 8],
			[Buffer.from( 'by' ), 8],
			[Buffer.from( 'bye' ), 8],
			[Buffer.from( 'head' ), 12],
			[Buffer.from( 'headless' ), 16],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeBlob( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const input = Buffer.from( 'head' )
			const output = OSCType.fromObject( { type : 'blob', value : input } )

			expect( output.value ).toEqual( input )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'blob' )
			expect( output.typeChar ).toEqual( 'b' )
			expect( output ).toBeInstanceOf( OSCTypeBlob )
			expect( output.toJSON() ).toEqual( { type : 'blob', value : input } )
		} )

		test( 'from value', () => {
			const input = Buffer.from( 'head' )
			const output = OSCType.fromValue( input )

			expect( output.value ).toEqual( input )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.debug ).toEqual( '-b-4-' )
			expect( output.type ).toEqual( 'blob' )
			expect( output.typeChar ).toEqual( 'b' )
			expect( output ).toBeInstanceOf( OSCTypeBlob )
		} )
	} )
} )
