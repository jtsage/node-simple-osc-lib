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
	else if (d <= 10.0) { returnVal = (d + 30.0) / 40.0 }
	// Optionally round “f” to a X32 known value
	return parseInt(returnVal * 1023.5) / 1023.0
}

const float2dB = (f) => {
	if ( typeof f !== 'number' ) { throw new TypeError('float expected')}
	let returnVal = -0.0
	if      (f >= 0.5)    { returnVal = f * 40.0 - 30.0 }
 	else if (f >= 0.25)   { returnVal = f * 80.0 - 50.0 }
 	else if (f >= 0.0625) { returnVal = f * 160.0 - 70.0 }
 	else if (f >= 0.0)    { returnVal = f * 480.0 - 90.0 }
	const returnString = returnVal.toFixed(1)
	if ( returnString === '-90.0' ) { return '-oo dB' }
	return `${returnString} dB`
}

module.exports = {
	dB2Float : dB2Float,
	float2dB : float2dB,
	
	regular : {
		auxLevel : {
			regEx : /^\/auxin\/\d{2}\/mix\/fader$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(7, 9)),
				level   : {
					float : msgObj.args[0].value,
					db    : float2dB(msgObj.args[0].value),
				},
				zIndex  : msgObj.address.slice(7, 9),
			}),
		},
		auxMute : {
			regEx : /^\/auxin\/\d{2}\/mix\/on$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(7, 9)),
				isOn    : {
					bool : msgObj.args[0].value,
					text : msgObj.args[0].value ? 'ON' : 'OFF',
				},
				zIndex  : msgObj.address.slice(7, 9),
			}),
		},
		auxName : {
			regEx : /^\/auxin\/\d{2}\/config\/name$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(7, 9)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(7, 9),
			}),
		},
		busLevel : {
			regEx : /^\/bus\/\d{2}\/mix\/fader$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				level   : {
					float : msgObj.args[0].value,
					db    : float2dB(msgObj.args[0].value),
				},
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		busMute : {
			regEx : /^\/bus\/\d{2}\/mix\/on$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				isOn    : {
					bool : msgObj.args[0].value,
					text : msgObj.args[0].value ? 'ON' : 'OFF',
				},
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		busName : {
			regEx : /^\/bus\/\d{2}\/config\/name$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		chanLevel : {
			regEx : /^\/ch\/\d{2}\/mix\/fader$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(4, 6)),
				level   : {
					float : msgObj.args[0].value,
					db    : float2dB(msgObj.args[0].value),
				},
				zIndex  : msgObj.address.slice(4, 6),
			}),
		},
		chanMute : {
			regEx : /^\/ch\/\d{2}\/mix\/on$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(4, 6)),
				isOn    : {
					bool : msgObj.args[0].value,
					text : msgObj.args[0].value ? 'ON' : 'OFF',
				},
				zIndex  : msgObj.address.slice(4, 6),
			}),
		},
		chanName : {
			regEx : /^\/ch\/\d{2}\/config\/name$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(4, 6)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(4, 6),
			}),
		},
		cueCurrent : {
			regEx : /^\/-show\/prepos\/current$/,
			props : (msgObj) => ({
				index : msgObj.args[0].value,
			}),
		},
		dcaLevel : {
			regEx : /^\/dca\/\d\/fader$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 6)),
				level   : {
					float : msgObj.args[0].value,
					db    : float2dB(msgObj.args[0].value),
				},
			}),
		},
		dcaMute : {
			regEx : /^\/dca\/\d\/on$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 6)),
				isOn    : {
					bool : msgObj.args[0].value,
					text : msgObj.args[0].value ? 'ON' : 'OFF',
				},
			}),
		},
		dcaName : {
			regEx : /^\/dca\/\d\/config\/name$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 6)),
				name    : msgObj.args[0].value,
			}),
		},
		showMode : {
			regEx : /^\/-prefs\/show_control$/,
			props : (msgObj) => ({
				index     : msgObj.args[0].value,
			}),
		},
	},

	node : {
		auxConfig : {
			regEx : /^\/auxin\/\d{2}\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(7, 9)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(7, 9),
			}),
		},
		auxMix : {
			regEx : /^\/auxin\/\d{2}\/mix$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(7, 9)),
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
				zIndex  : msgObj.address.slice(7, 9),
			}),
		},
		busConfig : {
			regEx : /^\/bus\/\d{2}\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		busMix : {
			regEx : /^\/bus\/\d{2}\/mix$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		chanConfig : {
			regEx : /^\/ch\/\d{2}\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(4, 6)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(4, 6),
			}),
		},
		chanMix : {
			regEx : /^\/ch\/\d{2}\/mix$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(4, 6)),
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
				zIndex  : msgObj.address.slice(4, 6),
			}),
		},
		cue : {
			regEx : /^\/-show\/showfile\/cue\/\d{3}$/,
			props : (msgObj) => ({
				cueNumber  : getCueNum(msgObj.args[0].value.toString()),
				cueScene   : msgObj.args[3].value,
				cueSkip    : Boolean(msgObj.args[2].value),
				cueSnippet : msgObj.args[4].value,
				index      : getIndex(msgObj.address),
				name       : msgObj.args[1].value,
			}),
		},
		cueCurrent : {
			regEx : /^\/-show\/prepos\/current$/,
			props : (msgObj) => ({
				index : msgObj.args[0].value,
			}),
		},
		dcaConfig : {
			// '/dca/2/config "THEATER" 1 RD',
			// dca/[number]/config name ...unknown...
			regEx : /^\/dca\/\d\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 6)),
				name    : msgObj.args[0].value,
			}),
		},
		dcaMix : {
			// '/dca/2 OFF   -32.5',
			// dca/[number] mute level
			regEx : /^\/dca\/\d$/,
			props : (msgObj) => ({
				index   : getIndex(msgObj.address),
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
			}),
		},
		mainConfig : {
			regEx : /^\/main\/st\/config$/,
			props : (msgObj) => ({
				name    : msgObj.args[0].value,
			}),
		},
		mainMix : {
			regEx : /^\/main\/st\/mix$/,
			props : (msgObj) => ({
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
			}),
		},
		monoConfig : {
			regEx : /^\/main\/m\/config$/,
			props : (msgObj) => ({
				name    : msgObj.args[0].value,
			}),
		},
		monoMix : {
			regEx : /^\/main\/m\/mix$/,
			props : (msgObj) => ({
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
			}),
		},
		mtxConfig : {
			regEx : /^\/mtx\/\d{2}\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				name    : msgObj.args[0].value,
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		mtxMix : {
			regEx : /^\/mtx\/\d{2}\/mix$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 7)),
				isOn    : {
					bool : msgObj.args[0].value === 'ON',
					text : msgObj.args[0].value,
				},
				level   : {
					float : dB2Float(msgObj.args[1].value),
					db    : `${msgObj.args[1].value} dB`,
				},
				zIndex  : msgObj.address.slice(5, 7),
			}),
		},
		scene : {
			regEx : /^\/-show\/showfile\/scene\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value,
				note       : msgObj.args[1].value,
			}),
		},
		show : {
			regEx : /^\/-show\/showfile\/show$/,
			props : (msgObj) => ({
				name       : msgObj.args[0].value,
			}),
		},
		showMode : {
			regEx : /^\/-prefs\/show_control$/,
			props : (msgObj) => ({
				text       : msgObj.args[0].value,
			}),
		},
		snippet : {
			regEx : /^\/-show\/showfile\/snippet\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value,
			}),
		},
	},
}