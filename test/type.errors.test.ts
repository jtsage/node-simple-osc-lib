/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - Other Errors not tested elsewhere */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCArg, OSCType, OSCTypeError } from '../src/type'

describe( 'class checks', () => {
	test( 'init parent', () => {
		expect( () => new OSCArg() )
			.toThrow( 'instantiate OSCArg directly' )
	} )

	test( 'init parent', () => {
		expect( () => new OSCType() )
			.toThrow( 'use fromObject or fromValue method' )
	} )

	test( 'bad type object 1', () => {
		// @ts-expect-error testing fun.
		expect( () => OSCType.fromObject( { type : 'string', v : null } ) ).toThrow( OSCTypeError )
	} )

	test( 'bad type object 2', () => {
		// @ts-expect-error testing fun.
		expect( () => OSCType.fromObject( { t : 'string', value : 'howdy' } ) ).toThrow( OSCTypeError )
	} )

	test( 'bad type object 3', () => {
		// @ts-expect-error testing fun.
		expect( () => OSCType.fromObject( { type : 'unknown', value : null } ) ).toThrow( OSCTypeError )
	} )

	test( 'bad value', () => {
		// @ts-expect-error testing fun.
		expect( () => OSCType.fromValue( { a : 'b' } ) ).toThrow( OSCTypeError )
	} )
} )
