# simple-osc-lib

_simple library for open sound control in node.js_

This package provides some node.js utilities for working with [OSC](http://opensoundcontrol.org/), a format for sound and systems control.  
Here we implement the [OSC 1.1][spec11] specification.  OSC is a transport-independent protocol, so we don't provide any server objects, as you should be able to use OSC over any transport you like.  The most common is probably udp, but tcp is not unheard of.

[spec11]: http://opensoundcontrol.org/spec-1_1

Heavily influenced by [osc-min](https://github.com/russellmcc/node-osc-min)

----

## Installation

The easiest way to get osc-min is through [NPM](http://npmjs.org).

After install npm, you can install osc-min in the current directory with

```shell
npm install simple-osc-lib
```

----

## Examples

### CJS Module

```javascript
const osc = require('simple-osc-lib')
```

### OSC Message Format (from you to OSC)

```javascript
osc.oscBuildMessage({
    address : '/hello',
    args    : [
        { type : 'string', value : 'hi' },
        { type : 'string', value : 'there' },
    ],
})
```

### OSC Bundle Format (from you to OSC)

```javascript
const oscMessage1 = {
    address : '/hello',
    args    : [
        { type : 'string', value : 'hi' },
        { type : 'string', value : 'there' },
    ],
}
const oscMessage2 = {
    address : '/goodbye',
    args    : [
        { type : 'string', value : 'cruel' },
        { type : 'string', value : 'world' },
    ],
}

// Half a second in the future
const timeTag = osc.generateTimeTagFromDelta(0.5)

osc.oscBuildBundle({
    timetag : timeTag,
    elements : [oscMessage1, oscMessage2],
})
```

### OSC Mesasge Format (from OSC to you)

```javascript
osc.oscReadPacket(buffer)
```

Single message

```json
{
    "type": "osc-message",
    "address": "/goodbye",
    "args": [
        { "type": "string", "value": "cruel" },
        { "type": "string", "value": "world" }
    ]
}
```

Bundle (note that bundles can be nested)

```javascript
{
  type     : 'osc-bundle',
  timetag  : //[date Object],
  elements : [ /* zero or more osc-messages or osc-bundles */ ]
}
```

----

## Exported functions

See [API.md](API.md)

----

## Types handled

+ `s` :: `string` - string value
+ `f` :: `float` - numeric value (32bit float)
+ `d` :: `double` - numeric value (64bit float)
+ `i` :: `integer` - numeric value (32bit signed)
+ `b` :: `blob` - node.js Buffer value
+ `T` :: `true` - value is null
+ `F` :: `false` - value is null
+ `N` :: `null` - value is null
+ `I` :: `bang` - value is null
+ `r` :: `color` - RGBA as an array [R(0-255),G,B,A]
+ `c` :: `char` - Character (32bit signed, ASCII only)
+ `t` :: `timetag` - numeric value (64bit)
+ `array` - array of _OSC Arguments_ - cannot be passed to constructor, use arrays on your data structure instead

Note that `type` is always a string - i.e. `"true"` rather than `true`.

----

## Differences from osc-min

+ no support for the message translation stuff
+ no support for parameter guessing (explicit arguments only)
+ added `c`, `r` data types
+ zero-dependency package
