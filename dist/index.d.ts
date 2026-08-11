/**
 * Simple OSC communication for nodeJS
 * @module simple-osc-lib
 */
declare const uNULL: "\0";
export class OSCSyntaxError extends Error {
    constructor(message: any, opts: any);
}
export class simpleOscLib {
    /**
     * @param {object}  options                - simple-osc-lib options.
     * @param {Boolean} options.asciiOnly      - Limit strings to ASCII characters.
     * @param {String}  options.blockCharacter - Character to delineate 4-byte blocks in debug output (or '')
     * @param {String}  options.debugCharacter - Character to replace NULLs in debug output.
     * @param {String}  options.preprocessor   - osc-message processor
     * @param {Boolean} options.strictAddress  - Use strict address mode (all string rules, must begin with slash).
     * @param {Boolean} options.strictMode     - Use strict mode.
     */
    constructor(options: {
        asciiOnly: boolean;
        blockCharacter: string;
        debugCharacter: string;
        preprocessor: string;
        strictAddress: boolean;
        strictMode: boolean;
    });
    options: null;
    uNull: string;
    /**
     * Encode an OSC Data chunk - low level function
     * @param {String} type OSC Data type string/char
     * @param {*} value Value for data (must be null for null types)
     * @returns {Buffer} buffer padded to 32-bit blocks with NULLs
     */
    encodeBufferChunk(type: string, value: any): Buffer;
    /**
     * Decode an OSC Data chunk - low level function
     * @param {String} type OSC Data type
     * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
     * @returns {Object} Contains the type, value, and unused portion of the buffer
     */
    decodeBufferChunk(type: string, buffer_in: Buffer): Object;
    getTimeTagArrayFromUnknownType(value: any): any[];
    getTimeTagArrayFromSeconds(seconds: any): number[];
    /**
     * Get a date object from a timetag array
     * @param {Array} timetag 2 element array for a timetag [unix seconds, fractional seconds]
     * @returns {Date}
     */
    getDateFromTimeTagArray(timetag: any[]): Date;
    /**
     * Resolve a character type into the human readable name
     * @param {String} type single character type
     * @returns {String}
     */
    getTypeStringFromChar(type: string): string;
    /**
     * Resolve a type from a character or string with error checking
     * @param {String} type character type string or single character
     * @returns {String}
     */
    getTypeCharFromStringOrChar(type: string): string;
    /**
     * Generate a timetag buffer from a timestamp
     * @param {Number} number timestamp (from epoch)
     * @returns {Buffer} 8 byte / 32 bit buffer
     */
    getTimeTagBufferFromTimestamp(number: number): Buffer;
    /**
     * Generate a timetag buffer from a date instance
     * @param {Date} date javascript date instance
     * @returns {Buffer} 8 byte / 32 bit buffer
     */
    getTimeTagBufferFromDate(date: Date): Buffer;
    /**
     * Generate a timetag buffer for [seconds] in the future
     * @param {Number} seconds seconds in the future
     * @param {Number|null} now point to calculate from (in ms!!)
     * @returns {Buffer} 8 byte / 32 bit buffer
     */
    getTimeTagBufferFromDelta(seconds: number, now?: number | null): Buffer;
    /**
     * Format a buffer for console.log()
     * @param {Buffer} buffer_in buffer
     * @param {String} rep_char Character to replace nulls in buffer
     * @param {String} blockChar Character to delineate 4-byte blocks in buffer (or '')
     * @returns {String}
     */
    printableBuffer(buffer_in: Buffer, replacementCharacter?: null, fourByteMarkerCharacter?: null, skipSize?: null): string;
    /**
     * Build an OSC message buffer
     *
     * `address` is a required key, containing the destination address
     *
     * `args` is an array of objects of { type : 'type', value : value }
     *
     * @param {object} oscMessageObject osc message object
     * @returns {Buffer} 4 byte chunked buffer
     */
    buildMessage(oscMessageObject: object): Buffer;
    /**
     * Build an OSC bundle buffer
     *
     * `timetag` is a required key, containing a timetag buffer
     *
     * `elements` can contain objects to be passed to oscBuildMessage or
     * pre-prepared buffers padded to 32-bit blocks with NULLs
     *
     * @param {object} oscBundleObject osc bundle object
     * @returns {Buffer} 4 byte chunked buffer
     */
    buildBundle(oscBundleObject: object): Buffer;
    /**
     * Decode an OSC packet.  Useful for when the client might send bundles or messages
     * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
     * @returns {Object} osc-bundle object or osc-message object
     */
    readPacket(buffer_in: Buffer): Object;
    /**
     * Decode an OSC bundle
     * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
     * @returns {Object} osc-bundle object
     */
    readBundle(buffer_in: Buffer): Object;
    /**
     * Decode a single OSC message.
     * @param {Buffer} buffer_in buffer padded to 32-bit blocks with NULLs
     * @param {Object} options options
     * @param {Object} options.strictMode use strict mode
     * @param {Object} options.messageCallback callback to run on each message
     * @returns {Object} osc-message object
     */
    readMessage(buffer_in: Buffer): Object;
    /**
     * Readdress an existing message, including the old address as the first or last string argument
     *
     * Callback details
     *
     * The callback takes a function that receives the following parameters
     * + newAddressBuffer <Buffer> new destination
     * + oldAddressBuffer <Buffer> original address as a string buffer
     * + argumentList <Array> original argument list
     * + argumentBuffer <Buffer> existing argument buffer.
     *
     * This should return a valid osc buffer.  To simply redirect the existing to a new address you could do something like
     * ```javascript
     * function redirectCallback(newAddressBuffer, _oldAddressBuffer, argumentList, argumentBuffer) {
     *     return Buffer.concat([
     *         newAddressBuffer,
     *         oscLibInstance.encodeToBuffer('s', `,${argumentList.join('')}`),
     *         argumentBuffer
     *     ])
     * }
     * ```
     * @param {Buffer} buffer_in original message buffer
     * @param {String} newAddress address for the new message
     * @param {Function} callBack callback to apply - must return a buffer
     * @returns Buffer
     */
    redirectMessage(buffer_in: Buffer, newAddress: string, callBack: Function): any;
    /**
     * Build an osc message in a chainable way.
     *
     * Chainable methods available - for more complex messages, use buildMessage
     *
     * ```javascript
     * myMessage
     *     .i(20)
     *     .integer(20)
     *     .f(1.0)
     *     .float(1.0)
     *     .s('hello')
     *     .string('world')
     *     .b(buffer)
     *     .blob(buffer)
     * ```
     *
     * To get a transmittable buffer, call `myMessage.toBuffer()`
     *
     * To get a human readable version of the buffer, call `myMessage.toString()`
     * @param {String} address address to send to
     * @returns oscBuilder instance
     * @example
     * const myBuffer = oscLib.messageBuilder('/hello').integer(10).float(2.0).string('world').toBuffer()
     */
    messageBuilder(address: string): oscBuilder;
    #private;
}
declare class oscBuilder {
    constructor(oscLib: any, address: any);
    toString(): any;
    toBuffer(): any;
    i(value: any): this;
    integer(value: any): this;
    f(value: any): this;
    float(value: any): this;
    s(value: any): this;
    string(value: any): this;
    b(value: any): this;
    blob(value: any): this;
    #private;
}
export { uNULL as null };
//# sourceMappingURL=index.d.ts.map