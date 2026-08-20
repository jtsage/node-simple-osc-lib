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

import { OSCTimeTag, OSCTypeError, OSCDecodeError, OSCTimeTagArray } from '../src/type'

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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		] )( 'Test with $value ($humanName)', ( {humanName, value} ) => {
			// @ts-expect-error testing errors.
			expect( () => OSCTimeTag.fromValue( value ) ).toThrow( OSCTypeError )
			// @ts-expect-error testing errors.
			expect( () => new OSCTimeTag( value ) ).toThrow( OSCTypeError )
		} )
	} )

	describe( 'makeTimeTag (good)', () => {
		test.each( [
			{ input : new Date( Date.UTC( 2000, 3, 25, 1, 30, 30, 125 ) ), output : [3165615030, 536870912] },
			{ input : 956626230.125, output : [3165615030, 536870912] },
			{ input : [3165615030, 536870912] as OSCTimeTagArray, output : [3165615030, 536870912] },
			{ input : true, output : [0, 1] },
			{ input : OSCTimeTag.fromValue( true ), output : [0, 1]}
		] )( 'get value $output from $input', ( {input, output} ) => {
			expect(
				( OSCTimeTag.fromValue( input ) )
					.value
			).toEqual( output )
		} )

		test( 'dateFromTimeTag 2000-04-25T01:30:30.125Z from [3165615030, 536870912]', () => {
			const output = new OSCTimeTag( [3165615030, 536870912] )

			expect( output ).toBeInstanceOf( OSCTimeTag )
			expect( output.value ).toEqual( [3165615030, 536870912] )
			expect( output.asDate ).toBeInstanceOf( Date )
			expect( output.toISOString() ).toEqual( '2000-04-25T01:30:30.125Z' )
			expect( output.type ).toEqual( 'timetag' )
			expect( output.bufLen ).toEqual( 8 )
			expect( output.debug ).toEqual( '[t4][t4]' )
			expect( output.typeChar ).toEqual( 't' )
			expect( output.toJSON() ).toEqual( [3165615030, 536870912] )
			expect( output.buffer ).toEqual( getTimeTagBuffer() )
		} )
	} )

	test( 'current makeTimeTag()', () => {
		const nowMS = ( new Date() ).getTime()
		
		expect(
			Math.abs(
				( OSCTimeTag.fromValue() ).asDate.getTime() - nowMS
			)
		).toBeLessThan( 1000 )
		expect(
			Math.abs(
				( OSCTimeTag.fromValue( null ) ).asDate.getTime() - nowMS
			)
		).toBeLessThan( 1000 )
		expect(
			Math.abs(
				( OSCTimeTag.fromValue( false ) ).asDate.getTime() - nowMS
			)
		).toBeLessThan( 1000 )
	} )

	test( 'bad makeTimeTag() delta', () => {
		// @ts-expect-error testing fun
		expect( () => OSCTimeTag.fromValue( '+13 13' ) ).toThrow( 'compute delta' )
	} )
	
	test( 'delta with expected offset', () => {
		const withDelta = OSCTimeTag.fromValue( '+5000' )
		// expect negative 5000ms, times in the *past* are positive, i.e.
		// this happened #### ms ago. (Test has +/- 20ms leeway)
		expect( withDelta.sinceNow() ).toBeLessThan( -4980 )
		expect( withDelta.sinceNow() ).toBeGreaterThan( -5020 )

		const newNow = new Date()
		expect( withDelta.sinceNow( newNow ) ).toBeLessThan( -4990 )
		expect( withDelta.sinceNow( newNow ) ).toBeGreaterThan( -5010 )
	} )

	describe( 'decodeBufferChunk', () => {
		test( 'good timetag', () => {
			const output = OSCTimeTag.fromBuffer( getTimeTagBuffer() )
			expect( output.value ).toEqual( [3165615030, 536870912] )
		} )
		test( 'non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error testing errors.
			expect( () => OSCTimeTag.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
		test( 'insufficiently padded buffer', () => {
			const input    = Buffer.alloc( 7 )
			expect( () => OSCTimeTag.fromBuffer( input ) ).toThrow( OSCDecodeError )
		} )
	} )
} )
