/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - readPacket */
/// <reference types="node" />
/// <reference types="jest" />

import * as osc from '../src/index'

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib( {strictMode : true, strictAddress : true, asciiOnly : true} )

const knownPackets = [
	{
		address : '/-show/prepos/current',
		args    : [{ type : 'integer', value : 1 }],
		buffer  : Buffer.from( '2f2d73686f772f707265706f732f63757272656e740000002c69000000000001', 'hex' ),
	},
	{
		address : '/-show/prepos',
		args    : [{ type : 'integer', value : 1 }],
		buffer  : Buffer.from( '2f2d73686f772f707265706f730000002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/14/mix/fader',
		args    : [{ type : 'float', value : expect.closeTo( 0.4878 ) }],
		buffer  : Buffer.from( '2f6275732f31342f6d69782f66616465720000002c6600003ef9c0ec', 'hex' ),
	},
	{
		address : '/dca/1/fader',
		args    : [{ type : 'float', value : expect.closeTo( 0.7498 ) }],
		buffer  : Buffer.from( '2f6463612f312f6661646572000000002c6600003f3ff2e5', 'hex' ),
	},
	{
		address : '/dca/1/on',
		args    : [{ type : 'integer', value : 1 }],
		buffer  : Buffer.from( '2f6463612f312f6f6e0000002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/08/mix/on',
		args    : [{ type : 'integer', value : 1 }],
		buffer  : Buffer.from( '2f6275732f30382f6d69782f6f6e00002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/08/config/name',
		args    : [{ type : 'string', value : 'HEAD' }],
		buffer  : Buffer.from( '2f6275732f30382f636f6e6669672f6e616d65002c7300004845414400000000', 'hex' ),
	},
	{
		address : '/dca/1/config/name',
		args    : [{ type : 'string', value : 'TESTER' }],
		buffer  : Buffer.from( '2f6463612f312f636f6e6669672f6e616d6500002c7300005445535445520000', 'hex' ),
	},
]

describe( 'non-buffer fails', () => {
	test( 'readPacket', () => {
		// @ts-expect-error testing failure.
		expect( () => oscRegular.readPacket( 'hi' ) ).toThrow( TypeError )
	} )
	test( 'readBundle', () => {
		// @ts-expect-error testing failure.
		expect( () => oscRegular.readBundle( 'hi' ) ).toThrow( TypeError )
	} )
	test( 'readMessage', () => {
		// @ts-expect-error testing failure.
		expect( () => oscRegular.readMessage( 'hi' ) ).toThrow( TypeError )
	} )
} )

describe( 'known packets', () => {
	test.each( knownPackets )( 'message from $address', ( {address, args, buffer} ) => {
		const decoded = oscRegular.readPacket( buffer )
		// @ts-expect-error expected error
		expect( decoded.address ).toEqual( address )
		// @ts-expect-error expected error
		expect( decoded.args ).toEqual( args )
	} )
} )

test( 'fail on empty packet', () => {
	const input = Buffer.alloc( 0 )
	expect( () => oscRegular.readMessage( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'pass on no arguments', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null}` )
	expect( oscRegular.readMessage( input ).address ).toEqual( '/hello' )
} )

test( 'pass on no arguments with comma', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},${osc.null}${osc.null}${osc.null}` )
	expect( oscRegular.readMessage( input ).address ).toEqual( '/hello' )
} )

test( 'fail on mismatched array read (unclosed)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},[[I]ss${osc.null}${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}` )
	expect( () => oscRegular.readMessage( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'fail on mismatched array read (unopened)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},II]]ss${osc.null}${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}` )
	expect( () => oscRegular.readMessage( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'fail on incorrect buffer length (message) (strict)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}` )
	expect( () => oscStrict.readMessage( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'fail on incorrect buffer length (packet) (strict)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}` )
	expect( () => oscStrict.readPacket( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'pass on missing comma (non-strict)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null}ss${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}` )
	const decoded = oscRegular.readMessage( input )
	expect( decoded.address ).toEqual( '/hello' )
	expect( decoded.args[0]!.value ).toEqual( 'hi' )
	expect( decoded.args[1]!.value ).toEqual( 'there' )
} )

test( 'fail on missing comma (strict)', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null}ss${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}` )
	expect( () => oscStrict.readMessage( input ) ).toThrow( osc.OSCSyntaxError )
} )

test( 'read correct array', () => {
	const input = Buffer.from( `/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}` )
	const decoded = oscRegular.readPacket( input )
	// @ts-expect-error expected error
	expect( decoded.address ).toEqual( '/hello' )
	// @ts-expect-error expected error
	expect( decoded.args[0].type ).toEqual( 'array' )
	// @ts-expect-error expected error
	expect( decoded.args[0].value[0].type ).toEqual( 'array' )
	// @ts-expect-error expected error
	expect( decoded.args[0].value[0].value[0].type ).toEqual( 'bang' )
	// @ts-expect-error expected error
	expect( decoded.args[1].value ).toEqual( 'hi' )
	// @ts-expect-error expected error
	expect( decoded.args[2].value ).toEqual( 'there' )
} )