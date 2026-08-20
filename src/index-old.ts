/* eslint-disable @stylistic/curly-newline */
/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library */


import { makeTimeTag } from './encode'
import { OSCMessage } from './message'
import { OSCOptionsDefault, OSCArguments, OSCColor, OSCDecodeError, OSCEncodeError, OSCError, OSCOptions, OSCTimeTag, OSCKnownTypes, OSCTimeTagCastable } from './types'

export { OSCOptionsDefault }

export const NULL = '\u0000'

export class simpleOSC {
	/**
	 * Version of OSC supported
	 */
	oscVersion = '1.1'
	options : OSCOptions

	constructor( options : Partial<OSCOptions> = {} ) {
		this.options = { ...OSCOptionsDefault, ...options }
	}

	/**
	 * Types supported by implementation (single character un-separated)
	 */
	get typeList() {
		return OSCKnownTypes.join( '' )
	}

	/**
	 * Create a new OSC message
	 * @param address - address to send to
	 * @param args - arguments (or none) to send
	 * @returns OSCMessage of type 'message'
	 */
	newMessage( address : string, args : OSCArguments[] = [] ) {
		return OSCMessage.newMessage(
			address,
			args,
			this.options
		)
	}

	/**
	 * Create an OSC Bundle object
	 * 
	 * Special values for timetag
	 *  - undefined or false : now()
	 *  - true : [0,1] (immediate processing)
	 *  - '+###' : ### milliseconds in the future
	 * 
	 * @param msgs - OSCMessages or pre-encoded buffers to include in bundle
	 * @param timeTag - TimeTag castable object
	 * @returns OSCMessage of type bundle
	 */
	newBundle(
		msgs : Array<Buffer<ArrayBufferLike> | OSCMessage> = [],
		timeTag ? : OSCTimeTagCastable
	) {


		return OSCMessage.newBundle(
			msgs,
			timeTag,
			this.options
		)
	}

	/**
	 * Create new OSCMessage from buffer data
	 * @param b - Byte Buffer of data
	 * @returns OSCMessage of type bundle or message
	 */
	fromBuffer( b : Buffer<ArrayBufferLike> ) {
		return OSCMessage.fromBuffer( b, this.options )
	}

	/**
	 * Build an osc message in a chainable way.
	 * 
	 * Chainable methods available - for more complex messages, use buildMessage
	 * 
	 * ```javascript
	 * myMessage
	 *     .i(20)
	 *     .integer(20)
	 *     .f(1.0)
	 *     .float(1.0)
	 *     .s('hello')
	 *     .string('world')
	 *     .b(buffer)
	 *     .blob(buffer)
	 *     .any('most javascript types, with limitations')
	 *     .any(12.0) // added as integer (not float)
	 *     .any(12.2) // added as float
	 *     .any('a')  // added as string (not char)
	 *     .any(Symbol('a'))  // sent as string 'a'
	 *     .any(Infinity) // sent as bang (I)
	 * ```
	 * 
	 * To get a transmittable buffer, call `myMessage.buffer`
	 * 
	 * To get a human readable version of the buffer, call `myMessage.toString()`
	 * 
	 * @param address - address to send to
	 * @returns oscBuilder instance
	 * @example
	 * const myBuffer = oscLib.messageBuilder('/hello').integer(10).float(2.0).string('world').buffer
	 */
	messageBuilder( address : string ) {
		return new OSCBuilder( address, this.options )
	}

	/**
	 * Guess the OSC type from the supplied data.
	 * 
	 * Handles perfectly
	 *  - BigInt()
	 *  - Symbol()
	 *  - Buffer
	 *  - boolean true/false
	 *  - null
	 * 
	 * Handles with some inference
	 *  - Strings - single character strings are still strings, strings starting with a slash are addresses
	 *  - Numbers - 12 and 12.0 are integers, 12.2 is a float. Infinity (or beyond MAX_NUMBER) is a bang
	 *  - Arrays
	 *    - 2 element numeric arrays are assumed to be a time tag
	 *    - 4 element numeric arrays are assumed to be a color
	 * @param v - Any valid OSC type value
	 * @returns OSCArgument of correct type, with limitations
	 */
	autoType( v : OSCArguments['value'] ) {
		return autoType( v )
	}
}

/** @internal */
class OSCBuilder {
	#message : OSCMessage
	options  : OSCOptions

	constructor( address : string, options : OSCOptions ) {
		if ( typeof address !== 'string' || address.length === 0 ) {
			throw new OSCError( 'address required' )
		}
		this.options = options

		this.#message = OSCMessage.newMessage(
			address,
			[],
			this.options
		)
	}

	toString() {
		return printBuffer( this.buffer )
	}

	get buffer() {
		return this.#message.buffer
	}

	i( value : number ) {
		return this.integer( value )
	}

	integer( value : number ) {
		if ( typeof value !== 'number' || ! Number.isInteger( value ) ) {
			throw new OSCError( 'integer required' )
		}
		this.#message.args.push( { type : 'integer', value : value } )
		return this
	}

	f( value : number ) {
		return this.float( value )
	}

	float( value : number ) {
		if ( typeof value !== 'number' ) {
			throw new OSCError( 'float required' )
		}
		this.#message.args.push( { type : 'float', value : value } )
		return this
	}

	s( value : string ) {
		return this.string( value )
	}

	string( value : string ) {
		if ( typeof value !== 'string' ) {
			throw new OSCError( 'string required' )
		}
		this.#message.args.push( { type : 'string', value : value } )
		return this
	}

	b( value : Buffer ) {
		return this.blob( value )
	}

	blob( value : Buffer ) {
		if ( ! Buffer.isBuffer( value ) ) {
			throw new OSCError( 'buffer required' )
		}
		this.#message.args.push( { type : 'blob', value : value } )
		return this
	}

	any( value : OSCArguments['value'] ) {
		this.#message.args.push( autoType( value ) )
		return this
	}
}

const autoType = (
	v : OSCArguments['value']
) : OSCArguments => {
	if ( typeof v === 'boolean' ) {
		return { type : v ? 'true' : 'false', value : null }
	}

	if ( v === null ) {
		return { type : 'null', value : null }
	}

	if ( typeof v === 'symbol' ) {
		return { type : 'symbol', value : v }
	}

	if ( typeof v === 'bigint' ) {
		return { type : 'bigint', value : v }
	}
	
	if ( typeof v === 'number' && ( v === Number.POSITIVE_INFINITY || v === Number.NEGATIVE_INFINITY || v === Infinity ) ) {
		return { type : 'bang', value : null }
	}

	if ( typeof v === 'number' && Number.isInteger( v ) ) {
		return { type : 'integer', value : v }
	}

	if ( typeof v === 'number' ) {
		return { type : 'float', value : v }
	}

	if ( typeof v === 'string' && v.startsWith( '/' ) && ( /^[\w!"$%&'()+-./:;<=>@^`|~]*$/ ).test( v ) ) {
		return { type : 'address', value : v }
	}

	if ( typeof v === 'string' ) {
		return { type : 'string', value : v }
	}

	if ( Buffer.isBuffer( v ) ) {
		return { type : 'blob', value : v }
	}

	if ( Array.isArray( v ) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number' ) {
		return { type : 'timetag', value : v as OSCTimeTag }
	}

	if ( Array.isArray( v ) && v.length === 4 ) {
		return { type : 'color', value : v as OSCColor }
	}

	throw new OSCEncodeError( `autoTyping unavailable for "${typeof v}"` )

}

/**
 * Convert a time tag to a native Data object
 * @param tag - OSC time tag array
 * @returns Native Date object
 */
export const dateFromTimeTag = ( tag : OSCTimeTag ) => {
	if ( !Array.isArray( tag ) || tag.length !== 2 || typeof tag[0] !== 'number' || typeof tag[1] !== 'number' ) {
		throw new OSCDecodeError( 'timetag array format incorrect' )
	}

	const seconds    = tag[0] - UNIX_EPOCH
	const fractional = parseFloat( tag[1].toString() ) / TWO_POW_32
	const returnDate = new Date()

	returnDate.setTime( ( seconds * 1000 ) + ( fractional * 1000 ) )

	return returnDate
}

/**
 * Compare TimeTag to "now" in milliseconds
 * @param end - OSC Time tag to compare
 * @param now - "now" value
 * @returns milliseconds as number
 */
export const diffTimeTagMS = ( end : OSCTimeTag, now ? : OSCTimeTag ) => {
	return diffTimeTag( end, now ) * 1000
}

/**
 * Compare TimeTag to "now" in seconds
 * @param end - OSC Time tag to compare
 * @param now - "now" value
 * @returns seconds as number (float)
 */
export const diffTimeTag = ( end : OSCTimeTag, now ? : OSCTimeTag ) => {
	const nowTag = ( typeof now === 'undefined' ) ? makeTimeTag() : now

	const secs = nowTag[0] - end[0]
	const frac = nowTag[1] - end[1]
	return ( frac / TWO_POW_32 ) + secs
}

/**
 * Format a buffer for console output
 * @param buffer_in - buffer of data
 * @param param1 - Options
 * @returns string representation
 */
export const printBuffer = (
	buffer_in : Buffer,
	{
		replacementCharacter = '\u2022',
		fourByteMarkerCharacter = '\xA6',
		skipSize = false,
	} = {}
) => {
	if ( ! Buffer.isBuffer( buffer_in ) ) {
		throw new TypeError( 'buffer expected' )
	}

	let consumeBuffer = buffer_in
	const printer = []

	if ( skipSize === false ) {
		printer.push( `${`[${buffer_in.length}]`.padEnd( 6, ' ' )}:: ${fourByteMarkerCharacter}` )
	} else {
		printer.push( fourByteMarkerCharacter )
	}

	while ( consumeBuffer.length !== 0 ) {
		const thisChunk = consumeBuffer.subarray( 0, 4 )
		const thisChunkUTF = thisChunk.toString( 'utf8' )
		// eslint-disable-next-line no-control-regex
		if ( /[\x01-\x09\x0B-\x1F\x7F-\x9F]/.test( thisChunkUTF ) ) {
			printer.push( '[..]' )
		} else {
			
			printer.push( thisChunk
				.toString( 'utf8' )
				// eslint-disable-next-line no-control-regex
				.replaceAll( /[^\u0000\x20-\x7E]/g, '¿' )
				.replaceAll( '\u0000', replacementCharacter )
			)
		}
		consumeBuffer = consumeBuffer.subarray( 4 )
		printer.push( fourByteMarkerCharacter )
	}
	return printer.join( '' )
}

const TWO_POW_32 = 4294967296
const UNIX_EPOCH = 2208988800