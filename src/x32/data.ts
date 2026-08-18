/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Data */

import { OSCMatchResult, OSCMessageInterfaceMessage } from '../types'
import { X32FaderUpdateLevel, X32FaderUpdateMix, X32FaderUpdateMute, X32FaderUpdateName, X32Cue, X32DataRecord, X32FaderScope, X32Info, X32Scene, X32ShowModes, X32Snippet } from './types'

type X32MatcherRecord = {
	matcher   : ( scope : string ) => string,
	processor : (
		msg   : OSCMessageInterfaceMessage,
		match : OSCMatchResult
	) => X32DataRecord
}

type X32Matchers = { [key : string] : X32MatcherRecord }


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


export const matchers : X32Matchers = {
	'faderReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix/fader`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateLevel, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value
		] ),
	},
	'muteReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix/on`,
		processor : ( msg, match ) => classFactory( X32FaderUpdateMute, [
			match.matches[0],
			match.matches[1],
			msg.args[0]?.value
		] ),
	},
	'nameReg' : {
		matcher   : ( scope ) => `/{${scope}}/*/config/name`,
		processor : ( msg, match ) => new X32FaderUpdateName(
			match.matches[0] as X32FaderScope,
			match.matches[1] as string,
			msg.args[0]!.value as string
		),
	},

	'dcaNode' : {
		matcher   : () => '/dca/*',
		processor : ( msg, match ) => new X32FaderUpdateMix(
			'dca',
			match.matches[1] as string,
			msg.args[0]!.value as 'ON' | 'OFF',
			msg.args[1]!.value as string
		),
	},
	'mixNode' : {
		matcher   : ( scope ) => `/{${scope}}/*/mix`,
		processor : ( msg, match ) => new X32FaderUpdateMix(
			match.matches[0] as X32FaderScope,
			match.matches[1] as string,
			msg.args[0]!.value as 'ON' | 'OFF',
			msg.args[1]!.value as string
		),
	},
	'nameNode' : {
		matcher   : ( scope ) => `/{${scope}}/*/config`,
		processor : ( msg, match ) => new X32FaderUpdateName(
			match.matches[0] as X32FaderScope,
			match.matches[1] as string,
			msg.args[0]!.value as string
		),
	},

	'showDataNode' : {
		matcher   : () => '/-show/showfile/{cue,scene,snippet}/*',
		processor : ( msg, match ) => {
			switch ( match.matches[0] as string ) {
				case 'cue' : return new X32Cue(
					match.matches[1] as string,
					msg.args[0]!.value as number,
					{
						scene   : msg.args[3]!.value as number,
						skip    : msg.args[2]!.value as number,
						snippet : msg.args[4]!.value as number,
						title   : msg.args[1]!.value as string,
					}
				)
				case 'scene' : return new X32Scene(
					match.matches[1] as string,
					msg.args[0]!.value as string,
					msg.args[1]!.value as string
				)
				case 'snippet' : return new X32Snippet(
					match.matches[1] as string,
					msg.args[0]!.value as string
				)
				default :
					return null
			}
		},
	},
	
	'control' : {
		matcher   : () => '/-prefs/show_control',
		processor : ( msg ) => {
			const arg = msg.args[0]!.value

			return new X32Info(
				'control',
				typeof arg === 'number' ? X32ShowModes[arg as 0 | 1 | 2] :( arg as string )
			)
		},
	},
	'cueDirty' : {
		matcher   : () => '/-show/showfile/{scene,snippet,cue}/*/name',
		processor : () => new X32Info(
			'cueDirty',
			null
		),
	},
	'currentCue' : {
		matcher   : () => '/-show/prepos/current',
		processor : ( msg ) => new X32Info(
			'currentCue',
			msg.args[0]!.value as number
		),
	},
	'showName' : {
		matcher   : () => '/-show/showfile/show',
		processor : ( msg ) => new X32Info(
			'showName',
			msg.args[0]!.value as string
		),
	},
}
