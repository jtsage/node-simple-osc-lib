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

export type callbackProcessor = ( message : OSCMessageInterface ) => unknown

export type OSCColor   = [ number, number, number, number ]
export type OSCMidi    = [ number, number, number, number ]
export type OSCTimeTag = [ number, number ]
export type OSCTimeTagDelta = `+${number}`

export const OSCTimeTagImmediate : OSCTimeTag = [0, 1] // "Process Bundle Immediately"

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

const OSCArgumentStringMap = Object.freeze( {
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
const OSCArgumentCharMap = Object.freeze( {
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

type OSCArgumentsHuman = keyof typeof OSCArgumentStringMap
export type OSCArgumentsShort = keyof typeof OSCArgumentCharMap

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