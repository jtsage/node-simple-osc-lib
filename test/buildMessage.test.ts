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

import * as help                                  from './helpers'
import { OSCMessage }                             from '../src/message'
import { NULL }                                   from '../src'
import { OSCArguments, OSCEncodeError, OSCError } from '../src/types'

const twoStrings : OSCArguments[] = [
	{ type : 'string', value : 'hi' },
	{ type : 'string', value : 'there' },
]
describe( 'buildMessage Output', () => {

	test( 'arguments are optional', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello'
		)

		const expected = Buffer.from( `/hello${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			twoStrings
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},ss${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings (symbol mode)', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			twoStrings,
			help.symbolMode
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},SS${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested array (bang)', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			[
				{
					type  : 'array',
					value : [
						{
							type  : 'array',
							value : [
								{ type : 'bang', value : null }
							],
						}
					],
				},
				...twoStrings,
			]
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},[[I]]ss${NULL}${NULL}${NULL}${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested string', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			[
				{
					type  : 'array',
					value : [
						{ type : 'string', value : 'goodbye' }
					] },
				...twoStrings,
			]
		)

		const expected = Buffer.from( `/hello${NULL}${NULL},[s]ss${NULL}${NULL}goodbye${NULL}hi${NULL}${NULL}there${NULL}${NULL}${NULL}` )
		expect( oscMessage.buffer ).toEqual( expected )
	} )

	test( 'two strings with nested garbage (fail)', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			[
				// @ts-expect-error checking error
				[['hello']],
				...twoStrings,
			]
		)

		expect( () => oscMessage.buffer ).toThrow( OSCEncodeError )
	} )

	test( 'strict mode fails with non slash address', () => {
		const oscMessage = OSCMessage.newMessage(
			'hello',
			twoStrings,
			help.strictMode
		)

		expect( () => oscMessage.buffer ).toThrow( OSCEncodeError )
	} )

	test( 'address is required (empty)', () => {
		expect( () => {
			OSCMessage.newMessage(
				'',
				twoStrings
			)
		} ).toThrow( OSCError )
	} )

	test( 'address is required (missing)', () => {
		expect( () => {
			OSCMessage.newMessage(
				// @ts-expect-error testing errors
				null,
				twoStrings
			)
		} ).toThrow( OSCError )
	} )

	test( 'address is ascii-only', () => {
		const oscMessage = OSCMessage.newMessage(
			/* cspell:disable-next-line */
			'/Résumé',
			twoStrings
		)
		expect( () => oscMessage.buffer ).toThrow( OSCEncodeError )
	} )

	test( 'arguments must be an array', () => {
		expect( () => OSCMessage.newMessage(
			'hello',
			// @ts-expect-error testing error.
			'hello there'
		) ).toThrow( OSCError )
	} )

	test( 'arguments must still be an array', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello'
		)

		// @ts-expect-error testing fun.
		oscMessage.args = 'hello there'
		
		expect( () => oscMessage.buffer ).toThrow( OSCError )
	} )

	test( 'arguments must be correct type signature', () => {
		const oscMessage = OSCMessage.newMessage(
			'hello',
			[
				//@ts-expect-error checking errors.
				{ type : 'string', blah : 'hello' }
			]
		)

		expect( () => oscMessage.buffer ).toThrow( OSCEncodeError )
	} )

	test( 'arguments must be correct type signature', () => {
		const oscMessage = OSCMessage.newMessage(
			'hello',
			[
				//@ts-expect-error checking errors.
				{ blah : 'string', value : 'hello' }
			]
		)

		expect( () => oscMessage.buffer ).toThrow( OSCEncodeError )
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
			const thisBuild = OSCMessage.newMessage(
				a,
				[
					{ type : c, value : b } as OSCArguments
				]
			)

			expect( thisBuild.buffer.length ).toEqual( expected )
		} )
	} )

	test( 'messing with the object fails', () => {
		// Don't do this. This should never happen.
		const oscMessage = OSCMessage.newMessage(
			'hello',
			[
				//@ts-expect-error checking errors.
				{ blah : 'string', value : 'hello' }
			]
		)

		// @ts-expect-error Checking errors.
		oscMessage.type.type = 'hello'

		expect( () => oscMessage.buffer ).toThrow( OSCError )
	} )

	test( 'messing with the object fails', () => {
		// Don't do this. This should never happen.
		const oscMessage = OSCMessage.newMessage(
			'hello',
			[
				//@ts-expect-error checking errors.
				{ blah : 'string', value : 'hello' }
			]
		)

		// @ts-expect-error Checking errors.
		oscMessage.type.type = 'hello'
		Object.defineProperty( oscMessage, 'isBundle', {
			value        : () => true,
			writable     : false,
			configurable : true,
		} )

		expect( () => oscMessage.buffer ).toThrow( 'internal error - non bundle' )
	} )

	test( 'messing with the object fails', () => {
		// Don't do this. This should never happen.
		const oscMessage = OSCMessage.newMessage(
			'hello',
			[
				//@ts-expect-error checking errors.
				{ blah : 'string', value : 'hello' }
			]
		)

		// @ts-expect-error Checking errors.
		oscMessage.type.type = 'hello'
		Object.defineProperty( oscMessage, 'isSingle', {
			value        : () => true,
			writable     : false,
			configurable : true,
		} )

		expect( () => oscMessage.buffer ).toThrow( 'internal error - non message' )
	} )

	test( 'using constructor directly fail', () => {
		// @ts-expect-error bad new instance
		expect( () => new OSCMessage() ).toThrow( 'must use' )
	} )

	test( 'two strings serialize', () => {
		const oscMessage = OSCMessage.newMessage(
			'/hello',
			twoStrings
		)

		const expected = '{"address":"/hello","elements":[{"type":"string","value":"hi"},{"type":"string","value":"there"}],"type":"message"}'
		expect( JSON.stringify( oscMessage ) ).toEqual( expected )
	} )
} )