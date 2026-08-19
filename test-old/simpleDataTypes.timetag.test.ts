/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - TIMETAG type */
/// <reference types="node" />
/// <reference types="jest" />

import * as help from './helpers'
import { encodeBuffer, makeTimeTag } from '../src/encode'
import { decodeBuffer } from '../src/decode'
import { OSCDecodeError, OSCEncodeError, OSCError, OSCTimeTag } from '../src/types'
import { dateFromTimeTag, diffTimeTag, diffTimeTagMS } from '../src'

const getTimeTagBuffer = () => {
	const buffer = Buffer.alloc( 8 )
	buffer.writeUInt32BE( 3165615030 )
	buffer.writeUInt32BE( 536870912, 4 )
	return buffer
}

describe( 'type :: TIMETAG', () => {
	describe( 'makeTimeTag (bad)', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'object', value : {}},
			{ humanName : '!== 2 item array', value : [111]},
			{ humanName : 'non numeric 2 item array', value : [111, 'aaa']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error testing errors.
			expect( () => makeTimeTag( value ) ).toThrow( OSCError )
		} )

		test( 'dateFromTimeTag 2000-04-25T01:30:30.125Z from [3165615030, 536870912]', () => {
			expect( dateFromTimeTag( [3165615030, 536870912] ).toISOString() ).toEqual( '2000-04-25T01:30:30.125Z' )
		} )
	} )

	describe( 'makeTimeTag (good)', () => {
		test.each( [
			{ input : new Date( Date.UTC( 2000, 3, 25, 1, 30, 30, 125 ) ), output : [3165615030, 536870912] },
			{ input : 956626230.125, output : [3165615030, 536870912] },
			{ input : [3165615030, 536870912] as OSCTimeTag, output : [3165615030, 536870912] },
		] )( 'get value $output from $input', ( {input, output} ) => {
			expect( makeTimeTag( input ) ).toEqual( output )
		} )
	} )

	test( 'current makeTimeTag()', () => {
		expect( () => makeTimeTag() ).not.toThrow()
	} )

	test( 'bad makeTimeTag() delta', () => {
		// @ts-expect-error testing fun
		expect( () => makeTimeTag( '+13 13' ) ).toThrow( 'compute delta' )
	} )
	
	test( 'diffTimeTagMS', () => {
		const now   = new Date()

		const nowTT = makeTimeTag( now )
		const minTT = makeTimeTag( ( new Date( now.getTime() - 3240 ) ) )

		expect( diffTimeTagMS( minTT, nowTT ) ).toBeCloseTo( 3240 )
		expect( diffTimeTag( minTT, nowTT ) ).toBeCloseTo( 3.24, 2 )
	} )

	test( 'makeTimeTag (delta)', () => {
		const now   = new Date()

		const nowTT = makeTimeTag( now )
		const futTT = makeTimeTag( '+500' )

		expect( diffTimeTagMS( futTT, nowTT ) ).toBeGreaterThan( -510 )
		expect( diffTimeTagMS( futTT, nowTT ) ).toBeLessThan( -490 )
		expect( diffTimeTag( futTT, nowTT ) ).toBeCloseTo( -0.50, 1 )
	} )

	test( 'makeTimeTag (immediate)', () => {
		const instant = makeTimeTag( true )

		expect( instant[0] ).toEqual( 0 )
		expect( instant[1] ).toEqual( 1 )
		const result = encodeBuffer( { type : 'timetag', value : instant }, help.regularMode )
		expect( result.buffer[0] ).toEqual( 0 )
		expect( result.buffer[1] ).toEqual( 0 )
		expect( result.buffer[2] ).toEqual( 0 )
		expect( result.buffer[3] ).toEqual( 0 )
		expect( result.buffer[4] ).toEqual( 0 )
		expect( result.buffer[5] ).toEqual( 0 )
		expect( result.buffer[6] ).toEqual( 0 )
		expect( result.buffer[7] ).toEqual( 1 )
	} )

	test( 'dateFromTimeTag (non array)', () => {
		// @ts-expect-error testing errors.
		expect( () => dateFromTimeTag( 'hi' ) ).toThrow( OSCDecodeError )
	} )

	test( 'dateFromTimeTag (long array)', () => {
		// @ts-expect-error testing errors.
		expect( () => dateFromTimeTag( [1, 1, 1] ) ).toThrow( OSCDecodeError )
	} )

	test( 'dateFromTimeTag (bad array)', () => {
		// @ts-expect-error testing errors.
		expect( () => dateFromTimeTag( [1, 'hi'] ) ).toThrow( OSCDecodeError )
		// @ts-expect-error testing errors.
		expect( () => dateFromTimeTag( ['hi', 1] ) ).toThrow( OSCDecodeError )
	} )
	
	describe( 'encodeBufferChunk', () => {
		test.each( [
			//['name', 'value', 'Passes non-strict']
			{ humanName : 'buffer', value : Buffer.alloc( 4 )},
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'unicode', value : '❤️'},
			{ humanName : 'non-ascii', value : 'Ä'},
			{ humanName : 'object', value : {}},
			{ humanName : '!== 2 item array', value : [111]},
			{ humanName : 'non numeric 2 item array', value : [111, 'aaa']},
			{ humanName : 'null', value : null},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error testing errors.
			expect( () => encodeBuffer( { type : 'timetag', value : value }, help.regularMode ) ).toThrow( OSCEncodeError )
		} )
	} )

	describe( 'decodeBufferChunk', () => {
		test( 'good timetag', () => {
			const expected = help.getSimpleExpected( { type : 'timetag', value : [3165615030, 536870912] } )
			expect( decodeBuffer( 't', getTimeTagBuffer(), help.regularMode ) ).toEqual( expected )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error testing errors.
			expect( () => decodeBuffer( 't', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 7 )
			expect( () => decodeBuffer( 't', input, help.regularMode ) ).toThrow( OSCDecodeError )
		} )
		test( 'timetag pair (buffer leftover)', () => {
			const input = Buffer.alloc( 12 )
			input.writeUInt32BE( 3165615030 )
			input.writeUInt32BE( 536870912, 4 )
			input.write( 'bye', 8 )
			const expected = help.getSimpleExpected( { type : 'timetag', value : [3165615030, 536870912] }, false )
			const result = decodeBuffer( 't', input, help.regularMode )
			expect( result ).toEqual( expected )
			expect( result.remain.length ).toEqual( 4 )
		} )
	} )
} )
