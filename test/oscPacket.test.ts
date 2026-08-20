/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - packet errors */

import { OSCDecodeError, OSCPacket, OSCTypeError } from '../src'


test( 'fail constructor', () => {
	expect( () => new OSCPacket() )
		.toThrow( OSCTypeError )
} )

test( 'fail read - empty', () => {
	expect( () => OSCPacket.fromBuffer( Buffer.alloc( 0 ) ) )
		.toThrow( OSCDecodeError )
} )

test( 'fail read - non-buffer', () => {
	// @ts-expect-error testing fun
	expect( () => OSCPacket.fromBuffer( 'hi' ) )
		.toThrow( OSCDecodeError )
} )

test( 'fail read - non 4-byte buffer (strict)', () => {
	expect( () => OSCPacket.fromBuffer( Buffer.alloc( 7 ), true ) )
		.toThrow( OSCDecodeError )
} )