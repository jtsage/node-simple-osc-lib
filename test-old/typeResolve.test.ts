/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - TYPE resolution */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { OSCArgumentCharToString, OSCArgumentStringToChar, OSCError } from '../src/types'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { simpleOSC } from '../src'

const oscLib = new simpleOSC()

const allTypesByString : Record<string, string> = {
	bang    : 'I',
	bigint  : 'h',
	blob    : 'b',
	char    : 'c',
	color   : 'r',
	double  : 'd',
	false   : 'F',
	float   : 'f',
	integer : 'i',
	midi    : 'm',
	null    : 'N',
	string  : 's',
	symbol  : 'S',
	timetag : 't',
	true    : 'T',
}

describe( 'TYPE resolution', () => {
	const listOfChars    = new Set( Object.values( allTypesByString ) )
	const listOfStrings = new Set( Object.keys( allTypesByString ) )
	const allTypesByKey : Record<string, string> = {}

	for ( const thisString of listOfStrings ) {
		allTypesByKey[allTypesByString[thisString]] = thisString
	}

	test.each( [...listOfChars] )( 'resolve %s', ( a ) => {
		// @ts-expect-error test funkiness
		expect( OSCArgumentCharToString( a ) ).toEqual( allTypesByKey[a] )
	} )
	test.each( [...listOfStrings] )( 'lookup %s', ( a ) => {
		// @ts-expect-error test funkiness
		expect( OSCArgumentStringToChar( a ) ).toEqual( allTypesByString[a] )
	} )
	
	test( 'unknown character', () => {
		// @ts-expect-error test funkiness
		expect( () => OSCArgumentCharToString( 'X' ) ).toThrow( OSCError )
	} )
	test( 'unknown string', () => {
		// @ts-expect-error test funkiness
		expect( () => OSCArgumentStringToChar( 'blahblah' ) ).toThrow( OSCError )
	} )
	test( 'empty string', () => {
		// @ts-expect-error test funkiness
		expect( () => OSCArgumentCharToString( '' ) ).toThrow( OSCError )
	} )
	test( 'non string', () => {
		// @ts-expect-error test funkiness
		expect( () => OSCArgumentCharToString( 16 ) ).toThrow( OSCError )
	} )

	test( 'encode unknown type', () => {
		// @ts-expect-error test funkiness
		expect( () => encodeBuffer( { type : 'bullshit', value : null }, help.regularMode ) ).toThrow( OSCError )
	} )
	test( 'decode unknown type', () => {
		// @ts-expect-error test funkiness
		expect( () => decodeBuffer( 'x', Buffer.alloc( 0 ), help.regularMode ) ).toThrow( 'Decoding function does not exist' )
	} )

	test( 'osc version', () => {
		expect( oscLib.oscVersion ).toEqual( '1.1' )
	} )
	
	test( 'osc type list', () => {
		/* cspell:disable-next-line */
		expect( oscLib.typeList ).toEqual( 'FINSTabcdfhimrst' )
	} )
} )