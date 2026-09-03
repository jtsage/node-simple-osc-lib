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

import { OSCBundle, OSCMessage, OSCType }    from '../src'
import { OSCArgument } from '../src/type'
import { X32Processor } from '../src/x32'
import { X32Cue, X32FaderUpdateLevel, X32FaderUpdateMix, X32FaderUpdateMute, X32FaderUpdateName, X32Info, X32Scene, X32Snippet } from '../src/x32/types'

// address, arg, expected type
const testData : [string, OSCArgument['value'], unknown ][] = [
	['/-show/prepos/current', 2, X32Info],
	['/-prefs/show_control', 0, X32Info],
	['/auxin/03/mix/fader', 0.7498, X32FaderUpdateLevel],
	['/auxin/03/mix/on', 2, X32FaderUpdateMute],
	['/auxin/03/config/name', 'HELLO', X32FaderUpdateName],
	['/bus/12/mix/fader', 0.0020, X32FaderUpdateLevel],
	['/bus/12/mix/on', 0, X32FaderUpdateMute],
	['/bus/12/config/name', '', X32FaderUpdateName],
	['/ch/12/mix/fader', 0.0020, X32FaderUpdateLevel],
	['/ch/12/mix/on', 0, X32FaderUpdateMute],
	['/ch/12/config/name', '', X32FaderUpdateName],
	['/dca/6/fader', 0.0230, X32FaderUpdateLevel],
	['/dca/6/on', 0, X32FaderUpdateMute],
	['/dca/6/config/name', 'GOODBYE', X32FaderUpdateName],
	['/main/st/mix/fader', 0.7498, X32FaderUpdateLevel],
	['/main/st/mix/on', 0, X32FaderUpdateMute],
	['/main/st/config/name', 'MAIN', X32FaderUpdateName],
	['/main/m/mix/fader', 0, X32FaderUpdateLevel],
	['/main/m/mix/on', 0, X32FaderUpdateMute],
	['/main/m/config/name', 'center', X32FaderUpdateName],
	['/mtx/04/mix/fader', 0.0030, X32FaderUpdateLevel],
	['/mtx/04/mix/on', 0, X32FaderUpdateMute],
	['/mtx/04/config/name', '04', X32FaderUpdateName],
	['/-show/showfile/snippet/010/name', 'HI', X32Info],
	['/-show/showfile/scene/010/name', 'HI', X32Info],
	['/-show/showfile/cue/010/name', 'HI', X32Info],
	['node', '/auxin/01/config "Q Main-L" 1 RD 33', X32FaderUpdateName],
	['node', '/auxin/01/mix ON   0.0 ON -100 OFF   -oo', X32FaderUpdateMix],
	['node', '/bus/01/config "StgMon" 63 YEi', X32FaderUpdateName],
	['node', '/bus/01/mix ON -11.0 OFF +0 OFF   -oo', X32FaderUpdateMix],
	['node', '/dca/2/config "2024" 1 RD', X32FaderUpdateName],
	['node', '/dca/2 OFF   -32.5', X32FaderUpdateMix],
	['node', '/ch/02/config "" 1 YE 2', X32FaderUpdateName],
	['node', '/ch/01/mix OFF   -oo OFF +0 OFF   -oo', X32FaderUpdateMix],
	['node', '/mtx/01/config "SMAART" 72 RDi', X32FaderUpdateName],
	['node', '/mtx/01/mix ON   0.0', X32FaderUpdateMix],
	['node', '/main/st/config "MainArray" 66 YEi', X32FaderUpdateName],
	['node', '/main/st/mix ON   0.0 +0', X32FaderUpdateMix],
	['node', '/main/m/config "" 67 WH', X32FaderUpdateName],
	['node', '/main/m/mix ON   -oo', X32FaderUpdateMix],
	['node', '/-show/prepos/current -1', X32Info],
	['node', '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"', X32Info],
	['node', '/-prefs/show_control SCENES', X32Info],
	['node', '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 1 1 -1 0 1 0 0', X32Cue],
	['node', '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1', X32Scene],
	['node', '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 ', X32Snippet],
]

const nullData = [
	['node', '/ch/01/eq/1 PEQ 328.1 -3.50 0.8'],
	['node', '/fx/4/source MIX16 MIX16'],
	['node', '/headamp/020 +21.0 OFF'], // cSpell:disable-line
	['/main/m/mix/01/pan', 0]
]

const testProcessor = new X32Processor()

describe( 'main class operate as expected', () => {
	test.each( testData )( 'Against address %s', ( a, b, c ) => {
		const msg = new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			]
		)
		const results = testProcessor.process( msg )

		expect( results ).not.toBeNull()
		expect( results ).toBeInstanceOf( c )
	} )
	test.each( nullData )( 'Against address %s', ( a, b ) => {
		const msg = new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			]
		)
		const results = testProcessor.process( msg )

		expect( results ).toBeNull()
	} )
	test( 'batch processing', () => {
		const goodMessages = testData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)
		const badMessages = nullData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)
		const bundle = new OSCBundle( badMessages )

		expect( goodMessages ).toHaveLength( 46 )
		expect( badMessages ).toHaveLength( 4 )

		testProcessor.failHard = true // overridden in batch mode.

		// @ts-expect-error testing fun.
		const results = testProcessor.batch( [...goodMessages, ...badMessages, bundle] )
		expect( results ).toHaveLength( 46 )

		// fail hard should be true again here
		// @ts-expect-error testing fun.
		expect( () => testProcessor.process( bundle ) ).toThrow( 'not send bundles' )
	} )
	test( 'failMode Testing', () => {
		const testProcessor2 = new X32Processor()

		const badMessages = nullData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)
		const bundle = new OSCBundle( badMessages )

		// testProcessor.failHard = false
		// @ts-expect-error testing fun.
		expect( testProcessor2.process( bundle ) ).toBeNull()

		testProcessor2.failHard = true
		// fail hard should be true again here
		// @ts-expect-error testing fun.
		expect( () => testProcessor2.process( bundle ) ).toThrow( 'not send bundles' )
	} )
	test( 'invalid test name', () => {
		const testProcessor2 = new X32Processor(
			null,
			['howdy'],
			true
		)

		const badMessages = nullData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)

		expect( () => testProcessor2.process( badMessages[0] ) ).toThrow( 'invalid test specified' )
	} )
	test( 'scope subset', () => {
		const testProcessor2 = new X32Processor(
			['bus', 'auxin']
		)

		const goodMessages = testData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)

		const results = testProcessor2.batch( goodMessages )
		
		expect( results.length ).toBeLessThan( goodMessages.length )
		expect( results.length ).toBeGreaterThan( 2 )
	} )
	test( 'valid test subset', () => {
		const testProcessor2 = new X32Processor(
			null,
			['dcaFaderReg', 'faderReg', 'mixNode']
		)

		const goodMessages = testData.map( ( [a, b] ) => new OSCMessage(
			a as string,
			[
				OSCType.fromValue( b )
			] )
		)

		const results = testProcessor2.batch( goodMessages )
		
		expect( results.length ).toBeLessThan( goodMessages.length )
		expect( results.length ).toBeGreaterThan( 2 )
	} )
} )
