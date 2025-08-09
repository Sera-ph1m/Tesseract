import { Deque } from './Deque';
import { EnvelopeComputer } from './EnvelopeComputer';
import { inverseRealFourierTransform, scaleElementsByFactor } from './FFT';
import { FilterSettings } from './FilterSettings';
import { Instrument } from './Instrument';
import { EnvelopeComputeIndex, GranularEnvelopeType, Unison, calculateRingModHertz, effectsIncludeBitcrusher, effectsIncludeChorus, effectsIncludeDistortion, effectsIncludeEcho, effectsIncludeGranular, effectsIncludePanning, effectsIncludeReverb, effectsIncludeRingModulation, getDrumWave } from './SynthConfig';
import { Tone } from './Tone';
import { DynamicBiquadFilter } from './filtering';
import { Chord, Config, FilterControlPoint, FilterType, Grain, HarmonicsWaveState, InstrumentType, SpectrumWaveState, Synth } from './synth';
export class InstrumentState {
    public awake: boolean = false; // Whether the instrument's effects-processing loop should continue.
    public computed: boolean = false; // Whether the effects-processing parameters are up-to-date for the current synth run.
    public tonesAddedInThisTick: boolean = false; // Whether any instrument tones are currently active.
    public flushingDelayLines: boolean = false; // If no tones were active recently, enter a mode where the delay lines are filled with zeros to reset them for later use.
    public deactivateAfterThisTick: boolean = false; // Whether the instrument is ready to be deactivated because the delay lines, if any, are fully zeroed.
    public attentuationProgress: number = 0.0; // How long since an active tone introduced an input signal to the delay lines, normalized from 0 to 1 based on how long to wait until the delay lines signal will have audibly dissapated.
    public flushedSamples: number = 0; // How many delay line samples have been flushed to zero.
    public readonly activeTones: Deque<Tone> = new Deque<Tone>();
    public readonly activeModTones: Deque<Tone> = new Deque<Tone>();
    public readonly releasedTones: Deque<Tone> = new Deque<Tone>(); // Tones that are in the process of fading out after the corresponding notes ended.
    public readonly liveInputTones: Deque<Tone> = new Deque<Tone>(); // Tones that are initiated by a source external to the loaded song data.

    public type: InstrumentType = InstrumentType.chip;
    public synthesizer: Function | null = null;
    public wave: Float32Array | null = null;
    // advloop addition
    public isUsingAdvancedLoopControls = false;
    public chipWaveLoopStart = 0;
    public chipWaveLoopEnd = 0;
    public chipWaveLoopMode = 0;
    public chipWavePlayBackwards = false;
    public chipWaveStartOffset = 0;
    // advloop addition
    public noisePitchFilterMult: number = 1.0;
    public unison: Unison | null = null;
    public unisonVoices: number = 1;
    public unisonSpread: number = 0.0;
    public unisonOffset: number = 0.0;
    public unisonExpression: number = 1.4;
    public unisonSign: number = 1.0;
    public chord: Chord | null = null;
    public effects: number = 0;

    public volumeScale: number = 0;
    public aliases: boolean = false;
    public arpTime: number = 0;
    public vibratoTime: number = 0;
    public nextVibratoTime: number = 0;
    public envelopeTime: number[] = [];

    public eqFilterVolume: number = 1.0;
    public eqFilterVolumeDelta: number = 0.0;
    public mixVolume: number = 1.0;
    public mixVolumeDelta: number = 0.0;
    public delayInputMult: number = 0.0;
    public delayInputMultDelta: number = 0.0;

    public granularMix: number = 1.0;
    public granularMixDelta: number = 0.0;
    public granularDelayLine: Float32Array | null = null;
    public granularDelayLineIndex: number = 0;
    public granularMaximumDelayTimeInSeconds: number = 1;
    public granularGrains: Grain[];
    public granularGrainsLength: number;
    public granularMaximumGrains: number;
    public usesRandomGrainLocation: boolean = true; //eventually I might use the granular code for sample pitch shifting, but we'll see
    public granularDelayLineDirty: boolean = false;
    public computeGrains: boolean = true;

    public ringModMix: number = 0;
    public ringModMixDelta: number = 0;
    public ringModPhase: number = 0;
    public ringModPhaseDelta: number = 0;
    public ringModPhaseDeltaScale: number = 1.0;
    public ringModWaveformIndex: number = 0.0;
    public ringModPulseWidth: number = 0.0;
    public ringModHzOffset: number = 0.0;
    public ringModMixFade: number = 1.0;
    public ringModMixFadeDelta: number = 0;

    public distortion: number = 0.0;
    public distortionDelta: number = 0.0;
    public distortionDrive: number = 0.0;
    public distortionDriveDelta: number = 0.0;
    public distortionFractionalInput1: number = 0.0;
    public distortionFractionalInput2: number = 0.0;
    public distortionFractionalInput3: number = 0.0;
    public distortionPrevInput: number = 0.0;
    public distortionNextOutput: number = 0.0;

    public bitcrusherPrevInput: number = 0.0;
    public bitcrusherCurrentOutput: number = 0.0;
    public bitcrusherPhase: number = 1.0;
    public bitcrusherPhaseDelta: number = 0.0;
    public bitcrusherPhaseDeltaScale: number = 1.0;
    public bitcrusherScale: number = 1.0;
    public bitcrusherScaleScale: number = 1.0;
    public bitcrusherFoldLevel: number = 1.0;
    public bitcrusherFoldLevelScale: number = 1.0;

    public readonly eqFilters: DynamicBiquadFilter[] = [];
    public eqFilterCount: number = 0;
    public initialEqFilterInput1: number = 0.0;
    public initialEqFilterInput2: number = 0.0;

    public panningDelayLine: Float32Array | null = null;
    public panningDelayPos: number = 0;
    public panningVolumeL: number = 0.0;
    public panningVolumeR: number = 0.0;
    public panningVolumeDeltaL: number = 0.0;
    public panningVolumeDeltaR: number = 0.0;
    public panningOffsetL: number = 0.0;
    public panningOffsetR: number = 0.0;
    public panningOffsetDeltaL: number = 0.0;
    public panningOffsetDeltaR: number = 0.0;

    public chorusDelayLineL: Float32Array | null = null;
    public chorusDelayLineR: Float32Array | null = null;
    public chorusDelayLineDirty: boolean = false;
    public chorusDelayPos: number = 0;
    public chorusPhase: number = 0;
    public chorusVoiceMult: number = 0;
    public chorusVoiceMultDelta: number = 0;
    public chorusCombinedMult: number = 0;
    public chorusCombinedMultDelta: number = 0;

    public echoDelayLineL: Float32Array | null = null;
    public echoDelayLineR: Float32Array | null = null;
    public echoDelayLineDirty: boolean = false;
    public echoDelayPos: number = 0;
    public echoDelayOffsetStart: number = 0;
    public echoDelayOffsetEnd: number | null = null;
    public echoDelayOffsetRatio: number = 0.0;
    public echoDelayOffsetRatioDelta: number = 0.0;
    public echoMult: number = 0.0;
    public echoMultDelta: number = 0.0;
    public echoShelfA1: number = 0.0;
    public echoShelfB0: number = 0.0;
    public echoShelfB1: number = 0.0;
    public echoShelfSampleL: number = 0.0;
    public echoShelfSampleR: number = 0.0;
    public echoShelfPrevInputL: number = 0.0;
    public echoShelfPrevInputR: number = 0.0;

    public reverbDelayLine: Float32Array | null = null;
    public reverbDelayLineDirty: boolean = false;
    public reverbDelayPos: number = 0;
    public reverbMult: number = 0.0;
    public reverbMultDelta: number = 0.0;
    public reverbShelfA1: number = 0.0;
    public reverbShelfB0: number = 0.0;
    public reverbShelfB1: number = 0.0;
    public reverbShelfSample0: number = 0.0;
    public reverbShelfSample1: number = 0.0;
    public reverbShelfSample2: number = 0.0;
    public reverbShelfSample3: number = 0.0;
    public reverbShelfPrevInput0: number = 0.0;
    public reverbShelfPrevInput1: number = 0.0;
    public reverbShelfPrevInput2: number = 0.0;
    public reverbShelfPrevInput3: number = 0.0;

    public readonly spectrumWave: SpectrumWaveState = new SpectrumWaveState();
    public readonly harmonicsWave: HarmonicsWaveState = new HarmonicsWaveState();
    public readonly drumsetSpectrumWaves: SpectrumWaveState[] = [];

    constructor() {
        for (let i: number = 0; i < Config.drumCount; i++) {
            this.drumsetSpectrumWaves[i] = new SpectrumWaveState();
        }
        // Allocate all grains to be used ahead of time.
        // granularGrainsLength is what indicates how many grains actually "exist".
        this.granularGrains = [];
        this.granularMaximumGrains = 256;
        for (let i: number = 0; i < this.granularMaximumGrains; i++) {
            this.granularGrains.push(new Grain());
        }
        this.granularGrainsLength = 0;
    }

    public readonly envelopeComputer: EnvelopeComputer = new EnvelopeComputer();

    public allocateNecessaryBuffers(synth: Synth, instrument: Instrument, samplesPerTick: number): void {
        if (effectsIncludePanning(instrument.effects)) {
            if (this.panningDelayLine == null || this.panningDelayLine.length < synth.panningDelayBufferSize) {
                this.panningDelayLine = new Float32Array(synth.panningDelayBufferSize);
            }
        }
        if (effectsIncludeChorus(instrument.effects)) {
            if (this.chorusDelayLineL == null || this.chorusDelayLineL.length < synth.chorusDelayBufferSize) {
                this.chorusDelayLineL = new Float32Array(synth.chorusDelayBufferSize);
            }
            if (this.chorusDelayLineR == null || this.chorusDelayLineR.length < synth.chorusDelayBufferSize) {
                this.chorusDelayLineR = new Float32Array(synth.chorusDelayBufferSize);
            }
        }
        if (effectsIncludeEcho(instrument.effects)) {
            this.allocateEchoBuffers(samplesPerTick, instrument.echoDelay);
        }
        if (effectsIncludeReverb(instrument.effects)) {
            // TODO: Make reverb delay line sample rate agnostic. Maybe just double buffer size for 96KHz? Adjust attenuation and shelf cutoff appropriately?
            if (this.reverbDelayLine == null) {
                this.reverbDelayLine = new Float32Array(Config.reverbDelayBufferSize);
            }
        }
        if (effectsIncludeGranular(instrument.effects)) {
            const granularDelayLineSizeInMilliseconds: number = 2500;
            const granularDelayLineSizeInSeconds: number = granularDelayLineSizeInMilliseconds / 1000; // Maximum possible delay time
            this.granularMaximumDelayTimeInSeconds = granularDelayLineSizeInSeconds;
            const granularDelayLineSizeInSamples: number = Synth.fittingPowerOfTwo(Math.floor(granularDelayLineSizeInSeconds * synth.samplesPerSecond));
            if (this.granularDelayLine == null || this.granularDelayLine.length != granularDelayLineSizeInSamples) {
                this.granularDelayLine = new Float32Array(granularDelayLineSizeInSamples);
                this.granularDelayLineIndex = 0;
            }
            const oldGrainsLength: number = this.granularGrains.length;
            if (this.granularMaximumGrains > oldGrainsLength) { //increase grain amount if it changes
                for (let i: number = oldGrainsLength; i < this.granularMaximumGrains + 1; i++) {
                    this.granularGrains.push(new Grain());
                }
            }
            if (this.granularMaximumGrains < this.granularGrainsLength) {
                this.granularGrainsLength = Math.round(this.granularMaximumGrains);
            }
        }
    }

    public allocateEchoBuffers(samplesPerTick: number, echoDelay: number) {
        const safeEchoDelaySteps: number = Math.max(Config.echoDelayRange >> 1, (echoDelay + 1));
        const baseEchoDelayBufferSize: number = Synth.fittingPowerOfTwo(safeEchoDelaySteps * Config.echoDelayStepTicks * samplesPerTick);
        const safeEchoDelayBufferSize: number = baseEchoDelayBufferSize * 2; 

        if (this.echoDelayLineL == null || this.echoDelayLineR == null) {
            this.echoDelayLineL = new Float32Array(safeEchoDelayBufferSize);
            this.echoDelayLineR = new Float32Array(safeEchoDelayBufferSize);
        } else if (this.echoDelayLineL.length < safeEchoDelayBufferSize || this.echoDelayLineR.length < safeEchoDelayBufferSize) {
            const newDelayLineL: Float32Array = new Float32Array(safeEchoDelayBufferSize);
            const newDelayLineR: Float32Array = new Float32Array(safeEchoDelayBufferSize);
            const oldMask: number = this.echoDelayLineL.length - 1;

            for (let i = 0; i < this.echoDelayLineL.length; i++) {
                newDelayLineL[i] = this.echoDelayLineL[(this.echoDelayPos + i) & oldMask];
                newDelayLineR[i] = this.echoDelayLineL[(this.echoDelayPos + i) & oldMask];
            }

            this.echoDelayPos = this.echoDelayLineL.length;
            this.echoDelayLineL = newDelayLineL;
            this.echoDelayLineR = newDelayLineR;
        }
    }

    public deactivate(): void {
        this.bitcrusherPrevInput = 0.0;
        this.bitcrusherCurrentOutput = 0.0;
        this.bitcrusherPhase = 1.0;
        for (let i: number = 0; i < this.eqFilterCount; i++) {
            this.eqFilters[i].resetOutput();
        }
        this.eqFilterCount = 0;
        this.initialEqFilterInput1 = 0.0;
        this.initialEqFilterInput2 = 0.0;
        this.distortionFractionalInput1 = 0.0;
        this.distortionFractionalInput2 = 0.0;
        this.distortionFractionalInput3 = 0.0;
        this.distortionPrevInput = 0.0;
        this.distortionNextOutput = 0.0;
        this.panningDelayPos = 0;
        if (this.panningDelayLine != null) for (let i: number = 0; i < this.panningDelayLine.length; i++) this.panningDelayLine[i] = 0.0;
        this.echoDelayOffsetEnd = null;
        this.echoShelfSampleL = 0.0;
        this.echoShelfSampleR = 0.0;
        this.echoShelfPrevInputL = 0.0;
        this.echoShelfPrevInputR = 0.0;
        this.reverbShelfSample0 = 0.0;
        this.reverbShelfSample1 = 0.0;
        this.reverbShelfSample2 = 0.0;
        this.reverbShelfSample3 = 0.0;
        this.reverbShelfPrevInput0 = 0.0;
        this.reverbShelfPrevInput1 = 0.0;
        this.reverbShelfPrevInput2 = 0.0;
        this.reverbShelfPrevInput3 = 0.0;

        this.volumeScale = 1.0;
        this.aliases = false;

        this.awake = false;
        this.flushingDelayLines = false;
        this.deactivateAfterThisTick = false;
        this.attentuationProgress = 0.0;
        this.flushedSamples = 0;
    }

    public resetAllEffects(): void {
        this.deactivate();
        // LFOs are reset here rather than in deactivate() for periodic oscillation that stays "on the beat". Resetting in deactivate() will cause it to reset with each note.
        this.vibratoTime = 0;
        this.nextVibratoTime = 0;
        this.arpTime = 0;
        for (let envelopeIndex: number = 0; envelopeIndex < Config.maxEnvelopeCount + 1; envelopeIndex++) this.envelopeTime[envelopeIndex] = 0;
        this.envelopeComputer.reset();

        if (this.chorusDelayLineDirty) {
            for (let i: number = 0; i < this.chorusDelayLineL!.length; i++) this.chorusDelayLineL![i] = 0.0;
            for (let i: number = 0; i < this.chorusDelayLineR!.length; i++) this.chorusDelayLineR![i] = 0.0;
        }
        if (this.echoDelayLineDirty) {
            for (let i: number = 0; i < this.echoDelayLineL!.length; i++) this.echoDelayLineL![i] = 0.0;
            for (let i: number = 0; i < this.echoDelayLineR!.length; i++) this.echoDelayLineR![i] = 0.0;
        }
        if (this.reverbDelayLineDirty) {
            for (let i: number = 0; i < this.reverbDelayLine!.length; i++) this.reverbDelayLine![i] = 0.0;
        }
        if (this.granularDelayLineDirty) {
            for (let i: number = 0; i < this.granularDelayLine!.length; i++) this.granularDelayLine![i] = 0.0;
        }

        this.chorusPhase = 0.0;
        this.ringModPhase = 0.0;
        this.ringModMixFade = 1.0;
    }

    public compute(synth: Synth, instrument: Instrument, samplesPerTick: number, roundedSamplesPerTick: number, tone: Tone | null, channelIndex: number, instrumentIndex: number): void {
        this.computed = true;

        this.type = instrument.type;
        this.synthesizer = Synth.getInstrumentSynthFunction(instrument);
        this.unison = Config.unisons[instrument.unison];
        this.chord = instrument.getChord();
        this.noisePitchFilterMult = Config.chipNoises[instrument.chipNoise].pitchFilterMult;
        this.effects = instrument.effects;

        this.aliases = instrument.aliases;
        this.volumeScale = 1.0;

        const samplesPerSecond: number = synth.samplesPerSecond;
        this.updateWaves(instrument, samplesPerSecond);

        const ticksIntoBar: number = synth.getTicksIntoBar();
        const tickTimeStart: number = ticksIntoBar;
        const secondsPerTick: number = samplesPerTick / synth.samplesPerSecond;
        const currentPart: number = synth.getCurrentPart();
        const envelopeSpeeds: number[] = [];
        for (let i: number = 0; i < Config.maxEnvelopeCount; i++) {
            envelopeSpeeds[i] = 0;
        }
        let useEnvelopeSpeed: number = Config.arpSpeedScale[instrument.envelopeSpeed];
        if (synth.isModActive(Config.modulators.dictionary["envelope speed"].index, channelIndex, instrumentIndex)) {
            useEnvelopeSpeed = Math.max(0, Math.min(Config.arpSpeedScale.length - 1, synth.getModValue(Config.modulators.dictionary["envelope speed"].index, channelIndex, instrumentIndex, false)));
            if (Number.isInteger(useEnvelopeSpeed)) {
                useEnvelopeSpeed = Config.arpSpeedScale[useEnvelopeSpeed];
            } else {
                // Linear interpolate envelope values
                useEnvelopeSpeed = ((1 - (useEnvelopeSpeed % 1)) * Config.arpSpeedScale[Math.floor(useEnvelopeSpeed)] + (useEnvelopeSpeed % 1) * Config.arpSpeedScale[Math.ceil(useEnvelopeSpeed)]);
            }
        }
        for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
            let perEnvelopeSpeed: number = instrument.envelopes[envelopeIndex].perEnvelopeSpeed;
            if (synth.isModActive(Config.modulators.dictionary["individual envelope speed"].index, channelIndex, instrumentIndex) && instrument.envelopes[envelopeIndex].tempEnvelopeSpeed != null) {
                perEnvelopeSpeed = instrument.envelopes[envelopeIndex].tempEnvelopeSpeed!;
            }
            envelopeSpeeds[envelopeIndex] = useEnvelopeSpeed * perEnvelopeSpeed;
        }
        this.envelopeComputer.computeEnvelopes(instrument, currentPart, this.envelopeTime, tickTimeStart, secondsPerTick, tone, envelopeSpeeds, this, synth, channelIndex, instrumentIndex);
        const envelopeStarts: number[] = this.envelopeComputer.envelopeStarts;
        const envelopeEnds: number[] = this.envelopeComputer.envelopeEnds;

        const usesGranular: boolean = effectsIncludeGranular(this.effects);
        const usesRingModulation: boolean = effectsIncludeRingModulation(this.effects);
        const usesDistortion: boolean = effectsIncludeDistortion(this.effects);
        const usesBitcrusher: boolean = effectsIncludeBitcrusher(this.effects);
        const usesPanning: boolean = effectsIncludePanning(this.effects);
        const usesChorus: boolean = effectsIncludeChorus(this.effects);
        const usesEcho: boolean = effectsIncludeEcho(this.effects);
        const usesReverb: boolean = effectsIncludeReverb(this.effects);

        let granularChance: number = 0;
        if (usesGranular) { //has to happen before buffer allocation
            granularChance = (instrument.grainAmounts + 1);
            this.granularMaximumGrains = instrument.grainAmounts;
            if (synth.isModActive(Config.modulators.dictionary["grain freq"].index, channelIndex, instrumentIndex)) {
                this.granularMaximumGrains = synth.getModValue(Config.modulators.dictionary["grain freq"].index, channelIndex, instrumentIndex, false);
                granularChance = (synth.getModValue(Config.modulators.dictionary["grain freq"].index, channelIndex, instrumentIndex, false) + 1);
            }
            this.granularMaximumGrains = Math.floor(Math.pow(2, this.granularMaximumGrains * envelopeStarts[EnvelopeComputeIndex.grainAmount]));
            granularChance = granularChance * envelopeStarts[EnvelopeComputeIndex.grainAmount];
        }

        this.allocateNecessaryBuffers(synth, instrument, samplesPerTick);


        if (usesGranular) {
            this.granularMix = instrument.granular / Config.granularRange;
            this.computeGrains = true;
            let granularMixEnd = this.granularMix;
            if (synth.isModActive(Config.modulators.dictionary["granular"].index, channelIndex, instrumentIndex)) {
                this.granularMix = synth.getModValue(Config.modulators.dictionary["granular"].index, channelIndex, instrumentIndex, false) / Config.granularRange;
                granularMixEnd = synth.getModValue(Config.modulators.dictionary["granular"].index, channelIndex, instrumentIndex, true) / Config.granularRange;
            }
            this.granularMix *= envelopeStarts[EnvelopeComputeIndex.granular];
            granularMixEnd *= envelopeEnds[EnvelopeComputeIndex.granular];
            this.granularMixDelta = (granularMixEnd - this.granularMix) / roundedSamplesPerTick;
            for (let iterations: number = 0; iterations < Math.ceil(Math.random() * Math.random() * 10); iterations++) { //dirty weighting toward lower numbers
                //create a grain
                if (this.granularGrainsLength < this.granularMaximumGrains && Math.random() <= granularChance) { //only create a grain if there's room and based on grainFreq
                    let granularMinGrainSizeInMilliseconds: number = instrument.grainSize;
                    if (synth.isModActive(Config.modulators.dictionary["grain size"].index, channelIndex, instrumentIndex)) {
                        granularMinGrainSizeInMilliseconds = synth.getModValue(Config.modulators.dictionary["grain size"].index, channelIndex, instrumentIndex, false);
                    }
                    granularMinGrainSizeInMilliseconds *= envelopeStarts[EnvelopeComputeIndex.grainSize];
                    let grainRange = instrument.grainRange;
                    if (synth.isModActive(Config.modulators.dictionary["grain range"].index, channelIndex, instrumentIndex)) {
                        grainRange = synth.getModValue(Config.modulators.dictionary["grain range"].index, channelIndex, instrumentIndex, false);
                    }
                    grainRange *= envelopeStarts[EnvelopeComputeIndex.grainRange];
                    const granularMaxGrainSizeInMilliseconds: number = granularMinGrainSizeInMilliseconds + grainRange;
                    const granularGrainSizeInMilliseconds: number = granularMinGrainSizeInMilliseconds + (granularMaxGrainSizeInMilliseconds - granularMinGrainSizeInMilliseconds) * Math.random();
                    const granularGrainSizeInSeconds: number = granularGrainSizeInMilliseconds / 1000.0;
                    const granularGrainSizeInSamples: number = Math.floor(granularGrainSizeInSeconds * samplesPerSecond);
                    const granularDelayLineLength: number = this.granularDelayLine!.length;
                    const grainIndex: number = this.granularGrainsLength;

                    this.granularGrainsLength++;
                    const grain: Grain = this.granularGrains[grainIndex];
                    grain.ageInSamples = 0;
                    grain.maxAgeInSamples = granularGrainSizeInSamples;
                    // const minDelayTimeInMilliseconds: number = 2;
                    // const minDelayTimeInSeconds: number = minDelayTimeInMilliseconds / 1000.0;
                    const minDelayTimeInSeconds: number = 0.02;
                    // const maxDelayTimeInSeconds: number = this.granularMaximumDelayTimeInSeconds;
                    const maxDelayTimeInSeconds: number = 2.4;
                    grain.delayLinePosition = this.usesRandomGrainLocation ? (minDelayTimeInSeconds + (maxDelayTimeInSeconds - minDelayTimeInSeconds) * Math.random() * Math.random() * samplesPerSecond) % (granularDelayLineLength - 1) : minDelayTimeInSeconds; //dirty weighting toward lower numbers ; The clamp was clumping everything at the end, so I decided to use a modulo instead
                    if (Config.granularEnvelopeType == GranularEnvelopeType.parabolic) {
                        grain.initializeParabolicEnvelope(grain.maxAgeInSamples, 1.0);
                    } else if (Config.granularEnvelopeType == GranularEnvelopeType.raisedCosineBell) {
                        grain.initializeRCBEnvelope(grain.maxAgeInSamples, 1.0);
                    }
                    // if (this.usesRandomGrainLocation) {
                    grain.addDelay(Math.random() * samplesPerTick * 4); //offset when grains begin playing ; This is different from the above delay, which delays how far back in time the grain looks for samples
                    // }
                }
            }
        }

        if (usesDistortion) {
            let useDistortionStart: number = instrument.distortion;
            let useDistortionEnd: number = instrument.distortion;

            // Check for distortion mods
            if (synth.isModActive(Config.modulators.dictionary["distortion"].index, channelIndex, instrumentIndex)) {
                useDistortionStart = synth.getModValue(Config.modulators.dictionary["distortion"].index, channelIndex, instrumentIndex, false);
                useDistortionEnd = synth.getModValue(Config.modulators.dictionary["distortion"].index, channelIndex, instrumentIndex, true);
            }

            const distortionSliderStart = Math.min(1.0, envelopeStarts[EnvelopeComputeIndex.distortion] * useDistortionStart / (Config.distortionRange - 1));
            const distortionSliderEnd = Math.min(1.0, envelopeEnds[EnvelopeComputeIndex.distortion] * useDistortionEnd / (Config.distortionRange - 1));
            const distortionStart: number = Math.pow(1.0 - 0.895 * (Math.pow(20.0, distortionSliderStart) - 1.0) / 19.0, 2.0);
            const distortionEnd: number = Math.pow(1.0 - 0.895 * (Math.pow(20.0, distortionSliderEnd) - 1.0) / 19.0, 2.0);
            const distortionDriveStart: number = (1.0 + 2.0 * distortionSliderStart) / Config.distortionBaseVolume;
            const distortionDriveEnd: number = (1.0 + 2.0 * distortionSliderEnd) / Config.distortionBaseVolume;
            this.distortion = distortionStart;
            this.distortionDelta = (distortionEnd - distortionStart) / roundedSamplesPerTick;
            this.distortionDrive = distortionDriveStart;
            this.distortionDriveDelta = (distortionDriveEnd - distortionDriveStart) / roundedSamplesPerTick;
        }

        if (usesBitcrusher) {
            let freqSettingStart: number = instrument.bitcrusherFreq * Math.sqrt(envelopeStarts[EnvelopeComputeIndex.bitcrusherFrequency]);
            let freqSettingEnd: number = instrument.bitcrusherFreq * Math.sqrt(envelopeEnds[EnvelopeComputeIndex.bitcrusherFrequency]);

            // Check for freq crush mods
            if (synth.isModActive(Config.modulators.dictionary["freq crush"].index, channelIndex, instrumentIndex)) {
                freqSettingStart = synth.getModValue(Config.modulators.dictionary["freq crush"].index, channelIndex, instrumentIndex, false) * Math.sqrt(envelopeStarts[EnvelopeComputeIndex.bitcrusherFrequency]);
                freqSettingEnd = synth.getModValue(Config.modulators.dictionary["freq crush"].index, channelIndex, instrumentIndex, true) * Math.sqrt(envelopeEnds[EnvelopeComputeIndex.bitcrusherFrequency]);
            }

            let quantizationSettingStart: number = instrument.bitcrusherQuantization * Math.sqrt(envelopeStarts[EnvelopeComputeIndex.bitcrusherQuantization]);
            let quantizationSettingEnd: number = instrument.bitcrusherQuantization * Math.sqrt(envelopeEnds[EnvelopeComputeIndex.bitcrusherQuantization]);

            // Check for bitcrush mods
            if (synth.isModActive(Config.modulators.dictionary["bit crush"].index, channelIndex, instrumentIndex)) {
                quantizationSettingStart = synth.getModValue(Config.modulators.dictionary["bit crush"].index, channelIndex, instrumentIndex, false) * Math.sqrt(envelopeStarts[EnvelopeComputeIndex.bitcrusherQuantization]);
                quantizationSettingEnd = synth.getModValue(Config.modulators.dictionary["bit crush"].index, channelIndex, instrumentIndex, true) * Math.sqrt(envelopeEnds[EnvelopeComputeIndex.bitcrusherQuantization]);
            }

            const basePitch: number = Config.keys[synth.song!.key].basePitch + (Config.pitchesPerOctave * synth.song!.octave); // TODO: What if there's a key change mid-song?
            const freqStart: number = Instrument.frequencyFromPitch(basePitch + 60) * Math.pow(2.0, (Config.bitcrusherFreqRange - 1 - freqSettingStart) * Config.bitcrusherOctaveStep);
            const freqEnd: number = Instrument.frequencyFromPitch(basePitch + 60) * Math.pow(2.0, (Config.bitcrusherFreqRange - 1 - freqSettingEnd) * Config.bitcrusherOctaveStep);
            const phaseDeltaStart: number = Math.min(1.0, freqStart / samplesPerSecond);
            const phaseDeltaEnd: number = Math.min(1.0, freqEnd / samplesPerSecond);
            this.bitcrusherPhaseDelta = phaseDeltaStart;
            this.bitcrusherPhaseDeltaScale = Math.pow(phaseDeltaEnd / phaseDeltaStart, 1.0 / roundedSamplesPerTick);

            const scaleStart: number = 2.0 * Config.bitcrusherBaseVolume * Math.pow(2.0, 1.0 - Math.pow(2.0, (Config.bitcrusherQuantizationRange - 1 - quantizationSettingStart) * 0.5));
            const scaleEnd: number = 2.0 * Config.bitcrusherBaseVolume * Math.pow(2.0, 1.0 - Math.pow(2.0, (Config.bitcrusherQuantizationRange - 1 - quantizationSettingEnd) * 0.5));
            this.bitcrusherScale = scaleStart;
            this.bitcrusherScaleScale = Math.pow(scaleEnd / scaleStart, 1.0 / roundedSamplesPerTick);

            const foldLevelStart: number = 2.0 * Config.bitcrusherBaseVolume * Math.pow(1.5, Config.bitcrusherQuantizationRange - 1 - quantizationSettingStart);
            const foldLevelEnd: number = 2.0 * Config.bitcrusherBaseVolume * Math.pow(1.5, Config.bitcrusherQuantizationRange - 1 - quantizationSettingEnd);
            this.bitcrusherFoldLevel = foldLevelStart;
            this.bitcrusherFoldLevelScale = Math.pow(foldLevelEnd / foldLevelStart, 1.0 / roundedSamplesPerTick);
        }

        let eqFilterVolume: number = 1.0; //this.envelopeComputer.lowpassCutoffDecayVolumeCompensation;
        if (instrument.eqFilterType) {
            // Simple EQ filter (old style). For analysis, using random filters from normal style since they are N/A in this context.
            const eqFilterSettingsStart: FilterSettings = instrument.eqFilter;
            if (instrument.eqSubFilters[1] == null)
                instrument.eqSubFilters[1] = new FilterSettings();
            const eqFilterSettingsEnd: FilterSettings = instrument.eqSubFilters[1];

            // Change location based on slider values
            let startSimpleFreq: number = instrument.eqFilterSimpleCut;
            let startSimpleGain: number = instrument.eqFilterSimplePeak;
            let endSimpleFreq: number = instrument.eqFilterSimpleCut;
            let endSimpleGain: number = instrument.eqFilterSimplePeak;

            let filterChanges: boolean = false;

            if (synth.isModActive(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex)) {
                startSimpleFreq = synth.getModValue(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex, false);
                endSimpleFreq = synth.getModValue(Config.modulators.dictionary["eq filt cut"].index, channelIndex, instrumentIndex, true);
                filterChanges = true;
            }
            if (synth.isModActive(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex)) {
                startSimpleGain = synth.getModValue(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex, false);
                endSimpleGain = synth.getModValue(Config.modulators.dictionary["eq filt peak"].index, channelIndex, instrumentIndex, true);
                filterChanges = true;
            }

            let startPoint: FilterControlPoint;

            if (filterChanges) {
                eqFilterSettingsStart.convertLegacySettingsForSynth(startSimpleFreq, startSimpleGain);
                eqFilterSettingsEnd.convertLegacySettingsForSynth(endSimpleFreq, endSimpleGain);

                startPoint = eqFilterSettingsStart.controlPoints[0];
                let endPoint: FilterControlPoint = eqFilterSettingsEnd.controlPoints[0];

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, 1.0, 1.0);
                endPoint.toCoefficients(Synth.tempFilterEndCoefficients, samplesPerSecond, 1.0, 1.0);

                if (this.eqFilters.length < 1) this.eqFilters[0] = new DynamicBiquadFilter();
                this.eqFilters[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);

            } else {
                eqFilterSettingsStart.convertLegacySettingsForSynth(startSimpleFreq, startSimpleGain, true);

                startPoint = eqFilterSettingsStart.controlPoints[0];

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, 1.0, 1.0);

                if (this.eqFilters.length < 1) this.eqFilters[0] = new DynamicBiquadFilter();
                this.eqFilters[0].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterStartCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);

            }

            eqFilterVolume *= startPoint.getVolumeCompensationMult();

            this.eqFilterCount = 1;
            eqFilterVolume = Math.min(3.0, eqFilterVolume);
        }
        else {
            const eqFilterSettings: FilterSettings = (instrument.tmpEqFilterStart != null) ? instrument.tmpEqFilterStart : instrument.eqFilter;
            //const eqAllFreqsEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterAllFreqs];
            //const eqAllFreqsEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterAllFreqs];
            for (let i: number = 0; i < eqFilterSettings.controlPointCount; i++) {
                //const eqFreqEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterFreq0 + i];
                //const eqFreqEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterFreq0 + i];
                //const eqPeakEnvelopeStart: number = envelopeStarts[InstrumentAutomationIndex.eqFilterGain0 + i];
                //const eqPeakEnvelopeEnd:   number = envelopeEnds[  InstrumentAutomationIndex.eqFilterGain0 + i];
                let startPoint: FilterControlPoint = eqFilterSettings.controlPoints[i];
                let endPoint: FilterControlPoint = (instrument.tmpEqFilterEnd != null && instrument.tmpEqFilterEnd.controlPoints[i] != null) ? instrument.tmpEqFilterEnd.controlPoints[i] : eqFilterSettings.controlPoints[i];

                // If switching dot type, do it all at once and do not try to interpolate since no valid interpolation exists.
                if (startPoint.type != endPoint.type) {
                    startPoint = endPoint;
                }

                startPoint.toCoefficients(Synth.tempFilterStartCoefficients, samplesPerSecond, /*eqAllFreqsEnvelopeStart * eqFreqEnvelopeStart*/ 1.0, /*eqPeakEnvelopeStart*/ 1.0);
                endPoint.toCoefficients(Synth.tempFilterEndCoefficients, samplesPerSecond, /*eqAllFreqsEnvelopeEnd   * eqFreqEnvelopeEnd*/   1.0, /*eqPeakEnvelopeEnd*/   1.0);
                if (this.eqFilters.length <= i) this.eqFilters[i] = new DynamicBiquadFilter();
                this.eqFilters[i].loadCoefficientsWithGradient(Synth.tempFilterStartCoefficients, Synth.tempFilterEndCoefficients, 1.0 / roundedSamplesPerTick, startPoint.type == FilterType.lowPass);
                eqFilterVolume *= startPoint.getVolumeCompensationMult();

            }
            this.eqFilterCount = eqFilterSettings.controlPointCount;
            eqFilterVolume = Math.min(3.0, eqFilterVolume);
        }

        const mainInstrumentVolume: number = Synth.instrumentVolumeToVolumeMult(instrument.volume);
        this.mixVolume = mainInstrumentVolume /** envelopeStarts[InstrumentAutomationIndex.mixVolume]*/;
        let mixVolumeEnd: number = mainInstrumentVolume /** envelopeEnds[  InstrumentAutomationIndex.mixVolume]*/;

        // Check for mod-related volume delta
        if (synth.isModActive(Config.modulators.dictionary["mix volume"].index, channelIndex, instrumentIndex)) {
            // Linear falloff below 0, normal volume formula above 0. Seems to work best for scaling since the normal volume mult formula has a big gap from -25 to -24.
            const startVal: number = synth.getModValue(Config.modulators.dictionary["mix volume"].index, channelIndex, instrumentIndex, false);
            const endVal: number = synth.getModValue(Config.modulators.dictionary["mix volume"].index, channelIndex, instrumentIndex, true)
            this.mixVolume *= ((startVal <= 0) ? ((startVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(startVal));
            mixVolumeEnd *= ((endVal <= 0) ? ((endVal + Config.volumeRange / 2) / (Config.volumeRange / 2)) : Synth.instrumentVolumeToVolumeMult(endVal));
        }

        // Check for SONG mod-related volume delta
        if (synth.isModActive(Config.modulators.dictionary["song volume"].index)) {
            this.mixVolume *= (synth.getModValue(Config.modulators.dictionary["song volume"].index, undefined, undefined, false)) / 100.0;
            mixVolumeEnd *= (synth.getModValue(Config.modulators.dictionary["song volume"].index, undefined, undefined, true)) / 100.0;
        }

        this.mixVolumeDelta = (mixVolumeEnd - this.mixVolume) / roundedSamplesPerTick;

        let eqFilterVolumeStart: number = eqFilterVolume;
        let eqFilterVolumeEnd: number = eqFilterVolume;
        let delayInputMultStart: number = 1.0;
        let delayInputMultEnd: number = 1.0;

        if (usesPanning) {
            const panEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.panning] * 2.0 - 1.0;
            const panEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.panning] * 2.0 - 1.0;

            let usePanStart: number = instrument.pan;
            let usePanEnd: number = instrument.pan;
            // Check for pan mods
            if (synth.isModActive(Config.modulators.dictionary["pan"].index, channelIndex, instrumentIndex)) {
                usePanStart = synth.getModValue(Config.modulators.dictionary["pan"].index, channelIndex, instrumentIndex, false);
                usePanEnd = synth.getModValue(Config.modulators.dictionary["pan"].index, channelIndex, instrumentIndex, true);
            }

            let panStart: number = Math.max(-1.0, Math.min(1.0, (usePanStart - Config.panCenter) / Config.panCenter * panEnvelopeStart));
            let panEnd: number = Math.max(-1.0, Math.min(1.0, (usePanEnd - Config.panCenter) / Config.panCenter * panEnvelopeEnd));

            const volumeStartL: number = Math.cos((1 + panStart) * Math.PI * 0.25) * 1.414;
            const volumeStartR: number = Math.cos((1 - panStart) * Math.PI * 0.25) * 1.414;
            const volumeEndL: number = Math.cos((1 + panEnd) * Math.PI * 0.25) * 1.414;
            const volumeEndR: number = Math.cos((1 - panEnd) * Math.PI * 0.25) * 1.414;
            const maxDelaySamples: number = samplesPerSecond * Config.panDelaySecondsMax;

            let usePanDelayStart: number = instrument.panDelay;
            let usePanDelayEnd: number = instrument.panDelay;
            // Check for pan delay mods
            if (synth.isModActive(Config.modulators.dictionary["pan delay"].index, channelIndex, instrumentIndex)) {
                usePanDelayStart = synth.getModValue(Config.modulators.dictionary["pan delay"].index, channelIndex, instrumentIndex, false);
                usePanDelayEnd = synth.getModValue(Config.modulators.dictionary["pan delay"].index, channelIndex, instrumentIndex, true);
            }

            const delayStart: number = panStart * usePanDelayStart * maxDelaySamples / 10;
            const delayEnd: number = panEnd * usePanDelayEnd * maxDelaySamples / 10;
            const delayStartL: number = Math.max(0.0, delayStart);
            const delayStartR: number = Math.max(0.0, -delayStart);
            const delayEndL: number = Math.max(0.0, delayEnd);
            const delayEndR: number = Math.max(0.0, -delayEnd);

            this.panningVolumeL = volumeStartL;
            this.panningVolumeR = volumeStartR;
            this.panningVolumeDeltaL = (volumeEndL - volumeStartL) / roundedSamplesPerTick;
            this.panningVolumeDeltaR = (volumeEndR - volumeStartR) / roundedSamplesPerTick;
            this.panningOffsetL = this.panningDelayPos - delayStartL + synth.panningDelayBufferSize;
            this.panningOffsetR = this.panningDelayPos - delayStartR + synth.panningDelayBufferSize;
            this.panningOffsetDeltaL = (delayEndL - delayStartL) / roundedSamplesPerTick;
            this.panningOffsetDeltaR = (delayEndR - delayStartR) / roundedSamplesPerTick;
        }

        if (usesChorus) {
            const chorusEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.chorus];
            const chorusEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.chorus];
            let useChorusStart: number = instrument.chorus;
            let useChorusEnd: number = instrument.chorus;
            // Check for chorus mods
            if (synth.isModActive(Config.modulators.dictionary["chorus"].index, channelIndex, instrumentIndex)) {
                useChorusStart = synth.getModValue(Config.modulators.dictionary["chorus"].index, channelIndex, instrumentIndex, false);
                useChorusEnd = synth.getModValue(Config.modulators.dictionary["chorus"].index, channelIndex, instrumentIndex, true);
            }

            let chorusStart: number = Math.min(1.0, chorusEnvelopeStart * useChorusStart / (Config.chorusRange - 1));
            let chorusEnd: number = Math.min(1.0, chorusEnvelopeEnd * useChorusEnd / (Config.chorusRange - 1));
            chorusStart = chorusStart * 0.6 + (Math.pow(chorusStart, 6.0)) * 0.4;
            chorusEnd = chorusEnd * 0.6 + (Math.pow(chorusEnd, 6.0)) * 0.4;
            const chorusCombinedMultStart = 1.0 / Math.sqrt(3.0 * chorusStart * chorusStart + 1.0);
            const chorusCombinedMultEnd = 1.0 / Math.sqrt(3.0 * chorusEnd * chorusEnd + 1.0);
            this.chorusVoiceMult = chorusStart;
            this.chorusVoiceMultDelta = (chorusEnd - chorusStart) / roundedSamplesPerTick;
            this.chorusCombinedMult = chorusCombinedMultStart;
            this.chorusCombinedMultDelta = (chorusCombinedMultEnd - chorusCombinedMultStart) / roundedSamplesPerTick;
        }

        if (usesRingModulation) {
            let useRingModStart: number = instrument.ringModulation;
            let useRingModEnd: number = instrument.ringModulation;

            let useRingModEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.ringModulation];
            let useRingModEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.ringModulation];

            let useRingModHzStart: number = Math.min(1.0, instrument.ringModulationHz / (Config.ringModHzRange - 1));
            let useRingModHzEnd: number = Math.min(1.0, instrument.ringModulationHz / (Config.ringModHzRange - 1));
            let useRingModHzEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.ringModulationHz];
            let useRingModHzEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.ringModulationHz];


            if (synth.isModActive(Config.modulators.dictionary["ring modulation"].index, channelIndex, instrumentIndex)) {
                useRingModStart = (synth.getModValue(Config.modulators.dictionary["ring modulation"].index, channelIndex, instrumentIndex, false));
                useRingModEnd = (synth.getModValue(Config.modulators.dictionary["ring modulation"].index, channelIndex, instrumentIndex, true));
            }
            if (synth.isModActive(Config.modulators.dictionary["ring mod hertz"].index, channelIndex, instrumentIndex)) {
                useRingModHzStart = Math.min(1.0, Math.max(0.0, (synth.getModValue(Config.modulators.dictionary["ring mod hertz"].index, channelIndex, instrumentIndex, false)) / (Config.ringModHzRange - 1)));
                useRingModHzEnd = Math.min(1.0, Math.max(0.0, (synth.getModValue(Config.modulators.dictionary["ring mod hertz"].index, channelIndex, instrumentIndex, false)) / (Config.ringModHzRange - 1)));
            }
            useRingModHzStart *= useRingModHzEnvelopeStart;
            useRingModHzEnd *= useRingModHzEnvelopeEnd;
            let ringModStart: number = Math.min(1.0, (useRingModStart * useRingModEnvelopeStart) / (Config.ringModRange - 1));
            let ringModEnd: number = Math.min(1.0, (useRingModEnd * useRingModEnvelopeEnd) / (Config.ringModRange - 1));

            this.ringModMix = ringModStart;
            this.ringModMixDelta = (ringModEnd - ringModStart) / roundedSamplesPerTick;

            this.ringModHzOffset = instrument.ringModHzOffset;

            let ringModPhaseDeltaStart = (Math.max(0, calculateRingModHertz(useRingModHzStart))) / synth.samplesPerSecond;
            let ringModPhaseDeltaEnd = (Math.max(0, calculateRingModHertz(useRingModHzEnd))) / synth.samplesPerSecond;
            
            if (useRingModHzStart < 1 / (Config.ringModHzRange - 1) || useRingModHzEnd < 1 / (Config.ringModHzRange - 1)) {
                ringModPhaseDeltaStart *= useRingModHzStart * (Config.ringModHzRange - 1);
                ringModPhaseDeltaEnd *= useRingModHzEnd * (Config.ringModHzRange - 1);
            }

            this.ringModMixFadeDelta = 0;
            if (this.ringModMixFade < 0) this.ringModMixFade = 0;
            if (ringModPhaseDeltaStart <= 0 && ringModPhaseDeltaEnd <= 0 && this.ringModMixFade != 0) {
                this.ringModMixFadeDelta = this.ringModMixFade / -40;
            } else if (ringModPhaseDeltaStart > 0 && ringModPhaseDeltaEnd > 0) {
                this.ringModMixFade = 1.0;
            }

            this.ringModPhaseDelta = ringModPhaseDeltaStart;
            this.ringModPhaseDeltaScale = ringModPhaseDeltaStart == 0 ? 1 : Math.pow(ringModPhaseDeltaEnd / ringModPhaseDeltaStart, 1.0 / roundedSamplesPerTick);

            this.ringModWaveformIndex = instrument.ringModWaveformIndex;
            this.ringModPulseWidth = instrument.ringModPulseWidth;

        }

        let maxEchoMult = 0.0;
        let averageEchoDelaySeconds: number = 0.0;
        if (usesEcho) {

            const echoSustainEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.echoSustain];
            const echoSustainEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.echoSustain];
            let useEchoSustainStart: number = instrument.echoSustain;
            let useEchoSustainEnd: number = instrument.echoSustain;
            // Check for echo mods
            if (synth.isModActive(Config.modulators.dictionary["echo"].index, channelIndex, instrumentIndex)) {
                useEchoSustainStart = Math.max(0.0, synth.getModValue(Config.modulators.dictionary["echo"].index, channelIndex, instrumentIndex, false));
                useEchoSustainEnd = Math.max(0.0, synth.getModValue(Config.modulators.dictionary["echo"].index, channelIndex, instrumentIndex, true));
            }
            const echoMultStart: number = Math.min(1.0, Math.pow(echoSustainEnvelopeStart * useEchoSustainStart / Config.echoSustainRange, 1.1)) * 0.9;
            const echoMultEnd: number = Math.min(1.0, Math.pow(echoSustainEnvelopeEnd * useEchoSustainEnd / Config.echoSustainRange, 1.1)) * 0.9;
            this.echoMult = echoMultStart;
            this.echoMultDelta = Math.max(0.0, (echoMultEnd - echoMultStart) / roundedSamplesPerTick);
            maxEchoMult = Math.max(echoMultStart, echoMultEnd);

            // TODO: After computing a tick's settings once for multiple run lengths (which is
            // good for audio worklet threads), compute the echo delay envelopes at tick (or
            // part) boundaries to interpolate between two delay taps.

            // slarmoo - I decided instead to enable and have the artifacts be part of the sound. 
            // Worst case scenario I add a toggle for if upstream it gets done differently
            const echoDelayEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.echoDelay];
            const echoDelayEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.echoDelay];
            let useEchoDelayStart: number = instrument.echoDelay * echoDelayEnvelopeStart;
            let useEchoDelayEnd: number = instrument.echoDelay * echoDelayEnvelopeEnd;
            
            // Check for echo delay mods
            if (synth.isModActive(Config.modulators.dictionary["echo delay"].index, channelIndex, instrumentIndex)) {
                useEchoDelayStart = synth.getModValue(Config.modulators.dictionary["echo delay"].index, channelIndex, instrumentIndex, false) * echoDelayEnvelopeStart;
                useEchoDelayEnd = synth.getModValue(Config.modulators.dictionary["echo delay"].index, channelIndex, instrumentIndex, true) * echoDelayEnvelopeEnd;
            }
            const tmpEchoDelayOffsetStart: number = Math.round((useEchoDelayStart + 1) * Config.echoDelayStepTicks * samplesPerTick);
            const tmpEchoDelayOffsetEnd: number = Math.round((useEchoDelayEnd + 1) * Config.echoDelayStepTicks * samplesPerTick);
            if (this.echoDelayOffsetEnd != null) {
                this.echoDelayOffsetStart = this.echoDelayOffsetEnd;
            } else {
                this.echoDelayOffsetStart = tmpEchoDelayOffsetStart;
            }

            this.echoDelayOffsetEnd = tmpEchoDelayOffsetEnd;
            averageEchoDelaySeconds = (this.echoDelayOffsetStart + this.echoDelayOffsetEnd) * 0.5 / samplesPerSecond;

            this.echoDelayOffsetRatio = 0.0;
            this.echoDelayOffsetRatioDelta = 1.0 / roundedSamplesPerTick;

            const shelfRadians: number = 2.0 * Math.PI * Config.echoShelfHz / synth.samplesPerSecond;
            Synth.tempFilterStartCoefficients.highShelf1stOrder(shelfRadians, Config.echoShelfGain);
            this.echoShelfA1 = Synth.tempFilterStartCoefficients.a[1];
            this.echoShelfB0 = Synth.tempFilterStartCoefficients.b[0];
            this.echoShelfB1 = Synth.tempFilterStartCoefficients.b[1];
        }

        let maxReverbMult = 0.0;
        if (usesReverb) {
            const reverbEnvelopeStart: number = envelopeStarts[EnvelopeComputeIndex.reverb];
            const reverbEnvelopeEnd: number = envelopeEnds[EnvelopeComputeIndex.reverb];

            let useReverbStart: number = instrument.reverb;
            let useReverbEnd: number = instrument.reverb;

            // Check for mod reverb, instrument level
            if (synth.isModActive(Config.modulators.dictionary["reverb"].index, channelIndex, instrumentIndex)) {
                useReverbStart = synth.getModValue(Config.modulators.dictionary["reverb"].index, channelIndex, instrumentIndex, false);
                useReverbEnd = synth.getModValue(Config.modulators.dictionary["reverb"].index, channelIndex, instrumentIndex, true);
            }
            // Check for mod reverb, song scalar
            if (synth.isModActive(Config.modulators.dictionary["song reverb"].index, channelIndex, instrumentIndex)) {
                useReverbStart *= (synth.getModValue(Config.modulators.dictionary["song reverb"].index, undefined, undefined, false) - Config.modulators.dictionary["song reverb"].convertRealFactor) / Config.reverbRange;
                useReverbEnd *= (synth.getModValue(Config.modulators.dictionary["song reverb"].index, undefined, undefined, true) - Config.modulators.dictionary["song reverb"].convertRealFactor) / Config.reverbRange;
            }

            const reverbStart: number = Math.min(1.0, Math.pow(reverbEnvelopeStart * useReverbStart / Config.reverbRange, 0.667)) * 0.425;
            const reverbEnd: number = Math.min(1.0, Math.pow(reverbEnvelopeEnd * useReverbEnd / Config.reverbRange, 0.667)) * 0.425;

            this.reverbMult = reverbStart;
            this.reverbMultDelta = (reverbEnd - reverbStart) / roundedSamplesPerTick;
            maxReverbMult = Math.max(reverbStart, reverbEnd);

            const shelfRadians: number = 2.0 * Math.PI * Config.reverbShelfHz / synth.samplesPerSecond;
            Synth.tempFilterStartCoefficients.highShelf1stOrder(shelfRadians, Config.reverbShelfGain);
            this.reverbShelfA1 = Synth.tempFilterStartCoefficients.a[1];
            this.reverbShelfB0 = Synth.tempFilterStartCoefficients.b[0];
            this.reverbShelfB1 = Synth.tempFilterStartCoefficients.b[1];
        }

        if (this.tonesAddedInThisTick) {
            this.attentuationProgress = 0.0;
            this.flushedSamples = 0;
            this.flushingDelayLines = false;
        } else if (!this.flushingDelayLines) {
            // If this instrument isn't playing tones anymore, the volume can fade out by the
            // end of the first tick. It's possible for filters and the panning delay line to
            // continue past the end of the tone but they should have mostly dissipated by the
            // end of the tick anyway.
            if (this.attentuationProgress == 0.0) {
                eqFilterVolumeEnd = 0.0;
            } else {
                eqFilterVolumeStart = 0.0;
                eqFilterVolumeEnd = 0.0;
            }

            const attenuationThreshold: number = 1.0 / 256.0; // when the delay line signal has attenuated this much, it should be inaudible and should be flushed to zero.
            const halfLifeMult: number = -Math.log2(attenuationThreshold);
            let delayDuration: number = 0.0;

            if (usesChorus) {
                delayDuration += Config.chorusMaxDelay;
            }

            if (usesEcho) {
                const attenuationPerSecond: number = Math.pow(maxEchoMult, 1.0 / averageEchoDelaySeconds);
                const halfLife: number = -1.0 / Math.log2(attenuationPerSecond);
                const echoDuration: number = halfLife * halfLifeMult;
                delayDuration += echoDuration;
            }

            if (usesReverb) {
                const averageMult: number = maxReverbMult * 2.0;
                const averageReverbDelaySeconds: number = (Config.reverbDelayBufferSize / 4.0) / samplesPerSecond;
                const attenuationPerSecond: number = Math.pow(averageMult, 1.0 / averageReverbDelaySeconds);
                const halfLife: number = -1.0 / Math.log2(attenuationPerSecond);
                const reverbDuration: number = halfLife * halfLifeMult;
                delayDuration += reverbDuration;
            }

            if (usesGranular) {
                this.computeGrains = false;
            }

            const secondsInTick: number = samplesPerTick / samplesPerSecond;
            const progressInTick: number = secondsInTick / delayDuration;
            const progressAtEndOfTick: number = this.attentuationProgress + progressInTick;
            if (progressAtEndOfTick >= 1.0) {
                delayInputMultEnd = 0.0;
            }

            this.attentuationProgress = progressAtEndOfTick;
            if (this.attentuationProgress >= 1.0) {
                this.flushingDelayLines = true;
            }
        } else {
            // Flushing delay lines to zero since the signal has mostly dissipated.
            eqFilterVolumeStart = 0.0;
            eqFilterVolumeEnd = 0.0;
            delayInputMultStart = 0.0;
            delayInputMultEnd = 0.0;

            let totalDelaySamples: number = 0;
            if (usesChorus) totalDelaySamples += synth.chorusDelayBufferSize;
            if (usesEcho) totalDelaySamples += this.echoDelayLineL!.length;
            if (usesReverb) totalDelaySamples += Config.reverbDelayBufferSize;
            if (usesGranular) totalDelaySamples += this.granularMaximumDelayTimeInSeconds;

            this.flushedSamples += roundedSamplesPerTick;
            if (this.flushedSamples >= totalDelaySamples) {
                this.deactivateAfterThisTick = true;
            }
        }

        this.eqFilterVolume = eqFilterVolumeStart;
        this.eqFilterVolumeDelta = (eqFilterVolumeEnd - eqFilterVolumeStart) / roundedSamplesPerTick;
        this.delayInputMult = delayInputMultStart;
        this.delayInputMultDelta = (delayInputMultEnd - delayInputMultStart) / roundedSamplesPerTick;

        this.envelopeComputer.clearEnvelopes();
    }

    public updateWaves(instrument: Instrument, samplesPerSecond: number): void {
        this.volumeScale = 1.0;
        if (instrument.type == InstrumentType.chip) {
            this.wave = (this.aliases) ? Config.rawChipWaves[instrument.chipWave].samples : Config.chipWaves[instrument.chipWave].samples;
            // advloop addition
            this.isUsingAdvancedLoopControls = instrument.isUsingAdvancedLoopControls;
            this.chipWaveLoopStart = instrument.chipWaveLoopStart;
            this.chipWaveLoopEnd = instrument.chipWaveLoopEnd;
            this.chipWaveLoopMode = instrument.chipWaveLoopMode;
            this.chipWavePlayBackwards = instrument.chipWavePlayBackwards;
            this.chipWaveStartOffset = instrument.chipWaveStartOffset;
            // advloop addition

            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.pwm) {
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.customChipWave) {
            this.wave = (this.aliases) ? instrument.customChipWave! : instrument.customChipWaveIntegral!;
            this.volumeScale = 0.05;
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.noise) {
            this.wave = getDrumWave(instrument.chipNoise, inverseRealFourierTransform, scaleElementsByFactor);
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.harmonics) {
            this.wave = this.harmonicsWave.getCustomWave(instrument.harmonicsWave, instrument.type);
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.pickedString) {
            this.wave = this.harmonicsWave.getCustomWave(instrument.harmonicsWave, instrument.type);
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.spectrum) {
            this.wave = this.spectrumWave.getCustomWave(instrument.spectrumWave, 8);
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else if (instrument.type == InstrumentType.drumset) {
            for (let i: number = 0; i < Config.drumCount; i++) {
                this.drumsetSpectrumWaves[i].getCustomWave(instrument.drumsetSpectrumWaves[i], InstrumentState._drumsetIndexToSpectrumOctave(i));
            }
            this.wave = null;
            this.unisonVoices = instrument.unisonVoices;
            this.unisonSpread = instrument.unisonSpread;
            this.unisonOffset = instrument.unisonOffset;
            this.unisonExpression = instrument.unisonExpression;
            this.unisonSign = instrument.unisonSign;
        } else {
            this.wave = null;
        }
    }

    public getDrumsetWave(pitch: number): Float32Array {
        if (this.type == InstrumentType.drumset) {
            return this.drumsetSpectrumWaves[pitch].wave!;
        } else {
            throw new Error("Unhandled instrument type in getDrumsetWave");
        }
    }

    public static drumsetIndexReferenceDelta(index: number): number {
        return Instrument.frequencyFromPitch(Config.spectrumBasePitch + index * 6) / 44100;
    }

    private static _drumsetIndexToSpectrumOctave(index: number): number {
        return 15 + Math.log2(InstrumentState.drumsetIndexReferenceDelta(index));
    }
}

