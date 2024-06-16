/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 node style OSC Messages */

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
const normalizedMix = (isOn, level, stringIndex) => ({
	index : parseInt(stringIndex),
	isOn  : {
		text : isOn ? 'ON': 'OFF',
		bool : isOn,
		int  : Number(isOn),
	},
	level : {
		db   : `${level} dB`,
		float : expect.any(Number),
	},
	zIndex : stringIndex,
})

const knownNodeMessages = [
	{
		arg       : '/auxin/01/config "Q Main-L" 1 RD 33',
		msgResult : { address : '/auxin/01/config', argLength : 4 },
		result    : normalizedName('Q Main-L', '01'),
		testName  : 'auxName',
	},
	{
		arg       : '/auxin/01/mix ON   0.0 ON -100 OFF   -oo',
		msgResult : { address : '/auxin/01/mix', argLength : 6 },
		result    : normalizedMix(true, '0.0', '01'),
		testName  : 'auxMix',
	},

	{
		arg       : '/bus/01/config "StgMon" 63 YEi',
		msgResult : { address : '/bus/01/config', argLength : 3 },
		result    : normalizedName('StgMon', '01'),
		testName  : 'busName',
	},
	{
		arg       : '/bus/01/mix ON -11.0 OFF +0 OFF   -oo',
		msgResult : { address : '/bus/01/mix', argLength : 6 },
		result    : normalizedMix(true, '-11.0', '01'),
		testName  : 'busMix',
	},

	{
		arg       : '/dca/2/config "THEATER" 1 RD',
		msgResult : { address : '/dca/2/config', argLength : 3 },
		result    : normalizedName('THEATER', '2'),
		testName  : 'dcaName',
	},
	{
		arg       : '/dca/2 OFF   -32.5',
		msgResult : { address : '/dca/2', argLength : 2 },
		result    : normalizedMix(false, '-32.5', '2'),
		testName  : 'dcaMix',
	},
	
	{
		arg       : '/ch/02/config "" 1 YE 2',
		msgResult : { address : '/ch/02/config', argLength : 4 },
		result    : normalizedName('', '02'),
		testName  : 'chanName',
	},
	{
		arg       : '/ch/01/mix OFF   -oo OFF +0 OFF   -oo',
		msgResult : { address : '/ch/01/mix', argLength : 6 },
		result    : normalizedMix(false, '-oo', '01'),
		testName  : 'chanMix',
	},

	{
		arg       : '/mtx/01/config "SMAART" 72 RDi',
		msgResult : { address : '/mtx/01/config', argLength : 3 },
		result    : normalizedName('SMAART', '01'),
		testName  : 'mtxName',
	},
	{
		arg       : '/mtx/01/mix ON   0.0',
		msgResult : { address : '/mtx/01/mix', argLength : 2 },
		result    : normalizedMix(true, '0.0', '01'),
		testName  : 'mtxMix',
	},

	{
		arg       : '/main/st/config "MainArray" 66 YEi',
		msgResult : { address : '/main/st/config', argLength : 3 },
		result    : normalizedName('MainArray', '0'),
		testName  : 'mainName',
	},
	{
		arg       : '/main/st/mix ON   0.0 +0',
		msgResult : { address : '/main/st/mix', argLength : 3 },
		result    : normalizedMix(true, '0.0', '0'),
		testName  : 'mainMix',
	},

	{
		arg       : '/main/m/config "" 67 WH',
		msgResult : { address : '/main/m/config', argLength : 3 },
		result    : normalizedName('', '0'),
		testName  : 'monoName',
	},
	{
		arg       : '/main/m/mix ON   -oo',
		msgResult : { address : '/main/m/mix', argLength : 2 },
		result    : normalizedMix(true, '-oo', '0'),
		testName  : 'monoMix',
	},
	
	{
		arg       : '/-show/prepos/current -1',
		msgResult : { address : '/-show/prepos/current', argLength : 1 },
		result    : { index : -1 },
		testName  : 'showCurrent',
	},
	{
		arg       : '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"',
		msgResult : { address : '/-show/showfile/show', argLength : 12 },
		result    : { name : 'MyShow' },
		testName  : 'showName',
	},
	{
		arg       : '/-prefs/show_control SCENES',
		msgResult : { address : '/-prefs/show_control', argLength : 1 },
		result    : {'index' : 1, 'name' : 'SCENES'},
		testName  : 'showMode',
	},

	{
		arg       : '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 1 1 -1 0 1 0 0',
		msgResult : { address : '/-show/showfile/cue/000', argLength : 9 },
		result    : {
			cueNumber  : '12.0.0',
			cueScene   : 1,
			cueSkip    : true,
			cueSnippet : -1,
			index      : 0,
			name       : 'Cue Idx0 Num1200',
		},
		testName  : 'showCue',
	},
	{
		arg       : '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1',
		msgResult : { address : '/-show/showfile/scene/001', argLength : 4 },
		result    : {
			index : 1,
			name  : 'AAA',
			note  : 'aaa',
		},
		testName  : 'showScene',
	},
	{
		arg       : '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 ',
		msgResult : { address : '/-show/showfile/snippet/000', argLength : 6 },
		result    : {
			index : 0,
			name  : 'Aaa',
		},
		testName  : 'showSnippet',
	},
]

describe.each(knownNodeMessages)('Test node message ($arg) ($testName)', ({arg, msgResult, result, testName}) => {
	const decodedMessage = x32Pre.processNodeMessage(arg)

	test(`subtype ${testName}`, () => {
		expect(decodedMessage.props.subtype).toEqual(testName)
	})

	test(`osc address ${msgResult.address}`, () => {
		expect(decodedMessage.address).toEqual(msgResult.address)
	})

	test(`osc arg length ${msgResult.argLength}`, () => {
		expect(decodedMessage.args.length).toEqual(msgResult.argLength)
	})

	test('props result as expected', () => {
		expect(x32.node[testName].props(decodedMessage)).toEqual(result)
	})

	const builtMessage  = oscX32.buildMessage({ address : 'node', args : [{ type : 'string', value : arg }]})
	const returnMessage = oscX32.readMessage(builtMessage)

	test('roundtrip processed', () => {
		expect(returnMessage.wasProcessed).toEqual(true)
	})
	test('roundtrip props result as expected', () => {
		expect(returnMessage.props).toEqual({...result, subtype : testName})
	})
})

// test('roundtrip unprocessed standard x32 message', () => {
// 	const thisMessage = {
// 		address : '/-show/prepos',
// 		args    : [{ type : 'integer', value : 2}],
// 	}

// 	const builtMessage  = oscX32.buildMessage(thisMessage)
// 	const returnMessage = oscX32.readMessage(builtMessage)

// 	expect(returnMessage.wasProcessed).toEqual(false)
// 	expect(returnMessage.props).not.toBeDefined()

// })
