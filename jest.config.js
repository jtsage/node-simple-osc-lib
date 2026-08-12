// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createDefaultPreset } = require('ts-jest')

const tsJestTransformCfg = createDefaultPreset().transform

// /** @type {import("jest").Config} **/
module.exports = {
	coverageReporters : [
		'json-summary',
		'text',
		'html',
	],
	errorOnDeprecated : true,
	testEnvironment : 'node',
	transform : {
		...tsJestTransformCfg,
	},
	verbose : false,
}