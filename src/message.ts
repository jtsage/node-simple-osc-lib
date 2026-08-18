/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library *
 *           OSC Message Class */

import { encodeBuffer, makeTimeTag } from './encode'
import { OSCOptionsDefault, OSCArguments, OSCArgumentsShort, OSCDecodeError, OSCError, OSCMessageInterface, OSCOptions, OSCTimeTag, OSCTypeListTypes, OSCMessageTypeBundle, OSCMessageTypeMessage, OSCMatchResult, OSCTimeTagCastable, OSCMessageInterfaceMessage, OSCMessageInterfaceBundle } from './types'
import { decodeBuffer } from './decode'

// MARK: OSCMessage Class
/**
 * OSCMessage Class
 * 
 * Main type for OSC Messages
 */
export class OSCMessage implements OSCMessageInterface {
	type    : OSCMessageTypeBundle | OSCMessageTypeMessage
	args    : OSCArguments[] = []
	msgs    : Array<OSCMessageInterface | Buffer> = []
	/** @internal */
	options : OSCOptions

	/**
	 * @internal 
	 */
	constructor(
		key : symbol,
		type : OSCMessageTypeBundle | OSCMessageTypeMessage,
		args : OSCArguments[] = [],
		msgs : Array<OSCMessageInterface | Buffer> = [],
		options : Partial<OSCOptions> = {}
	) {
		if ( key !== PRIVATE_KEY ) {
			throw new OSCError( 'must use fromBuffer, newMessage, or newBundle' )
		}
		this.options = { ...OSCOptionsDefault, ...options }
		this.type = type
		this.args = args
		this.msgs = msgs
	}

	/**
	 * True if message is a bundle type
	 */
	isBundle() : this is { type : OSCMessageTypeBundle } {
		return this.type.type === 'bundle'
	}

	/**
	 * True if message is a regular (not bundle) type
	 */
	isSingle() : this is { type : OSCMessageTypeMessage } {
		return this.type.type === 'message'
	}

	/**
	 * Data buffer representation of the message
	 */
	get buffer() : Buffer<ArrayBufferLike> {
		return buildMessage( this )
	}

	/**
	 * Match an address with the give OSC Pattern
	 * 
	 * - ‘?’ in the OSC Address Pattern matches any single character
	 * - ‘*’ in the OSC Address Pattern matches any sequence of zero or more characters
	 * - A string of characters in square brackets (e.g., “[string]”) in the OSC Address Pattern matches any character in the string.
	 * - Use "[a-z]" to match a range of characters
	 * - A comma-separated list of strings enclosed in curly braces (e.g., “\{foo,bar\}”) in the OSC Address Pattern matches any of the strings in the list.
	 * - Any other character in an OSC Address Pattern can match only the same character.
	 * @param pattern - Pattern to match (or compiled RegExp)
	 * @returns Array of zero or more matches, with capture groups
	 */
	match( pattern : string | RegExp ) {
		return matchMessages( this, pattern )
	}

	/**
	 * @internal 
	 */
	toJSON() {
		if ( this.isBundle() ) {
			return {
				messages : this.msgs,
				timeTag  : this.type.timeTag,
				type     : 'bundle',
			}
		} else if ( this.isSingle() ) {
			return {
				address  : this.type.address,
				elements : this.args,
				type     : 'message',
			}
		}
	}

	/**
	 * Read an OSC message from a data buffer
	 * @param b - data buffer
	 * @param options - OSCOptions overrides
	 * @returns OSCMessage of either a message or bundle type
	 */
	static fromBuffer( b : Buffer<ArrayBufferLike>, options : Partial<OSCOptions> = {} ) {
		return readPacket( b, options )
	}
	
	/**
	 * Create new OSC message of type message (not bundle)
	 * @param address - non-empty string address
	 * @param args - OSCArguments array
	 * @param options - OSCOptions overrides
	 * @returns OSCMessage of type message
	 */
	static newMessage(
		address : string,
		args    : OSCArguments[] = [],
		options : Partial<OSCOptions> = {}
	) : OSCMessageInterfaceMessage {
		if ( typeof address !== 'string' || address === '' ) {
			throw new OSCError( 'string address required' )
		}

		if ( ! Array.isArray( args ) ) {
			throw new OSCError( 'args must be an array if supplied' )
		}

		return new OSCMessage(
			PRIVATE_KEY,
			{
				type    : 'message',
				address : address,
			},
			args,
			[],
			options
		) as OSCMessageInterfaceMessage
	}

	/**
	 * Create new OSC bundle
	 * 
	 * Special values for timetag
	 *  - undefined or false : now()
	 *  - true : [0,1] (immediate processing)
	 *  - '+###' : ### milliseconds in the future
	 * @param msgs - Array of OSCMessageInterface or Buffer
	 * @param timeTag - Value castable to OSCTimeTag
	 * @param options - OSCOptions overrides
	 * @returns OSC Message of type bundle
	 */
	static newBundle(
		msgs    : Array<OSCMessageInterface | Buffer> = [],
		timeTag : OSCTimeTagCastable = false,
		options : Partial<OSCOptions> = {}
	) : OSCMessageInterfaceBundle {

		return new OSCMessage(
			PRIVATE_KEY,
			{
				type    : 'bundle',
				timeTag : makeTimeTag( timeTag ),
			},
			[],
			msgs,
			options
		) as OSCMessageInterfaceBundle
	}
	
}

// MARK: matchMessages
const matchMessages = ( msg : OSCMessageInterface, pattern : string | RegExp ) : OSCMatchResult[] => {
	const returnArray : OSCMatchResult[] = []
	let regExpCompiled : RegExp

	if ( pattern instanceof RegExp ) {
		regExpCompiled = pattern
	} else if ( typeof pattern === 'string' && pattern.length !== 0 ) {
		const regExpPattern = pattern
			.replaceAll( '.', '\\.' )
			.replaceAll( /{(.+?)}/g, ( _, group1 ) => `(${group1.replaceAll( ',', '|' )})` )
			.replaceAll( /\[(.+?)]/g, '([$1])' )
			.replaceAll( '?', '([^/])' )
			.replaceAll( '*', '([^/]*)' )
			.replaceAll( '\\', '\\\\' )

		regExpCompiled = new RegExp( `^${regExpPattern}$` )
	} else {
		throw new OSCError( 'must supply a pattern' )
	}

	if ( msg.isSingle() ) {
		const results = matchMessage( msg, regExpCompiled )
		if ( results !== null ) {
			returnArray.push( results )
		}
	} else if ( msg.isBundle() ) {
		returnArray.push( ...matchBundle( msg, regExpCompiled ) )
	}

	return returnArray
}

// MARK: matchBundle
const matchBundle = ( msg : OSCMessageInterfaceBundle, compiledPattern : RegExp ) : OSCMatchResult[] => {
	const returnArray : OSCMatchResult[] = []

	for ( const message of msg.msgs ) {
		if ( Buffer.isBuffer( message ) ) {
			continue
		} else {
			returnArray.push( ...matchMessages( message, compiledPattern ) )
		}
	}
	return returnArray
}

// MARK: matchMessage
const matchMessage = ( msg : OSCMessageInterfaceMessage, compiledPattern : RegExp ) : null | OSCMatchResult => {
	const address = msg.type.address
	const matches = compiledPattern.exec( address )

	return ( matches === null ) ?
		null :
		{
			address : matches[0],
			matches : matches.slice( 1 ),
		}
}

// MARK: buildMessage
const buildMessage = ( msg : OSCMessageInterface ) : Buffer<ArrayBufferLike> => {
	if ( msg.isSingle() ) {
		return buildSinglet( msg )
	} else if ( msg.isBundle() ) {
		return buildBundle( msg )
	}
	throw new OSCError( 'unknown message type for builder' )
}

// MARK: buildBundle
const buildBundle = ( msg : OSCMessageInterfaceBundle  ) => {
	if ( msg.type.type !== 'bundle' ) {
		throw new OSCError( 'internal error - non bundle built as bundle' )
	}

	if ( !Array.isArray( msg.msgs ) || msg.msgs.length === 0 ) {
		throw new OSCError( 'unable to send empty bundles' )
	}

	const sendBuffer : Buffer<ArrayBufferLike>[] = [
		Buffer.from( '#bundle\u0000' ),
		encodeBuffer( { type : 'timetag', value : msg.type.timeTag }, msg.options ).buffer
	]

	for ( const message of msg.msgs ) {
		if ( Buffer.isBuffer( message ) ) { // support raw pre-encoded buffers
			sendBuffer.push(
				encInt( message.length ),
				message
			)
		} else if ( ! ( message instanceof OSCMessage ) ) {
			throw new OSCError( 'non OSC message cannot be part of bundle' )
		} else {
			const built = buildMessage( message )
			sendBuffer.push(
				encInt( built.length ),
				built
			)
		}
	}

	return Buffer.concat( sendBuffer )
}

// MARK: buildSinglet
const buildSinglet = ( msg : OSCMessageInterfaceMessage ) => {
	if ( msg.type.type !== 'message' ) {
		throw new OSCError( 'internal error - non message built as message' )
	}

	const buffer_address = encodeBuffer(
		{ type : 'address', value : msg.type.address},
		msg.options
	)
	
	if ( !Array.isArray( msg.args ) ) {
		throw new OSCError( 'not-array args given - not supported ' )
	}

	if ( typeof msg.args === 'undefined' || msg.args.length === 0 ) {
		return buffer_address.buffer
	}
	

	const argListArray : string[] = []
	const argBuffers   : Buffer<ArrayBufferLike>[] = []
	
	for ( const arg of msg.args ) {
		const value = buildArgument( arg, msg.options )
		argBuffers.push( value.buffer )
		argListArray.push( ...value.typeList )
	}

	const typeListBuffer = encodeBuffer(
		{
			type  : 'string',
			value : `,${argListArray.join( '' )}`,
		},
		msg.options
	)

	return Buffer.concat( [
		buffer_address.buffer,
		typeListBuffer.buffer,
		Buffer.concat( argBuffers )
	] )
}

// MARK: buildArgument (r)
const buildArgument = ( arg : OSCArguments, options : OSCOptions ) => {
	if ( arg.type !== 'array' ) {
		return encodeBuffer( arg, options )
	}
	
	const nestBuffers : Buffer<ArrayBufferLike>[] = []
	const typeList : OSCTypeListTypes[] = ['[']

	for ( const nestArg of arg.value ) {
		const nest = buildArgument( nestArg, options )
		typeList.push( ...nest.typeList )
		nestBuffers.push( nest.buffer )
	}
	typeList.push( ']' )
	
	return {
		arg      : arg,
		buffer   : Buffer.concat( nestBuffers ),
		typeList : typeList,
	}
}

// MARK: readPacket (r)
const readPacket = ( buffer_in : Buffer<ArrayBufferLike>, options ? : Partial<OSCOptions> ) => {
	const theseOptions = { ...OSCOptionsDefault, ...options }

	if ( ! Buffer.isBuffer( buffer_in ) || buffer_in.length === 0 ) {
		throw new OSCError( 'buffer expected' )
	}

	if ( theseOptions.strictMode && buffer_in.length % 4 !== 0 ) {
		throw new OSCDecodeError( 'buffer is not a 4-byte multiple' )
	}

	if ( buffer_in.subarray( 0, 7 ).toString( 'utf8' ) === '#bundle' ) {
		return readBundle( buffer_in, theseOptions )
	}
	return readMessage( buffer_in, theseOptions )
}

// MARK: readBundle
const readBundle = ( buffer_in : Buffer<ArrayBufferLike>, options : OSCOptions ) => {
	const timeTag = decodeBuffer( 't', buffer_in.subarray( 8 ), options )
	const msgs : OSCMessage[] = []


	let buffer_remain = timeTag.remain

	while ( buffer_remain.length !== 0 ) {
		const nextMessageSize = decodeBuffer( 'i', buffer_remain, options )
		const nextMessage     = nextMessageSize.remain.subarray( 0, nextMessageSize.arg.value as number )

		msgs.push( readPacket( nextMessage, options ) )

		buffer_remain = buffer_remain.subarray( nextMessageSize.arg.value as number + 4 )
	}

	return new OSCMessage(
		PRIVATE_KEY,
		{
			type    : 'bundle',
			timeTag : timeTag.arg.value as OSCTimeTag,
		},
		[],
		msgs,
		options
	)
}

// MARK: readMessage
const readMessage = ( buffer_in : Buffer<ArrayBufferLike>, options : OSCOptions ) => {
	const thisAddress_array = decodeBuffer( 'a', buffer_in, options )

	if ( thisAddress_array.remain.length === 0 ) {
		const returnMessage = new OSCMessage(
			PRIVATE_KEY,
			{
				type    : 'message',
				address : thisAddress_array.arg.value as string,
			},
			[],
			[],
			options
		)

		return returnMessage
	}

	const argListArray  = decodeBuffer( 's', thisAddress_array.remain, options )
	const argListString = argListArray.arg.value as string

	const arrayOpenMarks  = argListString.split( '[' ).length - 1
	const arrayCloseMarks = argListString.split( ']' ).length - 1

	if ( arrayCloseMarks !== arrayOpenMarks ) {
		throw new OSCDecodeError( 'mismatched array nesting' )
	}

	let buffer_remain = argListArray.remain

	const arrayStack : OSCArguments[][] = [[]]

	for ( const [i, thisItem] of [...argListString].entries() ) {
		if ( i === 0 ) {
			if ( thisItem === ',' ) {
				continue
			}
			if ( options.strictMode ) {
				throw new OSCDecodeError( 'argument list requires leading comma' )
			}
		}
		
		if ( thisItem === '[' ) {
			arrayStack.push( [] )
			continue
		}
		if ( thisItem === ']' ) {
			const built = arrayStack.pop()

			const stackItem = arrayStack[arrayStack.length - 1]

			if ( typeof built !== 'undefined' ) {
				stackItem!.push( {
					type  : 'array',
					value : built,
				} )
			}
			continue
		}

		const decodedBufferChunk = decodeBuffer( thisItem as OSCArgumentsShort, buffer_remain, options )
		const stackItem     = arrayStack[arrayStack.length - 1]

		stackItem!.push( decodedBufferChunk.arg )

		buffer_remain = decodedBufferChunk.remain
	}

	const returnMessage = new OSCMessage(
		PRIVATE_KEY,
		{
			type    : 'message',
			address : thisAddress_array.arg.value as string,
		},
		arrayStack[0],
		[],
		options
	)

	return returnMessage
}

const encInt = ( value : number ) => {
	const buffer_out = Buffer.alloc( 4 )
	buffer_out.writeInt32BE( value )
	return buffer_out
}

const PRIVATE_KEY = Symbol( 'PrivateConstructorKey' )