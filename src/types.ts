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

/** OSC Color - 4 element numeric array (0-255) (4-byte) */
export type OSCColor   = [ number, number, number, number ]

/** OSC Midi - 4 Byte */
export type OSCMidi    = [ number, number, number, number ]

/** OSC Time Tag - 8 byte. */
export type OSCTimeTag = [ number, number ]

/** Time Tag Delta type - e.g. '+50' for 50ms in the future */
export type OSCTimeTagDelta = `+${number}`

/** List of types castable to OSCTimeTag by makeTimeTag */
export type OSCTimeTagCastable = OSCTimeTag | number | Date | OSCTimeTagDelta | undefined | boolean

/** Supported OSC arguments */
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

/** Map human name to OSC argument character */
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

/** Map OSC character type to human name */
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

/** @internal */
export const OSCArgumentCharToString = ( index : OSCArgumentsShort ) : OSCArgumentsHuman => {
	const value = OSCArgumentCharMap[index]
	if ( typeof value !== 'undefined' ) {
		return value
	}
	throw new OSCError( 'type does not exist' )
}

/** @internal */
export const OSCArgumentStringToChar = ( index : OSCArgumentsHuman ) : OSCArgumentsShort => {
	const value = OSCArgumentStringMap[index]
	if ( typeof value !== 'undefined' && value !== null ) {
		return value
	}
	throw new OSCError( 'type does not exist' )
}

/** Name of OSC arguments, human readable */
export type OSCArgumentsHuman = keyof typeof OSCArgumentStringMap

/** Name of OSC arguments, single character */
export type OSCArgumentsShort = keyof typeof OSCArgumentCharMap

/** @internal */
export type OSCTypeListTypes = OSCArgumentsShort | ']' | '['

/** Result of decodeBuffer operations */
export type BufferDecodeResult = {
	arg    : OSCArguments,
	remain : Buffer<ArrayBufferLike>
}

/** Result of encodeBuffer operations. Original arg. */
export type BufferEncodeResult = {
	arg      : OSCArguments,
	typeList : OSCTypeListTypes[]
	buffer   : Buffer<ArrayBufferLike>
}

/** Positive result of OSC Address match */
export type OSCMatchResult = {
	address : string,
	matches : string[]
}

/** General OSC Error */
export class OSCError extends Error {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}

/** Error encountered when trying to encode buffer data */
export class OSCDecodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}

/** Error encountered when trying to decode buffer data */
export class OSCEncodeError extends TypeError {
	constructor( message : string, opts ? : ErrorOptions ) { super( message, opts ) }
}

/** Options for OSC Operations */
export type OSCOptions = {
	asciiOnly      : boolean;
	coerceStrings  : boolean;
	strictAddress  : boolean;
	strictMode     : boolean;
	stringAsSymbol : boolean;
}

/** Message Type Message */
export type OSCMessageTypeMessage = {
	type    : 'message',
	address : string
}

/** Bundle Type Message */
export type OSCMessageTypeBundle = {
	type    : 'bundle',
	timeTag : OSCTimeTag
}

/** Narrowed Message Type : Message */
export interface OSCMessageInterfaceMessage extends OSCMessageInterface {
	type : OSCMessageTypeMessage
}

/** Narrowed Message Type : Bundle */
export interface OSCMessageInterfaceBundle extends OSCMessageInterface {
	type : OSCMessageTypeBundle
}

/** OSC Message interface */
export interface OSCMessageInterface {
	type    : OSCMessageTypeBundle | OSCMessageTypeMessage
	args    : OSCArguments[]
	msgs    : Array<OSCMessageInterface | Buffer>
	options : OSCOptions

	isBundle : () => this is { type : OSCMessageTypeBundle }
	isSingle : () => this is { type : OSCMessageTypeMessage }
	buffer   : Buffer<ArrayBufferLike>
	match    : ( pattern : string | RegExp ) => OSCMatchResult[]
	toJSON   : () => toJSONType
}

export type toJSONType =
	{
		messages   : ( OSCMessageInterface | Buffer<ArrayBufferLike> )[];
		timeTag    : OSCTimeTag;
		type       : string;
		address ?  : never;
		elements ? : never;
	} | {
		address    : string;
		elements   : OSCArguments[];
		type       : string;
		messages ? : never;
		timeTag ?  : never;
	} | undefined
