# X32 OSC Processor

This exists more as a how-to-use guide to the simple-osc-lib package than anything, although it is mature enough to be used in projects.

## Covered Messages

The following are the messages that this module "understands"

### Standard OSC Messages by subtype

+ __showCurrent__ :: /-show/prepos/current
+ __showMode__ :: /-prefs/show_control
+ __auxLevel__ :: /auxin/[##]/mix/fader
+ __auxMute__ :: /auxin/[##]/mix/on
+ __auxName__ :: /auxin/[##]/config/name
+ __busLevel__ :: /bus/[##]/mix/fader
+ __busMute__ :: /bus/[##]/mix/on
+ __busName__ :: /bus/[##]/config/name
+ __chanLevel__ :: /ch/[##]/mix/fader
+ __chanMute__ :: /ch/[##]/mix/on
+ __chanName__ :: /ch/[##]/config/name
+ __dcaLevel__ :: /dca/[#]/fader
+ __dcaMute__ :: /dca/[#]/on
+ __dcaName__ :: /dca/[#]/config/name
+ __mainLevel__ :: /main/st/mix/fader
+ __mainMute__ :: /main/st/mix/on
+ __mainName__ :: /main/st/config/name
+ __monoLevel__ :: /main/m/mix/fader
+ __monoMute__ :: /main/m/mix/on
+ __monoName__ :: /main/m/config/name
+ __mtxLevel__ :: /mtx/[##]/mix/fader
+ __mtxMute__ :: /mtx/[##]/mix/on
+ __mtxName__ :: /mtx/[##]/config/name
+ __showCueDirty__ :: /-show/showfile/cue/[###]//
+ __showSceneDirty__ :: /-show/showfile/scene/[###]/name
+ __showSnippetDirty__ :: /-show/showfile/snippet/[###]/name

### `node` OSC Messages by subtype

+ __auxMix__ :: node /auxin/[##]/mix
+ __auxName__ :: node /auxin/[##]/config
+ __busMix__ :: node /bus/[##]/mix
+ __busName__ :: node /bus/[##]/config
+ __dcaMix__ :: node /dca/[#]
+ __dcaName__ :: node /dca/[#]/config
+ __chanMix__ :: node /ch/[##]/mix
+ __chanName__ :: node /ch/[##]/config
+ __mtxMix__ :: node /mtx/[##]/mix
+ __mtxName__ :: node /mtx/[##]/config
+ __mainMix__ :: node /main/st/mix
+ __mainName__ :: node /main/st/config
+ __monoMix__ :: node /main/m/mix
+ __monoName__ :: node /main/m/config
+ __showCurrent__ :: node /-show/prepos/current
+ __showMode__ :: node /-prefs/show_control
+ __showName__ :: node /-show/showfile/show
+ __showCue__ :: node /-show/showfile/cue/[###]
+ __showScene__ :: node /-show/showfile/scene/[###]
+ __showSnippet__ :: node /-show/showfile/snippet/[###]


## How to use

Very simple implementation - stick it between getting back an OSCMessage and dispatching to the next step in your application.  Something like

```typescript
import { X32Processor } from 'node-simple-osc-lib/x32'

// You can override the search scope (param 1),
// or the tests run (param2), or set "hardFail"
// which will throw an error instead returning
// null on non-matched messages
const processor = new X32Processor()

const msg = OSCMessage.fromBuffer( dataBuffer )

// Returns null or one of the classes in `types.ts`
// Does not handle bundles (error or null)
const results = X32Processor( msg )
```

### Fader Results

Fader results are stored in one of `X32FaderUpdateLevel`, `X32FaderUpdateMix`, `X32FaderUpdateMix` or `X32FaderUpdateName` classes.  They all inherit the same interface

```typescript

const x = new X32FaderUpdateName( 'dca', 1, 'hello' )

console.log( x.index )  // 1
console.log( x.zIndex ) // '01'
console.log( x.scope )  // 'dca'

if ( x.hasMute() ) { // X32FaderUpdateMix and X32FaderUpdateMix
    console.log( x.onBool ) // false | true (on)
    console.log( x.onInt )  // 0 | 1 (on)
    console.log( x.onText ) // "OFF" | "ON"
}
if ( x.hasLevel() ) { // X32FaderUpdateMix and X32FaderUpdateLevel
    console.log( x.level )   // as float
    console.log( x.levelDb ) // '-oo dB', '+0.0 dB', etc
}
if ( x.hasName() ) { // X32FaderUpdateName only
    console.log( x.name ) // 'hello'
}
