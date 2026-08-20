/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - buildMessage */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCType, OSCMessage, OSCMessageArg, OSCTypeError } from '../src'

const NULL = '\u0000'

const twoStrings = [
	OSCType.fromObject( { type : 'string', value : 'hi' } ),
	OSCType.fromObject( { type : 'string', value : 'there' } ),
]

describe( 'buildMessage Output', () => {

	test( 'arguments are optional', () => {
		const oscMessage = new OSCMessage(
			'/hello'
		)

		const expected = Buffer.from( `/hello${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'add an argument', () => {
		const oscMessage = new OSCMessage(
			'/hello'
		)

		oscMessage.args.push(
			OSCType.fromValue( ']' ),
			OSCType.fromValue( ']' ),
			twoStrings[0],
			{ type : 'string', value : 'there' }
		)
		// @ts-expect-error testing fun.
		expect( () => oscMessage.args.push( 'hi' ) ).toThrow( 'unknown argument type' )
		// @ts-expect-error testing fun.
		expect( () => oscMessage.args.unshift( 'hi' ) ).toThrow( 'unknown argument type' )
		oscMessage.args.unshift(
			{ type : 'bang', value : null },
			OSCType.fromValue( '[' ),
			OSCType.fromValue( '[' )
		)
		const expected = Buffer.from( `/hello${NULL}${NULL},[[I]]ss${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			twoStrings
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},ss${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested array (bang)', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			[
				OSCType.fromValue( '[' ),
				OSCType.fromValue( '[' ),
				OSCType.fromObject( { type : 'bang', value : null } ),
				OSCType.fromValue( ']' ),
				OSCType.fromValue( ']' ),
				...twoStrings,
			]
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},[[I]]ss${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested string', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			[
				OSCType.fromValue( '[' ),
				OSCType.fromObject( { type : 'string', value : 'goodbye' } ),
				OSCType.fromValue( ']' ),
				...twoStrings,
			]
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},[s]ss${NULL}${NULL}goodbye${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested string (wrong, fail)', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			[
				OSCType.fromObject( { type : 'string', value : 'goodbye' } ),
				OSCType.fromValue( ']' ),
				...twoStrings,
			]
		)
		expect( () => oscMessage.buffer ).toThrow( OSCTypeError )
	} )

	test( 'two strings with nested garbage (fail)', () => {
		expect( () => new OSCMessage(
			'/hello',
			[
				// @ts-expect-error checking error
				[['hello']],
				...twoStrings,
			]
		) ).toThrow( OSCTypeError )
	} )

	test( 'address is required (empty)', () => {
		expect( () => {
			new OSCMessage(
				'',
				twoStrings
			)
		} ).toThrow( OSCTypeError )
	} )

	test( 'address is required (missing)', () => {
		expect( () => {
			new OSCMessage(
				// @ts-expect-error testing errors
				null,
				twoStrings
			)
		} ).toThrow( OSCTypeError )
	} )

	test( 'address is ascii-only', () => {
		expect( () => new OSCMessage(
			/* cspell:disable-next-line */
			'/Résumé',
			twoStrings
		) ).toThrow( OSCTypeError )
	} )

	test( 'arguments must be an array', () => {
		expect( () => new OSCMessage(
			'hello',
			// @ts-expect-error testing error.
			'hello there'
		) ).toThrow( OSCTypeError )
	} )

	test( 'arguments must still be an array', () => {
		const oscMessage = new OSCMessage(
			'/hello'
		)

		expect( () =>
			// @ts-expect-error testing fun.
			oscMessage.args = 'hello there'
		).toThrow( OSCTypeError )
	} )

	describe( 'standard message build', () => {
		test.each( [
			['/-show/prepos/current', 1, 'integer', 32],
			['/-show/prepos', 1, 'integer', 24],
			['/bus/14/mix/fader', 0.4878, 'float', 28],
			['/dca/1/fader', 0.7498, 'float', 24],
			['/dca/1/on', 1, 'integer', 20],
			['/bus/08/mix/on', 1, 'integer', 24],
			['/bus/08/config/name', 'HEAD', 'string', 32],
			['/dca/1/config/name', 'TESTER', 'string', 32],
		] )( 'build osc buffer (%s) [%s:%s] and check size (%i bytes)', ( a, b, c, expected ) => {
			const thisBuild = new OSCMessage(
				a,
				[
					{ type : c, value : b } as OSCMessageArg
				]
			)

			expect( thisBuild.buffer.length ).toEqual( expected )
		} )
	} )

	test( 'two strings serialize', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			twoStrings
		)

		const expected = '{"address":"/hello","elements":[{"type":"string","value":"hi"},{"type":"string","value":"there"}],"type":"message"}'
		expect( JSON.stringify( oscMessage ) ).toEqual( expected )
	} )
	test( 'two strings and an array serialize', () => {
		const oscMessage = new OSCMessage(
			'/hello',
			[
				OSCType.fromValue( '[' ),
				OSCType.fromObject( { type : 'bang', value : null } ),
				OSCType.fromValue( ']' ),
				...twoStrings
			]
		)

		const expected = '{"address":"/hello","elements":[{"type":"arrayOpen","value":null},{"type":"bang","value":null},{"type":"arrayClose","value":null},{"type":"string","value":"hi"},{"type":"string","value":"there"}],"type":"message"}'
		const debugString = '/hel¦lo••¦,[I]¦ss••¦hi••¦ther¦e•••' // cSpell:disable-line
		expect( JSON.stringify( oscMessage ) ).toEqual( expected )
		expect( oscMessage.debug ).toEqual( debugString )
	} )
} )