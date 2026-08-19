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
import { converter } from '../src/x32/nodeConvert'
import { X32Error } from '../src/x32/types'

const makeNode = ( v : string ) => {
	return OSCMessage.newMessage(
		'node',
		[
			{ type : 'string', value : v }
		]
	)
}


describe( 'converter operate as expected', () => {
	test( 'not node message', () => {
		const msg = OSCMessage.newMessage( '/hello' )

		expect( converter( msg, true ) ).toEqual( msg )
	} )

	test( 'empty node message', () => {
		const msg = OSCMessage.newMessage( 'node' )

		expect( () => converter( msg, true ) ).toThrow( X32Error )
	} )

	test( 'empty node message (soft)', () => {
		const msg = OSCMessage.newMessage( 'node' )

		expect( converter( msg ) ).toEqual( msg )
	} )

	test( 'address only', () => {
		const msg = makeNode( '/-show/showfile/cue/000' )

		expect( () => converter( msg, true ) ).toThrow( X32Error )
	} )

	test( 'address only (soft)', () => {
		const msg = makeNode( '/-show/showfile/cue/000' )

		expect( converter( msg ) ).toEqual( msg )
	} )

	test( 'cue', () => {
		const msg = makeNode( '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 1 1 -1 0 1 0 0' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/-show/showfile/cue/000' )
		expect( result.args ).toHaveLength( 9 )
		expect( result.args[1].value ).toEqual( 'Cue Idx0 Num1200' )
		expect( result.args[4].value ).toEqual( -1 )
		expect( result.args[8].value ).toEqual( 0 )
	} )

	test( 'scene', () => {
		const msg = makeNode( '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/-show/showfile/scene/001' )
		expect( result.args ).toHaveLength( 4 )
		expect( result.args[0].value ).toEqual( 'AAA' )
		expect( result.args[1].value ).toEqual( 'aaa' )
	} )

	test( 'snippet', () => {
		const msg = makeNode( '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/-show/showfile/snippet/000' )
		expect( result.args ).toHaveLength( 6 )
		expect( result.args[0].value ).toEqual( 'Aaa' )
		expect( result.args[5].value ).toEqual( 1 )
	} )

	test( 'show name', () => {
		const msg = makeNode( '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/-show/showfile/show' )
		expect( result.args ).toHaveLength( 12 )
		expect( result.args[0].value ).toEqual( 'MyShow' )
		expect( result.args[11].value ).toEqual( '2.08' )
	} )

	test( 'show control', () => {
		const msg = makeNode( '/-prefs/show_control SCENES' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/-prefs/show_control' )
		expect( result.args ).toHaveLength( 1 )
		expect( result.args[0].value ).toEqual( 'SCENES' )
	} )

	test( 'mix 1', () => {
		const msg = makeNode( '/main/m/mix ON   -oo' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/main/m/mix' )
		expect( result.args ).toHaveLength( 2 )
		expect( result.args[0].value ).toEqual( 'ON' )
		expect( result.args[1].value ).toEqual( '-oo' )
	} )

	test( 'mix 2', () => {
		const msg = makeNode( '/main/st/mix ON   0.0 +0' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/main/st/mix' )
		expect( result.args ).toHaveLength( 3 )
		expect( result.args[0].value ).toEqual( 'ON' )
		expect( result.args[1].value ).toEqual( '0.0' )
	} )

	test( 'mix 3', () => {
		const msg = makeNode( '/ch/01/mix OFF   -oo OFF +0 OFF   -oo' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/ch/01/mix' )
		expect( result.args ).toHaveLength( 6 )
		expect( result.args[0].value ).toEqual( 'OFF' )
		expect( result.args[1].value ).toEqual( '-oo' )
	} )

	test( 'config', () => {
		const msg = makeNode( '/main/m/config "" 67 WH' )

		const result = converter( msg, true )
		expect( result.type.address ).toEqual( '/main/m/config' )
		expect( result.args ).toHaveLength( 3 )
		expect( result.args[0].value ).toEqual( '' )
		expect( result.args[1].value ).toEqual( 67 )
	} )
} )
