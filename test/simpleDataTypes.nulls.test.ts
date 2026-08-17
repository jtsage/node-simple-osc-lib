/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - NON-DATA (null) types [T,F,N,I] */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'

describe( 'argument-less types', () => {
	describe( 'encode', () => {
		test.each( [
			['true', 'true'],
			['false', 'false'],
			['null', 'null/nil'],
			['bang', 'bang'],
		] )( 'low level encode [%s] %s : empty zero length buffer', ( a, _b ) => {
			const expected = Buffer.alloc( 0 )
			// @ts-expect-error testing funky.
			expect( encodeBuffer( { type : a, value : null }, help.regularMode ).buffer ).toEqual( expected )
		} )
	} )
	describe( 'decode', () => {
		test.each( [
			['T', 'true', 'true'],
			['F', 'false', 'false'],
			['N', 'null/nil', 'null'],
			['I', 'bang', 'bang'],
		] )( 'low level decode [%s] %s', ( a, _b, expectType ) => {
			const input    = Buffer.alloc( 0 )
			// @ts-expect-error test funkiness.
			const expected = help.getSimpleExpected( { type : expectType, value : null } )
			// @ts-expect-error test funkiness.
			expect( decodeBuffer( a, input, help.regularMode ) ).toEqual( expected )
		} )
	} )
} )

