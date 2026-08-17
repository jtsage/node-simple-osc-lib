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

import * as help from './helpers'
import { NULL } from '../src/index'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCArguments, OSCDecodeError, OSCEncodeError } from '../src/types'

const coerceMode = { ...help.regularMode, coerceStrings : true }

describe( 'type :: STRING', () => {
	describe( 'encodeBufferChunk', () => {
		describe.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'number',  passCOR : true,  passSTD : false,  value : 69 },
			{ humanName : 'object',  passCOR : true,  passSTD : false,  value : {} },
			{ humanName : 'array',   passCOR : true,  passSTD : false,  value : [] },
			{ humanName : 'null',    passCOR : true, passSTD : false,  value : null },
			{ humanName : 'buffer',  passCOR : true,  passSTD : false,  value : Buffer.alloc( 4 ) },
			{ humanName : 'odd OBJ', passCOR : false, passSTD : false,  value : Object.create( null ) },
		] )( 'Test with $humanName', ( {humanName, value, passSTD, passCOR} ) => {
			test( `STRICT FAIL :: ${humanName}`, () => {
				expect( () => encodeBuffer( { type : 'string', value : value }, help.strictMode ) ).toThrow( OSCEncodeError )
			} )
			test( `NON-STRICT ${ passSTD ? 'PASS' : 'FAIL'} :: ${humanName}`, () => {
				if ( passSTD ) {
					expect( () => encodeBuffer( { type : 'string', value : value }, help.regularMode ) ).not.toThrow()
				} else {
					expect( () => encodeBuffer( { type : 'string', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
				}
			} )
			test( `COERCED ${ passCOR ? 'PASS' : 'FAIL'} :: ${humanName}`, () => {
				if ( passCOR ) {
					expect( () => encodeBuffer( { type : 'string', value : value }, coerceMode ) ).not.toThrow()
				} else {
					expect( () => encodeBuffer( { type : 'string', value : value }, coerceMode ) ).toThrow( OSCEncodeError )
				}
			} )
		} )
		describe( 'unicode string', () => {
			const input    ='he❤️'
			test( 'STRICT :: FAIL', () => {
				expect( () => encodeBuffer( { type : 'string', value : input }, help.strictMode ) ).toThrow( OSCEncodeError )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( () => encodeBuffer( { type : 'string', value : input }, help.regularMode ) ).not.toThrow()
			} )
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
			expect( encodeBuffer( { type : 'string', value : a }, help.regularMode ).buffer.length ).toEqual( b )
		} )

		describe( 'good string as symbol', () => {
			const input : OSCArguments = { type : 'string', value : 'hello' }
			const expected = Buffer.from( `hello${NULL}${NULL}${NULL}` )
			
			expect( encodeBuffer( input, help.symbolMode ).buffer ).toEqual( expected )
		} )

		describe( 'good string symbol', () => {
			const input : OSCArguments = { type : 'symbol', value : 'hello' }
			const expected = Buffer.from( `hello${NULL}${NULL}${NULL}` )
			
			expect( encodeBuffer( input, help.regularMode ).buffer ).toEqual( expected )
		} )
		describe( 'good symbol(string) symbol', () => {
			const input : OSCArguments = { type : 'symbol', value : Symbol( 'hello' ) }
			const expected = Buffer.from( `hello${NULL}${NULL}${NULL}` )
			
			expect( encodeBuffer( input, help.regularMode ).buffer ).toEqual( expected )
		} )
		describe( 'good symbol(number) symbol', () => {
			const input : OSCArguments = { type : 'symbol', value : Symbol( '32' ) }
			const expected = Buffer.from( `32${NULL}${NULL}` )
			
			expect( encodeBuffer( input, help.regularMode ).buffer ).toEqual( expected )
		} )
		describe( 'bad symbol(undef) symbol', () => {
			const input : OSCArguments = { type : 'symbol', value : Symbol() }
			
			expect( () => encodeBuffer( input, help.regularMode ) ).toThrow( OSCEncodeError )
		} )
		describe( 'bad symbol', () => {
			// @ts-expect-error testing fun
			const input : OSCArguments = { type : 'symbol', value : null }
			
			expect( () => encodeBuffer( input, help.regularMode ) ).toThrow( OSCEncodeError )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		describe( 'good string', () => {
			const input    = help.stringBuffer( 8, 'hello' )
			const expected = help.getSimpleExpected( { type : 'string', value : 'hello' } )
			test( 'STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.strictMode ) ).toEqual( expected )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'good string - stringAsSymbol', () => {
			const input    = help.stringBuffer( 8, 'hello' )
			const expected = help.getSimpleExpected( { type : 'symbol', value : 'hello' } )
			test( 'PASS', () => {
				expect( decodeBuffer( 's', input, help.symbolMode ) ).toEqual( expected )
			} )
		} )
		describe( 'good symbol', () => {
			const input    = help.stringBuffer( 8, 'hello' )
			const expected = help.getSimpleExpected( { type : 'symbol', value : 'hello' } )
			test( 'STRICT :: PASS', () => {
				expect( decodeBuffer( 'S', input, help.strictMode ) ).toEqual( expected )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 'S', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'unicode string', () => {
			const input    = help.stringBuffer( 12, 'he❤️' )
			const expected = help.getSimpleExpected( { type : 'string', value : 'he❤️' } )
			test( 'STRICT :: FAIL', () => {
				expect( () => decodeBuffer( 's', input, help.strictMode ) ).toThrow( OSCDecodeError )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'non-buffer', () => {
			const input    = 'hello'
			test( 'STRICT :: FAIL', () => {
				// @ts-expect-error checking errors.
				expect( () => decodeBuffer( 's', input, help.strictMode ) ).toThrow( OSCDecodeError )
			} )
			test( 'NON-STRICT :: FAIL', () => {
				// @ts-expect-error checking errors.
				expect( () => decodeBuffer( 's', input, help.regularMode ) ).toThrow( OSCDecodeError )
			} )
		} )
		describe( 'no null character', () => {
			const input    = help.stringBuffer( 4, 'hell' )
			const expected = help.getSimpleExpected( { type : 'string', value : 'hell' } )
			test( 'STRICT :: FAIL', () => {
				expect( () => decodeBuffer( 's', input, help.strictMode ) ).toThrow( OSCDecodeError )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'insufficiently padded buffer', () => {
			const input    = help.stringBuffer( 6, '/hello' )
			const expected = help.getSimpleExpected( { type : 'string', value : '/hello' } )
			test( 'STRICT :: FAIL', () => {
				expect( () => decodeBuffer( 's', input, help.strictMode ) ).toThrow( OSCDecodeError )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'incorrectly padded buffer', () => {
			const input    = help.stringBuffer( 4, `by${NULL}e` )
			const expected = help.getSimpleExpected( { type : 'string', value : 'by' } )
			test( 'STRICT :: FAIL', () => {
				expect( () => decodeBuffer( 's', input, help.strictMode ) ).toThrow( OSCDecodeError )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'empty string', () => {
			const input    = help.stringBuffer( 4, '' )
			const expected = help.getSimpleExpected( { type : 'string', value : '' } )
			test( 'STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.strictMode ) ).toEqual( expected )
			} )
			test( 'NON-STRICT :: PASS', () => {
				expect( decodeBuffer( 's', input, help.regularMode ) ).toEqual( expected )
			} )
		} )
		describe( 'string pair (buffer leftover)', () => {
			const input = Buffer.from( `hel${NULL}bye${NULL}` )
			const expected = help.getSimpleExpected( { type : 'string', value : 'hel' }, false )
			test( 'STRICT :: PASS', () => {
				const result = decodeBuffer( 's', input, help.strictMode )
				expect( result ).toEqual( expected )
				expect( result.remain.length ).toEqual( 4 )
			} )
			test( 'NON-STRICT :: PASS', () => {
				const result = decodeBuffer( 's', input, help.regularMode )
				expect( result ).toEqual( expected )
				expect( result.remain.length ).toEqual( 4 )
			} )
		} )
	} )
} )
