const osc     = require('../index.js')
const osc_x32 = require('../x32.js')

const x32Pre = new osc_x32.x32PreProcessor({
	activeNodeTypes    : 'all',
	activeRegularTypes : 'all',
})

const oscX32 = new osc.simpleOscLib({
	strictMode   : true,
	preprocessor : (msg) => x32Pre.readMessage(msg),
})

describe('x32 extras - standard addresses', () => {
	test.each([
		['/-show/prepos/current', 1, 'integer', true, 2],
		['/-show/prepos', 1, 'integer', false, 0],
		['/bus/14/mix/fader', 0.4878, 'float', true, 4],
		['/dca/1/fader', 0.7498, 'float', true, 3],
		['/dca/1/on', 1, 'integer', true, 3],
		['/bus/08/mix/on', 1, 'integer', true, 4],
		['/bus/08/config/name', 'HEAD', 'string', true, 4],
		['/dca/1/config/name', 'TESTER', 'string', true, 3],
	])('extra process of X32 data (%s) [%s:%s]', (a, b, c, processMsg, sizeTest) => {
		const thisMessage = {
			address : a,
			args : [{ type : c, value : b }],
		}
		const builtMessage  = oscX32.buildMessage(thisMessage)
		const returnMessage = oscX32.readMessage(builtMessage)

		expect(returnMessage.wasProcessed).toEqual(processMsg)
		if ( returnMessage.wasProcessed ) {
			expect(Object.keys(returnMessage.props).length).toEqual(sizeTest)
		}
	})
})

