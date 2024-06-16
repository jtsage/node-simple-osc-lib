/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 regular style OSC Messages */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const x32 = require('../lib/x32_preprocessors.js')

const osc     = require('../index.js')
const osc_x32 = require('../x32.js')

const x32Pre = new osc_x32.x32PreProcessor('all')

const oscX32 = new osc.simpleOscLib({
	strictMode   : true,
	preprocessor : (msg) => x32Pre.readMessage(msg),
})


const normalizedName = (faderName, stringIndex) => ({
	index  : parseInt(stringIndex),
	name   : faderName,
	zIndex : stringIndex,
})

const normalizeMute = (mute, fader) => ({
	index   : parseInt(fader),
	isOn    : {
		bool : mute,
		int  : Number(mute),
		text : mute ? 'ON' : 'OFF',
	},
	zIndex  : fader,
})

const normalizeLevel = (level, fader) => ({
	index   : parseInt(fader),
	level   : {
		float : expect.closeTo(level),
		db    : expect.any(String),
	},
	zIndex  : fader,
})

const knownMessages = [
	{
		message  : {
			address : '/-show/prepos/current',
			args    : [{ type : 'integer', value : 2}],
		},
		result   : {'index' : 2},
		testName : 'showCurrent',
	},
	{
		message  : {
			address : '/-prefs/show_control',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : {'index' : 0, 'name' : 'CUES'},
		testName : 'showMode',
	},


	{
		message  : {
			address : '/auxin/03/mix/fader',
			args    : [{ type : 'float', value : 0.7498}],
		},
		result   : normalizeLevel(0.7498, '03'),
		testName : 'auxLevel',
	},
	{
		message  : {
			address : '/auxin/03/mix/on',
			args    : [{ type : 'integer', value : 1}],
		},
		result   : normalizeMute(true, '03'),
		testName : 'auxMute',
	},
	{
		message  : {
			address : '/auxin/03/config/name',
			args    : [{ type : 'string', value : 'HELLO'}],
		},
		result   : normalizedName('HELLO', '03'),
		testName : 'auxName',
	},

	{
		message  : {
			address : '/bus/12/mix/fader',
			args    : [{ type : 'float', value : 0.0020}],
		},
		result   : normalizeLevel(0.0020, '12'),
		testName : 'busLevel',
	},
	{
		message  : {
			address : '/bus/12/mix/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '12'),
		testName : 'busMute',
	},
	{
		message  : {
			address : '/bus/12/config/name',
			args    : [{ type : 'string', value : ''}],
		},
		result   : normalizedName('', '12'),
		testName : 'busName',
	},

	{
		message  : {
			address : '/ch/12/mix/fader',
			args    : [{ type : 'float', value : 0.0020}],
		},
		result   : normalizeLevel(0.0020, '12'),
		testName : 'chanLevel',
	},
	{
		message  : {
			address : '/ch/12/mix/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '12'),
		testName : 'chanMute',
	},
	{
		message  : {
			address : '/ch/12/config/name',
			args    : [{ type : 'string', value : ''}],
		},
		result   : normalizedName('', '12'),
		testName : 'chanName',
	},

	{
		message  : {
			address : '/dca/6/fader',
			args    : [{ type : 'float', value : 0.0230}],
		},
		result   : normalizeLevel(0.0230, '6'),
		testName : 'dcaLevel',
	},
	{
		message  : {
			address : '/dca/6/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '6'),
		testName : 'dcaMute',
	},
	{
		message  : {
			address : '/dca/6/config/name',
			args    : [{ type : 'string', value : 'GOODBYE'}],
		},
		result   : normalizedName('GOODBYE', '6'),
		testName : 'dcaName',
	},


	{
		message  : {
			address : '/main/st/mix/fader',
			args    : [{ type : 'float', value : 0.7498}],
		},
		result   : normalizeLevel(0.7498, '0'),
		testName : 'mainLevel',
	},
	{
		message  : {
			address : '/main/st/mix/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '0'),
		testName : 'mainMute',
	},
	{
		message  : {
			address : '/main/st/config/name',
			args    : [{ type : 'string', value : 'MAIN'}],
		},
		result   : normalizedName('MAIN', '0'),
		testName : 'mainName',
	},

	{
		message  : {
			address : '/main/m/mix/fader',
			args    : [{ type : 'float', value : 0}],
		},
		result   : normalizeLevel(0, '0'),
		testName : 'monoLevel',
	},
	{
		message  : {
			address : '/main/m/mix/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '0'),
		testName : 'monoMute',
	},
	{
		message  : {
			address : '/main/m/config/name',
			args    : [{ type : 'string', value : 'center'}],
		},
		result   : normalizedName('center', '0'),
		testName : 'monoName',
	},

	{
		message  : {
			address : '/mtx/04/mix/fader',
			args    : [{ type : 'float', value : 0.0030}],
		},
		result   : normalizeLevel(0.0030, '04'),
		testName : 'mtxLevel',
	},
	{
		message  : {
			address : '/mtx/04/mix/on',
			args    : [{ type : 'integer', value : 0}],
		},
		result   : normalizeMute(false, '04'),
		testName : 'mtxMute',
	},
	{
		message  : {
			address : '/mtx/04/config/name',
			args    : [{ type : 'string', value : ''}],
		},
		result   : normalizedName('', '04'),
		testName : 'mtxName',
	},

	{
		message  : {
			address : '/-show/showfile/snippet/010/name',
			args    : [{ type : 'string', value : 'HI'}],
		},
		result   : {},
		testName : 'showSnippetDirty',
	},
	{
		message  : {
			address : '/-show/showfile/scene/010/name',
			args    : [{ type : 'string', value : 'HI'}],
		},
		result   : {},
		testName : 'showSceneDirty',
	},
	{
		message  : {
			address : '/-show/showfile/cue/010/name',
			args    : [{ type : 'string', value : 'HI'}],
		},
		result   : {},
		testName : 'showCueDirty',
	},
]

describe('read standard x32 messages', () => {
	describe.each(knownMessages)('test $testName :: $message.address', ({message, testName, result}) => {
		test('regex works', () => {
			expect(x32.regular[testName].regEx.test(message.address)).toEqual(true)
		})
		test('props result as expected', () => {
			expect(x32.regular[testName].props(message)).toEqual(result)
		})
		const builtMessage  = oscX32.buildMessage(message)
		const returnMessage = oscX32.readMessage(builtMessage)

		test('roundtrip processed', () => {
			expect(returnMessage.wasProcessed).toEqual(true)
		})
		test('roundtrip props result as expected', () => {
			expect(returnMessage.props).toEqual({...result, subtype : testName})
		})
	})
})


test('roundtrip unprocessed standard x32 message', () => {
	const thisMessage = {
		address : '/-show/prepos',
		args    : [{ type : 'integer', value : 2}],
	}

	const builtMessage  = oscX32.buildMessage(thisMessage)
	const returnMessage = oscX32.readMessage(builtMessage)

	expect(returnMessage.wasProcessed).toEqual(false)
	expect(returnMessage.props).not.toBeDefined()

})

test('skip malformed ocs message (null)', () => {
	expect(x32Pre.readMessage(null)).toEqual(null)
})
test('skip malformed ocs message (string)', () => {
	expect(x32Pre.readMessage('hi')).toEqual('hi')
})
test('skip malformed ocs message (no address)', () => {
	expect(x32Pre.readMessage({ hi : 'bye' })).toEqual({ hi : 'bye' })
})
test('skip malformed ocs message (empty address)', () => {
	expect(x32Pre.readMessage({ address : '' })).toEqual({ address : '' })
})
