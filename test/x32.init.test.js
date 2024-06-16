/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - X32 Preprocessor Initialization */

if ( require.main === module ) {
	const path = require('node:path')
	const scriptName = path.basename(__filename).replace('.test.js', '')
	process.stdout.write(`part of the jest test suite, try "npm test ${scriptName}" instead.\n`)
	process.exit(1)
}

const osc_x32 = require('../x32.js')

const totalNodeTypes    = 20
const totalRegularTypes = 26

const testConstructors = [
	{
		fail   : false,
		output : { node : totalNodeTypes, regular : totalRegularTypes },
	},
	{
		fail   : false,
		input  : null,
		output : { node : totalNodeTypes, regular : totalRegularTypes },
	},
	{
		fail   : false,
		input  : ['*'],
		output : { node : totalNodeTypes, regular : totalRegularTypes },
	},
	{
		fail   : false,
		input  : 'ALL',
		output : { node : totalNodeTypes, regular : totalRegularTypes },
	},
	{
		fail   : false,
		input  : ['dca*'],
		output : { node : 2, regular : 3 },
	},
	{
		fail   : false,
		input  : 'dca*',
		output : { node : 2, regular : 3 },
	},
	{
		fail   : false,
		input  : ['dcaName', 'dcaLevel'],
		output : { node : 1, regular : 2 },
	},
	{
		fail   : true,
		input  : 12,
		output : null,
	},
	{
		fail   : true,
		input  : { hi : 'there' },
		output : null,
	},
	{
		fail   : true,
		input  : ['badValue'],
		output : null,
	},
]

describe.each(testConstructors)('init X32 preprocessor with "$input"', ({fail, input, output}) => {
	if ( fail ) {
		test('throw exception', () => {
			expect(() => new osc_x32.x32PreProcessor(input)).toThrow(TypeError)
		})
	} else {
		const preProc = new osc_x32.x32PreProcessor(input)
		test(`expect ${output.node} node types`, () => {
			expect(preProc.getActiveTypes().node.size).toEqual(output.node)
		})
		test(`expect ${output.regular} regular types`, () => {
			expect(preProc.getActiveTypes().regular.size).toEqual(output.regular)
		})
	}
})
