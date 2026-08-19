/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - NON-DATA (null) types [T,F,N,I] */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCTypeTrue, OSCTypeFalse, OSCTypeNull, OSCTypeBang, OSCType } from '../src/type'

describe( 'argument-less types', () => {
	test( 'true from object', () => {
		const input = OSCType.fromObject( { type : 'true', value : null } )

		expect( input ).toBeInstanceOf( OSCTypeTrue )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'true' )
		expect( input.typeChar ).toEqual( 'T' )
		expect( input.value ).toEqual( null )
	} )

	test( 'true from value', () => {
		const input = OSCType.fromValue( true )

		expect( input ).toBeInstanceOf( OSCTypeTrue )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'true' )
		expect( input.debug ).toEqual( '' )
		expect( input.typeChar ).toEqual( 'T' )
		expect( input.value ).toEqual( null )
		expect( input.toJSON() ).toEqual( { type : 'true', value : null } )
	} )

	test( 'false from object', () => {
		const input = OSCType.fromObject( { type : 'false', value : null } )

		expect( input ).toBeInstanceOf( OSCTypeFalse )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'false' )
		expect( input.debug ).toEqual( '' )
		expect( input.typeChar ).toEqual( 'F' )
		expect( input.value ).toEqual( null )
	} )

	test( 'false from value', () => {
		const input = OSCType.fromValue( false )

		expect( input ).toBeInstanceOf( OSCTypeFalse )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'false' )
		expect( input.debug ).toEqual( '' )
		expect( input.typeChar ).toEqual( 'F' )
		expect( input.value ).toEqual( null )
		expect( input.toJSON() ).toEqual( { type : 'false', value : null } )
	} )

	test( 'null from object', () => {
		const input = OSCType.fromObject( { type : 'null', value : null } )

		expect( input ).toBeInstanceOf( OSCTypeNull )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'null' )
		expect( input.typeChar ).toEqual( 'N' )
		expect( input.debug ).toEqual( '' )
		expect( input.value ).toEqual( null )
	} )

	test( 'null from value', () => {
		const input = OSCType.fromValue( null )

		expect( input ).toBeInstanceOf( OSCTypeNull )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'null' )
		expect( input.debug ).toEqual( '' )
		expect( input.typeChar ).toEqual( 'N' )
		expect( input.value ).toEqual( null )
		expect( input.toJSON() ).toEqual( { type : 'null', value : null } )
	} )

	test( 'bang from value', () => {
		const input = OSCType.fromValue( Infinity )

		expect( input ).toBeInstanceOf( OSCTypeBang )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.debug ).toEqual( '' )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'bang' )
		expect( input.typeChar ).toEqual( 'I' )
		expect( input.value ).toEqual( null )
	} )

	test( 'bang from object', () => {
		const input = OSCType.fromObject( { type : 'bang', value : null } )

		expect( input ).toBeInstanceOf( OSCTypeBang )
		expect( input.bufLen ).toEqual( 0 )
		expect( input.buffer ).toHaveLength( 0 )
		expect( input.type ).toEqual( 'bang' )
		expect( input.debug ).toEqual( '' )
		expect( input.typeChar ).toEqual( 'I' )
		expect( input.value ).toEqual( null )
		expect( input.toJSON() ).toEqual( { type : 'bang', value : null } )
	} )
} )

