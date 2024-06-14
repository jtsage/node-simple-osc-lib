// const osc = require('./index.js')
const data = require('./lib/x32_preprocessors.js')

/**
 * Extended processing for Behringer X32/M32 consoles.
 * This provides some override and pre-processing tools
 * to make it easier to work with the style of OSC messages
 * the Behringer uses.
 * @module simple-osc-lib/x32
 */


/**
 * Convert a string or number decibel representation to a floating point number
 * @param {String|Number} db_in string or float representation of decibel level +10->-90
 * @returns {Number} floating point representation of decibel level 0->1
 */
const dB2Float = data.dB2Float

/**
 * Convert floating point 0->1 to decibel level
 * @param {Number} f 0->1 floating point level
 * @returns {String} text level [+/-##.# dB]
 */
const float2dB = data.float2dB


class x32PreProcessor {
	#activeTypes = {
		node    : [],
		regular : [],
	}

	/**
	 * @param {object}  options                    - x32 Preprocessor options.
	 * @param {Boolean} options.activeNodeTypes    - Active node message preprocessors from lib/x32_preprocessors (or 'all')
	 * @param {String}  options.activeRegularTypes - Active regular message preprocessors from lib/x32_preprocessors (or 'all')
	 */
	constructor({activeNodeTypes = null, activeRegularTypes = null} = {}) {
		if ( activeNodeTypes === null || activeNodeTypes === 'all' ) {
			this.#activeTypes.node = Object.keys(data.node)
		} else if ( Array.isArray(activeNodeTypes) ) {
			this.#activeTypes.node = activeNodeTypes
		} else {
			throw new TypeError('expected array of node types')
		}

		if ( activeRegularTypes === null || activeRegularTypes === 'all' ) {
			this.#activeTypes.regular = Object.keys(data.regular)
		} else if ( Array.isArray(activeRegularTypes) ) {
			this.#activeTypes.regular = activeRegularTypes
		} else {
			throw new TypeError('expected array of regular types')
		}
	}

	/**
	 * This is the processor for X32 style messages
	 * 
	 * @param {Object} oscMessage an OSC message object
	 * @returns {Object} an OSC message object with additional data
	 * @example
	 * const osc     = require('simple-osc-lib')
	 * const osc_x32 = require('simple-osc-lib/x32')
	 * 
	 * const x32Pre = new osc_x32.x32PreProcessor({
	 *     activeNodeTypes : 'all',
	 *     activeRegularTypes : 'all',
	 * })
	 * 
	 * const oscRegular = new osc.simpleOscLib({
	 *     preprocessor : (msg) => x32Pre.readMessage(msg),
	 * })
	 */
	readMessage( oscMessage ) {
		if ( typeof oscMessage !== 'object' && oscMessage.address !== null ) { return oscMessage }

		oscMessage.wasProcessed = false

		if ( oscMessage.address === 'node' || oscMessage.address === '/node' ) {
			return this.processNodeMessage(oscMessage.args[0].value)
		}
		return this.processRegularMessage(oscMessage)
	}

	processRegularMessage( oscMessage ) {
		return this.#doArgs_regular(oscMessage)
	}

	processNodeMessage( strNodeMessage ) {
		const indexOfFirstSpace = strNodeMessage.indexOf(' ')
		const argsMessagePart   = strNodeMessage.slice(indexOfFirstSpace+1)
		const oscMessageObject = {
			address      : strNodeMessage.slice(0, indexOfFirstSpace),
			args         : [],
			origNodeArg  : argsMessagePart,
			props        : {},
			type         : 'osc-message-x32-extend',
			wasProcessed : false,
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
					oscMessageObject.args.push(this.#strToArg(currentArgValue))
				}
				currentArgValue = ''
			} else if ( thisChar === '"' ) {
				// quote, flip open status
				if ( quoteOpen && currentArgValue === '' ) {
					// catch empty strings
					oscMessageObject.args.push(this.#strToArg(currentArgValue))
				}
				quoteOpen = !quoteOpen
			} else {
				// add anything else to current
				currentArgValue += thisChar
			}
		}
		if ( currentArgValue !== '' ) {
			oscMessageObject.args.push(this.#strToArg(currentArgValue))
		}

		return this.#doArgs_node(oscMessageObject)
	}


	#doArgs_node(msgObj) {
		for ( const thisTestName of this.#activeTypes.node ) {
			if ( msgObj.address.match(data.node[thisTestName].regEx) ) {
				msgObj.wasProcessed  = true
				msgObj.props         = data.node[thisTestName].props(msgObj)
				msgObj.props.subtype = `node-${thisTestName}`
				break
			}
		}
		return msgObj
	}

	#doArgs_regular(msgObj) {
		for ( const thisTestName of this.#activeTypes.regular ) {
			if ( msgObj.address.match(data.regular[thisTestName].regEx) ) {
				msgObj.wasProcessed  = true
				msgObj.props         = data.regular[thisTestName].props(msgObj)
				msgObj.props.subtype = thisTestName
				break
			}
		}
		return msgObj
	}

	#strToArg( argString ) {
		// eslint-disable-next-line eqeqeq
		if ( parseInt(argString, 10) == argString && !argString.endsWith('.0')) { return { type : 'integer', value : parseInt(argString, 10) }}
		if ( argString.startsWith('%') ) {
			// eslint-disable-next-line unicorn/no-useless-spread
			return { type : 'bitmask', value : [...argString.slice(1)].map((x) => x === '1')}
		}
	
		return { type : 'string', value : argString }
	}
}

module.exports = {
	dB2Float           : dB2Float,
	float2dB           : float2dB,
	x32PreProcessor    : x32PreProcessor,
}
