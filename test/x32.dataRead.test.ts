/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 Node Message Conversion */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCMessage } from '../src/message'
import { matchers } from '../src/x32/data'
import { converter } from '../src/x32/nodeConvert'
import { X32Cue, X32FaderUpdateLevel, X32FaderUpdateMix, X32FaderUpdateMute, X32FaderUpdateName, X32Info, X32Scene, X32Snippet } from '../src/x32/types'

const makeNode = ( v : string ) => {
	return new OSCMessage(
		'node',
		[
			{ type : 'string', value : v }
		]
	)
}

const scope = 'auxin,bus,mtx,ch,main,dca,fxrtn'

describe( 'data read operate as expected', () => {
	test( 'fader', () => {
		const engine = matchers.faderReg
		const msg = new OSCMessage(
			'/mtx/04/mix/fader',
			[{ type : 'float', value : 1}]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/mix/fader` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateLevel

			expect( result ).toBeInstanceOf( X32FaderUpdateLevel )
			expect( result.index ).toEqual( 4 )
			expect( result.scope ).toEqual( 'mtx' )
			expect( result.level ).toEqual( 1 )
			expect( result.levelDb ).toEqual( '+10.0 dB' )
		}
	} )

	test( 'fader (missing part, test factory)', () => {
		const engine = matchers.faderReg
		const msg = new OSCMessage(
			'/mtx/04/mix/fader'
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/mix/fader` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches )

			expect( result ).toBeNull()
		}
	} )

	test( 'mute', () => {
		const engine = matchers.muteReg
		const msg = new OSCMessage(
			'/auxin/03/mix/on',
			[{ type : 'integer', value : 1}]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/mix/on` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateMute

			expect( result ).toBeInstanceOf( X32FaderUpdateMute )
			expect( result.index ).toEqual( 3 )
			expect( result.scope ).toEqual( 'auxin' )
			expect( result.onBool ).toEqual( true )
		}
	} )

	test( 'name', () => {
		const engine = matchers.nameReg
		const msg = new OSCMessage(
			'/bus/12/config/name',
			[{ type : 'string', value : 'mic01'}]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/config/name` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateName

			expect( result ).toBeInstanceOf( X32FaderUpdateName )
			expect( result.index ).toEqual( 12 )
			expect( result.scope ).toEqual( 'bus' )
			expect( result.name ).toEqual( 'mic01' )
		}
	} )

	test( 'mix', () => {
		const engine = matchers.mixNode
		const node = makeNode( '/main/m/mix ON   -oo' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/mix` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateMix

			expect( result ).toBeInstanceOf( X32FaderUpdateMix )
			expect( result.index ).toEqual( 2 )
			expect( result.scope ).toEqual( 'main' )
			expect( result.level ).toEqual( 0 )
			expect( result.onBool ).toEqual( true )
		}
	} )

	test( 'dca mix', () => {
		const engine = matchers.dcaNode
		const node = makeNode( '/dca/2 OFF   -32.5' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/dca/*' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateMix

			expect( result ).toBeInstanceOf( X32FaderUpdateMix )
			expect( result.index ).toEqual( 2 )
			expect( result.scope ).toEqual( 'dca' )
			expect( result.levelDb ).toEqual( '-32.5 dB' )
			expect( result.onBool ).toEqual( false )
		}
	} )

	test( 'node name', () => {
		const engine = matchers.nameNode
		const node = makeNode( '/bus/01/config "StgMon" 63 YEi' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( `/{${scope}}/*/config` )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32FaderUpdateName

			expect( result ).toBeInstanceOf( X32FaderUpdateName )
			expect( result.index ).toEqual( 1 )
			expect( result.scope ).toEqual( 'bus' )
			expect( result.name ).toEqual( 'StgMon' )
		}
	} )

	test( 'node cue', () => {
		const engine = matchers.showDataNode
		const node = makeNode( '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 1 1 -1 0 1 0 0' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/showfile/{cue,scene,snippet}/*' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Cue

			expect( result ).toBeInstanceOf( X32Cue )
			expect( result.index ).toEqual( 0 )
			expect( result.number ).toEqual( '12.0.0' )
			expect( result.title ).toEqual( 'Cue Idx0 Num1200' )
			expect( result.skip ).toEqual( true )
			expect( result.scene ).toEqual( 1 )
			expect( result.snippet ).toEqual( -1 )
		}
	} )

	test( 'node scene', () => {
		const engine = matchers.showDataNode
		const node = makeNode( '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/showfile/{cue,scene,snippet}/*' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Scene

			expect( result ).toBeInstanceOf( X32Scene )
			expect( result.index ).toEqual( 1 )
			expect( result.title ).toEqual( 'AAA' )
			expect( result.note ).toEqual( 'aaa' )
		}
	} )

	test( 'node snippet', () => {
		const engine = matchers.showDataNode
		const node = makeNode( '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/showfile/{cue,scene,snippet}/*' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Snippet

			expect( result ).toBeInstanceOf( X32Snippet )
			expect( result.index ).toEqual( 0 )
			expect( result.title ).toEqual( 'Aaa' )
		}
	} )

	test( 'info : dirty', () => {
		const engine = matchers.cueDirty
		const msg = new OSCMessage(
			'/-show/showfile/snippet/010/name',
			[{ type : 'string', value : 'mic01'}]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/showfile/{scene,snippet,cue}/*/name' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Info

			expect( result ).toBeInstanceOf( X32Info )
			expect( result.type ).toEqual( 'cueDirty' )
			expect( result.value ).toEqual( 'snippet' )
		}
	} )

	test( 'info : current cue', () => {
		const engine = matchers.currentCue
		const msg = new OSCMessage(
			'/-show/prepos/current',
			[{ type : 'integer', value : 2 }]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/prepos/current' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Info

			expect( result ).toBeInstanceOf( X32Info )
			expect( result.type ).toEqual( 'currentCue' )
			expect( result.value ).toEqual( 2 )
		}
	} )

	test( 'info : control mode', () => {
		const engine = matchers.control
		const msg = new OSCMessage(
			'/-prefs/show_control',
			[{ type : 'integer', value : 1 }]
		)

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-prefs/show_control' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Info

			expect( result ).toBeInstanceOf( X32Info )
			expect( result.type ).toEqual( 'control' )
			expect( result.value ).toEqual( 'SCENES' )
		}
	} )

	test( 'info : control mode (node)', () => {
		const engine = matchers.control
		const node = makeNode( '/-prefs/show_control SCENES' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-prefs/show_control' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Info

			expect( result ).toBeInstanceOf( X32Info )
			expect( result.type ).toEqual( 'control' )
			expect( result.value ).toEqual( 'SCENES' )
		}
	} )

	test( 'info : show name', () => {
		const engine = matchers.showName
		const node = makeNode( '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"' )
		
		const msg = converter( node, true )

		const matcher = engine.matcher( scope )
		expect( matcher ).toEqual( '/-show/showfile/show' )

		const matches = msg.match( matcher )
		expect( matches ).not.toBeNull()

		if ( matches !== null ) {
			const result = engine.processor( msg, matches ) as X32Info

			expect( result ).toBeInstanceOf( X32Info )
			expect( result.type ).toEqual( 'showName' )
			expect( result.value ).toEqual( 'MyShow' )
		}
	} )
} )