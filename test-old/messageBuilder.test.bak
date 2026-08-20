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

import * as osc from '../src/index'
import { NULL } from '../src/index'
import { OSCError } from '../src/types'

const oscLib = new osc.simpleOSC()


const valueNameMap = {
	blob    : Buffer.from( 'AbCDeF' ),
	float   : 69.69,
	integer : 20,
	string  : 'hello world',
}

describe( 'message builder', () => {
	test( 'build init fail (no address)', () => {
		// @ts-expect-error testing failure.
		expect( () => oscLib.messageBuilder() ).toThrow( OSCError )
	} )

	const testBuilder = oscLib.messageBuilder( '/test' )

	describe.each( Object.keys( valueNameMap ) )( 'Test build type %s', ( buildType ) => {
		describe.each( Object.keys( valueNameMap ) )( 'Test input of type %s,', ( inputType ) => {
			if ( buildType === inputType || ( buildType === 'float' && inputType === 'integer' ) ) {
				test( 'type is valid', () => {
					// @ts-expect-error testing fun.
					expect( () => testBuilder[buildType]( valueNameMap[inputType] ) ).not.toThrow()
				} )
				test( 'type is valid (shortcut)', () => {
					// @ts-expect-error testing fun.
					expect( () => testBuilder[buildType[0]]( valueNameMap[inputType] ) ).not.toThrow()
				} )
			} else {
				test( 'type is invalid', () => {
					// @ts-expect-error testing fun.
					expect( () => testBuilder[buildType]( valueNameMap[inputType] ) ).toThrow( OSCError )
				} )
			}
		} )
	} )

	describe( 'messageBuilder output', () => {
		const thisBuilder = oscLib.messageBuilder( '/test' )
		
		thisBuilder
			.integer( 20 )
			.float( 69.69 )
			.any( 'hello world' )
			.blob( Buffer.from( 'AaBbCc' ) )

		const results = Buffer.from( '2f746573740000002c6966736200000000000014428b614868656c6c6f20776f726c6400000000064161426243630000', 'hex' )
		const debug   = '[48]  :: ¦/tes¦t•••¦,ifs¦b•••¦[..]¦B¿aH¦hell¦o wo¦rld•¦[..]¦AaBb¦Cc••¦'
		
		test( 'buffer identical', () => {
			expect( thisBuilder.buffer ).toEqual( results )
		} )

		test( 'debug identical', () => {
			expect( thisBuilder.toString() ).toEqual( debug )
		} )
	} )

	test( 'library message', () => {
		const oscMessage = oscLib.newMessage(
			'/hello'
		)
		const expected = Buffer.from( `/hello${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'library message with args', () => {
		const oscMessage = oscLib.newMessage(
			'/hello',
			[
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			]
		)
	
		const expected = Buffer.from( `/hello${NULL}${NULL},ss${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'library bundle (empty)', () => {
		const oscMessage = oscLib.newBundle()
		expect( () => oscMessage.buffer ).toThrow( 'empty bundle' )
	} )

	test( 'library bundle', () => {
		const msg1 = oscLib.newMessage(
			'/hello',
			[
				{ type : 'string', value : 'world' },
				{ type : 'integer', value : 20 },
			]
		)
		
		const msg2 = oscLib.newMessage(
			'/goodnight',
			[
				{ type : 'string', value : 'moon' },
				{ type : 'integer', value : 69 }
			]
		)
		
		const oscMessage = oscLib.newBundle( [msg1, msg2] )
		expect( oscMessage.buffer ).toHaveLength( 76 )
	} )
	
} )