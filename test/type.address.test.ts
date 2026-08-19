/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - ADDRESS type */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCAddress, OSCTypeError, OSCDecodeError } from '../src/type'

const stringBuffer = ( size : number, content : string ) => {
	const buffer = Buffer.alloc( size )
	buffer.write( content )
	return buffer
}

describe( 'type :: ADDRESS', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'empty string', value : ''},
			{ humanName : 'number', value : 69 },
			{ humanName : 'object', value : {} },
			{ humanName : 'array', value : [] },
			{ humanName : 'null', value : null },
			{ humanName : 'non-ascii', value : '/hi❤️' },
			{ humanName : 'buffer', value : Buffer.alloc( 4 ) },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $humanName address', ( { humanName, value } ) => {
			// @ts-expect-error testing fun
			expect( () => new OSCAddress( value ) ).toThrow( OSCTypeError )
		} )

		test.each( [
			['/h', 4],
			['/he', 4],
			['/hel', 8],
			['/hell', 8],
			['/hello', 8],
			['/helloW', 8],
			['/helloWo', 12],
			['/helloWorld', 12],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCAddress( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'to arg object', () => {
			const output = new OSCAddress( 'hello' )
			const expected = stringBuffer( 8, 'hello' )

			expect( output.value ).toEqual( 'hello' )
			expect( output.bufLen ).toEqual( 5 )
			expect( output.type ).toEqual( 'address' )
			expect( output.typeChar ).toEqual( 'a' )
			expect( output.debug ).toEqual( 'hell¦o•••' )
			expect( output.toJSON() ).toEqual( 'hello' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCAddress )
		} )

		test( 'to arg object 2', () => {
			const output = new OSCAddress( 'hell' )
			const expected = stringBuffer( 8, 'hell' )

			expect( output.value ).toEqual( 'hell' )
			expect( output.bufLen ).toEqual( 4 )
			expect( output.type ).toEqual( 'address' )
			expect( output.typeChar ).toEqual( 'a' )
			expect( output.debug ).toEqual( 'hell¦••••' )
			expect( output.toJSON() ).toEqual( 'hell' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCAddress )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good address', () => {
			const input  = stringBuffer( 8, '/hello' )
			const output = OSCAddress.fromBuffer( input )
			
			expect( output.value ).toEqual( '/hello' )
		} )

		test( 'no leading slash', () => {
			const input  = stringBuffer( 8, 'hello' )
			const output = OSCAddress.fromBuffer( input )
			
			expect( output.value ).toEqual( 'hello' )
		} )

		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error testing errors
			expect( () => OSCAddress.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )

		test( 'incorrectly padded buffer', () => {
			const input  = stringBuffer( 6, '/hello' )
			const output = OSCAddress.fromBuffer( input )
			
			expect( output.value ).toEqual( '/hello' )
		} )

		describe( 'empty address', () => {
			const input    = stringBuffer( 4, '' )

			expect( () => OSCAddress.fromBuffer( input ) ).toThrow( OSCTypeError )
		} )
	} )
} )
