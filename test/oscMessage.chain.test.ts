/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - messageBuilder */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCMessage } from '../src'

describe( 'message builder', () => {
	describe( 'messageBuilder output', () => {
		const testBuilder = new OSCMessage( '/test' )
		
		testBuilder
			.integer( 20 )
			.float( 69.69 )
			.any( 'hello' )
			.string( 'world' )
			.blob( Buffer.from( 'AaBbCc' ) )

		const results = Buffer.from( '2f746573740000002c6966737362000000000014428b614868656c6c6f000000776f726c64000000000000064161426243630000', 'hex' )
		const debug   = '/tes¦t•••¦,ifs¦sb••¦.i4.¦.f4.¦hell¦o•••¦worl¦d•••¦-b-6-' // cSpell:disable-line
		
		test( 'buffer identical', () => {
			expect( testBuilder.buffer )
				.toEqual( results )
		} )

		test( 'debug identical', () => {
			expect( testBuilder.debug )
				.toEqual( debug )
		} )
	} )
	
} )