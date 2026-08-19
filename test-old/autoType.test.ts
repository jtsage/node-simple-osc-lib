/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - autoType */
/// <reference types="node" />
/// <reference types="jest" />

import * as osc from '../src/index'

const oscLib = new osc.simpleOSC()

const testBuffer = Buffer.alloc( 4, 1 )
const testSymbol = Symbol( 'hi' )
// input, expect type, expect value
const valueMap = [
	[true, 'true', null],
	[false, 'false', null],
	[null, 'null', null],
	[testSymbol, 'symbol', testSymbol],
	[BigInt( 26 ), 'bigint', BigInt( 26 )],
	[Infinity, 'bang', null],
	[Number.POSITIVE_INFINITY, 'bang', null],
	[Number.NEGATIVE_INFINITY, 'bang', null],
	[12, 'integer', 12],
	[16.0, 'integer', 16],
	[14.5, 'float', 14.5],
	['/hello', 'address', '/hello'],
	['hello', 'string', 'hello'],
	[testBuffer, 'blob', testBuffer],
	[[0, 1], 'timetag', [0, 1]],
	[[127, 45, 83, 255], 'color', [127, 45, 83, 255]]
]

describe( 'auto type inference', () => {
	test.each( valueMap )(
		'Test expected auto %s -> %s',
		// @ts-expect-error testing fun.
		( a, b, c ) => {
			// @ts-expect-error testing fun.
			expect( oscLib.autoType( a ) ).toEqual( { type : b, value : c} )
		}
	)

	test( 'unknown type', () => {
		// @ts-expect-error testing fun.
		expect( () => oscLib.autoType( { hi : 'there' } ) ).toThrow( 'autoTyping unavailable' )
	} )
} )