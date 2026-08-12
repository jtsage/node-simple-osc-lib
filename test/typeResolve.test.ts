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

import * as osc from '../src/index'

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
	null    : 'N',
	string  : 's',
	STRING  : 'S',
	timetag : 't',
	true    : 'T',
}

const oscRegular = new osc.simpleOscLib()

describe( 'TYPE resolution', () => {
	const listOfKeys = new Set( Object.values( allTypesByString ) )
	const listOfStrings = new Set( Object.keys( allTypesByString ) )
	const allTypesByKey : Record<string, string> = {}

	for ( const thisString of listOfStrings ) {
		allTypesByKey[allTypesByString[thisString]] = thisString
	}
	allTypesByKey.r = 'color' // (double entry)

	test.each( [...listOfKeys] )( 'resolve %s', ( a ) => {
		expect( oscRegular.getTypeStringFromChar( a ) ).toEqual( allTypesByKey[a] )
	} )
	test.each( [...listOfKeys] )( 'lookup %s', ( a ) => {
		expect( oscRegular.getTypeCharFromStringOrChar( a ) ).toEqual( a )
	} )
	test.each( [...listOfStrings] )( 'lookup %s', ( a ) => {
		expect( oscRegular.getTypeCharFromStringOrChar( a ) ).toEqual( allTypesByString[a] )
	} )
	test( 'unknown incoming character', () => {
		expect( oscRegular.getTypeStringFromChar( 'X' ) ).toEqual( 'unknown' )
	} )
	test( 'unknown character', () => {
		expect( () => oscRegular.getTypeCharFromStringOrChar( 'X' ) ).toThrow( RangeError )
	} )
	test( 'unknown string', () => {
		expect( () => oscRegular.getTypeCharFromStringOrChar( 'blahblah' ) ).toThrow( RangeError )
	} )
	test( 'empty string', () => {
		expect( () => oscRegular.getTypeCharFromStringOrChar( '' ) ).toThrow( TypeError )
	} )
	test( 'non string', () => {
		// @ts-expect-error checking errors.
		expect( () => oscRegular.getTypeCharFromStringOrChar( 16 ) ).toThrow( TypeError )
	} )
} )