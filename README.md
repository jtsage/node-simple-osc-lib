# simple-osc-lib

![GitHub package.json version](https://img.shields.io/github/package-json/v/jtsage/node-simple-osc-lib) ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jtsage/node-simple-osc-lib/node.js.yml) ![Coverage](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjtsage%2Fnode-simple-osc-lib%2Fmain%2Fcoverage%2Fcoverage-summary.json&query=%24.total.lines.pct&suffix=%25&label=coverage)

This package provides some node.js utilities for working with [OSC](http://opensoundcontrol.org/), a format for sound and systems control.  

Here we implement the OSC 1.1 specification.  OSC is a transport-independent protocol, so we don't provide any server objects, as you should be able to use OSC over any transport you like.  The most common is probably udp, but tcp is not unheard of.

This package was heavily influenced by the [osc-min](https://github.com/russellmcc/node-osc-min) API

## Input types

+ `b` :: `blob` - node.js Buffer value (Buffer padded to 32 bit block with nulls)
+ `c` :: `char` - Character (Int32BE - 32 bits)
+ `d` :: `double` - numeric value (DoubleBE - 64 bits)
+ `F` :: `false` - no value (0 bits)
+ `f` :: `float` - numeric value (FloatBE - 32 bits)
+ `h` :: `bigint` - big integer
+ `I` :: `bang` - no value (0 bits)
+ `i` :: `integer` - numeric value (Int32BE - 32 bits)
+ `m` :: `midi` - 4-byte midi array
+ `N` :: `null` - no value (0 bits)
+ `r` :: `color` - rgbA as an array [R(0-255),G,B,A] (4 x UInt8 - 32 bits)
+ `s` :: `string` - string value (String padded to 32 bit block with nulls)
+ `T` :: `true` - no value (0 bits)

Note that `type` is always a string - i.e. `"true"` rather than `true`.

## Standard Usage

### Options

Packet, Message, and Bundles support a `strict` mode when reading `.fromBuffer()` that will fail on buffers that are not 4-byte padded. simple-osc-lib always creates strict packets.

### Build an OSC Single Message Buffer for sending

```javascript
const buffer = new OSCMessage(
    '/hello',
    [
        { type : 'string', value : 'hi' },
        OSCType.fromValue( 'there' ),
    ],
).buffer
```

### Build an OSC Bundle Buffer for sending

```javascript
const oscMessage1 = new OSCMessage( '/hello' )
const oscMessage2 = new OSCMessage( '/goodbye' )

// With a timetag 50ms into the future
const bundle = new OSCBundle(
    [oscMessage1, oscMessage2],
    '+50'
).buffer
```

Time tag can be a date, a number of seconds since epoch, a time tag array, a positive number of milliseconds in the future (`+###`), or the special value false/null (the date right now), or the special value true (immediate processing [0,1])

### Decode an OSC Packet from receiving

```javascript
const oscMessage = OSCPacket.fromBuffer(buffer)
```

Single message

```javascript
{
    address : '/goodbye',
    args: [
        OSCTypeString().value = 'cruel',
        OSCTypeString().value = 'world',
    ]
}
```

Bundle (note that bundles can be nested)

```javascript
{
    timetag  : OSCTimeTag.asDate, // Date object
    messages : [ /* zero or more osc-messages or osc-bundles */ ]
}
```

## timetag Processing of Bundles

This package provides no pre-processing for timetags - they are returned as found, in all circumstances.  The OSC 1.1 spec does not clarify the proper handling of timetags in the past, as different implementations do different things with them. A timetag in the past may mean the bundle should be discarded, or it may mean it should be acted on immediately - this behavior is left to your preference. Please do not assume a received timetag refers to a future event.

```javascript
if ( oscBundle.timeTag.sinceNow() < 100 ) {
    // Less than 100ms ago.
    // Positive values are "## milliseconds ago"
    // Negative values are "## milliseconds in the future"
}
```

## Changes since 1.x.x

```javascript
/// Removed the meta object
const oscRegular = new osc.simpleOscLib( /* options */)

/** Message Building */
/// OLD WAY
const buffer = oscRegular.buildMessage({
    address : '/hello',
    args    : [
        { type : 'string', value : 'hi' },
        { type : 'string', value : 'there' },
    ],
})

/// NEW WAY
const buffer = new OSCMessage(
    '/hello',
    [
        { type : 'string', value : 'hi' },
        OSCType.fromValue( 'there' ),
    ],
).buffer

/** Bundle Sending */

/// OLD WAY
const buffer = oscRegular.buildBundle({
    timetag : oscRegular.getTimeTagBufferFromDelta(0.5),
    elements : [oscMessage1, oscMessage2],
})

/// NEW WAY
const bundle = new OSCBundle(
    [oscMessage1, oscMessage2],
    '+500'
).buffer

```

Note that the type of return has changed on messages, bundles, and arguments.  Care has been taken to ensure that arguments still have the same `type` and `value` property they did in early versions.

&copy; 2026 J.T.Sage - ISC License
