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

import * as osc from '../src/index'

const getSimpleExpected = ( value : osc.OSCArg, emptyBuffer = true ) => {
	return [
		value,
		emptyBuffer ? Buffer.alloc( 0 ) : expect.any( Buffer ),
	]
}

const oscRegular = new osc.simpleOscLib()

describe( 'argument-less types', () => {
	describe( 'encode', () => {
		test.each( [
			['T', 'true'],
			['F', 'false'],
			['N', 'null/nil'],
			['I', 'bang'],
		] )( 'low level encode [%s] %s : empty zero length buffer', ( a, _b ) => {
			const expected = Buffer.alloc( 0 )
			expect( oscRegular.encodeBufferChunk( a ) ).toEqual( expected )
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
			const expected = getSimpleExpected( { type : expectType, value : null } )
			expect( oscRegular.decodeBufferChunk( a, input ) ).toEqual( expected )
		} )
	} )
} )

