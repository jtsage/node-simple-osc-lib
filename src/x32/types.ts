/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Types */

import { OSCError } from '../types'

export const X32ShowModes = ['CUES', 'SCENES', 'SNIPPETS'] as const

export const X32FaderScopes = [
	'auxin',
	'bus',
	'mtx',
	'ch',
	'main',
	'dca',
	'fxrtn'
] as const

const X32FaderUpdateTypes = [
	'level',
	'mute',
	'name',
	'mix'
] as const

type X32FaderUpdateType = ( typeof X32FaderUpdateTypes )[number]
export type X32FaderScope = ( typeof X32FaderScopes )[number]

export type X32DataRecord =
	| X32Cue
	| X32Info
	| X32Scene
	| X32Snippet
	| X32FaderUpdateLevel
	| X32FaderUpdateMix
	| X32FaderUpdateMute
	| X32FaderUpdateName
	| null

export class X32Data {
	index : number

	constructor( value : number | string ) {
		this.index = X32Data.index2Number( value )
	}

	static index2Number( value : number | string ) {
		if ( typeof value === 'number' ) {
			return value
		}
		if ( typeof value === 'string' && value.match( /\d+/ ) ) {
			return parseInt( value, 10 )
		}
		throw new X32Error( 'unparsable index' )
	}

	get zIndex() {
		return String( this.index ).padStart( 2, '0' )
	}
}

/** FaderUpdate top-level class */
export class X32FaderUpdate extends X32Data {
	scope : X32FaderScope
	#type : X32FaderUpdateType

	constructor(
		scope : X32FaderScope,
		index : string | number,
		type  : X32FaderUpdateType
	) {
		if ( ! X32FaderUpdateTypes.includes( type ) ) {
			throw new X32Error( 'invalid fader update type' )
		}
		if ( ! X32FaderScopes.includes( scope ) ) {
			throw new X32Error( 'invalid fader update scope' )
		}

		if ( typeof index === 'number' || scope !== 'main' ) {
			super( index )
		} else if ( index === 'st' ) {
			super( 1 )
		} else if ( index === 'm' ) {
			super( 2 )
		} else {
			throw new X32Error( 'unparsable index' )
		}

		
		this.#type = type
		this.scope = scope

	}

	hasMute() : this is X32FaderUpdateMute {
		return this.#type === 'mute' || this.#type === 'mix'
	}

	hasLevel() : this is X32FaderUpdateLevel {
		return this.#type === 'level' || this.#type === 'mix'
	}

	hasName() : this is X32FaderUpdateName {
		return this.#type === 'name'
	}

	static convertOn( value : string | number | boolean ) {
		if ( typeof value === 'boolean' ) {
			return value
		}
		if ( typeof value === 'string' ) {
			return value === 'ON' || value === '1'
		}
		if ( typeof value === 'number' ) {
			return Boolean( value )
		}

		throw new X32Error( 'unable to set on-status' )
	}

	static convertLevel( value : string | number, forceDb : boolean = false ) {
		if ( typeof value === 'number' && !forceDb ) {
			return value
		}
		return X32FaderUpdate.dB2Float( value )
	}

	
	static dB2Float( db_in : string | number ) {
		let d : number
		if ( typeof db_in === 'string' ) {
			const dbStr = db_in.replace( / ?[Dd][Bb]/, '' )
			if ( dbStr === '-oo' ) {
				return 0
			}
			d = parseFloat( dbStr )
		} else if ( typeof db_in !== 'number' ) {
			throw new X32Error( 'string or number expected' )
		} else {
			d = db_in
		}

		let returnVal : number

		if ( d < -60.0 ) {
			returnVal = ( d + 90.0 ) / 480.0
		} else if ( d < -30.0 ) {
			returnVal = ( d + 70.0 ) / 160.0
		} else if ( d < -10.0 ) {
			returnVal = ( d + 50.0 ) / 80.0
		} else {
			returnVal = ( d + 30.0 ) / 40.0
		}

		// Optionally round “f” to a X32 known value
		return Math.ceil( returnVal * 1023.5 ) / 1023.0
	}

	static float2dB( f : number ) {
		if ( typeof f !== 'number' ) {
			throw new X32Error( 'float expected' )
		}

		let returnVal : number

		if ( f >= 0.5 ) {
			returnVal = f * 40.0 - 30.0
		} else if ( f >= 0.25 ) {
			returnVal = f * 80.0 - 50.0
		} else if ( f >= 0.0625 ) {
			returnVal = f * 160.0 - 70.0
		} else {
			returnVal = f * 480.0 - 90.0
		}

		const returnString = returnVal.toFixed( 1 )

		if ( returnString === '-0.0' ) {
			return '+0.0 dB'
		} else if ( returnString === '-90.0' ) {
			return '-oo dB'
		}

		return returnString.startsWith( '-' ) ? `${returnString} dB` : `+${returnString} dB`
	}
}

/** FaderUpdate from ON */
export class X32FaderUpdateMute extends X32FaderUpdate {
	#onStatus : boolean

	constructor(
		scope : X32FaderScope,
		index : string | number,
		value : 'ON' | 'OFF' | boolean | 1 | 0
	) {
		super( scope, index, 'mute' )
		this.#onStatus = X32FaderUpdate.convertOn( value )
	}

	get onText() {
		return this.#onStatus === true ? 'ON' : 'OFF'
	}

	get onBool() {
		return this.#onStatus
	}

	get onInt() {
		return this.#onStatus === true ? 1 : 0
	}
}

/** FaderUpdate from LEVEL */
export class X32FaderUpdateLevel extends X32FaderUpdate {
	#level : number

	get levelDb() {
		return X32FaderUpdate.float2dB( this.#level )
	}

	get level() {
		return this.#level
	}

	constructor(
		scope     : X32FaderScope,
		index     : string | number,
		value     : string | number,
		forceDb ? : boolean
	) {
		super( scope, index, 'level' )
		this.#level = X32FaderUpdate.convertLevel( value, forceDb )
	}
}

/** FaderUpdate from NAME */
export class X32FaderUpdateName extends X32FaderUpdate {
	#name : string

	get name() {
		return this.#name
	}

	constructor(
		scope : X32FaderScope,
		index : string | number,
		value : string
	) {
		super( scope, index, 'name' )
		if ( typeof value === 'string' ) {
			this.#name = value
		} else {
			throw new X32Error( 'unable to set name' )
		}
	}
}

/** FaderUpdate from MIX */
export class X32FaderUpdateMix extends X32FaderUpdate {
	#onStatus : boolean
	#level    : number

	constructor(
		scope     : X32FaderScope,
		index     : string | number,
		on        : 'ON' | 'OFF' | boolean | 1 | 0,
		level     : number | string,
		forceDb ? : boolean
	) {
		super( scope, index, 'mix' )
		this.#onStatus = X32FaderUpdate.convertOn( on )
		this.#level = X32FaderUpdate.convertLevel( level, forceDb )
	}

	get onText() {
		return this.#onStatus === true ? 'ON' : 'OFF'
	}

	get onBool() {
		return this.#onStatus
	}

	get onInt() {
		return this.#onStatus === true ? 1 : 0
	}

	get levelDb() {
		return X32FaderUpdate.float2dB( this.#level )
	}

	get level() {
		return this.#level
	}
}

export class X32Snippet extends X32Data {
	title : string

	constructor(
		index : number | string,
		title : string = ''
	) {
		super( index )
		this.title = title
	}

	get zIndex() {
		return String( this.index ).padStart( 3, '0' )
	}
}

export class X32Scene extends X32Snippet {
	note  : string

	constructor(
		index : number | string,
		title : string = '',
		note  : string = ''
	) {
		super( index, title )
		this.note  = note
	}
}


export class X32Cue extends X32Snippet {
	number  : string
	scene   : number
	skip    : boolean
	snippet : number

	constructor(
		index   : number | string,
		number  : number | string,
		title   : string  = '',
		skip    : boolean = false,
		scene   : number  = -1,
		snippet : number = -1
	) {
		const strNumber = typeof number === 'string' ? number : String( number )
		if ( ! strNumber.match( /^\d{3,4}$/ ) ) {
			throw new X32Error( 'cue "number" format unexpected' )
		}
		super( index, title )
		this.number  = `${strNumber.slice( 0, strNumber.length-2 )}.${strNumber.slice( -2, -1 )}.${strNumber.slice( -1 )}`
		this.scene   = X32Data.index2Number( scene )
		this.snippet = X32Data.index2Number( snippet )

		if ( typeof skip === 'boolean' ) {
			this.skip = skip
		} else if ( typeof skip === 'string' ) {
			this.skip = skip === 'true' || skip === '1'
		} else if ( typeof skip === 'number' ) {
			this.skip = Boolean( skip )
		} else {
			throw new X32Error( 'invalid skip option' )
		}
			
	}
}

export class X32Info {
	type  : 'cueDirty' | 'currentCue' | 'control' | 'showName'
	value : null | number | string

	constructor(
		type : 'cueDirty' | 'currentCue' | 'control' | 'showName',
		value : null | number | string
	) {
		this.type = type
		this.value = value
	}
}


/** General OSC Error */
export class X32Error extends OSCError {
	constructor( message : string, opts ? : ErrorOptions ) {
		super( message, opts )
	}
}
