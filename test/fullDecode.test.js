const osc     = require('../index.js')
const osc_x32 = require('../x32.js')

const oscRegular = new osc.simpleOscLib()

const x32Pre = new osc_x32.x32PreProcessor({
	activeNodeTypes : 'all',
	activeRegularTypes : 'all',
})

const oscX32 = new osc.simpleOscLib({
	strictMode : true,
	preprocessor : (msg) => x32Pre.readMessage(msg),
})

const roundTripRegular = [
	['/-show/prepos/current', 1, 'integer', 32, false],
	['/-show/prepos', 1, 'integer', 24, false],
	['/bus/14/mix/fader', 0.4878, 'float', 28, true],
	['/dca/1/fader', 0.7498, 'float', 24, true],
	['/dca/1/on', 1, 'integer', 20, true],
	['/bus/08/mix/on', 1, 'integer', 24, true],
	['/bus/08/config/name', 'HEAD', 'string', 32, true],
	['/dca/1/config/name', 'TESTER', 'string', 32, true],
]

const testNodeMessages = [
	[39, '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"'],
	[125, '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 0 -1 -1 0 1 0 0'],
	[124, '/-show/showfile/cue/001 1210 "Cue Idx1 Num1210" 0 1 -1 0 1 0 0'],
	[60, '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1'],
	[60, '/-show/showfile/scene/002 "BBB" "bbb" %000000010 1'],
	[49, '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 '],
	[124, '/dca/2 OFF   -32.5'],
	[55, '/dca/2/config "THEATER" 1 RD'],
	[102, '/dca/3 ON   -oo'],
	[50, '/dca/3/config "--" 1 RD'],
	[68, '/bus/01/config "StgMon" 63 YEi'],
	[135, '/bus/01/mix ON -11.0 OFF +0 OFF   -oo'],
	[119, '/ch/01/mix OFF   -oo OFF +0 OFF   -oo'],
	[63, '/ch/02/config "" 1 YE 2'],
	[70, '/auxin/01/config "Q Main-L" 1 RD 33'],
	[133, '/auxin/01/mix ON   0.0 ON -100 OFF   -oo'],
	[68, '/mtx/01/config "SMAART" 72 RDi'],
	[133, '/mtx/01/mix ON   0.0'],
	[48, '/main/st/config "MainArray" 66 YEi'],
	[110, '/main/st/mix ON   0.0 +0'],
	[93, '/main/m/mix ON   -oo'],
	[39, '/main/m/config "" 67 WH'],
]

const messageRoundTrip = []

for ( const thisTest of roundTripRegular ) {
	messageRoundTrip.push({
		msgObj : {
			address : thisTest[0],
			args : [
				{ type : thisTest[2], value : thisTest[1] }
			],
		},
		procTest : thisTest[4],
		sizeTest : thisTest[3],
	})
}

describe.skip('standard message build', () => {
	test.each(messageRoundTrip)('build osc buffer and check size ($sizeTest bytes)', ({msgObj, _b, sizeTest}) => {
		expect(oscRegular.buildMessage(msgObj).length).toEqual(sizeTest)
	})
})

describe.skip('x32 extras', () => {
	test.each(messageRoundTrip)('extra process of X32 data ($procTest)', ({msgObj, procTest}) => {
		const builtMessage = oscX32.buildMessage(msgObj)
		const returnMessage = oscX32.readMessage(builtMessage)

		expect(returnMessage.wasProcessed).toEqual(procTest)
	})
})


const nodeRoundTrip = []

for ( const thisTest of testNodeMessages ) {
	nodeRoundTrip.push({
		msgObj : {
			address : 'node',
			args : [
				{ type : 'string', value : thisTest[1] }
			],
		},
		sizeTest : thisTest[0],
	})
}

describe('x32 node extras', () => {
	test.each(nodeRoundTrip)('extra process of X32 data ($sizeTest)', ({msgObj, sizeTest}) => {
		const builtMessage = oscX32.buildMessage(msgObj)
		const returnMessage = oscX32.readMessage(builtMessage)

		expect(returnMessage.wasProcessed).toEqual(true)
		expect(JSON.stringify(returnMessage.props).length).toEqual(sizeTest)
	})
})