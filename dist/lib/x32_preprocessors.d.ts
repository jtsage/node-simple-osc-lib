export function dB2Float(db_in: any): number;
export function float2dB(f: any): string;
export declare namespace regular {
    namespace showCurrent {
        let regEx: RegExp;
        function props(msgObj: any): {
            index: any;
        };
    }
    namespace showMode {
        let regEx_1: RegExp;
        export { regEx_1 as regEx };
        export function props_1(msgObj: any): {
            index: number;
            name: string | undefined;
        };
        export { props_1 as props };
    }
    namespace auxLevel {
        let regEx_2: RegExp;
        export { regEx_2 as regEx };
        export function props_2(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_2 as props };
    }
    namespace auxMute {
        let regEx_3: RegExp;
        export { regEx_3 as regEx };
        export function props_3(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_3 as props };
    }
    namespace auxName {
        let regEx_4: RegExp;
        export { regEx_4 as regEx };
        export function props_4(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_4 as props };
    }
    namespace busLevel {
        let regEx_5: RegExp;
        export { regEx_5 as regEx };
        export function props_5(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_5 as props };
    }
    namespace busMute {
        let regEx_6: RegExp;
        export { regEx_6 as regEx };
        export function props_6(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_6 as props };
    }
    namespace busName {
        let regEx_7: RegExp;
        export { regEx_7 as regEx };
        export function props_7(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_7 as props };
    }
    namespace chanLevel {
        let regEx_8: RegExp;
        export { regEx_8 as regEx };
        export function props_8(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_8 as props };
    }
    namespace chanMute {
        let regEx_9: RegExp;
        export { regEx_9 as regEx };
        export function props_9(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_9 as props };
    }
    namespace chanName {
        let regEx_10: RegExp;
        export { regEx_10 as regEx };
        export function props_10(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_10 as props };
    }
    namespace dcaLevel {
        let regEx_11: RegExp;
        export { regEx_11 as regEx };
        export function props_11(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_11 as props };
    }
    namespace dcaMute {
        let regEx_12: RegExp;
        export { regEx_12 as regEx };
        export function props_12(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_12 as props };
    }
    namespace dcaName {
        let regEx_13: RegExp;
        export { regEx_13 as regEx };
        export function props_13(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_13 as props };
    }
    namespace mainLevel {
        let regEx_14: RegExp;
        export { regEx_14 as regEx };
        export function props_14(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_14 as props };
    }
    namespace mainMute {
        let regEx_15: RegExp;
        export { regEx_15 as regEx };
        export function props_15(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_15 as props };
    }
    namespace mainName {
        let regEx_16: RegExp;
        export { regEx_16 as regEx };
        export function props_16(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_16 as props };
    }
    namespace monoLevel {
        let regEx_17: RegExp;
        export { regEx_17 as regEx };
        export function props_17(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_17 as props };
    }
    namespace monoMute {
        let regEx_18: RegExp;
        export { regEx_18 as regEx };
        export function props_18(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_18 as props };
    }
    namespace monoName {
        let regEx_19: RegExp;
        export { regEx_19 as regEx };
        export function props_19(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_19 as props };
    }
    namespace mtxLevel {
        let regEx_20: RegExp;
        export { regEx_20 as regEx };
        export function props_20(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
        };
        export { props_20 as props };
    }
    namespace mtxMute {
        let regEx_21: RegExp;
        export { regEx_21 as regEx };
        export function props_21(msgObj: any): {
            index: number;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
            zIndex: any;
        };
        export { props_21 as props };
    }
    namespace mtxName {
        let regEx_22: RegExp;
        export { regEx_22 as regEx };
        export function props_22(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_22 as props };
    }
    namespace showCueDirty {
        let regEx_23: RegExp;
        export { regEx_23 as regEx };
        export function props_23(): {};
        export { props_23 as props };
    }
    namespace showSceneDirty {
        let regEx_24: RegExp;
        export { regEx_24 as regEx };
        export function props_24(): {};
        export { props_24 as props };
    }
    namespace showSnippetDirty {
        let regEx_25: RegExp;
        export { regEx_25 as regEx };
        export function props_25(): {};
        export { props_25 as props };
    }
}
export declare namespace node {
    export namespace auxMix {
        let regEx_26: RegExp;
        export { regEx_26 as regEx };
        export function props_26(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_26 as props };
    }
    export namespace auxName_1 {
        let regEx_27: RegExp;
        export { regEx_27 as regEx };
        export function props_27(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_27 as props };
    }
    export { auxName_1 as auxName };
    export namespace busMix {
        let regEx_28: RegExp;
        export { regEx_28 as regEx };
        export function props_28(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_28 as props };
    }
    export namespace busName_1 {
        let regEx_29: RegExp;
        export { regEx_29 as regEx };
        export function props_29(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_29 as props };
    }
    export { busName_1 as busName };
    export namespace dcaMix {
        let regEx_30: RegExp;
        export { regEx_30 as regEx };
        export function props_30(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_30 as props };
    }
    export namespace dcaName_1 {
        let regEx_31: RegExp;
        export { regEx_31 as regEx };
        export function props_31(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_31 as props };
    }
    export { dcaName_1 as dcaName };
    export namespace chanMix {
        let regEx_32: RegExp;
        export { regEx_32 as regEx };
        export function props_32(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_32 as props };
    }
    export namespace chanName_1 {
        let regEx_33: RegExp;
        export { regEx_33 as regEx };
        export function props_33(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_33 as props };
    }
    export { chanName_1 as chanName };
    export namespace mtxMix {
        let regEx_34: RegExp;
        export { regEx_34 as regEx };
        export function props_34(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_34 as props };
    }
    export namespace mtxName_1 {
        let regEx_35: RegExp;
        export { regEx_35 as regEx };
        export function props_35(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_35 as props };
    }
    export { mtxName_1 as mtxName };
    export namespace mainMix {
        let regEx_36: RegExp;
        export { regEx_36 as regEx };
        export function props_36(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_36 as props };
    }
    export namespace mainName_1 {
        let regEx_37: RegExp;
        export { regEx_37 as regEx };
        export function props_37(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_37 as props };
    }
    export { mainName_1 as mainName };
    export namespace monoMix {
        let regEx_38: RegExp;
        export { regEx_38 as regEx };
        export function props_38(msgObj: any): {
            index: number;
            level: {
                float: number;
                db: string;
            };
            zIndex: any;
            isOn: {
                bool: boolean;
                int: number;
                text: string;
            };
        };
        export { props_38 as props };
    }
    export namespace monoName_1 {
        let regEx_39: RegExp;
        export { regEx_39 as regEx };
        export function props_39(msgObj: any): {
            index: number;
            name: any;
            zIndex: any;
        };
        export { props_39 as props };
    }
    export { monoName_1 as monoName };
    export namespace showCurrent_1 {
        let regEx_40: RegExp;
        export { regEx_40 as regEx };
        export function props_40(msgObj: any): {
            index: any;
        };
        export { props_40 as props };
    }
    export { showCurrent_1 as showCurrent };
    export namespace showMode_1 {
        let regEx_41: RegExp;
        export { regEx_41 as regEx };
        export function props_41(msgObj: any): {
            index: number;
            name: string | undefined;
        };
        export { props_41 as props };
    }
    export { showMode_1 as showMode };
    export namespace showName {
        let regEx_42: RegExp;
        export { regEx_42 as regEx };
        export function props_42(msgObj: any): {
            name: any;
        };
        export { props_42 as props };
    }
    export namespace showCue {
        let regEx_43: RegExp;
        export { regEx_43 as regEx };
        export function props_43(msgObj: any): {
            cueNumber: string;
            cueScene: any;
            cueSkip: boolean;
            cueSnippet: any;
            index: number;
            name: any;
        };
        export { props_43 as props };
    }
    export namespace showScene {
        let regEx_44: RegExp;
        export { regEx_44 as regEx };
        export function props_44(msgObj: any): {
            index: number;
            name: any;
            note: any;
        };
        export { props_44 as props };
    }
    export namespace showSnippet {
        let regEx_45: RegExp;
        export { regEx_45 as regEx };
        export function props_45(msgObj: any): {
            index: number;
            name: any;
        };
        export { props_45 as props };
    }
}
//# sourceMappingURL=x32_preprocessors.d.ts.map