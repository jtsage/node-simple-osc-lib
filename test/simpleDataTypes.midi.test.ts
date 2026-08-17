/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - COLOR type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError, OSCMidi } from '../src/types'

const makeMidiBuffer = ( p : number, s : number, d1 : number, d2 : number ) => {
	const buffer = Buffer.alloc( 4 )
	buffer.writeUInt8( p, 0 )
	buffer.writeUInt8( s, 1 )
	buffer.writeUInt8( d1, 2 )
	buffer.writeUInt8( d2, 3 )
	return buffer
}

describe( 'type :: MIDI', () => {
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'number', value : 72},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : '!==4 element array', value : ['a', 'b']},
			{ humanName : 'non numeric array', value : ['a', 'b', 'c', 'd']},
			{ humanName : 'out-of-bounds port (high)', value : [365, 128, 0, 0]},
			{ humanName : 'out-of-bounds port (low)', value : [-6, 128, 0, 0]},
			{ humanName : 'out-of-bounds status (high)', value : [1, 444, 0, 0]},
			{ humanName : 'out-of-bounds status (low)', value : [1, 110, 0, 0]},
			{ humanName : 'out-of-bounds data 1 (high)', value : [1, 130, 129, 0]},
			{ humanName : 'out-of-bounds data 1 (low)', value : [1, 130, -2, 0]},
			{ humanName : 'out-of-bounds data 2 (high)', value : [1, 130, 34, 334]},
			{ humanName : 'out-of-bounds data 2 (low)', value : [1, 130, 34, -5]},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error checking errors.
			expect( () => encodeBuffer( { type : 'midi', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )

		test.each( [
			[[255, 250, 127, 127], 4],
			[[0, 130, 0, 127], 4],
		] )( 'Test expected length %s -> %i', ( a, b ) => {
			expect( encodeBuffer( { type : 'midi', value : a as OSCMidi }, help.regularMode ).buffer.length ).toEqual( b )
		} )

		test( 'bad port byte', () => {
			const input : OSCMidi = [-1, 130, 100, 50]
			expect( () => encodeBuffer( { type : 'midi', value : input }, help.regularMode ).buffer.length ).toThrow( 'midi byte 1 out of range' )
		} )

		test( 'bad status byte', () => {
			const input : OSCMidi = [1, 0, 100, 50]
			expect( () => encodeBuffer( { type : 'midi', value : input }, help.regularMode ).buffer.length ).toThrow( 'midi byte 2 (status) out of range' )
		} )

		test( 'bad data 1 byte', () => {
			const input : OSCMidi = [1, 128, 200, 50]
			expect( () => encodeBuffer( { type : 'midi', value : input }, help.regularMode ).buffer.length ).toThrow( 'midi byte 3 (data) out of range' )
		} )

		test( 'bad data 2 byte', () => {
			const input : OSCMidi = [1, 128, 20, 500]
			expect( () => encodeBuffer( { type : 'midi', value : input }, help.regularMode ).buffer.length ).toThrow( 'midi byte 4 (data) out of range' )
		} )
	} )
	describe( 'decodeBufferChunk', () => {
		test( 'good midi', () => {
			const input    = makeMidiBuffer( 1, 130, 100, 50 )
			const expected = help.getSimpleExpected( { type : 'midi', value : [1, 130, 100, 50] } )
			expect( decodeBuffer( 'm', input, help.regularMode ) ).toEqual( expected )
		} )

		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error checking errors.
			expect( () => decodeBuffer( 'm', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 3 )
			expect( () => decodeBuffer( 'm', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'char pair (buffer leftover)', () => {
			const input = Buffer.alloc( 4 )
			input.write( 'bye', 4 )
			const color = makeMidiBuffer( 1, 130, 100, 50 )
			const expected = help.getSimpleExpected( { type : 'midi', value : [1, 130, 100, 50] }, false )
			const result = decodeBuffer( 'm', Buffer.concat( [color, input] ), help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
