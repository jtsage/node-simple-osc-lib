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
	
	node : {
		cue : {
			regEx : /^\/-show\/showfile\/cue\/\d{3}$/,
			props : (msgObj) => ({
				cueNumber  : getCueNum(msgObj.args[0].value.toString()),
				cueScene   : msgObj.args[3].value,
				cueSkip    : Boolean(msgObj.args[2].value),
				cueSnippet : msgObj.args[4].value,
				index      : getIndex(msgObj.address),
				name       : msgObj.args[1].value,
				subType    : 'cue',
			}),
		},
		dca : {
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
				subType : 'dcaMuteLevel',
			}),
		},
		dcaConfig : {
			// '/dca/2/config "THEATER" 1 RD',
			// dca/[number]/config name ...unknown...
			regEx : /^\/dca\/\d\/config$/,
			props : (msgObj) => ({
				index   : parseInt(msgObj.address.slice(5, 6)),
				name    : msgObj.args[0].value,
				subType : 'dcaName',
			}),
		},
		scene : {
			regEx : /^\/-show\/showfile\/scene\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value,
				note       : msgObj.args[1].value,
				subType    : 'scene',
			}),
		},
		show : {
			regEx : /^\/-show\/showfile\/show$/,
			props : (msgObj) => ({
				name       : msgObj.args[0].value,
				subType    : 'show',
			}),
		},
		snippet : {
			regEx : /^\/-show\/showfile\/snippet\/\d{3}$/,
			props : (msgObj) => ({
				index      : getIndex(msgObj.address),
				name       : msgObj.args[0].value,
				subType    : 'snippet',
			}),
		},
	}
}