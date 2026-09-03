/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - buildBundle */
/// <reference types="node" />
/// <reference types="jest" />

import { OSCDecodeError, OSCBundle, OSCMessage, OSCType, OSCTypeError, OSCPacket } from '../src'

const arg1 = OSCType.fromObject( { type : 'string', value : 'hi' } )
const arg2 = OSCType.fromObject( { type : 'string', value : 'there' } )

const msg1 = new OSCMessage( '/testMessage', [arg1] )
const msg2 = new OSCMessage( '/testMessage', [arg2] )

const bundleMsgPair = [msg1, msg2]

describe( 'bundle testing', () => {
	describe( 'building', () => {
		test( 'build with no timetag succeeds with "now"', () => {
			const oscBundle = new OSCBundle(
				bundleMsgPair
			)

			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 76 )
			expect( oscBundle.timeTag.sinceNow() ).toBeLessThan( 100 )
			expect( oscBundle.timeTag.sinceNow() ).toBeGreaterThan( -100 )
		} )

		test( 'build with buffers works', () => {
			const oscBundle = new OSCBundle(
				[
					msg1.buffer,
					msg2.buffer
				]
			)
			
			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 76 )
			expect( oscBundle.timeTag.sinceNow() ).toBeLessThan( 100 )
			expect( oscBundle.timeTag.sinceNow() ).toBeGreaterThan( -100 )
		} )

		test( 'build with no messages fails', () => {
			const oscBundle = new OSCBundle( [] )

			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( () => oscBundle.buffer ).toThrow( OSCTypeError )
		} )

		test( 'build with no messages fails (pt 2)', () => {
			const oscBundle = new OSCBundle()

			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( () => oscBundle.buffer ).toThrow( OSCTypeError )
		} )
		
		test( 'build with single message and delta works', () => {
			const oscBundle = new OSCBundle(
				[msg1],
				'+500'
			)
			
			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			expect( oscBundle.timeTag.sinceNow() ).toBeLessThanOrEqual( -400 )
			expect( oscBundle.timeTag.sinceNow() ).toBeGreaterThanOrEqual( -600 )
		} )

		test( 'build with single message and date works', () => {
			const oscBundle = new OSCBundle(
				[msg1],
				( new Date() )
			)
			
			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			expect( oscBundle.timeTag.sinceNow() ).toBeLessThan( 100 )
			expect( oscBundle.timeTag.sinceNow() ).toBeGreaterThan( -100 )
		} )

		test( 'build with bad message fails', () => {
			expect( () => new OSCBundle(
				// @ts-expect-error testing fun
				['hello']
			) ).toThrow( OSCTypeError )
		} )

		test( 'custom array class test', () => {
			const bundle = new OSCBundle()

			// @ts-expect-error testing fun.
			expect( () => bundle.messages.push( 'hello' ) ).toThrow( OSCTypeError )
			// @ts-expect-error testing fun.
			expect( () => bundle.messages.unshift( 'hello' ) ).toThrow( OSCTypeError )
			
			expect( () => bundle.messages.unshift( msg1 ) ).not.toThrow( OSCTypeError )
		} )

		test( 'build with single message and seconds works', () => {
			const oscBundle = new OSCBundle(
				[msg1],
				( new Date() ).getTime() / 1000
			)

			expect( oscBundle.isMessage() ).toBeFalsy()
			expect( oscBundle.isBundle() ).toBeTruthy()
			expect( oscBundle.timeTag.value ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			expect( oscBundle.timeTag.sinceNow() ).toBeLessThan( 100 )
			expect( oscBundle.timeTag.sinceNow() ).toBeGreaterThan( -100 )
		} )


		test( 'serialize nested works', () => {
			const oscBundle = new OSCBundle(
				bundleMsgPair,
				true
			)

			const nestBundle = new OSCBundle(
				[oscBundle, msg1, msg2],
				true
			)

			expect( nestBundle.buffer ).toHaveLength( 156 )

			const serialized = '{"messages":[{"messages":[{"address":"/testMessage","elements":[{"type":"string","value":"hi"}],"type":"message"},{"address":"/testMessage","elements":[{"type":"string","value":"there"}],"type":"message"}],"timeTag":[0,1],"type":"bundle"},{"address":"/testMessage","elements":[{"type":"string","value":"hi"}],"type":"message"},{"address":"/testMessage","elements":[{"type":"string","value":"there"}],"type":"message"}],"timeTag":[0,1],"type":"bundle"}'
			expect( JSON.stringify( nestBundle ) ).toEqual( serialized )
		} )

	} )

	describe( 'reading', () => {
		test( 'read with no buffer fails', () => {
			expect( () => OSCBundle
				// @ts-expect-error testing fun.
				.fromBuffer( 'a' )
			).toThrow( 'buffer expected' )
		} )

		test( 'read with incorrect size fails on strict', () => {
			const badBundle = Buffer.alloc( 7 )
			badBundle.write( '#bundle' )
			expect( () => OSCBundle.fromBuffer( badBundle, true ) ).toThrow( 'buffer is not a 4-byte multiple' )
		} )

		test( 'read with no messages fails with "no messages"', () => {
			const emptyBundle = Buffer.alloc( 16 )
			emptyBundle.write( '#bundle' )
			emptyBundle.writeUInt32BE( 2222, 8 )
			emptyBundle.writeUInt32BE( 4444, 12 )
			expect( () => OSCBundle.fromBuffer( emptyBundle ) ).toThrow( 'bundles with no messages are invalid' )
		} )

		test( 'read with malformed timetag fails', () => {
			const emptyBundle = Buffer.alloc( 12 )
			emptyBundle.write( '#bundle' )
			emptyBundle.writeUInt32BE( 2222, 8 )
			expect( () => OSCBundle.fromBuffer( emptyBundle ) ).toThrow( OSCDecodeError )
		} )

		test( 'read with incorrect ID fails', () => {
			const emptyBundle = Buffer.alloc( 16 )
			emptyBundle.write( '#blundl' ) // cSpell:disable-line
			emptyBundle.writeUInt32BE( 2222, 8 )
			emptyBundle.writeUInt32BE( 4444, 12 )
			expect( () => OSCBundle.fromBuffer( emptyBundle ) ).toThrow( 'not a bundle' )
		} )

		test( 'read with single message works (round-trip)', () => {
			const thisBundle = new OSCBundle(
				[msg1],
				true
			)
			const thisBuffer = thisBundle.buffer
			
			expect( JSON.stringify( OSCBundle.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisBundle ) )
		} )

		test( 'read with multiple messages works (round-trip)', () => {
			const thisBundle = new OSCBundle(
				[msg1, msg2],
				true
			)
			const thisBuffer = thisBundle.buffer
			
			expect( JSON.stringify( OSCBundle.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisBundle ) )
		} )

		test( 'read with nested bundle works (round-trip)', () => {
			const thisBundle = new OSCBundle(
				[msg1, msg2],
				true
			)
			const thisNest = new OSCBundle(
				[thisBundle, msg1, msg2],
				true
			)
			const thisBuffer = thisNest.buffer
			
			expect( JSON.stringify( OSCPacket.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisNest ) )
		} )
	} )
} )
