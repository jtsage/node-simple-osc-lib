const strToArg = (argString) => {
	// eslint-disable-next-line eqeqeq
	if ( parseInt(argString, 10) == argString ) { return { type : 'integer', value : parseInt(argString, 10) }}
	if ( argString.startsWith('%') ) {
		// eslint-disable-next-line unicorn/no-useless-spread
		return { type : 'bitmask', value : [...argString.slice(1)].map((x) => x === '1')}
	}

	return { type : 'string', value : argString }
}
const getIndex = (address) => parseInt(address.slice(address.lastIndexOf('/')+1), 10)
const getCueNum = (num) => {
	const x = num.toString()
	return `${x.slice(0, x.length-2)}.${x.slice(-2, -1)}.${x.slice(-1)}`
}

const unwrapArgs = (msgObj) => {
	if ( msgObj.address === '/-show/showfile/show' ) {
		msgObj.props.subType = 'show'
		msgObj.props.name   = msgObj.args[0].value
	} else if ( msgObj.address.match(/\/-show\/showfile\/cue\/\d{3}/) ) {
		msgObj.props.subType    = 'cue'
		msgObj.props.name       = msgObj.args[1].value
		msgObj.props.index      = getIndex(msgObj.address)
		msgObj.props.cueNumber  = getCueNum(msgObj.args[0].value)
		msgObj.props.cueSkip    = Boolean(msgObj.args[2].value)
		msgObj.props.cueScene   = msgObj.args[3].value
		msgObj.props.cueSnippet = msgObj.args[4].value
	} else if ( msgObj.address.match(/\/-show\/showfile\/scene\/\d{3}/) ) {
		msgObj.props.subType    = 'cue'
		msgObj.props.name       = msgObj.args[0].value
		msgObj.props.note       = msgObj.args[1].value
		msgObj.props.index      = getIndex(msgObj.address)
	} else if ( msgObj.address.match(/\/-show\/showfile\/snippet\/\d{3}/) ) {
		msgObj.props.subType    = 'cue'
		msgObj.props.name       = msgObj.args[0].value
		msgObj.props.index      = getIndex(msgObj.address)
	}
	return msgObj
}
const processNodeMessage = (strNodeMessage) => {
	const indexOfFirstSpace = strNodeMessage.indexOf(' ')
	const argsMessagePart   = strNodeMessage.slice(indexOfFirstSpace+1)
	const oscMessageObject = {
		address : strNodeMessage.slice(0, indexOfFirstSpace),
		args    : [],
		origArg : argsMessagePart,
		type    : 'osc-message-x32-node',

		props   : {
			cueNumber  : null,
			cueScene   : null,
			cueSkip    : null,
			cueSnippet : null,
			index      : null,
			name       : null,
			note       : null,
			subType    : null,
		},
	}

	let quoteOpen = false
	let currentArgValue = ''
	for ( const thisChar of argsMessagePart) {
		if ( thisChar === ' ' && quoteOpen ) {
			// space, open quotes, add to variable value
			currentArgValue += thisChar
		} else if ( thisChar === ' ' && !quoteOpen ) {
			// space, closed quotes, commit variable
			oscMessageObject.args.push(strToArg(currentArgValue))
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

	return unwrapArgs(oscMessageObject)
}

module.exports.processNodeMessage = processNodeMessage
