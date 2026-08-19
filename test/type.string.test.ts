/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - STRING type */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCTypeString, OSCTypeSymbol, OSCTypeError, OSCDecodeError, OSCType } from '../src/type'

const stringBuffer = ( size : number, content : string ) => {
	const buffer = Buffer.alloc( size )
	buffer.write( content )
	return buffer
}

describe( 'type :: STRING', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'number',  value : 69 },
			{ humanName : 'object',  value : {} },
			{ humanName : 'array',   value : [] },
			{ humanName : 'null',    value : null },
			{ humanName : 'buffer',  value : Buffer.alloc( 4 ) },
			{ humanName : 'odd OBJ', value : Object.create( null ) },
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $humanName', ( {humanName, value} ) => {
			expect( () => new OSCTypeString( value ) ).toThrow( OSCTypeError )
			expect( () => new OSCTypeSymbol( value ) ).toThrow( OSCTypeError )
		} )
		
		test( 'unicode string', () => {
			const input    ='he❤️'
			expect( () => new OSCTypeString( input, true ) ).toThrow( OSCTypeError )
			expect( () => new OSCTypeString( input ) ).not.toThrow( OSCTypeError )
		} )

		test.each( [
			['h', 4],
			['he', 4],
			['hel', 4],
			['hell', 8],
			['hello', 8],
			['helloW', 8],
			['helloWo', 8],
			['helloWorld', 12],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect(
				( new OSCTypeString( a ) )
					.buffer
					.length
			).toEqual( b )
		} )

		test( 'from arg object', () => {
			const output = OSCType.fromObject( { type : 'string', value : 'hello' } )
			const expected = stringBuffer( 8, 'hello' )

			expect( output.value ).toEqual( 'hello' )
			expect( output.bufLen ).toEqual( 5 )
			expect( output.type ).toEqual( 'string' )
			expect( output.typeChar ).toEqual( 's' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeString )
		} )

		test( 'from arg object (sym)', () => {
			const output = OSCType.fromObject( { type : 'symbol', value : 'hello' } )
			const expected = stringBuffer( 8, 'hello' )

			expect( output.value ).toEqual( 'hello' )
			expect( output.bufLen ).toEqual( 5 )
			expect( output.type ).toEqual( 'symbol' )
			expect( output.typeChar ).toEqual( 'S' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeString )
		} )

		test( 'from value (sym)', () => {
			const output = OSCType.fromValue( Symbol( 'hello' ) )
			const expected = stringBuffer( 8, 'hello' )

			expect( output.value ).toEqual( 'hello' )
			expect( output.bufLen ).toEqual( 5 )
			expect( output.type ).toEqual( 'symbol' )
			expect( output.typeChar ).toEqual( 'S' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeString )
		} )

		test( 'from value', () => {
			const output = OSCType.fromValue( 'hello' )
			const expected = stringBuffer( 8, 'hello' )

			expect( output.value ).toEqual( 'hello' )
			expect( output.bufLen ).toEqual( 5 )
			expect( output.type ).toEqual( 'string' )
			expect( output.typeChar ).toEqual( 's' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeString )
		} )


		describe( 'bad symbol(undef) symbol', () => {
			expect( () => OSCType.fromValue( Symbol() ) )
				.toThrow( OSCTypeError )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good string', () => {
			const input  = stringBuffer( 8, 'hello' )
			const output = OSCTypeString.fromBuffer( input )
			expect( output.value ).toEqual( 'hello' )
		} )
		test( 'good symbol', () => {
			const input  = stringBuffer( 8, 'hello' )
			const output = OSCTypeSymbol.fromBuffer( input )
			expect( output.value ).toEqual( 'hello' )
		} )
		test( 'unicode string', () => {
			const input  = stringBuffer( 12, 'he❤️' )
			const output = OSCTypeString.fromBuffer( input )
			expect( output.value ).toEqual( 'he❤️' )
		} )
		test( 'non-buffer', () => {
			const input  = 'hello'
			// @ts-expect-error testing fun.
			expect( () => OSCTypeString.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'empty string', () => {
			const input  = stringBuffer( 4, '' )
			const output = OSCTypeString.fromBuffer( input )
			expect( output.value ).toEqual( '' )
		} )
	} )
} )
