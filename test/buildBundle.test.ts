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

import { OSCMessage }  from '../src/message'
import { diffTimeTag } from '../src'
import { OSCDecodeError, OSCError, OSCTimeTagImmediate }    from '../src/types'

const msg1 = OSCMessage.newMessage( {
	address : '/hello',
	args    : [
		{ type : 'string', value : 'world' },
		{ type : 'integer', value : 20 },
	],
} )

const msg2 = OSCMessage.newMessage( {
	address : '/goodnight',
	args    : [
		{ type : 'string', value : 'moon' },
		{ type : 'integer', value : 69 }
	],
} )

const bundleMsgPair = [msg1, msg2]

describe( 'bundle testing', () => {
	describe( 'building', () => {
		test( 'build with no timetag succeeds with "now"', () => {
			const oscBundle = OSCMessage.newBundle( {
				msgs : bundleMsgPair,
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 76 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeCloseTo( 0, 1 )
		} )

		test( 'build with buffers works', () => {
			const oscBundle = OSCMessage.newBundle( {
				msgs : [
					msg1.buffer,
					msg2.buffer
				],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 76 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeCloseTo( 0, 1 )
		} )

		test( 'build with no messages fails', () => {
			const oscBundle = OSCMessage.newBundle( {
				msgs : [],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( () => oscBundle.buffer ).toThrow( OSCError )
		} )

		test( 'build with no messages fails (pt 2)', () => {
			// @ts-expect-error testing fun
			const oscBundle = OSCMessage.newBundle( {} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( () => oscBundle.buffer ).toThrow( OSCError )
		} )
		
		test( 'build with single message and delta works', () => {
			const oscBundle = OSCMessage.newBundle( {
				timeTag : '+500',
				msgs    : [msg1],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeLessThanOrEqual( -0.4 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeGreaterThanOrEqual( -0.6 )
		} )

		test( 'build with single message and date works', () => {
			const oscBundle = OSCMessage.newBundle( {
				timeTag : ( new Date() ),
				msgs    : [msg1],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeCloseTo( 0, 1 )
		} )

		test( 'build with bad message fails', () => {
			const oscBundle = OSCMessage.newBundle( {
				// @ts-expect-error testing fun
				msgs    : ['hello'],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( () => oscBundle.buffer ).toThrow( 'non OSC' )
		} )

		test( 'build with single message and seconds works', () => {
			const oscBundle = OSCMessage.newBundle( {
				timeTag : ( new Date() ).getTime() / 1000,
				msgs    : [msg1],
			} )
			// @ts-expect-error testing fun
			expect( oscBundle.type.timeTag ).toHaveLength( 2 )
			expect( oscBundle.buffer ).toHaveLength( 44 )
			// @ts-expect-error testing fun
			expect( diffTimeTag( oscBundle.type.timeTag ) ).toBeCloseTo( 0, 1 )
		} )


		test( 'serialize nested works', () => {
			const oscBundle = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : bundleMsgPair,
			} )

			const nestBundle = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : [oscBundle, msg1, msg2],
			} )

			expect( nestBundle.buffer ).toHaveLength( 156 )

			const serialized = '{"messages":[{"messages":[{"address":"/hello","elements":[{"type":"string","value":"world"},{"type":"integer","value":20}],"type":"message"},{"address":"/goodnight","elements":[{"type":"string","value":"moon"},{"type":"integer","value":69}],"type":"message"}],"timeTag":[0,1],"type":"bundle"},{"address":"/hello","elements":[{"type":"string","value":"world"},{"type":"integer","value":20}],"type":"message"},{"address":"/goodnight","elements":[{"type":"string","value":"moon"},{"type":"integer","value":69}],"type":"message"}],"timeTag":[0,1],"type":"bundle"}'
			expect( JSON.stringify( nestBundle ) ).toEqual( serialized )
		} )

	} )
	describe( 'reading', () => {
		test( 'read with no messages works', () => {
			const emptyBundle = Buffer.alloc( 16 )
			emptyBundle.write( '#bundle' )
			emptyBundle.writeUInt32BE( 2222, 8 )
			emptyBundle.writeUInt32BE( 4444, 12 )
			const expected = '{"messages":[],"timeTag":[2222,4444],"type":"bundle"}'
			expect( JSON.stringify( OSCMessage.fromBuffer( emptyBundle ) ) ).toEqual( expected )
		} )

		test( 'read with malformed timetag fails', () => {
			const emptyBundle = Buffer.alloc( 12 )
			emptyBundle.write( '#bundle' )
			emptyBundle.writeUInt32BE( 2222, 8 )
			expect( () => OSCMessage.fromBuffer( emptyBundle ) ).toThrow( OSCDecodeError )
		} )

		test( 'read with incorrect ID reads as empty message', () => {
			const emptyBundle = Buffer.alloc( 16 )
			emptyBundle.write( '#blundl' ) // cSpell:disable-line
			emptyBundle.writeUInt32BE( 2222, 8 )
			emptyBundle.writeUInt32BE( 4444, 12 )
			const result = OSCMessage.fromBuffer( emptyBundle )
			expect( result.isBundle ).toEqual( false )
			expect( result.isSingle ).toEqual( true )
			// @ts-expect-error testing fun
			expect( result.type.address ).toEqual( '#blundl' ) // cSpell:disable-line
		} )

		test( 'read with single message works (round-trip)', () => {
			const thisBundle = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : [msg1],
			} )
			const thisBuffer = thisBundle.buffer
			
			expect( JSON.stringify( OSCMessage.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisBundle ) )
		} )

		test( 'read with multiple messages works (round-trip)', () => {
			const thisBundle = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : [msg1, msg2],
			} )
			const thisBuffer = thisBundle.buffer
			
			expect( JSON.stringify( OSCMessage.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisBundle ) )
		} )

		test( 'read with nested bundle works (round-trip)', () => {
			const thisBundle = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : [msg1, msg2],
			} )
			const thisNest = OSCMessage.newBundle( {
				timeTag : OSCTimeTagImmediate,
				msgs    : [thisBundle, msg1, msg2],
			} )
			const thisBuffer = thisNest.buffer
			
			expect( JSON.stringify( OSCMessage.fromBuffer( thisBuffer ) ) ).toEqual( JSON.stringify( thisNest ) )
		} )
	} )
} )
