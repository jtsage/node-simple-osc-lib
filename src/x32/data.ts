/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Data */

import { OSCMatchResult, OSCMessageInterfaceMessage } from '../types'
import { X32FaderUpdateLevel, X32FaderUpdateMix, X32FaderUpdateMute, X32FaderUpdateName, X32Cue, X32DataRecord, X32Info, X32Scene, X32ShowModes, X32Snippet } from './types'

type X32MatcherRecord = {
	matcher   : ( scope : string ) => string,
	processor : (
		msg   : OSCMessageInterfaceMessage,
		match : OSCMatchResult
	) => X32DataRecord
}

type X32Matchers = { [K in X32ValidMatchers] : X32MatcherRecord }


/* eslint-disable @typescript-eslint/no-explicit-any */
type Constructor<T> = new ( ...args : any[] ) => T

function classFactory<T>(
	ctor : Constructor<T>,
	args : any[]
) : T | null {
	for ( const arg of args ) {
		if ( typeof arg === 'undefined' ) {
			return null
		}
	}

	return new ctor( ...args )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type X32ValidMatchers =
	| 'control'
	| 'cueDirty'
	| 'currentCue'
	| 'dcaFaderReg'
	| 'dcaMuteReg'
	| 'dcaNode'
	| 'faderReg'
	| 'mixNode'
	| 'muteReg'
	| 'nameNode'
	| 'nameReg'
	| 'showDataNode'
	| 'showName'

export const matchers : X32Matchers = {
	'dcaFaderReg' : {
		matcher   : () => '/dca/*/fader',
		processor : ( msg, match ) => classFactory( X32FaderUpdateLevel, [
			'dca',
			match.matches[0],
			msg.args[0]?.value // level, float
		] ),
	},
	'dcaMuteReg' : {
		matcher   : () => '/dca/*/on',
		processor : ( msg, match ) => classFactory( X32FaderUpdateMute, [
			'dca',
			match.matches[0],
			msg.args[0]?.value // mute, 0 or 1
		] ),
	},
	'faderReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix/fader`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateLevel, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value // level, float
		] ),
	},
	'muteReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix/on`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateMute, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value // mute, 0 or 1
		] ),
	},
	'nameReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/config/name`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateName, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value // name, string
		] ),
	},

	'dcaNode' : {
		matcher   : () => '/dca/*',
		processor : ( msg, match ) => classFactory( X32FaderUpdateMix, [
			'dca',
			match.matches[0],
			msg.args[0]?.value, // mute, 'ON' or 'OFF'
			msg.args[1]?.value  // level, in dB, no suffix.  e.g. '0.0'
		] ),
	},
	'mixNode' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateMix, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value, // mute, 'ON' or 'OFF'
			msg.args[1]?.value  // level, in dB, no suffix.  e.g. '0.0'
		] ),
	},
	'nameNode' : {
		matcher   : ( scope ) => `/{${scope}}/*/config`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateName, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value // name, string
		] ),
	},

	'showDataNode' : {
		matcher   : () => '/-show/showfile/{cue,scene,snippet}/*',
		processor : ( msg, match ) => {
			switch ( match.matches[0] as string ) {
				case 'cue' : return classFactory( X32Cue, [
					match.matches[1],
					msg.args[0]?.value, // number
					msg.args[1]?.value, // title
					msg.args[2]?.value, // skip 0|1
					msg.args[3]?.value, // scene or -1
					msg.args[4]?.value  // snippet or -1
				] )
				case 'scene' : return classFactory( X32Scene, [
					match.matches[1],
					msg.args[0]?.value, // name
					msg.args[1]?.value  // note
				] )
				default : return classFactory( X32Snippet, [
					match.matches[1],
					msg.args[0]?.value // name
				] )
			}
		},
	},
	
	'control' : {
		matcher   : () => '/-prefs/show_control',
		processor : ( msg ) => {
			const arg = msg.args[0]?.value

			return classFactory( X32Info, [
				'control',
				typeof arg === 'number' ? X32ShowModes[arg as 0 | 1 | 2] : ( arg as string )
			] )
		},
	},
	'cueDirty' : {
		matcher   : () => '/-show/showfile/{scene,snippet,cue}/*/name',
		processor : ( _msg, match ) => classFactory( X32Info, [
			'cueDirty',
			match.matches[0]
		] ),
	},
	'currentCue' : {
		matcher   : () => '/-show/prepos/current',
		processor : ( msg ) => classFactory( X32Info, [
			'currentCue',
			msg.args[0]?.value
		] ),
	},
	'showName' : {
		matcher   : () => '/-show/showfile/show',
		processor : ( msg ) => classFactory( X32Info, [
			'showName',
			msg.args[0]?.value
		] ),
	},
}
