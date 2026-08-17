/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Simple OSC Communication Library *
 *           Shared Types */

/**
 * Options for oscLIb
 * 
 * @param asciiOnly - Prevent non-ASCII characters in strings
 * @param coerceStrings - For string type, coerce input if non-string found.
 * @param preprocessor -   osc-message processor
 * @param strictAddress -  Use strict addresses (strict mode plus require leading slash)
 * @param strictMode -     Use strict mode elsewhere
 * 
 * @public
 */
export const OSCOptionsDefault : OSCOptions = {
	asciiOnly      : false,
	coerceStrings  : false,
	strictAddress  : false,
	strictMode     : false,
	stringAsSymbol : false,
}

/**
 * OSC Color - 4 element numeric array (0-255) (4-byte)
 */
export type OSCColor   = [ number, number, number, number ]

/**
 * OSC Midi - 4 Byte
 */
export type OSCMidi    = [ number, number, number, number ]

/**
 * OSC Time Tag - 8 byte.
 */
export type OSCTimeTag = [ number, number ]

/**
 * Time Tag Delta type - e.g. '+50' for 50ms in the future
 */
export type OSCTimeTagDelta = `+${number}`

/**
 * Special time tag, means "process immediately"
 */
export const OSCTimeTagImmediate : OSCTimeTag = [0, 1]

export type OSCArguments =
	| { type : 'address';  value : string }
	| { type : 'array';    value : OSCArguments[] }
	| { type : 'bang';     value : null }
	| { type : 'bigint';   value : bigint }
	| { type : 'blob';     value : Buffer }
	| { type : 'char';     value : string }
	| { type : 'color';    value : OSCColor }
	| { type : 'double';   value : number }
	| { type : 'false';    value : null }
	| { type : 'float';    value : number }
	| { type : 'integer';  value : number }
	| { type : 'midi';     value : OSCMidi }
	| { type : 'null';     value : null }
	| { type : 'string';   value : string }
	| { type : 'symbol';   value : string | symbol }
	| { type : 'timetag';  value : OSCTimeTag }
	| { type : 'true';     value : null }

export const OSCArgumentStringMap = Object.freeze( {
	'address'  : 'a',
	'array'    : null,
	'bang'     : 'I',
	'bigint'   : 'h',
	'blob'     : 'b',
	'char'     : 'c',
	'color'    : 'r',
	'double'   : 'd',
	'false'    : 'F',
	'float'    : 'f',
	'integer'  : 'i',
	'midi'     : 'm',
	'null'     : 'N',
	'string'   : 's',
	'symbol'   : 'S',
	'timetag'  : 't',
	'true'     : 'T',
} )

// Duplicate to make typescript behave. Omit array types '[' and ']'
export const OSCArgumentCharMap = Object.freeze( {
	a : 'address',
	b : 'blob',
	c : 'char',
	d : 'double',
	F : 'false',
	f : 'float',
	h : 'bigint',
	I : 'bang',
	i : 'integer',
	m : 'midi',
	N : 'null',
	r : 'color',
	s : 'string',
	S : 'symbol',
	t : 'timetag',
	T : 'true',
} )

/** @internal */
export const OSCKnownTypes = Object.keys( OSCArgumentCharMap ).sort()

export const OSCArgumentCharToString = ( index : OSCArgumentsShort ) : OSCArgumentsHuman => {
	const value = OSCArgumentCharMap[index]
	if ( typeof value !== 'undefined' ) {
		return value
	}
	throw new OSCError( 'type does not exist' )
}

export const OSCArgumentStringToChar = ( index : OSCArgumentsHuman ) : OSCArgumentsShort => {
	const value = OSCArgumentStringMap[index]
	if ( typeof value !== 'undefined' && value !== null ) {
		return value
	}
	throw new OSCError( 'type does not exist' )
}

export type OSCArgumentsHuman = keyof typeof OSCArgumentStringMap
export type OSCArgumentsShort = keyof typeof OSCArgumentCharMap

/** @internal */
export type OSCTypeListTypes = OSCArgumentsShort | ']' | '['

export type BufferDecodeResult = {
	arg    : OSCArguments,
	remain : Buffer<ArrayBufferLike>
}

export type BufferEncodeResult = {
	arg      : OSCArguments,
	typeList : OSCTypeListTypes[]
	buffer   : Buffer<ArrayBufferLike>
}

export type OSCMatchResult = {
	address : string,
	matches : string[]
}

export class OSCError extends Error {
	constructor( message : string, opts ? : ErrorOptions ) {
		super( message, opts )
	}
}

export class OSCDecodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) {
		super( message, opts )
	}
}

export class OSCEncodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) {
		super( message, opts )
	}
}

export type OSCOptions = {
	asciiOnly      : boolean;
	coerceStrings  : boolean;
	strictAddress  : boolean;
	strictMode     : boolean;
	stringAsSymbol : boolean;
}

export type OSCMessageTypeMessage = {
	type    : 'message',
	address : string
}

export type OSCMessageTypeBundle = {
	type    : 'bundle',
	timeTag : OSCTimeTag
}

export type OSCMessageType =
	| OSCMessageTypeMessage
	| OSCMessageTypeBundle

export type OSCMessageOptions = {
	address : string
	args    : OSCArguments[]
}

export type OSCBundleOptions = {
	timeTag ? : OSCTimeTag | number | Date | OSCTimeTagDelta | undefined
	msgs      : Array<OSCMessageInterface | Buffer>
}

export interface OSCMessageInterface {
	type    : OSCMessageType
	args    : OSCArguments[]
	msgs    : Array<OSCMessageInterface | Buffer>
	options : OSCOptions

	isBundle : boolean
	isSingle : boolean
	buffer   : Buffer<ArrayBufferLike>
}