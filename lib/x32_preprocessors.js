/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   X32 Preprocessing Operations */

const SHOW_MODES = ['CUES', 'SCENES', 'SNIPPETS']

const getIndex  = (x) => parseInt(x.slice(x.lastIndexOf('/')+1), 10)
const getCueNum = (x) => `${x.slice(0, x.length-2)}.${x.slice(-2, -1)}.${x.slice(-1)}`

const dB2Float = (db_in) => {
	let d = db_in
	if ( typeof db_in === 'string' ) {
		const dbStr = db_in.replace(/ ?[Dd][Bb]/, '')
		if ( dbStr === '-oo' ) { return 0 }
		d = parseFloat(dbStr)
	} else if ( typeof db_in !== 'number' ) {
		throw new TypeError('string or number expected')
	}

	let returnVal = 0

	if (d < -60.0)      { returnVal = (d + 90.0) / 480.0 }
	else if (d < -30.0) { returnVal = (d + 70.0) / 160.0 }
	else if (d < -10.0) { returnVal = (d + 50.0) / 80.0 }
	else                { returnVal = (d + 30.0) / 40.0 }

	// Optionally round “f” to a X32 known value
	return parseInt(returnVal * 1023.5) / 1023.0
}

const float2dB = (f) => {
	if ( typeof f !== 'number' ) { throw new TypeError('float expected')}
	let returnVal = -0.0

	if      (f >= 0.5)    { returnVal = f * 40.0 - 30.0 }
 	else if (f >= 0.25)   { returnVal = f * 80.0 - 50.0 }
 	else if (f >= 0.0625) { returnVal = f * 160.0 - 70.0 }
 	else                  { returnVal = f * 480.0 - 90.0 }

	const returnString = returnVal.toFixed(1)
	if ( returnString === '-0.0' ) { return '0.0 dB'}
	else if ( returnString === '-90.0' ) { return '-oo dB' }
	return `${returnString} dB`
}

const normalizeLevel = (level, fader) => ({
	index   : parseInt(fader),
	level   : {
		float : typeof level === 'number' ? level : dB2Float(level),
		db    : typeof level === 'string' ? `${level} dB` : float2dB(level),
	},
	zIndex  : fader,
})

const normalizeMute = (mute, fader) => ({
	index   : parseInt(fader),
	isOn    : {
		bool : typeof mute !== 'string' ? Boolean(mute) : mute === 'ON',
		int  : Number(typeof mute !== 'string' ? Boolean(mute) : mute === 'ON'),
		text : typeof mute === 'string' ? mute : mute ? 'ON' : 'OFF',
	},
	zIndex  : fader,
})

const normalizeMix = (mute, level, fader) => ({
	...normalizeMute(mute, fader),
	...normalizeLevel(level, fader),
})

const normalizeName = (faderName, fader) => ({
	index   : parseInt(fader),
	name    : faderName.toString(),
	zIndex  : fader,
})

const normalizeShowMode = (value) => ({
	index   : ( typeof value === 'number') ? value : SHOW_MODES.indexOf(value),
	name    : ( typeof value === 'string') ? value : SHOW_MODES[value],
})

module.exports = {
	dB2Float : dB2Float,
	float2dB : float2dB,
	
	regular : {
		showCurrent : {
			regEx : /^\/-show\/prepos\/current$/,
			props : (msgObj) => ({
				index : msgObj.args[0].value,
			}),
		},
		showMode : {
			regEx : /^\/-prefs\/show_control$/,
			props : (msgObj) => normalizeShowMode(msgObj.args[0].value),
		},

		auxLevel : {
			regEx : /^\/auxin\/\d{2}\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				msgObj.address.slice(7, 9)
			),
		},
		auxMute : {
			regEx : /^\/auxin\/\d{2}\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				msgObj.address.slice(7, 9)
			),
		},
		auxName : {
			regEx : /^\/auxin\/\d{2}\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(7, 9)
			),
		},

		busLevel : {
			regEx : /^\/bus\/\d{2}\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},
		busMute : {
			regEx : /^\/bus\/\d{2}\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},
		busName : {
			regEx : /^\/bus\/\d{2}\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},

		chanLevel : {
			regEx : /^\/ch\/\d{2}\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				msgObj.address.slice(4, 6)
			),
		},
		chanMute : {
			regEx : /^\/ch\/\d{2}\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				msgObj.address.slice(4, 6)
			),
		},
		chanName : {
			regEx : /^\/ch\/\d{2}\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(4, 6)
			),
		},

		dcaLevel : {
			regEx : /^\/dca\/\d\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				msgObj.address.slice(5, 6)
			),
		},
		dcaMute : {
			regEx : /^\/dca\/\d\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				msgObj.address.slice(5, 6)
			),
		},
		dcaName : {
			regEx : /^\/dca\/\d\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 6)
			),
		},

		mainLevel : {
			regEx : /^\/main\/st\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				'0'
			),
		},
		mainMute : {
			regEx : /^\/main\/st\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				'0'
			),
		},
		mainName : {
			regEx : /^\/main\/st\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				'0'
			),
		},

		monoLevel : {
			regEx : /^\/main\/m\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				'0'
			),
		},
		monoMute : {
			regEx : /^\/main\/m\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				'0'
			),
		},
		monoName : {
			regEx : /^\/main\/m\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				'0'
			),
		},

		mtxLevel : {
			regEx : /^\/mtx\/\d{2}\/mix\/fader$/,
			props : (msgObj) => normalizeLevel(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},
		mtxMute : {
			regEx : /^\/mtx\/\d{2}\/mix\/on$/,
			props : (msgObj) => normalizeMute(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},
		mtxName : {
			regEx : /^\/mtx\/\d{2}\/config\/name$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},

		showCueDirty : {
			// Note: Cue operations generate a *ton* of traffic.  Use a debounce
			// on this if you are going to react.
			regEx : /^\/-show\/showfile\/cue\/\d{3}\//,
			props : () => ({}),
		},
		showSceneDirty : {
			regEx : /^\/-show\/showfile\/scene\/\d{3}\/name$/,
			props : () => ({}),
		},
		showSnippetDirty : {
			regEx : /^\/-show\/showfile\/snippet\/\d{3}\/name$/,
			props : () => ({}),
		},
	},

	node : {
		auxMix : {
			regEx : /^\/auxin\/\d{2}\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				msgObj.address.slice(7, 9)
			),
		},
		auxName : {
			regEx : /^\/auxin\/\d{2}\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(7, 9)
			),
		},
		
		busMix : {
			regEx : /^\/bus\/\d{2}\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				msgObj.address.slice(5, 7)
			),
		},
		busName : {
			regEx : /^\/bus\/\d{2}\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},

		dcaMix : {
			regEx : /^\/dca\/\d$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				msgObj.address.slice(5, 6)
			),
		},
		dcaName : {
			regEx : /^\/dca\/\d\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 6)
			),
		},

		chanMix : {
			regEx : /^\/ch\/\d{2}\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				msgObj.address.slice(4, 6)
			),
		},
		chanName : {
			regEx : /^\/ch\/\d{2}\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(4, 6)
			),
		},

		mtxMix : {
			regEx : /^\/mtx\/\d{2}\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				msgObj.address.slice(5, 7)
			),
		},
		mtxName : {
			regEx : /^\/mtx\/\d{2}\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				msgObj.address.slice(5, 7)
			),
		},

		mainMix : {
			regEx : /^\/main\/st\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				'0'
			),
		},
		mainName : {
			regEx : /^\/main\/st\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				'0'
			),
		},

		monoMix : {
			regEx : /^\/main\/m\/mix$/,
			props : (msgObj) => normalizeMix(
				msgObj.args[0].value,
				msgObj.args[1].value,
				'0'
			),
		},
		monoName : {
			regEx : /^\/main\/m\/config$/,
			props : (msgObj) => normalizeName(
				msgObj.args[0].value,
				'0'
			),
		},
		
		showCurrent : {
			regEx : /^\/-show\/prepos\/current$/,
			props : (msgObj) => ({
				index : msgObj.args[0].value,
			}),
		},
		showMode : {
			regEx : /^\/-prefs\/show_control$/,
			props : (msgObj) => normalizeShowMode(msgObj.args[0].value),
		},
		showName : {
			regEx : /^\/-show\/showfile\/show$/,
			props : (msgObj) => ({
				name       : msgObj.args[0].value,
			}),
		},

		showCue : {
			regEx : /^\/-show\/showfile\/cue\/\d{3}$/,
			props : (msgObj) => ({
				cueNumber  : getCueNum(msgObj.args[0].value.toString()),
				cueScene   : msgObj.args[3].value,
				cueSkip    : Boolean(msgObj.args[2].value),
				cueSnippet : msgObj.args[4].value,
				index      : getIndex(msgObj.address),
				name       : msgObj.args[1].value.toString(),
			}),
		},
		showScene : {
			regEx : /^\/-show\/showfile\/scene\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value.toString(),
				note       : msgObj.args[1].value.toString(),
			}),
		},
		showSnippet : {
			regEx : /^\/-show\/showfile\/snippet\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value.toString(),
			}),
		},
	},
}