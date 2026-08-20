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

import { OSCMessage, OSCType }     from '../src/'
import { OSCDecodeError } from '../src/type'

const NULL = '\u0000'

const knownPackets = [
	{
		address : '/-show/prepos/current',
		args    : [OSCType.fromObject( { type : 'integer', value : 1 } )],
		buffer  : Buffer.from( '2f2d73686f772f707265706f732f63757272656e740000002c69000000000001', 'hex' ),
	},
	{
		address : '/-show/prepos',
		args    : [OSCType.fromObject( { type : 'integer', value : 1 } )],
		buffer  : Buffer.from( '2f2d73686f772f707265706f730000002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/14/mix/fader',
		args    : [OSCType.fromObject( { type : 'float', value : 0.4878 } )],
		buffer  : Buffer.from( '2f6275732f31342f6d69782f66616465720000002c6600003ef9c0ec', 'hex' ),
	},
	{
		address : '/dca/1/fader',
		args    : [OSCType.fromObject( { type : 'float', value : 0.7498 } )],
		buffer  : Buffer.from( '2f6463612f312f6661646572000000002c6600003f3ff2e5', 'hex' ),
	},
	{
		address : '/dca/1/on',
		args    : [OSCType.fromObject( { type : 'integer', value : 1 } )],
		buffer  : Buffer.from( '2f6463612f312f6f6e0000002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/08/mix/on',
		args    : [OSCType.fromObject( { type : 'integer', value : 1 } )],
		buffer  : Buffer.from( '2f6275732f30382f6d69782f6f6e00002c69000000000001', 'hex' ),
	},
	{
		address : '/bus/08/config/name',
		args    : [OSCType.fromObject( { type : 'string', value : 'HEAD' } )],
		buffer  : Buffer.from( '2f6275732f30382f636f6e6669672f6e616d65002c7300004845414400000000', 'hex' ),
	},
	{
		address : '/dca/1/config/name',
		args    : [OSCType.fromObject( { type : 'string', value : 'TESTER' } )],
		buffer  : Buffer.from( '2f6463612f312f636f6e6669672f6e616d6500002c7300005445535445520000', 'hex' ),
	},
]

describe( 'non-buffer fails', () => {
	test( 'fromBuffer, non-buffer', () => {
		// @ts-expect-error testing failure.
		expect( () => OSCMessage.fromBuffer( 'hi' ) ).toThrow( OSCDecodeError )
	} )
	test( 'empty buffer', () => {
		expect( () => OSCMessage
			.fromBuffer( Buffer.alloc( 0 ) )
		).toThrow( OSCDecodeError )
	} )
} )

describe( 'known packets', () => {
	test.each( knownPackets )( 'message from $address', ( {address, args, buffer} ) => {
		const decoded = OSCMessage.fromBuffer( buffer )
		expect( decoded.address ).toEqual( address )
		expect( decoded.args ).toEqual( args )
		expect( decoded.buffer ).toEqual( buffer ) // round trip, yeah?
	} )
} )

test( 'pass on no arguments', () => {
	const input = Buffer.from( `/hello${NULL}${NULL}` )
	
	expect( OSCMessage.fromBuffer( input ).address ).toEqual( '/hello' )
} )

test( 'pass on no arguments with comma', () => {
	const input = Buffer.from( `/hello${NULL}${NULL},${NULL}${NULL}${NULL}` )
	expect( OSCMessage.fromBuffer( input ).address ).toEqual( '/hello' )
} )

test( 'fail on mismatched array read (unclosed)', () => {
	const input = Buffer.from( `/hello${NULL}${NULL},[[I]ss${NULL}${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
	expect( () => OSCMessage.fromBuffer( input ) ).toThrow( OSCDecodeError )
} )

test( 'fail on mismatched array read (unopened)', () => {
	const input = Buffer.from( `/hello${NULL}${NULL},II]]ss${NULL}${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
	expect( () => OSCMessage.fromBuffer( input ) ).toThrow( OSCDecodeError )
} )

test( 'pass on incorrect buffer length (message)(strict)', () => {
	const input = Buffer.from( `/hello${NULL}${NULL},[[I]]ss${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}` )
	expect( () => OSCMessage.fromBuffer( input, true ) ).toThrow( OSCDecodeError )
} )

test( 'pass on missing comma (non-strict)', () => {
	const input = Buffer.from( `/hello${NULL}${NULL}ss${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
	const decoded = OSCMessage.fromBuffer( input )
	expect( decoded.address ).toEqual( '/hello' )
	expect( decoded.args ).toHaveLength( 2 )
	if ( ! Array.isArray( decoded.args[0] ) ) {
		expect( decoded.args[0].value ).toEqual( 'hi' )
	}
	if ( ! Array.isArray( decoded.args[1] ) ) {
		expect( decoded.args[1].value ).toEqual( 'there' )
	}
} )

test( 'read correct array', () => {
	const input = Buffer.from( `/hello${NULL}${NULL},[[I]]ss${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
	const decoded = OSCMessage.fromBuffer( input )

	expect( decoded.address ).toEqual( '/hello' )
	
	if ( Array.isArray( decoded.args[0] ) ) {
		if ( Array.isArray( decoded.args[0][0] ) ) {
			if ( ! Array.isArray( decoded.args[0][0][0] ) ) {
				expect( decoded.args[0][0][0].value ).toEqual( null )
				expect( decoded.args[0][0][0].type ).toEqual( 'bang' )
			} else {
				fail( 'wrong nesting' )
			}
		} else {
			fail( 'wrong nesting' )
		}
	} else {
		fail( 'wrong nesting' )
	}
	if ( !Array.isArray( decoded.args[1] ) && !Array.isArray( decoded.args[2] ) ) {
		expect( decoded.args[1].value ).toEqual( 'hi' )
		expect( decoded.args[2].value ).toEqual( 'there' )
	} else {
		fail( 'wrong nesting' )
	}
	const expected = '{"address":"/hello","elements":[[[{"type":"bang","value":null}]],{"type":"string","value":"hi"},{"type":"string","value":"there"}],"type":"message"}'
	expect( JSON.stringify( decoded ) ).toEqual( expected )
	expect( decoded.buffer ).toEqual( input )
} )