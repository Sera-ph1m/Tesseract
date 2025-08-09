// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { events } from "../global/Events";
import { Deque } from "./Deque";
import { EnvelopeComputer } from './EnvelopeComputer';
import { inverseRealFourierTransform, scaleElementsByFactor } from "./FFT";
import { DynamicBiquadFilter, FilterCoefficients, FrequencyResponse } from "./filtering";
import { FilterSettings } from './FilterSettings';
import { Instrument } from './Instrument';
import { InstrumentState } from './InstrumentState';
import { Pattern } from './Pattern';
import { PickedString } from './PickedString';
import { Song } from './Song';
import { Chord, Config, Dictionary, DictionaryArray, EffectType, Envelope, EnvelopeComputeIndex, EnvelopeType, FilterType, GranularEnvelopeType, InstrumentType, Transition, drawNoiseSpectrum, effectsIncludeBitcrusher, effectsIncludeChorus, effectsIncludeDetune, effectsIncludeDiscreteSlide, effectsIncludeDistortion, effectsIncludeEcho, effectsIncludeGranular, effectsIncludeNoteFilter, effectsIncludePanning, effectsIncludePitchShift, effectsIncludeReverb, /*effectsIncludeNoteRange,*/ effectsIncludeRingModulation, effectsIncludeVibrato, getArpeggioPitchIndex, getDrumWave, getPulseWidthRatio, performIntegralOld } from "./SynthConfig";
import { Tone } from './Tone';

declare global {
    interface Window {
        AudioContext: any;
        webkitAudioContext: any;
    }
}

export const songTagNameMap: { [key: number]: string } = {
	[CharCode.a]: "beatCount",
	[CharCode.b]: "bars",
	[CharCode.c]: "songEq",
	[CharCode.d]: "fadeInOut",
	[CharCode.e]: "loopEnd",
	[CharCode.f]: "eqFilter",
	[CharCode.g]: "barCount",
	[CharCode.h]: "unison",
	[CharCode.i]: "instrumentCount",
	[CharCode.j]: "patternCount",
	[CharCode.k]: "key",
	[CharCode.l]: "loopStart",
	[CharCode.m]: "reverb",
	[CharCode.n]: "channelCount",
	[CharCode.o]: "channelOctave",
	[CharCode.p]: "patterns",
	[CharCode.q]: "effects",
	[CharCode.r]: "rhythm",
	[CharCode.s]: "scale",
	[CharCode.t]: "tempo",
	[CharCode.u]: "preset",
	[CharCode.v]: "volume",
	[CharCode.w]: "wave",
	[CharCode.x]: "supersaw",
	[CharCode.y]: "loopControls",
	[CharCode.z]: "drumsetEnvelopes",
	[CharCode.A]: "algorithm",
	[CharCode.B]: "feedbackAmplitude",
	[CharCode.C]: "chord",
	[CharCode.D]: "detune",
	[CharCode.E]: "envelopes",
	[CharCode.F]: "feedbackType",
	[CharCode.G]: "arpeggioSpeed",
	[CharCode.H]: "harmonics",
	[CharCode.I]: "stringSustain",
	[CharCode.L]: "pan",
	[CharCode.M]: "customChipWave",
	[CharCode.N]: "songTitle",
	[CharCode.O]: "limiterSettings",
	[CharCode.P]: "operatorAmplitudes",
	[CharCode.Q]: "operatorFrequencies",
	[CharCode.R]: "operatorWaves",
	[CharCode.S]: "spectrum",
	[CharCode.T]: "startInstrument",
	[CharCode.U]: "channelNames",
	[CharCode.V]: "feedbackEnvelope",
	[CharCode.W]: "pulseWidth",
	[CharCode.X]: "aliases",
    [CharCode.Y]: "channelTags",
};

export function getSongTagName(charCode: number): string {  // export to shut up the compiler
	return songTagNameMap[charCode] || "Unknown";
}

export class URLDebugger {
	private static _active: boolean = false;
	private static _log: any[] = [];
	private static _url: string = "";

	public static start(url: string): void {
		this._active = true;
		this._log = [];
		this._url = url;
		console.log("URL Debugger Activated.");
	}

	public static log(tag: string, tagName: string, startIndex: number, endIndex: number, value: any): void {
		if (!this._active) return;
		this._log.push({ tag, tagName, value, raw: this._url.substring(startIndex, endIndex), indices: `${startIndex} - ${endIndex}` });
	}

	public static end(): void {
		if (!this._active) return;
		console.log("URL Parsing Finished. Log:");
		console.table(this._log);
		this._active = false;
	}
}

export const epsilon: number = (1.0e-24); // For detecting and avoiding float denormals, which have poor performance.

// For performance debugging:
//let samplesAccumulated: number = 0;
//let samplePerformance: number = 0;

export function clamp(min: number, max: number, val: number): number {
    max = max - 1;
    if (val <= max) {
        if (val >= min) return val;
        else return min;
    } else {
        return max;
    }
}

export function validateRange(min: number, max: number, val: number): number {
    if (min <= val && val <= max) return val;
    throw new Error(`Value ${val} not in range [${min}, ${max}]`);
}

export function parseFloatWithDefault<T>(s: string, defaultValue: T): number | T {
    let result: number | T = parseFloat(s);
    if (Number.isNaN(result)) result = defaultValue;
    return result;
}

export function parseIntWithDefault<T>(s: string, defaultValue: T): number | T {
    let result: number | T = parseInt(s);
    if (Number.isNaN(result)) result = defaultValue;
    return result;
}

export function encode32BitNumber(buffer: number[], x: number): void {
    // 0b11_
    buffer.push(base64IntToCharCode[(x >>> (6 * 5)) & 0x3]);
    //      111111_
    buffer.push(base64IntToCharCode[(x >>> (6 * 4)) & 0x3f]);
    //             111111_
    buffer.push(base64IntToCharCode[(x >>> (6 * 3)) & 0x3f]);
    //                    111111_
    buffer.push(base64IntToCharCode[(x >>> (6 * 2)) & 0x3f]);
    //                           111111_
    buffer.push(base64IntToCharCode[(x >>> (6 * 1)) & 0x3f]);
    //                                  111111
    buffer.push(base64IntToCharCode[(x >>> (6 * 0)) & 0x3f]);
}

// @TODO: This is error-prone, because the caller has to remember to increment
// charIndex by 6 afterwards.
export function decode32BitNumber(compressed: string, charIndex: number): number {
    let x: number = 0;
    // 0b11_
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 5);
    //      111111_
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 4);
    //             111111_
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 3);
    //                    111111_
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 2);
    //                           111111_
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 1);
    //                                  111111
    x |= base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << (6 * 0);
    return x;
}

export function encodeUnisonSettings(buffer: number[], v: number, s: number, o: number, e: number, i: number): void {
    // TODO: make these sign bits more efficient (bundle them together)
    buffer.push(base64IntToCharCode[v]);

    // TODO: make these use bitshifts instead for consistency
    buffer.push(base64IntToCharCode[Number((s > 0))]);
    let cleanS = Math.round(Math.abs(s) * 1000);
    let cleanSDivided = Math.floor(cleanS / 63);
    buffer.push(base64IntToCharCode[cleanS % 63], base64IntToCharCode[cleanSDivided % 63], base64IntToCharCode[Math.floor(cleanSDivided / 63)]);

    buffer.push(base64IntToCharCode[Number((o > 0))]);
    let cleanO = Math.round(Math.abs(o) * 1000);
    let cleanODivided = Math.floor(cleanO / 63);
    buffer.push(base64IntToCharCode[cleanO % 63], base64IntToCharCode[cleanODivided % 63], base64IntToCharCode[Math.floor(cleanODivided / 63)]);

    buffer.push(base64IntToCharCode[Number((e > 0))]);
    let cleanE = Math.round(Math.abs(e) * 1000);
    buffer.push(base64IntToCharCode[cleanE % 63], base64IntToCharCode[Math.floor(cleanE / 63)]);

    buffer.push(base64IntToCharCode[Number((i > 0))]);
    let cleanI = Math.round(Math.abs(i) * 1000);
    buffer.push(base64IntToCharCode[cleanI % 63], base64IntToCharCode[Math.floor(cleanI / 63)]);
}

export function convertLegacyKeyToKeyAndOctave(rawKeyIndex: number): [number, number] {
    let key: number = clamp(0, Config.keys.length, rawKeyIndex);
    let octave: number = 0;
    // This conversion code depends on C through B being
    // available as keys, of course.
    if (rawKeyIndex === 12) {
        // { name: "C+", isWhiteKey: false, basePitch: 24 }
        key = 0;
        octave = 1;
    } else if (rawKeyIndex === 13) {
        // { name: "G- (actually F#-)", isWhiteKey: false, basePitch: 6 }
        key = 6;
        octave = -1;
    } else if (rawKeyIndex === 14) {
        // { name: "C-", isWhiteKey: true, basePitch: 0 }
        key = 0;
        octave = -1;
    } else if (rawKeyIndex === 15) {
        // { name: "oh no (F-)", isWhiteKey: true, basePitch: 5 }
        key = 5;
        octave = -1;
    }
    return [key, octave];
}

export const enum CharCode {
    SPACE = 32,
    HASH = 35,
    PERCENT = 37,
    AMPERSAND = 38,
    PLUS = 43,
    DASH = 45,
    DOT = 46,
    NUM_0 = 48,
    NUM_1 = 49,
    NUM_2 = 50,
    NUM_3 = 51,
    NUM_4 = 52,
    NUM_5 = 53,
    NUM_6 = 54,
    NUM_7 = 55,
    NUM_8 = 56,
    NUM_9 = 57,
    EQUALS = 61,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    UNDERSCORE = 95,
    a = 97,
    b = 98,
    c = 99,
    d = 100,
    e = 101,
    f = 102,
    g = 103,
    h = 104,
    i = 105,
    j = 106,
    k = 107,
    l = 108,
    m = 109,
    n = 110,
    o = 111,
    p = 112,
    q = 113,
    r = 114,
    s = 115,
    t = 116,
    u = 117,
    v = 118,
    w = 119,
    x = 120,
    y = 121,
    z = 122,
    LEFT_CURLY_BRACE = 123,
    RIGHT_CURLY_BRACE = 125,
}

export const enum SongTagCode {
    beatCount = CharCode.a, // added in BeepBox URL version 2
    bars = CharCode.b, // added in BeepBox URL version 2
    songEq = CharCode.c, // added in BeepBox URL version 2 for vibrato, switched to song eq in Slarmoo's Box 1.3
    fadeInOut = CharCode.d, // added in BeepBox URL version 3 for transition, switched to fadeInOut in 9
    loopEnd = CharCode.e, // added in BeepBox URL version 2
    eqFilter = CharCode.f, // added in BeepBox URL version 3
    barCount = CharCode.g, // added in BeepBox URL version 3
    unison = CharCode.h, // added in BeepBox URL version 2
    instrumentCount = CharCode.i, // added in BeepBox URL version 3
    patternCount = CharCode.j, // added in BeepBox URL version 3
    key = CharCode.k, // added in BeepBox URL version 2
    loopStart = CharCode.l, // added in BeepBox URL version 2
    reverb = CharCode.m, // added in BeepBox URL version 5, DEPRECATED
    channelCount = CharCode.n, // added in BeepBox URL version 6
    channelOctave = CharCode.o, // added in BeepBox URL version 3
    patterns = CharCode.p, // added in BeepBox URL version 2
    effects = CharCode.q, // added in BeepBox URL version 7
    rhythm = CharCode.r, // added in BeepBox URL version 2
    scale = CharCode.s, // added in BeepBox URL version 2
    tempo = CharCode.t, // added in BeepBox URL version 2
    preset = CharCode.u, // added in BeepBox URL version 7
    volume = CharCode.v, // added in BeepBox URL version 2
    wave = CharCode.w, // added in BeepBox URL version 2
    supersaw = CharCode.x, // added in BeepBox URL version 9 ([UB] was used for chip wave but is now DEPRECATED)
    loopControls = CharCode.y, // added in BeepBox URL version 7, DEPRECATED, [UB] repurposed for chip wave loop controls
    drumsetEnvelopes = CharCode.z, // added in BeepBox URL version 7 for filter envelopes, still used for drumset envelopes
    algorithm = CharCode.A, // added in BeepBox URL version 6
    feedbackAmplitude = CharCode.B, // added in BeepBox URL version 6
    chord = CharCode.C, // added in BeepBox URL version 7, DEPRECATED
    detune = CharCode.D, // added in JummBox URL version 3(?) for detune, DEPRECATED
    envelopes = CharCode.E, // added in BeepBox URL version 6 for FM operator envelopes, repurposed in 9 for general envelopes.
    feedbackType = CharCode.F, // added in BeepBox URL version 6
    arpeggioSpeed = CharCode.G, // added in JummBox URL version 3 for arpeggioSpeed, DEPRECATED
    harmonics = CharCode.H, // added in BeepBox URL version 7
    stringSustain = CharCode.I, // added in BeepBox URL version 9
    //	                    = CharCode.J,
    //	                    = CharCode.K,
    pan = CharCode.L, // added between 8 and 9, DEPRECATED
    customChipWave = CharCode.M, // added in JummBox URL version 1(?) for customChipWave
    songTitle = CharCode.N, // added in JummBox URL version 1(?) for songTitle
    limiterSettings = CharCode.O, // added in JummBox URL version 3(?) for limiterSettings
    operatorAmplitudes = CharCode.P, // added in BeepBox URL version 6
    operatorFrequencies = CharCode.Q, // added in BeepBox URL version 6
    operatorWaves = CharCode.R, // added in JummBox URL version 4 for operatorWaves
    spectrum = CharCode.S, // added in BeepBox URL version 7
    startInstrument = CharCode.T, // added in BeepBox URL version 6
    channelNames = CharCode.U, // added in JummBox URL version 4(?) for channelNames
    feedbackEnvelope = CharCode.V, // added in BeepBox URL version 6, DEPRECATED
    pulseWidth = CharCode.W, // added in BeepBox URL version 7
    aliases = CharCode.X, // added in JummBox URL version 4 for aliases, DEPRECATED, [UB] repurposed for PWM decimal offset (DEPRECATED as well)
    channelTags = CharCode.Y,
    //	                    = CharCode.Z,
    //	                    = CharCode.NUM_0,
    //	                    = CharCode.NUM_1,
    //	                    = CharCode.NUM_2,
    //	                    = CharCode.NUM_3,
    //	                    = CharCode.NUM_4,
    //	                    = CharCode.NUM_5,
    //	                    = CharCode.NUM_6,
    //	                    = CharCode.NUM_7,
    //	                    = CharCode.NUM_8,
    //	                    = CharCode.NUM_9,
    //	                    = CharCode.DASH,
    //	                    = CharCode.UNDERSCORE,

}
export const base64IntToCharCode: ReadonlyArray<number> = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 45, 95];
export const base64CharCodeToInt: ReadonlyArray<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 62, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 0, 0, 0, 0, 63, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 0, 0, 0]; // 62 could be represented by either "-" or "." for historical reasons. New songs should use "-".

export class BitFieldReader {
    private _bits: number[] = [];
    private _readIndex: number = 0;

    constructor(source: string, startIndex: number, stopIndex: number) {
        for (let i: number = startIndex; i < stopIndex; i++) {
            const value: number = base64CharCodeToInt[source.charCodeAt(i)];
            this._bits.push((value >> 5) & 0x1);
            this._bits.push((value >> 4) & 0x1);
            this._bits.push((value >> 3) & 0x1);
            this._bits.push((value >> 2) & 0x1);
            this._bits.push((value >> 1) & 0x1);
            this._bits.push(value & 0x1);
        }
    }

    public read(bitCount: number): number {
        let result: number = 0;
        while (bitCount > 0) {
            result = result << 1;
            result += this._bits[this._readIndex++];
            bitCount--;
        }
        return result;
    }

    public readLongTail(minValue: number, minBits: number): number {
        let result: number = minValue;
        let numBits: number = minBits;
        while (this._bits[this._readIndex++]) {
            result += 1 << numBits;
            numBits++;
        }
        while (numBits > 0) {
            numBits--;
            if (this._bits[this._readIndex++]) {
                result += 1 << numBits;
            }
        }
        return result;
    }

    public readPartDuration(): number {
        return this.readLongTail(1, 3);
    }

    public readLegacyPartDuration(): number {
        return this.readLongTail(1, 2);
    }

    public readPinCount(): number {
        return this.readLongTail(1, 0);
    }

    public readPitchInterval(): number {
        if (this.read(1)) {
            return -this.readLongTail(1, 3);
        } else {
            return this.readLongTail(1, 3);
        }
    }
}

export class BitFieldWriter {
    private _index: number = 0;
    private _bits: number[] = [];

    public clear() {
        this._index = 0;
    }

    public write(bitCount: number, value: number): void {
        bitCount--;
        while (bitCount >= 0) {
            this._bits[this._index++] = (value >>> bitCount) & 1;
            bitCount--;
        }
    }

    public writeLongTail(minValue: number, minBits: number, value: number): void {
        if (value < minValue) throw new Error("value out of bounds");
        value -= minValue;
        let numBits: number = minBits;
        while (value >= (1 << numBits)) {
            this._bits[this._index++] = 1;
            value -= 1 << numBits;
            numBits++;
        }
        this._bits[this._index++] = 0;
        while (numBits > 0) {
            numBits--;
            this._bits[this._index++] = (value >>> numBits) & 1;
        }
    }

    public writePartDuration(value: number): void {
        this.writeLongTail(1, 3, value);
    }

    public writePinCount(value: number): void {
        this.writeLongTail(1, 0, value);
    }

    public writePitchInterval(value: number): void {
        if (value < 0) {
            this.write(1, 1); // sign
            this.writeLongTail(1, 3, -value);
        } else {
            this.write(1, 0); // sign
            this.writeLongTail(1, 3, value);
        }
    }

    public concat(other: BitFieldWriter): void {
        for (let i: number = 0; i < other._index; i++) {
            this._bits[this._index++] = other._bits[i];
        }
    }

    public encodeBase64(buffer: number[]): number[] {
        let tempIndex: number = this._index;
        // Pad with zeros to make the array length a multiple of 6.
        while (tempIndex % 6 != 0) {
            this._bits[tempIndex++] = 0;
        }
        for (let i: number = 0; i < tempIndex; i += 6) {
            const value: number = (this._bits[i] << 5) | (this._bits[i + 1] << 4) | (this._bits[i + 2] << 3) | (this._bits[i + 3] << 2) | (this._bits[i + 4] << 1) | this._bits[i + 5];
            buffer.push(base64IntToCharCode[value]);
        }
        return buffer;
    }

    public lengthBase64(): number {
        return Math.ceil(this._index / 6);
    }
}

export interface NotePin {
    interval: number;
    time: number;
    size: number;
}


export interface ChannelTag {
    id: string;
    name: string;
    startChannel: number;
    endChannel: number;
}


export function makeNotePin(interval: number, time: number, size: number): NotePin {
    return { interval: interval, time: time, size: size };
}

export class Note {
    public pitches: number[];
    public pins: NotePin[];
    public start: number;
    public end: number;
    public continuesLastPattern: boolean;
    public chipWaveStartOffset: number;

    public constructor(pitch: number, start: number, end: number, size: number, fadeout: boolean = false, chipWaveStartOffset: number = 0) {
        this.pitches = [pitch];
        this.pins = [makeNotePin(0, 0, size), makeNotePin(0, end - start, fadeout ? 0 : size)];
        this.start = start;
        this.end = end;
        this.continuesLastPattern = false;
        this.chipWaveStartOffset = chipWaveStartOffset;
    }

    public pickMainInterval(): number {
        let longestFlatIntervalDuration: number = 0;
        let mainInterval: number = 0;
        for (let pinIndex: number = 1; pinIndex < this.pins.length; pinIndex++) {
            const pinA: NotePin = this.pins[pinIndex - 1];
            const pinB: NotePin = this.pins[pinIndex];
            if (pinA.interval == pinB.interval) {
                const duration: number = pinB.time - pinA.time;
                if (longestFlatIntervalDuration < duration) {
                    longestFlatIntervalDuration = duration;
                    mainInterval = pinA.interval;
                }
            }
        }
        if (longestFlatIntervalDuration == 0) {
            let loudestSize: number = 0;
            for (let pinIndex: number = 0; pinIndex < this.pins.length; pinIndex++) {
                const pin: NotePin = this.pins[pinIndex];
                if (loudestSize < pin.size) {
                    loudestSize = pin.size;
                    mainInterval = pin.interval;
                }
            }
        }
        return mainInterval;
    }

    public clone(): Note {
        const newNote: Note = new Note(-1, this.start, this.end, 3);
        newNote.pitches = this.pitches.concat();
        newNote.pins = [];
        for (const pin of this.pins) {
            newNote.pins.push(makeNotePin(pin.interval, pin.time, pin.size));
        }
        newNote.continuesLastPattern = this.continuesLastPattern;
        newNote.chipWaveStartOffset = this.chipWaveStartOffset;
        return newNote;
    }

    public getEndPinIndex(part: number): number {
        let endPinIndex: number;
        for (endPinIndex = 1; endPinIndex < this.pins.length - 1; endPinIndex++) {
            if (this.pins[endPinIndex].time + this.start > part) break;
        }
        return endPinIndex;
    }
}

export class Operator {
    public frequency: number = 4;
    public amplitude: number = 0;
    public waveform: number = 0;
    public pulseWidth: number = 0.5;

    constructor(index: number) {
        this.reset(index);
    }

    public reset(index: number): void {
        this.frequency = 4; //defualt to 1x
        this.amplitude = (index <= 1) ? Config.operatorAmplitudeMax : 0;
        this.waveform = 0;
        this.pulseWidth = 5;
    }

    public copy(other: Operator): void {
        this.frequency = other.frequency;
        this.amplitude = other.amplitude;
        this.waveform = other.waveform;
        this.pulseWidth = other.pulseWidth;
    }
}

export class CustomAlgorithm {
    public name: string = "";
    public carrierCount: number = 0;
    public modulatedBy: number[][] = [[], [], [], [], [], []];
    public associatedCarrier: number[] = [];

    constructor() {
        this.fromPreset(1);
    }

    public set(carriers: number, modulation: number[][]) {
        this.reset();
        this.carrierCount = carriers;
        for (let i = 0; i < this.modulatedBy.length; i++) {
            this.modulatedBy[i] = modulation[i];
            if (i < carriers) {
                this.associatedCarrier[i] = i + 1;
            }
            this.name += (i + 1);
            for (let j = 0; j < modulation[i].length; j++) {
                this.name += modulation[i][j];
                if (modulation[i][j] > carriers - 1) {
                    this.associatedCarrier[modulation[i][j] - 1] = i + 1;
                }
                this.name += ",";
            }
            if (i < carriers) {
                this.name += "|";
            } else {
                this.name += ".";
            }
        }
    }

    public reset(): void {
        this.name = ""
        this.carrierCount = 1;
        this.modulatedBy = [[2, 3, 4, 5, 6], [], [], [], [], []];
        this.associatedCarrier = [1, 1, 1, 1, 1, 1];
    }

    public copy(other: CustomAlgorithm): void {
        this.name = other.name;
        this.carrierCount = other.carrierCount;
        this.modulatedBy = other.modulatedBy;
        this.associatedCarrier = other.associatedCarrier;
    }

    public fromPreset(other: number): void {
        this.reset();
        let preset = Config.algorithms6Op[other]
        this.name = preset.name;
        this.carrierCount = preset.carrierCount;
        for (var i = 0; i < preset.modulatedBy.length; i++) {
            this.modulatedBy[i] = Array.from(preset.modulatedBy[i]);
            this.associatedCarrier[i] = preset.associatedCarrier[i];
        }
    }
}

export class CustomFeedBack { //feels redunant
    public name: string = "";
    public indices: number[][] = [[], [], [], [], [], []];

    constructor() {
        this.fromPreset(1);
    }

    public set(inIndices: number[][]) {
        this.reset();
        for (let i = 0; i < this.indices.length; i++) {
            this.indices[i] = inIndices[i];
            for (let j = 0; j < inIndices[i].length; j++) {
                this.name += inIndices[i][j];
                this.name += ",";
            }
            this.name += ".";
        }
    }

    public reset(): void {
        this.reset;
        this.name = "";
        this.indices = [[1], [], [], [], [], []];
    }

    public copy(other: CustomFeedBack): void {
        this.name = other.name;
        this.indices = other.indices;
    }

    public fromPreset(other: number): void {
        this.reset();
        let preset = Config.feedbacks6Op[other]
        for (var i = 0; i < preset.indices.length; i++) {
            this.indices[i] = Array.from(preset.indices[i]);
            for (let j = 0; j < preset.indices[i].length; j++) {
                this.name += preset.indices[i][j];
                this.name += ",";
            }
            this.name += ".";
        }
    }
}

export class SpectrumWave {
    public spectrum: number[] = [];
    public hash: number = -1;

    constructor(isNoiseChannel: boolean) {
        this.reset(isNoiseChannel);
    }

    public reset(isNoiseChannel: boolean): void {
        for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
            if (isNoiseChannel) {
                this.spectrum[i] = Math.round(Config.spectrumMax * (1 / Math.sqrt(1 + i / 3)));
            } else {
                const isHarmonic: boolean = i == 0 || i == 7 || i == 11 || i == 14 || i == 16 || i == 18 || i == 21 || i == 23 || i >= 25;
                this.spectrum[i] = isHarmonic ? Math.max(0, Math.round(Config.spectrumMax * (1 - i / 30))) : 0;
            }
        }
        this.markCustomWaveDirty();
    }

    public markCustomWaveDirty(): void {
        const hashMult: number = Synth.fittingPowerOfTwo(Config.spectrumMax + 2) - 1;
        let hash: number = 0;
        for (const point of this.spectrum) hash = ((hash * hashMult) + point) >>> 0;
        this.hash = hash;
    }
}

export class SpectrumWaveState {
    public wave: Float32Array | null = null;
    private _hash: number = -1;

    public getCustomWave(settings: SpectrumWave, lowestOctave: number): Float32Array {
        if (this._hash == settings.hash) return this.wave!;
        this._hash = settings.hash;

        const waveLength: number = Config.spectrumNoiseLength;
        if (this.wave == null || this.wave.length != waveLength + 1) {
            this.wave = new Float32Array(waveLength + 1);
        }
        const wave: Float32Array = this.wave;

        for (let i: number = 0; i < waveLength; i++) {
            wave[i] = 0;
        }

        const highestOctave: number = 14;
        const falloffRatio: number = 0.25;
        // Nudge the 2/7 and 4/7 control points so that they form harmonic intervals.
        const pitchTweak: number[] = [0, 1 / 7, Math.log2(5 / 4), 3 / 7, Math.log2(3 / 2), 5 / 7, 6 / 7];
        function controlPointToOctave(point: number): number {
            return lowestOctave + Math.floor(point / Config.spectrumControlPointsPerOctave) + pitchTweak[(point + Config.spectrumControlPointsPerOctave) % Config.spectrumControlPointsPerOctave];
        }

        let combinedAmplitude: number = 1;
        for (let i: number = 0; i < Config.spectrumControlPoints + 1; i++) {
            const value1: number = (i <= 0) ? 0 : settings.spectrum[i - 1];
            const value2: number = (i >= Config.spectrumControlPoints) ? settings.spectrum[Config.spectrumControlPoints - 1] : settings.spectrum[i];
            const octave1: number = controlPointToOctave(i - 1);
            let octave2: number = controlPointToOctave(i);
            if (i >= Config.spectrumControlPoints) octave2 = highestOctave + (octave2 - highestOctave) * falloffRatio;
            if (value1 == 0 && value2 == 0) continue;

            combinedAmplitude += 0.02 * drawNoiseSpectrum(wave, waveLength, octave1, octave2, value1 / Config.spectrumMax, value2 / Config.spectrumMax, -0.5);
        }
        if (settings.spectrum[Config.spectrumControlPoints - 1] > 0) {
            combinedAmplitude += 0.02 * drawNoiseSpectrum(wave, waveLength, highestOctave + (controlPointToOctave(Config.spectrumControlPoints) - highestOctave) * falloffRatio, highestOctave, settings.spectrum[Config.spectrumControlPoints - 1] / Config.spectrumMax, 0, -0.5);
        }

        inverseRealFourierTransform(wave, waveLength);
        scaleElementsByFactor(wave, 5.0 / (Math.sqrt(waveLength) * Math.pow(combinedAmplitude, 0.75)));

        // Duplicate the first sample at the end for easier wrap-around interpolation.
        wave[waveLength] = wave[0];

        return wave;
    }
}

export class HarmonicsWave {
    public harmonics: number[] = [];
    public hash: number = -1;

    constructor() {
        this.reset();
    }

    public reset(): void {
        for (let i: number = 0; i < Config.harmonicsControlPoints; i++) {
            this.harmonics[i] = 0;
        }
        this.harmonics[0] = Config.harmonicsMax;
        this.harmonics[3] = Config.harmonicsMax;
        this.harmonics[6] = Config.harmonicsMax;
        this.markCustomWaveDirty();
    }

    public markCustomWaveDirty(): void {
        const hashMult: number = Synth.fittingPowerOfTwo(Config.harmonicsMax + 2) - 1;
        let hash: number = 0;
        for (const point of this.harmonics) hash = ((hash * hashMult) + point) >>> 0;
        this.hash = hash;
    }
}

export class HarmonicsWaveState {
    public wave: Float32Array | null = null;
    private _hash: number = -1;
    private _generatedForType: InstrumentType;

    public getCustomWave(settings: HarmonicsWave, instrumentType: InstrumentType): Float32Array {
        if (this._hash == settings.hash && this._generatedForType == instrumentType) return this.wave!;
        this._hash = settings.hash;
        this._generatedForType = instrumentType;

        const harmonicsRendered: number = (instrumentType == InstrumentType.pickedString) ? Config.harmonicsRenderedForPickedString : Config.harmonicsRendered;

        const waveLength: number = Config.harmonicsWavelength;
        const retroWave: Float32Array = getDrumWave(0, null, null);

        if (this.wave == null || this.wave.length != waveLength + 1) {
            this.wave = new Float32Array(waveLength + 1);
        }
        const wave: Float32Array = this.wave;

        for (let i: number = 0; i < waveLength; i++) {
            wave[i] = 0;
        }

        const overallSlope: number = -0.25;
        let combinedControlPointAmplitude: number = 1;

        for (let harmonicIndex: number = 0; harmonicIndex < harmonicsRendered; harmonicIndex++) {
            const harmonicFreq: number = harmonicIndex + 1;
            let controlValue: number = harmonicIndex < Config.harmonicsControlPoints ? settings.harmonics[harmonicIndex] : settings.harmonics[Config.harmonicsControlPoints - 1];
            if (harmonicIndex >= Config.harmonicsControlPoints) {
                controlValue *= 1 - (harmonicIndex - Config.harmonicsControlPoints) / (harmonicsRendered - Config.harmonicsControlPoints);
            }
            const normalizedValue: number = controlValue / Config.harmonicsMax;
            let amplitude: number = Math.pow(2, controlValue - Config.harmonicsMax + 1) * Math.sqrt(normalizedValue);
            if (harmonicIndex < Config.harmonicsControlPoints) {
                combinedControlPointAmplitude += amplitude;
            }
            amplitude *= Math.pow(harmonicFreq, overallSlope);

            // Multiply all the sine wave amplitudes by 1 or -1 based on the LFSR
            // retro wave (effectively random) to avoid egregiously tall spikes.
            amplitude *= retroWave[harmonicIndex + 589];

            wave[waveLength - harmonicFreq] = amplitude;
        }

        inverseRealFourierTransform(wave, waveLength);

        // Limit the maximum wave amplitude.
        const mult: number = 1 / Math.pow(combinedControlPointAmplitude, 0.7);
        for (let i: number = 0; i < wave.length; i++) wave[i] *= mult;

        performIntegralOld(wave);

        // The first sample should be zero, and we'll duplicate it at the end for easier interpolation.
        wave[waveLength] = wave[0];

        return wave;
    }
}

export class Grain {
    public delayLinePosition: number; // Relative to latest sample

    public ageInSamples: number;
    public maxAgeInSamples: number;
    public delay: number;

    //parabolic envelope implementation
    public parabolicEnvelopeAmplitude: number;
    public parabolicEnvelopeSlope: number;
    public parabolicEnvelopeCurve: number;

    //raised cosine bell envelope implementation
    public rcbEnvelopeAmplitude: number;
    public rcbEnvelopeAttackIndex: number;
    public rcbEnvelopeReleaseIndex: number;
    public rcbEnvelopeSustain: number;

    constructor() {
        this.delayLinePosition = 0;

        this.ageInSamples = 0;
        this.maxAgeInSamples = 0;
        this.delay = 0;

        this.parabolicEnvelopeAmplitude = 0;
        this.parabolicEnvelopeSlope = 0;
        this.parabolicEnvelopeCurve = 0;

        this.rcbEnvelopeAmplitude = 0;
        this.rcbEnvelopeAttackIndex = 0;
        this.rcbEnvelopeReleaseIndex = 0;
        this.rcbEnvelopeSustain = 0;
    }

    public initializeParabolicEnvelope(durationInSamples: number, amplitude: number): void {
        this.parabolicEnvelopeAmplitude = 0;
        const invDuration: number = 1.0 / durationInSamples;
        const invDurationSquared: number = invDuration * invDuration;
        this.parabolicEnvelopeSlope = 4.0 * amplitude * (invDuration - invDurationSquared);
        this.parabolicEnvelopeCurve = -8.0 * amplitude * invDurationSquared;
    }

    public updateParabolicEnvelope(): void {
        this.parabolicEnvelopeAmplitude += this.parabolicEnvelopeSlope;
        this.parabolicEnvelopeSlope += this.parabolicEnvelopeCurve;
    }

    public initializeRCBEnvelope(durationInSamples: number, amplitude: number): void {
        // attack:
        this.rcbEnvelopeAttackIndex = Math.floor(durationInSamples / 6);
        // sustain:
        this.rcbEnvelopeSustain = amplitude;
        // release:
        this.rcbEnvelopeReleaseIndex = Math.floor(durationInSamples * 5 / 6);
    }

    public updateRCBEnvelope(): void {
        if (this.ageInSamples < this.rcbEnvelopeAttackIndex) { //attack
            this.rcbEnvelopeAmplitude = (1.0 + Math.cos(Math.PI + (Math.PI * (this.ageInSamples / this.rcbEnvelopeAttackIndex) * (this.rcbEnvelopeSustain / 2.0))));
        } else if (this.ageInSamples > this.rcbEnvelopeReleaseIndex) { //release
            this.rcbEnvelopeAmplitude = (1.0 + Math.cos(Math.PI * ((this.ageInSamples - this.rcbEnvelopeReleaseIndex) / this.rcbEnvelopeAttackIndex)) * (this.rcbEnvelopeSustain / 2.0));
        } //sustain covered by the end of attack
    }

    public addDelay(delay: number): void {
        this.delay = delay;
    }
}

export class FilterControlPoint {
    public freq: number = 0;
    public gain: number = Config.filterGainCenter;
    public type: FilterType = FilterType.peak;

    public set(freqSetting: number, gainSetting: number): void {
        this.freq = freqSetting;
        this.gain = gainSetting;
    }

    public getHz(): number {
        return FilterControlPoint.getHzFromSettingValue(this.freq);
    }

    public static getHzFromSettingValue(value: number): number {
        return Config.filterFreqReferenceHz * Math.pow(2.0, (value - Config.filterFreqReferenceSetting) * Config.filterFreqStep);
    }
    public static getSettingValueFromHz(hz: number): number {
        return Math.log2(hz / Config.filterFreqReferenceHz) / Config.filterFreqStep + Config.filterFreqReferenceSetting;
    }
    public static getRoundedSettingValueFromHz(hz: number): number {
        return Math.max(0, Math.min(Config.filterFreqRange - 1, Math.round(FilterControlPoint.getSettingValueFromHz(hz))));
    }

    public getLinearGain(peakMult: number = 1.0): number {
        const power: number = (this.gain - Config.filterGainCenter) * Config.filterGainStep;
        const neutral: number = (this.type == FilterType.peak) ? 0.0 : -0.5;
        const interpolatedPower: number = neutral + (power - neutral) * peakMult;
        return Math.pow(2.0, interpolatedPower);
    }
    public static getRoundedSettingValueFromLinearGain(linearGain: number): number {
        return Math.max(0, Math.min(Config.filterGainRange - 1, Math.round(Math.log2(linearGain) / Config.filterGainStep + Config.filterGainCenter)));
    }

    public toCoefficients(filter: FilterCoefficients, sampleRate: number, freqMult: number = 1.0, peakMult: number = 1.0): void {
        const cornerRadiansPerSample: number = 2.0 * Math.PI * Math.max(Config.filterFreqMinHz, Math.min(Config.filterFreqMaxHz, freqMult * this.getHz())) / sampleRate;
        const linearGain: number = this.getLinearGain(peakMult);
        switch (this.type) {
            case FilterType.lowPass:
                filter.lowPass2ndOrderButterworth(cornerRadiansPerSample, linearGain);
                break;
            case FilterType.highPass:
                filter.highPass2ndOrderButterworth(cornerRadiansPerSample, linearGain);
                break;
            case FilterType.peak:
                filter.peak2ndOrder(cornerRadiansPerSample, linearGain, 1.0);
                break;
            default:
                throw new Error();
        }
    }

    public getVolumeCompensationMult(): number {
        const octave: number = (this.freq - Config.filterFreqReferenceSetting) * Config.filterFreqStep;
        const gainPow: number = (this.gain - Config.filterGainCenter) * Config.filterGainStep;
        switch (this.type) {
            case FilterType.lowPass:
                const freqRelativeTo8khz: number = Math.pow(2.0, octave) * Config.filterFreqReferenceHz / 8000.0;
                // Reverse the frequency warping from importing legacy simplified filters to imitate how the legacy filter cutoff setting affected volume.
                const warpedFreq: number = (Math.sqrt(1.0 + 4.0 * freqRelativeTo8khz) - 1.0) / 2.0;
                const warpedOctave: number = Math.log2(warpedFreq);
                return Math.pow(0.5, 0.2 * Math.max(0.0, gainPow + 1.0) + Math.min(0.0, Math.max(-3.0, 0.595 * warpedOctave + 0.35 * Math.min(0.0, gainPow + 1.0))));
            case FilterType.highPass:
                return Math.pow(0.5, 0.125 * Math.max(0.0, gainPow + 1.0) + Math.min(0.0, 0.3 * (-octave - Math.log2(Config.filterFreqReferenceHz / 125.0)) + 0.2 * Math.min(0.0, gainPow + 1.0)));
            case FilterType.peak:
                const distanceFromCenter: number = octave + Math.log2(Config.filterFreqReferenceHz / 2000.0);
                const freqLoudness: number = Math.pow(1.0 / (1.0 + Math.pow(distanceFromCenter / 3.0, 2.0)), 2.0);
                return Math.pow(0.5, 0.125 * Math.max(0.0, gainPow) + 0.1 * freqLoudness * Math.min(0.0, gainPow));
            default:
                throw new Error();
        }
    }
}

// Settings that were available to old versions of BeepBox but are no longer available in the
// current version that need to be reinterpreted as a group to determine the best way to
// represent them in the current version.
export interface LegacySettings {
    filterCutoff?: number;
    filterResonance?: number;
    filterEnvelope?: Envelope;
    pulseEnvelope?: Envelope;
    operatorEnvelopes?: Envelope[];
    feedbackEnvelope?: Envelope;
}

export interface HeldMod {
    volume: number;
    channelIndex: number;
    instrumentIndex: number;
    setting: number;
    holdFor: number;
}

export enum ChannelType {
    Pitch,
    Noise,
    Mod
}

export class Channel {
    public type: ChannelType;
    public octave: number = 0;
    public readonly instruments: Instrument[] = [];
    public readonly patterns: Pattern[] = [];
    public readonly bars: number[] = [];
    public muted: boolean = false;
    public name: string = "";
    constructor(type: ChannelType = ChannelType.Pitch) {
        this.type = type;
    }
}

export class ChannelState {
    public readonly instruments: InstrumentState[] = [];
    public muted: boolean = false;
    public singleSeamlessInstrument: number | null = null; // Seamless tones from a pattern with a single instrument can be transferred to a different single seamless instrument in the next pattern.
}

export class Synth {

    private syncSongState(): void {
        const channelCount: number = this.song!.getChannelCount();
        for (let i: number = this.channels.length; i < channelCount; i++) {
            this.channels[i] = new ChannelState();
        }
        this.channels.length = channelCount;
        for (let i: number = 0; i < channelCount; i++) {
            const channel: Channel = this.song!.channels[i];
            const channelState: ChannelState = this.channels[i];
            for (let j: number = channelState.instruments.length; j < channel.instruments.length; j++) {
                channelState.instruments[j] = new InstrumentState();
            }
            channelState.instruments.length = channel.instruments.length;
            // NEW: Ensure modulator validity is checked here, outside the real-time audio thread.
            if (channel.type === ChannelType.Mod) {
                for (const instrument of channel.instruments) {
                    this.determineInvalidModulators(instrument);
                }
            }

            if (channelState.muted != channel.muted) {
                channelState.muted = channel.muted;
                if (channelState.muted) {
                    for (const instrumentState of channelState.instruments) {
                        instrumentState.resetAllEffects();
                    }
                }
            }
        }
    }

    public initModFilters(song: Song | null): void {
        if (song != null) {
            song.tmpEqFilterStart = song.eqFilter;
            song.tmpEqFilterEnd = null;
            for (let channelIndex: number = 0; channelIndex < song.getChannelCount(); channelIndex++) {
                for (let instrumentIndex: number = 0; instrumentIndex < song.channels[channelIndex].instruments.length; instrumentIndex++) {
                    const instrument: Instrument = song.channels[channelIndex].instruments[instrumentIndex];
                    instrument.tmpEqFilterStart = instrument.eqFilter;
                    instrument.tmpEqFilterEnd = null;
                    instrument.tmpNoteFilterStart = instrument.noteFilter;
                    instrument.tmpNoteFilterEnd = null;
                }
            }
        }
    }
    public warmUpSynthesizer(song: Song | null): void {
        // Don't bother to generate the drum waves unless the song actually
        // uses them, since they may require a lot of computation.
        if (song != null) {
            this.syncSongState();
            const samplesPerTick: number = this.getSamplesPerTick();
            for (let channelIndex: number = 0; channelIndex < song.getChannelCount(); channelIndex++) {
                for (let instrumentIndex: number = 0; instrumentIndex < song.channels[channelIndex].instruments.length; instrumentIndex++) {
                    const instrument: Instrument = song.channels[channelIndex].instruments[instrumentIndex];
                    const instrumentState: InstrumentState = this.channels[channelIndex].instruments[instrumentIndex];
                    Synth.getInstrumentSynthFunction(instrument);
                    instrumentState.vibratoTime = 0;
                    instrumentState.nextVibratoTime = 0;
                    for (let envelopeIndex: number = 0; envelopeIndex < Config.maxEnvelopeCount + 1; envelopeIndex++) instrumentState.envelopeTime[envelopeIndex] = 0;
                    instrumentState.arpTime = 0;
                    instrumentState.updateWaves(instrument, this.samplesPerSecond);
                    instrumentState.allocateNecessaryBuffers(this, instrument, samplesPerTick);
                }

            }
        }
        // JummBox needs to run synth functions for at least one sample (for JIT purposes)
        // before starting audio callbacks to avoid skipping the initial output.
        var dummyArray = new Float32Array(1);
        this.isPlayingSong = true;
        this.synthesize(dummyArray, dummyArray, 1, true);
        this.isPlayingSong = false;
    }


    public computeLatestModValues(): void {

        if (this.song != null && this.song.modChannelCount > 0) {

            // Clear all mod values, and set up temp variables for the time a mod would be set at.
            let latestModTimes: (number | null)[] = [];
            let latestModInsTimes: (number | null)[][][] = [];
            this.modValues = [];
            this.nextModValues = [];
            this.modInsValues = [];
            this.nextModInsValues = [];
            this.heldMods = [];
            for (let channel: number = 0; channel < this.song.getChannelCount(); channel++) {
                latestModInsTimes[channel] = [];
                this.modInsValues[channel] = [];
                this.nextModInsValues[channel] = [];

                for (let instrument: number = 0; instrument < this.song.channels[channel].instruments.length; instrument++) {
                    this.modInsValues[channel][instrument] = [];
                    this.nextModInsValues[channel][instrument] = [];
                    latestModInsTimes[channel][instrument] = [];
                }
            }

            // Find out where we're at in the fraction of the current bar.
            let currentPart: number = this.beat * Config.partsPerBeat + this.part;

            // For mod channels, calculate last set value for each mod
			for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
				const channel = this.song.channels[channelIndex];
				if (channel.type === ChannelType.Mod && !channel.muted) {

                    let pattern: Pattern | null;

                    for (let currentBar: number = this.bar; currentBar >= 0; currentBar--) {
                        pattern = this.song.getPattern(channelIndex, currentBar);

                        if (pattern != null) {
                            let instrumentIdx: number = pattern.instruments[0];
                            let instrument: Instrument = this.song.channels[channelIndex].instruments[instrumentIdx];
                            let latestPinParts: number[] = [];
                            let latestPinValues: number[] = [];

                            let partsInBar: number = (currentBar == this.bar)
                                ? currentPart
                                : this.findPartsInBar(currentBar);

                            for (const note of pattern.notes) {
                                if (note.start <= partsInBar && (latestPinParts[Config.modCount - 1 - note.pitches[0]] == null || note.end > latestPinParts[Config.modCount - 1 - note.pitches[0]])) {
                                    if (note.start == partsInBar) { // This can happen with next bar mods, and the value of the aligned note's start pin will be used.
                                        latestPinParts[Config.modCount - 1 - note.pitches[0]] = note.start;
                                        latestPinValues[Config.modCount - 1 - note.pitches[0]] = note.pins[0].size;
                                    }
                                    if (note.end <= partsInBar) {
                                        latestPinParts[Config.modCount - 1 - note.pitches[0]] = note.end;
                                        latestPinValues[Config.modCount - 1 - note.pitches[0]] = note.pins[note.pins.length - 1].size;
                                    }
                                    else {
                                        latestPinParts[Config.modCount - 1 - note.pitches[0]] = partsInBar;
                                        // Find the pin where bar change happens, and compute where pin volume would be at that time
                                        for (let pinIdx = 0; pinIdx < note.pins.length; pinIdx++) {
                                            if (note.pins[pinIdx].time + note.start > partsInBar) {
                                                const transitionLength: number = note.pins[pinIdx].time - note.pins[pinIdx - 1].time;
                                                const toNextBarLength: number = partsInBar - note.start - note.pins[pinIdx - 1].time;
                                                const deltaVolume: number = note.pins[pinIdx].size - note.pins[pinIdx - 1].size;

                                                latestPinValues[Config.modCount - 1 - note.pitches[0]] = Math.round(note.pins[pinIdx - 1].size + deltaVolume * toNextBarLength / transitionLength);
                                                pinIdx = note.pins.length;
                                            }
                                        }
                                    }
                                }
                            }

                            // Set modulator value, if it wasn't set in another pattern already scanned
                            for (let mod: number = 0; mod < Config.modCount; mod++) {
                                if (latestPinParts[mod] != null) {
                                    if (Config.modulators[instrument.modulators[mod]].forSong) {
                                        const songFilterParam: boolean = instrument.modulators[mod] == Config.modulators.dictionary["song eq"].index;
                                        if (latestModTimes[instrument.modulators[mod]] == null || currentBar * Config.partsPerBeat * this.song.beatsPerBar + latestPinParts[mod] > (latestModTimes[instrument.modulators[mod]] as number)) {
                                            if (songFilterParam) {
                                                let tgtSong: Song = this.song
                                                if (instrument.modFilterTypes[mod] == 0) {
                                                    tgtSong.tmpEqFilterStart = tgtSong.eqSubFilters[latestPinValues[mod]];
                                                } else {
                                                    for (let i: number = 0; i < Config.filterMorphCount; i++) {
                                                        if (tgtSong.tmpEqFilterStart != null && tgtSong.tmpEqFilterStart == tgtSong.eqSubFilters[i]) {
                                                            tgtSong.tmpEqFilterStart = new FilterSettings();
                                                            tgtSong.tmpEqFilterStart.fromJsonObject(tgtSong.eqSubFilters[i]!.toJsonObject());
                                                            i = Config.filterMorphCount;
                                                        }
                                                    }
                                                    if (tgtSong.tmpEqFilterStart != null && Math.floor((instrument.modFilterTypes[mod] - 1) / 2) < tgtSong.tmpEqFilterStart.controlPointCount) {
                                                        if (instrument.modFilterTypes[mod] % 2)
                                                            tgtSong.tmpEqFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].freq = latestPinValues[mod];
                                                        else
                                                            tgtSong.tmpEqFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].gain = latestPinValues[mod];
                                                    }
                                                }
                                                tgtSong.tmpEqFilterEnd = tgtSong.tmpEqFilterStart;
                                            }
                                            this.setModValue(latestPinValues[mod], latestPinValues[mod], instrument.modChannels[mod], instrument.modInstruments[mod], instrument.modulators[mod]);
                                            latestModTimes[instrument.modulators[mod]] = currentBar * Config.partsPerBeat * this.song.beatsPerBar + latestPinParts[mod];
                                        }
                                    } else {
                                        const targetChannelIndex: number = instrument.modChannels[mod];

                                        // This is the fix: Check if the target index is valid before using it.
                                        if (targetChannelIndex >= 0 && targetChannelIndex < this.song.channels.length) {
                                            const targetChannel: Channel = this.song.channels[targetChannelIndex];
                                            
                                            // Generate list of used instruments
                                            let usedInstruments: number[] = [];
                                            // All
                                            if (instrument.modInstruments[mod] == targetChannel.instruments.length) {
                                                for (let i: number = 0; i < targetChannel.instruments.length; i++) {
                                                    usedInstruments.push(i);
                                                }
                                            } // Active
                                            else if (instrument.modInstruments[mod] > targetChannel.instruments.length) {
                                                const tgtPattern: Pattern | null = this.song.getPattern(targetChannelIndex, currentBar);
                                                if (tgtPattern != null)
                                                    usedInstruments = tgtPattern.instruments;
                                            } else {
                                                usedInstruments.push(instrument.modInstruments[mod]);
                                            }
                                            for (let instrumentIndex: number = 0; instrumentIndex < usedInstruments.length; instrumentIndex++) {
                                                // Iterate through all used instruments by this modulator
                                                // Special indices for mod filter targets, since they control multiple things.
                                                const eqFilterParam: boolean = instrument.modulators[mod] == Config.modulators.dictionary["eq filter"].index;
                                                const noteFilterParam: boolean = instrument.modulators[mod] == Config.modulators.dictionary["note filter"].index;
                                                let modulatorAdjust: number = instrument.modulators[mod];
                                                if (eqFilterParam) {
                                                    modulatorAdjust = Config.modulators.length + (instrument.modFilterTypes[mod] | 0);
                                                } else if (noteFilterParam) {
                                                    // Skip all possible indices for eq filter
                                                    modulatorAdjust = Config.modulators.length + 1 + (2 * Config.filterMaxPoints) + (instrument.modFilterTypes[mod] | 0);
                                                }

                                                if (latestModInsTimes[targetChannelIndex][usedInstruments[instrumentIndex]][modulatorAdjust] == null
                                                    || currentBar * Config.partsPerBeat * this.song.beatsPerBar + latestPinParts[mod] > latestModInsTimes[targetChannelIndex][usedInstruments[instrumentIndex]][modulatorAdjust]!) {

                                                    if (eqFilterParam) {
                                                        let tgtInstrument: Instrument = this.song.channels[targetChannelIndex].instruments[usedInstruments[instrumentIndex]];
                                                        if (instrument.modFilterTypes[mod] == 0) {
                                                            tgtInstrument.tmpEqFilterStart = tgtInstrument.eqSubFilters[latestPinValues[mod]];
                                                        } else {
                                                            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                                                                if (tgtInstrument.tmpEqFilterStart != null && tgtInstrument.tmpEqFilterStart == tgtInstrument.eqSubFilters[i]) {
                                                                    tgtInstrument.tmpEqFilterStart = new FilterSettings();
                                                                    tgtInstrument.tmpEqFilterStart.fromJsonObject(tgtInstrument.eqSubFilters[i]!.toJsonObject());
                                                                    i = Config.filterMorphCount;
                                                                }
                                                            }
                                                            if (tgtInstrument.tmpEqFilterStart != null && Math.floor((instrument.modFilterTypes[mod] - 1) / 2) < tgtInstrument.tmpEqFilterStart.controlPointCount) {
                                                                if (instrument.modFilterTypes[mod] % 2)
                                                                    tgtInstrument.tmpEqFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].freq = latestPinValues[mod];
                                                                else
                                                                    tgtInstrument.tmpEqFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].gain = latestPinValues[mod];
                                                            }
                                                        }
                                                        tgtInstrument.tmpEqFilterEnd = tgtInstrument.tmpEqFilterStart;
                                                    } else if (noteFilterParam) {
                                                        let tgtInstrument: Instrument = this.song.channels[targetChannelIndex].instruments[usedInstruments[instrumentIndex]];
                                                        if (instrument.modFilterTypes[mod] == 0) {
                                                            tgtInstrument.tmpNoteFilterStart = tgtInstrument.noteSubFilters[latestPinValues[mod]];
                                                        } else {
                                                            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                                                                if (tgtInstrument.tmpNoteFilterStart != null && tgtInstrument.tmpNoteFilterStart == tgtInstrument.noteSubFilters[i]) {
                                                                    tgtInstrument.tmpNoteFilterStart = new FilterSettings();
                                                                    tgtInstrument.tmpNoteFilterStart.fromJsonObject(tgtInstrument.noteSubFilters[i]!.toJsonObject());
                                                                    i = Config.filterMorphCount;
                                                                }
                                                            }
                                                            if (tgtInstrument.tmpNoteFilterStart != null && Math.floor((instrument.modFilterTypes[mod] - 1) / 2) < tgtInstrument.tmpNoteFilterStart.controlPointCount) {
                                                                if (instrument.modFilterTypes[mod] % 2)
                                                                    tgtInstrument.tmpNoteFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].freq = latestPinValues[mod];
                                                                else
                                                                    tgtInstrument.tmpNoteFilterStart.controlPoints[Math.floor((instrument.modFilterTypes[mod] - 1) / 2)].gain = latestPinValues[mod];
                                                            }
                                                        }
                                                        tgtInstrument.tmpNoteFilterEnd = tgtInstrument.tmpNoteFilterStart;
                                                    }
                                                    else this.setModValue(latestPinValues[mod], latestPinValues[mod], targetChannelIndex, usedInstruments[instrumentIndex], modulatorAdjust);

                                                    latestModInsTimes[targetChannelIndex][usedInstruments[instrumentIndex]][modulatorAdjust] = currentBar * Config.partsPerBeat * this.song.beatsPerBar + latestPinParts[mod];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Detects if a modulator is set, but not valid for the current effects/instrument type/filter type
    // Note, setting 'none' or the intermediary steps when clicking to add a mod, like an unset channel/unset instrument, counts as valid.
    // TODO: This kind of check is mirrored in SongEditor.ts' whenUpdated. Creates a lot of redundancy for adding new mods. Can be moved into new properties for mods, to avoid this later.
    public determineInvalidModulators(instrument: Instrument): void {
        if (this.song == null)
            return;
        for (let mod: number = 0; mod < Config.modCount; mod++) {
            instrument.invalidModulators[mod] = true;
            // For song modulator, valid if any setting used
            if (instrument.modChannels[mod] == -1) {
                if (instrument.modulators[mod] != 0)
                    instrument.invalidModulators[mod] = false;
                continue;
            }
            const channel: Channel | null = this.song.channels[instrument.modChannels[mod]];
            if (channel == null) continue;
            let tgtInstrumentList: Instrument[] = [];
            if (instrument.modInstruments[mod] >= channel.instruments.length) { // All or active
                tgtInstrumentList = channel.instruments;
            } else {
                tgtInstrumentList = [channel.instruments[instrument.modInstruments[mod]]];
            }
            for (let i: number = 0; i < tgtInstrumentList.length; i++) {
                const tgtInstrument: Instrument | null = tgtInstrumentList[i];
                if (tgtInstrument == null) continue;
                const str: string = Config.modulators[instrument.modulators[mod]].name;
                // Check effects
                if (!((Config.modulators[instrument.modulators[mod]].associatedEffect != EffectType.length && !(tgtInstrument.effects & (1 << Config.modulators[instrument.modulators[mod]].associatedEffect)))
                    // Instrument type specific
                    || ((tgtInstrument.type != InstrumentType.fm && tgtInstrument.type != InstrumentType.fm6op) && (str == "fm slider 1" || str == "fm slider 2" || str == "fm slider 3" || str == "fm slider 4" || str == "fm feedback"))
                    || tgtInstrument.type != InstrumentType.fm6op && (str == "fm slider 5" || str == "fm slider 6")
                    || ((tgtInstrument.type != InstrumentType.pwm && tgtInstrument.type != InstrumentType.supersaw) && (str == "pulse width" || str == "decimal offset"))
                    || ((tgtInstrument.type != InstrumentType.supersaw) && (str == "dynamism" || str == "spread" || str == "saw shape"))
                    // Arp check
                    || (!tgtInstrument.getChord().arpeggiates && (str == "arp speed" || str == "reset arp"))
                    // EQ Filter check
                    || (tgtInstrument.eqFilterType && str == "eq filter")
                    || (!tgtInstrument.eqFilterType && (str == "eq filt cut" || str == "eq filt peak"))
                    || (str == "eq filter" && Math.floor((instrument.modFilterTypes[mod] + 1) / 2) > tgtInstrument.getLargestControlPointCount(false))
                    // Note Filter check
                    || (tgtInstrument.noteFilterType && str == "note filter")
                    || (!tgtInstrument.noteFilterType && (str == "note filt cut" || str == "note filt peak"))
                    || (str == "note filter" && Math.floor((instrument.modFilterTypes[mod] + 1) / 2) > tgtInstrument.getLargestControlPointCount(true)))) {

                    instrument.invalidModulators[mod] = false;
                    i = tgtInstrumentList.length;
                }
            }

        }
    }

    private static operatorAmplitudeCurve(amplitude: number): number {
        return (Math.pow(16.0, amplitude / 15.0) - 1.0) / 15.0;
    }

    public samplesPerSecond: number = 44100;
    public panningDelayBufferSize: number;
    public panningDelayBufferMask: number;
    public chorusDelayBufferSize: number;
    public chorusDelayBufferMask: number;
    // TODO: reverb

    public song: Song | null = null;
    public preferLowerLatency: boolean = false; // enable when recording performances from keyboard or MIDI. Takes effect next time you activate audio.
    public anticipatePoorPerformance: boolean = false; // enable on mobile devices to reduce audio stutter glitches. Takes effect next time you activate audio.
    public liveInputDuration: number = 0;
    public liveBassInputDuration: number = 0;
    public liveInputStarted: boolean = false;
    public liveBassInputStarted: boolean = false;
    public liveInputPitches: number[] = [];
    public liveBassInputPitches: number[] = [];
    public liveInputChannel: number = 0;
    public liveBassInputChannel: number = 0;
    public liveInputInstruments: number[] = [];
    public liveBassInputInstruments: number[] = [];
    public loopRepeatCount: number = -1;
    public volume: number = 1.0;
    public oscRefreshEventTimer: number = 0;
    public oscEnabled: boolean = true;
    public enableMetronome: boolean = false;
    public countInMetronome: boolean = false;
    public renderingSong: boolean = false;
    public heldMods: HeldMod[] = [];
    private wantToSkip: boolean = false;
    private playheadInternal: number = 0.0;
    private bar: number = 0;
    private prevBar: number | null = null;
    private nextBar: number | null = null;
    private beat: number = 0;
    private part: number = 0;
    private tick: number = 0;
    public isAtStartOfTick: boolean = true;
    public isAtEndOfTick: boolean = true;
    public tickSampleCountdown: number = 0;
    private modValues: (number | null)[] = [];
    public modInsValues: (number | null)[][][] = [];
    private nextModValues: (number | null)[] = [];
    public nextModInsValues: (number | null)[][][] = [];
    private isPlayingSong: boolean = false;
    private isRecording: boolean = false;
    private liveInputEndTime: number = 0.0;
    private browserAutomaticallyClearsAudioBuffer: boolean = true; // Assume true until proven otherwise. Older Chrome does not clear the buffer so it needs to be cleared manually.

    public static readonly tempFilterStartCoefficients: FilterCoefficients = new FilterCoefficients();
    public static readonly tempFilterEndCoefficients: FilterCoefficients = new FilterCoefficients();
    private tempDrumSetControlPoint: FilterControlPoint = new FilterControlPoint();
    public tempFrequencyResponse: FrequencyResponse = new FrequencyResponse();
    public loopBarStart: number = -1;
    public loopBarEnd: number = -1;

    private static readonly fmSynthFunctionCache: Dictionary<Function> = {};
    private static readonly fm6SynthFunctionCache: Dictionary<Function> = {};
    private static readonly effectsFunctionCache: Function[] = Array(1 << 7).fill(undefined); // keep in sync with the number of post-process effects.
    private static readonly pickedStringFunctionCache: Function[] = Array(3).fill(undefined); // keep in sync with the number of unison voices.
    private static readonly spectrumFunctionCache: Function[] = [];
    private static readonly noiseFunctionCache: Function[] = [];
    private static readonly drumFunctionCache: Function[] = [];
    private static readonly chipFunctionCache: Function[] = [];
    private static readonly pulseFunctionCache: Function[] = [];
    private static readonly harmonicsFunctionCache: Function[] = [];
    private static readonly loopableChipFunctionCache: Function[] = Array(Config.unisonVoicesMax + 1).fill(undefined); 

    public readonly channels: ChannelState[] = [];
    private readonly tonePool: Deque<Tone> = new Deque<Tone>();
    private readonly tempMatchedPitchTones: Array<Tone | null> = Array(Config.maxChordSize).fill(null);

    private startedMetronome: boolean = false;
    private metronomeSamplesRemaining: number = -1;
    private metronomeAmplitude: number = 0.0;
    private metronomePrevAmplitude: number = 0.0;
    private metronomeFilter: number = 0.0;
    private limit: number = 0.0;

    public songEqFilterVolume: number = 1.0;
    public songEqFilterVolumeDelta: number = 0.0;
    public readonly songEqFiltersL: DynamicBiquadFilter[] = [];
    public readonly songEqFiltersR: DynamicBiquadFilter[] = [];
    public songEqFilterCount: number = 0;
    public initialSongEqFilterInput1L: number = 0.0;
    public initialSongEqFilterInput2L: number = 0.0;
    public initialSongEqFilterInput1R: number = 0.0;
    public initialSongEqFilterInput2R: number = 0.0;

    private tempMonoInstrumentSampleBuffer: Float32Array | null = null;

    private audioCtx: any | null = null;
    private scriptNode: any | null = null;

    public get playing(): boolean {
        return this.isPlayingSong;
    }

    public get recording(): boolean {
        return this.isRecording;
    }

    public get playhead(): number {
        return this.playheadInternal;
    }

    public set playhead(value: number) {
        if (this.song != null) {
            this.playheadInternal = Math.max(0, Math.min(this.song.barCount, value));
            let remainder: number = this.playheadInternal;
            this.bar = Math.floor(remainder);
            remainder = this.song.beatsPerBar * (remainder - this.bar);
            this.beat = Math.floor(remainder);
            remainder = Config.partsPerBeat * (remainder - this.beat);
            this.part = Math.floor(remainder);
            remainder = Config.ticksPerPart * (remainder - this.part);
            this.tick = Math.floor(remainder);
            this.tickSampleCountdown = 0;
            this.isAtStartOfTick = true;
            this.prevBar = null;
        }
    }

    public getSamplesPerBar(): number {
        if (this.song == null) throw new Error();
        return this.getSamplesPerTick() * Config.ticksPerPart * Config.partsPerBeat * this.song.beatsPerBar;
    }

    public getTicksIntoBar(): number {
        return (this.beat * Config.partsPerBeat + this.part) * Config.ticksPerPart + this.tick;
    }
    public getCurrentPart(): number {
        return (this.beat * Config.partsPerBeat + this.part);
    }

    private findPartsInBar(bar: number): number {
        if (this.song == null) return 0;
        let partsInBar: number = Config.partsPerBeat * this.song.beatsPerBar;
    
        for (
            let channelIndex: number = 0;
            channelIndex < this.song.getChannelCount();
            channelIndex++
        ) {
            const channel = this.song.channels[channelIndex];
            if (channel.type !== ChannelType.Mod) continue;
    
            let pattern: Pattern | null = this.song.getPattern(channelIndex, bar);
            if (pattern != null) {
                let instrument: Instrument =
                    channel.instruments[pattern.instruments[0]];
                for (let mod: number = 0; mod < Config.modCount; mod++) {
                    if (
                        instrument.modulators[mod] ==
                        Config.modulators.dictionary["next bar"].index
                    ) {
                        for (const note of pattern.notes) {
                            if (note.pitches[0] == Config.modCount - 1 - mod) {
                                // Find the earliest next bar note.
                                if (partsInBar > note.start)
                                    partsInBar = note.start;
                            }
                        }
                    }
                }
            }
        }
        return partsInBar;
    }

    // Returns the total samples in the song
    public getTotalSamples(enableIntro: boolean, enableOutro: boolean, loop: number): number {
        if (this.song == null)
            return -1;

        // Compute the window to be checked (start bar to end bar)
        let startBar: number = enableIntro ? 0 : this.song.loopStart;
        let endBar: number = enableOutro ? this.song.barCount : (this.song.loopStart + this.song.loopLength);
        let hasTempoMods: boolean = false;
        let hasNextBarMods: boolean = false;
        let prevTempo: number = this.song.tempo;

		for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
			const channel = this.song.channels[channelIndex];
			if (channel.type !== ChannelType.Mod) continue;
            for (let bar: number = startBar; bar < endBar; bar++) {
                let pattern: Pattern | null = this.song.getPattern(channelIndex, bar);
                if (pattern != null) {
                    let instrument: Instrument = channel.instruments[pattern.instruments[0]];
                    for (let mod: number = 0; mod < Config.modCount; mod++) {
						if (instrument.modulators[mod] == Config.modulators.dictionary["tempo"].index) hasTempoMods = true;
						if (instrument.modulators[mod] == Config.modulators.dictionary["next bar"].index) hasNextBarMods = true;
                    }
                }
            }
        }

        // If intro is not zero length, determine what the "entry" tempo is going into the start part, by looking at mods that came before...
        if (startBar > 0) {
            let latestTempoPin: number | null = null;
            let latestTempoValue: number = 0;
        
            for (let bar: number = startBar - 1; bar >= 0; bar--) {
                for (
                    let channelIndex: number = 0;
                    channelIndex < this.song.getChannelCount();
                    channelIndex++
                ) {
                    const channel = this.song.channels[channelIndex];
                    if (channel.type !== ChannelType.Mod) continue;
        
                    let pattern = this.song.getPattern(channelIndex, bar);
                    if (pattern != null) {
                        let instrumentIdx: number = pattern.instruments[0];
                        let instrument: Instrument =
                            this.song.channels[channelIndex].instruments[instrumentIdx];
                        let partsInBar: number = this.findPartsInBar(bar);
        
                        for (const note of pattern.notes) {
                            if (
                                instrument.modulators[
                                    Config.modCount - 1 - note.pitches[0]
                                ] == Config.modulators.dictionary["tempo"].index
                            ) {
                                if (
                                    note.start < partsInBar &&
                                    (latestTempoPin == null || note.end > latestTempoPin)
                                ) {
                                    if (note.end <= partsInBar) {
                                        latestTempoPin = note.end;
                                        latestTempoValue =
                                            note.pins[note.pins.length - 1].size;
                                    } else {
                                        latestTempoPin = partsInBar;
                                        // Find the pin where bar change happens, and compute where pin volume would be at that time
                                        for (
                                            let pinIdx = 0;
                                            pinIdx < note.pins.length;
                                            pinIdx++
                                        ) {
                                            if (
                                                note.pins[pinIdx].time + note.start >
                                                partsInBar
                                            ) {
                                                const transitionLength: number =
                                                    note.pins[pinIdx].time -
                                                    note.pins[pinIdx - 1].time;
                                                const toNextBarLength: number =
                                                    partsInBar -
                                                    note.start -
                                                    note.pins[pinIdx - 1].time;
                                                const deltaVolume: number =
                                                    note.pins[pinIdx].size -
                                                    note.pins[pinIdx - 1].size;
        
                                                latestTempoValue = Math.round(
                                                    note.pins[pinIdx - 1].size +
                                                        (deltaVolume * toNextBarLength) /
                                                            transitionLength,
                                                );
                                                pinIdx = note.pins.length;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
        
                // Done once you process a pattern where tempo mods happened, since the search happens backward.
                // This check is now correctly placed *after* all channels for a given bar have been checked.
                if (latestTempoPin != null) {
                    prevTempo =
                        latestTempoValue +
                        Config.modulators.dictionary["tempo"].convertRealFactor;
                    break; // Exit the bar loop.
                }
            }
        }

        if (hasTempoMods || hasNextBarMods) {
            // Run from start bar to end bar and observe looping, computing average tempo across each bar
            let bar: number = startBar;
            let ended: boolean = false;
            let totalSamples: number = 0;

            while (!ended) {
                // Compute the subsection of the pattern that will play
                let partsInBar: number = Config.partsPerBeat * this.song.beatsPerBar;
                let currentPart: number = 0;

                if (hasNextBarMods) {
                    partsInBar = this.findPartsInBar(bar);
                }

                // Compute average tempo in this tick window, or use last tempo if nothing happened
                if (hasTempoMods) {
                    let foundMod: boolean = false;
					for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
						const channel = this.song.channels[channelIndex];
						if (channel.type !== ChannelType.Mod) continue;
                        if (foundMod == false) {
                            let pattern: Pattern | null = this.song.getPattern(channelIndex, bar);
                            if (pattern != null) {
                                let instrument: Instrument = channel.instruments[pattern.instruments[0]];
                                for (let mod: number = 0; mod < Config.modCount; mod++) {
                                    if (foundMod == false && instrument.modulators[mod] == Config.modulators.dictionary["tempo"].index
                                        && pattern.notes.find(n => n.pitches[0] == (Config.modCount - 1 - mod))) {
                                        // Only the first tempo mod instrument for this bar will be checked (well, the first with a note in this bar).
                                        foundMod = true;
                                        // Need to re-sort the notes by start time to make the next part much less painful.
                                        pattern.notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
                                        for (const note of pattern.notes) {
                                            if (note.pitches[0] == (Config.modCount - 1 - mod)) {
                                                // Compute samples up to this note
                                                totalSamples += (Math.min(partsInBar - currentPart, note.start - currentPart)) * Config.ticksPerPart * this.getSamplesPerTickSpecificBPM(prevTempo);

                                                if (note.start < partsInBar) {
                                                    for (let pinIdx: number = 1; pinIdx < note.pins.length; pinIdx++) {
                                                        // Compute samples up to this pin
                                                        if (note.pins[pinIdx - 1].time + note.start <= partsInBar) {
                                                            const tickLength: number = Config.ticksPerPart * Math.min(partsInBar - (note.start + note.pins[pinIdx - 1].time), note.pins[pinIdx].time - note.pins[pinIdx - 1].time);
                                                            const prevPinTempo: number = note.pins[pinIdx - 1].size + Config.modulators.dictionary["tempo"].convertRealFactor;
                                                            let currPinTempo: number = note.pins[pinIdx].size + Config.modulators.dictionary["tempo"].convertRealFactor;
                                                            if (note.pins[pinIdx].time + note.start > partsInBar) {
                                                                // Compute an intermediary tempo since bar changed over mid-pin. Maybe I'm deep in "what if" territory now!
                                                                currPinTempo = note.pins[pinIdx - 1].size + (note.pins[pinIdx].size - note.pins[pinIdx - 1].size) * (partsInBar - (note.start + note.pins[pinIdx - 1].time)) / (note.pins[pinIdx].time - note.pins[pinIdx - 1].time) + Config.modulators.dictionary["tempo"].convertRealFactor;
                                                            }
                                                            let bpmScalar: number = Config.partsPerBeat * Config.ticksPerPart / 60;

                                                            if (currPinTempo != prevPinTempo) {

                                                                totalSamples += - this.samplesPerSecond * tickLength * (Math.log(bpmScalar * currPinTempo * tickLength) - Math.log(bpmScalar * prevPinTempo * tickLength)) / (bpmScalar * (prevPinTempo - currPinTempo));

                                                            }
                                                            else {

                                                                // No tempo change between the two pins.
                                                                totalSamples += tickLength * this.getSamplesPerTickSpecificBPM(currPinTempo);

                                                            }
                                                            prevTempo = currPinTempo;
                                                        }
                                                        currentPart = Math.min(note.start + note.pins[pinIdx].time, partsInBar);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Compute samples for the rest of the bar
                totalSamples += (partsInBar - currentPart) * Config.ticksPerPart * this.getSamplesPerTickSpecificBPM(prevTempo);

                bar++;
                if (loop != 0 && bar == this.song.loopStart + this.song.loopLength) {
                    bar = this.song.loopStart;
                    if (loop > 0) loop--;
                }
                if (bar >= endBar) {
                    ended = true;
                }

            }

            return Math.ceil(totalSamples);
        }
        else {
            // No tempo or next bar mods... phew! Just calculate normally.
            return this.getSamplesPerBar() * this.getTotalBars(enableIntro, enableOutro, loop);
        }
    }

    public getTotalBars(enableIntro: boolean, enableOutro: boolean, useLoopCount: number = this.loopRepeatCount): number {
        if (this.song == null) throw new Error();
        let bars: number = this.song.loopLength * (useLoopCount + 1);
        if (enableIntro) bars += this.song.loopStart;
        if (enableOutro) bars += this.song.barCount - (this.song.loopStart + this.song.loopLength);
        return bars;
    }

    constructor(song: Song | string | null = null) {
        this.computeDelayBufferSizes();
        if (song != null) this.setSong(song);
    }

    public setSong(song: Song | string): void {
        if (typeof (song) == "string") {
            this.song = new Song(song);
        } else if (song instanceof Song) {
            this.song = song;
        }
        this.prevBar = null;
    }

    private computeDelayBufferSizes(): void {
        this.panningDelayBufferSize = Synth.fittingPowerOfTwo(this.samplesPerSecond * Config.panDelaySecondsMax);
        this.panningDelayBufferMask = this.panningDelayBufferSize - 1;
        this.chorusDelayBufferSize = Synth.fittingPowerOfTwo(this.samplesPerSecond * Config.chorusMaxDelay);
        this.chorusDelayBufferMask = this.chorusDelayBufferSize - 1;
    }

    private activateAudio(): void {
        const bufferSize: number = this.anticipatePoorPerformance ? (this.preferLowerLatency ? 2048 : 4096) : (this.preferLowerLatency ? 512 : 2048);
        if (this.audioCtx == null || this.scriptNode == null || this.scriptNode.bufferSize != bufferSize) {
            if (this.scriptNode != null) this.deactivateAudio();
            const latencyHint: string = this.anticipatePoorPerformance ? (this.preferLowerLatency ? "balanced" : "playback") : (this.preferLowerLatency ? "interactive" : "balanced");
            this.audioCtx = this.audioCtx || new (window.AudioContext || window.webkitAudioContext)({ latencyHint: latencyHint });
            this.samplesPerSecond = this.audioCtx.sampleRate;
            this.scriptNode = this.audioCtx.createScriptProcessor ? this.audioCtx.createScriptProcessor(bufferSize, 0, 2) : this.audioCtx.createJavaScriptNode(bufferSize, 0, 2); // bufferSize samples per callback buffer, 0 input channels, 2 output channels (left/right)
            this.scriptNode.onaudioprocess = this.audioProcessCallback;
            this.scriptNode.channelCountMode = 'explicit';
            this.scriptNode.channelInterpretation = 'speakers';
            this.scriptNode.connect(this.audioCtx.destination);

            this.computeDelayBufferSizes();
        }
        this.audioCtx.resume();
    }

    private deactivateAudio(): void {
        if (this.audioCtx != null && this.scriptNode != null) {
            this.scriptNode.disconnect(this.audioCtx.destination);
            this.scriptNode = null;
            if (this.audioCtx.close) this.audioCtx.close(); // firefox is missing this function?
            this.audioCtx = null;
        }
    }

    public maintainLiveInput(): void {
        this.activateAudio();
        this.liveInputEndTime = performance.now() + 10000.0;
    }

    public play(): void {
        if (this.isPlayingSong) return;
        this.initModFilters(this.song);
        this.computeLatestModValues();
        this.activateAudio();
        this.warmUpSynthesizer(this.song);
        this.isPlayingSong = true;
    }

    public pause(): void {
        if (!this.isPlayingSong) return;
        this.isPlayingSong = false;
        this.isRecording = false;
        this.preferLowerLatency = false;
        this.modValues = [];
        this.nextModValues = [];
        this.heldMods = [];
        if (this.song != null) {
            this.song.inVolumeCap = 0.0;
            this.song.outVolumeCap = 0.0;
            this.song.tmpEqFilterStart = null;
            this.song.tmpEqFilterEnd = null;
            for (let channelIndex: number = 0; channelIndex < this.song.pitchChannelCount + this.song.noiseChannelCount; channelIndex++) {
                this.modInsValues[channelIndex] = [];
                this.nextModInsValues[channelIndex] = [];
            }
        }
    }

    public startRecording(): void {
        this.preferLowerLatency = true;
        this.isRecording = true;
        this.play();
    }

    public resetEffects(): void {
        this.limit = 0.0;
        this.freeAllTones();
        if (this.song != null) {
            for (const channelState of this.channels) {
                for (const instrumentState of channelState.instruments) {
                    instrumentState.resetAllEffects();
                }
            }
        }
    }

    public setModValue(volumeStart: number, volumeEnd: number, channelIndex: number, instrumentIndex: number, setting: number): number {
        let val: number = volumeStart + Config.modulators[setting].convertRealFactor;
        let nextVal: number = volumeEnd + Config.modulators[setting].convertRealFactor;
        if (Config.modulators[setting].forSong) {
            if (this.modValues[setting] == null || this.modValues[setting] != val || this.nextModValues[setting] != nextVal) {
                this.modValues[setting] = val;
                this.nextModValues[setting] = nextVal;
            }
        } else {
            if (this.modInsValues[channelIndex][instrumentIndex][setting] == null
                || this.modInsValues[channelIndex][instrumentIndex][setting] != val
                || this.nextModInsValues[channelIndex][instrumentIndex][setting] != nextVal) {
                this.modInsValues[channelIndex][instrumentIndex][setting] = val;
                this.nextModInsValues[channelIndex][instrumentIndex][setting] = nextVal;
            }
        }

        return val;
    }

    public getModValue(setting: number, channel?: number | null, instrument?: number | null, nextVal?: boolean): number {
        const forSong: boolean = Config.modulators[setting].forSong;
        if (forSong) {
            if (this.modValues[setting] != null && this.nextModValues[setting] != null) {
                return nextVal ? this.nextModValues[setting]! : this.modValues[setting]!;
            }
        } else if (channel != undefined && instrument != undefined) {
            if (this.modInsValues[channel][instrument][setting] != null && this.nextModInsValues[channel][instrument][setting] != null) {
                return nextVal ? this.nextModInsValues[channel][instrument][setting]! : this.modInsValues[channel][instrument][setting]!;
            }
        }
        return -1;
    }

    // Checks if any mod is active for the given channel/instrument OR if any mod is active for the song scope. Could split the logic if needed later.
    public isAnyModActive(channel: number, instrument: number): boolean {
        for (let setting: number = 0; setting < Config.modulators.length; setting++) {
            if ((this.modValues != undefined && this.modValues[setting] != null)
                || (this.modInsValues != undefined && this.modInsValues[channel] != undefined && this.modInsValues[channel][instrument] != undefined && this.modInsValues[channel][instrument][setting] != null)) {
                return true;
            }
        }
        return false;
    }

    public unsetMod(setting: number, channel?: number, instrument?: number) {
        if (this.isModActive(setting) || (channel != undefined && instrument != undefined && this.isModActive(setting, channel, instrument))) {
            this.modValues[setting] = null;
            this.nextModValues[setting] = null;
            for (let i: number = 0; i < this.heldMods.length; i++) {
                if (channel != undefined && instrument != undefined) {
                    if (this.heldMods[i].channelIndex == channel && this.heldMods[i].instrumentIndex == instrument && this.heldMods[i].setting == setting)
                        this.heldMods.splice(i, 1);
                } else {
                    if (this.heldMods[i].setting == setting)
                        this.heldMods.splice(i, 1);
                }
            }
            if (channel != undefined && instrument != undefined) {
                this.modInsValues[channel][instrument][setting] = null;
                this.nextModInsValues[channel][instrument][setting] = null;
            }
        }
    }

    public isFilterModActive(forNoteFilter: boolean, channelIdx: number, instrumentIdx: number, forSong?: boolean) {
        const instrument: Instrument = this.song!.channels[channelIdx].instruments[instrumentIdx];

        if (forNoteFilter) {
            if (instrument.noteFilterType)
                return false;
            if (instrument.tmpNoteFilterEnd != null)
                return true;
        }
        else {
            if (forSong) {
                if (this?.song?.tmpEqFilterEnd != null)
                    return true;
            } else {
                if (instrument.eqFilterType)
                    return false;
                if (instrument.tmpEqFilterEnd != null)
                    return true;
            }
        }

        return false
    }

    public isModActive(setting: number, channel?: number, instrument?: number): boolean {
        const forSong: boolean = Config.modulators[setting].forSong;
        if (forSong) {
            return (this.modValues != undefined && this.modValues[setting] != null);
        } else if (channel != undefined && instrument != undefined && this.modInsValues != undefined && this.modInsValues[channel] != null && this.modInsValues[channel][instrument] != null) {
            return (this.modInsValues[channel][instrument][setting] != null);
        }
        return false;
    }

    // Force a modulator to be held at the given volumeStart for a brief duration.
    public forceHoldMods(volumeStart: number, channelIndex: number, instrumentIndex: number, setting: number): void {
        let found: boolean = false;
        for (let i: number = 0; i < this.heldMods.length; i++) {
            if (this.heldMods[i].channelIndex == channelIndex && this.heldMods[i].instrumentIndex == instrumentIndex && this.heldMods[i].setting == setting) {
                this.heldMods[i].volume = volumeStart;
                this.heldMods[i].holdFor = 24;
                found = true;
            }
        }
        // Default: hold for 24 ticks / 12 parts (half a beat).
        if (!found)
            this.heldMods.push({ volume: volumeStart, channelIndex: channelIndex, instrumentIndex: instrumentIndex, setting: setting, holdFor: 24 });
    }

    public snapToStart(): void {
        this.bar = 0;
        this.resetEffects();
        this.snapToBar();
    }

    public goToBar(bar: number): void {
        this.bar = bar;
        this.resetEffects();
        this.playheadInternal = this.bar;
    }

    public snapToBar(): void {
        this.playheadInternal = this.bar;
        this.beat = 0;
        this.part = 0;
        this.tick = 0;
        this.tickSampleCountdown = 0;
    }

    public jumpIntoLoop(): void {
        if (!this.song) return;
        if (this.bar < this.song.loopStart || this.bar >= this.song.loopStart + this.song.loopLength) {
            const oldBar: number = this.bar;
            this.bar = this.song.loopStart;
            this.playheadInternal += this.bar - oldBar;

            if (this.playing)
                this.computeLatestModValues();
        }
    }

    public goToNextBar(): void {
        if (!this.song) return;
        this.prevBar = this.bar;
        const oldBar: number = this.bar;
        this.bar++;
        if (this.bar >= this.song.barCount) {
            this.bar = 0;
        }
        this.playheadInternal += this.bar - oldBar;

        if (this.playing)
            this.computeLatestModValues();
    }

    public goToPrevBar(): void {
        if (!this.song) return;
        this.prevBar = null;
        const oldBar: number = this.bar;
        this.bar--;
        if (this.bar < 0 || this.bar >= this.song.barCount) {
            this.bar = this.song.barCount - 1;
        }
        this.playheadInternal += this.bar - oldBar;

        if (this.playing)
            this.computeLatestModValues();
    }

    private getNextBar(): number {
        let nextBar: number = this.bar + 1;
        if (this.isRecording) {
            if (nextBar >= this.song!.barCount) {
                nextBar = this.song!.barCount - 1;
            }
        } else if (this.bar == this.loopBarEnd && !this.renderingSong) {
            nextBar = this.loopBarStart;
        }
        else if (this.loopRepeatCount != 0 && nextBar == Math.max(this.loopBarEnd + 1, this.song!.loopStart + this.song!.loopLength)) {
            nextBar = this.song!.loopStart;
        }
        return nextBar;
    }

    public skipBar(): void {
        if (!this.song) return;
        const samplesPerTick: number = this.getSamplesPerTick();
        this.prevBar = this.bar; // Bugfix by LeoV
        if (this.loopBarEnd != this.bar)
            this.bar++;
        else {
            this.bar = this.loopBarStart;
        }
        this.beat = 0;
        this.part = 0;
        this.tick = 0;
        this.tickSampleCountdown = samplesPerTick;
        this.isAtStartOfTick = true;

        if (this.loopRepeatCount != 0 && this.bar == Math.max(this.song.loopStart + this.song.loopLength, this.loopBarEnd)) {
            this.bar = this.song.loopStart;
            if (this.loopBarStart != -1)
                this.bar = this.loopBarStart;
            if (this.loopRepeatCount > 0) this.loopRepeatCount--;
        }

    }

    private audioProcessCallback = (audioProcessingEvent: any): void => {
        const outputBuffer = audioProcessingEvent.outputBuffer;
        const outputDataL: Float32Array = outputBuffer.getChannelData(0);
        const outputDataR: Float32Array = outputBuffer.getChannelData(1);

        if (this.browserAutomaticallyClearsAudioBuffer && (outputDataL[0] != 0.0 || outputDataR[0] != 0.0 || outputDataL[outputBuffer.length - 1] != 0.0 || outputDataR[outputBuffer.length - 1] != 0.0)) {
            // If the buffer is ever initially nonzero, then this must be an older browser that doesn't automatically clear the audio buffer.
            this.browserAutomaticallyClearsAudioBuffer = false;
        }
        if (!this.browserAutomaticallyClearsAudioBuffer) {
            // If this browser does not clear the buffer automatically, do so manually before continuing.
            const length: number = outputBuffer.length;
            for (let i: number = 0; i < length; i++) {
                outputDataL[i] = 0.0;
                outputDataR[i] = 0.0;
            }
        }

        if (!this.isPlayingSong && performance.now() >= this.liveInputEndTime) {
            this.deactivateAudio();
        } else {
            this.synthesize(outputDataL, outputDataR, outputBuffer.length, this.isPlayingSong);

            if (this.oscEnabled) {
                if (this.oscRefreshEventTimer <= 0) {
                    events.raise("oscilloscopeUpdate", outputDataL, outputDataR);
                    this.oscRefreshEventTimer = 2;
                } else {
                    this.oscRefreshEventTimer--;
                }
            }
        }
    }

    private computeSongState(samplesPerTick: number): void {
        if (this.song == null) return;

        const roundedSamplesPerTick: number = Math.ceil(samplesPerTick);
        const samplesPerSecond: number = this.samplesPerSecond;

        let eqFilterVolume: number = 1.0; //this.envelopeComputer.lowpassCutoffDecayVolumeCompensation;
        if (this.song.eqFilterType) {
            // Simple EQ filter (old style). For analysis, using random filters from normal style since they are N/A in this context.
            const eqFilterSettingsStart: FilterSettings = this.song.eqFilter;
            if (this.song.eqSubFilters[1] == null)
                this.song.eqSubFilters[1] = new FilterSettings();
            const eqFilterSettingsEnd: FilterSettings = this.song.eqSubFilters[1];

            // Change location based on slider values
            let startSimpleFreq: number = this.song.eqFilterSimpleCut;
            let startSimpleGain: number = this.song.eqFilterSimplePeak;
            let endSimpleFreq: number = this.song.eqFilterSimpleCut;
            let endSimpleGain: number = this.song.eqFilterSimplePeak;

            let filterChanges: boolean = false;

            // if (synth.isModActive(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex)) {
            //     startSimpleFreq = synth.getModValue(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex, false);
            //     endSimpleFreq = synth.getModValue(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex, true);
            //     filterChanges = true;
            // }
            // if (synth.isModActive(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex)) {
            //     startSimpleGain = synth.getModValue(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex, false);
            //     endSimpleGain = synth.getModValue(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex, true);
            //     filterChanges = true;
            // }

            let startPoint: FilterControlPoint;

            if (filterChanges) {
                eqFilterSettingsStart.convertLegacySettingsForSynth(startSimpleFreq, startSimpleGain);
                eqFilterSettingsEnd.convertLegacySettingsForSynth(endSimpleFreq, endSimpleGain);

                startPoint = eqFilterSettingsStart.controlPoints[0];
                let endPoint: FilterControlPoint = eqFilterSettingsEnd.controlPoints[0];

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, 1.0, 1.0);
                endPoint.toCoefficients(Synth.tempFilterEndCoefficients, samplesPerSecond, 1.0, 1.0);

                if (this.songEqFiltersL.length < 1) this.songEqFiltersL[0] = new DynamicBiquadFilter();
                this.songEqFiltersL[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                if (this.songEqFiltersR.length < 1) this.songEqFiltersR[0] = new DynamicBiquadFilter();
                this.songEqFiltersR[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);

            } else {
                eqFilterSettingsStart.convertLegacySettingsForSynth(startSimpleFreq, startSimpleGain, true);

                startPoint = eqFilterSettingsStart.controlPoints[0];

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, 1.0, 1.0);

                if (this.songEqFiltersL.length < 1) this.songEqFiltersL[0] = new DynamicBiquadFilter();
                this.songEqFiltersL[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterStartCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                if (this.songEqFiltersR.length < 1) this.songEqFiltersR[0] = new DynamicBiquadFilter();
                this.songEqFiltersR[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterStartCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);

            }

            eqFilterVolume *= startPoint.getVolumeCompensationMult();

            this.songEqFilterCount = 1;
            eqFilterVolume = Math.min(3.0, eqFilterVolume);
        } else {
            const eqFilterSettings: FilterSettings = (this.song.tmpEqFilterStart != null) ? this.song.tmpEqFilterStart : this.song.eqFilter;
            //const eqAllFreqsEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterAllFreqs];
            //const eqAllFreqsEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterAllFreqs];
            for (let i: number = 0; i < eqFilterSettings.controlPointCount; i++) {
                //const eqFreqEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterFreq0 + i];
                //const eqFreqEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterFreq0 + i];
                //const eqPeakEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterGain0 + i];
                //const eqPeakEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterGain0 + i];
                let startPoint: FilterControlPoint = eqFilterSettings.controlPoints[i];
                let endPoint: FilterControlPoint = (this.song.tmpEqFilterEnd != null && this.song.tmpEqFilterEnd.controlPoints[i] != null) ? this.song.tmpEqFilterEnd.controlPoints[i] : eqFilterSettings.controlPoints[i];

                // If switching dot type, do it all at once and do not try to interpolate since no valid interpolation exists.
                if (startPoint.type != endPoint.type) {
                    startPoint = endPoint;
                }

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, /*eqAllFreqsEnvelopeStart * eqFreqEnvelopeStart*/ 1.0, /*eqPeakEnvelopeStart*/ 1.0);
                endPoint.toCoefficients(Synth.tempFilterEndCoefficients, samplesPerSecond, /*eqAllFreqsEnvelopeEnd   * eqFreqEnvelopeEnd*/   1.0, /*eqPeakEnvelopeEnd*/   1.0);
                if (this.songEqFiltersL.length <= i) this.songEqFiltersL[i] = new DynamicBiquadFilter();
                this.songEqFiltersL[i].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                if (this.songEqFiltersR.length <= i) this.songEqFiltersR[i] = new DynamicBiquadFilter();
                this.songEqFiltersR[i].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                eqFilterVolume *= startPoint.getVolumeCompensationMult();

            }
            this.songEqFilterCount = eqFilterSettings.controlPointCount;
            eqFilterVolume = Math.min(3.0, eqFilterVolume);
        }

        let eqFilterVolumeStart: number = eqFilterVolume;
        let eqFilterVolumeEnd: number = eqFilterVolume;

        this.songEqFilterVolume = eqFilterVolumeStart;
        this.songEqFilterVolumeDelta = (eqFilterVolumeEnd - eqFilterVolumeStart) / roundedSamplesPerTick;
    }

    public synthesize(outputDataL: Float32Array, outputDataR: Float32Array, outputBufferLength: number, playSong: boolean = true): void {
        if (this.song == null) {
            for (let i: number = 0; i < outputBufferLength; i++) {
                outputDataL[i] = 0.0;
                outputDataR[i] = 0.0;
            }
            this.deactivateAudio();
            return;
        }
        const outputDataLUnfiltered: Float32Array = outputDataL.slice();
        const outputDataRUnfiltered: Float32Array = outputDataR.slice();

        const song: Song = this.song;
        this.song.inVolumeCap = 0.0 // Reset volume cap for this run
        this.song.outVolumeCap = 0.0;

        let samplesPerTick: number = this.getSamplesPerTick();
        let ended: boolean = false;

        // Check the bounds of the playhead:
        if (this.tickSampleCountdown <= 0 || this.tickSampleCountdown > samplesPerTick) {
            this.tickSampleCountdown = samplesPerTick;
            this.isAtStartOfTick = true;
        }
        if (playSong) {
            if (this.beat >= song.beatsPerBar) {
                this.beat = 0;
                this.part = 0;
                this.tick = 0;
                this.tickSampleCountdown = samplesPerTick;
                this.isAtStartOfTick = true;

                this.prevBar = this.bar;
                this.bar = this.getNextBar();
                if (this.bar <= this.prevBar && this.loopRepeatCount > 0) this.loopRepeatCount--;

            }
            if (this.bar >= song.barCount) {
                this.bar = 0;
                if (this.loopRepeatCount != -1) {
                    ended = true;
                    this.pause();
                }
            }
        }

        //const synthStartTime: number = performance.now();

        this.syncSongState();

        if (this.tempMonoInstrumentSampleBuffer == null || this.tempMonoInstrumentSampleBuffer.length < outputBufferLength) {
            this.tempMonoInstrumentSampleBuffer = new Float32Array(outputBufferLength);
        }

        // Post processing parameters:
        const volume: number = +this.volume;
        const limitDecay: number = 1.0 - Math.pow(0.5, this.song.limitDecay / this.samplesPerSecond);
        const limitRise: number = 1.0 - Math.pow(0.5, this.song.limitRise / this.samplesPerSecond);
        let limit: number = +this.limit;
        let skippedBars: number[] = [];
        let firstSkippedBufferIndex = -1;

        let bufferIndex: number = 0;
        while (bufferIndex < outputBufferLength && !ended) {

            this.nextBar = this.getNextBar();
            if (this.nextBar >= song.barCount) this.nextBar = null;

            const samplesLeftInBuffer: number = outputBufferLength - bufferIndex;
            const samplesLeftInTick: number = Math.ceil(this.tickSampleCountdown);
            const runLength: number = Math.min(samplesLeftInTick, samplesLeftInBuffer);
            const runEnd: number = bufferIndex + runLength;

            // Handle next bar mods if they were set
            if (this.wantToSkip) {
                let barVisited: boolean = skippedBars.includes(this.bar);
                if (barVisited && bufferIndex == firstSkippedBufferIndex) {
                    this.pause();
                    return;
                }
                if (firstSkippedBufferIndex == -1) {
                    firstSkippedBufferIndex = bufferIndex;
                }
                if (!barVisited)
                    skippedBars.push(this.bar);
                this.wantToSkip = false;
                this.skipBar();
                continue;
            }

            this.computeSongState(samplesPerTick);

            for (let channelIndex: number = 0; channelIndex < song.getChannelCount(); channelIndex++) {
                const channel: Channel = song.channels[channelIndex];
                const channelState: ChannelState = this.channels[channelIndex];

            if (song.getChannelIsMod(channelIndex)) {
                if (this.isPlayingSong || this.renderingSong) {
                    // First modulation pass. Determines active tones.
                    // Runs everything but Dot X/Y mods, to let them always come after morph.
                    this.determineCurrentActiveTones(song, channelIndex, samplesPerTick, playSong);
                    for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
                        const instrumentState: InstrumentState = channelState.instruments[instrumentIndex];
                        for (let i: number = 0; i < instrumentState.activeModTones.count(); i++) {
                            const tone: Tone = instrumentState.activeModTones.get(i);
                            const instrument: Instrument = channel.instruments[tone.instrumentIndex];
                            let mod: number = Config.modCount - 1 - tone.pitches[0];

                            if ((instrument.modulators[mod] == Config.modulators.dictionary["note filter"].index
                                || instrument.modulators[mod] == Config.modulators.dictionary["eq filter"].index
                                || instrument.modulators[mod] == Config.modulators.dictionary["song eq"].index)
                                && instrument.modFilterTypes[mod] != null && instrument.modFilterTypes[mod] > 0) {
                                continue;
                            }
                            this.playModTone(song, channelIndex, samplesPerTick, bufferIndex, runLength, tone, false, false);
                        }
                    }

                    // Second modulation pass for Dot X/Y mods.
                    for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
                        const instrumentState: InstrumentState = channelState.instruments[instrumentIndex];
                        for (let i: number = 0; i < instrumentState.activeModTones.count(); i++) {
                            const tone: Tone = instrumentState.activeModTones.get(i);
                            const instrument: Instrument = channel.instruments[tone.instrumentIndex];
                            let mod: number = Config.modCount - 1 - tone.pitches[0];

                            if ((instrument.modulators[mod] == Config.modulators.dictionary["note filter"].index
                                || instrument.modulators[mod] == Config.modulators.dictionary["eq filter"].index
                                || instrument.modulators[mod] == Config.modulators.dictionary["song eq"].index)
                                && instrument.modFilterTypes[mod] != null && instrument.modFilterTypes[mod] > 0) {
                                this.playModTone(song, channelIndex, samplesPerTick, bufferIndex, runLength, tone, false, false);
                            }
                        }
                    }
                }
            } else {
                if (this.isAtStartOfTick) {
                    this.determineCurrentActiveTones(song, channelIndex, samplesPerTick, playSong && !this.countInMetronome);
                    this.determineLiveInputTones(song, channelIndex, samplesPerTick);
                }
                for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
                    const instrument: Instrument = channel.instruments[instrumentIndex];
                    const instrumentState: InstrumentState = channelState.instruments[instrumentIndex];

                    if (this.isAtStartOfTick) {
                        let tonesPlayedInThisInstrument: number = instrumentState.activeTones.count() + instrumentState.liveInputTones.count();

                        for (let i: number = 0; i < instrumentState.releasedTones.count(); i++) {
                            const tone: Tone = instrumentState.releasedTones.get(i);
                            if (tone.ticksSinceReleased >= Math.abs(instrument.getFadeOutTicks())) {
                                this.freeReleasedTone(instrumentState, i);
                                i--;
                                continue;
                            }
                            const shouldFadeOutFast: boolean = (tonesPlayedInThisInstrument >= Config.maximumTonesPerChannel);
                            this.computeTone(song, channelIndex, samplesPerTick, tone, true, shouldFadeOutFast);
                            tonesPlayedInThisInstrument++;
                        }

                        if (instrumentState.awake) {
                            if (!instrumentState.computed) {
                                instrumentState.compute(this, instrument, samplesPerTick, Math.ceil(samplesPerTick), null, channelIndex, instrumentIndex);
                            }

                            instrumentState.computed = false;
                            instrumentState.envelopeComputer.clearEnvelopes();
                        }
                    }

                    for (let i: number = 0; i < instrumentState.activeTones.count(); i++) {
                        const tone: Tone = instrumentState.activeTones.get(i);
                        this.playTone(channelIndex, bufferIndex, runLength, tone);
                    }

                    for (let i: number = 0; i < instrumentState.liveInputTones.count(); i++) {
                        const tone: Tone = instrumentState.liveInputTones.get(i);
                        this.playTone(channelIndex, bufferIndex, runLength, tone);
                    }

                    for (let i: number = 0; i < instrumentState.releasedTones.count(); i++) {
                        const tone: Tone = instrumentState.releasedTones.get(i);
                        this.playTone(channelIndex, bufferIndex, runLength, tone);
                    }

                    if (instrumentState.awake) {
                        Synth.effectsSynth(this, outputDataL, outputDataR, bufferIndex, runLength, instrumentState);
                    }

                    // Update LFO time for instruments (used to be deterministic based on bar position but now vibrato/arp speed messes that up!)

                    const tickSampleCountdown: number = this.tickSampleCountdown;
                    const startRatio: number = 1.0 - (tickSampleCountdown) / samplesPerTick;
                    const endRatio: number = 1.0 - (tickSampleCountdown - runLength) / samplesPerTick;
                    const ticksIntoBar: number = (this.beat * Config.partsPerBeat + this.part) * Config.ticksPerPart + this.tick;
                    const partTimeTickStart: number = (ticksIntoBar) / Config.ticksPerPart;
                    const partTimeTickEnd: number = (ticksIntoBar + 1) / Config.ticksPerPart;
                    const partTimeStart: number = partTimeTickStart + (partTimeTickEnd - partTimeTickStart) * startRatio;
                    const partTimeEnd: number = partTimeTickStart + (partTimeTickEnd - partTimeTickStart) * endRatio;
			    	if (this.song.channels[channelIndex].type !== ChannelType.Mod) {
						let useVibratoSpeed: number = instrument.vibratoSpeed;

						instrumentState.vibratoTime = instrumentState.nextVibratoTime;

						//envelopeable vibrato speed?

						if (this.isModActive(Config.modulators.dictionary["vibrato speed"].index, channelIndex, instrumentIndex)) {
							useVibratoSpeed = this.getModValue(Config.modulators.dictionary["vibrato speed"].index, channelIndex, instrumentIndex);
						}

						if (useVibratoSpeed == 0) {
							instrumentState.vibratoTime = 0;
							instrumentState.nextVibratoTime = 0;
						}
						else {
							instrumentState.nextVibratoTime += useVibratoSpeed * 0.1 * (partTimeEnd - partTimeStart);
						}
                    }
                }
            }
        }

            if (this.enableMetronome || this.countInMetronome) {
                if (this.part == 0) {
                    if (!this.startedMetronome) {
                        const midBeat: boolean = (song.beatsPerBar > 4 && (song.beatsPerBar % 2 == 0) && this.beat == song.beatsPerBar / 2);
                        const periods: number = (this.beat == 0) ? 8 : midBeat ? 6 : 4;
                        const hz: number = (this.beat == 0) ? 1600 : midBeat ? 1200 : 800;
                        const amplitude: number = (this.beat == 0) ? 0.06 : midBeat ? 0.05 : 0.04;
                        const samplesPerPeriod: number = this.samplesPerSecond / hz;
                        const radiansPerSample: number = Math.PI * 2.0 / samplesPerPeriod;
                        this.metronomeSamplesRemaining = Math.floor(samplesPerPeriod * periods);
                        this.metronomeFilter = 2.0 * Math.cos(radiansPerSample);
                        this.metronomeAmplitude = amplitude * Math.sin(radiansPerSample);
                        this.metronomePrevAmplitude = 0.0;

                        this.startedMetronome = true;
                    }
                    if (this.metronomeSamplesRemaining > 0) {
                        const stopIndex: number = Math.min(runEnd, bufferIndex + this.metronomeSamplesRemaining);
                        this.metronomeSamplesRemaining -= stopIndex - bufferIndex;
                        for (let i: number = bufferIndex; i < stopIndex; i++) {
                            outputDataLUnfiltered[i] += this.metronomeAmplitude;
                            outputDataRUnfiltered[i] += this.metronomeAmplitude;
                            const tempAmplitude: number = this.metronomeFilter * this.metronomeAmplitude - this.metronomePrevAmplitude;
                            this.metronomePrevAmplitude = this.metronomeAmplitude;
                            this.metronomeAmplitude = tempAmplitude;
                        }
                    }
                } else {
                    this.startedMetronome = false;
                }
            }

            // Post processing:
            for (let i: number = bufferIndex; i < runEnd; i++) {
                //Song EQ
                {
                    let filtersL = this.songEqFiltersL;
                    let filtersR = this.songEqFiltersR;
                    const filterCount = this.songEqFilterCount | 0;
                    let initialFilterInput1L = +this.initialSongEqFilterInput1L;
                    let initialFilterInput2L = +this.initialSongEqFilterInput2L;
                    let initialFilterInput1R = +this.initialSongEqFilterInput1R;
                    let initialFilterInput2R = +this.initialSongEqFilterInput2R;
                    const applyFilters = Synth.applyFilters;
                    let eqFilterVolume = +this.songEqFilterVolume;
                    const eqFilterVolumeDelta = +this.songEqFilterVolumeDelta;
                    const inputSampleL = outputDataL[i];
                    let sampleL = inputSampleL;
                    sampleL = applyFilters(sampleL, initialFilterInput1L, initialFilterInput2L, filterCount, filtersL);
                    initialFilterInput2L = initialFilterInput1L;
                    initialFilterInput1L = inputSampleL;
                    sampleL *= eqFilterVolume;
                    outputDataL[i] = sampleL;
                    const inputSampleR = outputDataR[i];
                    let sampleR = inputSampleR;
                    sampleR = applyFilters(sampleR, initialFilterInput1R, initialFilterInput2R, filterCount, filtersR);
                    initialFilterInput2R = initialFilterInput1R;
                    initialFilterInput1R = inputSampleR;
                    sampleR *= eqFilterVolume;
                    outputDataR[i] = sampleR;
                    eqFilterVolume += eqFilterVolumeDelta;
                    this.sanitizeFilters(filtersL);
                    // The filter input here is downstream from another filter so we
                    // better make sure it's safe too.
                    if (!(initialFilterInput1L < 100) || !(initialFilterInput2L < 100)) {
                        initialFilterInput1L = 0.0;
                        initialFilterInput2L = 0.0;
                    }
                    if (Math.abs(initialFilterInput1L) < epsilon) initialFilterInput1L = 0.0;
                    if (Math.abs(initialFilterInput2L) < epsilon) initialFilterInput2L = 0.0;
                    this.initialSongEqFilterInput1L = initialFilterInput1L;
                    this.initialSongEqFilterInput2L = initialFilterInput2L;
                    this.sanitizeFilters(filtersR);
                    if (!(initialFilterInput1R < 100) || !(initialFilterInput2R < 100)) {
                        initialFilterInput1R = 0.0;
                        initialFilterInput2R = 0.0;
                    }
                    if (Math.abs(initialFilterInput1R) < epsilon) initialFilterInput1R = 0.0;
                    if (Math.abs(initialFilterInput2R) < epsilon) initialFilterInput2R = 0.0;
                    this.initialSongEqFilterInput1R = initialFilterInput1R;
                    this.initialSongEqFilterInput2R = initialFilterInput2R;
                }

                // A compressor/limiter.
                const sampleL = (outputDataL[i] + outputDataLUnfiltered[i]) * song.masterGain * song.masterGain;
                const sampleR = (outputDataR[i] + outputDataRUnfiltered[i]) * song.masterGain * song.masterGain;
                const absL: number = sampleL < 0.0 ? -sampleL : sampleL;
                const absR: number = sampleR < 0.0 ? -sampleR : sampleR;
                const abs: number = absL > absR ? absL : absR;
                this.song.inVolumeCap = (this.song.inVolumeCap > abs ? this.song.inVolumeCap : abs); // Analytics, spit out raw input volume
                // Determines which formula to use. 0 when volume is between [0, compressionThreshold], 1 when between (compressionThreshold, limitThreshold], 2 above
                const limitRange: number = (+(abs > song.compressionThreshold)) + (+(abs > song.limitThreshold));
                // Determine the target amplification based on the range of the curve
                const limitTarget: number =
                    (+(limitRange == 0)) * (((abs + 1 - song.compressionThreshold) * 0.8 + 0.25) * song.compressionRatio + 1.05 * (1 - song.compressionRatio))
                    + (+(limitRange == 1)) * (1.05)
                    + (+(limitRange == 2)) * (1.05 * ((abs + 1 - song.limitThreshold) * song.limitRatio + (1 - song.limitThreshold)));
                // Move the limit towards the target
                limit += ((limitTarget - limit) * (limit < limitTarget ? limitRise : limitDecay));
                const limitedVolume = volume / (limit >= 1 ? limit * 1.05 : limit * 0.8 + 0.25);
                outputDataL[i] = sampleL * limitedVolume;
                outputDataR[i] = sampleR * limitedVolume;

                this.song.outVolumeCap = (this.song.outVolumeCap > abs * limitedVolume ? this.song.outVolumeCap : abs * limitedVolume); // Analytics, spit out limited output volume
            }

            bufferIndex += runLength;

            this.isAtStartOfTick = false;
            this.tickSampleCountdown -= runLength;
            if (this.tickSampleCountdown <= 0) {
                this.isAtStartOfTick = true;

                // Track how long tones have been released, and free them if there are too many.
                // Also reset awake InstrumentStates that didn't have any Tones during this tick.
                for (const channelState of this.channels) {
                    for (const instrumentState of channelState.instruments) {
                        for (let i: number = 0; i < instrumentState.releasedTones.count(); i++) {
                            const tone: Tone = instrumentState.releasedTones.get(i);
                            if (tone.isOnLastTick) {
                                this.freeReleasedTone(instrumentState, i);
                                i--;
                            } else {
                                tone.ticksSinceReleased++;
                            }
                        }
                        if (instrumentState.deactivateAfterThisTick) {
                            instrumentState.deactivate();
                        }
                        instrumentState.tonesAddedInThisTick = false;
                    }
                }
                const ticksIntoBar: number = this.getTicksIntoBar();
                const tickTimeStart: number = ticksIntoBar;
                const secondsPerTick: number = samplesPerTick / this.samplesPerSecond;
                const currentPart: number = this.getCurrentPart();
                for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
                    if (this.song.channels[channelIndex].type === ChannelType.Mod) continue;
                    for (let instrumentIdx: number = 0; instrumentIdx < this.song.channels[channelIndex].instruments.length; instrumentIdx++) {
                        let instrument: Instrument = this.song.channels[channelIndex].instruments[instrumentIdx];
                        let instrumentState: InstrumentState = this.channels[channelIndex].instruments[instrumentIdx];

                        // Update envelope time, which is used to calculate (all envelopes') position
                        const envelopeComputer: EnvelopeComputer = instrumentState.envelopeComputer;
                        const envelopeSpeeds: number[] = [];
                        for (let i: number = 0; i < Config.maxEnvelopeCount; i++) {
                            envelopeSpeeds[i] = 0;
                        }
                        for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
                            let useEnvelopeSpeed: number = instrument.envelopeSpeed;
                            let perEnvelopeSpeed: number = instrument.envelopes[envelopeIndex].perEnvelopeSpeed;
                            if (this.isModActive(Config.modulators.dictionary["individual envelope speed"].index, channelIndex, instrumentIdx) && instrument.envelopes[envelopeIndex].tempEnvelopeSpeed != null) {
                                perEnvelopeSpeed = instrument.envelopes[envelopeIndex].tempEnvelopeSpeed!;
                            }
                            if (this.isModActive(Config.modulators.dictionary["envelope speed"].index, channelIndex, instrumentIdx)) {
                                useEnvelopeSpeed = Math.max(0, Math.min(Config.arpSpeedScale.length - 1, this.getModValue(Config.modulators.dictionary["envelope speed"].index, channelIndex, instrumentIdx, false)));
                                if (Number.isInteger(useEnvelopeSpeed)) {
                                    instrumentState.envelopeTime[envelopeIndex] += Config.arpSpeedScale[useEnvelopeSpeed] * perEnvelopeSpeed;
                                } else {
                                    // Linear interpolate envelope values
                                    instrumentState.envelopeTime[envelopeIndex] += ((1 - (useEnvelopeSpeed % 1)) * Config.arpSpeedScale[Math.floor(useEnvelopeSpeed)] + (useEnvelopeSpeed % 1) * Config.arpSpeedScale[Math.ceil(useEnvelopeSpeed)]) * perEnvelopeSpeed;
                                }
                            }
                            else {
                                instrumentState.envelopeTime[envelopeIndex] += Config.arpSpeedScale[useEnvelopeSpeed] * perEnvelopeSpeed;
                            }
                        }

                        if (instrumentState.activeTones.count() > 0) {
                            const tone: Tone = instrumentState.activeTones.get(0);
                            envelopeComputer.computeEnvelopes(instrument, currentPart, instrumentState.envelopeTime, tickTimeStart, secondsPerTick, tone, envelopeSpeeds, instrumentState, this, channelIndex, instrumentIdx);
                        }

                        const envelopeStarts: number[] = envelopeComputer.envelopeStarts;
                        //const envelopeEnds: number[] = envelopeComputer.envelopeEnds;

                        // Update arpeggio time, which is used to calculate arpeggio position

                        const arpEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.arpeggioSpeed]; //only discrete for now
                        //const arpEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.arpeggioSpeed];
                        let useArpeggioSpeed: number = instrument.arpeggioSpeed;
                        if (this.isModActive(Config.modulators.dictionary["arp speed"].index, channelIndex, instrumentIdx)) {
                            useArpeggioSpeed = clamp(0, Config.arpSpeedScale.length, arpEnvelopeStart * this.getModValue(Config.modulators.dictionary["arp speed"].index, channelIndex, instrumentIdx, false));
                            if (Number.isInteger(useArpeggioSpeed)) {
                                instrumentState.arpTime += Config.arpSpeedScale[useArpeggioSpeed];
                            } else {
                                // Linear interpolate arpeggio values
                                instrumentState.arpTime += (1 - (useArpeggioSpeed % 1)) * Config.arpSpeedScale[Math.floor(useArpeggioSpeed)] + (useArpeggioSpeed % 1) * Config.arpSpeedScale[Math.ceil(useArpeggioSpeed)];
                            }
                        }
                        else {
                            useArpeggioSpeed = clamp(0, Config.arpSpeedScale.length, arpEnvelopeStart * useArpeggioSpeed);
                            if (Number.isInteger(useArpeggioSpeed)) {
                                instrumentState.arpTime += Config.arpSpeedScale[useArpeggioSpeed];
                            } else {
                                // Linear interpolate arpeggio values
                                instrumentState.arpTime += (1 - (useArpeggioSpeed % 1)) * Config.arpSpeedScale[Math.floor(useArpeggioSpeed)] + (useArpeggioSpeed % 1) * Config.arpSpeedScale[Math.ceil(useArpeggioSpeed)];
                            }
                        }
                        envelopeComputer.clearEnvelopes();

                    }
                }

                // Update next-used filters after each run
	    	for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
				if (this.song.channels[channelIndex].type !== ChannelType.Mod) {
					for (let instrumentIdx: number = 0; instrumentIdx < this.song.channels[channelIndex].instruments.length; instrumentIdx++) {
						let instrument: Instrument = this.song.channels[channelIndex].instruments[instrumentIdx];
						if (instrument.tmpEqFilterEnd != null) instrument.tmpEqFilterStart = instrument.tmpEqFilterEnd;
						else instrument.tmpEqFilterStart = instrument.eqFilter;
						
						if (instrument.tmpNoteFilterEnd != null) instrument.tmpNoteFilterStart = instrument.tmpNoteFilterEnd;
						else instrument.tmpNoteFilterStart = instrument.noteFilter;
                        }
                    }
                }
                if (song.tmpEqFilterEnd != null) {
                    song.tmpEqFilterStart = song.tmpEqFilterEnd;
                } else {
                    song.tmpEqFilterStart = song.eqFilter;
                }

                this.tick++;
                this.tickSampleCountdown += samplesPerTick;
                if (this.tick == Config.ticksPerPart) {
                    this.tick = 0;
                    this.part++;
                    this.liveInputDuration--;
                    this.liveBassInputDuration--;
                    // Decrement held modulator counters after each run
                    for (let i: number = 0; i < this.heldMods.length; i++) {
                        this.heldMods[i].holdFor--;
                        if (this.heldMods[i].holdFor <= 0) {
                            this.heldMods.splice(i, 1);
                        }
                    }

                    if (this.part == Config.partsPerBeat) {
                        this.part = 0;

                        if (playSong) {
                            this.beat++;
                            if (this.beat == song.beatsPerBar) {
                                // bar changed, reset for next bar:
                                this.beat = 0;

                                if (this.countInMetronome) {
                                    this.countInMetronome = false;
                                } else {
                                    this.prevBar = this.bar;
                                    this.bar = this.getNextBar();
                                    if (this.bar <= this.prevBar && this.loopRepeatCount > 0) this.loopRepeatCount--;

                                    if (this.bar >= song.barCount) {
                                        this.bar = 0;
                                        if (this.loopRepeatCount != -1) {
                                            ended = true;
                                            this.resetEffects();
                                            this.pause();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Update mod values so that next values copy to current values
            for (let setting: number = 0; setting < Config.modulators.length; setting++) {
                if (this.nextModValues != null && this.nextModValues[setting] != null)
                    this.modValues[setting] = this.nextModValues[setting];
            }

            // Set samples per tick if song tempo mods changed it
            if (this.isModActive(Config.modulators.dictionary["tempo"].index)) {
                samplesPerTick = this.getSamplesPerTick();
                this.tickSampleCountdown = Math.min(this.tickSampleCountdown, samplesPerTick);
            }

            // Bound LFO times to be within their period (to keep values from getting large)
            // I figured this modulo math probably doesn't have to happen every LFO tick.
            for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
                if (this.song.channels[channelIndex].type === ChannelType.Mod) continue;
                for (let instrumentIndex = 0; instrumentIndex < this.channels[channelIndex].instruments.length; instrumentIndex++) {
                    const instrumentState: InstrumentState = this.channels[channelIndex].instruments[instrumentIndex];
                    const instrument: Instrument = this.song.channels[channelIndex].instruments[instrumentIndex];
                    instrumentState.nextVibratoTime = (instrumentState.nextVibratoTime % (Config.vibratoTypes[instrument.vibratoType].period / (Config.ticksPerPart * samplesPerTick / this.samplesPerSecond)));
                    instrumentState.arpTime = (instrumentState.arpTime % (2520 * Config.ticksPerArpeggio)); // 2520 = LCM of 4, 5, 6, 7, 8, 9 (arp sizes)
                    for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
                        instrumentState.envelopeTime[envelopeIndex] = (instrumentState.envelopeTime[envelopeIndex] % (Config.partsPerBeat * Config.ticksPerPart * this.song.beatsPerBar));
                    }
                }
            }

            const maxInstrumentsPerChannel = this.song.getMaxInstrumentsPerChannel();
            for (let setting: number = 0; setting < Config.modulators.length; setting++) {
				for (let channelIndex: number = 0; channelIndex < this.song.getChannelCount(); channelIndex++) {
					const channel = this.song.channels[channelIndex];
					if (channel.type === ChannelType.Mod) continue;
					for (let instrument: number = 0; instrument < maxInstrumentsPerChannel; instrument++) {
						if (this.nextModInsValues != null && this.nextModInsValues[channelIndex] != null && this.nextModInsValues[channelIndex][instrument] != null && this.nextModInsValues[channelIndex][instrument][setting] != null) {
							this.modInsValues[channelIndex][instrument][setting] = this.nextModInsValues[channelIndex][instrument][setting];
                        }
                    }
                }
            }
        }

        // Optimization: Avoid persistent reverb values in the float denormal range.
        if (!Number.isFinite(limit) || Math.abs(limit) < epsilon) limit = 0.0;
        this.limit = limit;

        if (playSong && !this.countInMetronome) {
            this.playheadInternal = (((this.tick + 1.0 - this.tickSampleCountdown / samplesPerTick) / 2.0 + this.part) / Config.partsPerBeat + this.beat) / song.beatsPerBar + this.bar;
        }

        /*
        const synthDuration: number = performance.now() - synthStartTime;
        // Performance measurements:
        samplesAccumulated += outputBufferLength;
        samplePerformance += synthDuration;
    	
        if (samplesAccumulated >= 44100 * 4) {
            const secondsGenerated = samplesAccumulated / 44100;
            const secondsRequired = samplePerformance / 1000;
            const ratio = secondsRequired / secondsGenerated;
            console.log(ratio);
            samplePerformance = 0;
            samplesAccumulated = 0;
        }
        */
    }

    private freeTone(tone: Tone): void {
        this.tonePool.pushBack(tone);
    }

    private newTone(): Tone {
        if (this.tonePool.count() > 0) {
            const tone: Tone = this.tonePool.popBack();
            tone.freshlyAllocated = true;
            return tone;
        }
        return new Tone();
    }

    private releaseTone(instrumentState: InstrumentState, tone: Tone): void {
        instrumentState.releasedTones.pushFront(tone);
        tone.atNoteStart = false;
        tone.passedEndOfNote = true;
    }

    private freeReleasedTone(instrumentState: InstrumentState, toneIndex: number): void {
        this.freeTone(instrumentState.releasedTones.get(toneIndex));
        instrumentState.releasedTones.remove(toneIndex);
    }

    public freeAllTones(): void {
        for (const channelState of this.channels) {
            for (const instrumentState of channelState.instruments) {
                while (instrumentState.activeTones.count() > 0) this.freeTone(instrumentState.activeTones.popBack());
                while (instrumentState.activeModTones.count() > 0) this.freeTone(instrumentState.activeModTones.popBack());
                while (instrumentState.releasedTones.count() > 0) this.freeTone(instrumentState.releasedTones.popBack());
                while (instrumentState.liveInputTones.count() > 0) this.freeTone(instrumentState.liveInputTones.popBack());
            }
        }
    }

    private determineLiveInputTones(song: Song, channelIndex: number, samplesPerTick: number): void {
        const channel: Channel = song.channels[channelIndex];
        const channelState: ChannelState = this.channels[channelIndex];
        const pitches: number[] = this.liveInputPitches;
        const bassPitches: number[] = this.liveBassInputPitches;

        if (this.liveInputPitches.length > 0 || this.liveBassInputPitches.length > 0) {
            this.computeLatestModValues();
        }

        for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
            const instrumentState: InstrumentState = channelState.instruments[instrumentIndex];
            const toneList: Deque<Tone> = instrumentState.liveInputTones;
            let toneCount: number = 0;
            if (this.liveInputDuration > 0 && (channelIndex == this.liveInputChannel) && pitches.length > 0 && this.liveInputInstruments.indexOf(instrumentIndex) != -1) {
                const instrument: Instrument = channel.instruments[instrumentIndex];

                if (instrument.getChord().singleTone) {
                    let tone: Tone;
                    if (toneList.count() <= toneCount) {
                        tone = this.newTone();
                        toneList.pushBack(tone);
                    } else if (!instrument.getTransition().isSeamless && this.liveInputStarted) {
                        this.releaseTone(instrumentState, toneList.get(toneCount));
                        tone = this.newTone();
                        toneList.set(toneCount, tone);
                    } else {
                        tone = toneList.get(toneCount);
                    }
                    toneCount++;

                    for (let i: number = 0; i < pitches.length; i++) {
                        tone.pitches[i] = pitches[i];
                    }
                    tone.pitchCount = pitches.length;
                    tone.chordSize = 1;
                    tone.instrumentIndex = instrumentIndex;
                    tone.note = tone.prevNote = tone.nextNote = null;
                    tone.atNoteStart = this.liveInputStarted;
                    tone.forceContinueAtStart = false;
                    tone.forceContinueAtEnd = false;
                    this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                } else {
                    //const transition: Transition = instrument.getTransition();

                    this.moveTonesIntoOrderedTempMatchedList(toneList, pitches);

                    for (let i: number = 0; i < pitches.length; i++) {
                        //const strumOffsetParts: number = i * instrument.getChord().strumParts;

                        let tone: Tone;
                        if (this.tempMatchedPitchTones[toneCount] != null) {
                            tone = this.tempMatchedPitchTones[toneCount]!;
                            this.tempMatchedPitchTones[toneCount] = null;
                            if (tone.pitchCount != 1 || tone.pitches[0] != pitches[i]) {
                                this.releaseTone(instrumentState, tone);
                                tone = this.newTone();
                            }
                            toneList.pushBack(tone);
                        } else {
                            tone = this.newTone();
                            toneList.pushBack(tone);
                        }
                        toneCount++;

                        tone.pitches[0] = pitches[i];
                        tone.pitchCount = 1;
                        tone.chordSize = pitches.length;
                        tone.instrumentIndex = instrumentIndex;
                        tone.note = tone.prevNote = tone.nextNote = null;
                        tone.atNoteStart = this.liveInputStarted;
                        tone.forceContinueAtStart = false;
                        tone.forceContinueAtEnd = false;
                        this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                    }
                }
            }

            if (this.liveBassInputDuration > 0 && (channelIndex == this.liveBassInputChannel) && bassPitches.length > 0 && this.liveBassInputInstruments.indexOf(instrumentIndex) != -1) {
                const instrument: Instrument = channel.instruments[instrumentIndex];

                if (instrument.getChord().singleTone) {
                    let tone: Tone;
                    if (toneList.count() <= toneCount) {
                        tone = this.newTone();
                        toneList.pushBack(tone);
                    } else if (!instrument.getTransition().isSeamless && this.liveInputStarted) {
                        this.releaseTone(instrumentState, toneList.get(toneCount));
                        tone = this.newTone();
                        toneList.set(toneCount, tone);
                    } else {
                        tone = toneList.get(toneCount);
                    }
                    toneCount++;

                    for (let i: number = 0; i < bassPitches.length; i++) {
                        tone.pitches[i] = bassPitches[i];
                    }
                    tone.pitchCount = bassPitches.length;
                    tone.chordSize = 1;
                    tone.instrumentIndex = instrumentIndex;
                    tone.note = tone.prevNote = tone.nextNote = null;
                    tone.atNoteStart = this.liveBassInputStarted;
                    tone.forceContinueAtStart = false;
                    tone.forceContinueAtEnd = false;
                    this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                } else {
                    //const transition: Transition = instrument.getTransition();

                    this.moveTonesIntoOrderedTempMatchedList(toneList, bassPitches);

                    for (let i: number = 0; i < bassPitches.length; i++) {
                        //const strumOffsetParts: number = i * instrument.getChord().strumParts;

                        let tone: Tone;
                        if (this.tempMatchedPitchTones[toneCount] != null) {
                            tone = this.tempMatchedPitchTones[toneCount]!;
                            this.tempMatchedPitchTones[toneCount] = null;
                            if (tone.pitchCount != 1 || tone.pitches[0] != bassPitches[i]) {
                                this.releaseTone(instrumentState, tone);
                                tone = this.newTone();
                            }
                            toneList.pushBack(tone);
                        } else {
                            tone = this.newTone();
                            toneList.pushBack(tone);
                        }
                        toneCount++;

                        tone.pitches[0] = bassPitches[i];
                        tone.pitchCount = 1;
                        tone.chordSize = bassPitches.length;
                        tone.instrumentIndex = instrumentIndex;
                        tone.note = tone.prevNote = tone.nextNote = null;
                        tone.atNoteStart = this.liveBassInputStarted;
                        tone.forceContinueAtStart = false;
                        tone.forceContinueAtEnd = false;
                        this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                    }
                }
            }

            while (toneList.count() > toneCount) {
                this.releaseTone(instrumentState, toneList.popBack());
            }

            this.clearTempMatchedPitchTones(toneCount, instrumentState);
        }

        this.liveInputStarted = false;
        this.liveBassInputStarted = false;
    }

    // Returns the chord type of the instrument in the adjacent pattern if it is compatible for a
    // seamless transition across patterns, otherwise returns null.
    private adjacentPatternHasCompatibleInstrumentTransition(song: Song, channel: Channel, pattern: Pattern, otherPattern: Pattern, instrumentIndex: number, transition: Transition, chord: Chord, note: Note, otherNote: Note, forceContinue: boolean): Chord | null {
        if (song.patternInstruments && otherPattern.instruments.indexOf(instrumentIndex) == -1) {
            // The adjacent pattern does not contain the same instrument as the current pattern.

            if (pattern.instruments.length > 1 || otherPattern.instruments.length > 1) {
                // The current or adjacent pattern contains more than one instrument, don't bother
                // trying to connect them.
                return null;
            }
            // Otherwise, the two patterns each contain one instrument, but not the same instrument.
            // Try to connect them.
            const otherInstrument: Instrument = channel.instruments[otherPattern.instruments[0]];

            if (forceContinue) {
                // Even non-seamless instruments can be connected across patterns if forced.
                return otherInstrument.getChord();
            }

            // Otherwise, check that both instruments are seamless across patterns.
            const otherTransition: Transition = otherInstrument.getTransition();
            if (transition.includeAdjacentPatterns && otherTransition.includeAdjacentPatterns && otherTransition.slides == transition.slides) {
                return otherInstrument.getChord();
            } else {
                return null;
            }
        } else {
            // If both patterns contain the same instrument, check that it is seamless across patterns.
            return (forceContinue || transition.includeAdjacentPatterns) ? chord : null;
        }
    }

    public static adjacentNotesHaveMatchingPitches(firstNote: Note, secondNote: Note): boolean {
        if (firstNote.pitches.length != secondNote.pitches.length) return false;
        const firstNoteInterval: number = firstNote.pins[firstNote.pins.length - 1].interval;
        for (const pitch of firstNote.pitches) {
            if (secondNote.pitches.indexOf(pitch + firstNoteInterval) == -1) return false;
        }
        return true;
    }

    private moveTonesIntoOrderedTempMatchedList(toneList: Deque<Tone>, notePitches: number[]): void {
        // The tones are about to seamlessly transition to a new note. The pitches
        // from the old note may or may not match any of the pitches in the new
        // note, and not necessarily in order, but if any do match, they'll sound
        // better if those tones continue to have the same pitch. Attempt to find
        // the right spot for each old tone in the new chord if possible.

        for (let i: number = 0; i < toneList.count(); i++) {
            const tone: Tone = toneList.get(i);
            const pitch: number = tone.pitches[0] + tone.lastInterval;
            for (let j: number = 0; j < notePitches.length; j++) {
                if (notePitches[j] == pitch) {
                    this.tempMatchedPitchTones[j] = tone;
                    toneList.remove(i);
                    i--;
                    break;
                }
            }
        }

        // Any tones that didn't get matched should just fill in the gaps.
        while (toneList.count() > 0) {
            const tone: Tone = toneList.popFront();
            for (let j: number = 0; j < this.tempMatchedPitchTones.length; j++) {
                if (this.tempMatchedPitchTones[j] == null) {
                    this.tempMatchedPitchTones[j] = tone;
                    break;
                }
            }
        }
    }

    private determineCurrentActiveTones(song: Song, channelIndex: number, samplesPerTick: number, playSong: boolean): void {
        const channel: Channel = song.channels[channelIndex];
        const channelState: ChannelState = this.channels[channelIndex];
        const pattern: Pattern | null = song.getPattern(channelIndex, this.bar);
        const currentPart: number = this.getCurrentPart();
        const currentTick: number = this.tick + Config.ticksPerPart * currentPart;

        if (playSong && song.getChannelIsMod(channelIndex)) {

            // For mod channels, notes aren't strictly arranged chronologically. Also, each pitch value could play or not play at a given time. So... a bit more computation involved!
            // The same transition logic should apply though, even though it isn't really used by mod channels.
            let notes: (Note | null)[] = [];
            let prevNotes: (Note | null)[] = [];
            let nextNotes: (Note | null)[] = [];
            let fillCount: number = Config.modCount;
            while (fillCount--) {
                notes.push(null);
                prevNotes.push(null);
                nextNotes.push(null);
            }

            if (pattern != null && !channel.muted) {
                for (let i: number = 0; i < pattern.notes.length; i++) {
                    if (pattern.notes[i].end <= currentPart) {
                        // Actually need to check which note starts closer to the start of this note.
                        if (prevNotes[pattern.notes[i].pitches[0]] == null || pattern.notes[i].end > (prevNotes[pattern.notes[i].pitches[0]] as Note).start) {
                            prevNotes[pattern.notes[i].pitches[0]] = pattern.notes[i];
                        }
                    }
                    else if (pattern.notes[i].start <= currentPart && pattern.notes[i].end > currentPart) {
                        notes[pattern.notes[i].pitches[0]] = pattern.notes[i];
                    }
                    else if (pattern.notes[i].start > currentPart) {
                        // Actually need to check which note starts closer to the end of this note.
                        if (nextNotes[pattern.notes[i].pitches[0]] == null || pattern.notes[i].start < (nextNotes[pattern.notes[i].pitches[0]] as Note).start) {
                            nextNotes[pattern.notes[i].pitches[0]] = pattern.notes[i];
                        }
                    }
                }
            }

            let modToneCount: number = 0;
            const newInstrumentIndex: number = (song.patternInstruments && (pattern != null)) ? pattern!.instruments[0] : 0;
            const instrumentState: InstrumentState = channelState.instruments[newInstrumentIndex];
            const toneList: Deque<Tone> = instrumentState.activeModTones;
            for (let mod: number = 0; mod < Config.modCount; mod++) {
                if (notes[mod] != null) {
                    if (prevNotes[mod] != null && (prevNotes[mod] as Note).end != (notes[mod] as Note).start) prevNotes[mod] = null;
                    if (nextNotes[mod] != null && (nextNotes[mod] as Note).start != (notes[mod] as Note).end) nextNotes[mod] = null;

                }

                if (channelState.singleSeamlessInstrument != null && channelState.singleSeamlessInstrument != newInstrumentIndex && channelState.singleSeamlessInstrument < channelState.instruments.length) {
                    const sourceInstrumentState: InstrumentState = channelState.instruments[channelState.singleSeamlessInstrument];
                    const destInstrumentState: InstrumentState = channelState.instruments[newInstrumentIndex];
                    while (sourceInstrumentState.activeModTones.count() > 0) {
                        destInstrumentState.activeModTones.pushFront(sourceInstrumentState.activeModTones.popBack());
                    }
                }
                channelState.singleSeamlessInstrument = newInstrumentIndex;

                if (notes[mod] != null) {
                    let prevNoteForThisInstrument: Note | null = prevNotes[mod];
                    let nextNoteForThisInstrument: Note | null = nextNotes[mod];

                    let forceContinueAtStart: boolean = false;
                    let forceContinueAtEnd: boolean = false;
                    const atNoteStart: boolean = (Config.ticksPerPart * notes[mod]!.start == currentTick) && this.isAtStartOfTick;
                    let tone: Tone;
                    if (toneList.count() <= modToneCount) {
                        tone = this.newTone();
                        toneList.pushBack(tone);
                    } else if (atNoteStart && (prevNoteForThisInstrument == null)) {
                        const oldTone: Tone = toneList.get(modToneCount);
                        if (oldTone.isOnLastTick) {
                            this.freeTone(oldTone);
                        } else {
                            this.releaseTone(instrumentState, oldTone);
                        }
                        tone = this.newTone();
                        toneList.set(modToneCount, tone);
                    } else {
                        tone = toneList.get(modToneCount);
                    }
                    modToneCount++;

                    for (let i: number = 0; i < notes[mod]!.pitches.length; i++) {
                        tone.pitches[i] = notes[mod]!.pitches[i];
                    }
                    tone.pitchCount = notes[mod]!.pitches.length;
                    tone.chordSize = 1;
                    tone.instrumentIndex = newInstrumentIndex;
                    tone.note = notes[mod];
                    tone.noteStartPart = notes[mod]!.start;
                    tone.noteEndPart = notes[mod]!.end;
                    tone.prevNote = prevNoteForThisInstrument;
                    tone.nextNote = nextNoteForThisInstrument;
                    tone.prevNotePitchIndex = 0;
                    tone.nextNotePitchIndex = 0;
                    tone.atNoteStart = atNoteStart;
                    tone.passedEndOfNote = false;
                    tone.forceContinueAtStart = forceContinueAtStart;
                    tone.forceContinueAtEnd = forceContinueAtEnd;
                }
            }
            // Automatically free or release seamless tones if there's no new note to take over.
            while (toneList.count() > modToneCount) {
                const tone: Tone = toneList.popBack();
                const channel: Channel = song.channels[channelIndex];
                if (tone.instrumentIndex < channel.instruments.length && !tone.isOnLastTick) {
                    const instrumentState: InstrumentState = this.channels[channelIndex].instruments[tone.instrumentIndex];
                    this.releaseTone(instrumentState, tone);
                } else {
                    this.freeTone(tone);
                }
            }

        }
        else if (!song.getChannelIsMod(channelIndex)) {

            let note: Note | null = null;
            let prevNote: Note | null = null;
            let nextNote: Note | null = null;

            if (playSong && pattern != null && !channel.muted && (!this.isRecording || this.liveInputChannel != channelIndex)) {
                for (let i: number = 0; i < pattern.notes.length; i++) {
                    if (pattern.notes[i].end <= currentPart) {
                        prevNote = pattern.notes[i];
                    } else if (pattern.notes[i].start <= currentPart && pattern.notes[i].end > currentPart) {
                        note = pattern.notes[i];
                    } else if (pattern.notes[i].start > currentPart) {
                        nextNote = pattern.notes[i];
                        break;
                    }
                }

                if (note != null) {
                    if (prevNote != null && prevNote.end != note.start) prevNote = null;
                    if (nextNote != null && nextNote.start != note.end) nextNote = null;
                }
            }

            // Seamless tones from a pattern with a single instrument can be transferred to a different single seamless instrument in the next pattern.
            if (pattern != null && (!song.layeredInstruments || channel.instruments.length == 1 || (song.patternInstruments && pattern.instruments.length == 1))) {
                const newInstrumentIndex: number = song.patternInstruments ? pattern.instruments[0] : 0;
                if (channelState.singleSeamlessInstrument != null && channelState.singleSeamlessInstrument != newInstrumentIndex && channelState.singleSeamlessInstrument < channelState.instruments.length) {
                    const sourceInstrumentState: InstrumentState = channelState.instruments[channelState.singleSeamlessInstrument];
                    const destInstrumentState: InstrumentState = channelState.instruments[newInstrumentIndex];
                    while (sourceInstrumentState.activeTones.count() > 0) {
                        destInstrumentState.activeTones.pushFront(sourceInstrumentState.activeTones.popBack());
                    }
                }
                channelState.singleSeamlessInstrument = newInstrumentIndex;
            } else {
                channelState.singleSeamlessInstrument = null;
            }

            for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
                const instrumentState: InstrumentState = channelState.instruments[instrumentIndex];
                const toneList: Deque<Tone> = instrumentState.activeTones;
                let toneCount: number = 0;
                if ((note != null) && (!song.patternInstruments || (pattern!.instruments.indexOf(instrumentIndex) != -1))) {
                    const instrument: Instrument = channel.instruments[instrumentIndex];
                    let prevNoteForThisInstrument: Note | null = prevNote;
                    let nextNoteForThisInstrument: Note | null = nextNote;

                    const partsPerBar: Number = Config.partsPerBeat * song.beatsPerBar;
                    const transition: Transition = instrument.getTransition();
                    const chord: Chord = instrument.getChord();
                    let forceContinueAtStart: boolean = false;
                    let forceContinueAtEnd: boolean = false;
                    let tonesInPrevNote: number = 0;
                    let tonesInNextNote: number = 0;
                    if (note.start == 0) {
                        // If the beginning of the note coincides with the beginning of the pattern,
                        let prevPattern: Pattern | null = (this.prevBar == null) ? null : song.getPattern(channelIndex, this.prevBar);
                        if (prevPattern != null) {
                            const lastNote: Note | null = (prevPattern.notes.length <= 0) ? null : prevPattern.notes[prevPattern.notes.length - 1];
                            if (lastNote != null && lastNote.end == partsPerBar) {
                                const patternForcesContinueAtStart: boolean = note.continuesLastPattern && Synth.adjacentNotesHaveMatchingPitches(lastNote, note);
                                const chordOfCompatibleInstrument: Chord | null = this.adjacentPatternHasCompatibleInstrumentTransition(song, channel, pattern!, prevPattern, instrumentIndex, transition, chord, note, lastNote, patternForcesContinueAtStart);
                                if (chordOfCompatibleInstrument != null) {
                                    prevNoteForThisInstrument = lastNote;
                                    tonesInPrevNote = chordOfCompatibleInstrument.singleTone ? 1 : prevNoteForThisInstrument.pitches.length
                                    forceContinueAtStart = patternForcesContinueAtStart;
                                }
                            }
                        }
                    } else if (prevNoteForThisInstrument != null) {
                        tonesInPrevNote = chord.singleTone ? 1 : prevNoteForThisInstrument.pitches.length
                    }
                    if (note.end == partsPerBar) {
                        // If the end of the note coincides with the end of the pattern, look for an
                        // adjacent note at the beginning of the next pattern.
                        let nextPattern: Pattern | null = (this.nextBar == null) ? null : song.getPattern(channelIndex, this.nextBar);
                        if (nextPattern != null) {
                            const firstNote: Note | null = (nextPattern.notes.length <= 0) ? null : nextPattern.notes[0];
                            if (firstNote != null && firstNote.start == 0) {
                                const nextPatternForcesContinueAtStart: boolean = firstNote.continuesLastPattern && Synth.adjacentNotesHaveMatchingPitches(note, firstNote);
                                const chordOfCompatibleInstrument: Chord | null = this.adjacentPatternHasCompatibleInstrumentTransition(song, channel, pattern!, nextPattern, instrumentIndex, transition, chord, note, firstNote, nextPatternForcesContinueAtStart);
                                if (chordOfCompatibleInstrument != null) {
                                    nextNoteForThisInstrument = firstNote;
                                    tonesInNextNote = chordOfCompatibleInstrument.singleTone ? 1 : nextNoteForThisInstrument.pitches.length
                                    forceContinueAtEnd = nextPatternForcesContinueAtStart;
                                }
                            }
                        }
                    } else if (nextNoteForThisInstrument != null) {
                        tonesInNextNote = chord.singleTone ? 1 : nextNoteForThisInstrument.pitches.length
                    }

                    if (chord.singleTone) {
                        const atNoteStart: boolean = (Config.ticksPerPart * note.start == currentTick);
                        let tone: Tone;
                        if (toneList.count() <= toneCount) {
                            tone = this.newTone();
                            toneList.pushBack(tone);
                        } else if (atNoteStart && ((!(transition.isSeamless || instrument.clicklessTransition) && !forceContinueAtStart) || prevNoteForThisInstrument == null)) {
                            const oldTone: Tone = toneList.get(toneCount);
                            if (oldTone.isOnLastTick) {
                                this.freeTone(oldTone);
                            } else {
                                this.releaseTone(instrumentState, oldTone);
                            }
                            tone = this.newTone();
                            toneList.set(toneCount, tone);
                        } else {
                            tone = toneList.get(toneCount);
                        }
                        toneCount++;

                        for (let i: number = 0; i < note.pitches.length; i++) {
                            tone.pitches[i] = note.pitches[i];
                        }
                        tone.pitchCount = note.pitches.length;
                        tone.chordSize = 1;
                        tone.instrumentIndex = instrumentIndex;
                        tone.note = note;
                        tone.noteStartPart = note.start;
                        tone.noteEndPart = note.end;
                        tone.prevNote = prevNoteForThisInstrument;
                        tone.nextNote = nextNoteForThisInstrument;
                        tone.prevNotePitchIndex = 0;
                        tone.nextNotePitchIndex = 0;
                        tone.atNoteStart = atNoteStart;
                        tone.passedEndOfNote = false;
                        tone.forceContinueAtStart = forceContinueAtStart;
                        tone.forceContinueAtEnd = forceContinueAtEnd;
                        this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                    } else {
                        const transition: Transition = instrument.getTransition();

                        if (((transition.isSeamless && !transition.slides && chord.strumParts == 0) || forceContinueAtStart) && (Config.ticksPerPart * note.start == currentTick) && prevNoteForThisInstrument != null) {
                            this.moveTonesIntoOrderedTempMatchedList(toneList, note.pitches);
                        }

                        let strumOffsetParts: number = 0;
                        for (let i: number = 0; i < note.pitches.length; i++) {

                            let prevNoteForThisTone: Note | null = (tonesInPrevNote > i) ? prevNoteForThisInstrument : null;
                            let noteForThisTone: Note = note;
                            let nextNoteForThisTone: Note | null = (tonesInNextNote > i) ? nextNoteForThisInstrument : null;
                            let noteStartPart: number = noteForThisTone.start + strumOffsetParts;
                            let passedEndOfNote: boolean = false;

                            // Strumming may mean that a note's actual start time may be after the
                            // note's displayed start time. If the note start hasn't been reached yet,
                            // carry over the previous tone if available and seamless, otherwise skip
                            // the new tone until it is ready to start.
                            if (noteStartPart > currentPart) {
                                if (toneList.count() > i && (transition.isSeamless || forceContinueAtStart) && prevNoteForThisTone != null) {
                                    // Continue the previous note's chord until the current one takes over.
                                    nextNoteForThisTone = noteForThisTone;
                                    noteForThisTone = prevNoteForThisTone;
                                    prevNoteForThisTone = null;
                                    noteStartPart = noteForThisTone.start + strumOffsetParts;
                                    passedEndOfNote = true;
                                } else {
                                    // This and the rest of the tones in the chord shouldn't start yet.
                                    break;
                                }
                            }

                            let noteEndPart: number = noteForThisTone.end;
                            if ((transition.isSeamless || forceContinueAtStart) && nextNoteForThisTone != null) {
                                noteEndPart = Math.min(Config.partsPerBeat * this.song!.beatsPerBar, noteEndPart + strumOffsetParts);
                            }
                            if ((!transition.continues && !forceContinueAtStart) || prevNoteForThisTone == null) {
                                strumOffsetParts += chord.strumParts;
                            }

                            const atNoteStart: boolean = (Config.ticksPerPart * noteStartPart == currentTick);
                            let tone: Tone;
                            if (this.tempMatchedPitchTones[toneCount] != null) {
                                tone = this.tempMatchedPitchTones[toneCount]!;
                                this.tempMatchedPitchTones[toneCount] = null;
                                toneList.pushBack(tone);
                            } else if (toneList.count() <= toneCount) {
                                tone = this.newTone();
                                toneList.pushBack(tone);
                            } else if (atNoteStart && ((!transition.isSeamless && !forceContinueAtStart) || prevNoteForThisTone == null)) {
                                const oldTone: Tone = toneList.get(toneCount);
                                if (oldTone.isOnLastTick) {
                                    this.freeTone(oldTone);
                                } else {
                                    this.releaseTone(instrumentState, oldTone);
                                }
                                tone = this.newTone();
                                toneList.set(toneCount, tone);
                            } else {
                                tone = toneList.get(toneCount);
                            }
                            toneCount++;

                            tone.pitches[0] = noteForThisTone.pitches[i];
                            tone.pitchCount = 1;
                            tone.chordSize = noteForThisTone.pitches.length;
                            tone.instrumentIndex = instrumentIndex;
                            tone.note = noteForThisTone;
                            tone.noteStartPart = noteStartPart;
                            tone.noteEndPart = noteEndPart;
                            tone.prevNote = prevNoteForThisTone;
                            tone.nextNote = nextNoteForThisTone;
                            tone.prevNotePitchIndex = i;
                            tone.nextNotePitchIndex = i;
                            tone.atNoteStart = atNoteStart;
                            tone.passedEndOfNote = passedEndOfNote;
                            tone.forceContinueAtStart = forceContinueAtStart && prevNoteForThisTone != null;
                            tone.forceContinueAtEnd = forceContinueAtEnd && nextNoteForThisTone != null;
                            this.computeTone(song, channelIndex, samplesPerTick, tone, false, false);
                        }
                    }
                    if (transition.continues && (toneList.count() <= 0) || (note.pitches.length <= 0)) instrumentState.envelopeComputer.reset(); //stop computing effects envelopes
                }
                // Automatically free or release seamless tones if there's no new note to take over.
                while (toneList.count() > toneCount) {
                    const tone: Tone = toneList.popBack();
                    const channel: Channel = song.channels[channelIndex];
                    if (tone.instrumentIndex < channel.instruments.length && !tone.isOnLastTick) {
                        const instrumentState: InstrumentState = channelState.instruments[tone.instrumentIndex];
                        this.releaseTone(instrumentState, tone);
                    } else {
                        this.freeTone(tone);
                    }
                }

                this.clearTempMatchedPitchTones(toneCount, instrumentState);
            }
        }
    }

    private clearTempMatchedPitchTones(toneCount: number, instrumentState: InstrumentState): void {
        for (let i: number = toneCount; i < this.tempMatchedPitchTones.length; i++) {
            const oldTone: Tone | null = this.tempMatchedPitchTones[i];
            if (oldTone != null) {
                if (oldTone.isOnLastTick) {
                    this.freeTone(oldTone);
                } else {
                    this.releaseTone(instrumentState, oldTone);
                }
                this.tempMatchedPitchTones[i] = null;
            }
        }
    }


    private playTone(channelIndex: number, bufferIndex: number, runLength: number, tone: Tone): void {
        const channelState: ChannelState = this.channels[channelIndex];
        const instrumentState: InstrumentState = channelState.instruments[tone.instrumentIndex];

        if (instrumentState.synthesizer != null) instrumentState.synthesizer!(this, bufferIndex, runLength, tone, instrumentState);
        tone.envelopeComputer.clearEnvelopes();
        instrumentState.envelopeComputer.clearEnvelopes();
    }

    // Computes mod note position at the start and end of the window and "plays" the mod tone, setting appropriate mod data.
    private playModTone(song: Song, channelIndex: number, samplesPerTick: number, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, released: boolean, shouldFadeOutFast: boolean): void {
        const channel: Channel = song.channels[channelIndex];
        const instrument: Instrument = channel.instruments[tone.instrumentIndex];

        if (tone.note != null) {
            const ticksIntoBar: number = this.getTicksIntoBar();
            const partTimeTickStart: number = (ticksIntoBar) / Config.ticksPerPart;
            const partTimeTickEnd: number = (ticksIntoBar + 1) / Config.ticksPerPart;
            const tickSampleCountdown: number = this.tickSampleCountdown;
            const startRatio: number = 1.0 - (tickSampleCountdown) / samplesPerTick;
            const endRatio: number = 1.0 - (tickSampleCountdown - roundedSamplesPerTick) / samplesPerTick;
            const partTimeStart: number = partTimeTickStart + (partTimeTickEnd - partTimeTickStart) * startRatio;
            const partTimeEnd: number = partTimeTickStart + (partTimeTickEnd - partTimeTickStart) * endRatio;
            const tickTimeStart: number = Config.ticksPerPart * partTimeStart;
            const tickTimeEnd: number = Config.ticksPerPart * partTimeEnd;
            const endPinIndex: number = tone.note.getEndPinIndex(this.getCurrentPart());
            const startPin: NotePin = tone.note.pins[endPinIndex - 1];
            const endPin: NotePin = tone.note.pins[endPinIndex];
            const startPinTick: number = (tone.note.start + startPin.time) * Config.ticksPerPart;
            const endPinTick: number = (tone.note.start + endPin.time) * Config.ticksPerPart;
            const ratioStart: number = (tickTimeStart - startPinTick) / (endPinTick - startPinTick);
            const ratioEnd: number = (tickTimeEnd - startPinTick) / (endPinTick - startPinTick);
            tone.expression = startPin.size + (endPin.size - startPin.size) * ratioStart;
            tone.expressionDelta = (startPin.size + (endPin.size - startPin.size) * ratioEnd) - tone.expression;

            Synth.modSynth(this, bufferIndex, roundedSamplesPerTick, tone, instrument);
        }
    }

    private static computeChordExpression(chordSize: number): number {
        return 1.0 / ((chordSize - 1) * 0.25 + 1.0);
    }

    private computeTone(song: Song, channelIndex: number, samplesPerTick: number, tone: Tone, released: boolean, shouldFadeOutFast: boolean): void {
        const roundedSamplesPerTick: number = Math.ceil(samplesPerTick);
        const channel: Channel = song.channels[channelIndex];
        const channelState: ChannelState = this.channels[channelIndex];
        const instrument: Instrument = channel.instruments[tone.instrumentIndex];
        const instrumentState: InstrumentState = channelState.instruments[tone.instrumentIndex];
        instrumentState.awake = true;
        instrumentState.tonesAddedInThisTick = true;
        if (!instrumentState.computed) {
            instrumentState.compute(this, instrument, samplesPerTick, roundedSamplesPerTick, tone, channelIndex, tone.instrumentIndex);
        }
        const transition: Transition = instrument.getTransition();
        const chord: Chord = instrument.getChord();
        const chordExpression: number = chord.singleTone ? 1.0 : Synth.computeChordExpression(tone.chordSize);
        const isNoiseChannel: boolean = song.getChannelIsNoise(channelIndex);
        const intervalScale: number = isNoiseChannel ? Config.noiseInterval : 1;
        const secondsPerPart: number = Config.ticksPerPart * samplesPerTick / this.samplesPerSecond;
        const sampleTime: number = 1.0 / this.samplesPerSecond;
        const beatsPerPart: number = 1.0 / Config.partsPerBeat;
        const ticksIntoBar: number = this.getTicksIntoBar();
        const partTimeStart: number = (ticksIntoBar) / Config.ticksPerPart;
        const partTimeEnd: number = (ticksIntoBar + 1.0) / Config.ticksPerPart;
        const currentPart: number = this.getCurrentPart();

        let specialIntervalMult: number = 1.0;
        tone.specialIntervalExpressionMult = 1.0;

        //if (synth.isModActive(ModSetting.mstPan, channelIndex, tone.instrumentIndex)) {
        //    startPan = synth.getModValue(ModSetting.mstPan, false, channel, instrumentIdx, false);
        //    endPan = synth.getModValue(ModSetting.mstPan, false, channel, instrumentIdx, true);
        //}

        let toneIsOnLastTick: boolean = shouldFadeOutFast;
        let intervalStart: number = 0.0;
        let intervalEnd: number = 0.0;
        let fadeExpressionStart: number = 1.0;
        let fadeExpressionEnd: number = 1.0;
        let chordExpressionStart: number = chordExpression;
        let chordExpressionEnd: number = chordExpression;

        let discreteSlideType = -1;
        if (effectsIncludeDiscreteSlide(instrument.effects)) {
            discreteSlideType = instrument.discreteSlide;
        }
        if (discreteSlideType) {};


        let expressionReferencePitch: number = 16; // A low "E" as a MIDI pitch.
        let basePitch: number = Config.keys[song.key].basePitch + (Config.pitchesPerOctave * song.octave);
        let baseExpression: number = 1.0;
        let pitchDamping: number = 48;
        if (instrument.type == InstrumentType.spectrum) {
            baseExpression = Config.spectrumBaseExpression;
            if (isNoiseChannel) {
                basePitch = Config.spectrumBasePitch;
                baseExpression *= 2.0; // Note: spectrum is louder for drum channels than pitch channels!
            }
            expressionReferencePitch = Config.spectrumBasePitch;
            pitchDamping = 28;
        } else if (instrument.type == InstrumentType.drumset) {
            basePitch = Config.spectrumBasePitch;
            baseExpression = Config.drumsetBaseExpression;
            expressionReferencePitch = basePitch;
        } else if (instrument.type == InstrumentType.noise) {
            // dogebox2 code, makes basic noise affected by keys in pitch channels
            basePitch = isNoiseChannel ? Config.chipNoises[instrument.chipNoise].basePitch : basePitch + Config.chipNoises[instrument.chipNoise].basePitch - 12;
            // maybe also lower expression in pitch channels?
            baseExpression = Config.noiseBaseExpression;
            expressionReferencePitch = basePitch;
            pitchDamping = Config.chipNoises[instrument.chipNoise].isSoft ? 24.0 : 60.0;
        } else if (instrument.type == InstrumentType.fm || instrument.type == InstrumentType.fm6op) {
            baseExpression = Config.fmBaseExpression;
        } else if (instrument.type == InstrumentType.chip) {
            baseExpression = Config.chipBaseExpression;
            if (Config.chipWaves[instrument.chipWave].isCustomSampled) {
                if (Config.chipWaves[instrument.chipWave].isPercussion) {
                    basePitch = -84.37 + Math.log2(Config.chipWaves[instrument.chipWave].samples.length / Config.chipWaves[instrument.chipWave].sampleRate!) * -12 - (-60 + Config.chipWaves[instrument.chipWave].rootKey!);
                } else {
                    basePitch += -96.37 + Math.log2(Config.chipWaves[instrument.chipWave].samples.length / Config.chipWaves[instrument.chipWave].sampleRate!) * -12 - (-60 + Config.chipWaves[instrument.chipWave].rootKey!);
                }
            } else {
                if (Config.chipWaves[instrument.chipWave].isSampled && !Config.chipWaves[instrument.chipWave].isPercussion) {
                    basePitch = basePitch - 63 + Config.chipWaves[instrument.chipWave].extraSampleDetune!
                } else if (Config.chipWaves[instrument.chipWave].isSampled && Config.chipWaves[instrument.chipWave].isPercussion) {
                    basePitch = -51 + Config.chipWaves[instrument.chipWave].extraSampleDetune!;
                }
            }
        } else if (instrument.type == InstrumentType.customChipWave) {
            baseExpression = Config.chipBaseExpression;
        } else if (instrument.type == InstrumentType.harmonics) {
            baseExpression = Config.harmonicsBaseExpression;
        } else if (instrument.type == InstrumentType.pwm) {
            baseExpression = Config.pwmBaseExpression;
        } else if (instrument.type == InstrumentType.supersaw) {
            baseExpression = Config.supersawBaseExpression;
        } else if (instrument.type == InstrumentType.pickedString) {
            baseExpression = Config.pickedStringBaseExpression;
        } else if (instrument.type == InstrumentType.mod) {
            baseExpression = 1.0;
            expressionReferencePitch = 0;
            pitchDamping = 1.0;
            basePitch = 0;
        } else {
            throw new Error("Unknown instrument type in computeTone.");
        }

        if ((tone.atNoteStart && !transition.isSeamless && !tone.forceContinueAtStart) || tone.freshlyAllocated) {
            tone.reset();
            instrumentState.envelopeComputer.reset();
            // advloop addition
            if (instrument.type == InstrumentType.chip && instrument.isUsingAdvancedLoopControls) {
                const chipWaveLength = Config.rawRawChipWaves[instrument.chipWave].samples.length - 1;
                const firstOffset = instrument.chipWaveStartOffset / chipWaveLength;
                // const lastOffset = (chipWaveLength - 0.01) / chipWaveLength;
                // @TODO: This is silly and I should actually figure out how to
                // properly keep lastOffset as 1.0 and not get it wrapped back
                // to 0 once it's in `Synth.loopableChipSynth`.
                const lastOffset = 0.999999999999999;
                for (let i = 0; i < Config.maxPitchOrOperatorCount; i++) {
                    tone.phases[i] = instrument.chipWavePlayBackwards ? Math.max(0, Math.min(lastOffset, firstOffset)) : Math.max(0, firstOffset);
                    tone.directions[i] = instrument.chipWavePlayBackwards ? -1 : 1;
                    tone.chipWaveCompletions[i] = 0;
                    tone.chipWavePrevWaves[i] = 0;
                    tone.chipWaveCompletionsLastWave[i] = 0;
                }
            }
            // advloop addition
        }
        tone.freshlyAllocated = false;

        for (let i: number = 0; i < Config.maxPitchOrOperatorCount; i++) {
            tone.phaseDeltas[i] = 0.0;
            tone.phaseDeltaScales[i] = 0.0;
            tone.operatorExpressions[i] = 0.0;
            tone.operatorExpressionDeltas[i] = 0.0;
        }
        tone.expression = 0.0;
        tone.expressionDelta = 0.0;
        for (let i: number = 0; i < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); i++) {
            tone.operatorWaves[i] = Synth.getOperatorWave(instrument.operators[i].waveform, instrument.operators[i].pulseWidth);
        }

        if (released) {
            const startTicksSinceReleased: number = tone.ticksSinceReleased;
            const endTicksSinceReleased: number = tone.ticksSinceReleased + 1.0;
            intervalStart = intervalEnd = tone.lastInterval;
            const fadeOutTicks: number = Math.abs(instrument.getFadeOutTicks());
            fadeExpressionStart = Synth.noteSizeToVolumeMult((1.0 - startTicksSinceReleased / fadeOutTicks) * Config.noteSizeMax);
            fadeExpressionEnd = Synth.noteSizeToVolumeMult((1.0 - endTicksSinceReleased / fadeOutTicks) * Config.noteSizeMax);

            if (shouldFadeOutFast) {
                fadeExpressionEnd = 0.0;
            }

            if (tone.ticksSinceReleased + 1 >= fadeOutTicks) toneIsOnLastTick = true;
        } else if (tone.note == null) {
            fadeExpressionStart = fadeExpressionEnd = 1.0;
            tone.lastInterval = 0;
            tone.ticksSinceReleased = 0;
            tone.liveInputSamplesHeld += roundedSamplesPerTick;
        } else {
            const note: Note = tone.note;
            const nextNote: Note | null = tone.nextNote;

            const noteStartPart: number = tone.noteStartPart;
            const noteEndPart: number = tone.noteEndPart;


            const endPinIndex: number = note.getEndPinIndex(currentPart);
            const startPin: NotePin = note.pins[endPinIndex - 1];
            const endPin: NotePin = note.pins[endPinIndex];
            const noteStartTick: number = noteStartPart * Config.ticksPerPart;
            const noteEndTick: number = noteEndPart * Config.ticksPerPart;
            const pinStart: number = (note.start + startPin.time) * Config.ticksPerPart;
            const pinEnd: number = (note.start + endPin.time) * Config.ticksPerPart;
            if (pinStart && pinEnd) {} // shut the fuck up you stupid compiler
            tone.ticksSinceReleased = 0;

            const tickTimeStart: number = currentPart * Config.ticksPerPart + this.tick;
            const tickTimeEnd: number = tickTimeStart + 1.0;
            const noteTicksPassedTickStart: number = tickTimeStart - noteStartTick;
            const noteTicksPassedTickEnd: number = tickTimeEnd - noteStartTick;

            const tickTimeStartReal: number = currentPart * Config.ticksPerPart + this.tick;
            const tickTimeEndReal: number = tickTimeStartReal + (roundedSamplesPerTick / samplesPerTick);

            // PREVIOUS POSITIONING OF DISCRETE SLIDES (now changed cause i wanted vibrato to be calculated in there too)
            let discreteSlideType = -1;
            if (discreteSlideType === -1) {
                // Default smooth slide logic.
                const pinRatioStart: number = Math.max(0.0, Math.min(1.0, (tickTimeStartReal - pinStart) / (pinEnd - pinStart)));
                const pinRatioEnd: number = Math.max(0.0, Math.min(1.0, (tickTimeEndReal - pinStart) / (pinEnd - pinStart)));
                intervalStart = startPin.interval + (endPin.interval - startPin.interval) * pinRatioStart;
                intervalEnd = startPin.interval + (endPin.interval - startPin.interval) * pinRatioEnd;
            }

            fadeExpressionStart = 1.0;
            fadeExpressionEnd = 1.0;
            tone.lastInterval = intervalEnd;

            if ((!transition.isSeamless && !tone.forceContinueAtEnd) || nextNote == null) {
                const fadeOutTicks: number = -instrument.getFadeOutTicks();
                if (fadeOutTicks > 0.0) {
                    // If the tone should fade out before the end of the note, do so here.
                    const noteLengthTicks: number = noteEndTick - noteStartTick;
                    fadeExpressionStart *= Math.min(1.0, (noteLengthTicks - noteTicksPassedTickStart) / fadeOutTicks);
                    fadeExpressionEnd *= Math.min(1.0, (noteLengthTicks - noteTicksPassedTickEnd) / fadeOutTicks);
                    if (tickTimeEnd >= noteStartTick + noteLengthTicks) toneIsOnLastTick = true;
                }
            }

        }
 
        if (!tone.atNoteStart && tone.freshlyAllocated && tone.note != null && instrument.type == InstrumentType.chip && (Config.chipWaves[instrument.chipWave].isCustomSampled || Config.chipWaves[instrument.chipWave].isSampled)) {
            const noteStartTick: number = tone.noteStartPart * Config.ticksPerPart;
            const currentTick: number = (this.beat * Config.partsPerBeat + this.part) * Config.ticksPerPart + this.tick;
            const ticksElapsed: number = currentTick - noteStartTick;
            if (ticksElapsed > 0) {
                const samplesElapsed: number = ticksElapsed * samplesPerTick;

                const voiceCount: number = instrument.unisonVoices;
                for (let i: number = 0; i < voiceCount; i++) {
                    const phaseOffset: number = samplesElapsed * tone.phaseDeltas[i];
                    tone.phases[i] += phaseOffset;
                }
            }
        }
        tone.isOnLastTick = toneIsOnLastTick;

        let tmpNoteFilter: FilterSettings = instrument.noteFilter;
        let startPoint: FilterControlPoint;
        let endPoint: FilterControlPoint;

        if (instrument.noteFilterType) {
            // Simple EQ filter (old style). For analysis, using random filters from normal style since they are N/A in this context.
            const noteFilterSettingsStart: FilterSettings = instrument.noteFilter;
            if (instrument.noteSubFilters[1] == null)
                instrument.noteSubFilters[1] = new FilterSettings();
            const noteFilterSettingsEnd: FilterSettings = instrument.noteSubFilters[1];

            // Change location based on slider values
            let startSimpleFreq: number = instrument.noteFilterSimpleCut;
            let startSimpleGain: number = instrument.noteFilterSimplePeak;
            let endSimpleFreq: number = instrument.noteFilterSimpleCut;
            let endSimpleGain: number = instrument.noteFilterSimplePeak;
            let filterChanges: boolean = false;

            if (this.isModActive(Config.modulators.dictionary["note filt cut"].index, channelIndex, tone.instrumentIndex)) {
                startSimpleFreq = this.getModValue(Config.modulators.dictionary["note filt cut"].index, channelIndex, tone.instrumentIndex, false);
                endSimpleFreq = this.getModValue(Config.modulators.dictionary["note filt cut"].index, channelIndex, tone.instrumentIndex, true);
                filterChanges = true;
            }
            if (this.isModActive(Config.modulators.dictionary["note filt peak"].index, channelIndex, tone.instrumentIndex)) {
                startSimpleGain = this.getModValue(Config.modulators.dictionary["note filt peak"].index, channelIndex, tone.instrumentIndex, false);
                endSimpleGain = this.getModValue(Config.modulators.dictionary["note filt peak"].index, channelIndex, tone.instrumentIndex, true);
                filterChanges = true;
            }

            noteFilterSettingsStart.convertLegacySettingsForSynth(startSimpleFreq, startSimpleGain, !filterChanges);
            noteFilterSettingsEnd.convertLegacySettingsForSynth(endSimpleFreq, endSimpleGain, !filterChanges);

            startPoint = noteFilterSettingsStart.controlPoints[0];
            endPoint = noteFilterSettingsEnd.controlPoints[0];

            // Temporarily override so that envelope computer uses appropriate computed note filter
            instrument.noteFilter = noteFilterSettingsStart;
            instrument.tmpNoteFilterStart = noteFilterSettingsStart;
        }

        // Compute envelopes *after* resetting the tone, otherwise the envelope computer gets reset too!
        const envelopeComputer: EnvelopeComputer = tone.envelopeComputer;
        const envelopeSpeeds: number[] = [];
        for (let i: number = 0; i < Config.maxEnvelopeCount; i++) {
            envelopeSpeeds[i] = 0;
        }
        for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
            let perEnvelopeSpeed: number = instrument.envelopes[envelopeIndex].perEnvelopeSpeed;
            if (this.isModActive(Config.modulators.dictionary["individual envelope speed"].index, channelIndex, tone.instrumentIndex) && instrument.envelopes[envelopeIndex].tempEnvelopeSpeed != null) {
                perEnvelopeSpeed = instrument.envelopes[envelopeIndex].tempEnvelopeSpeed!;
            }
            let useEnvelopeSpeed: number = Config.arpSpeedScale[instrument.envelopeSpeed] * perEnvelopeSpeed;
            if (this.isModActive(Config.modulators.dictionary["envelope speed"].index, channelIndex, tone.instrumentIndex)) {
                useEnvelopeSpeed = Math.max(0, Math.min(Config.arpSpeedScale.length - 1, this.getModValue(Config.modulators.dictionary["envelope speed"].index, channelIndex, tone.instrumentIndex, false)));
                if (Number.isInteger(useEnvelopeSpeed)) {
                    useEnvelopeSpeed = Config.arpSpeedScale[useEnvelopeSpeed] * perEnvelopeSpeed;
                } else {
                    // Linear interpolate envelope values
                    useEnvelopeSpeed = (1 - (useEnvelopeSpeed % 1)) * Config.arpSpeedScale[Math.floor(useEnvelopeSpeed)] + (useEnvelopeSpeed % 1) * Config.arpSpeedScale[Math.ceil(useEnvelopeSpeed)] * perEnvelopeSpeed;
                }
            }
            envelopeSpeeds[envelopeIndex] = useEnvelopeSpeed;
        }
        envelopeComputer.computeEnvelopes(instrument, currentPart, instrumentState.envelopeTime, Config.ticksPerPart * partTimeStart, samplesPerTick / this.samplesPerSecond, tone, envelopeSpeeds, instrumentState, this, channelIndex, tone.instrumentIndex);
        const envelopeStarts: number[] = tone.envelopeComputer.envelopeStarts;
        const envelopeEnds: number[] = tone.envelopeComputer.envelopeEnds;
        instrument.noteFilter = tmpNoteFilter;
        if (transition.continues && (tone.prevNote == null || tone.note == null)) {
            instrumentState.envelopeComputer.reset();
        }


        if (tone.note != null && transition.slides) {
            // Slide interval and chordExpression at the start and/or end of the note if necessary.
            const prevNote: Note | null = tone.prevNote;
            const nextNote: Note | null = tone.nextNote;
            if (prevNote != null) {
                const intervalDiff: number = prevNote.pitches[tone.prevNotePitchIndex] + prevNote.pins[prevNote.pins.length - 1].interval - tone.pitches[0];
                if (envelopeComputer.prevSlideStart) intervalStart += intervalDiff * envelopeComputer.prevSlideRatioStart;
                if (envelopeComputer.prevSlideEnd) intervalEnd += intervalDiff * envelopeComputer.prevSlideRatioEnd;
                if (!chord.singleTone) {
                    const chordSizeDiff: number = prevNote.pitches.length - tone.chordSize;
                    if (envelopeComputer.prevSlideStart) chordExpressionStart = Synth.computeChordExpression(tone.chordSize + chordSizeDiff * envelopeComputer.prevSlideRatioStart);
                    if (envelopeComputer.prevSlideEnd) chordExpressionEnd = Synth.computeChordExpression(tone.chordSize + chordSizeDiff * envelopeComputer.prevSlideRatioEnd);
                }
            }
            if (nextNote != null) {
                const intervalDiff: number = nextNote.pitches[tone.nextNotePitchIndex] - (tone.pitches[0] + tone.note.pins[tone.note.pins.length - 1].interval);
                if (envelopeComputer.nextSlideStart) intervalStart += intervalDiff * envelopeComputer.nextSlideRatioStart;
                if (envelopeComputer.nextSlideEnd) intervalEnd += intervalDiff * envelopeComputer.nextSlideRatioEnd;
                if (!chord.singleTone) {
                    const chordSizeDiff: number = nextNote.pitches.length - tone.chordSize;
                    if (envelopeComputer.nextSlideStart) chordExpressionStart = Synth.computeChordExpression(tone.chordSize + chordSizeDiff * envelopeComputer.nextSlideRatioStart);
                    if (envelopeComputer.nextSlideEnd) chordExpressionEnd = Synth.computeChordExpression(tone.chordSize + chordSizeDiff * envelopeComputer.nextSlideRatioEnd);
                }
            }
        }
        if (tone.note != null) {
                const note: Note = tone.note;

                const noteStartPart: number = tone.noteStartPart;


                const endPinIndex: number = note.getEndPinIndex(currentPart);
                const startPin: NotePin = note.pins[endPinIndex - 1];
                const endPin: NotePin = note.pins[endPinIndex];
                const noteStartTick: number = noteStartPart * Config.ticksPerPart;
                const pinStart: number = (note.start + startPin.time) * Config.ticksPerPart;
                const pinEnd: number = (note.start + endPin.time) * Config.ticksPerPart;

        if (effectsIncludeDiscreteSlide(instrument.effects) || effectsIncludeVibrato(instrument.effects)) {
                let vibratoStart: number = 0.0;
                let vibratoEnd: number = 0.0;
        
                if (effectsIncludeVibrato(instrument.effects)) {
                    let delayTicks: number;
                    let vibratoAmplitudeStart: number;
                    let vibratoAmplitudeEnd: number;
                    if (instrument.vibrato == Config.vibratos.length) {
                        delayTicks = instrument.vibratoDelay * 2; // Delay was changed from parts to ticks in BB v9
                        if (instrument.vibratoDelay == Config.modulators.dictionary["vibrato delay"].maxRawVol)
                            delayTicks = Number.POSITIVE_INFINITY;
                        vibratoAmplitudeStart = instrument.vibratoDepth;
                        vibratoAmplitudeEnd = vibratoAmplitudeStart;
                    } else {
                        delayTicks = Config.vibratos[instrument.vibrato].delayTicks;
                        vibratoAmplitudeStart = Config.vibratos[instrument.vibrato].amplitude;
                        vibratoAmplitudeEnd = vibratoAmplitudeStart;
                    }
                
                    if (this.isModActive(Config.modulators.dictionary["vibrato delay"].index, channelIndex, tone.instrumentIndex)) {
                        delayTicks = this.getModValue(Config.modulators.dictionary["vibrato delay"].index, channelIndex, tone.instrumentIndex, false) * 2; // Delay was changed from parts to ticks in BB v9
                        if (delayTicks == Config.modulators.dictionary["vibrato delay"].maxRawVol * 2)
                            delayTicks = Number.POSITIVE_INFINITY;
                    
                    }
                
                    if (this.isModActive(Config.modulators.dictionary["vibrato depth"].index, channelIndex, tone.instrumentIndex)) {
                        vibratoAmplitudeStart = this.getModValue(Config.modulators.dictionary["vibrato depth"].index, channelIndex, tone.instrumentIndex, false) / 25;
                        vibratoAmplitudeEnd = this.getModValue(Config.modulators.dictionary["vibrato depth"].index, channelIndex, tone.instrumentIndex, true) / 25;
                    }
                
                    if (tone.prevVibrato != null) {
                        vibratoStart = tone.prevVibrato;
                    } else {
                        let vibratoLfoStart: number = Synth.getLFOAmplitude(instrument, secondsPerPart * instrumentState.vibratoTime);
                        const vibratoDepthEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.vibratoDepth];
                        vibratoStart = vibratoAmplitudeStart * vibratoLfoStart * vibratoDepthEnvelopeStart;
                        if (delayTicks > 0.0) {
                            const ticksUntilVibratoStart: number = delayTicks - envelopeComputer.noteTicksStart;
                            vibratoStart *= Math.max(0.0, Math.min(1.0, 1.0 - ticksUntilVibratoStart / 2.0));
                        }
                    }
                
                    let vibratoLfoEnd: number = Synth.getLFOAmplitude(instrument, secondsPerPart * instrumentState.nextVibratoTime);
                    const vibratoDepthEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.vibratoDepth];
                    if (instrument.type != InstrumentType.mod) {
                        vibratoEnd = vibratoAmplitudeEnd * vibratoLfoEnd * vibratoDepthEnvelopeEnd;
                        if (delayTicks > 0.0) {
                            const ticksUntilVibratoEnd: number = delayTicks - envelopeComputer.noteTicksEnd;
                            vibratoEnd *= Math.max(0.0, Math.min(1.0, 1.0 - ticksUntilVibratoEnd / 2.0));
                        }
                        tone.prevVibrato = vibratoEnd;
                    }
                }
			if (!released) {
				tone.ticksSinceReleased = 0;
			}

                let discreteSlideType = -1;
                if (effectsIncludeDiscreteSlide(instrument.effects)) {
                    discreteSlideType = instrument.discreteSlide;
                }
                if (discreteSlideType) { };
            
            
                const tickTimeStartReal: number = currentPart * Config.ticksPerPart + this.tick;
                const tickTimeEndReal: number = tickTimeStartReal + (roundedSamplesPerTick / samplesPerTick);
            
                if (discreteSlideType === -1) {
                    const pinRatioStart: number = Math.max(0.0, Math.min(1.0, (tickTimeStartReal - pinStart) / (pinEnd - pinStart)));
                    const pinRatioEnd: number = Math.max(0.0, Math.min(1.0, (tickTimeEndReal - pinStart) / (pinEnd - pinStart)));
                    intervalStart = startPin.interval + (endPin.interval - startPin.interval) * pinRatioStart;
                    intervalEnd = startPin.interval + (endPin.interval - startPin.interval) * pinRatioEnd;
                } else {
                    const snapToPitch = (discreteSlideType === 0 || discreteSlideType === 3 || discreteSlideType === 4);
                    const snapTime = (discreteSlideType === 1 || discreteSlideType === 3) ? 1 : (discreteSlideType === 2 || discreteSlideType === 4) ? 2 : 0; // parts per step
                if (snapTime > 0) {
                        const ticksPerStep = snapTime * Config.ticksPerPart;

                        // Clamp stepping to the note's duration to avoid stepping during release.
                        const noteEndTickLocal =
                            tone.noteEndPart * Config.ticksPerPart;

                        const ticksIntoNoteStart =
                            tickTimeStartReal - noteStartTick;
                        const stepsInNote = Math.max(
                            1,
                            Math.ceil(
                                (noteEndTickLocal - noteStartTick) /
                                    ticksPerStep,
                            ),
                        );
                        const stepStartIndex = Math.max(
                            0,
                            Math.min(
                                stepsInNote - 1,
                                Math.floor(ticksIntoNoteStart / ticksPerStep),
                            ),
                        );
                        const stepStartTick =
                            noteStartTick + stepStartIndex * ticksPerStep;
                        const stepEndTick = Math.min(
                            noteEndTickLocal,
                            stepStartTick + ticksPerStep,
                        );

                        // Helper: interval on the slide curve at an absolute tick.
                        const intervalAtTick = (absTick: number): number => {
                            let idx = note.getEndPinIndex(
                                absTick / Config.ticksPerPart,
                            );
                            if (idx <= 0) idx = 1;
                            if (idx >= note.pins.length) idx = note.pins.length - 1;
                            const p0 = note.pins[idx - 1];
                            const p1 = note.pins[idx];
                            const t0 =
                                (note.start + p0.time) * Config.ticksPerPart;
                            const t1 =
                                (note.start + p1.time) * Config.ticksPerPart;
                            const denom = Math.max(1e-9, t1 - t0);
                            const r = Math.max(
                                0.0,
                                Math.min(1.0, (absTick - t0) / denom),
                            );
                            return p0.interval + (p1.interval - p0.interval) * r;
                        };

                        // Base intervals for start of current step, and for next step if the tick crosses it.
                        const baseStart = intervalAtTick(stepStartTick);
                        const crossesStep = tickTimeEndReal > stepEndTick;
                        const baseEnd = crossesStep
                            ? intervalAtTick(Math.min(stepEndTick, noteEndTickLocal))
                            : baseStart;

                        // Vibrato is applied before snapping so that vibrato gets quantized with the step.
                        let startWithVib = baseStart + vibratoStart;
                        let endWithVib = baseEnd + vibratoEnd;
                        if (snapToPitch) {
                            startWithVib = Math.round(startWithVib);
                            endWithVib = Math.round(endWithVib);
                        }

                        intervalStart = startWithVib;
                        intervalEnd = endWithVib;
                    } else {
                        const pinRatioStart: number = Math.max(0.0, Math.min(1.0, (tickTimeStartReal - pinStart) / (pinEnd - pinStart)));
                        const pinRatioEnd: number = Math.max(0.0, Math.min(1.0, (tickTimeEndReal - pinStart) / (pinEnd - pinStart)));
                        intervalStart = startPin.interval + (endPin.interval - startPin.interval) * pinRatioStart;
                        intervalEnd = startPin.interval + (endPin.interval - startPin.interval) * pinRatioEnd;
                    
                        intervalStart += vibratoStart; // Add vibrato before snapping.
                        intervalEnd += vibratoEnd;
                    
                        if (snapToPitch) {
                            intervalStart = Math.round(intervalStart);
                            intervalEnd = Math.round(intervalEnd);
                        }
                    }
                }
                if (discreteSlideType === -1) {
                    intervalStart += vibratoStart;
                    intervalEnd += vibratoEnd;
                }
        }
    }
        if (effectsIncludePitchShift(instrument.effects)) {
            let pitchShift: number = Config.justIntonationSemitones[instrument.pitchShift] / intervalScale;
            let pitchShiftScalarStart: number = 1.0;
            let pitchShiftScalarEnd: number = 1.0;
            if (this.isModActive(Config.modulators.dictionary["pitch shift"].index, channelIndex, tone.instrumentIndex)) {
                pitchShift = Config.justIntonationSemitones[Config.justIntonationSemitones.length - 1];
                pitchShiftScalarStart = (this.getModValue(Config.modulators.dictionary["pitch shift"].index, channelIndex, tone.instrumentIndex, false)) / (Config.pitchShiftCenter);
                pitchShiftScalarEnd = (this.getModValue(Config.modulators.dictionary["pitch shift"].index, channelIndex, tone.instrumentIndex, true)) / (Config.pitchShiftCenter);
            }
            const envelopeStart: number = envelopeStarts[EnvelopeComputeIndex.pitchShift];
            const envelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.pitchShift];
            intervalStart += pitchShift * envelopeStart * pitchShiftScalarStart;
            intervalEnd += pitchShift * envelopeEnd * pitchShiftScalarEnd;
        }
        if (effectsIncludeDetune(instrument.effects) || this.isModActive(Config.modulators.dictionary["song detune"].index, channelIndex, tone.instrumentIndex)) {
            const envelopeStart: number = envelopeStarts[EnvelopeComputeIndex.detune];
            const envelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.detune];
            let modDetuneStart: number = instrument.detune;
            let modDetuneEnd: number = instrument.detune;
            if (this.isModActive(Config.modulators.dictionary["detune"].index, channelIndex, tone.instrumentIndex)) {
                modDetuneStart = this.getModValue(Config.modulators.dictionary["detune"].index, channelIndex, tone.instrumentIndex, false) + Config.detuneCenter;
                modDetuneEnd = this.getModValue(Config.modulators.dictionary["detune"].index, channelIndex, tone.instrumentIndex, true) + Config.detuneCenter;
            }
            if (this.isModActive(Config.modulators.dictionary["song detune"].index, channelIndex, tone.instrumentIndex)) {
                modDetuneStart += 4 * this.getModValue(Config.modulators.dictionary["song detune"].index, channelIndex, tone.instrumentIndex, false);
                modDetuneEnd += 4 * this.getModValue(Config.modulators.dictionary["song detune"].index, channelIndex, tone.instrumentIndex, true);
            }
            intervalStart += Synth.detuneToCents(modDetuneStart) * envelopeStart * Config.pitchesPerOctave / (12.0 * 100.0);
            intervalEnd += Synth.detuneToCents(modDetuneEnd) * envelopeEnd * Config.pitchesPerOctave / (12.0 * 100.0);
        }

        if ((!transition.isSeamless && !tone.forceContinueAtStart) || tone.prevNote == null) {
            // Fade in the beginning of the note.
            const fadeInSeconds: number = instrument.getFadeInSeconds();
            if (fadeInSeconds > 0.0) {
                fadeExpressionStart *= Math.min(1.0, envelopeComputer.noteSecondsStartUnscaled / fadeInSeconds);
                fadeExpressionEnd *= Math.min(1.0, envelopeComputer.noteSecondsEndUnscaled / fadeInSeconds);
            }
        }


        if (instrument.type == InstrumentType.drumset && tone.drumsetPitch == null) {
            // It's possible that the note will change while the user is editing it,
            // but the tone's pitches don't get updated because the tone has already
            // ended and is fading out. To avoid an array index out of bounds error, clamp the pitch.
            tone.drumsetPitch = tone.pitches[0];
            if (tone.note != null) tone.drumsetPitch += tone.note.pickMainInterval();
            tone.drumsetPitch = Math.max(0, Math.min(Config.drumCount - 1, tone.drumsetPitch));
        }

        let noteFilterExpression: number = envelopeComputer.lowpassCutoffDecayVolumeCompensation;
        if (!effectsIncludeNoteFilter(instrument.effects)) {
            tone.noteFilterCount = 0;
        } else {

            const noteAllFreqsEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.noteFilterAllFreqs];
            const noteAllFreqsEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.noteFilterAllFreqs];

            // Simple note filter
            if (instrument.noteFilterType) {
                const noteFreqEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.noteFilterFreq0];
                const noteFreqEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.noteFilterFreq0];
                const notePeakEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.noteFilterGain0];
                const notePeakEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.noteFilterGain0];

                startPoint!.toCoefficients(Synth.tempFilterStartCoefficients, this.samplesPerSecond, noteAllFreqsEnvelopeStart * noteFreqEnvelopeStart, notePeakEnvelopeStart);
                endPoint!.toCoefficients(Synth.tempFilterEndCoefficients, this.samplesPerSecond, noteAllFreqsEnvelopeEnd * noteFreqEnvelopeEnd, notePeakEnvelopeEnd);

                if (tone.noteFilters.length < 1) tone.noteFilters[0] = new DynamicBiquadFilter();
                tone.noteFilters[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint!.type == FilterType.lowPass);
                noteFilterExpression *= startPoint!.getVolumeCompensationMult();

                tone.noteFilterCount = 1;
            } else {
                const noteFilterSettings: FilterSettings = (instrument.tmpNoteFilterStart != null) ? instrument.tmpNoteFilterStart : instrument.noteFilter;

                for (let i: number = 0; i < noteFilterSettings.controlPointCount; i++) {
                    const noteFreqEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.noteFilterFreq0 + i];
                    const noteFreqEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.noteFilterFreq0 + i];
                    const notePeakEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.noteFilterGain0 + i];
                    const notePeakEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.noteFilterGain0 + i];
                    let startPoint: FilterControlPoint = noteFilterSettings.controlPoints[i];
                    const endPoint: FilterControlPoint = (instrument.tmpNoteFilterEnd != null && instrument.tmpNoteFilterEnd.controlPoints[i] != null) ? instrument.tmpNoteFilterEnd.controlPoints[i] : noteFilterSettings.controlPoints[i];

                    // If switching dot type, do it all at once and do not try to interpolate since no valid interpolation exists.
                    if (startPoint.type != endPoint.type) {
                        startPoint = endPoint;
                    }

                    startPoint.toCoefficients(Synth.tempFilterStartCoefficients, this.samplesPerSecond, noteAllFreqsEnvelopeStart * noteFreqEnvelopeStart, notePeakEnvelopeStart);
                    endPoint.toCoefficients(Synth.tempFilterEndCoefficients, this.samplesPerSecond, noteAllFreqsEnvelopeEnd * noteFreqEnvelopeEnd, notePeakEnvelopeEnd);
                    if (tone.noteFilters.length <= i) tone.noteFilters[i] = new DynamicBiquadFilter();
                    tone.noteFilters[i].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                    noteFilterExpression *= startPoint.getVolumeCompensationMult();
                }
                tone.noteFilterCount = noteFilterSettings.controlPointCount;
            }
        }

        if (instrument.type == InstrumentType.drumset) {
            const drumsetEnvelopeComputer: EnvelopeComputer = tone.envelopeComputer;

            const drumsetFilterEnvelope: Envelope = instrument.getDrumsetEnvelope(tone.drumsetPitch!);

            // If the drumset lowpass cutoff decays, compensate by increasing expression.
            noteFilterExpression *= EnvelopeComputer.getLowpassCutoffDecayVolumeCompensation(drumsetFilterEnvelope);

            drumsetEnvelopeComputer.computeDrumsetEnvelopes(instrument, drumsetFilterEnvelope, beatsPerPart, partTimeStart, partTimeEnd);

            const drumsetFilterEnvelopeStart = drumsetEnvelopeComputer.drumsetFilterEnvelopeStart;
            const drumsetFilterEnvelopeEnd = drumsetEnvelopeComputer.drumsetFilterEnvelopeEnd;

            const point: FilterControlPoint = this.tempDrumSetControlPoint;
            point.type = FilterType.lowPass;
            point.gain = FilterControlPoint.getRoundedSettingValueFromLinearGain(0.50);
            point.freq = FilterControlPoint.getRoundedSettingValueFromHz(8000.0);
            // Drumset envelopes are warped to better imitate the legacy simplified 2nd order lowpass at ~48000Hz that I used to use.
            point.toCoefficients(Synth.tempFilterStartCoefficients, this.samplesPerSecond, drumsetFilterEnvelopeStart * (1.0 + drumsetFilterEnvelopeStart), 1.0);
            point.toCoefficients(Synth.tempFilterEndCoefficients, this.samplesPerSecond, drumsetFilterEnvelopeEnd * (1.0 + drumsetFilterEnvelopeEnd), 1.0);
            if (tone.noteFilters.length == tone.noteFilterCount) tone.noteFilters[tone.noteFilterCount] = new DynamicBiquadFilter();
            tone.noteFilters[tone.noteFilterCount].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, true);
            tone.noteFilterCount++;
        }

        noteFilterExpression = Math.min(3.0, noteFilterExpression);
        if (instrument.type == InstrumentType.chip && Config.chipWaves[instrument.chipWave].isCustomSampled) {
                if ((tone.atNoteStart && !transition.isSeamless && !tone.forceContinueAtStart) || tone.freshlyAllocated) {
                    let noteStartOffsetSamples = instrument.chipWaveStartOffset + (tone.note ? tone.note.chipWaveStartOffset : 0);
    
                    if (!tone.atNoteStart && tone.note != null) {
                        const note = tone.note;
                        let elapsedParts = 0;
                        const partsPerBar = song.beatsPerBar * Config.partsPerBeat;
    
                        if (note.start > 0 || !note.continuesLastPattern) {
                            elapsedParts = currentPart - note.start;
                        } else {
                            let startBar = this.bar;
                            let startPart = 0;
                            let bar = this.bar;
                            let noteToFind = note;
    
                            while (noteToFind.start === 0 && noteToFind.continuesLastPattern && bar > 0) {
                                const prevPattern = song.getPattern(channelIndex, bar - 1);
                                if (prevPattern == null) break;
    
                                let matchingPrevNote: Note | null = null;
                                for (const prevNote of prevPattern.notes) {
                                    if (prevNote.end === partsPerBar && Synth.adjacentNotesHaveMatchingPitches(prevNote, noteToFind)) {
                                        matchingPrevNote = prevNote;
                                        break;
                                    }
                                }
    
                                if (matchingPrevNote != null) {
                                    bar--;
                                    noteToFind = matchingPrevNote;
                                } else {
                                    break;
                                }
                            }
                            startBar = bar;
                            startPart = noteToFind.start;
    
                            const elapsedBars = this.bar - startBar;
                            elapsedParts = (elapsedBars * partsPerBar) + currentPart - startPart;
                        }
    
                        const elapsedTicks = elapsedParts * Config.ticksPerPart + this.tick;
                        noteStartOffsetSamples += elapsedTicks * samplesPerTick;
                    }
                    if (tone.note != null) {tone.note.chipWaveStartOffset = noteStartOffsetSamples;}
                }
            }
        if (instrument.type == InstrumentType.fm || instrument.type == InstrumentType.fm6op) {
            // phase modulation!

            let sineExpressionBoost: number = 1.0;
            let totalCarrierExpression: number = 0.0;

            let arpeggioInterval: number = 0;
            const arpeggiates: boolean = chord.arpeggiates;
            const isMono: boolean = chord.name == "monophonic";
            if (tone.pitchCount > 1 && arpeggiates) {
                const arpeggio: number = Math.floor(instrumentState.arpTime / Config.ticksPerArpeggio);
                arpeggioInterval = tone.pitches[getArpeggioPitchIndex(tone.pitchCount, instrument.fastTwoNoteArp, arpeggio)] - tone.pitches[0];
            }


            const carrierCount: number = (instrument.type == InstrumentType.fm6op ? instrument.customAlgorithm.carrierCount : Config.algorithms[instrument.algorithm].carrierCount);
            for (let i: number = 0; i < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); i++) {

                const associatedCarrierIndex: number = (instrument.type == InstrumentType.fm6op ? instrument.customAlgorithm.associatedCarrier[i] - 1 : Config.algorithms[instrument.algorithm].associatedCarrier[i] - 1);
                const pitch: number = tone.pitches[arpeggiates ? 0 : isMono ? instrument.monoChordTone : ((i < tone.pitchCount) ? i : ((associatedCarrierIndex < tone.pitchCount) ? associatedCarrierIndex : 0))];
                const freqMult = Config.operatorFrequencies[instrument.operators[i].frequency].mult;
                const interval = Config.operatorCarrierInterval[associatedCarrierIndex] + arpeggioInterval;
                const pitchStart: number = basePitch + (pitch + intervalStart) * intervalScale + interval;
                const pitchEnd: number = basePitch + (pitch + intervalEnd) * intervalScale + interval;
                const baseFreqStart: number = Instrument.frequencyFromPitch(pitchStart);
                const baseFreqEnd: number = Instrument.frequencyFromPitch(pitchEnd);
                const hzOffset: number = Config.operatorFrequencies[instrument.operators[i].frequency].hzOffset;
                const targetFreqStart: number = freqMult * baseFreqStart + hzOffset;
                const targetFreqEnd: number = freqMult * baseFreqEnd + hzOffset;


                const freqEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.operatorFrequency0 + i];
                const freqEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.operatorFrequency0 + i];
                let freqStart: number;
                let freqEnd: number;
                if (freqEnvelopeStart != 1.0 || freqEnvelopeEnd != 1.0) {
                    freqStart = Math.pow(2.0, Math.log2(targetFreqStart / baseFreqStart) * freqEnvelopeStart) * baseFreqStart;
                    freqEnd = Math.pow(2.0, Math.log2(targetFreqEnd / baseFreqEnd) * freqEnvelopeEnd) * baseFreqEnd;
                } else {
                    freqStart = targetFreqStart;
                    freqEnd = targetFreqEnd;
                }
                tone.phaseDeltas[i] = freqStart * sampleTime;
                tone.phaseDeltaScales[i] = Math.pow(freqEnd / freqStart, 1.0 / roundedSamplesPerTick);

                let amplitudeStart: number = instrument.operators[i].amplitude;
                let amplitudeEnd: number = instrument.operators[i].amplitude;
                if (i < 4) {
                    if (this.isModActive(Config.modulators.dictionary["fm slider 1"].index + i, channelIndex, tone.instrumentIndex)) {
                        amplitudeStart *= this.getModValue(Config.modulators.dictionary["fm slider 1"].index + i, channelIndex, tone.instrumentIndex, false) / 15.0;
                        amplitudeEnd *= this.getModValue(Config.modulators.dictionary["fm slider 1"].index + i, channelIndex, tone.instrumentIndex, true) / 15.0;
                    }
                } else {
                    if (this.isModActive(Config.modulators.dictionary["fm slider 5"].index + i - 4, channelIndex, tone.instrumentIndex)) {
                        amplitudeStart *= this.getModValue(Config.modulators.dictionary["fm slider 5"].index + i - 4, channelIndex, tone.instrumentIndex, false) / 15.0;
                        amplitudeEnd *= this.getModValue(Config.modulators.dictionary["fm slider 5"].index + i - 4, channelIndex, tone.instrumentIndex, true) / 15.0;
                    }
                }

                const amplitudeCurveStart: number = Synth.operatorAmplitudeCurve(amplitudeStart);
                const amplitudeCurveEnd: number = Synth.operatorAmplitudeCurve(amplitudeEnd);
                const amplitudeMultStart: number = amplitudeCurveStart * Config.operatorFrequencies[instrument.operators[i].frequency].amplitudeSign;
                const amplitudeMultEnd: number = amplitudeCurveEnd * Config.operatorFrequencies[instrument.operators[i].frequency].amplitudeSign;

                let expressionStart: number = amplitudeMultStart;
                let expressionEnd: number = amplitudeMultEnd;


                if (i < carrierCount) {
                    // carrier
                    let pitchExpressionStart: number;
                    if (tone.prevPitchExpressions[i] != null) {
                        pitchExpressionStart = tone.prevPitchExpressions[i]!;
                    } else {
                        pitchExpressionStart = Math.pow(2.0, -(pitchStart - expressionReferencePitch) / pitchDamping);
                    }
                    const pitchExpressionEnd: number = Math.pow(2.0, -(pitchEnd - expressionReferencePitch) / pitchDamping);
                    tone.prevPitchExpressions[i] = pitchExpressionEnd;
                    expressionStart *= pitchExpressionStart;
                    expressionEnd *= pitchExpressionEnd;

                    totalCarrierExpression += amplitudeCurveEnd;
                } else {
                    // modulator
                    expressionStart *= Config.sineWaveLength * 1.5;
                    expressionEnd *= Config.sineWaveLength * 1.5;

                    sineExpressionBoost *= 1.0 - Math.min(1.0, instrument.operators[i].amplitude / 15);
                }

                expressionStart *= envelopeStarts[EnvelopeComputeIndex.operatorAmplitude0 + i];
                expressionEnd *= envelopeEnds[EnvelopeComputeIndex.operatorAmplitude0 + i];

                // Check for mod-related volume delta
                // @jummbus - This amplification is also applied to modulator FM operators which distorts the sound.
                // The fix is to apply this only to carriers, but as this is a legacy bug and it can cause some interesting sounds, it's left in.
                // You can use the mix volume modulator instead to avoid this effect.

                if (this.isModActive(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex)) {
                    // Linear falloff below 0, normal volume formula above 0. Seems to work best for scaling since the normal volume mult formula has a big gap from -25 to -24.
                    const startVal: number = this.getModValue(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex, false);
                    const endVal: number = this.getModValue(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex, true);
                    expressionStart *= ((startVal <= 0) ? ((startVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(startVal));
                    expressionEnd *= ((endVal <= 0) ? ((endVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(endVal));
                }

                tone.operatorExpressions[i] = expressionStart;
                tone.operatorExpressionDeltas[i] = (expressionEnd - expressionStart) / roundedSamplesPerTick;

            }

            sineExpressionBoost *= (Math.pow(2.0, (2.0 - 1.4 * instrument.feedbackAmplitude / 15.0)) - 1.0) / 3.0;
            sineExpressionBoost *= 1.0 - Math.min(1.0, Math.max(0.0, totalCarrierExpression - 1) / 2.0);
            sineExpressionBoost = 1.0 + sineExpressionBoost * 3.0;
            let expressionStart: number = baseExpression * sineExpressionBoost * noteFilterExpression * fadeExpressionStart * chordExpressionStart * envelopeStarts[EnvelopeComputeIndex.noteVolume];
            let expressionEnd: number = baseExpression * sineExpressionBoost * noteFilterExpression * fadeExpressionEnd * chordExpressionEnd * envelopeEnds[EnvelopeComputeIndex.noteVolume];
            if (isMono && tone.pitchCount <= instrument.monoChordTone) { //silence if tone doesn't exist
                expressionStart = 0;
                expressionEnd = 0;
            }
            tone.expression = expressionStart;
            tone.expressionDelta = (expressionEnd - expressionStart) / roundedSamplesPerTick;



            let useFeedbackAmplitudeStart: number = instrument.feedbackAmplitude;
            let useFeedbackAmplitudeEnd: number = instrument.feedbackAmplitude;
            if (this.isModActive(Config.modulators.dictionary["fm feedback"].index, channelIndex, tone.instrumentIndex)) {
                useFeedbackAmplitudeStart *= this.getModValue(Config.modulators.dictionary["fm feedback"].index, channelIndex, tone.instrumentIndex, false) / 15.0;
                useFeedbackAmplitudeEnd *= this.getModValue(Config.modulators.dictionary["fm feedback"].index, channelIndex, tone.instrumentIndex, true) / 15.0;
            }

            let feedbackAmplitudeStart: number = Config.sineWaveLength * 0.3 * useFeedbackAmplitudeStart / 15.0;
            const feedbackAmplitudeEnd: number = Config.sineWaveLength * 0.3 * useFeedbackAmplitudeEnd / 15.0;

            let feedbackStart: number = feedbackAmplitudeStart * envelopeStarts[EnvelopeComputeIndex.feedbackAmplitude];
            let feedbackEnd: number = feedbackAmplitudeEnd * envelopeEnds[EnvelopeComputeIndex.feedbackAmplitude];
            tone.feedbackMult = feedbackStart;
            tone.feedbackDelta = (feedbackEnd - feedbackStart) / roundedSamplesPerTick;


        } else {
            const freqEndRatio: number = Math.pow(2.0, (intervalEnd - intervalStart) * intervalScale / 12.0);
            const basePhaseDeltaScale: number = Math.pow(freqEndRatio, 1.0 / roundedSamplesPerTick);
            const isMono: boolean = chord.name == "monophonic";


            let pitch: number = tone.pitches[0];
            if (tone.pitchCount > 1 && (chord.arpeggiates || chord.customInterval || isMono)) {
                const arpeggio: number = Math.floor(instrumentState.arpTime / Config.ticksPerArpeggio);
                if (chord.customInterval) {
                    const intervalOffset: number = tone.pitches[1 + getArpeggioPitchIndex(tone.pitchCount - 1, instrument.fastTwoNoteArp, arpeggio)] - tone.pitches[0];
                    specialIntervalMult = Math.pow(2.0, intervalOffset / 12.0);
                    tone.specialIntervalExpressionMult = Math.pow(2.0, -intervalOffset / pitchDamping);
                } else if (chord.arpeggiates) {
                    pitch = tone.pitches[getArpeggioPitchIndex(tone.pitchCount, instrument.fastTwoNoteArp, arpeggio)];
                } else {
                    pitch = tone.pitches[instrument.monoChordTone];
                }
            }

            const startPitch: number = basePitch + (pitch + intervalStart) * intervalScale;
            const endPitch: number = basePitch + (pitch + intervalEnd) * intervalScale;
            let pitchExpressionStart: number;
            // TODO: use the second element of prevPitchExpressions for the unison voice, compute a separate expression delta for it.
            if (tone.prevPitchExpressions[0] != null) {
                pitchExpressionStart = tone.prevPitchExpressions[0]!;
            } else {
                pitchExpressionStart = Math.pow(2.0, -(startPitch - expressionReferencePitch) / pitchDamping);
            }
            const pitchExpressionEnd: number = Math.pow(2.0, -(endPitch - expressionReferencePitch) / pitchDamping);
            tone.prevPitchExpressions[0] = pitchExpressionEnd;
            let settingsExpressionMult: number = baseExpression * noteFilterExpression;

            if (instrument.type == InstrumentType.noise) {
                settingsExpressionMult *= Config.chipNoises[instrument.chipNoise].expression;
            }
            if (instrument.type == InstrumentType.chip) {
                settingsExpressionMult *= Config.chipWaves[instrument.chipWave].expression;
            }
            if (instrument.type == InstrumentType.pwm) {
                const basePulseWidth: number = getPulseWidthRatio(instrument.pulseWidth);

                // Check for PWM mods to this instrument
                let pulseWidthModStart: number = basePulseWidth;
                let pulseWidthModEnd: number = basePulseWidth;
                if (this.isModActive(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex)) {
                    pulseWidthModStart = (this.getModValue(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex, false)) / (Config.pulseWidthRange * 2);
                    pulseWidthModEnd = (this.getModValue(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex, true)) / (Config.pulseWidthRange * 2);
                }

                const pulseWidthStart: number = pulseWidthModStart * envelopeStarts[EnvelopeComputeIndex.pulseWidth];
                const pulseWidthEnd: number = pulseWidthModEnd * envelopeEnds[EnvelopeComputeIndex.pulseWidth];
                tone.pulseWidth = pulseWidthStart;
                tone.pulseWidthDelta = (pulseWidthEnd - pulseWidthStart) / roundedSamplesPerTick;

                //decimal offset mods
                let decimalOffsetModStart: number = instrument.decimalOffset;
                if (this.isModActive(Config.modulators.dictionary["decimal offset"].index, channelIndex, tone.instrumentIndex)) {
                    decimalOffsetModStart = this.getModValue(Config.modulators.dictionary["decimal offset"].index, channelIndex, tone.instrumentIndex, false);
                }

                const decimalOffsetStart: number = decimalOffsetModStart * envelopeStarts[EnvelopeComputeIndex.decimalOffset];
                tone.decimalOffset = decimalOffsetStart;

                tone.pulseWidth -= (tone.decimalOffset) / 10000;
            }
            if (instrument.type == InstrumentType.pickedString) {
                // Check for sustain mods
                let useSustainStart: number = instrument.stringSustain;
                let useSustainEnd: number = instrument.stringSustain;
                if (this.isModActive(Config.modulators.dictionary["sustain"].index, channelIndex, tone.instrumentIndex)) {
                    useSustainStart = this.getModValue(Config.modulators.dictionary["sustain"].index, channelIndex, tone.instrumentIndex, false);
                    useSustainEnd = this.getModValue(Config.modulators.dictionary["sustain"].index, channelIndex, tone.instrumentIndex, true);
                }

                tone.stringSustainStart = useSustainStart;
                tone.stringSustainEnd = useSustainEnd;

                // Increase expression to compensate for string decay.
                settingsExpressionMult *= Math.pow(2.0, 0.7 * (1.0 - useSustainStart / (Config.stringSustainRange - 1)));

            }

            const startFreq: number = Instrument.frequencyFromPitch(startPitch);
            if (instrument.type == InstrumentType.chip || instrument.type == InstrumentType.customChipWave || instrument.type == InstrumentType.harmonics || instrument.type == InstrumentType.pickedString || instrument.type == InstrumentType.spectrum || instrument.type == InstrumentType.pwm || instrument.type == InstrumentType.noise || instrument.type == InstrumentType.drumset) {
                const unisonVoices: number = instrument.unisonVoices;
                const unisonSpread: number = instrument.unisonSpread;
                const unisonOffset: number = instrument.unisonOffset;
                const unisonExpression: number = instrument.unisonExpression;
                const voiceCountExpression: number = (instrument.type == InstrumentType.pickedString) ? 1 : unisonVoices / 2.0;
                settingsExpressionMult *= unisonExpression * voiceCountExpression;
                const unisonEnvelopeStart = envelopeStarts[EnvelopeComputeIndex.unison];
                const unisonEnvelopeEnd = envelopeEnds[EnvelopeComputeIndex.unison];
                const unisonStartA: number = Math.pow(2.0, (unisonOffset + unisonSpread) * unisonEnvelopeStart / 12.0);
                const unisonEndA: number = Math.pow(2.0, (unisonOffset + unisonSpread) * unisonEnvelopeEnd / 12.0);
                tone.phaseDeltas[0] = startFreq * sampleTime * unisonStartA;
                tone.phaseDeltaScales[0] = basePhaseDeltaScale * Math.pow(unisonEndA / unisonStartA, 1.0 / roundedSamplesPerTick);
                const divisor = (unisonVoices == 1) ? 1 : (unisonVoices - 1);
                for (let i: number = 1; i <= unisonVoices; i++) {
                    const unisonStart: number = Math.pow(2.0, (unisonOffset + unisonSpread - (2 * i * unisonSpread / divisor)) * unisonEnvelopeStart / 12.0) * (specialIntervalMult);
                    const unisonEnd: number = Math.pow(2.0, (unisonOffset + unisonSpread - (2 * i * unisonSpread / divisor)) * unisonEnvelopeEnd / 12.0) * (specialIntervalMult);
                    tone.phaseDeltas[i] = startFreq * sampleTime * unisonStart;
                    tone.phaseDeltaScales[i] = basePhaseDeltaScale * Math.pow(unisonEnd / unisonStart, 1.0 / roundedSamplesPerTick);
                }
                for (let i: number = unisonVoices + 1; i < Config.unisonVoicesMax; i++) {
                    if (i == 2) {
                        const unisonBStart: number = Math.pow(2.0, (unisonOffset - unisonSpread) * unisonEnvelopeStart / 12.0) * specialIntervalMult;
                        const unisonBEnd: number = Math.pow(2.0, (unisonOffset - unisonSpread) * unisonEnvelopeEnd / 12.0) * specialIntervalMult;
                        tone.phaseDeltas[i] = startFreq * sampleTime * unisonBStart;
                        tone.phaseDeltaScales[i] = basePhaseDeltaScale * Math.pow(unisonBEnd / unisonBStart, 1.0 / roundedSamplesPerTick);
                    } else {
                        tone.phaseDeltas[i] = tone.phaseDeltas[0];
                        tone.phaseDeltaScales[i] = tone.phaseDeltaScales[0];
                    }
                }

            } else {
                tone.phaseDeltas[0] = startFreq * sampleTime;
                tone.phaseDeltaScales[0] = basePhaseDeltaScale;
            }

            // TODO: make expressionStart and expressionEnd variables earlier and modify those
            // instead of these supersawExpression variables.
            let supersawExpressionStart: number = 1.0;
            let supersawExpressionEnd: number = 1.0;
            if (instrument.type == InstrumentType.supersaw) {
                const minFirstVoiceAmplitude: number = 1.0 / Math.sqrt(Config.supersawVoiceCount);

                // Dynamism mods
                let useDynamismStart: number = instrument.supersawDynamism / Config.supersawDynamismMax;
                let useDynamismEnd: number = instrument.supersawDynamism / Config.supersawDynamismMax;
                if (this.isModActive(Config.modulators.dictionary["dynamism"].index, channelIndex, tone.instrumentIndex)) {
                    useDynamismStart = (this.getModValue(Config.modulators.dictionary["dynamism"].index, channelIndex, tone.instrumentIndex, false)) / Config.supersawDynamismMax;
                    useDynamismEnd = (this.getModValue(Config.modulators.dictionary["dynamism"].index, channelIndex, tone.instrumentIndex, true)) / Config.supersawDynamismMax;
                }

                const curvedDynamismStart: number = 1.0 - Math.pow(Math.max(0.0, 1.0 - useDynamismStart * envelopeStarts[EnvelopeComputeIndex.supersawDynamism]), 0.2);
                const curvedDynamismEnd: number = 1.0 - Math.pow(Math.max(0.0, 1.0 - useDynamismEnd * envelopeEnds[EnvelopeComputeIndex.supersawDynamism]), 0.2);
                const firstVoiceAmplitudeStart: number = Math.pow(2.0, Math.log2(minFirstVoiceAmplitude) * curvedDynamismStart);
                const firstVoiceAmplitudeEnd: number = Math.pow(2.0, Math.log2(minFirstVoiceAmplitude) * curvedDynamismEnd);

                const dynamismStart: number = Math.sqrt((1.0 / Math.pow(firstVoiceAmplitudeStart, 2.0) - 1.0) / (Config.supersawVoiceCount - 1.0));
                const dynamismEnd: number = Math.sqrt((1.0 / Math.pow(firstVoiceAmplitudeEnd, 2.0) - 1.0) / (Config.supersawVoiceCount - 1.0));
                tone.supersawDynamism = dynamismStart;
                tone.supersawDynamismDelta = (dynamismEnd - dynamismStart) / roundedSamplesPerTick;

                const initializeSupersaw: boolean = (tone.supersawDelayIndex == -1);
                if (initializeSupersaw) {
                    // Goal: generate sawtooth phases such that the combined initial amplitude
                    // cancel out to minimize pop. Algorithm: generate sorted phases, iterate over
                    // their sawtooth drop points to find a combined zero crossing, then offset the
                    // phases so they start there.

                    // Generate random phases in ascending order by adding positive randomly
                    // sized gaps between adjacent phases. For a proper distribution of random
                    // events, the gaps sizes should be an "exponential distribution", which is
                    // just: -Math.log(Math.random()). At the end, normalize the phases to a 0-1
                    // range by dividing by the final value of the accumulator.
                    let accumulator: number = 0.0;
                    for (let i: number = 0; i < Config.supersawVoiceCount; i++) {
                        tone.phases[i] = accumulator;
                        accumulator += -Math.log(Math.random());
                    }

                    const amplitudeSum: number = 1.0 + (Config.supersawVoiceCount - 1.0) * dynamismStart;
                    const slope: number = amplitudeSum;

                    // Find the initial amplitude of the sum of sawtooths with the normalized
                    // set of phases.
                    let sample: number = 0.0;
                    for (let i: number = 0; i < Config.supersawVoiceCount; i++) {
                        const amplitude: number = (i == 0) ? 1.0 : dynamismStart;
                        const normalizedPhase: number = tone.phases[i] / accumulator;
                        tone.phases[i] = normalizedPhase;
                        sample += (normalizedPhase - 0.5) * amplitude;
                    }
                    let zeroCrossingPhase: number = 1.0;
                    let prevDrop: number = 0.0;
                    for (let i: number = Config.supersawVoiceCount - 1; i >= 0; i--) {
                        const nextDrop: number = 1.0 - tone.phases[i];
                        const phaseDelta: number = nextDrop - prevDrop;
                        if (sample < 0.0) {
                            const distanceToZeroCrossing: number = -sample / slope;
                            if (distanceToZeroCrossing < phaseDelta) {
                                zeroCrossingPhase = prevDrop + distanceToZeroCrossing;
                                break;
                            }
                        }
                        const amplitude: number = (i == 0) ? 1.0 : dynamismStart;
                        sample += phaseDelta * slope - amplitude;
                        prevDrop = nextDrop;
                    }
                    for (let i: number = 0; i < Config.supersawVoiceCount; i++) {
                        tone.phases[i] += zeroCrossingPhase;
                    }

                    // Randomize the (initially sorted) order of the phases (aside from the
                    // first one) so that they don't correlate to the detunes that are also
                    // based on index.
                    for (let i: number = 1; i < Config.supersawVoiceCount - 1; i++) {
                        const swappedIndex: number = i + Math.floor(Math.random() * (Config.supersawVoiceCount - i));
                        const temp: number = tone.phases[i];
                        tone.phases[i] = tone.phases[swappedIndex];
                        tone.phases[swappedIndex] = temp;
                    }
                }

                const baseSpreadSlider: number = instrument.supersawSpread / Config.supersawSpreadMax;
                // Spread mods
                let useSpreadStart: number = baseSpreadSlider;
                let useSpreadEnd: number = baseSpreadSlider;
                if (this.isModActive(Config.modulators.dictionary["spread"].index, channelIndex, tone.instrumentIndex)) {
                    useSpreadStart = (this.getModValue(Config.modulators.dictionary["spread"].index, channelIndex, tone.instrumentIndex, false)) / Config.supersawSpreadMax;
                    useSpreadEnd = (this.getModValue(Config.modulators.dictionary["spread"].index, channelIndex, tone.instrumentIndex, true)) / Config.supersawSpreadMax;
                }

                const spreadSliderStart: number = useSpreadStart * envelopeStarts[EnvelopeComputeIndex.supersawSpread];
                const spreadSliderEnd: number = useSpreadEnd * envelopeEnds[EnvelopeComputeIndex.supersawSpread];
                // Just use the average detune for the current tick in the below loop.
                const averageSpreadSlider: number = (spreadSliderStart + spreadSliderEnd) * 0.5;
                const curvedSpread: number = Math.pow(1.0 - Math.sqrt(Math.max(0.0, 1.0 - averageSpreadSlider)), 1.75);
                for (let i = 0; i < Config.supersawVoiceCount; i++) {
                    // Spread out the detunes around the center;
                    const offset: number = (i == 0) ? 0.0 : Math.pow((((i + 1) >> 1) - 0.5 + 0.025 * ((i & 2) - 1)) / (Config.supersawVoiceCount >> 1), 1.1) * ((i & 1) * 2 - 1);
                    tone.supersawUnisonDetunes[i] = Math.pow(2.0, curvedSpread * offset / 12.0);
                }

                const baseShape: number = instrument.supersawShape / Config.supersawShapeMax;
                // Saw shape mods
                let useShapeStart: number = baseShape * envelopeStarts[EnvelopeComputeIndex.supersawShape];
                let useShapeEnd: number = baseShape * envelopeEnds[EnvelopeComputeIndex.supersawShape];
                if (this.isModActive(Config.modulators.dictionary["saw shape"].index, channelIndex, tone.instrumentIndex)) {
                    useShapeStart = (this.getModValue(Config.modulators.dictionary["saw shape"].index, channelIndex, tone.instrumentIndex, false)) / Config.supersawShapeMax;
                    useShapeEnd = (this.getModValue(Config.modulators.dictionary["saw shape"].index, channelIndex, tone.instrumentIndex, true)) / Config.supersawShapeMax;
                }

                const shapeStart: number = useShapeStart * envelopeStarts[EnvelopeComputeIndex.supersawShape];
                const shapeEnd: number = useShapeEnd * envelopeEnds[EnvelopeComputeIndex.supersawShape];
                tone.supersawShape = shapeStart;
                tone.supersawShapeDelta = (shapeEnd - shapeStart) / roundedSamplesPerTick;

                //decimal offset mods
                let decimalOffsetModStart: number = instrument.decimalOffset;
                if (this.isModActive(Config.modulators.dictionary["decimal offset"].index, channelIndex, tone.instrumentIndex)) {
                    decimalOffsetModStart = this.getModValue(Config.modulators.dictionary["decimal offset"].index, channelIndex, tone.instrumentIndex, false);
                }

                const decimalOffsetStart: number = decimalOffsetModStart * envelopeStarts[EnvelopeComputeIndex.decimalOffset];
                // ...is including tone.decimalOffset still necessary?
                tone.decimalOffset = decimalOffsetStart;

                const basePulseWidth: number = getPulseWidthRatio(instrument.pulseWidth);

                // Check for PWM mods to this instrument
                let pulseWidthModStart: number = basePulseWidth;
                let pulseWidthModEnd: number = basePulseWidth;
                if (this.isModActive(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex)) {
                    pulseWidthModStart = (this.getModValue(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex, false)) / (Config.pulseWidthRange * 2);
                    pulseWidthModEnd = (this.getModValue(Config.modulators.dictionary["pulse width"].index, channelIndex, tone.instrumentIndex, true)) / (Config.pulseWidthRange * 2);
                }

                let pulseWidthStart: number = pulseWidthModStart * envelopeStarts[EnvelopeComputeIndex.pulseWidth];
                let pulseWidthEnd: number = pulseWidthModEnd * envelopeEnds[EnvelopeComputeIndex.pulseWidth];
                pulseWidthStart -= decimalOffsetStart / 10000;
                pulseWidthEnd -= decimalOffsetStart / 10000;
                const phaseDeltaStart: number = (tone.supersawPrevPhaseDelta != null) ? tone.supersawPrevPhaseDelta : startFreq * sampleTime;
                const phaseDeltaEnd: number = startFreq * sampleTime * freqEndRatio;
                tone.supersawPrevPhaseDelta = phaseDeltaEnd;
                const delayLengthStart = pulseWidthStart / phaseDeltaStart;
                const delayLengthEnd = pulseWidthEnd / phaseDeltaEnd;
                tone.supersawDelayLength = delayLengthStart;
                tone.supersawDelayLengthDelta = (delayLengthEnd - delayLengthStart) / roundedSamplesPerTick;
                const minBufferLength: number = Math.ceil(Math.max(delayLengthStart, delayLengthEnd)) + 2;

                if (tone.supersawDelayLine == null || tone.supersawDelayLine.length <= minBufferLength) {
                    // The delay line buffer will get reused for other tones so might as well
                    // start off with a buffer size that is big enough for most notes.
                    const likelyMaximumLength: number = Math.ceil(0.5 * this.samplesPerSecond / Instrument.frequencyFromPitch(24));
                    const newDelayLine: Float32Array = new Float32Array(Synth.fittingPowerOfTwo(Math.max(likelyMaximumLength, minBufferLength)));
                    if (!initializeSupersaw && tone.supersawDelayLine != null) {
                        // If the tone has already started but the buffer needs to be reallocated,
                        // transfer the old data to the new buffer.
                        const oldDelayBufferMask: number = (tone.supersawDelayLine.length - 1) >> 0;
                        const startCopyingFromIndex: number = tone.supersawDelayIndex;
                        for (let i: number = 0; i < tone.supersawDelayLine.length; i++) {
                            newDelayLine[i] = tone.supersawDelayLine[(startCopyingFromIndex + i) & oldDelayBufferMask];
                        }
                    }
                    tone.supersawDelayLine = newDelayLine;
                    tone.supersawDelayIndex = tone.supersawDelayLine.length;
                } else if (initializeSupersaw) {
                    tone.supersawDelayLine.fill(0.0);
                    tone.supersawDelayIndex = tone.supersawDelayLine.length;
                }

                const pulseExpressionRatio: number = Config.pwmBaseExpression / Config.supersawBaseExpression;
                supersawExpressionStart *= (1.0 + (pulseExpressionRatio - 1.0) * shapeStart) / Math.sqrt(1.0 + (Config.supersawVoiceCount - 1.0) * dynamismStart * dynamismStart);
                supersawExpressionEnd *= (1.0 + (pulseExpressionRatio - 1.0) * shapeEnd) / Math.sqrt(1.0 + (Config.supersawVoiceCount - 1.0) * dynamismEnd * dynamismEnd);
            }

            let expressionStart: number = settingsExpressionMult * fadeExpressionStart * chordExpressionStart * pitchExpressionStart * envelopeStarts[EnvelopeComputeIndex.noteVolume] * supersawExpressionStart;
            let expressionEnd: number = settingsExpressionMult * fadeExpressionEnd * chordExpressionEnd * pitchExpressionEnd * envelopeEnds[EnvelopeComputeIndex.noteVolume] * supersawExpressionEnd;

            // Check for mod-related volume delta
            if (this.isModActive(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex)) {
                // Linear falloff below 0, normal volume formula above 0. Seems to work best for scaling since the normal volume mult formula has a big gap from -25 to -24.
                const startVal: number = this.getModValue(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex, false);
                const endVal: number = this.getModValue(Config.modulators.dictionary["note volume"].index, channelIndex, tone.instrumentIndex, true)
                expressionStart *= ((startVal <= 0) ? ((startVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(startVal));
                expressionEnd *= ((endVal <= 0) ? ((endVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(endVal));
            }
            if (isMono && tone.pitchCount <= instrument.monoChordTone) { //silence if tone doesn't exist
                expressionStart = 0;
                expressionEnd = 0;
                instrumentState.awake = false;
            }

            tone.expression = expressionStart;
            tone.expressionDelta = (expressionEnd - expressionStart) / roundedSamplesPerTick;


            if (instrument.type == InstrumentType.pickedString) {
                let stringDecayStart: number;
                if (tone.prevStringDecay != null) {
                    stringDecayStart = tone.prevStringDecay;
                } else {
                    const sustainEnvelopeStart: number = tone.envelopeComputer.envelopeStarts[EnvelopeComputeIndex.stringSustain];
                    stringDecayStart = 1.0 - Math.min(1.0, sustainEnvelopeStart * tone.stringSustainStart / (Config.stringSustainRange - 1));
                }
                const sustainEnvelopeEnd: number = tone.envelopeComputer.envelopeEnds[EnvelopeComputeIndex.stringSustain];
                let stringDecayEnd: number = 1.0 - Math.min(1.0, sustainEnvelopeEnd * tone.stringSustainEnd / (Config.stringSustainRange - 1));
                tone.prevStringDecay = stringDecayEnd;

                //const unison: Unison = Config.unisons[instrument.unison];
                const unisonVoices: number = instrument.unisonVoices;
                for (let i: number = tone.pickedStrings.length; i < unisonVoices; i++) {
                    tone.pickedStrings[i] = new PickedString();
                }

                if (tone.atNoteStart && !transition.continues && !tone.forceContinueAtStart) {
                    for (const pickedString of tone.pickedStrings) {
                        // Force the picked string to retrigger the attack impulse at the start of the note.
                        pickedString.delayIndex = -1;
                    }
                }

                for (let i: number = 0; i < unisonVoices; i++) {
                    tone.pickedStrings[i].update(this, instrumentState, tone, i, roundedSamplesPerTick, stringDecayStart, stringDecayEnd, instrument.stringSustainType);
                }
            }
        }
    }

    public static getLFOAmplitude(instrument: Instrument, secondsIntoBar: number): number {
        let effect: number = 0.0;
        for (const vibratoPeriodSeconds of Config.vibratoTypes[instrument.vibratoType].periodsSeconds) {
            effect += Math.sin(Math.PI * 2.0 * secondsIntoBar / vibratoPeriodSeconds);
        }
        return effect;
    }


    public static getInstrumentSynthFunction(instrument: Instrument): Function {
        if (instrument.type == InstrumentType.fm) {
            const fingerprint: string = instrument.algorithm + "_" + instrument.feedbackType;
            if (Synth.fmSynthFunctionCache[fingerprint] == undefined) {
                const synthSource: string[] = [];

                for (const line of Synth.fmSourceTemplate) {
                    if (line.indexOf("// CARRIER OUTPUTS") != -1) {
                        const outputs: string[] = [];
                        for (let j: number = 0; j < Config.algorithms[instrument.algorithm].carrierCount; j++) {
                            outputs.push("operator" + j + "Scaled");
                        }
                        synthSource.push(line.replace("/*operator#Scaled*/", outputs.join(" + ")));
                    } else if (line.indexOf("// INSERT OPERATOR COMPUTATION HERE") != -1) {
                        for (let j: number = Config.operatorCount - 1; j >= 0; j--) {
                            for (const operatorLine of Synth.operatorSourceTemplate) {
                                if (operatorLine.indexOf("/* + operator@Scaled*/") != -1) {
                                    let modulators = "";
                                    for (const modulatorNumber of Config.algorithms[instrument.algorithm].modulatedBy[j]) {
                                        modulators += " + operator" + (modulatorNumber - 1) + "Scaled";
                                    }

                                    const feedbackIndices: ReadonlyArray<number> = Config.feedbacks[instrument.feedbackType].indices[j];
                                    if (feedbackIndices.length > 0) {
                                        modulators += " + feedbackMult * (";
                                        const feedbacks: string[] = [];
                                        for (const modulatorNumber of feedbackIndices) {
                                            feedbacks.push("operator" + (modulatorNumber - 1) + "Output");
                                        }
                                        modulators += feedbacks.join(" + ") + ")";
                                    }
                                    synthSource.push(operatorLine.replace(/\#/g, j + "").replace("/* + operator@Scaled*/", modulators));
                                } else {
                                    synthSource.push(operatorLine.replace(/\#/g, j + ""));
                                }
                            }
                        }
                    } else if (line.indexOf("#") != -1) {
                        for (let j: number = 0; j < Config.operatorCount; j++) {
                            synthSource.push(line.replace(/\#/g, j + ""));
                        }
                    } else {
                        synthSource.push(line);
                    }
                }

                //console.log(synthSource.join("\n"));

                const wrappedFmSynth: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrument) => {" + synthSource.join("\n") + "}";

                Synth.fmSynthFunctionCache[fingerprint] = new Function("Config", "Synth", wrappedFmSynth)(Config, Synth);

            }
            return Synth.fmSynthFunctionCache[fingerprint];
        } else if (instrument.type == InstrumentType.chip) {
            // advloop addition
            if (instrument.isUsingAdvancedLoopControls) {
                return Synth.loopableChipSynth;
            }
            // advloop addition
            return Synth.chipSynth;
        } else if (instrument.type == InstrumentType.customChipWave) {
            return Synth.chipSynth;
        } else if (instrument.type == InstrumentType.harmonics) {
            return Synth.harmonicsSynth;
        } else if (instrument.type == InstrumentType.pwm) {
            return Synth.pulseWidthSynth;
        } else if (instrument.type == InstrumentType.supersaw) {
            return Synth.supersawSynth;
        } else if (instrument.type == InstrumentType.pickedString) {
            return Synth.pickedStringSynth;
        } else if (instrument.type == InstrumentType.noise) {
            return Synth.noiseSynth;
        } else if (instrument.type == InstrumentType.spectrum) {
            return Synth.spectrumSynth;
        } else if (instrument.type == InstrumentType.drumset) {
            return Synth.drumsetSynth;
        } else if (instrument.type == InstrumentType.mod) {
            return Synth.modSynth;
        } else if (instrument.type == InstrumentType.fm6op) {
            const fingerprint: string = instrument.customAlgorithm.name + "_" + instrument.customFeedbackType.name;
            if (Synth.fm6SynthFunctionCache[fingerprint] == undefined) {
                const synthSource: string[] = [];

                for (const line of Synth.fmSourceTemplate) {
                    if (line.indexOf("// CARRIER OUTPUTS") != -1) {
                        const outputs: string[] = [];
                        for (let j: number = 0; j < instrument.customAlgorithm.carrierCount; j++) {
                            outputs.push("operator" + j + "Scaled");
                        }
                        synthSource.push(line.replace("/*operator#Scaled*/", outputs.join(" + ")));
                    } else if (line.indexOf("// INSERT OPERATOR COMPUTATION HERE") != -1) {
                        for (let j: number = Config.operatorCount + 2 - 1; j >= 0; j--) {
                            for (const operatorLine of Synth.operatorSourceTemplate) {
                                if (operatorLine.indexOf("/* + operator@Scaled*/") != -1) {
                                    let modulators = "";
                                    for (const modulatorNumber of instrument.customAlgorithm.modulatedBy[j]) {
                                        modulators += " + operator" + (modulatorNumber - 1) + "Scaled";
                                    }

                                    const feedbackIndices: ReadonlyArray<number> = instrument.customFeedbackType.indices[j];
                                    if (feedbackIndices.length > 0) {
                                        modulators += " + feedbackMult * (";
                                        const feedbacks: string[] = [];
                                        for (const modulatorNumber of feedbackIndices) {
                                            feedbacks.push("operator" + (modulatorNumber - 1) + "Output");
                                        }
                                        modulators += feedbacks.join(" + ") + ")";
                                    }
                                    synthSource.push(operatorLine.replace(/\#/g, j + "").replace("/* + operator@Scaled*/", modulators));
                                } else {
                                    synthSource.push(operatorLine.replace(/\#/g, j + ""));
                                }
                            }
                        }
                    } else if (line.indexOf("#") != -1) {
                        for (let j = 0; j < Config.operatorCount + 2; j++) {
                            synthSource.push(line.replace(/\#/g, j + ""));
                        }
                    } else {
                        synthSource.push(line);
                    }
                }

                //console.log(synthSource.join("\n"));

                const wrappedFm6Synth: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrument) => {" + synthSource.join("\n") + "}";

                Synth.fm6SynthFunctionCache[fingerprint] = new Function("Config", "Synth", wrappedFm6Synth)(Config, Synth);
            }
            return Synth.fm6SynthFunctionCache[fingerprint];
        } else {
            throw new Error("Unrecognized instrument type: " + instrument.type);
        }
    }
    // advloop addition
    static wrap(x: number, b: number): number {
        return (x % b + b) % b;
    }
    static loopableChipSynth(synth: Synth, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrumentState: InstrumentState): void {
        // @TODO:
        // - Longer declicking? This is more difficult than I thought.
        //   When determining this automatically is difficult (or the input
        //   samples are expected to vary too much), this is left up to the
        //   user.
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let chipFunction: Function = Synth.loopableChipFunctionCache[instrumentState.unisonVoices];
        if (chipFunction == undefined) {
            let chipSource: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState) => {";


            chipSource += `
            const aliases = (effectsIncludeDistortion(instrumentState.effects) && instrumentState.aliases);
            // const aliases = false;
            const data = synth.tempMonoInstrumentSampleBuffer;
            const wave = instrumentState.wave;
            const volumeScale = instrumentState.volumeScale;
            const waveLength = (aliases && instrumentState.type == 8) ? wave.length : wave.length - 1;

            let chipWaveLoopEnd = Math.max(0, Math.min(waveLength, instrumentState.chipWaveLoopEnd));
            let chipWaveLoopStart = Math.max(0, Math.min(chipWaveLoopEnd - 1, instrumentState.chipWaveLoopStart));
            `
            // @TODO: This is where to set things up for the release loop mode.
            // const ticksSinceReleased = tone.ticksSinceReleased;
            // if (ticksSinceReleased > 0) {
            //     chipWaveLoopStart = 0;
            //     chipWaveLoopEnd = waveLength - 1;
            // }
            chipSource += `
            let chipWaveLoopLength = chipWaveLoopEnd - chipWaveLoopStart;
            if (chipWaveLoopLength < 2) {
                chipWaveLoopStart = 0;
                chipWaveLoopEnd = waveLength;
                chipWaveLoopLength = waveLength;
            }
            const chipWaveLoopMode = instrumentState.chipWaveLoopMode;
            const chipWavePlayBackwards = instrumentState.chipWavePlayBackwards;
            const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
            if(instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) {
            `
            for (let i: number = 1; i < voiceCount; i++) {
                chipSource += `
                if (instrumentState.unisonVoices <= #)
                    tone.phases[#] = tone.phases[#-1];
                `.replaceAll("#", i + "");
            }
            chipSource += `
            }`
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                let phaseDelta# = tone.phaseDeltas[#] * waveLength;
                let direction# = tone.directions[#];
                let chipWaveCompletion# = tone.chipWaveCompletions[#];

                `.replaceAll("#", i + "");
            }

            chipSource += `
            if (chipWaveLoopMode === 3 || chipWaveLoopMode === 2 || chipWaveLoopMode === 0) {
                if (!chipWavePlayBackwards) {`
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        direction# = 1;
                        `.replaceAll("#", i + "");
            }
            chipSource += `} else {`
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        direction# = -1;
                        `.replaceAll("#", i + "");
            }
            chipSource += `
                }
            }
            if (chipWaveLoopMode === 0 || chipWaveLoopMode === 1) {`
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                    chipWaveCompletion# = 0;
                    `.replaceAll("#", i + "");
            }
            chipSource += `    
            }
            
            const chipWaveCompletionFadeLength = 1000;
            let expression = +tone.expression;
            const expressionDelta = +tone.expressionDelta;
            `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                let lastWave# = tone.chipWaveCompletionsLastWave[#];
                const phaseDeltaScale# = +tone.phaseDeltaScales[#];
                let phase# = Synth.wrap(tone.phases[#], 1) * waveLength;
                let prevWaveIntegral# = 0;

                `.replaceAll("#", i + "");
            }
            chipSource += `
            if (!aliases) {
            `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                    const phase#Int = Math.floor(phase#);
                    const index# = Synth.wrap(phase#Int, waveLength);
                    const phaseRatio# = phase# - phase#Int;
                    prevWaveIntegral# = +wave[index#];
                    prevWaveIntegral# += (wave[Synth.wrap(index# + 1, waveLength)] - prevWaveIntegral#) * phaseRatio#;
                    `.replaceAll("#", i + "");
            }
            chipSource += `
            }
            const filters = tone.noteFilters;
            const filterCount = tone.noteFilterCount | 0;
            let initialFilterInput1 = +tone.initialNoteFilterInput1;
            let initialFilterInput2 = +tone.initialNoteFilterInput2;
            const applyFilters = Synth.applyFilters;
            const stopIndex = bufferIndex + roundedSamplesPerTick;
            `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                let prevWave# = tone.chipWavePrevWaves[#];

                `.replaceAll("#", i + "");
            }
            chipSource += `
            for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
                let wrapped = 0;
            `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                    if (chipWaveCompletion# > 0 && chipWaveCompletion# < chipWaveCompletionFadeLength) {
                        chipWaveCompletion#++;
                    }
                    phase# += phaseDelta# * direction#;

                    `.replaceAll("#", i + "");
            }
            chipSource += `
                if (chipWaveLoopMode === 2) {
                `
            // once
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        if (direction# === 1) {
                            if (phase# > waveLength) {
                                if (chipWaveCompletion# <= 0) {
                                    lastWave# = prevWave#;
                                    chipWaveCompletion#++;
                                }
                                wrapped = #;
                            }
                        } else if (direction# === -1) {
                            if (phase# < 0) {
                                if (chipWaveCompletion# <= 0) {
                                    lastWave# = prevWave#;
                                    chipWaveCompletion#++;
                                }
                                wrapped = 1;
                            }
                        }

                        `.replaceAll("#", i + "");
            }
            chipSource += `
                } else if (chipWaveLoopMode === 3) {
                `
            // loop once
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        if (direction# === 1) {
                            if (phase# > chipWaveLoopEnd) {
                                if (chipWaveCompletion# <= 0) {
                                    lastWave# = prevWave#;
                                    chipWaveCompletion#++;
                                }
                                wrapped = 1;
                            }
                        } else if (direction# === -1) {
                            if (phase# < chipWaveLoopStart) {
                                if (chipWaveCompletion# <= 0) {
                                    lastWave# = prevWave#;
                                    chipWaveCompletion#++;
                                }
                                wrapped = 1;
                            }
                        }

                        `.replaceAll("#", i + "");
            }
            chipSource += `
                } else if (chipWaveLoopMode === 0) {
                `
            // loop
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        if (direction# === 1) {
                            if (phase# > chipWaveLoopEnd) {
                                phase# = chipWaveLoopStart + Synth.wrap(phase# - chipWaveLoopEnd, chipWaveLoopLength);
                                // phase# = chipWaveLoopStart;
                                wrapped = 1;
                            }
                        } else if (direction# === -1) {
                            if (phase# < chipWaveLoopStart) {
                                phase# = chipWaveLoopEnd - Synth.wrap(chipWaveLoopStart - phase#, chipWaveLoopLength);
                                // phase# = chipWaveLoopEnd;
                                wrapped = 1;
                            }
                        }

                        `.replaceAll("#", i + "");
            }
            chipSource += `    
                } else if (chipWaveLoopMode === 1) {
                `
            // ping-pong
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        if (direction# === 1) {
                            if (phase# > chipWaveLoopEnd) {
                                phase# = chipWaveLoopEnd - Synth.wrap(phase# - chipWaveLoopEnd, chipWaveLoopLength);
                                // phase# = chipWaveLoopEnd;
                                direction# = -1;
                                wrapped = 1;
                            }
                        } else if (direction# === -1) {
                            if (phase# < chipWaveLoopStart) {
                                phase# = chipWaveLoopStart + Synth.wrap(chipWaveLoopStart - phase#, chipWaveLoopLength);
                                // phase# = chipWaveLoopStart;
                                direction# = 1;
                                wrapped = 1;
                            }
                        }

                        `.replaceAll("#", i + "");
            }
            chipSource += `    
                }
                `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                    let wave# = 0;
                    `.replaceAll("#", i + "");
            }
            chipSource += `    
                let inputSample = 0;
                if (aliases) {
                    inputSample = 0;
                `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        wave# = wave[Synth.wrap(Math.floor(phase#), waveLength)];
                        prevWave# = wave#;
                        const completionFade# = chipWaveCompletion# > 0 ? ((chipWaveCompletionFadeLength - Math.min(chipWaveCompletion#, chipWaveCompletionFadeLength)) / chipWaveCompletionFadeLength) : 1;
                        
                        if (chipWaveCompletion# > 0) {
                            inputSample += lastWave# * completionFade#;
                        } else {
                            inputSample += wave#;
                        }
                        `.replaceAll("#", i + "");
            }
            chipSource += `   
                } else {
                `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        const phase#Int = Math.floor(phase#);
                        const index# = Synth.wrap(phase#Int, waveLength);
                        let nextWaveIntegral# = wave[index#];
                        const phaseRatio# = phase# - phase#Int;
                        nextWaveIntegral# += (wave[Synth.wrap(index# + 1, waveLength)] - nextWaveIntegral#) * phaseRatio#;
                        `.replaceAll("#", i + "");
            }

            chipSource += `
                    if (!(chipWaveLoopMode === 0 && chipWaveLoopStart === 0 && chipWaveLoopEnd === waveLength) && wrapped !== 0) {
                    `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                            let pwi# = 0;
                            const phase#_ = Math.max(0, phase# - phaseDelta# * direction#);
                            const phase#Int = Math.floor(phase#_);
                            const index# = Synth.wrap(phase#Int, waveLength);
                            pwi# = wave[index#];
                            pwi# += (wave[Synth.wrap(index# + 1, waveLength)] - pwi#) * (phase#_ - phase#Int) * direction#;
                            prevWaveIntegral# = pwi#;
                            `.replaceAll("#", i + "");
            }
            chipSource += `    
                    }
                    if (chipWaveLoopMode === 1 && wrapped !== 0) {
                    `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                            wave# = prevWave#;
                            `.replaceAll("#", i + "");
            }
            chipSource += `
                    } else {
                    `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                            wave# = (nextWaveIntegral# - prevWaveIntegral#) / (phaseDelta# * direction#);
                            `.replaceAll("#", i + "");
            }
            chipSource += `
                    }
                    `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                        prevWave# = wave#;
                        prevWaveIntegral# = nextWaveIntegral#;
                        const completionFade# = chipWaveCompletion# > 0 ? ((chipWaveCompletionFadeLength - Math.min(chipWaveCompletion#, chipWaveCompletionFadeLength)) / chipWaveCompletionFadeLength) : 1;
                        if (chipWaveCompletion# > 0) {
                            inputSample += lastWave# * completionFade#;
                        } else {
                            inputSample += wave#;
                        }
                        `.replaceAll("#", i + "");
            }
            chipSource += `
                }
                const sample = applyFilters(inputSample * volumeScale, initialFilterInput1, initialFilterInput2, filterCount, filters);
                initialFilterInput2 = initialFilterInput1;
                initialFilterInput1 = inputSample * volumeScale;
                const output = sample * expression;
                expression += expressionDelta;
                data[sampleIndex] += output;
                `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                    phaseDelta# *= phaseDeltaScale#;
                    `.replaceAll("#", i + "");
            }
            chipSource += `
            }
            `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `
                tone.phases[#] = phase# / waveLength;
                tone.phaseDeltas[#] = phaseDelta# / waveLength;
                tone.directions[#] = direction#;
                tone.chipWaveCompletions[#] = chipWaveCompletion#;
                tone.chipWavePrevWaves[#] = prevWave#;
                tone.chipWaveCompletionsLastWave[#] = lastWave#;
                
                `.replaceAll("#", i + "");
            }

            chipSource += `
            tone.expression = expression;
            synth.sanitizeFilters(filters);
            tone.initialNoteFilterInput1 = initialFilterInput1;
            tone.initialNoteFilterInput2 = initialFilterInput2;
        }`
            chipFunction = new Function("Config", "Synth", "effectsIncludeDistortion", chipSource)(Config, Synth, effectsIncludeDistortion);
            Synth.loopableChipFunctionCache[instrumentState.unisonVoices] = chipFunction;
        }
        chipFunction(synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState);
    }

    private static chipSynth(synth: Synth, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let chipFunction: Function = Synth.chipFunctionCache[instrumentState.unisonVoices];
        if (chipFunction == undefined) {
            let chipSource: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState) => {";


            chipSource += `
        const aliases = (effectsIncludeDistortion(instrumentState.effects) && instrumentState.aliases);
        const data = synth.tempMonoInstrumentSampleBuffer;
        const wave = instrumentState.wave;
        const volumeScale = instrumentState.volumeScale;

        const waveLength = (aliases && instrumentState.type == 8) ? wave.length : wave.length - 1;

        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
        let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `let phaseDelta# = tone.phaseDeltas[#] * waveLength;
            let phaseDeltaScale# = +tone.phaseDeltaScales[#];

            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[# - 1];
            `.replaceAll("#", i + "");
            }

            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `let phase# = (tone.phases[#] % 1) * waveLength;
            let prevWaveIntegral# = 0.0;
            `.replaceAll("#", i + "");
            }

            chipSource += `const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;

        if (!aliases) {
        `
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `const phase#Int = phase# | 0;
                const index# = phase#Int % waveLength;
                prevWaveIntegral# = +wave[index#]
                const phase#Ratio = phase# - phase#Int;
                prevWaveIntegral# += (wave[index# + 1] - prevWaveIntegral#) * phase#Ratio;
                `.replaceAll("#", i + "");
            }
            chipSource += `
        } 

        const stopIndex = bufferIndex + roundedSamplesPerTick;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
        let inputSample = 0;
            if (aliases) {
                `;
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `phase# += phaseDelta#;

                    const inputSample# = wave[(0 | phase#) % waveLength];
                    `.replaceAll("#", i + "");
            }
            const sampleListA: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleListA.push("inputSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            chipSource += "inputSample = " + sampleListA.join(" + ") + ";";
            chipSource += `} else {
                    `;
            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `phase# += phaseDelta#;

                     
                        const phase#Int = phase# | 0;
                        const index# = phase#Int % waveLength;
                        let nextWaveIntegral# = wave[index#]
                        const phase#Ratio = phase# - phase#Int;
                        nextWaveIntegral# += (wave[index# + 1] - nextWaveIntegral#) * phase#Ratio;
                        const wave# = (nextWaveIntegral# - prevWaveIntegral#) / phaseDelta#;
                        prevWaveIntegral# = nextWaveIntegral#;
                        let inputSample# = wave#;
                        `.replaceAll("#", i + "");
            }
            const sampleListB: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleListB.push("inputSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            chipSource += "inputSample = " + sampleListB.join(" + ") + ";";
            chipSource += `}
        `;


            chipSource += `const sample = applyFilters(inputSample * volumeScale, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample * volumeScale;`;

            for (let i = 0; i < voiceCount; i++) {
                chipSource += `
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            chipSource += `const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }
            `

            for (let i: number = 0; i < voiceCount; i++) {
                chipSource += `tone.phases[#] = phase# / waveLength;
            tone.phaseDeltas[#] = phaseDelta# / waveLength;
            `.replaceAll("#", i + "");
            }

            chipSource += "tone.expression = expression;";

            chipSource += `
        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`;
            chipFunction = new Function("Config", "Synth", "effectsIncludeDistortion", chipSource)(Config, Synth, effectsIncludeDistortion);
            Synth.chipFunctionCache[instrumentState.unisonVoices] = chipFunction;
        }
        chipFunction(synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState);
    }

    private static harmonicsSynth(synth: Synth, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let harmonicsFunction: Function = Synth.harmonicsFunctionCache[instrumentState.unisonVoices];
        if (harmonicsFunction == undefined) {
            let harmonicsSource: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState) => {";


            harmonicsSource += `
        const data = synth.tempMonoInstrumentSampleBuffer;
        const wave = instrumentState.wave;
        const waveLength = wave.length - 1; // The first sample is duplicated at the end, don't double-count it.

        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
        let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;
         `
            for (let i: number = 0; i < voiceCount; i++) {
                harmonicsSource += `let phaseDelta# = tone.phaseDeltas[#] * waveLength;
            let phaseDeltaScale# = +tone.phaseDeltaScales[#];

            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[# - 1];
            `.replaceAll("#", i + "");
            }

            for (let i: number = 0; i < voiceCount; i++) {
                harmonicsSource += `let phase# = (tone.phases[#] % 1) * waveLength;
            `.replaceAll("#", i + "");
            }

            harmonicsSource += `const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;
        `

            for (let i: number = 0; i < voiceCount; i++) {
                harmonicsSource += `const phase#Int = phase# | 0;
            const index# = phase#Int % waveLength;
            prevWaveIntegral# = +wave[index#]
            const phase#Ratio = phase# - phase#Int;
            prevWaveIntegral# += (wave[index# + 1] - prevWaveIntegral#) * phase#Ratio;
            `.replaceAll("#", i + "");
            }

            harmonicsSource += `const stopIndex = bufferIndex + roundedSamplesPerTick;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
        `
            for (let i: number = 0; i < voiceCount; i++) {
                harmonicsSource += `
                        phase# += phaseDelta#;
                        const phase#Int = phase# | 0;
                        const index# = phase#Int % waveLength;
                        let nextWaveIntegral# = wave[index#]
                        const phase#Ratio = phase# - phase#Int;
                        nextWaveIntegral# += (wave[index# + 1] - nextWaveIntegral#) * phase#Ratio;
                        const wave# = (nextWaveIntegral# - prevWaveIntegral#) / phaseDelta#;
                        prevWaveIntegral# = nextWaveIntegral#;
                        let inputSample# = wave#;
                        `.replaceAll("#", i + "");
            }
            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("inputSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            harmonicsSource += "inputSample = " + sampleList.join(" + ") + ";";


            harmonicsSource += `const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;`;

            for (let i = 0; i < voiceCount; i++) {
                harmonicsSource += `
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            harmonicsSource += `const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }
            `

            for (let i: number = 0; i < voiceCount; i++) {
                harmonicsSource += `tone.phases[#] = phase# / waveLength;
            tone.phaseDeltas[#] = phaseDelta# / waveLength;
            `.replaceAll("#", i + "");
            }

            harmonicsSource += "tone.expression = expression;";

            harmonicsSource += `
        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`;
            harmonicsFunction = new Function("Config", "Synth", harmonicsSource)(Config, Synth);
            Synth.harmonicsFunctionCache[instrumentState.unisonVoices] = harmonicsFunction;
        }
        harmonicsFunction(synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState);
    }

    private static pickedStringSynth(synth: Synth, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = instrumentState.unisonVoices;
        let pickedStringFunction: Function = Synth.pickedStringFunctionCache[voiceCount];
        if (pickedStringFunction == undefined) {
            let pickedStringSource: string = "return (synth, bufferIndex, runLength, tone, instrumentState) => {";


            pickedStringSource += `
				const Config = beepbox.Config;
				const Synth = beepbox.Synth;
				const data = synth.tempMonoInstrumentSampleBuffer;
				
				let pickedString# = tone.pickedStrings[#];
				let allPassSample# = +pickedString#.allPassSample;
				let allPassPrevInput# = +pickedString#.allPassPrevInput;
				let sustainFilterSample# = +pickedString#.sustainFilterSample;
				let sustainFilterPrevOutput2# = +pickedString#.sustainFilterPrevOutput2;
				let sustainFilterPrevInput1# = +pickedString#.sustainFilterPrevInput1;
				let sustainFilterPrevInput2# = +pickedString#.sustainFilterPrevInput2;
				let fractionalDelaySample# = +pickedString#.fractionalDelaySample;
				const delayLine# = pickedString#.delayLine;
				const delayBufferMask# = (delayLine#.length - 1) >> 0;
				let delayIndex# = pickedString#.delayIndex|0;
				delayIndex# = (delayIndex# & delayBufferMask#) + delayLine#.length;
				let delayLength# = +pickedString#.prevDelayLength;
				const delayLengthDelta# = +pickedString#.delayLengthDelta;
				let allPassG# = +pickedString#.allPassG;
				let sustainFilterA1# = +pickedString#.sustainFilterA1;
				let sustainFilterA2# = +pickedString#.sustainFilterA2;
				let sustainFilterB0# = +pickedString#.sustainFilterB0;
				let sustainFilterB1# = +pickedString#.sustainFilterB1;
				let sustainFilterB2# = +pickedString#.sustainFilterB2;
				const allPassGDelta# = +pickedString#.allPassGDelta;
				const sustainFilterA1Delta# = +pickedString#.sustainFilterA1Delta;
				const sustainFilterA2Delta# = +pickedString#.sustainFilterA2Delta;
				const sustainFilterB0Delta# = +pickedString#.sustainFilterB0Delta;
				const sustainFilterB1Delta# = +pickedString#.sustainFilterB1Delta;
				const sustainFilterB2Delta# = +pickedString#.sustainFilterB2Delta;
				
				let expression = +tone.expression;
				const expressionDelta = +tone.expressionDelta;
				
				const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
                if (instrumentState.unisonVoices == 1 && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[1] = tone.phases[0];
				const delayResetOffset# = pickedString#.delayResetOffset|0;
				
				const filters = tone.noteFilters;
				const filterCount = tone.noteFilterCount|0;
				let initialFilterInput1 = +tone.initialNoteFilterInput1;
				let initialFilterInput2 = +tone.initialNoteFilterInput2;
				const applyFilters = Synth.applyFilters;
				
				const stopIndex = bufferIndex + runLength;
				for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
					const targetSampleTime# = delayIndex# - delayLength#;
					const lowerIndex# = (targetSampleTime# + 0.125) | 0; // Offset to improve stability of all-pass filter.
					const upperIndex# = lowerIndex# + 1;
					const fractionalDelay# = upperIndex# - targetSampleTime#;
					const fractionalDelayG# = (1.0 - fractionalDelay#) / (1.0 + fractionalDelay#); // Inlined version of FilterCoefficients.prototype.allPass1stOrderFractionalDelay
					const prevInput# = delayLine#[lowerIndex# & delayBufferMask#];
					const input# = delayLine#[upperIndex# & delayBufferMask#];
					fractionalDelaySample# = fractionalDelayG# * input# + prevInput# - fractionalDelayG# * fractionalDelaySample#;
					
					allPassSample# = fractionalDelaySample# * allPassG# + allPassPrevInput# - allPassG# * allPassSample#;
					allPassPrevInput# = fractionalDelaySample#;
					
					const sustainFilterPrevOutput1# = sustainFilterSample#;
					sustainFilterSample# = sustainFilterB0# * allPassSample# + sustainFilterB1# * sustainFilterPrevInput1# + sustainFilterB2# * sustainFilterPrevInput2# - sustainFilterA1# * sustainFilterSample# - sustainFilterA2# * sustainFilterPrevOutput2#;
					sustainFilterPrevOutput2# = sustainFilterPrevOutput1#;
					sustainFilterPrevInput2# = sustainFilterPrevInput1#;
					sustainFilterPrevInput1# = allPassSample#;
					
					delayLine#[delayIndex# & delayBufferMask#] += sustainFilterSample#;
					delayLine#[(delayIndex# + delayResetOffset#) & delayBufferMask#] = 0.0;
					delayIndex#++;
					
					const inputSample = (`

            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("fractionalDelaySample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            pickedStringSource += sampleList.join(" + ");

            pickedStringSource += `) * expression;
					const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
					initialFilterInput2 = initialFilterInput1;
					initialFilterInput1 = inputSample;
					data[sampleIndex] += sample;
					
					expression += expressionDelta;
					delayLength# += delayLengthDelta#;
					allPassG# += allPassGDelta#;
					sustainFilterA1# += sustainFilterA1Delta#;
					sustainFilterA2# += sustainFilterA2Delta#;
					sustainFilterB0# += sustainFilterB0Delta#;
					sustainFilterB1# += sustainFilterB1Delta#;
					sustainFilterB2# += sustainFilterB2Delta#;
				}
				
				// Avoid persistent denormal or NaN values in the delay buffers and filter history.
				const epsilon = (1.0e-24);
				if (!Number.isFinite(allPassSample#) || Math.abs(allPassSample#) < epsilon) allPassSample# = 0.0;
				if (!Number.isFinite(allPassPrevInput#) || Math.abs(allPassPrevInput#) < epsilon) allPassPrevInput# = 0.0;
				if (!Number.isFinite(sustainFilterSample#) || Math.abs(sustainFilterSample#) < epsilon) sustainFilterSample# = 0.0;
				if (!Number.isFinite(sustainFilterPrevOutput2#) || Math.abs(sustainFilterPrevOutput2#) < epsilon) sustainFilterPrevOutput2# = 0.0;
				if (!Number.isFinite(sustainFilterPrevInput1#) || Math.abs(sustainFilterPrevInput1#) < epsilon) sustainFilterPrevInput1# = 0.0;
				if (!Number.isFinite(sustainFilterPrevInput2#) || Math.abs(sustainFilterPrevInput2#) < epsilon) sustainFilterPrevInput2# = 0.0;
				if (!Number.isFinite(fractionalDelaySample#) || Math.abs(fractionalDelaySample#) < epsilon) fractionalDelaySample# = 0.0;
				pickedString#.allPassSample = allPassSample#;
				pickedString#.allPassPrevInput = allPassPrevInput#;
				pickedString#.sustainFilterSample = sustainFilterSample#;
				pickedString#.sustainFilterPrevOutput2 = sustainFilterPrevOutput2#;
				pickedString#.sustainFilterPrevInput1 = sustainFilterPrevInput1#;
				pickedString#.sustainFilterPrevInput2 = sustainFilterPrevInput2#;
				pickedString#.fractionalDelaySample = fractionalDelaySample#;
				pickedString#.delayIndex = delayIndex#;
				pickedString#.prevDelayLength = delayLength#;
				pickedString#.allPassG = allPassG#;
				pickedString#.sustainFilterA1 = sustainFilterA1#;
				pickedString#.sustainFilterA2 = sustainFilterA2#;
				pickedString#.sustainFilterB0 = sustainFilterB0#;
				pickedString#.sustainFilterB1 = sustainFilterB1#;
				pickedString#.sustainFilterB2 = sustainFilterB2#;
				
				tone.expression = expression;
				
				synth.sanitizeFilters(filters);
				tone.initialNoteFilterInput1 = initialFilterInput1;
				tone.initialNoteFilterInput2 = initialFilterInput2;
			}`

            // Duplicate lines containing "#" for each voice and replace the "#" with the voice index.
            pickedStringSource = pickedStringSource.replace(/^.*\#.*$/mg, line => {
                const lines: string[] = [];
                for (let voice: number = 0; voice < voiceCount; voice++) {
                    lines.push(line.replace(/\#/g, String(voice)));
                }
                return lines.join("\n");
            });
            pickedStringFunction = new Function("Config", "Synth", pickedStringSource)(Config, Synth);
            Synth.pickedStringFunctionCache[voiceCount] = pickedStringFunction;
        }

        pickedStringFunction(synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState);
    }

    private static effectsSynth(synth: Synth, outputDataL: Float32Array, outputDataR: Float32Array, bufferIndex: number, runLength: number, instrumentState: InstrumentState): void {
        // TODO: If automation is involved, don't assume sliders will stay at zero.
        // @jummbus - ^ Correct, removed the non-zero checks as modulation can change them.

        const usesDistortion: boolean = effectsIncludeDistortion(instrumentState.effects);
        const usesBitcrusher: boolean = effectsIncludeBitcrusher(instrumentState.effects);
        const usesEqFilter: boolean = instrumentState.eqFilterCount > 0;
        const usesPanning: boolean = effectsIncludePanning(instrumentState.effects);
        const usesChorus: boolean = effectsIncludeChorus(instrumentState.effects);
        const usesEcho: boolean = effectsIncludeEcho(instrumentState.effects);
        const usesReverb: boolean = effectsIncludeReverb(instrumentState.effects);
        const usesGranular: boolean = effectsIncludeGranular(instrumentState.effects);
        const usesRingModulation: boolean = effectsIncludeRingModulation(instrumentState.effects);
        let signature: number = 0; if (usesDistortion) signature = signature | 1;
        signature = signature << 1; if (usesBitcrusher) signature = signature | 1;
        signature = signature << 1; if (usesEqFilter) signature = signature | 1;
        signature = signature << 1; if (usesPanning) signature = signature | 1;
        signature = signature << 1; if (usesChorus) signature = signature | 1;
        signature = signature << 1; if (usesEcho) signature = signature | 1;
        signature = signature << 1; if (usesReverb) signature = signature | 1;
        signature = signature << 1; if (usesGranular) signature = signature | 1;
        signature = signature << 1; if (usesRingModulation) signature = signature | 1;

        let effectsFunction: Function = Synth.effectsFunctionCache[signature];
        if (effectsFunction == undefined) {
            let effectsSource: string = "return (synth, outputDataL, outputDataR, bufferIndex, runLength, instrumentState) => {";

            const usesDelays: boolean = usesChorus || usesReverb || usesEcho || usesGranular;

            effectsSource += `
				const tempMonoInstrumentSampleBuffer = synth.tempMonoInstrumentSampleBuffer;
				
				let mixVolume = +instrumentState.mixVolume;
				const mixVolumeDelta = +instrumentState.mixVolumeDelta;
                `

            if (usesDelays) {
                effectsSource += `
				
				let delayInputMult = +instrumentState.delayInputMult;
				const delayInputMultDelta = +instrumentState.delayInputMultDelta;`
            }

            if (usesGranular) {
                effectsSource += `
                let granularWet = instrumentState.granularMix;
                const granularMixDelta = instrumentState.granularMixDelta;
                let granularDry = 1.0 - granularWet; 
                const granularDelayLine = instrumentState.granularDelayLine;
                const granularGrains = instrumentState.granularGrains;
                let granularGrainCount = instrumentState.granularGrainsLength;
                const granularDelayLineLength = granularDelayLine.length;
                const granularDelayLineMask = granularDelayLineLength - 1;
                let granularDelayLineIndex = instrumentState.granularDelayLineIndex;
                const usesRandomGrainLocation = instrumentState.usesRandomGrainLocation;
                const computeGrains = instrumentState.computeGrains;
                instrumentState.granularDelayLineDirty = true;
                `
            }

            if (usesDistortion) {
                // Distortion can sometimes create noticeable aliasing.
                // It seems the established industry best practice for distortion antialiasing
                // is to upsample the inputs ("zero stuffing" followed by a brick wall lowpass
                // at the original nyquist frequency), perform the distortion, then downsample
                // (the lowpass again followed by dropping in-between samples). This is
                // "mathematically correct" in that it preserves only the intended frequencies,
                // but it has several unfortunate tradeoffs depending on the choice of filter,
                // introducing latency and/or time smearing, since no true brick wall filter
                // exists. For the time being, I've opted to instead generate in-between input
                // samples using fractional delay all-pass filters, and after distorting them,
                // I "downsample" these with a simple weighted sum.

                effectsSource += `
				
				const distortionBaseVolume = +Config.distortionBaseVolume;
				let distortion = instrumentState.distortion;
				const distortionDelta = instrumentState.distortionDelta;
				let distortionDrive = instrumentState.distortionDrive;
				const distortionDriveDelta = instrumentState.distortionDriveDelta;
				const distortionFractionalResolution = 4.0;
				const distortionOversampleCompensation = distortionBaseVolume / distortionFractionalResolution;
				const distortionFractionalDelay1 = 1.0 / distortionFractionalResolution;
				const distortionFractionalDelay2 = 2.0 / distortionFractionalResolution;
				const distortionFractionalDelay3 = 3.0 / distortionFractionalResolution;
				const distortionFractionalDelayG1 = (1.0 - distortionFractionalDelay1) / (1.0 + distortionFractionalDelay1); // Inlined version of FilterCoefficients.prototype.allPass1stOrderFractionalDelay
				const distortionFractionalDelayG2 = (1.0 - distortionFractionalDelay2) / (1.0 + distortionFractionalDelay2); // Inlined version of FilterCoefficients.prototype.allPass1stOrderFractionalDelay
				const distortionFractionalDelayG3 = (1.0 - distortionFractionalDelay3) / (1.0 + distortionFractionalDelay3); // Inlined version of FilterCoefficients.prototype.allPass1stOrderFractionalDelay
				const distortionNextOutputWeight1 = Math.cos(Math.PI * distortionFractionalDelay1) * 0.5 + 0.5;
				const distortionNextOutputWeight2 = Math.cos(Math.PI * distortionFractionalDelay2) * 0.5 + 0.5;
				const distortionNextOutputWeight3 = Math.cos(Math.PI * distortionFractionalDelay3) * 0.5 + 0.5;
				const distortionPrevOutputWeight1 = 1.0 - distortionNextOutputWeight1;
				const distortionPrevOutputWeight2 = 1.0 - distortionNextOutputWeight2;
				const distortionPrevOutputWeight3 = 1.0 - distortionNextOutputWeight3;
				
				let distortionFractionalInput1 = +instrumentState.distortionFractionalInput1;
				let distortionFractionalInput2 = +instrumentState.distortionFractionalInput2;
				let distortionFractionalInput3 = +instrumentState.distortionFractionalInput3;
				let distortionPrevInput = +instrumentState.distortionPrevInput;
				let distortionNextOutput = +instrumentState.distortionNextOutput;`
            }

            if (usesBitcrusher) {
                effectsSource += `
				
				let bitcrusherPrevInput = +instrumentState.bitcrusherPrevInput;
				let bitcrusherCurrentOutput = +instrumentState.bitcrusherCurrentOutput;
				let bitcrusherPhase = +instrumentState.bitcrusherPhase;
				let bitcrusherPhaseDelta = +instrumentState.bitcrusherPhaseDelta;
				const bitcrusherPhaseDeltaScale = +instrumentState.bitcrusherPhaseDeltaScale;
				let bitcrusherScale = +instrumentState.bitcrusherScale;
				const bitcrusherScaleScale = +instrumentState.bitcrusherScaleScale;
				let bitcrusherFoldLevel = +instrumentState.bitcrusherFoldLevel;
				const bitcrusherFoldLevelScale = +instrumentState.bitcrusherFoldLevelScale;`
            }

            if (usesRingModulation) {
                effectsSource += `
				
                let ringModMix = +instrumentState.ringModMix;
                let ringModMixDelta = +instrumentState.ringModMixDelta;
                let ringModPhase = +instrumentState.ringModPhase;
                let ringModPhaseDelta = +instrumentState.ringModPhaseDelta;
                let ringModPhaseDeltaScale = +instrumentState.ringModPhaseDeltaScale;
                let ringModWaveformIndex = +instrumentState.ringModWaveformIndex;
                let ringModMixFade = +instrumentState.ringModMixFade;
                let ringModMixFadeDelta = +instrumentState.ringModMixFadeDelta;
                
                let ringModPulseWidth = +instrumentState.ringModPulseWidth;

                let waveform = Config.operatorWaves[ringModWaveformIndex].samples; 
                if (ringModWaveformIndex == Config.operatorWaves.dictionary['pulse width'].index) {
                    waveform = Synth.getOperatorWave(ringModWaveformIndex, ringModPulseWidth).samples;
                }
                const waveformLength = waveform.length - 1;
                `
            }

            if (usesEqFilter) {
                effectsSource += `
				
				let filters = instrumentState.eqFilters;
				const filterCount = instrumentState.eqFilterCount|0;
				let initialFilterInput1 = +instrumentState.initialEqFilterInput1;
				let initialFilterInput2 = +instrumentState.initialEqFilterInput2;
				const applyFilters = Synth.applyFilters;`
            }

            // The eq filter volume is also used to fade out the instrument state, so always include it.
            effectsSource += `
				
				let eqFilterVolume = +instrumentState.eqFilterVolume;
				const eqFilterVolumeDelta = +instrumentState.eqFilterVolumeDelta;`

            if (usesPanning) {
                effectsSource += `
				
				const panningMask = synth.panningDelayBufferMask >>> 0;
				const panningDelayLine = instrumentState.panningDelayLine;
				let panningDelayPos = instrumentState.panningDelayPos & panningMask;
				let   panningVolumeL      = +instrumentState.panningVolumeL;
				let   panningVolumeR      = +instrumentState.panningVolumeR;
				const panningVolumeDeltaL = +instrumentState.panningVolumeDeltaL;
				const panningVolumeDeltaR = +instrumentState.panningVolumeDeltaR;
				let   panningOffsetL      = +instrumentState.panningOffsetL;
				let   panningOffsetR      = +instrumentState.panningOffsetR;
				const panningOffsetDeltaL = 1.0 - instrumentState.panningOffsetDeltaL;
				const panningOffsetDeltaR = 1.0 - instrumentState.panningOffsetDeltaR;`
            }

            if (usesChorus) {
                effectsSource += `
				
				const chorusMask = synth.chorusDelayBufferMask >>> 0;
				const chorusDelayLineL = instrumentState.chorusDelayLineL;
				const chorusDelayLineR = instrumentState.chorusDelayLineR;
				instrumentState.chorusDelayLineDirty = true;
				let chorusDelayPos = instrumentState.chorusDelayPos & chorusMask;
				
				let chorusVoiceMult = +instrumentState.chorusVoiceMult;
				const chorusVoiceMultDelta = +instrumentState.chorusVoiceMultDelta;
				let chorusCombinedMult = +instrumentState.chorusCombinedMult;
				const chorusCombinedMultDelta = +instrumentState.chorusCombinedMultDelta;
				
				const chorusDuration = +beepbox.Config.chorusPeriodSeconds;
				const chorusAngle = Math.PI * 2.0 / (chorusDuration * synth.samplesPerSecond);
				const chorusRange = synth.samplesPerSecond * beepbox.Config.chorusDelayRange;
				const chorusOffset0 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[0][0] * chorusRange;
				const chorusOffset1 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[0][1] * chorusRange;
				const chorusOffset2 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[0][2] * chorusRange;
				const chorusOffset3 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[1][0] * chorusRange;
				const chorusOffset4 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[1][1] * chorusRange;
				const chorusOffset5 = synth.chorusDelayBufferSize - beepbox.Config.chorusDelayOffsets[1][2] * chorusRange;
				let chorusPhase = instrumentState.chorusPhase % (Math.PI * 2.0);
				let chorusTap0Index = chorusDelayPos + chorusOffset0 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][0]);
				let chorusTap1Index = chorusDelayPos + chorusOffset1 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][1]);
				let chorusTap2Index = chorusDelayPos + chorusOffset2 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][2]);
				let chorusTap3Index = chorusDelayPos + chorusOffset3 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][0]);
				let chorusTap4Index = chorusDelayPos + chorusOffset4 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][1]);
				let chorusTap5Index = chorusDelayPos + chorusOffset5 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][2]);
				chorusPhase += chorusAngle * runLength;
				const chorusTap0End = chorusDelayPos + chorusOffset0 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][0]) + runLength;
				const chorusTap1End = chorusDelayPos + chorusOffset1 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][1]) + runLength;
				const chorusTap2End = chorusDelayPos + chorusOffset2 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[0][2]) + runLength;
				const chorusTap3End = chorusDelayPos + chorusOffset3 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][0]) + runLength;
				const chorusTap4End = chorusDelayPos + chorusOffset4 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][1]) + runLength;
				const chorusTap5End = chorusDelayPos + chorusOffset5 - chorusRange * Math.sin(chorusPhase + beepbox.Config.chorusPhaseOffsets[1][2]) + runLength;
				const chorusTap0Delta = (chorusTap0End - chorusTap0Index) / runLength;
				const chorusTap1Delta = (chorusTap1End - chorusTap1Index) / runLength;
				const chorusTap2Delta = (chorusTap2End - chorusTap2Index) / runLength;
				const chorusTap3Delta = (chorusTap3End - chorusTap3Index) / runLength;
				const chorusTap4Delta = (chorusTap4End - chorusTap4Index) / runLength;
				const chorusTap5Delta = (chorusTap5End - chorusTap5Index) / runLength;`
            }

            if (usesEcho) {
                effectsSource += `
				let echoMult = +instrumentState.echoMult;
				const echoMultDelta = +instrumentState.echoMultDelta;
				
				const echoDelayLineL = instrumentState.echoDelayLineL;
				const echoDelayLineR = instrumentState.echoDelayLineR;
				const echoMask = (echoDelayLineL.length - 1) >>> 0;
				instrumentState.echoDelayLineDirty = true;
				
				let echoDelayPos = instrumentState.echoDelayPos & echoMask;
				const echoDelayOffsetStart = (echoDelayLineL.length - instrumentState.echoDelayOffsetStart) & echoMask;
				const echoDelayOffsetEnd   = (echoDelayLineL.length - instrumentState.echoDelayOffsetEnd) & echoMask;
				let echoDelayOffsetRatio = +instrumentState.echoDelayOffsetRatio;
				const echoDelayOffsetRatioDelta = +instrumentState.echoDelayOffsetRatioDelta;
				
				const echoShelfA1 = +instrumentState.echoShelfA1;
				const echoShelfB0 = +instrumentState.echoShelfB0;
				const echoShelfB1 = +instrumentState.echoShelfB1;
				let echoShelfSampleL = +instrumentState.echoShelfSampleL;
				let echoShelfSampleR = +instrumentState.echoShelfSampleR;
				let echoShelfPrevInputL = +instrumentState.echoShelfPrevInputL;
				let echoShelfPrevInputR = +instrumentState.echoShelfPrevInputR;`
            }

            if (usesReverb) { //TODO: reverb wet/dry?
                effectsSource += `
				
				const reverbMask = Config.reverbDelayBufferMask >>> 0; //TODO: Dynamic reverb buffer size.
				const reverbDelayLine = instrumentState.reverbDelayLine;
				instrumentState.reverbDelayLineDirty = true;
				let reverbDelayPos = instrumentState.reverbDelayPos & reverbMask;
				
				let reverb = +instrumentState.reverbMult;
				const reverbDelta = +instrumentState.reverbMultDelta;
				
				const reverbShelfA1 = +instrumentState.reverbShelfA1;
				const reverbShelfB0 = +instrumentState.reverbShelfB0;
				const reverbShelfB1 = +instrumentState.reverbShelfB1;
				let reverbShelfSample0 = +instrumentState.reverbShelfSample0;
				let reverbShelfSample1 = +instrumentState.reverbShelfSample1;
				let reverbShelfSample2 = +instrumentState.reverbShelfSample2;
				let reverbShelfSample3 = +instrumentState.reverbShelfSample3;
				let reverbShelfPrevInput0 = +instrumentState.reverbShelfPrevInput0;
				let reverbShelfPrevInput1 = +instrumentState.reverbShelfPrevInput1;
				let reverbShelfPrevInput2 = +instrumentState.reverbShelfPrevInput2;
				let reverbShelfPrevInput3 = +instrumentState.reverbShelfPrevInput3;`
            }

            effectsSource += `
				
				const stopIndex = bufferIndex + runLength;
            for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
                    `
            if (usesGranular) {
                effectsSource += `
                let sample = tempMonoInstrumentSampleBuffer[sampleIndex];
                let granularOutput = 0;
                for (let grainIndex = 0; grainIndex < granularGrainCount; grainIndex++) {
                    const grain = granularGrains[grainIndex];
                    if(computeGrains) {
                        if(grain.delay > 0) {
                            grain.delay--;
                        } else {
                            const grainDelayLinePosition = grain.delayLinePosition;
                            const grainDelayLinePositionInt = grainDelayLinePosition | 0;
                            // const grainDelayLinePositionT = grainDelayLinePosition - grainDelayLinePositionInt;
                            let grainAgeInSamples = grain.ageInSamples;
                            const grainMaxAgeInSamples = grain.maxAgeInSamples;
                            // const grainSample0 = granularDelayLine[((granularDelayLineIndex + (granularDelayLineLength - grainDelayLinePositionInt))    ) & granularDelayLineMask];
                            // const grainSample1 = granularDelayLine[((granularDelayLineIndex + (granularDelayLineLength - grainDelayLinePositionInt)) + 1) & granularDelayLineMask];
                            // let grainSample = grainSample0 + (grainSample1 - grainSample0) * grainDelayLinePositionT; // Linear interpolation (@TODO: sounds quite bad?)
                            let grainSample = granularDelayLine[((granularDelayLineIndex + (granularDelayLineLength - grainDelayLinePositionInt))    ) & granularDelayLineMask]; // No interpolation
                            `
                if (Config.granularEnvelopeType == GranularEnvelopeType.parabolic) {
                    effectsSource += `
                                const grainEnvelope = grain.parabolicEnvelopeAmplitude;
                                `
                } else if (Config.granularEnvelopeType == GranularEnvelopeType.raisedCosineBell) {
                    effectsSource += `
                                const grainEnvelope = grain.rcbEnvelopeAmplitude;
                                `
                }
                effectsSource += `
                            grainSample *= grainEnvelope;
                            granularOutput += grainSample;
                            if (grainAgeInSamples > grainMaxAgeInSamples) {
                                if (granularGrainCount > 0) {
                                    // Faster equivalent of .pop, ignoring the order in the array.
                                    const lastGrainIndex = granularGrainCount - 1;
                                    const lastGrain = granularGrains[lastGrainIndex];
                                    granularGrains[grainIndex] = lastGrain;
                                    granularGrains[lastGrainIndex] = grain;
                                    granularGrainCount--;
                                    grainIndex--;
                                    // ^ Dangerous, since this could end up causing an infinite loop,
                                    // but should be okay in this case.
                                }
                            } else {
                                grainAgeInSamples++;
                            `
                if (Config.granularEnvelopeType == GranularEnvelopeType.parabolic) {
                    // grain.updateParabolicEnvelope();
                    // Inlined:
                    effectsSource += `
                                    grain.parabolicEnvelopeAmplitude += grain.parabolicEnvelopeSlope;
                                    grain.parabolicEnvelopeSlope += grain.parabolicEnvelopeCurve;
                                    `
                } else if (Config.granularEnvelopeType == GranularEnvelopeType.raisedCosineBell) {
                    effectsSource += `
                                    grain.updateRCBEnvelope();
                                    `
                }
                effectsSource += `
                                grain.ageInSamples = grainAgeInSamples;
                                // if(usesRandomGrainLocation) {
                                //     grain.delayLine -= grainPitchShift;
                                // }
                            }
                        }
                    }
                }
                granularWet += granularMixDelta;
                granularDry -= granularMixDelta;
                granularOutput *= Config.granularOutputLoudnessCompensation;
                granularDelayLine[granularDelayLineIndex] = sample;
                granularDelayLineIndex = (granularDelayLineIndex + 1) & granularDelayLineMask;
                sample = sample * granularDry + granularOutput * granularWet;
                tempMonoInstrumentSampleBuffer[sampleIndex] = 0.0;
                `
            } else {
                effectsSource += `let sample = tempMonoInstrumentSampleBuffer[sampleIndex];
                tempMonoInstrumentSampleBuffer[sampleIndex] = 0.0;`
            }


            if (usesDistortion) {
                effectsSource += `
					
					const distortionReverse = 1.0 - distortion;
					const distortionNextInput = sample * distortionDrive;
					sample = distortionNextOutput;
					distortionNextOutput = distortionNextInput / (distortionReverse * Math.abs(distortionNextInput) + distortion);
					distortionFractionalInput1 = distortionFractionalDelayG1 * distortionNextInput + distortionPrevInput - distortionFractionalDelayG1 * distortionFractionalInput1;
					distortionFractionalInput2 = distortionFractionalDelayG2 * distortionNextInput + distortionPrevInput - distortionFractionalDelayG2 * distortionFractionalInput2;
					distortionFractionalInput3 = distortionFractionalDelayG3 * distortionNextInput + distortionPrevInput - distortionFractionalDelayG3 * distortionFractionalInput3;
					const distortionOutput1 = distortionFractionalInput1 / (distortionReverse * Math.abs(distortionFractionalInput1) + distortion);
					const distortionOutput2 = distortionFractionalInput2 / (distortionReverse * Math.abs(distortionFractionalInput2) + distortion);
					const distortionOutput3 = distortionFractionalInput3 / (distortionReverse * Math.abs(distortionFractionalInput3) + distortion);
					distortionNextOutput += distortionOutput1 * distortionNextOutputWeight1 + distortionOutput2 * distortionNextOutputWeight2 + distortionOutput3 * distortionNextOutputWeight3;
					sample += distortionOutput1 * distortionPrevOutputWeight1 + distortionOutput2 * distortionPrevOutputWeight2 + distortionOutput3 * distortionPrevOutputWeight3;
					sample *= distortionOversampleCompensation;
					distortionPrevInput = distortionNextInput;
					distortion += distortionDelta;
					distortionDrive += distortionDriveDelta;`
            }

            if (usesBitcrusher) {
                effectsSource += `
					
					bitcrusherPhase += bitcrusherPhaseDelta;
					if (bitcrusherPhase < 1.0) {
						bitcrusherPrevInput = sample;
						sample = bitcrusherCurrentOutput;
					} else {
						bitcrusherPhase = bitcrusherPhase % 1.0;
						const ratio = bitcrusherPhase / bitcrusherPhaseDelta;
						
						const lerpedInput = sample + (bitcrusherPrevInput - sample) * ratio;
						bitcrusherPrevInput = sample;
						
						const bitcrusherWrapLevel = bitcrusherFoldLevel * 4.0;
						const wrappedSample = (((lerpedInput + bitcrusherFoldLevel) % bitcrusherWrapLevel) + bitcrusherWrapLevel) % bitcrusherWrapLevel;
						const foldedSample = bitcrusherFoldLevel - Math.abs(bitcrusherFoldLevel * 2.0 - wrappedSample);
						const scaledSample = foldedSample / bitcrusherScale;
						const oldValue = bitcrusherCurrentOutput;
						const newValue = (((scaledSample > 0 ? scaledSample + 1 : scaledSample)|0)-.5) * bitcrusherScale;
						
						sample = oldValue + (newValue - oldValue) * ratio;
						bitcrusherCurrentOutput = newValue;
					}
					bitcrusherPhaseDelta *= bitcrusherPhaseDeltaScale;
					bitcrusherScale *= bitcrusherScaleScale;
					bitcrusherFoldLevel *= bitcrusherFoldLevelScale;`
            }

            if (usesRingModulation) {
                effectsSource += ` 
                
                const ringModOutput = sample * waveform[(ringModPhase*waveformLength)|0];
                const ringModMixF = Math.max(0, ringModMix * ringModMixFade);
                sample = sample * (1 - ringModMixF) + ringModOutput * ringModMixF;

                ringModMix += ringModMixDelta;
                ringModPhase += ringModPhaseDelta;
                ringModPhase = ringModPhase % 1.0;
                ringModPhaseDelta *= ringModPhaseDeltaScale;
                ringModMixFade += ringModMixFadeDelta;
                `
            }

            if (usesEqFilter) {
                effectsSource += `
					
					const inputSample = sample;
					sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
					initialFilterInput2 = initialFilterInput1;
					initialFilterInput1 = inputSample;`
            }

            // The eq filter volume is also used to fade out the instrument state, so always include it.
            effectsSource += `
					
					sample *= eqFilterVolume;
					eqFilterVolume += eqFilterVolumeDelta;`

            if (usesPanning) {
                effectsSource += `
					
					panningDelayLine[panningDelayPos] = sample;
					const panningRatioL  = panningOffsetL % 1;
					const panningRatioR  = panningOffsetR % 1;
					const panningTapLA   = panningDelayLine[(panningOffsetL) & panningMask];
					const panningTapLB   = panningDelayLine[(panningOffsetL + 1) & panningMask];
					const panningTapRA   = panningDelayLine[(panningOffsetR) & panningMask];
					const panningTapRB   = panningDelayLine[(panningOffsetR + 1) & panningMask];
					const panningTapL    = panningTapLA + (panningTapLB - panningTapLA) * panningRatioL;
					const panningTapR    = panningTapRA + (panningTapRB - panningTapRA) * panningRatioR;
					let sampleL = panningTapL * panningVolumeL;
					let sampleR = panningTapR * panningVolumeR;
					panningDelayPos = (panningDelayPos + 1) & panningMask;
					panningVolumeL += panningVolumeDeltaL;
					panningVolumeR += panningVolumeDeltaR;
					panningOffsetL += panningOffsetDeltaL;
					panningOffsetR += panningOffsetDeltaR;`
            } else {
                effectsSource += `
					
					let sampleL = sample;
					let sampleR = sample;`
            }

            if (usesChorus) {
                effectsSource += `
					
					const chorusTap0Ratio = chorusTap0Index % 1;
					const chorusTap1Ratio = chorusTap1Index % 1;
					const chorusTap2Ratio = chorusTap2Index % 1;
					const chorusTap3Ratio = chorusTap3Index % 1;
					const chorusTap4Ratio = chorusTap4Index % 1;
					const chorusTap5Ratio = chorusTap5Index % 1;
					const chorusTap0A = chorusDelayLineL[(chorusTap0Index) & chorusMask];
					const chorusTap0B = chorusDelayLineL[(chorusTap0Index + 1) & chorusMask];
					const chorusTap1A = chorusDelayLineL[(chorusTap1Index) & chorusMask];
					const chorusTap1B = chorusDelayLineL[(chorusTap1Index + 1) & chorusMask];
					const chorusTap2A = chorusDelayLineL[(chorusTap2Index) & chorusMask];
					const chorusTap2B = chorusDelayLineL[(chorusTap2Index + 1) & chorusMask];
					const chorusTap3A = chorusDelayLineR[(chorusTap3Index) & chorusMask];
					const chorusTap3B = chorusDelayLineR[(chorusTap3Index + 1) & chorusMask];
					const chorusTap4A = chorusDelayLineR[(chorusTap4Index) & chorusMask];
					const chorusTap4B = chorusDelayLineR[(chorusTap4Index + 1) & chorusMask];
					const chorusTap5A = chorusDelayLineR[(chorusTap5Index) & chorusMask];
					const chorusTap5B = chorusDelayLineR[(chorusTap5Index + 1) & chorusMask];
					const chorusTap0 = chorusTap0A + (chorusTap0B - chorusTap0A) * chorusTap0Ratio;
					const chorusTap1 = chorusTap1A + (chorusTap1B - chorusTap1A) * chorusTap1Ratio;
					const chorusTap2 = chorusTap2A + (chorusTap2B - chorusTap2A) * chorusTap2Ratio;
					const chorusTap3 = chorusTap3A + (chorusTap3B - chorusTap3A) * chorusTap3Ratio;
					const chorusTap4 = chorusTap4A + (chorusTap4B - chorusTap4A) * chorusTap4Ratio;
					const chorusTap5 = chorusTap5A + (chorusTap5B - chorusTap5A) * chorusTap5Ratio;
					chorusDelayLineL[chorusDelayPos] = sampleL * delayInputMult;
					chorusDelayLineR[chorusDelayPos] = sampleR * delayInputMult;
					sampleL = chorusCombinedMult * (sampleL + chorusVoiceMult * (chorusTap1 - chorusTap0 - chorusTap2));
					sampleR = chorusCombinedMult * (sampleR + chorusVoiceMult * (chorusTap4 - chorusTap3 - chorusTap5));
					chorusDelayPos = (chorusDelayPos + 1) & chorusMask;
					chorusTap0Index += chorusTap0Delta;
					chorusTap1Index += chorusTap1Delta;
					chorusTap2Index += chorusTap2Delta;
					chorusTap3Index += chorusTap3Delta;
					chorusTap4Index += chorusTap4Delta;
					chorusTap5Index += chorusTap5Delta;
					chorusVoiceMult += chorusVoiceMultDelta;
					chorusCombinedMult += chorusCombinedMultDelta;`
            }

            if (usesEcho) {
                effectsSource += `
					
					const echoTapStartIndex = (echoDelayPos + echoDelayOffsetStart) & echoMask;
					const echoTapEndIndex   = (echoDelayPos + echoDelayOffsetEnd  ) & echoMask;
					const echoTapStartL = echoDelayLineL[echoTapStartIndex];
					const echoTapEndL   = echoDelayLineL[echoTapEndIndex];
					const echoTapStartR = echoDelayLineR[echoTapStartIndex];
					const echoTapEndR   = echoDelayLineR[echoTapEndIndex];
					const echoTapL = (echoTapStartL + (echoTapEndL - echoTapStartL) * echoDelayOffsetRatio) * echoMult;
					const echoTapR = (echoTapStartR + (echoTapEndR - echoTapStartR) * echoDelayOffsetRatio) * echoMult;
					
					echoShelfSampleL = echoShelfB0 * echoTapL + echoShelfB1 * echoShelfPrevInputL - echoShelfA1 * echoShelfSampleL;
					echoShelfSampleR = echoShelfB0 * echoTapR + echoShelfB1 * echoShelfPrevInputR - echoShelfA1 * echoShelfSampleR;
					echoShelfPrevInputL = echoTapL;
					echoShelfPrevInputR = echoTapR;
					sampleL += echoShelfSampleL;
					sampleR += echoShelfSampleR;
					
					echoDelayLineL[echoDelayPos] = sampleL * delayInputMult;
					echoDelayLineR[echoDelayPos] = sampleR * delayInputMult;
					echoDelayPos = (echoDelayPos + 1) & echoMask;
					echoDelayOffsetRatio += echoDelayOffsetRatioDelta;
					echoMult += echoMultDelta;
                    `
            }

            if (usesReverb) {
                effectsSource += `
					
					// Reverb, implemented using a feedback delay network with a Hadamard matrix and lowpass filters.
					// good ratios:    0.555235 + 0.618033 + 0.818 +   1.0 = 2.991268
					// Delay lengths:  3041     + 3385     + 4481  +  5477 = 16384 = 2^14
					// Buffer offsets: 3041    -> 6426   -> 10907 -> 16384
					const reverbDelayPos1 = (reverbDelayPos +  3041) & reverbMask;
					const reverbDelayPos2 = (reverbDelayPos +  6426) & reverbMask;
					const reverbDelayPos3 = (reverbDelayPos + 10907) & reverbMask;
					const reverbSample0 = (reverbDelayLine[reverbDelayPos]);
					const reverbSample1 = reverbDelayLine[reverbDelayPos1];
					const reverbSample2 = reverbDelayLine[reverbDelayPos2];
					const reverbSample3 = reverbDelayLine[reverbDelayPos3];
					const reverbTemp0 = -(reverbSample0 + sampleL) + reverbSample1;
					const reverbTemp1 = -(reverbSample0 + sampleR) - reverbSample1;
					const reverbTemp2 = -reverbSample2 + reverbSample3;
					const reverbTemp3 = -reverbSample2 - reverbSample3;
					const reverbShelfInput0 = (reverbTemp0 + reverbTemp2) * reverb;
					const reverbShelfInput1 = (reverbTemp1 + reverbTemp3) * reverb;
					const reverbShelfInput2 = (reverbTemp0 - reverbTemp2) * reverb;
					const reverbShelfInput3 = (reverbTemp1 - reverbTemp3) * reverb;
					reverbShelfSample0 = reverbShelfB0 * reverbShelfInput0 + reverbShelfB1 * reverbShelfPrevInput0 - reverbShelfA1 * reverbShelfSample0;
					reverbShelfSample1 = reverbShelfB0 * reverbShelfInput1 + reverbShelfB1 * reverbShelfPrevInput1 - reverbShelfA1 * reverbShelfSample1;
					reverbShelfSample2 = reverbShelfB0 * reverbShelfInput2 + reverbShelfB1 * reverbShelfPrevInput2 - reverbShelfA1 * reverbShelfSample2;
					reverbShelfSample3 = reverbShelfB0 * reverbShelfInput3 + reverbShelfB1 * reverbShelfPrevInput3 - reverbShelfA1 * reverbShelfSample3;
					reverbShelfPrevInput0 = reverbShelfInput0;
					reverbShelfPrevInput1 = reverbShelfInput1;
					reverbShelfPrevInput2 = reverbShelfInput2;
					reverbShelfPrevInput3 = reverbShelfInput3;
					reverbDelayLine[reverbDelayPos1] = reverbShelfSample0 * delayInputMult;
					reverbDelayLine[reverbDelayPos2] = reverbShelfSample1 * delayInputMult;
					reverbDelayLine[reverbDelayPos3] = reverbShelfSample2 * delayInputMult;
					reverbDelayLine[reverbDelayPos ] = reverbShelfSample3 * delayInputMult;
					reverbDelayPos = (reverbDelayPos + 1) & reverbMask;
					sampleL += reverbSample1 + reverbSample2 + reverbSample3;
					sampleR += reverbSample0 + reverbSample2 - reverbSample3;
					reverb += reverbDelta;`
            }

            effectsSource += `
					
					outputDataL[sampleIndex] += sampleL * mixVolume;
					outputDataR[sampleIndex] += sampleR * mixVolume;
					mixVolume += mixVolumeDelta;`

            if (usesDelays) {
                effectsSource += `
					
					delayInputMult += delayInputMultDelta;`
            }

            effectsSource += `
				}
				
				instrumentState.mixVolume = mixVolume;
				instrumentState.eqFilterVolume = eqFilterVolume;
				
				// Avoid persistent denormal or NaN values in the delay buffers and filter history.
				const epsilon = (1.0e-24);`

            if (usesDelays) {
                effectsSource += `
				
				instrumentState.delayInputMult = delayInputMult;`
            }

            if (usesGranular) {
                effectsSource += `
                    instrumentState.granularMix = granularWet;
                    instrumentState.granularGrainsLength = granularGrainCount;
                    instrumentState.granularDelayLineIndex = granularDelayLineIndex;
                `
            }

            if (usesDistortion) {
                effectsSource += `
				
				instrumentState.distortion = distortion;
				instrumentState.distortionDrive = distortionDrive;
				
				if (!Number.isFinite(distortionFractionalInput1) || Math.abs(distortionFractionalInput1) < epsilon) distortionFractionalInput1 = 0.0;
				if (!Number.isFinite(distortionFractionalInput2) || Math.abs(distortionFractionalInput2) < epsilon) distortionFractionalInput2 = 0.0;
				if (!Number.isFinite(distortionFractionalInput3) || Math.abs(distortionFractionalInput3) < epsilon) distortionFractionalInput3 = 0.0;
				if (!Number.isFinite(distortionPrevInput) || Math.abs(distortionPrevInput) < epsilon) distortionPrevInput = 0.0;
				if (!Number.isFinite(distortionNextOutput) || Math.abs(distortionNextOutput) < epsilon) distortionNextOutput = 0.0;
				
				instrumentState.distortionFractionalInput1 = distortionFractionalInput1;
				instrumentState.distortionFractionalInput2 = distortionFractionalInput2;
				instrumentState.distortionFractionalInput3 = distortionFractionalInput3;
				instrumentState.distortionPrevInput = distortionPrevInput;
				instrumentState.distortionNextOutput = distortionNextOutput;`
            }

            if (usesBitcrusher) {
                effectsSource += `
					
				if (Math.abs(bitcrusherPrevInput) < epsilon) bitcrusherPrevInput = 0.0;
				if (Math.abs(bitcrusherCurrentOutput) < epsilon) bitcrusherCurrentOutput = 0.0;
				instrumentState.bitcrusherPrevInput = bitcrusherPrevInput;
				instrumentState.bitcrusherCurrentOutput = bitcrusherCurrentOutput;
				instrumentState.bitcrusherPhase = bitcrusherPhase;
				instrumentState.bitcrusherPhaseDelta = bitcrusherPhaseDelta;
				instrumentState.bitcrusherScale = bitcrusherScale;
				instrumentState.bitcrusherFoldLevel = bitcrusherFoldLevel;`

            }

            if (usesRingModulation) {
                effectsSource += ` 
                instrumentState.ringModMix = ringModMix;
                instrumentState.ringModMixDelta = ringModMixDelta;
                instrumentState.ringModPhase = ringModPhase;
                instrumentState.ringModPhaseDelta = ringModPhaseDelta;
                instrumentState.ringModPhaseDeltaScale = ringModPhaseDeltaScale;
                instrumentState.ringModWaveformIndex = ringModWaveformIndex;
                instrumentState.ringModPulseWidth = ringModPulseWidth;
                instrumentState.ringModMixFade = ringModMixFade;
                 `
            }

            if (usesEqFilter) {
                effectsSource += `
					
				synth.sanitizeFilters(filters);
				// The filter input here is downstream from another filter so we
				// better make sure it's safe too.
				if (!(initialFilterInput1 < 100) || !(initialFilterInput2 < 100)) {
					initialFilterInput1 = 0.0;
					initialFilterInput2 = 0.0;
				}
				if (Math.abs(initialFilterInput1) < epsilon) initialFilterInput1 = 0.0;
				if (Math.abs(initialFilterInput2) < epsilon) initialFilterInput2 = 0.0;
				instrumentState.initialEqFilterInput1 = initialFilterInput1;
				instrumentState.initialEqFilterInput2 = initialFilterInput2;`
            }

            if (usesPanning) {
                effectsSource += `
				
				Synth.sanitizeDelayLine(panningDelayLine, panningDelayPos, panningMask);
				instrumentState.panningDelayPos = panningDelayPos;
				instrumentState.panningVolumeL = panningVolumeL;
				instrumentState.panningVolumeR = panningVolumeR;
				instrumentState.panningOffsetL = panningOffsetL;
				instrumentState.panningOffsetR = panningOffsetR;`
            }

            if (usesChorus) {
                effectsSource += `
				
				Synth.sanitizeDelayLine(chorusDelayLineL, chorusDelayPos, chorusMask);
				Synth.sanitizeDelayLine(chorusDelayLineR, chorusDelayPos, chorusMask);
				instrumentState.chorusPhase = chorusPhase;
				instrumentState.chorusDelayPos = chorusDelayPos;
				instrumentState.chorusVoiceMult = chorusVoiceMult;
				instrumentState.chorusCombinedMult = chorusCombinedMult;`
            }

            if (usesEcho) {
                effectsSource += `
				
				Synth.sanitizeDelayLine(echoDelayLineL, echoDelayPos, echoMask);
				Synth.sanitizeDelayLine(echoDelayLineR, echoDelayPos, echoMask);
				instrumentState.echoDelayPos = echoDelayPos;
				instrumentState.echoMult = echoMult;
				instrumentState.echoDelayOffsetRatio = echoDelayOffsetRatio;
				
				if (!Number.isFinite(echoShelfSampleL) || Math.abs(echoShelfSampleL) < epsilon) echoShelfSampleL = 0.0;
				if (!Number.isFinite(echoShelfSampleR) || Math.abs(echoShelfSampleR) < epsilon) echoShelfSampleR = 0.0;
				if (!Number.isFinite(echoShelfPrevInputL) || Math.abs(echoShelfPrevInputL) < epsilon) echoShelfPrevInputL = 0.0;
				if (!Number.isFinite(echoShelfPrevInputR) || Math.abs(echoShelfPrevInputR) < epsilon) echoShelfPrevInputR = 0.0;
				instrumentState.echoShelfSampleL = echoShelfSampleL;
				instrumentState.echoShelfSampleR = echoShelfSampleR;
				instrumentState.echoShelfPrevInputL = echoShelfPrevInputL;
				instrumentState.echoShelfPrevInputR = echoShelfPrevInputR;`
            }

            if (usesReverb) {
                effectsSource += `
				
				Synth.sanitizeDelayLine(reverbDelayLine, reverbDelayPos        , reverbMask);
				Synth.sanitizeDelayLine(reverbDelayLine, reverbDelayPos +  3041, reverbMask);
				Synth.sanitizeDelayLine(reverbDelayLine, reverbDelayPos +  6426, reverbMask);
				Synth.sanitizeDelayLine(reverbDelayLine, reverbDelayPos + 10907, reverbMask);
				instrumentState.reverbDelayPos = reverbDelayPos;
				instrumentState.reverbMult = reverb;
				
				if (!Number.isFinite(reverbShelfSample0) || Math.abs(reverbShelfSample0) < epsilon) reverbShelfSample0 = 0.0;
				if (!Number.isFinite(reverbShelfSample1) || Math.abs(reverbShelfSample1) < epsilon) reverbShelfSample1 = 0.0;
				if (!Number.isFinite(reverbShelfSample2) || Math.abs(reverbShelfSample2) < epsilon) reverbShelfSample2 = 0.0;
				if (!Number.isFinite(reverbShelfSample3) || Math.abs(reverbShelfSample3) < epsilon) reverbShelfSample3 = 0.0;
				if (!Number.isFinite(reverbShelfPrevInput0) || Math.abs(reverbShelfPrevInput0) < epsilon) reverbShelfPrevInput0 = 0.0;
				if (!Number.isFinite(reverbShelfPrevInput1) || Math.abs(reverbShelfPrevInput1) < epsilon) reverbShelfPrevInput1 = 0.0;
				if (!Number.isFinite(reverbShelfPrevInput2) || Math.abs(reverbShelfPrevInput2) < epsilon) reverbShelfPrevInput2 = 0.0;
				if (!Number.isFinite(reverbShelfPrevInput3) || Math.abs(reverbShelfPrevInput3) < epsilon) reverbShelfPrevInput3 = 0.0;
				instrumentState.reverbShelfSample0 = reverbShelfSample0;
				instrumentState.reverbShelfSample1 = reverbShelfSample1;
				instrumentState.reverbShelfSample2 = reverbShelfSample2;
				instrumentState.reverbShelfSample3 = reverbShelfSample3;
				instrumentState.reverbShelfPrevInput0 = reverbShelfPrevInput0;
				instrumentState.reverbShelfPrevInput1 = reverbShelfPrevInput1;
				instrumentState.reverbShelfPrevInput2 = reverbShelfPrevInput2;
				instrumentState.reverbShelfPrevInput3 = reverbShelfPrevInput3;`
            }

            effectsSource += "}";
            effectsFunction = new Function("Config", "Synth", effectsSource)(Config, Synth);
            Synth.effectsFunctionCache[signature] = effectsFunction;
        }

        effectsFunction(synth, outputDataL, outputDataR, bufferIndex, runLength, instrumentState);
    }

    private static pulseWidthSynth(synth: Synth, bufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let pulseFunction: Function = Synth.pulseFunctionCache[instrumentState.unisonVoices];
        if (pulseFunction == undefined) {
            let pulseSource: string = "return (synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState) => {";


            pulseSource += `
        const data = synth.tempMonoInstrumentSampleBuffer;

        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;

        let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                pulseSource += `let phaseDelta# = tone.phaseDeltas[#];
            let phaseDeltaScale# = +tone.phaseDeltaScales[#];

            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[# - 1];
            `.replaceAll("#", i + "");
            }

            for (let i: number = 0; i < voiceCount; i++) {
                pulseSource += `phase# = (tone.phases[#] % 1);
            `.replaceAll("#", i + "");

            }

            pulseSource += `let pulseWidth = tone.pulseWidth;
        const pulseWidthDelta = tone.pulseWidthDelta;

        const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;

        const stopIndex = bufferIndex + roundedSamplesPerTick;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
        `

            for (let i: number = 0; i < voiceCount; i++) {
                pulseSource += `const sawPhaseA# = phase# % 1;
                const sawPhaseB# = (phase# + pulseWidth) % 1;
                let pulseWave# = sawPhaseB# - sawPhaseA#;
                if (!instrumentState.aliases) {
                    if (sawPhaseA# < phaseDelta#) {
                        var t = sawPhaseA# / phaseDelta#;
                        pulseWave# += (t + t - t * t - 1) * 0.5;
                    } else if (sawPhaseA# > 1.0 - phaseDelta#) {
                        var t = (sawPhaseA# - 1.0) / phaseDelta#;
                        pulseWave# += (t + t + t * t + 1) * 0.5;
                    }
                    if (sawPhaseB# < phaseDelta#) {
                        var t = sawPhaseB# / phaseDelta#;
                        pulseWave# -= (t + t - t * t - 1) * 0.5;
                    } else if (sawPhaseB# > 1.0 - phaseDelta#) {
                        var t = (sawPhaseB# - 1.0) / phaseDelta#;
                        pulseWave# -= (t + t + t * t + 1) * 0.5;
                    }
                }

                `.replaceAll("#", i + "");
            }
            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("pulseWave" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            pulseSource += "let inputSample = " + sampleList.join(" + ") + ";";

            pulseSource += `const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;`;

            for (let i = 0; i < voiceCount; i++) {
                pulseSource += `phase# += phaseDelta#;
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            pulseSource += `pulseWidth += pulseWidthDelta;

            const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }`


            for (let i: number = 0; i < voiceCount; i++) {
                pulseSource += `tone.phases[#] = phase#;
            tone.phaseDeltas[#] = phaseDelta#;
                `.replaceAll("#", i + "");
            }

            pulseSource += `tone.expression = expression;
        tone.pulseWidth = pulseWidth;

        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`
            pulseFunction = new Function("Config", "Synth", pulseSource)(Config, Synth);
            Synth.pulseFunctionCache[instrumentState.unisonVoices] = pulseFunction;
        }

        pulseFunction(synth, bufferIndex, roundedSamplesPerTick, tone, instrumentState);
    }

    private static supersawSynth(synth: Synth, bufferIndex: number, runLength: number, tone: Tone, instrumentState: InstrumentState): void {
        const data: Float32Array = synth.tempMonoInstrumentSampleBuffer!;
        const voiceCount: number = Config.supersawVoiceCount | 0;

        let phaseDelta: number = tone.phaseDeltas[0];
        const phaseDeltaScale: number = +tone.phaseDeltaScales[0];
        let expression: number = +tone.expression;
        const expressionDelta: number = +tone.expressionDelta;
        let phases: number[] = tone.phases;

        let dynamism: number = +tone.supersawDynamism;
        const dynamismDelta: number = +tone.supersawDynamismDelta;
        const unisonDetunes: number[] = tone.supersawUnisonDetunes;
        let shape: number = +tone.supersawShape;
        const shapeDelta: number = +tone.supersawShapeDelta;
        let delayLength: number = +tone.supersawDelayLength;
        const delayLengthDelta: number = +tone.supersawDelayLengthDelta;
        const delayLine: Float32Array = tone.supersawDelayLine!;
        const delayBufferMask: number = (delayLine.length - 1) >> 0;
        let delayIndex: number = tone.supersawDelayIndex | 0;
        delayIndex = (delayIndex & delayBufferMask) + delayLine.length;

        const filters: DynamicBiquadFilter[] = tone.noteFilters;
        const filterCount: number = tone.noteFilterCount | 0;
        let initialFilterInput1: number = +tone.initialNoteFilterInput1;
        let initialFilterInput2: number = +tone.initialNoteFilterInput2;
        const applyFilters: Function = Synth.applyFilters;

        const stopIndex: number = bufferIndex + runLength;
        for (let sampleIndex: number = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
            // The phase initially starts at a zero crossing so apply
            // the delta before first sample to get a nonzero value.
            let phase: number = (phases[0] + phaseDelta) % 1.0;
            let supersawSample: number = phase - 0.5 * (1.0 + (voiceCount - 1.0) * dynamism);

            // This is a PolyBLEP, which smooths out discontinuities at any frequency to reduce aliasing. 
            if (!instrumentState.aliases) {
                if (phase < phaseDelta) {
                    var t: number = phase / phaseDelta;
                    supersawSample -= (t + t - t * t - 1) * 0.5;
                } else if (phase > 1.0 - phaseDelta) {
                    var t: number = (phase - 1.0) / phaseDelta;
                    supersawSample -= (t + t + t * t + 1) * 0.5;
                }
            }

            phases[0] = phase;

            for (let i: number = 1; i < voiceCount; i++) {
                const detunedPhaseDelta: number = phaseDelta * unisonDetunes[i];
                // The phase initially starts at a zero crossing so apply
                // the delta before first sample to get a nonzero value.
                let phase: number = (phases[i] + detunedPhaseDelta) % 1.0;
                supersawSample += phase * dynamism;

                // This is a PolyBLEP, which smooths out discontinuities at any frequency to reduce aliasing. 
                if (!instrumentState.aliases) {
                    if (phase < detunedPhaseDelta) {
                        const t: number = phase / detunedPhaseDelta;
                        supersawSample -= (t + t - t * t - 1) * 0.5 * dynamism;
                    } else if (phase > 1.0 - detunedPhaseDelta) {
                        const t: number = (phase - 1.0) / detunedPhaseDelta;
                        supersawSample -= (t + t + t * t + 1) * 0.5 * dynamism;
                    }
                }

                phases[i] = phase;
            }

            delayLine[delayIndex & delayBufferMask] = supersawSample;
            const delaySampleTime: number = delayIndex - delayLength;
            const lowerIndex: number = delaySampleTime | 0;
            const upperIndex: number = lowerIndex + 1;
            const delayRatio: number = delaySampleTime - lowerIndex;
            const prevDelaySample: number = delayLine[lowerIndex & delayBufferMask];
            const nextDelaySample: number = delayLine[upperIndex & delayBufferMask];
            const delaySample: number = prevDelaySample + (nextDelaySample - prevDelaySample) * delayRatio;
            delayIndex++;

            const inputSample: number = supersawSample - delaySample * shape;
            const sample: number = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;

            phaseDelta *= phaseDeltaScale;
            dynamism += dynamismDelta;
            shape += shapeDelta;
            delayLength += delayLengthDelta;

            const output: number = sample * expression;
            expression += expressionDelta;

            data[sampleIndex] += output;
        }

        tone.phaseDeltas[0] = phaseDelta;
        tone.expression = expression;
        tone.supersawDynamism = dynamism;
        tone.supersawShape = shape;
        tone.supersawDelayLength = delayLength;
        tone.supersawDelayIndex = delayIndex;

        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }

    private static fmSourceTemplate: string[] = (`
		const data = synth.tempMonoInstrumentSampleBuffer;
		const sineWave = Config.sineWave;
			
		// I'm adding 1000 to the phase to ensure that it's never negative even when modulated by other waves because negative numbers don't work with the modulus operator very well.
		let operator#Phase       = +((tone.phases[#] % 1) + 1000) * ` + Config.sineWaveLength + `;
		let operator#PhaseDelta  = +tone.phaseDeltas[#] * ` + Config.sineWaveLength + `;
		let operator#PhaseDeltaScale = +tone.phaseDeltaScales[#];
		let operator#OutputMult  = +tone.operatorExpressions[#];
		const operator#OutputDelta = +tone.operatorExpressionDeltas[#];
		let operator#Output      = +tone.feedbackOutputs[#];
        const operator#Wave      = tone.operatorWaves[#].samples;
		let feedbackMult         = +tone.feedbackMult;
		const feedbackDelta        = +tone.feedbackDelta;
        let expression = +tone.expression;
		const expressionDelta = +tone.expressionDelta;
		
		const filters = tone.noteFilters;
		const filterCount = tone.noteFilterCount|0;
		let initialFilterInput1 = +tone.initialNoteFilterInput1;
		let initialFilterInput2 = +tone.initialNoteFilterInput2;
		const applyFilters = Synth.applyFilters;
		
		const stopIndex = bufferIndex + roundedSamplesPerTick;
		for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
				// INSERT OPERATOR COMPUTATION HERE
				const fmOutput = (/*operator#Scaled*/); // CARRIER OUTPUTS
				
			const inputSample = fmOutput;
			const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
			initialFilterInput2 = initialFilterInput1;
			initialFilterInput1 = inputSample;
				
				feedbackMult += feedbackDelta;
				operator#OutputMult += operator#OutputDelta;
				operator#Phase += operator#PhaseDelta;
			operator#PhaseDelta *= operator#PhaseDeltaScale;
			
			const output = sample * expression;
			expression += expressionDelta;

			data[sampleIndex] += output;
			}
			
			tone.phases[#] = operator#Phase / ` + Config.sineWaveLength + `;
			tone.phaseDeltas[#] = operator#PhaseDelta / ` + Config.sineWaveLength + `;
			tone.operatorExpressions[#] = operator#OutputMult;
		    tone.feedbackOutputs[#] = operator#Output;
		    tone.feedbackMult = feedbackMult;
		    tone.expression = expression;
			
		synth.sanitizeFilters(filters);
		tone.initialNoteFilterInput1 = initialFilterInput1;
		tone.initialNoteFilterInput2 = initialFilterInput2;
		`).split("\n");

    private static operatorSourceTemplate: string[] = (`
				const operator#PhaseMix = operator#Phase/* + operator@Scaled*/;
				const operator#PhaseInt = operator#PhaseMix|0;
				const operator#Index    = operator#PhaseInt & ` + Config.sineWaveMask + `;
                const operator#Sample   = operator#Wave[operator#Index];
                operator#Output         = operator#Sample + (operator#Wave[operator#Index + 1] - operator#Sample) * (operator#PhaseMix - operator#PhaseInt);
				const operator#Scaled   = operator#OutputMult * operator#Output;
		`).split("\n");

    private static noiseSynth(synth: Synth, bufferIndex: number, runLength: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let noiseFunction: Function = Synth.noiseFunctionCache[instrumentState.unisonVoices];
        if (noiseFunction == undefined) {
            let noiseSource: string = "return (synth, bufferIndex, runLength, tone, instrumentState) => {";

            noiseSource += `
        const data = synth.tempMonoInstrumentSampleBuffer;
        const wave = instrumentState.wave;

        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `
            let phaseDelta# = tone.phaseDeltas[#];
            let phaseDeltaScale# = +tone.phaseDeltaScales[#];
            let noiseSample# = +tone.noiseSamples[#];
            // This is for a "legacy" style simplified 1st order lowpass filter with
            // a cutoff frequency that is relative to the tone's fundamental frequency.
            const pitchRelativefilter# = Math.min(1.0, phaseDelta# * instrumentState.noisePitchFilterMult);
            
            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[#-1];
            `.replaceAll("#", i + "");
            }

            noiseSource += `
        let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;

        const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;

        const phaseMask = Config.spectrumNoiseLength - 1;

        `
            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `let phase# = (tone.phases[#] % 1) * Config.chipNoiseLength;
                `.replaceAll("#", i + "");
            }
            noiseSource += "let test = true;"
            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `
            if (tone.phases[#] == 0.0) {
                // Zero phase means the tone was reset, just give noise a random start phase instead.
                phase# = Math.random() * Config.chipNoiseLength;
                if (@ <= # && test && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) {`.replaceAll("#", i + "").replaceAll("@", voiceCount + "").replaceAll("~", tone.phases.length + "");
                for (let j: number = i + 1; j < tone.phases.length; j++) {
                    noiseSource += "phase~ = phase#;".replaceAll("#", i + "").replaceAll("~", j + "");
                }
                noiseSource += `
                    test = false;
                }
            }`
            }

            noiseSource += `
        const stopIndex = bufferIndex + runLength;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
            `

            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `
                let waveSample# = wave[phase# & phaseMask];

                noiseSample# += (waveSample# - noiseSample#) * pitchRelativefilter#;
                `.replaceAll("#", i + "");
            }

            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("noiseSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            noiseSource += "let inputSample = " + sampleList.join(" + ") + ";";

            noiseSource += `const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;`;

            for (let i = 0; i < voiceCount; i++) {
                noiseSource += `phase# += phaseDelta#;
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            noiseSource += `const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }`

            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `tone.phases[#] = phase# / `.replaceAll("#", i + "") + Config.chipNoiseLength + `;
            tone.phaseDeltas[#] = phaseDelta#;
            `.replaceAll("#", i + "");
            }

            noiseSource += "tone.expression = expression;";
            for (let i: number = 0; i < voiceCount; i++) {
                noiseSource += `tone.noiseSamples[#] = noiseSample#;
             `.replaceAll("#", i + "");
            }

            noiseSource += `
        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`;
            noiseFunction = new Function("Config", "Synth", noiseSource)(Config, Synth);;
            Synth.noiseFunctionCache[instrumentState.unisonVoices] = noiseFunction;
        }
        noiseFunction(synth, bufferIndex, runLength, tone, instrumentState);

    }


    private static spectrumSynth(synth: Synth, bufferIndex: number, runLength: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let spectrumFunction: Function = Synth.spectrumFunctionCache[instrumentState.unisonVoices];
        if (spectrumFunction == undefined) {
            let spectrumSource: string = "return (synth, bufferIndex, runLength, tone, instrumentState) => {";


            spectrumSource += `
        const data = synth.tempMonoInstrumentSampleBuffer;
        const wave = instrumentState.wave;
        const samplesInPeriod = (1 << 7);

        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                spectrumSource += `
                if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[#-1];
                let phaseDelta# = tone.phaseDeltas[#] * samplesInPeriod;
                let phaseDeltaScale# = +tone.phaseDeltaScales[#];
                let noiseSample# = +tone.noiseSamples[#];
                // This is for a "legacy" style simplified 1st order lowpass filter with
                // a cutoff frequency that is relative to the tone's fundamental frequency.
                const pitchRelativefilter# = Math.min(1.0, phaseDelta#);
                `.replaceAll("#", i + "");
            }

            spectrumSource += `
        let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;

        const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;

        const phaseMask = Config.spectrumNoiseLength - 1;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                spectrumSource += `let phase# = (tone.phases[#] % 1) * Config.spectrumNoiseLength;
                `.replaceAll("#", i + "");
            }
            spectrumSource += `
            if (tone.phases[0] == 0.0) {
                // Zero phase means the tone was reset, just give noise a random start phase instead.
                phase0 = Synth.findRandomZeroCrossing(wave, Config.spectrumNoiseLength) + phaseDelta0;
            `
            for (let i: number = 1; i < voiceCount; i++) {
                spectrumSource += `
                if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) {
                    phase# = phase0;
                }
            `.replaceAll("#", i + "");
            }
            spectrumSource += `}`;
            for (let i: number = 1; i < voiceCount; i++) {
                spectrumSource += `
                if (tone.phases[#] == 0.0 && !(instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval)) {
                    // Zero phase means the tone was reset, just give noise a random start phase instead.
                phase# = Synth.findRandomZeroCrossing(wave, Config.spectrumNoiseLength) + phaseDelta#;
                }
            `.replaceAll("#", i + "");
            }
            spectrumSource += `
        const stopIndex = bufferIndex + runLength;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {`

            for (let i: number = 0; i < voiceCount; i++) {
                spectrumSource += `
                const phase#Int = phase# | 0;
                const index# = phase#Int & phaseMask;
                let waveSample# = wave[index#]
                const phase#Ratio = phase# - phase#Int;
                waveSample# += (wave[index# + 1] - waveSample#) * phase#Ratio;

                noiseSample# += (waveSample# - noiseSample#) * pitchRelativefilter#;
                `.replaceAll("#", i + "");
            }

            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("noiseSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            spectrumSource += "let inputSample = " + sampleList.join(" + ") + ";";

            spectrumSource += `const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;`;

            for (let i = 0; i < voiceCount; i++) {
                spectrumSource += `phase# += phaseDelta#;
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            spectrumSource += `const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }`

            for (let i: number = 0; i < voiceCount; i++) {
                spectrumSource += `tone.phases[#] = phase# / `.replaceAll("#", i + "") + Config.spectrumNoiseLength + `;
            tone.phaseDeltas[#] = phaseDelta# / samplesInPeriod;
            `.replaceAll("#", i + "");
            }

            spectrumSource += "tone.expression = expression;";
            for (let i: number = 0; i < voiceCount; i++) {
                spectrumSource += `tone.noiseSamples[#] = noiseSample#;
             `.replaceAll("#", i + "");
            }

            spectrumSource += `
        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`;
            spectrumFunction = new Function("Config", "Synth", spectrumSource)(Config, Synth);;
            Synth.spectrumFunctionCache[instrumentState.unisonVoices] = spectrumFunction;
        }
        spectrumFunction(synth, bufferIndex, runLength, tone, instrumentState);
    }

    private static drumsetSynth(synth: Synth, bufferIndex: number, runLength: number, tone: Tone, instrumentState: InstrumentState): void {
        const voiceCount: number = Math.max(2, instrumentState.unisonVoices);
        let drumFunction: Function = Synth.drumFunctionCache[instrumentState.unisonVoices];
        if (drumFunction == undefined) {
            let drumSource: string = "return (synth, bufferIndex, runLength, tone, instrumentState) => {";


            drumSource += `
        const data = synth.tempMonoInstrumentSampleBuffer;
        let wave = instrumentState.getDrumsetWave(tone.drumsetPitch);
        const referenceDelta = InstrumentState.drumsetIndexReferenceDelta(tone.drumsetPitch);
        const unisonSign = tone.specialIntervalExpressionMult * instrumentState.unisonSign;
        `
            for (let i: number = 0; i < voiceCount; i++) {
                drumSource += `let phaseDelta# = tone.phaseDeltas[#] / referenceDelta;
            let phaseDeltaScale# = +tone.phaseDeltaScales[#];
            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) tone.phases[#] = tone.phases[# - 1];
            `.replaceAll("#", i + "");
            }

            drumSource += `let expression = +tone.expression;
        const expressionDelta = +tone.expressionDelta;

        const filters = tone.noteFilters;
        const filterCount = tone.noteFilterCount | 0;
        let initialFilterInput1 = +tone.initialNoteFilterInput1;
        let initialFilterInput2 = +tone.initialNoteFilterInput2;
        const applyFilters = Synth.applyFilters;`

            for (let i: number = 0; i < voiceCount; i++) {
                drumSource += `let phase# = (tone.phases[#] % 1) * Config.spectrumNoiseLength;
            `.replaceAll("#", i + "");
            }
            drumSource += `
        if (tone.phases[0] == 0.0) {
            // Zero phase means the tone was reset, just give noise a random start phase instead.
            phase0 = Synth.findRandomZeroCrossing(wave, Config.spectrumNoiseLength) + phaseDelta0;
        `
            for (let i: number = 1; i < voiceCount; i++) {
                drumSource += `
            if (instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval) {
                phase# = phase0;
            }
        `.replaceAll("#", i + "");
            }
            drumSource += `}`;
            for (let i: number = 1; i < voiceCount; i++) {
                drumSource += `
            if (tone.phases[#] == 0.0 && !(instrumentState.unisonVoices <= # && instrumentState.unisonSpread == 0 && !instrumentState.chord.customInterval)) {
                // Zero phase means the tone was reset, just give noise a random start phase instead.
            phase# = Synth.findRandomZeroCrossing(wave, Config.spectrumNoiseLength) + phaseDelta#;
            }
        `.replaceAll("#", i + "");
            }

            drumSource += `const phaseMask = Config.spectrumNoiseLength - 1;

        const stopIndex = bufferIndex + runLength;
        for (let sampleIndex = bufferIndex; sampleIndex < stopIndex; sampleIndex++) {
        `
            for (let i: number = 0; i < voiceCount; i++) {
                drumSource += `
                const phase#Int = phase# | 0;
                const index# = phase#Int & phaseMask;
                let noiseSample# = wave[index#]
                const phase#Ratio = phase# - phase#Int;
                noiseSample# += (wave[index# + 1] - noiseSample#) * phase#Ratio;
                `.replaceAll("#", i + "");
            }

            const sampleList: string[] = [];
            for (let voice: number = 0; voice < voiceCount; voice++) {
                sampleList.push("noiseSample" + voice + (voice != 0 ? " * unisonSign" : ""));
            }

            drumSource += "let inputSample = " + sampleList.join(" + ") + ";";

            drumSource += `const sample = applyFilters(inputSample, initialFilterInput1, initialFilterInput2, filterCount, filters);
            initialFilterInput2 = initialFilterInput1;
            initialFilterInput1 = inputSample;`;

            for (let i = 0; i < voiceCount; i++) {
                drumSource += `phase# += phaseDelta#;
                phaseDelta# *= phaseDeltaScale#;
                `.replaceAll("#", i + "");
            }

            drumSource += `const output = sample * expression;
            expression += expressionDelta;
            data[sampleIndex] += output;
        }`

            for (let i: number = 0; i < voiceCount; i++) {
                drumSource += `tone.phases[#] = phase# / `.replaceAll("#", i + "") + Config.spectrumNoiseLength + `;
            tone.phaseDeltas[#] = phaseDelta# * referenceDelta;
            `.replaceAll("#", i + "");
            }

            drumSource += `tone.expression = expression;
        synth.sanitizeFilters(filters);
        tone.initialNoteFilterInput1 = initialFilterInput1;
        tone.initialNoteFilterInput2 = initialFilterInput2;
    }`;
            drumFunction = new Function("Config", "Synth", "InstrumentState", drumSource)(Config, Synth, InstrumentState);;
            Synth.drumFunctionCache[instrumentState.unisonVoices] = drumFunction;
        }
        drumFunction(synth, bufferIndex, runLength, tone, instrumentState);
    }

    private static modSynth(synth: Synth, stereoBufferIndex: number, roundedSamplesPerTick: number, tone: Tone, instrument: Instrument): void {
        // Note: present modulator value is tone.expressionStarts[0].

        if (!synth.song) return;
        // The instrument itself can be undefined if the song state is corrupted after a failed parse.
        if (!instrument) return;

        let mod: number = Config.modCount - 1 - tone.pitches[0];

        // Flagged as invalid because unused by current settings, skip
        if (instrument.invalidModulators[mod]) return;

        let setting: number = instrument.modulators[mod];

        // Generate list of used instruments
let usedInstruments: number[] = [];
if (Config.modulators[instrument.modulators[mod]].forSong) {
	// Instrument doesn't matter for song, just push a random index to run the modsynth once
	usedInstruments.push(0);
} else if (instrument.modChannels[mod] >= 0) {
	// All
	if (
		instrument.modInstruments[mod] ==
		synth.song.channels[instrument.modChannels[mod]].instruments.length
	) {
		for (
			let i: number = 0;
			i < synth.song.channels[instrument.modChannels[mod]].instruments.length;
			i++
		) {
			usedInstruments.push(i);
		}
	}
	// Active
	else if (
		instrument.modInstruments[mod] >
		synth.song.channels[instrument.modChannels[mod]].instruments.length
	) {
		if (synth.song.getPattern(instrument.modChannels[mod], synth.bar) != null)
			usedInstruments = synth.song.getPattern(
				instrument.modChannels[mod],
				synth.bar,
			)!.instruments;
	} else {
		usedInstruments.push(instrument.modInstruments[mod]);
	}
}

for (
	let instrumentIndex: number = 0;
	instrumentIndex < usedInstruments.length;
	instrumentIndex++
) {
	synth.setModValue(
		tone.expression,
		tone.expression + tone.expressionDelta,
		instrument.modChannels[mod],
		usedInstruments[instrumentIndex],
		setting,
	);

	// If mods are being held (for smoother playback while recording mods), use those values instead.
	for (let i: number = 0; i < synth.heldMods.length; i++) {
		if (Config.modulators[instrument.modulators[mod]].forSong) {
			if (synth.heldMods[i].setting == setting)
				synth.setModValue(
					synth.heldMods[i].volume,
					synth.heldMods[i].volume,
					instrument.modChannels[mod],
					usedInstruments[instrumentIndex],
					setting,
				);
		} else if (
			synth.heldMods[i].channelIndex == instrument.modChannels[mod] &&
			synth.heldMods[i].instrumentIndex == usedInstruments[instrumentIndex] &&
			synth.heldMods[i].setting == setting
		) {
			synth.setModValue(
				synth.heldMods[i].volume,
				synth.heldMods[i].volume,
				instrument.modChannels[mod],
				usedInstruments[instrumentIndex],
				setting,
			);
		}
	}

            // Reset arps, but only at the start of the note
            if (setting == Config.modulators.dictionary["reset arp"].index && synth.tick == 0 && tone.noteStartPart == synth.beat * Config.partsPerBeat + synth.part) {
                synth.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]].arpTime = 0;
            }
            // Reset envelope, but only at the start of the note
            else if (setting == Config.modulators.dictionary["reset envelope"].index && synth.tick == 0 && tone.noteStartPart == synth.beat * Config.partsPerBeat + synth.part) {
                let envelopeTarget = instrument.modEnvelopeNumbers[mod];
                const tgtInstrumentState: InstrumentState = synth.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];
                const tgtInstrument: Instrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];

                if (tgtInstrument.envelopeCount > envelopeTarget) {
                    tgtInstrumentState.envelopeTime[envelopeTarget] = 0;
                }
            }
            // Denote next bar skip
            else if (setting == Config.modulators.dictionary["next bar"].index) {
                synth.wantToSkip = true;
            }
            // do song eq filter first
            else if (setting == Config.modulators.dictionary["song eq"].index) {
                const tgtSong = synth.song

                let dotTarget = instrument.modFilterTypes[mod] | 0;

                if (dotTarget == 0) { // Morph. Figure out the target filter's X/Y coords for this point. If no point exists with this index, or point types don't match, do lerp-out for this point and lerp-in of a new point

                    let pinIdx: number = 0;
                    const currentPart: number = synth.getTicksIntoBar() / Config.ticksPerPart;
                    while (tone.note!.start + tone.note!.pins[pinIdx].time <= currentPart) pinIdx++;
                    // 0 to 1 based on distance to next morph
                    //let lerpStartRatio: number = (currentPart - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);
                    let lerpEndRatio: number = ((currentPart - tone.note!.start + (roundedSamplesPerTick / (synth.getSamplesPerTick() * Config.ticksPerPart)) * Config.ticksPerPart) - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);

                    // Compute the new settings to go to.
                    if (tgtSong.eqSubFilters[tone.note!.pins[pinIdx - 1].size] != null || tgtSong.eqSubFilters[tone.note!.pins[pinIdx].size] != null) {
                        tgtSong.tmpEqFilterEnd = FilterSettings.lerpFilters(tgtSong.eqSubFilters[tone.note!.pins[pinIdx - 1].size]!, tgtSong.eqSubFilters[tone.note!.pins[pinIdx].size]!, lerpEndRatio);
                    } else {
                        tgtSong.tmpEqFilterEnd = tgtSong.eqFilter;
                    }

                }
                else {
                    for (let i: number = 0; i < Config.filterMorphCount; i++) {
                        if (tgtSong.tmpEqFilterEnd == tgtSong.eqSubFilters[i] && tgtSong.tmpEqFilterEnd != null) {
                            tgtSong.tmpEqFilterEnd = new FilterSettings();
                            tgtSong.tmpEqFilterEnd.fromJsonObject(tgtSong.eqSubFilters[i]!.toJsonObject());
                        }
                    }
                    if (tgtSong.tmpEqFilterEnd == null) {
                        tgtSong.tmpEqFilterEnd = new FilterSettings();
                        tgtSong.tmpEqFilterEnd.fromJsonObject(tgtSong.eqFilter.toJsonObject());
                    }

                    if (tgtSong.tmpEqFilterEnd.controlPointCount > Math.floor((dotTarget - 1) / 2)) {
                        if (dotTarget % 2) { // X
                            tgtSong.tmpEqFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].freq = tone.expression + tone.expressionDelta;
                        } else { // Y
                            tgtSong.tmpEqFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].gain = tone.expression + tone.expressionDelta;
                        }
                    }
                }
            }
            // Extra info for eq filter target needs to be set as well
            else if (setting == Config.modulators.dictionary["eq filter"].index) {
                const tgtInstrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];

                if (!tgtInstrument.eqFilterType) {

                    let dotTarget = instrument.modFilterTypes[mod] | 0;

                    if (dotTarget == 0) { // Morph. Figure out the target filter's X/Y coords for this point. If no point exists with this index, or point types don't match, do lerp-out for this point and lerp-in of a new point

                        let pinIdx: number = 0;
                        const currentPart: number = synth.getTicksIntoBar() / Config.ticksPerPart;
                        while (tone.note!.start + tone.note!.pins[pinIdx].time <= currentPart) pinIdx++;
                        // 0 to 1 based on distance to next morph
                        //let lerpStartRatio: number = (currentPart - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);
                        let lerpEndRatio: number = ((currentPart - tone.note!.start + (roundedSamplesPerTick / (synth.getSamplesPerTick() * Config.ticksPerPart)) * Config.ticksPerPart) - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);

                        // Compute the new settings to go to.
                        if (tgtInstrument.eqSubFilters[tone.note!.pins[pinIdx - 1].size] != null || tgtInstrument.eqSubFilters[tone.note!.pins[pinIdx].size] != null) {
                            tgtInstrument.tmpEqFilterEnd = FilterSettings.lerpFilters(tgtInstrument.eqSubFilters[tone.note!.pins[pinIdx - 1].size]!, tgtInstrument.eqSubFilters[tone.note!.pins[pinIdx].size]!, lerpEndRatio);
                        } else {
                            tgtInstrument.tmpEqFilterEnd = tgtInstrument.eqFilter;
                        }

                    } // Target (1 is dot 1 X, 2 is dot 1 Y, etc.)
                    else {
                        for (let i: number = 0; i < Config.filterMorphCount; i++) {
                            if (tgtInstrument.tmpEqFilterEnd == tgtInstrument.eqSubFilters[i] && tgtInstrument.tmpEqFilterEnd != null) {
                                tgtInstrument.tmpEqFilterEnd = new FilterSettings();
                                tgtInstrument.tmpEqFilterEnd.fromJsonObject(tgtInstrument.eqSubFilters[i]!.toJsonObject());
                            }
                        }
                        if (tgtInstrument.tmpEqFilterEnd == null) {
                            tgtInstrument.tmpEqFilterEnd = new FilterSettings();
                            tgtInstrument.tmpEqFilterEnd.fromJsonObject(tgtInstrument.eqFilter.toJsonObject());
                        }

                        if (tgtInstrument.tmpEqFilterEnd.controlPointCount > Math.floor((dotTarget - 1) / 2)) {
                            if (dotTarget % 2) { // X
                                tgtInstrument.tmpEqFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].freq = tone.expression + tone.expressionDelta;
                            } else { // Y
                                tgtInstrument.tmpEqFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].gain = tone.expression + tone.expressionDelta;
                            }
                        }
                    }
                }
            }
            // Extra info for note filter target needs to be set as well
            else if (setting == Config.modulators.dictionary["note filter"].index) {
                const tgtInstrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];

                if (!tgtInstrument.noteFilterType) {
                    let dotTarget = instrument.modFilterTypes[mod] | 0;

                    if (dotTarget == 0) { // Morph. Figure out the target filter's X/Y coords for this point. If no point exists with this index, or point types don't match, do lerp-out for this point and lerp-in of a new point

                        let pinIdx: number = 0;
                        const currentPart: number = synth.getTicksIntoBar() / Config.ticksPerPart;
                        while (tone.note!.start + tone.note!.pins[pinIdx].time <= currentPart) pinIdx++;
                        // 0 to 1 based on distance to next morph
                        //let lerpStartRatio: number = (currentPart - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);
                        let lerpEndRatio: number = ((currentPart - tone.note!.start + (roundedSamplesPerTick / (synth.getSamplesPerTick() * Config.ticksPerPart)) * Config.ticksPerPart) - tone.note!.pins[pinIdx - 1].time) / (tone.note!.pins[pinIdx].time - tone.note!.pins[pinIdx - 1].time);

                        // Compute the new settings to go to.
                        if (tgtInstrument.noteSubFilters[tone.note!.pins[pinIdx - 1].size] != null || tgtInstrument.noteSubFilters[tone.note!.pins[pinIdx].size] != null) {
                            tgtInstrument.tmpNoteFilterEnd = FilterSettings.lerpFilters(tgtInstrument.noteSubFilters[tone.note!.pins[pinIdx - 1].size]!, tgtInstrument.noteSubFilters[tone.note!.pins[pinIdx].size]!, lerpEndRatio);
                        } else {
                            tgtInstrument.tmpNoteFilterEnd = tgtInstrument.noteFilter;
                        }

                    } // Target (1 is dot 1 X, 2 is dot 1 Y, etc.)
                    else {

                        for (let i: number = 0; i < Config.filterMorphCount; i++) {
                            if (tgtInstrument.tmpNoteFilterEnd == tgtInstrument.noteSubFilters[i] && tgtInstrument.tmpNoteFilterEnd != null) {
                                tgtInstrument.tmpNoteFilterEnd = new FilterSettings();
                                tgtInstrument.tmpNoteFilterEnd.fromJsonObject(tgtInstrument.noteSubFilters[i]!.toJsonObject());
                            }
                        }
                        if (tgtInstrument.tmpNoteFilterEnd == null) {
                            tgtInstrument.tmpNoteFilterEnd = new FilterSettings();
                            tgtInstrument.tmpNoteFilterEnd.fromJsonObject(tgtInstrument.noteFilter.toJsonObject());
                        }

                        if (tgtInstrument.tmpNoteFilterEnd.controlPointCount > Math.floor((dotTarget - 1) / 2)) {
                            if (dotTarget % 2) { // X
                                tgtInstrument.tmpNoteFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].freq = tone.expression + tone.expressionDelta;
                            } else { // Y
                                tgtInstrument.tmpNoteFilterEnd.controlPoints[Math.floor((dotTarget - 1) / 2)].gain = tone.expression + tone.expressionDelta;
                            }
                        }
                    }
                }
            } else if (setting == Config.modulators.dictionary["individual envelope speed"].index) {
                const tgtInstrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];
                let envelopeTarget = instrument.modEnvelopeNumbers[mod];

                let speed: number = tone.expression + tone.expressionDelta;
                if (tgtInstrument.envelopeCount > envelopeTarget) {
                    if (Number.isInteger(speed)) {
                        tgtInstrument.envelopes[envelopeTarget].tempEnvelopeSpeed = Config.perEnvelopeSpeedIndices[speed];
                    } else {
                        //linear interpolation
                        speed = (1 - (speed % 1)) * Config.perEnvelopeSpeedIndices[Math.floor(speed)] + (speed % 1) * Config.perEnvelopeSpeedIndices[Math.ceil(speed)];
                        tgtInstrument.envelopes[envelopeTarget].tempEnvelopeSpeed = speed;
                    }
                }
            } else if (setting == Config.modulators.dictionary["individual envelope lower bound"].index) {
                const tgtInstrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];
                let envelopeTarget = instrument.modEnvelopeNumbers[mod];

                let bound: number = tone.expression + tone.expressionDelta;
                if (tgtInstrument.envelopeCount > envelopeTarget) {
                    tgtInstrument.envelopes[envelopeTarget].tempEnvelopeLowerBound = bound / 10;
                }
            } else if (setting == Config.modulators.dictionary["individual envelope upper bound"].index) {
                const tgtInstrument = synth.song.channels[instrument.modChannels[mod]].instruments[usedInstruments[instrumentIndex]];
                let envelopeTarget = instrument.modEnvelopeNumbers[mod];

                let bound: number = tone.expression + tone.expressionDelta;
                if (tgtInstrument.envelopeCount > envelopeTarget) {
                    tgtInstrument.envelopes[envelopeTarget].tempEnvelopeUpperBound = bound / 10;
                }
            }
        }
    }

    public static findRandomZeroCrossing(wave: Float32Array, waveLength: number): number { //literally only public to let typescript compile
        let phase: number = Math.random() * waveLength;
        const phaseMask: number = waveLength - 1;

        // Spectrum and drumset waves sounds best when they start at a zero crossing,
        // otherwise they pop. Try to find a zero crossing.
        let indexPrev: number = phase & phaseMask;
        let wavePrev: number = wave[indexPrev];
        const stride: number = 16;
        for (let attemptsRemaining: number = 128; attemptsRemaining > 0; attemptsRemaining--) {
            const indexNext: number = (indexPrev + stride) & phaseMask;
            const waveNext: number = wave[indexNext];
            if (wavePrev * waveNext <= 0.0) {
                // Found a zero crossing! Now let's narrow it down to two adjacent sample indices.
                for (let i: number = 0; i < stride; i++) {
                    const innerIndexNext: number = (indexPrev + 1) & phaseMask;
                    const innerWaveNext: number = wave[innerIndexNext];
                    if (wavePrev * innerWaveNext <= 0.0) {
                        // Found the zero crossing again! Now let's find the exact intersection.
                        const slope: number = innerWaveNext - wavePrev;
                        phase = indexPrev;
                        if (Math.abs(slope) > 0.00000001) {
                            phase += -wavePrev / slope;
                        }
                        phase = Math.max(0, phase) % waveLength;
                        break;
                    } else {
                        indexPrev = innerIndexNext;
                        wavePrev = innerWaveNext;
                    }
                }
                break;
            } else {
                indexPrev = indexNext;
                wavePrev = waveNext;
            }
        }

        return phase;
    }

    public static instrumentVolumeToVolumeMult(instrumentVolume: number): number {
        return (instrumentVolume == -Config.volumeRange / 2.0) ? 0.0 : Math.pow(2, Config.volumeLogScale * instrumentVolume);
    }
    public static volumeMultToInstrumentVolume(volumeMult: number): number {
        return (volumeMult <= 0.0) ? -Config.volumeRange / 2 : Math.min(Config.volumeRange, (Math.log(volumeMult) / Math.LN2) / Config.volumeLogScale);
    }
    public static noteSizeToVolumeMult(size: number): number {
        return Math.pow(Math.max(0.0, size) / Config.noteSizeMax, 1.5);
    }
    public static volumeMultToNoteSize(volumeMult: number): number {
        return Math.pow(Math.max(0.0, volumeMult), 1 / 1.5) * Config.noteSizeMax;
    }

    public static fadeInSettingToSeconds(setting: number): number {
        return 0.0125 * (0.95 * setting + 0.05 * setting * setting);
    }
    public static secondsToFadeInSetting(seconds: number): number {
        return clamp(0, Config.fadeInRange, Math.round((-0.95 + Math.sqrt(0.9025 + 0.2 * seconds / 0.0125)) / 0.1));
    }
    public static fadeOutSettingToTicks(setting: number): number {
        return Config.fadeOutTicks[setting];
    }
    public static ticksToFadeOutSetting(ticks: number): number {
        let lower: number = Config.fadeOutTicks[0];
        if (ticks <= lower) return 0;
        for (let i: number = 1; i < Config.fadeOutTicks.length; i++) {
            let upper: number = Config.fadeOutTicks[i];
            if (ticks <= upper) return (ticks < (lower + upper) / 2) ? i - 1 : i;
            lower = upper;
        }
        return Config.fadeOutTicks.length - 1;
    }

    // public static lerp(t: number, a: number, b: number): number {
    //     return a + (b - a) * t;
    // }

    // public static unlerp(x: number, a: number, b: number): number {
    //     return (x - a) / (b - a);
    // }

    public static detuneToCents(detune: number): number {
        // BeepBox formula, for reference:
        // return detune * (Math.abs(detune) + 1) / 2;
        return detune - Config.detuneCenter;
    }
    public static centsToDetune(cents: number): number {
        // BeepBox formula, for reference:
        // return Math.sign(cents) * (Math.sqrt(1 + 8 * Math.abs(cents)) - 1) / 2.0;
        return cents + Config.detuneCenter;
    }

    public static getOperatorWave(waveform: number, pulseWidth: number) {
        if (waveform != 2) {
            return Config.operatorWaves[waveform];
        }
        else {
            return Config.pwmOperatorWaves[pulseWidth];
        }
    }

    public getSamplesPerTick(): number {
        if (this.song == null) return 0;
        let beatsPerMinute: number = this.song.getBeatsPerMinute();
        if (this.isModActive(Config.modulators.dictionary["tempo"].index)) {
            beatsPerMinute = this.getModValue(Config.modulators.dictionary["tempo"].index);
        }
        return this.getSamplesPerTickSpecificBPM(beatsPerMinute);
    }

    private getSamplesPerTickSpecificBPM(beatsPerMinute: number): number {
        const beatsPerSecond: number = beatsPerMinute / 60.0;
        const partsPerSecond: number = Config.partsPerBeat * beatsPerSecond;
        const tickPerSecond: number = Config.ticksPerPart * partsPerSecond;
        return this.samplesPerSecond / tickPerSecond;
    }

    public static fittingPowerOfTwo(x: number): number {
        return 1 << (32 - Math.clz32(Math.ceil(x) - 1));
    }

    private sanitizeFilters(filters: DynamicBiquadFilter[]): void {
        let reset: boolean = false;
        for (const filter of filters) {
            const output1: number = Math.abs(filter.output1);
            const output2: number = Math.abs(filter.output2);
            // If either is a large value, Infinity, or NaN, then just reset all filter history.
            if (!(output1 < 100) || !(output2 < 100)) {
                reset = true;
                break;
            }
            if (output1 < epsilon) filter.output1 = 0.0;
            if (output2 < epsilon) filter.output2 = 0.0;
        }
        if (reset) {
            for (const filter of filters) {
                filter.output1 = 0.0;
                filter.output2 = 0.0;
            }
        }
    }

    public static sanitizeDelayLine(delayLine: Float32Array, lastIndex: number, mask: number): void {
        while (true) {
            lastIndex--;
            const index: number = lastIndex & mask;
            const sample: number = Math.abs(delayLine[index]);
            if (Number.isFinite(sample) && (sample == 0.0 || sample >= epsilon)) break;
            delayLine[index] = 0.0;
        }
    }

    public static applyFilters(sample: number, input1: number, input2: number, filterCount: number, filters: DynamicBiquadFilter[]): number {
        for (let i: number = 0; i < filterCount; i++) {
            const filter: DynamicBiquadFilter = filters[i];
            const output1: number = filter.output1;
            const output2: number = filter.output2;
            const a1: number = filter.a1;
            const a2: number = filter.a2;
            const b0: number = filter.b0;
            const b1: number = filter.b1;
            const b2: number = filter.b2;
            sample = b0 * sample + b1 * input1 + b2 * input2 - a1 * output1 - a2 * output2;
            filter.a1 = a1 + filter.a1Delta;
            filter.a2 = a2 + filter.a2Delta;
            if (filter.useMultiplicativeInputCoefficients) {
                filter.b0 = b0 * filter.b0Delta;
                filter.b1 = b1 * filter.b1Delta;
                filter.b2 = b2 * filter.b2Delta;
            } else {
                filter.b0 = b0 + filter.b0Delta;
                filter.b1 = b1 + filter.b1Delta;
                filter.b2 = b2 + filter.b2Delta;
            }
            filter.output2 = output1;
            filter.output1 = sample;
            // Updating the input values is waste if the next filter doesn't exist...
            input2 = output2;
            input1 = output1;
        }
        return sample;
    }

    public computeTicksSinceStart(ofBar: boolean = false) {
        const beatsPerBar = this.song?.beatsPerBar ? this.song?.beatsPerBar : 8;
        if (ofBar) {
            return Config.ticksPerPart * Config.partsPerBeat * beatsPerBar * this.bar;
        } else {
            return this.tick + Config.ticksPerPart * (this.part + Config.partsPerBeat * (this.beat + beatsPerBar * this.bar));
        }
    }
}

// When compiling synth.ts as a standalone module named "beepbox", expose these classes as members to JavaScript:
export { EnvelopeComputer } from './EnvelopeComputer';
export { EnvelopeSettings } from './EnvelopeSettings';
export { FilterSettings } from './FilterSettings';
export { Instrument } from './Instrument';
export { InstrumentState } from './InstrumentState';
export { Pattern } from './Pattern';
export { PickedString } from './PickedString';
export { Song } from './Song';
export { Tone } from './Tone';
export { Chord, Config, Dictionary, DictionaryArray, Envelope, EnvelopeType, FilterType, InstrumentType, Transition };
