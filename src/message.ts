import { encodeBuffer, makeTimeTag } from './encode'
import { OSCOptionsDefault, OSCArguments, OSCArgumentsShort, OSCBundleOptions, OSCDecodeError, OSCError, OSCMessageInterface, OSCMessageOptions, OSCMessageType, OSCOptions, OSCTimeTag, OSCTypeListTypes, OSCMessageTypeBundle, OSCMessageTypeMessage } from './types'
import { decodeBuffer } from './decode'

// MARK: OSCMessage Class
export class OSCMessage implements OSCMessageInterface {
	type    : OSCMessageType
	args    : OSCArguments[] = []
	msgs    : Array<OSCMessageInterface | Buffer> = []
	options : OSCOptions

	constructor(
		key : symbol,
		type : OSCMessageType,
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

	get isBundle() {
		return this.type.type === 'bundle'
	}

	get isSingle() {
		return this.type.type === 'message'
	}

	get buffer() : Buffer<ArrayBufferLike> {
		return buildMessage( this )
	}

	toJSON() {
		if ( this.isBundle ) {
			const thisType = this.type as OSCMessageTypeBundle
			return {
				messages : this.msgs,
				timeTag  : thisType.timeTag,
				type     : 'bundle',
			}
		}

		const thisType = this.type as OSCMessageTypeMessage
		return {
			address  : thisType.address,
			elements : this.args,
			type     : 'message',
		}
		
	}

	static fromBuffer( b : Buffer<ArrayBufferLike>, options : Partial<OSCOptions> = {} ) {
		return readPacket( b, options )
	}
	
	static newMessage( message : OSCMessageOptions, options : Partial<OSCOptions> = {} ) {
		if ( typeof message.address !== 'string' || message.address === '' ) {
			throw new OSCError( 'string address required' )
		}

		if ( ! ( typeof message.args === 'undefined' || Array.isArray( message.args ) ) ) {
			throw new OSCError( 'args must be an array if supplied' )
		}

		return new OSCMessage(
			PRIVATE_KEY,
			{
				type    : 'message',
				address : message.address,
			},
			message.args ?? [],
			[],
			options
		)
	}

	static newBundle( message : OSCBundleOptions, options : Partial<OSCOptions> = {} ) {
		return new OSCMessage(
			PRIVATE_KEY,
			{
				type    : 'bundle',
				timeTag : makeTimeTag( message.timeTag ),
			},
			[],
			message.msgs ?? [],
			options
		)
	}
	
}

// MARK: buildMessage
const buildMessage = ( msg : OSCMessageInterface ) : Buffer<ArrayBufferLike> => {
	if ( msg.isSingle ) {
		return buildSinglet( msg )
	} else if ( msg.isBundle ) {
		return buildBundle( msg )
	}
	throw new OSCError( 'unknown message type for builder' )
}

// MARK: buildBundle
const buildBundle = ( msg : OSCMessageInterface  ) => {
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
const buildSinglet = ( msg : OSCMessageInterface ) => {
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
		// const thisItem = argListArray[i]
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