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

import { OSCBundle, OSCMessage, OSCType, OSCTypeError } from '../src'

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
			const msg = new OSCMessage( a as string )
			const matched = msg.match( pattern )
			
			expect( matched ).not.toBeNull()
			if ( matched !== null ) {
				expect( matched.matches ).toEqual( b )
			}
		} )
		
	} )

	test( 'Match bundle', () => {
		const cues = [
			new OSCMessage( '/-show/showfile/snippet/010/name' ),
			new OSCMessage( '/-show/showfile/scene/099/name' ),
			new OSCMessage( '/-show/showfile/cue/008/name', [OSCType.fromValue( 'test' )] ),
		]

		const cueBundle = new OSCBundle( cues, false )
		const results = cueBundle.match( '/-show/showfile/{scene,snippet,cue}/*/name' )

		expect( results ).toHaveLength( 3 )
		expect( results[2]?.args ).toEqual( [OSCType.fromValue( 'test' )] )
	} )

	test( 'Match bundle of bundles', () => {
		const stMsgs = [
			new OSCMessage( '/main/st/mix/fader' ),
			new OSCMessage( '/main/st/mix/on' ),
			new OSCMessage( '/main/st/config/name' ),
		]
		const mMsgs = [
			new OSCMessage( '/main/m/mix/on' ),
			new OSCMessage( '/main/m/config/name' ),
		]

		const stBundle   = new OSCBundle( stMsgs, false )
		const mBundle    = new OSCBundle( mMsgs, false )
		const fullBundle = new OSCBundle( [stBundle, mBundle], false )

		expect( fullBundle.match( '/main/*/mix/on' ) ).toHaveLength( 2 )
		expect( fullBundle.match( '/main/*/config/name' ) ).toHaveLength( 2 )
		expect( fullBundle.match( '/main/*/mix/fader' ) ).toHaveLength( 1 )
	} )

	test( 'Non-string match fail', () => {
		const msg = new OSCMessage( '/main/m/mix/on' )

		// @ts-expect-error testing fun
		expect( () => msg.match( 24 ) ).toThrow( OSCTypeError )
	} )

	test( 'Match fail', () => {
		const msg = new OSCMessage( '/main/m/mix/on' )

		const results = msg.match( '/main/st/mix/on' )

		expect( results ).toBeNull()
	} )

	test( 'Match success with compiled regex', () => {
		const msg = new OSCMessage( '/main/m/mix/on' )

		const matcher = new RegExp( /\/main\/(.+?)\/mix\/on/ )
		const results = msg.match( matcher )

		expect( results ).not.toBeNull()
		expect( results?.matches[0] ).toEqual( 'm' )
	} )

	test( 'Empty string match fail', () => {
		const msg = new OSCMessage( '/main/m/mix/on' )

		expect( () => msg.match( '' ) ).toThrow( OSCTypeError )
	} )
} )
