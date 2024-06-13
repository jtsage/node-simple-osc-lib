const osc = require('./index.js')
const pre = require('./lib/x32_preprocessors.js')

/**
 * Extended processing for Behringer X32/M32 consoles.
 * This provides some override and pre-processing tools
 * to make it easier to work with the style of OSC messages
 * the Behringer uses.
 * @module simple-osc-lib/x32
 */

const strToArg = (argString) => {
	// eslint-disable-next-line eqeqeq
	if ( parseInt(argString, 10) == argString ) { return { type : 'integer', value : parseInt(argString, 10) }}
	if ( argString.startsWith('%') ) {
		// eslint-disable-next-line unicorn/no-useless-spread
		return { type : 'bitmask', value : [...argString.slice(1)].map((x) => x === '1')}
	}

	return { type : 'string', value : argString }
}

const getIndex  = (x) => parseInt(x.slice(x.lastIndexOf('/')+1), 10)
const getCueNum = (x) => `${x.slice(0, x.length-2)}.${x.slice(-2, -1)}.${x.slice(-1)}`


/**
 * Convert a string or number decibel representation to a floating point number
 * @param {String|Number} db_in string or float representation of decibel level +10->-90
 * @returns {Number} floating point representation of decibel level 0->1
 */
const dB2Float = pre.dB2Float

/**
 * Convert floating point 0->1 to decibel level
 * @param {Number} f 0->1 floating point level
 * @returns {String} text level [+/-##.# dB]
 */
const float2dB = pre.float2dB

/**
 * This object is used to pre-process those messages that have an address of `node` or `/node`.
 * 
 * Note that the X32 family does not use a leading slash on node messages it sends.
 * @property {Object} nodeArgMap node message coverage
 * @property {RegExp} nodeArgMap[key].regex match regex for this message type
 * @property {Function} nodeArgMap[key].props function that returns an object that is saved to the `props` key of the original message object
 * @example
 * nodeArgMap.show = {
 *     regex : /^\/-show\/showfile\/show$/,
 *     props : (msgObj) => ({
 *         name       : msgObj.args[0].value,
 *         subType    : 'show',
 *     }),
 * }
 */
const nodeArgMap = {
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

const unwrapX32Args = (msgObj) => {
	for ( const thisTest of Object.values(nodeArgMap) ) {
		if ( msgObj.address.match(thisTest.regEx) ) {
			msgObj.wasProcessed = true
			msgObj.props        = thisTest.props(msgObj)
			break
		}
	}
	return msgObj
}

/**
 * Decode an OSC packet.  Useful for when the client might send bundles or messages.
 * 
 * This version runs the X32 preprocessor on received messages
 * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
 * @param {Object} options options
 * @param {Object} options.strictMode use strict mode
 * @param {Object} options.messageCallback callback to run on each message
 * @returns {Object} osc-bundle object or osc-message object
 */
const oscReadPacket = ( buffer_in, { useStrict = osc.options.strictMode, messageCallback = null } = {} ) => {
	return osc.oscReadPacket( buffer_in, {
		useStrict       : useStrict,
		messageCallback : (oscMessage) => {
			return typeof messageCallback === 'function' ?
				messageCallback(x32PacketProcessor(oscMessage)) :
				x32PacketProcessor(oscMessage)
		},
	})
}

/**
 * This is the processor for X32 style messages
 * 
 * @param {Object} oscMessage an OSC message object
 * @returns {Object} an OSC message object with additional data
 */
const x32PacketProcessor = (oscMessage) => {
	if ( typeof oscMessage !== 'object' && oscMessage.address !== null ) { return oscMessage }

	oscMessage.wasProcessed = false

	if ( oscMessage.address === 'node' || oscMessage.address === '/node' ) {
		return processNodeMessage(oscMessage.args[0].value)
	}
	return processRegularMessage(oscMessage)
}

const processRegularMessage = (oscMessage) => {
	return oscMessage
}

const processNodeMessage = (strNodeMessage) => {
	const indexOfFirstSpace = strNodeMessage.indexOf(' ')
	const argsMessagePart   = strNodeMessage.slice(indexOfFirstSpace+1)
	const oscMessageObject = {
		address     : strNodeMessage.slice(0, indexOfFirstSpace),
		args        : [],
		origNodeArg : argsMessagePart,
		props       : {},
		type        : 'osc-message-x32-extend',
	}

	let quoteOpen = false
	let currentArgValue = ''
	for ( const thisChar of argsMessagePart) {
		if ( thisChar === ' ' && quoteOpen ) {
			// space, open quotes, add to variable value
			currentArgValue += thisChar
		} else if ( thisChar === ' ' && !quoteOpen ) {
			// space, closed quotes, commit variable
			if ( currentArgValue !== '' ) {
				oscMessageObject.args.push(strToArg(currentArgValue))
			}
			currentArgValue = ''
		} else if ( thisChar === '"' ) {
			// quote, flip open status
			quoteOpen = !quoteOpen
		} else {
			// add anything else to current
			currentArgValue += thisChar
		}
	}
	if ( currentArgValue !== '' ) {
		oscMessageObject.args.push(strToArg(currentArgValue))
	}

	return unwrapX32Args(oscMessageObject)
}

module.exports = {
	dB2Float           : dB2Float,
	float2dB           : float2dB,
	oscReadPacket      : oscReadPacket,
	x32PacketProcessor : x32PacketProcessor,

	nodeArgMap : nodeArgMap,
}
