/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library
 *           OSC Message Type */

import { OSCPacket } from '.'
import { OSCMessage } from './message'
import * as type from './type'
import { OSCMatchResult } from './type'

export type OSCBundleMessage = OSCMessage | OSCBundle | Buffer<ArrayBufferLike>

export class OSCBundle {
	#timeTag  ! : type.OSCTimeTag
	#messages   : OSCBundleMessage[] = new BundleStackArray()

	/**
	 * Create an OSC bundle
	 * 
	 * TimeTag options:
	 * - null or false : Current date-time
	 * - true : Immediate execution value
	 * - number : Number of seconds since Epoch
	 * - Date : Specific date-time
	 * - '+##' : Add ## milliseconds to current date-time
	 * - Array or OSCTimeTag instance
	 * @param messages - array of OSCMessage's (or bundles)
	 * @param timeTag - option time tag
	 */
	constructor(
		messages  ? : OSCBundleMessage[],
		timeTag : type.OSCTimeTagCastable = false
	) {
		this.timeTag = timeTag
		if ( Array.isArray( messages ) ) {
			this.messages = messages
		}
	}
	
	isMessage() : this is OSCMessage { return false }
	isBundle()  : this is OSCBundle { return true }

	/** TimeTag */
	get timeTag() : type.OSCTimeTag { return this.#timeTag }
	set timeTag( v : type.OSCTimeTagCastable ) { this.#timeTag = type.OSCTimeTag.fromValue( v ) }

	/** Array of OSCMessage or OSCBundle */
	get messages() { return this.#messages }
	set messages( msgs : OSCBundleMessage[] ) {
		this.#messages.length = 0
		this.#messages.push( ...msgs )
	}

	/** For JSON.stringify() */
	toJSON() : type.OSCBundleObject {
		return {
			messages : this.#messages
				.filter( ( item ) => item instanceof OSCBundle || item instanceof OSCMessage )
				.map( ( item ) => item.toJSON() ),
			timeTag  : this.#timeTag.toJSON(),
			type     : 'bundle',
		}
	}

	/**
	 * 
	 * @param pattern - OSC style match pattern
	 * @returns OSCMatchResult array, nulls removed
	 */
	match( pattern : string | RegExp ) : OSCMatchResult[] {
		return this.#messages
			.filter( ( msg ) => msg instanceof OSCMessage || msg instanceof OSCBundle )
			.flatMap( ( msg ) => msg.match( pattern ) )
			.filter( ( result ) => result !== null )
	}

	static #len2buf( value : number ) {
		const buffer_out = Buffer.alloc( 4 )
		buffer_out.writeInt32BE( value )
		return buffer_out
	}

	/** Buffer representation of bundle */
	get buffer() {
		if ( this.#messages.length === 0 ) {
			throw new type.OSCTypeError( 'bundles with no messages are invalid' )
		}
		const buffers : Buffer<ArrayBufferLike>[] = [
			Buffer.from( '#bundle\u0000' ),
			this.#timeTag.buffer
		]

		for ( const message of this.#messages ) {
			if ( Buffer.isBuffer( message ) ) { // support raw pre-encoded buffers
				buffers.push(
					OSCBundle.#len2buf( message.length ),
					message
				)
			} else {
				const built = message.buffer
				buffers.push(
					OSCBundle.#len2buf( built.length ),
					built
				)
			}
		}
		return Buffer.concat( buffers )
	}

	/**
	 * Create bundle from buffer data
	 * @param buffer_in - buffer data
	 * @param strict - force strict mode checks (4-byte buffers)
	 * @returns OSCBundle
	 */
	static fromBuffer( buffer_in : Buffer<ArrayBufferLike>, strict = false ) {
		if ( ! Buffer.isBuffer( buffer_in ) || buffer_in.length === 0 ) {
			throw new type.OSCDecodeError( 'buffer expected' )
		}

		if ( strict && buffer_in.length % 4 !== 0 ) {
			throw new type.OSCDecodeError( 'buffer is not a 4-byte multiple' )
		}
		
		if ( buffer_in.subarray( 0, 7 ).toString( 'utf8' ) !== '#bundle' ) {
			throw new type.OSCDecodeError( 'buffer is not a bundle' )
		}

		const timeTag = type.OSCTimeTag.fromBuffer( buffer_in.subarray( 8, 16 ) )
		const msgs : OSCBundleMessage[] = []
	
		let buffer_remain = buffer_in.subarray( 16 )
	
		while ( buffer_remain.length !== 0 ) {
			const nextMessageSize = type.OSCTypeInteger.fromBuffer( buffer_remain.subarray( 0, 4 ) )
			const nextMessage     = buffer_remain.subarray( 4, nextMessageSize.value + 4 )
	
			msgs.push( OSCPacket.fromBuffer( nextMessage ) )
	
			buffer_remain = buffer_remain.subarray( nextMessageSize.value + 4 )
		}

		if ( msgs.length === 0 ) {
			throw new type.OSCTypeError( 'bundles with no messages are invalid' )
		}

		return new OSCBundle(
			msgs,
			timeTag.value
		)
	}
}

// MARK: BundleStackArray
class BundleStackArray extends Array {
	push( ...args : OSCBundleMessage[] ) {
		for ( const v of args ) {
			if ( v instanceof OSCBundle || v instanceof OSCMessage || Buffer.isBuffer( v ) ) {
				super.push( v )
			} else {
				throw new type.OSCTypeError( 'unknown message type' )
			}
		}
		return this.length
	}

	unshift( ...args : OSCBundleMessage[] ) {
		for ( const v of args ) {
			if ( v instanceof OSCBundle || v instanceof OSCMessage || Buffer.isBuffer( v ) ) {
				super.unshift( v )
			} else {
				throw new type.OSCTypeError( 'unknown message type' )
			}
		}
		return this.length
	}
}