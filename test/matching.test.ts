/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - matching */
/// <reference types="node" />
/// <reference types="jest" />

import * as osc from '../src/index'
import { OSCError } from '../src/types'

const oscLib = new osc.simpleOSC()

const testData = [
	{
		pattern   : '/{auxin,bus,ch,mtx}/*/mix/fader',
		testCases : [
			['/auxin/03/mix/fader', ['auxin', '03']],
			['/bus/12/mix/fader', ['bus', '12']],
			['/ch/12/mix/fader', ['ch', '12']],
			['/mtx/04/mix/fader', ['mtx', '04']],
		],
	},
	{
		pattern   : '/{auxin,bus,ch,mtx}/*/mix/on',
		testCases : [
			['/auxin/03/mix/on', ['auxin', '03']],
			['/bus/12/mix/on', ['bus', '12']],
			['/ch/12/mix/on', ['ch', '12']],
			['/mtx/04/mix/on', ['mtx', '04']],
		],
	},
	{
		pattern   : '/{auxin,bus,ch,mtx}/*/config/name',
		testCases : [
			['/auxin/03/config/name', ['auxin', '03']],
			['/bus/12/config/name', ['bus', '12']],
			['/ch/12/config/name', ['ch', '12']],
			['/mtx/04/config/name', ['mtx', '04']],
		],
	},
	{
		pattern   : '/dca/*/fader',
		testCases : [
			['/dca/6/fader', ['6']]
		],
	},
	{
		pattern   : '/dca/*/on',
		testCases : [
			['/dca/6/on', ['6']]
		],
	},
	{
		pattern   : '/dca/*/config/name',
		testCases : [
			['/dca/6/config/name', ['6']]
		],
	}
]

describe( 'pattern matching', () => {
	describe.each( testData )( 'Pattern match $pattern', ( { pattern, testCases } ) => {
		test.each( testCases )( 'Against address %s for %s', ( a, b ) => {
			const msg = oscLib.newMessage( a as string )
			const matched = msg.match( pattern )

			expect( matched[0].matches ).toEqual( b )
		} )
		
	} )

	test( 'Match bundle', () => {
		const cues = [
			oscLib.newMessage( '/-show/showfile/snippet/010/name' ),
			oscLib.newMessage( '/-show/showfile/scene/099/name' ),
			oscLib.newMessage( '/-show/showfile/cue/008/name' ),
		]

		const cueBundle = oscLib.newBundle( cues, false )

		expect( cueBundle.match( '/-show/showfile/{scene,snippet,cue}/*/name' ) ).toHaveLength( 3 )
	} )

	test( 'Match bundle (ignore buffers)', () => {
		const cues = [
			oscLib.newMessage( '/-show/showfile/snippet/010/name' ).buffer,
			oscLib.newMessage( '/-show/showfile/scene/099/name' ).buffer,
			oscLib.newMessage( '/-show/showfile/cue/008/name' ),
		]

		const cueBundle = oscLib.newBundle( cues, false )

		// would be 3, but the 2 pre-encoded buffers are skipped in this context.
		expect( cueBundle.match( '/-show/showfile/{scene,snippet,cue}/*/name' ) ).toHaveLength( 1 )
	} )

	test( 'Match bundle of bundles', () => {
		const stMsgs = [
			oscLib.newMessage( '/main/st/mix/fader' ),
			oscLib.newMessage( '/main/st/mix/on' ),
			oscLib.newMessage( '/main/st/config/name' ),
		]
		const mMsgs = [
			oscLib.newMessage( '/main/m/mix/on' ),
			oscLib.newMessage( '/main/m/config/name' ),
		]

		const stBundle   = oscLib.newBundle( stMsgs, false )
		const mBundle    = oscLib.newBundle( mMsgs, false )
		const fullBundle = oscLib.newBundle( [stBundle, mBundle], false )

		expect( fullBundle.match( '/main/*/mix/on' ) ).toHaveLength( 2 )
		expect( fullBundle.match( '/main/*/config/name' ) ).toHaveLength( 2 )
		expect( fullBundle.match( '/main/*/mix/fader' ) ).toHaveLength( 1 )
	} )

	test( 'Non-string match fail', () => {
		const msg = oscLib.newMessage( '/main/m/mix/on' )

		// @ts-expect-error testing fun
		expect( () => msg.match( 24 ) ).toThrow( OSCError )
	} )

	test( 'Empty string match fail', () => {
		const msg = oscLib.newMessage( '/main/m/mix/on' )

		expect( () => msg.match( '' ) ).toThrow( OSCError )
	} )
} )
