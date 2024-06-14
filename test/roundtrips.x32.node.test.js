const osc     = require('../index.js')
const osc_x32 = require('../x32.js')

const x32Pre = new osc_x32.x32PreProcessor({
	activeNodeTypes : 'all',
	activeRegularTypes : 'all',
})

const oscX32 = new osc.simpleOscLib({
	strictMode : true,
	preprocessor : (msg) => x32Pre.readMessage(msg),
})

describe('x32 node extras', () => {
	test.each([
		[2, 39, '/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"'],
		[7, 125, '/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 0 -1 -1 0 1 0 0'],
		[7, 124, '/-show/showfile/cue/001 1210 "Cue Idx1 Num1210" 0 1 -1 0 1 0 0'],
		[4, 60, '/-show/showfile/scene/001 "AAA" "aaa" %111111110 1'],
		[3, 49, '/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 '],
		[4, 124, '/dca/2 OFF   -32.5'],
		[3, 55, '/dca/2/config "THEATER" 1 RD'],
		[4, 68, '/bus/01/config "StgMon" 63 YEi'],
		[5, 135, '/bus/01/mix ON -11.0 OFF +0 OFF   -oo'],
		[5, 119, '/ch/01/mix OFF   -oo OFF +0 OFF   -oo'],
		[4, 63, '/ch/02/config "" 1 YE 2'],
		[4, 70, '/auxin/01/config "Q Main-L" 1 RD 33'],
		[5, 133, '/auxin/01/mix ON   0.0 ON -100 OFF   -oo'],
		[4, 68, '/mtx/01/config "SMAART" 72 RDi'],
		[5, 133, '/mtx/01/mix ON   0.0'],
		[2, 48, '/main/st/config "MainArray" 66 YEi'],
		[3, 110, '/main/st/mix ON   0.0 +0'],
		[3, 93, '/main/m/mix ON   -oo'],
		[2, 39, '/main/m/config "" 67 WH'],
	])('extra process of X32 data [keys:%i][size:%i] (%s)', (keys, byteLength, a) => {
		const thisMessage = {
			address : 'node',
			args : [{type : 'string', value : a}],
		}
		const builtMessage  = oscX32.buildMessage(thisMessage)
		const returnMessage = oscX32.readMessage(builtMessage)

		expect(returnMessage.wasProcessed).toEqual(true)
		expect(JSON.stringify(returnMessage.props).length).toEqual(byteLength)
		expect(Object.keys(returnMessage.props).length).toEqual(keys)
	})
})