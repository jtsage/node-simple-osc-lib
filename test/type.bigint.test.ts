/* eslint-disable @stylistic/space-in-parens */
/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - BIG INTEGER type */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCTypeBigInt, OSCTypeError, OSCDecodeError, OSCType } from '../src/type'

const makeBigIntegerBuffer = (value : bigint) => {
	const buffer = Buffer.alloc(8)
	buffer.writeBigInt64BE(value)
	return buffer
}

describe('type :: BIGINT', () => {
	describe('new Class', () => {
		test.each([
			{ humanName : 'string', value : 'hello'},
			{ humanName : 'float', value : 69.69 },
			{ humanName : 'integer', value : 69 },
			{ humanName : 'object', value : {}},
			{ humanName : 'array', value : []},
			{ humanName : 'null', value : null},
			{ humanName : 'buffer', value : Buffer.alloc(4)},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		])( 'Test with $value ($humanName)', ({humanName, value}) => {
			// @ts-expect-error Testing errors.
			expect(() => new OSCTypeBigInt( value ) ).toThrow(OSCTypeError)
		})

		test.each([
			[BigInt(4), 8],
			[BigInt(486), 8],
			[BigInt(9007199254740991), 8],
		])('Test expected length %s -> %i', (a, b) => {
			expect(
				( new OSCTypeBigInt( a ) )
					.buffer
					.length
			).toEqual(b)
		})

		test('from arg object', () => {
			const output = OSCType.fromObject( { type : 'bigint', value : BigInt(66) } )
			const expected = makeBigIntegerBuffer(BigInt(66))

			expect( output.value ).toEqual( BigInt(66) )
			expect( output.bufLen ).toEqual( 8 )
			expect( output.type ).toEqual( 'bigint' )
			expect( output.typeChar ).toEqual( 'h' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeBigInt )
		})

		test('from value', () => {
			const output = OSCType.fromValue( BigInt(66) )
			const expected = makeBigIntegerBuffer(BigInt(66))

			expect( output.value ).toEqual( BigInt(66) )
			expect( output.bufLen ).toEqual( 8 )
			expect( output.type ).toEqual( 'bigint' )
			expect( output.typeChar ).toEqual( 'h' )
			expect( output.buffer ).toEqual( expected )
			expect( output ).toBeInstanceOf( OSCTypeBigInt )
		})
	})
	describe('decodeBufferChunk', () => {
		test('good positive integer', () => {
			const input    = makeBigIntegerBuffer(BigInt(53))
			const output   = OSCTypeBigInt.fromBuffer( input )

			expect( output.value ).toEqual( BigInt(53) )
		})

		test('good negative integer', () => {
			const input    = makeBigIntegerBuffer(BigInt(-9007199254740991))
			const output   = OSCTypeBigInt.fromBuffer( input )

			expect( output.value ).toEqual( BigInt(-9007199254740991) )
		})

		test('non-buffer', () => {
			const input    = 'hello'
			// @ts-expect-error Testing errors.
			expect(() => OSCTypeBigInt.fromBuffer( input ) ).toThrow(OSCDecodeError)
		})

		test('insufficiently padded buffer', () => {
			const input    = Buffer.alloc(7)
			expect( () => OSCTypeBigInt.fromBuffer( input ) ).toThrow(OSCDecodeError)
		})
	})
})
