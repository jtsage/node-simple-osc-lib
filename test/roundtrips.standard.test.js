const osc     = require('../index.js')

const oscRegular = new osc.simpleOscLib()

describe('standard message build', () => {
	test.each([
		['/-show/prepos/current', 1, 'integer', 32],
		['/-show/prepos', 1, 'integer', 24],
		['/bus/14/mix/fader', 0.4878, 'float', 28],
		['/dca/1/fader', 0.7498, 'float', 24],
		['/dca/1/on', 1, 'integer', 20],
		['/bus/08/mix/on', 1, 'integer', 24],
		['/bus/08/config/name', 'HEAD', 'string', 32],
		['/dca/1/config/name', 'TESTER', 'string', 32],
	])('build osc buffer (%s) [%s:%s] and check size (%i bytes)', (a, b, c, expected) => {
		const thisMessage = {
			address : a,
			args : [{type : c, value : b}],
		}
		expect(oscRegular.buildMessage(thisMessage).length).toEqual(expected)
	})
})

