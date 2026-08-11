/**
 * Extended processing for Behringer X32/M32 consoles.
 * This provides some override and pre-processing tools
 * to make it easier to work with the style of OSC messages
 * the Behringer uses.
 * @module simple-osc-lib/x32
 */
/**
 * Convert a string or number decibel representation to a floating point number
 * @param {String|Number} db_in string or float representation of decibel level +10->-90
 * @returns {Number} floating point representation of decibel level 0->1
 */
export const dB2Float: (db_in: any) => number;
/**
 * Convert floating point 0->1 to decibel level
 * @param {Number} f 0->1 floating point level
 * @returns {String} text level [+/-##.# dB]
 */
export const float2dB: (f: any) => string;
export class x32PreProcessor {
    /**
     * @param {object}  options                    - x32 Preprocessor options.
     * @param {Boolean} options.activeNodeTypes    - Active node message preprocessors from lib/x32_preprocessors (or 'all')
     * @param {String}  options.activeRegularTypes - Active regular message preprocessors from lib/x32_preprocessors (or 'all')
     */
    constructor(activeTypeList?: null);
    getActiveTypes(): {
        node: Set<any>;
        regular: Set<any>;
    };
    /**
     * This is the processor for X32 style messages
     *
     * @param {Object} oscMessage an OSC message object
     * @returns {Object} an OSC message object with additional data
     * @example
     * const osc     = require('simple-osc-lib')
     * const osc_x32 = require('simple-osc-lib/x32')
     *
     * const x32Pre = new osc_x32.x32PreProcessor('all')
     * // or a list of types or wildcards.
     * //  + dca*, bus*, mtx*, main*, mono*, show*, aux*, chan*
     * //  + dcaLevel, dcaName, dcaMix, dcaMute etc.
     * // see source for full listing.
     *
     * const oscRegular = new osc.simpleOscLib({
     *     preprocessor : (msg) => x32Pre.readMessage(msg),
     * })
     */
    readMessage(oscMessage: Object): Object;
    processRegularMessage(oscMessage: any): any;
    processNodeMessage(strNodeMessage: any): any;
    #private;
}
//# sourceMappingURL=x32.d.ts.map