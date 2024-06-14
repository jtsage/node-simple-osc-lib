const osc  = require('../index.js')

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('expected output from builder', () => {
	test('two strings with nested array (bang)', () => {
		const oscMessage = {
			address : '/hello',
			args    : [
				[[
					{type : 'bang', value : null },
		
				]],
				{ type : 'string', value : 'hi' },
				{ type : 'string', value : 'there' },
			],
		}
		const expected = Buffer.from(`/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}`)
		expect(oscRegular.buildMessage(oscMessage)).toEqual(expected)
	})

	test('fail on mismatched array read', () => {
		const input = Buffer.from(`/hello${osc.null}${osc.null},[[I]ss${osc.null}${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}${osc.null}`)
		expect(() => oscRegular.readMessage(input)).toThrow(osc.OSCSyntaxError)
	})

	test('fail on incorrect buffer length (strict)', () => {
		const input = Buffer.from(`/hello${osc.null}${osc.null},[[I]]ss${osc.null}${osc.null}${osc.null}${osc.null}hi${osc.null}${osc.null}there${osc.null}${osc.null}`)
		expect(() => oscStrict.readMessage(input)).toThrow(osc.OSCSyntaxError)
	})
	
})
