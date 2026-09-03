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
			.T()
			.F()
			.N()
			.I()
			.h( BigInt( 23 ) )
			.c( 'A' )
			.d( 69.69 )
			.r( [127, 127, 127, 255] )
			.m( [0, 130, 0, 127] )
			.S( Symbol( 23 ) )
			.S( 'goodbye' )

		const results = Buffer.from( '2f746573740000002c696673736254464e49686364726d535300000000000014428b614868656c6c6f000000776f726c6400000000000006416142624363000000000000000000170000004140516c28f5c28f5c7f7f7fff0082007f32330000676f6f6462796500', 'hex' )
		const debug   = '/tes¦t•••¦,ifs¦sbTF¦NIhc¦drmS¦S•••¦.i4.¦.f4.¦hell¦o•••¦worl¦d•••¦-b-6-¦..h..8..¦c::A¦..d..8..¦.r4.¦.m4.¦23••¦good¦bye•' // cSpell:disable-line
		

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