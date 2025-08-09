import { EnvelopeSettings } from './EnvelopeSettings';
import { FilterSettings } from './FilterSettings';
import { Chord, Config, CustomAlgorithm, CustomFeedBack, Dictionary, DictionaryArray, Envelope, EnvelopeType, HarmonicsWave, InstrumentType, LegacySettings, Operator, SpectrumWave, Synth, Transition, clamp } from './synth';
import { AutomationTarget, EffectType, LFOEnvelopeTypes, SustainType, Unison, Vibrato, effectsIncludeBitcrusher, effectsIncludeChord, effectsIncludeChorus, effectsIncludeDetune, effectsIncludeDiscreteSlide, effectsIncludeDistortion, effectsIncludeEcho, effectsIncludeGranular, effectsIncludeNoteFilter, effectsIncludePanning, effectsIncludePitchShift, effectsIncludeReverb, effectsIncludeRingModulation, effectsIncludeTransition, effectsIncludeVibrato, toNameMap } from './SynthConfig';
export class Instrument {
    public type: InstrumentType = InstrumentType.chip;
    public preset: number = 0;
    public chipWave: number = 2;
    // advloop addition
    public isUsingAdvancedLoopControls: boolean = false;
    public chipWaveLoopStart: number = 0;
    public chipWaveLoopEnd = Config.rawRawChipWaves[this.chipWave].samples.length - 1;
    public chipWaveLoopMode: number = 0; // 0: loop, 1: ping-pong, 2: once, 3: play loop once
    public chipWavePlayBackwards: boolean = false;
    public chipWaveStartOffset: number = 0;
    // advloop addition
    public chipNoise: number = 1;
    public eqFilter: FilterSettings = new FilterSettings();
    public eqFilterType: boolean = false;
    public eqFilterSimpleCut: number = Config.filterSimpleCutRange - 1;
    public eqFilterSimplePeak: number = 0;
    public noteFilter: FilterSettings = new FilterSettings();
    public noteFilterType: boolean = false;
    public noteFilterSimpleCut: number = Config.filterSimpleCutRange - 1;
    public noteFilterSimplePeak: number = 0;
    public eqSubFilters: (FilterSettings | null)[] = [];
    public noteSubFilters: (FilterSettings | null)[] = [];
    public tmpEqFilterStart: FilterSettings | null;
    public tmpEqFilterEnd: FilterSettings | null;
    public tmpNoteFilterStart: FilterSettings | null;
    public tmpNoteFilterEnd: FilterSettings | null;
    public envelopes: EnvelopeSettings[] = [];
    public fadeIn: number = 0;
    public fadeOut: number = Config.fadeOutNeutral;
    public envelopeCount: number = 0;
    public transition: number = Config.transitions.dictionary["normal"].index;
    public pitchShift: number = 0;
    public detune: number = 0;
    public vibrato: number = 0;
    public interval: number = 0;
    public vibratoDepth: number = 0;
    public vibratoSpeed: number = 10;
    public vibratoDelay: number = 0;
    public vibratoType: number = 0;
    public envelopeSpeed: number = 12;
    public unison: number = 0;
    public unisonVoices: number = 1;
    public unisonSpread: number = 0.0;
    public unisonOffset: number = 0.0;
    public unisonExpression: number = 1.4;
    public unisonSign: number = 1.0;
    public effects: number = 0;
    public chord: number = 1;
    public volume: number = 0;
    public pan: number = Config.panCenter;
    public panDelay: number = 0;
    public arpeggioSpeed: number = 12;
    public discreteSlide: number = 0;
    public monoChordTone: number = 0;
    public fastTwoNoteArp: boolean = false;
    public legacyTieOver: boolean = false;
    public clicklessTransition: boolean = false;
    public aliases: boolean = false;
    public pulseWidth: number = Config.pulseWidthRange;
    public decimalOffset: number = 0;
    public supersawDynamism: number = Config.supersawDynamismMax;
    public supersawSpread: number = Math.ceil(Config.supersawSpreadMax / 2.0);
    public supersawShape: number = 0;
    public stringSustain: number = 10;
    public stringSustainType: SustainType = SustainType.acoustic;
    public distortion: number = 0;
    public bitcrusherFreq: number = 0;
    public bitcrusherQuantization: number = 0;
    public ringModulation: number = Config.ringModRange >> 1;
    public ringModulationHz: number = Config.ringModHzRange >> 1;
    public ringModWaveformIndex: number = 0;
    public ringModPulseWidth: number = Config.pwmOperatorWaves.length >> 1;
    public ringModHzOffset: number = 200;
    public granular: number = 4;
    public grainSize: number = (Config.grainSizeMax - Config.grainSizeMin) / Config.grainSizeStep;
    public grainAmounts: number = Config.grainAmountsMax;
    public grainRange: number = 40;
    public chorus: number = 0;
    public reverb: number = 0;
    public echoSustain: number = 0;
    public echoDelay: number = 0;
    public algorithm: number = 0;
    public feedbackType: number = 0;
    public algorithm6Op: number = 1;
    public feedbackType6Op: number = 1;//default to not custom
    public customAlgorithm: CustomAlgorithm = new CustomAlgorithm(); //{ name: "1←4(2←5 3←6", carrierCount: 3, associatedCarrier: [1, 2, 3, 1, 2, 3], modulatedBy: [[2, 3, 4], [5], [6], [], [], []] };
    public customFeedbackType: CustomFeedBack = new CustomFeedBack(); //{ name: "1↔4 2↔5 3↔6", indices: [[3], [5], [6], [1], [2], [3]] };
    public feedbackAmplitude: number = 0;
    public customChipWave: Float32Array = new Float32Array(64);
    public customChipWaveIntegral: Float32Array = new Float32Array(65); // One extra element for wrap-around in chipSynth.
    public readonly operators: Operator[] = [];
    public readonly spectrumWave: SpectrumWave;
    public readonly harmonicsWave: HarmonicsWave = new HarmonicsWave();
    public readonly drumsetEnvelopes: number[] = [];
    public readonly drumsetSpectrumWaves: SpectrumWave[] = [];
    public modChannels: number[] = [];
    public modInstruments: number[] = [];
    public modulators: number[] = [];
    public modFilterTypes: number[] = [];
    public modEnvelopeNumbers: number[] = [];
    public invalidModulators: boolean[] = [];

    //Literally just for pitch envelopes. 
    public isNoiseInstrument: boolean = false;
    constructor(isNoiseChannel: boolean, isModChannel: boolean) {

        // @jummbus - My screed on how modulator arrays for instruments work, for the benefit of myself in the future, or whoever else.
        //
        // modulators[mod] is the index in Config.modulators to use, with "none" being the first entry.
        //
        // modChannels[mod] gives the index of a channel set for this mod. Two special values:
        //   -2 "none"
        //   -1 "song"
        //   0+ actual channel index
        //
        // modInstruments[mod] gives the index of an instrument within the channel set for this mod. Again, two special values:
        //   [0 ~ channel.instruments.length-1]     channel's instrument index
        //   channel.instruments.length             "all"
        //   channel.instruments.length+1           "active"
        //
        // modFilterTypes[mod] gives some info about the filter type: 0 is morph, 1+ is index in the dot selection array (dot 1 x, dot 1 y, dot 2 x...)
        //   0  filter morph
        //   1+ filter dot target, starting from dot 1 x and then dot 1 y, then repeating x, y for all dots in order. Note: odd values are always "x" targets, even are "y".

        if (isModChannel) {
            for (let mod: number = 0; mod < Config.modCount; mod++) {
                this.modChannels.push(-2);
                this.modInstruments.push(0);
                this.modulators.push(Config.modulators.dictionary["none"].index);
            }
        }

        this.spectrumWave = new SpectrumWave(isNoiseChannel);
        for (let i: number = 0; i < Config.operatorCount + 2; i++) {//hopefully won't break everything
            this.operators[i] = new Operator(i);
        }
        for (let i: number = 0; i < Config.drumCount; i++) {
            this.drumsetEnvelopes[i] = Config.envelopes.dictionary["twang 2"].index;
            this.drumsetSpectrumWaves[i] = new SpectrumWave(true);
        }

        for (let i = 0; i < 64; i++) {
            this.customChipWave[i] = 24 - Math.floor(i * (48 / 64));
        }

        let sum: number = 0.0;
        for (let i: number = 0; i < this.customChipWave.length; i++) {
            sum += this.customChipWave[i];
        }
        const average: number = sum / this.customChipWave.length;

        // Perform the integral on the wave. The chipSynth will perform the derivative to get the original wave back but with antialiasing.
        let cumulative: number = 0;
        let wavePrev: number = 0;
        for (let i: number = 0; i < this.customChipWave.length; i++) {
            cumulative += wavePrev;
            wavePrev = this.customChipWave[i] - average;
            this.customChipWaveIntegral[i] = cumulative;
        }

        // 65th, last sample is for anti-aliasing
        this.customChipWaveIntegral[64] = 0.0;

        //properly sets the isNoiseInstrument value
        this.isNoiseInstrument = isNoiseChannel;

    }

    public setTypeAndReset(type: InstrumentType, isNoiseChannel: boolean, isModChannel: boolean): void {
        // Mod channels are forced to one type.
        if (isModChannel) type = InstrumentType.mod;
        this.type = type;
        this.preset = type;
        this.volume = 0;
        this.effects = (1 << EffectType.panning); // Panning enabled by default in JB.
        this.chorus = Config.chorusRange - 1;
        this.reverb = 0;
        this.echoSustain = Math.floor((Config.echoSustainRange - 1) * 0.5);
        this.echoDelay = Math.floor((Config.echoDelayRange - 1) * 0.5);
        this.eqFilter.reset();
        this.eqFilterType = false;
        this.eqFilterSimpleCut = Config.filterSimpleCutRange - 1;
        this.eqFilterSimplePeak = 0;
        for (let i: number = 0; i < Config.filterMorphCount; i++) {
            this.eqSubFilters[i] = null;
            this.noteSubFilters[i] = null;
        }
        this.noteFilter.reset();
        this.noteFilterType = false;
        this.noteFilterSimpleCut = Config.filterSimpleCutRange - 1;
        this.noteFilterSimplePeak = 0;
        this.distortion = Math.floor((Config.distortionRange - 1) * 0.75);
        this.bitcrusherFreq = Math.floor((Config.bitcrusherFreqRange - 1) * 0.5)
        this.bitcrusherQuantization = Math.floor((Config.bitcrusherQuantizationRange - 1) * 0.5);
        this.ringModulation = Config.ringModRange >> 1;
        this.ringModulationHz = Config.ringModHzRange >> 1;
        this.ringModWaveformIndex = 0;
        this.ringModPulseWidth = Config.pwmOperatorWaves.length >> 1;
        this.ringModHzOffset = 200;
        this.granular = 4;
        this.grainSize = (Config.grainSizeMax - Config.grainSizeMin) / Config.grainSizeStep;
        this.grainAmounts = Config.grainAmountsMax;
        this.grainRange = 40;
        this.pan = Config.panCenter;
        this.panDelay = 0;
        this.pitchShift = Config.pitchShiftCenter;
        this.detune = Config.detuneCenter;
        this.vibrato = 0;
        this.unison = 0;
        this.stringSustain = 10;
        this.stringSustainType = Config.enableAcousticSustain ? SustainType.acoustic : SustainType.bright;
        this.clicklessTransition = false;
        this.arpeggioSpeed = 12;
        this.monoChordTone = 1;
        this.discreteSlide = 0;
        this.envelopeSpeed = 12;
        this.legacyTieOver = false;
        this.aliases = false;
        this.fadeIn = 0;
        this.fadeOut = Config.fadeOutNeutral;
        this.transition = Config.transitions.dictionary["normal"].index;
        this.envelopeCount = 0;
        this.isNoiseInstrument = isNoiseChannel;
        switch (type) {
            case InstrumentType.chip:
                this.chipWave = 2;
                // TODO: enable the chord effect? //slarmoo - My decision is no, others can if they would like though
                this.chord = Config.chords.dictionary["arpeggio"].index;
                // advloop addition
                this.isUsingAdvancedLoopControls = false;
                this.chipWaveLoopStart = 0;
                this.chipWaveLoopEnd = Config.rawRawChipWaves[this.chipWave].samples.length - 1;
                this.chipWaveLoopMode = 0;
                this.chipWavePlayBackwards = false;
                this.chipWaveStartOffset = 0;
                // advloop addition
                break;
            case InstrumentType.customChipWave:
                this.chipWave = 2;
                this.chord = Config.chords.dictionary["arpeggio"].index;
                for (let i: number = 0; i < 64; i++) {
                    this.customChipWave[i] = 24 - (Math.floor(i * (48 / 64)));
                }

                let sum: number = 0.0;
                for (let i: number = 0; i < this.customChipWave.length; i++) {
                    sum += this.customChipWave[i];
                }
                const average: number = sum / this.customChipWave.length;

                // Perform the integral on the wave. The chipSynth will perform the derivative to get the original wave back but with antialiasing.
                let cumulative: number = 0;
                let wavePrev: number = 0;
                for (let i: number = 0; i < this.customChipWave.length; i++) {
                    cumulative += wavePrev;
                    wavePrev = this.customChipWave[i] - average;
                    this.customChipWaveIntegral[i] = cumulative;
                }

                this.customChipWaveIntegral[64] = 0.0;
                break;
            case InstrumentType.fm:
                this.chord = Config.chords.dictionary["custom interval"].index;
                this.algorithm = 0;
                this.feedbackType = 0;
                this.feedbackAmplitude = 0;
                for (let i: number = 0; i < this.operators.length; i++) {
                    this.operators[i].reset(i);
                }
                break;
            case InstrumentType.fm6op:
                this.transition = 1;
                this.vibrato = 0;
                this.effects = 1;
                this.chord = 3;
                this.algorithm = 0;
                this.feedbackType = 0;
                this.algorithm6Op = 1;
                this.feedbackType6Op = 1;
                this.customAlgorithm.fromPreset(1);
                this.feedbackAmplitude = 0;
                for (let i: number = 0; i < this.operators.length; i++) {
                    this.operators[i].reset(i);
                }
                break;
            case InstrumentType.noise:
                this.chipNoise = 1;
                this.chord = Config.chords.dictionary["arpeggio"].index;
                break;
            case InstrumentType.spectrum:
                this.chord = Config.chords.dictionary["simultaneous"].index;
                this.spectrumWave.reset(isNoiseChannel);
                break;
            case InstrumentType.drumset:
                this.chord = Config.chords.dictionary["simultaneous"].index;
                for (let i: number = 0; i < Config.drumCount; i++) {
                    this.drumsetEnvelopes[i] = Config.envelopes.dictionary["twang 2"].index;
                    if (this.drumsetSpectrumWaves[i] == undefined) {
                        this.drumsetSpectrumWaves[i] = new SpectrumWave(true);
                    }
                    this.drumsetSpectrumWaves[i].reset(isNoiseChannel);
                }
                break;
            case InstrumentType.harmonics:
                this.chord = Config.chords.dictionary["simultaneous"].index;
                this.harmonicsWave.reset();
                break;
            case InstrumentType.pwm:
                this.chord = Config.chords.dictionary["arpeggio"].index;
                this.pulseWidth = Config.pulseWidthRange;
                this.decimalOffset = 0;
                break;
            case InstrumentType.pickedString:
                this.chord = Config.chords.dictionary["strum"].index;
                this.harmonicsWave.reset();
                break;
            case InstrumentType.mod:
                this.transition = 0;
                this.vibrato = 0;
                this.interval = 0;
                this.effects = 0;
                this.chord = 0;
                this.modChannels = [];
                this.modInstruments = [];
                this.modulators = [];
                for (let mod: number = 0; mod < Config.modCount; mod++) {
                    this.modChannels.push(-2);
                    this.modInstruments.push(0);
                    this.modulators.push(Config.modulators.dictionary["none"].index);
                    this.invalidModulators[mod] = false;
                    this.modFilterTypes[mod] = 0;
                    this.modEnvelopeNumbers[mod] = 0;
                }
                break;
            case InstrumentType.supersaw:
                this.chord = Config.chords.dictionary["arpeggio"].index;
                this.supersawDynamism = Config.supersawDynamismMax;
                this.supersawSpread = Math.ceil(Config.supersawSpreadMax / 2.0);
                this.supersawShape = 0;
                this.pulseWidth = Config.pulseWidthRange - 1;
                this.decimalOffset = 0;
                break;
            default:
                throw new Error("Unrecognized instrument type: " + type);
        }
        // Chip/noise instruments had arpeggio and FM had custom interval but neither
        // explicitly saved the chorus setting beforeSeven so enable it here. The effects
        // will otherwise get overridden when reading SongTagCode.startInstrument.
        if (this.chord != Config.chords.dictionary["simultaneous"].index) {
            // Enable chord if it was used.
            this.effects = (this.effects | (1 << EffectType.chord));
        }
    }

    // (only) difference for JummBox: Returns whether or not the note filter was chosen for filter conversion.
    public convertLegacySettings(legacySettings: LegacySettings, forceSimpleFilter: boolean): void {
        let legacyCutoffSetting: number | undefined = legacySettings.filterCutoff;
        let legacyResonanceSetting: number | undefined = legacySettings.filterResonance;
        let legacyFilterEnv: Envelope | undefined = legacySettings.filterEnvelope;
        let legacyPulseEnv: Envelope | undefined = legacySettings.pulseEnvelope;
        let legacyOperatorEnvelopes: Envelope[] | undefined = legacySettings.operatorEnvelopes;
        let legacyFeedbackEnv: Envelope | undefined = legacySettings.feedbackEnvelope;

        // legacy defaults:
        if (legacyCutoffSetting == undefined) legacyCutoffSetting = (this.type == InstrumentType.chip) ? 6 : 10;
        if (legacyResonanceSetting == undefined) legacyResonanceSetting = 0;
        if (legacyFilterEnv == undefined) legacyFilterEnv = Config.envelopes.dictionary["none"];
        if (legacyPulseEnv == undefined) legacyPulseEnv = Config.envelopes.dictionary[(this.type == InstrumentType.pwm) ? "twang 2" : "none"];
        if (legacyOperatorEnvelopes == undefined) legacyOperatorEnvelopes = [Config.envelopes.dictionary[(this.type == InstrumentType.fm) ? "note size" : "none"], Config.envelopes.dictionary["none"], Config.envelopes.dictionary["none"], Config.envelopes.dictionary["none"]];
        if (legacyFeedbackEnv == undefined) legacyFeedbackEnv = Config.envelopes.dictionary["none"];

        // The "punch" envelope is special: it goes *above* the chosen cutoff. But if the cutoff was already at the max, it couldn't go any higher... except in the current version of BeepBox I raised the max cutoff so it *can* but then it sounds different, so to preserve the original sound let's just remove the punch envelope.
        const legacyFilterCutoffRange: number = 11;
        const cutoffAtMax: boolean = (legacyCutoffSetting == legacyFilterCutoffRange - 1);
        if (cutoffAtMax && legacyFilterEnv.type == EnvelopeType.punch) legacyFilterEnv = Config.envelopes.dictionary["none"];

        const carrierCount: number = Config.algorithms[this.algorithm].carrierCount;
        let noCarriersControlledByNoteSize: boolean = true;
        let allCarriersControlledByNoteSize: boolean = true;
        let noteSizeControlsSomethingElse: boolean = (legacyFilterEnv.type == EnvelopeType.noteSize) || (legacyPulseEnv.type == EnvelopeType.noteSize);
        if (this.type == InstrumentType.fm || this.type == InstrumentType.fm6op) {
            noteSizeControlsSomethingElse = noteSizeControlsSomethingElse || (legacyFeedbackEnv.type == EnvelopeType.noteSize);
            for (let i: number = 0; i < legacyOperatorEnvelopes.length; i++) {
                if (i < carrierCount) {
                    if (legacyOperatorEnvelopes[i].type != EnvelopeType.noteSize) {
                        allCarriersControlledByNoteSize = false;
                    } else {
                        noCarriersControlledByNoteSize = false;
                    }
                } else {
                    noteSizeControlsSomethingElse = noteSizeControlsSomethingElse || (legacyOperatorEnvelopes[i].type == EnvelopeType.noteSize);
                }
            }
        }

        this.envelopeCount = 0;

        if (this.type == InstrumentType.fm || this.type == InstrumentType.fm6op) {
            if (allCarriersControlledByNoteSize && noteSizeControlsSomethingElse) {
                this.addEnvelope(Config.instrumentAutomationTargets.dictionary["noteVolume"].index, 0, Config.envelopes.dictionary["note size"].index, false);
            } else if (noCarriersControlledByNoteSize && !noteSizeControlsSomethingElse) {
                this.addEnvelope(Config.instrumentAutomationTargets.dictionary["none"].index, 0, Config.envelopes.dictionary["note size"].index, false);
            }
        }

        if (legacyFilterEnv.type == EnvelopeType.none) {
            this.noteFilter.reset();
            this.noteFilterType = false;
            this.eqFilter.convertLegacySettings(legacyCutoffSetting, legacyResonanceSetting, legacyFilterEnv);
            this.effects &= ~(1 << EffectType.noteFilter);
            if (forceSimpleFilter || this.eqFilterType) {
                this.eqFilterType = true;
                this.eqFilterSimpleCut = legacyCutoffSetting;
                this.eqFilterSimplePeak = legacyResonanceSetting;
            }
        } else {
            this.eqFilter.reset();

            this.eqFilterType = false;
            this.noteFilterType = false;
            this.noteFilter.convertLegacySettings(legacyCutoffSetting, legacyResonanceSetting, legacyFilterEnv);
            this.effects |= 1 << EffectType.noteFilter;
            this.addEnvelope(Config.instrumentAutomationTargets.dictionary["noteFilterAllFreqs"].index, 0, legacyFilterEnv.index, false);
            if (forceSimpleFilter || this.noteFilterType) {
                this.noteFilterType = true;
                this.noteFilterSimpleCut = legacyCutoffSetting;
                this.noteFilterSimplePeak = legacyResonanceSetting;
            }
        }

        if (legacyPulseEnv.type != EnvelopeType.none) {
            this.addEnvelope(Config.instrumentAutomationTargets.dictionary["pulseWidth"].index, 0, legacyPulseEnv.index, false);
        }

        for (let i: number = 0; i < legacyOperatorEnvelopes.length; i++) {
            if (i < carrierCount && allCarriersControlledByNoteSize) continue;
            if (legacyOperatorEnvelopes[i].type != EnvelopeType.none) {
                this.addEnvelope(Config.instrumentAutomationTargets.dictionary["operatorAmplitude"].index, i, legacyOperatorEnvelopes[i].index, false);
            }
        }

        if (legacyFeedbackEnv.type != EnvelopeType.none) {
            this.addEnvelope(Config.instrumentAutomationTargets.dictionary["feedbackAmplitude"].index, 0, legacyFeedbackEnv.index, false);
        }
    }

    public toJsonObject(): Object {
        const instrumentObject: any = {
            "type": Config.instrumentTypeNames[this.type],
            "volume": this.volume,
            "eqFilter": this.eqFilter.toJsonObject(),
            "eqFilterType": this.eqFilterType,
            "eqSimpleCut": this.eqFilterSimpleCut,
            "eqSimplePeak": this.eqFilterSimplePeak,
            "envelopeSpeed": this.envelopeSpeed
        };

        if (this.preset != this.type) {
            instrumentObject["preset"] = this.preset;
        }

        for (let i: number = 0; i < Config.filterMorphCount; i++) {
            if (this.eqSubFilters[i] != null)
                instrumentObject["eqSubFilters" + i] = this.eqSubFilters[i]!.toJsonObject();
        }

        const effects: string[] = [];
        for (const effect of Config.effectOrder) {
            if (this.effects & (1 << effect)) {
                effects.push(Config.effectNames[effect]);
            }
        }
        instrumentObject["effects"] = effects;


        if (effectsIncludeTransition(this.effects)) {
            instrumentObject["transition"] = Config.transitions[this.transition].name;
            instrumentObject["clicklessTransition"] = this.clicklessTransition;
        }
        if (effectsIncludeDiscreteSlide(this.effects)) {
            instrumentObject["discreteSlide"] = Config.discreteSlideTypes[this.discreteSlide].name;
        }
        if (effectsIncludeChord(this.effects)) {
            instrumentObject["chord"] = this.getChord().name;
            instrumentObject["fastTwoNoteArp"] = this.fastTwoNoteArp;
            instrumentObject["arpeggioSpeed"] = this.arpeggioSpeed;
            instrumentObject["monoChordTone"] = this.monoChordTone;
        }
        if (effectsIncludePitchShift(this.effects)) {
            instrumentObject["pitchShiftSemitones"] = this.pitchShift;
        }
        if (effectsIncludeDetune(this.effects)) {
            instrumentObject["detuneCents"] = Synth.detuneToCents(this.detune);
        }
        if (effectsIncludeVibrato(this.effects)) {
            if (this.vibrato == -1) {
                this.vibrato = 5;
            }
            if (this.vibrato != 5) {
                instrumentObject["vibrato"] = Config.vibratos[this.vibrato].name;
            } else {
                instrumentObject["vibrato"] = "custom";
            }
            instrumentObject["vibratoDepth"] = this.vibratoDepth;
            instrumentObject["vibratoDelay"] = this.vibratoDelay;
            instrumentObject["vibratoSpeed"] = this.vibratoSpeed;
            instrumentObject["vibratoType"] = this.vibratoType;
        }
        if (effectsIncludeNoteFilter(this.effects)) {
            instrumentObject["noteFilterType"] = this.noteFilterType;
            instrumentObject["noteSimpleCut"] = this.noteFilterSimpleCut;
            instrumentObject["noteSimplePeak"] = this.noteFilterSimplePeak;
            instrumentObject["noteFilter"] = this.noteFilter.toJsonObject();

            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                if (this.noteSubFilters[i] != null)
                    instrumentObject["noteSubFilters" + i] = this.noteSubFilters[i]!.toJsonObject();
            }
        }
        if (effectsIncludeGranular(this.effects)) {
            instrumentObject["granular"] = this.granular;
            instrumentObject["grainSize"] = this.grainSize;
            instrumentObject["grainAmounts"] = this.grainAmounts;
            instrumentObject["grainRange"] = this.grainRange;
        }
        if (effectsIncludeRingModulation(this.effects)) {
            instrumentObject["ringMod"] = Math.round(100 * this.ringModulation / (Config.ringModRange - 1));
            instrumentObject["ringModHz"] = Math.round(100 * this.ringModulationHz / (Config.ringModHzRange - 1));
            instrumentObject["ringModWaveformIndex"] = this.ringModWaveformIndex;
            instrumentObject["ringModPulseWidth"] = Math.round(100 * this.ringModPulseWidth / (Config.pulseWidthRange - 1));
            instrumentObject["ringModHzOffset"] = Math.round(100 * this.ringModHzOffset / (Config.rmHzOffsetMax));
        }
        if (effectsIncludeDistortion(this.effects)) {
            instrumentObject["distortion"] = Math.round(100 * this.distortion / (Config.distortionRange - 1));
            instrumentObject["aliases"] = this.aliases;
        }
        if (effectsIncludeBitcrusher(this.effects)) {
            instrumentObject["bitcrusherOctave"] = (Config.bitcrusherFreqRange - 1 - this.bitcrusherFreq) * Config.bitcrusherOctaveStep;
            instrumentObject["bitcrusherQuantization"] = Math.round(100 * this.bitcrusherQuantization / (Config.bitcrusherQuantizationRange - 1));
        }
        if (effectsIncludePanning(this.effects)) {
            instrumentObject["pan"] = Math.round(100 * (this.pan - Config.panCenter) / Config.panCenter);
            instrumentObject["panDelay"] = this.panDelay;
        }
        if (effectsIncludeChorus(this.effects)) {
            instrumentObject["chorus"] = Math.round(100 * this.chorus / (Config.chorusRange - 1));
        }
        if (effectsIncludeEcho(this.effects)) {
            instrumentObject["echoSustain"] = Math.round(100 * this.echoSustain / (Config.echoSustainRange - 1));
            instrumentObject["echoDelayBeats"] = Math.round(1000 * (this.echoDelay + 1) * Config.echoDelayStepTicks / (Config.ticksPerPart * Config.partsPerBeat)) / 1000;
        }
        if (effectsIncludeReverb(this.effects)) {
            instrumentObject["reverb"] = Math.round(100 * this.reverb / (Config.reverbRange - 1));
        }

        if (this.type != InstrumentType.drumset) {
            instrumentObject["fadeInSeconds"] = Math.round(10000 * Synth.fadeInSettingToSeconds(this.fadeIn)) / 10000;
            instrumentObject["fadeOutTicks"] = Synth.fadeOutSettingToTicks(this.fadeOut);
        }

        if (this.type == InstrumentType.harmonics || this.type == InstrumentType.pickedString) {
            instrumentObject["harmonics"] = [];
            for (let i: number = 0; i < Config.harmonicsControlPoints; i++) {
                instrumentObject["harmonics"][i] = Math.round(100 * this.harmonicsWave.harmonics[i] / Config.harmonicsMax);
            }
        }

        if (this.type == InstrumentType.noise) {
            instrumentObject["wave"] = Config.chipNoises[this.chipNoise].name;
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
        } else if (this.type == InstrumentType.spectrum) {
            instrumentObject["spectrum"] = [];
            for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                instrumentObject["spectrum"][i] = Math.round(100 * this.spectrumWave.spectrum[i] / Config.spectrumMax);
            }
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
        } else if (this.type == InstrumentType.drumset) {
            instrumentObject["drums"] = [];
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
            for (let j: number = 0; j < Config.drumCount; j++) {
                const spectrum: number[] = [];
                for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                    spectrum[i] = Math.round(100 * this.drumsetSpectrumWaves[j].spectrum[i] / Config.spectrumMax);
                }
                instrumentObject["drums"][j] = {
                    "filterEnvelope": this.getDrumsetEnvelope(j).name,
                    "spectrum": spectrum,
                };
            }
        } else if (this.type == InstrumentType.chip) {
            instrumentObject["wave"] = Config.chipWaves[this.chipWave].name;
            // should this unison pushing code be turned into a function..?
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            // these don't need to be pushed if custom unisons aren't being used
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }

            // advloop addition
            instrumentObject["isUsingAdvancedLoopControls"] = this.isUsingAdvancedLoopControls;
            instrumentObject["chipWaveLoopStart"] = this.chipWaveLoopStart;
            instrumentObject["chipWaveLoopEnd"] = this.chipWaveLoopEnd;
            instrumentObject["chipWaveLoopMode"] = this.chipWaveLoopMode;
            instrumentObject["chipWavePlayBackwards"] = this.chipWavePlayBackwards;
            instrumentObject["chipWaveStartOffset"] = this.chipWaveStartOffset;
            // advloop addition
        } else if (this.type == InstrumentType.pwm) {
            instrumentObject["pulseWidth"] = this.pulseWidth;
            instrumentObject["decimalOffset"] = this.decimalOffset;
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
        } else if (this.type == InstrumentType.supersaw) {
            instrumentObject["pulseWidth"] = this.pulseWidth;
            instrumentObject["decimalOffset"] = this.decimalOffset;
            instrumentObject["dynamism"] = Math.round(100 * this.supersawDynamism / Config.supersawDynamismMax);
            instrumentObject["spread"] = Math.round(100 * this.supersawSpread / Config.supersawSpreadMax);
            instrumentObject["shape"] = Math.round(100 * this.supersawShape / Config.supersawShapeMax);
        } else if (this.type == InstrumentType.pickedString) {
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
            instrumentObject["stringSustain"] = Math.round(100 * this.stringSustain / (Config.stringSustainRange - 1));
            if (Config.enableAcousticSustain) {
                instrumentObject["stringSustainType"] = Config.sustainTypeNames[this.stringSustainType];
            }
        } else if (this.type == InstrumentType.harmonics) {
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
        } else if (this.type == InstrumentType.fm || this.type == InstrumentType.fm6op) {
            const operatorArray: Object[] = [];
            for (const operator of this.operators) {
                operatorArray.push({
                    "frequency": Config.operatorFrequencies[operator.frequency].name,
                    "amplitude": operator.amplitude,
                    "waveform": Config.operatorWaves[operator.waveform].name,
                    "pulseWidth": operator.pulseWidth,
                });
            }
            if (this.type == InstrumentType.fm) {
                instrumentObject["algorithm"] = Config.algorithms[this.algorithm].name;
                instrumentObject["feedbackType"] = Config.feedbacks[this.feedbackType].name;
                instrumentObject["feedbackAmplitude"] = this.feedbackAmplitude;
                instrumentObject["operators"] = operatorArray;
            } else {
                instrumentObject["algorithm"] = Config.algorithms6Op[this.algorithm6Op].name;
                instrumentObject["feedbackType"] = Config.feedbacks6Op[this.feedbackType6Op].name;
                instrumentObject["feedbackAmplitude"] = this.feedbackAmplitude;
                if (this.algorithm6Op == 0) {
                    const customAlgorithm: any = {};
                    customAlgorithm["mods"] = this.customAlgorithm.modulatedBy;
                    customAlgorithm["carrierCount"] = this.customAlgorithm.carrierCount;
                    instrumentObject["customAlgorithm"] = customAlgorithm;
                }
                if (this.feedbackType6Op == 0) {
                    const customFeedback: any = {};
                    customFeedback["mods"] = this.customFeedbackType.indices;
                    instrumentObject["customFeedback"] = customFeedback;
                }

                instrumentObject["operators"] = operatorArray;
            }
        } else if (this.type == InstrumentType.customChipWave) {
            instrumentObject["wave"] = Config.chipWaves[this.chipWave].name;
            instrumentObject["unison"] = this.unison == Config.unisons.length ? "custom" : Config.unisons[this.unison].name;
            if (this.unison == Config.unisons.length) {
                instrumentObject["unisonVoices"] = this.unisonVoices;
                instrumentObject["unisonSpread"] = this.unisonSpread;
                instrumentObject["unisonOffset"] = this.unisonOffset;
                instrumentObject["unisonExpression"] = this.unisonExpression;
                instrumentObject["unisonSign"] = this.unisonSign;
            }
            instrumentObject["customChipWave"] = new Float64Array(64);
            instrumentObject["customChipWaveIntegral"] = new Float64Array(65);
            for (let i: number = 0; i < this.customChipWave.length; i++) {
                instrumentObject["customChipWave"][i] = this.customChipWave[i];
                // Meh, waste of space and can be inaccurate. It will be recalc'ed when instrument loads.
                //instrumentObject["customChipWaveIntegral"][i] = this.customChipWaveIntegral[i];
            }
        } else if (this.type == InstrumentType.mod) {
            instrumentObject["modChannels"] = [];
            instrumentObject["modInstruments"] = [];
            instrumentObject["modSettings"] = [];
            instrumentObject["modFilterTypes"] = [];
            instrumentObject["modEnvelopeNumbers"] = [];
            for (let mod: number = 0; mod < Config.modCount; mod++) {
                instrumentObject["modChannels"][mod] = this.modChannels[mod];
                instrumentObject["modInstruments"][mod] = this.modInstruments[mod];
                instrumentObject["modSettings"][mod] = this.modulators[mod];
                instrumentObject["modFilterTypes"][mod] = this.modFilterTypes[mod];
                instrumentObject["modEnvelopeNumbers"][mod] = this.modEnvelopeNumbers[mod];
            }
        } else {
            throw new Error("Unrecognized instrument type");
        }

        const envelopes: any[] = [];
        for (let i = 0; i < this.envelopeCount; i++) {
            envelopes.push(this.envelopes[i].toJsonObject());
        }
        instrumentObject["envelopes"] = envelopes;

        return instrumentObject;
    }


    public fromJsonObject(instrumentObject: any, isNoiseChannel: boolean, isModChannel: boolean, useSlowerRhythm: boolean, useFastTwoNoteArp: boolean, legacyGlobalReverb: number = 0, jsonFormat: string = Config.jsonFormat): void {
        if (instrumentObject == undefined) instrumentObject = {};

        const format: string = jsonFormat.toLowerCase();

        let type: InstrumentType = Config.instrumentTypeNames.indexOf(instrumentObject["type"]);
        // SynthBox support
        if ((format == "synthbox") && (instrumentObject["type"] == "FM")) type = Config.instrumentTypeNames.indexOf("FM6op");
        if (<any>type == -1) type = isModChannel ? InstrumentType.mod : (isNoiseChannel ? InstrumentType.noise : InstrumentType.chip);
        this.setTypeAndReset(type, isNoiseChannel, isModChannel);

        this.effects &= ~(1 << EffectType.panning);

        if (instrumentObject["preset"] != undefined) {
            this.preset = instrumentObject["preset"] >>> 0;
        }

        if (instrumentObject["volume"] != undefined) {
            if (format == "jummbox" || format == "midbox" || format == "synthbox" || format == "goldbox" || format == "paandorasbox" || format == "ultrabox" || format == "slarmoosbox") {
                this.volume = clamp(-Config.volumeRange / 2, (Config.volumeRange / 2) + 1, instrumentObject["volume"] | 0);
            } else {
                this.volume = Math.round(-clamp(0, 8, Math.round(5 - (instrumentObject["volume"] | 0) / 20)) * 25.0 / 7.0);
            }
        } else {
            this.volume = 0;
        }

        //These can probably be condensed with ternary operators
        this.envelopeSpeed = instrumentObject["envelopeSpeed"] != undefined ? clamp(0, Config.modulators.dictionary["envelope speed"].maxRawVol + 1, instrumentObject["envelopeSpeed"] | 0) : 12;

        if (Array.isArray(instrumentObject["effects"])) {
            let effects: number = 0;
            for (let i: number = 0; i < instrumentObject["effects"].length; i++) {
                effects = effects | (1 << Config.effectNames.indexOf(instrumentObject["effects"][i]));
            }
            this.effects = (effects & ((1 << EffectType.length) - 1));
        } else {
            // The index of these names is reinterpreted as a bitfield, which relies on reverb and chorus being the first effects!
            const legacyEffectsNames: string[] = ["none", "reverb", "chorus", "chorus & reverb"];
            this.effects = legacyEffectsNames.indexOf(instrumentObject["effects"]);
            if (this.effects == -1) this.effects = (this.type == InstrumentType.noise) ? 0 : 1;
        }

        this.transition = Config.transitions.dictionary["normal"].index; // default value.
        const transitionProperty: any = instrumentObject["transition"] || instrumentObject["envelope"]; // the transition property used to be called envelope, so check that too.
        if (transitionProperty != undefined) {
            let transition: Transition | undefined = Config.transitions.dictionary[transitionProperty];
            if (instrumentObject["fadeInSeconds"] == undefined || instrumentObject["fadeOutTicks"] == undefined) {
                const legacySettings = (<any>{
                    "binary": { transition: "interrupt", fadeInSeconds: 0.0, fadeOutTicks: -1 },
                    "seamless": { transition: "interrupt", fadeInSeconds: 0.0, fadeOutTicks: -1 },
                    "sudden": { transition: "normal", fadeInSeconds: 0.0, fadeOutTicks: -3 },
                    "hard": { transition: "normal", fadeInSeconds: 0.0, fadeOutTicks: -3 },
                    "smooth": { transition: "normal", fadeInSeconds: 0.025, fadeOutTicks: -3 },
                    "soft": { transition: "normal", fadeInSeconds: 0.025, fadeOutTicks: -3 },
                    // Note that the old slide transition has the same name as a new slide transition that is different.
                    // Only apply legacy settings if the instrument JSON was created before, based on the presence
                    // of the fade in/out fields.
                    "slide": { transition: "slide in pattern", fadeInSeconds: 0.025, fadeOutTicks: -3 },
                    "cross fade": { transition: "normal", fadeInSeconds: 0.04, fadeOutTicks: 6 },
                    "hard fade": { transition: "normal", fadeInSeconds: 0.0, fadeOutTicks: 48 },
                    "medium fade": { transition: "normal", fadeInSeconds: 0.0125, fadeOutTicks: 72 },
                    "soft fade": { transition: "normal", fadeInSeconds: 0.06, fadeOutTicks: 96 },
                })[transitionProperty];
                if (legacySettings != undefined) {
                    transition = Config.transitions.dictionary[legacySettings.transition];
                    // These may be overridden below.
                    this.fadeIn = Synth.secondsToFadeInSetting(legacySettings.fadeInSeconds);
                    this.fadeOut = Synth.ticksToFadeOutSetting(legacySettings.fadeOutTicks);
                }
            }
            if (transition != undefined) this.transition = transition.index;

            if (this.transition != Config.transitions.dictionary["normal"].index) {
                // Enable transition if it was used.
                this.effects = (this.effects | (1 << EffectType.transition));
            }
        }
        if (effectsIncludeDiscreteSlide(this.effects)) {
            if (instrumentObject["discreteSlide"] != undefined) {
                const discreteSlideName: any = instrumentObject["discreteSlide"];
                const discreteSlideIndex = Config.discreteSlideTypes.findIndex((t: { name: any; }) => t.name == discreteSlideName);
                if (discreteSlideIndex != -1) this.discreteSlide = discreteSlideIndex;
            }
        }
        // Overrides legacy settings in transition above.
        if (instrumentObject["fadeInSeconds"] != undefined) {
            this.fadeIn = Synth.secondsToFadeInSetting(+instrumentObject["fadeInSeconds"]);
        }
        if (instrumentObject["fadeOutTicks"] != undefined) {
            this.fadeOut = Synth.ticksToFadeOutSetting(+instrumentObject["fadeOutTicks"]);
        }

        {
            // Note that the chord setting may be overridden by instrumentObject["chorus"] below.
            const chordProperty: any = instrumentObject["chord"];
            const legacyChordNames: Dictionary<string> = { "harmony": "simultaneous" };
            const chord: Chord | undefined = Config.chords.dictionary[legacyChordNames[chordProperty]] || Config.chords.dictionary[chordProperty];
            if (chord != undefined) {
                this.chord = chord.index;
            } else {
                // Different instruments have different default chord types based on historical behaviour.
                if (this.type == InstrumentType.noise) {
                    this.chord = Config.chords.dictionary["arpeggio"].index;
                } else if (this.type == InstrumentType.pickedString) {
                    this.chord = Config.chords.dictionary["strum"].index;
                } else if (this.type == InstrumentType.chip) {
                    this.chord = Config.chords.dictionary["arpeggio"].index;
                } else if (this.type == InstrumentType.fm || this.type == InstrumentType.fm6op) {
                    this.chord = Config.chords.dictionary["custom interval"].index;
                } else {
                    this.chord = Config.chords.dictionary["simultaneous"].index;
                }
            }
        }

        this.unison = Config.unisons.dictionary["none"].index; // default value.
        const unisonProperty: any = instrumentObject["unison"] || instrumentObject["interval"] || instrumentObject["chorus"]; // The unison property has gone by various names in the past.
        if (unisonProperty != undefined) {
            const legacyChorusNames: Dictionary<string> = { "union": "none", "fifths": "fifth", "octaves": "octave", "error": "voiced" };
            const unison: Unison | undefined = Config.unisons.dictionary[legacyChorusNames[unisonProperty]] || Config.unisons.dictionary[unisonProperty];
            if (unison != undefined) this.unison = unison.index;
            if (unisonProperty == "custom") this.unison = Config.unisons.length;
        }
        //clamp these???
        this.unisonVoices = (instrumentObject["unisonVoices"] == undefined) ? Config.unisons[this.unison].voices : instrumentObject["unisonVoices"];
        this.unisonSpread = (instrumentObject["unisonSpread"] == undefined) ? Config.unisons[this.unison].spread : instrumentObject["unisonSpread"];
        this.unisonOffset = (instrumentObject["unisonOffset"] == undefined) ? Config.unisons[this.unison].offset : instrumentObject["unisonOffset"];
        this.unisonExpression = (instrumentObject["unisonExpression"] == undefined) ? Config.unisons[this.unison].expression : instrumentObject["unisonExpression"];
        this.unisonSign = (instrumentObject["unisonSign"] == undefined) ? Config.unisons[this.unison].sign : instrumentObject["unisonSign"];

        if (instrumentObject["chorus"] == "custom harmony") {
            // The original chorus setting had an option that now maps to two different settings. Override those if necessary.
            this.unison = Config.unisons.dictionary["hum"].index;
            this.chord = Config.chords.dictionary["custom interval"].index;
        }
        if (this.chord != Config.chords.dictionary["simultaneous"].index && !Array.isArray(instrumentObject["effects"])) {
            // Enable chord if it was used.
            this.effects = (this.effects | (1 << EffectType.chord));
        }

        if (instrumentObject["pitchShiftSemitones"] != undefined) {
            this.pitchShift = clamp(0, Config.pitchShiftRange, Math.round(+instrumentObject["pitchShiftSemitones"]));
        }
        // modbox pitch shift, known in that mod as "octave offset"
        if (instrumentObject["octoff"] != undefined) {
            let potentialPitchShift: string = instrumentObject["octoff"];
            this.effects = (this.effects | (1 << EffectType.pitchShift));

            if ((potentialPitchShift == "+1 (octave)") || (potentialPitchShift == "+2 (2 octaves)")) {
                this.pitchShift = 24;
            } else if ((potentialPitchShift == "+1/2 (fifth)") || (potentialPitchShift == "+1 1/2 (octave and fifth)")) {
                this.pitchShift = 18;
            } else if ((potentialPitchShift == "-1 (octave)") || (potentialPitchShift == "-2 (2 octaves")) { //this typo is in modbox
                this.pitchShift = 0;
            } else if ((potentialPitchShift == "-1/2 (fifth)") || (potentialPitchShift == "-1 1/2 (octave and fifth)")) {
                this.pitchShift = 6;
            } else {
                this.pitchShift = 12;
            }
        }
        if (instrumentObject["detuneCents"] != undefined) {
            this.detune = clamp(Config.detuneMin, Config.detuneMax + 1, Math.round(Synth.centsToDetune(+instrumentObject["detuneCents"])));
        }

        this.vibrato = Config.vibratos.dictionary["none"].index; // default value.
        const vibratoProperty: any = instrumentObject["vibrato"] || instrumentObject["effect"]; // The vibrato property was previously called "effect", not to be confused with the current "effects".
        if (vibratoProperty != undefined) {

            const legacyVibratoNames: Dictionary<string> = { "vibrato light": "light", "vibrato delayed": "delayed", "vibrato heavy": "heavy" };
            const vibrato: Vibrato | undefined = Config.vibratos.dictionary[legacyVibratoNames[unisonProperty]] || Config.vibratos.dictionary[vibratoProperty];
            if (vibrato != undefined)
                this.vibrato = vibrato.index;
            else if (vibratoProperty == "custom")
                this.vibrato = Config.vibratos.length; // custom

            if (this.vibrato == Config.vibratos.length) {
                this.vibratoDepth = instrumentObject["vibratoDepth"];
                this.vibratoSpeed = instrumentObject["vibratoSpeed"];
                this.vibratoDelay = instrumentObject["vibratoDelay"];
                this.vibratoType = instrumentObject["vibratoType"];
            }
            else { // Set defaults for the vibrato profile
                this.vibratoDepth = Config.vibratos[this.vibrato].amplitude;
                this.vibratoDelay = Config.vibratos[this.vibrato].delayTicks / 2;
                this.vibratoSpeed = 10; // default;
                this.vibratoType = Config.vibratos[this.vibrato].type;
            }

            // Old songs may have a vibrato effect without explicitly enabling it.
            if (vibrato != Config.vibratos.dictionary["none"]) {
                this.effects = (this.effects | (1 << EffectType.vibrato));
            }
        }

        if (instrumentObject["pan"] != undefined) {
            this.pan = clamp(0, Config.panMax + 1, Math.round(Config.panCenter + (instrumentObject["pan"] | 0) * Config.panCenter / 100));
        } else if (instrumentObject["ipan"] != undefined) {
            // support for modbox fixed
            this.pan = clamp(0, Config.panMax + 1, Config.panCenter + (instrumentObject["ipan"] * -50));
        } else {
            this.pan = Config.panCenter;
        }

        // Old songs may have a panning effect without explicitly enabling it.
        if (this.pan != Config.panCenter) {
            this.effects = (this.effects | (1 << EffectType.panning));
        }

        if (instrumentObject["panDelay"] != undefined) {
            this.panDelay = (instrumentObject["panDelay"] | 0);
        } else {
            this.panDelay = 0;
        }

        if (instrumentObject["detune"] != undefined) {
            this.detune = clamp(Config.detuneMin, Config.detuneMax + 1, (instrumentObject["detune"] | 0));
        }
        else if (instrumentObject["detuneCents"] == undefined) {
            this.detune = Config.detuneCenter;
        }

        if (instrumentObject["ringMod"] != undefined) {
            this.ringModulation = clamp(0, Config.ringModRange, Math.round((Config.ringModRange - 1) * (instrumentObject["ringMod"] | 0) / 100));
        }
        if (instrumentObject["ringModHz"] != undefined) {
            this.ringModulationHz = clamp(0, Config.ringModHzRange, Math.round((Config.ringModHzRange - 1) * (instrumentObject["ringModHz"] | 0) / 100));
        }
        if (instrumentObject["ringModWaveformIndex"] != undefined) {
            this.ringModWaveformIndex = clamp(0, Config.operatorWaves.length, instrumentObject["ringModWaveformIndex"]);
        }
        if (instrumentObject["ringModPulseWidth"] != undefined) {
            this.ringModPulseWidth = clamp(0, Config.pulseWidthRange, Math.round((Config.pulseWidthRange - 1) * (instrumentObject["ringModPulseWidth"] | 0) / 100));
        }
        if (instrumentObject["ringModHzOffset"] != undefined) {
            this.ringModHzOffset = clamp(0, Config.rmHzOffsetMax, Math.round((Config.rmHzOffsetMax - 1) * (instrumentObject["ringModHzOffset"] | 0) / 100));
        }

        if (instrumentObject["granular"] != undefined) {
            this.granular = instrumentObject["granular"];
        }
        if (instrumentObject["grainSize"] != undefined) {
            this.grainSize = instrumentObject["grainSize"];
        }
        if (instrumentObject["grainAmounts"] != undefined) {
            this.grainAmounts = instrumentObject["grainAmounts"];
        }
        if (instrumentObject["grainRange"] != undefined) {
            this.grainRange = clamp(0, Config.grainRangeMax / Config.grainSizeStep + 1, instrumentObject["grainRange"]);
        }

        if (instrumentObject["distortion"] != undefined) {
            this.distortion = clamp(0, Config.distortionRange, Math.round((Config.distortionRange - 1) * (instrumentObject["distortion"] | 0) / 100));
        }

        if (instrumentObject["bitcrusherOctave"] != undefined) {
            this.bitcrusherFreq = Config.bitcrusherFreqRange - 1 - (+instrumentObject["bitcrusherOctave"]) / Config.bitcrusherOctaveStep;
        }
        if (instrumentObject["bitcrusherQuantization"] != undefined) {
            this.bitcrusherQuantization = clamp(0, Config.bitcrusherQuantizationRange, Math.round((Config.bitcrusherQuantizationRange - 1) * (instrumentObject["bitcrusherQuantization"] | 0) / 100));
        }

        if (instrumentObject["echoSustain"] != undefined) {
            this.echoSustain = clamp(0, Config.echoSustainRange, Math.round((Config.echoSustainRange - 1) * (instrumentObject["echoSustain"] | 0) / 100));
        }
        if (instrumentObject["echoDelayBeats"] != undefined) {
            this.echoDelay = clamp(0, Config.echoDelayRange, Math.round((+instrumentObject["echoDelayBeats"]) * (Config.ticksPerPart * Config.partsPerBeat) / Config.echoDelayStepTicks - 1.0));
        }

        if (!isNaN(instrumentObject["chorus"])) {
            this.chorus = clamp(0, Config.chorusRange, Math.round((Config.chorusRange - 1) * (instrumentObject["chorus"] | 0) / 100));
        }

        if (instrumentObject["reverb"] != undefined) {
            this.reverb = clamp(0, Config.reverbRange, Math.round((Config.reverbRange - 1) * (instrumentObject["reverb"] | 0) / 100));
        } else {
            this.reverb = legacyGlobalReverb;
        }

        if (instrumentObject["pulseWidth"] != undefined) {
            this.pulseWidth = clamp(1, Config.pulseWidthRange + 1, Math.round(instrumentObject["pulseWidth"]));
        } else {
            this.pulseWidth = Config.pulseWidthRange;
        }

        if (instrumentObject["decimalOffset"] != undefined) {
            this.decimalOffset = clamp(0, 99 + 1, Math.round(instrumentObject["decimalOffset"]));
        } else {
            this.decimalOffset = 0;
        }

        if (instrumentObject["dynamism"] != undefined) {
            this.supersawDynamism = clamp(0, Config.supersawDynamismMax + 1, Math.round(Config.supersawDynamismMax * (instrumentObject["dynamism"] | 0) / 100));
        } else {
            this.supersawDynamism = Config.supersawDynamismMax;
        }
        if (instrumentObject["spread"] != undefined) {
            this.supersawSpread = clamp(0, Config.supersawSpreadMax + 1, Math.round(Config.supersawSpreadMax * (instrumentObject["spread"] | 0) / 100));
        } else {
            this.supersawSpread = Math.ceil(Config.supersawSpreadMax / 2.0);
        }
        if (instrumentObject["shape"] != undefined) {
            this.supersawShape = clamp(0, Config.supersawShapeMax + 1, Math.round(Config.supersawShapeMax * (instrumentObject["shape"] | 0) / 100));
        } else {
            this.supersawShape = 0;
        }

        if (instrumentObject["harmonics"] != undefined) {
            for (let i: number = 0; i < Config.harmonicsControlPoints; i++) {
                this.harmonicsWave.harmonics[i] = Math.max(0, Math.min(Config.harmonicsMax, Math.round(Config.harmonicsMax * (+instrumentObject["harmonics"][i]) / 100)));
            }
            this.harmonicsWave.markCustomWaveDirty();
        } else {
            this.harmonicsWave.reset();
        }

        if (instrumentObject["spectrum"] != undefined) {
            for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                this.spectrumWave.spectrum[i] = Math.max(0, Math.min(Config.spectrumMax, Math.round(Config.spectrumMax * (+instrumentObject["spectrum"][i]) / 100)));
                this.spectrumWave.markCustomWaveDirty();
            }
        } else {
            this.spectrumWave.reset(isNoiseChannel);
        }

        if (instrumentObject["stringSustain"] != undefined) {
            this.stringSustain = clamp(0, Config.stringSustainRange, Math.round((Config.stringSustainRange - 1) * (instrumentObject["stringSustain"] | 0) / 100));
        } else {
            this.stringSustain = 10;
        }
        this.stringSustainType = Config.enableAcousticSustain ? Config.sustainTypeNames.indexOf(instrumentObject["stringSustainType"]) : SustainType.bright;
        if (<any>this.stringSustainType == -1) this.stringSustainType = SustainType.bright;

        if (this.type == InstrumentType.noise) {
            this.chipNoise = Config.chipNoises.findIndex(wave => wave.name == instrumentObject["wave"]);
            if (instrumentObject["wave"] == "pink noise") this.chipNoise = Config.chipNoises.findIndex(wave => wave.name == "pink");
            if (instrumentObject["wave"] == "brownian noise") this.chipNoise = Config.chipNoises.findIndex(wave => wave.name == "brownian");
            if (this.chipNoise == -1) this.chipNoise = 1;
        }

        const legacyEnvelopeNames: Dictionary<string> = { "custom": "note size", "steady": "none", "pluck 1": "twang 1", "pluck 2": "twang 2", "pluck 3": "twang 3" };
        const getEnvelope = (name: any): Envelope | undefined => {
            if (legacyEnvelopeNames[name] != undefined) return Config.envelopes.dictionary[legacyEnvelopeNames[name]];
            else {
                return Config.envelopes.dictionary[name];
            }
        }

        if (this.type == InstrumentType.drumset) {
            if (instrumentObject["drums"] != undefined) {
                for (let j: number = 0; j < Config.drumCount; j++) {
                    const drum: any = instrumentObject["drums"][j];
                    if (drum == undefined) continue;

                    this.drumsetEnvelopes[j] = Config.envelopes.dictionary["twang 2"].index; // default value.
                    if (drum["filterEnvelope"] != undefined) {
                        const envelope: Envelope | undefined = getEnvelope(drum["filterEnvelope"]);
                        if (envelope != undefined) this.drumsetEnvelopes[j] = envelope.index;
                    }
                    if (drum["spectrum"] != undefined) {
                        for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                            this.drumsetSpectrumWaves[j].spectrum[i] = Math.max(0, Math.min(Config.spectrumMax, Math.round(Config.spectrumMax * (+drum["spectrum"][i]) / 100)));
                        }
                    }
                    this.drumsetSpectrumWaves[j].markCustomWaveDirty();
                }
            }
        }

        if (this.type == InstrumentType.chip) {
            const legacyWaveNames: Dictionary<number> = { "triangle": 1, "square": 2, "pulse wide": 3, "pulse narrow": 4, "sawtooth": 5, "double saw": 6, "double pulse": 7, "spiky": 8, "plateau": 0 };
            const modboxWaveNames: Dictionary<number> = { "10% pulse": 22, "sunsoft bass": 23, "loud pulse": 24, "sax": 25, "guitar": 26, "atari bass": 28, "atari pulse": 29, "1% pulse": 30, "curved sawtooth": 31, "viola": 32, "brass": 33, "acoustic bass": 34, "lyre": 35, "ramp pulse": 36, "piccolo": 37, "squaretooth": 38, "flatline": 39, "pnryshk a (u5)": 40, "pnryshk b (riff)": 41 };
            const sandboxWaveNames: Dictionary<number> = { "shrill lute": 42, "shrill bass": 44, "nes pulse": 45, "saw bass": 46, "euphonium": 47, "shrill pulse": 48, "r-sawtooth": 49, "recorder": 50, "narrow saw": 51, "deep square": 52, "ring pulse": 53, "double sine": 54, "contrabass": 55, "double bass": 56 };
            const zefboxWaveNames: Dictionary<number> = { "semi-square": 63, "deep square": 64, "squaretal": 40, "saw wide": 65, "saw narrow ": 66, "deep sawtooth": 67, "sawtal": 68, "pulse": 69, "triple pulse": 70, "high pulse": 71, "deep pulse": 72 };
            const miscWaveNames: Dictionary<number> = { "test1": 56, "pokey 4bit lfsr": 57, "pokey 5step bass": 58, "isolated spiky": 59, "unnamed 1": 60, "unnamed 2": 61, "guitar string": 75, "intense": 76, "buzz wave": 77, "pokey square": 57, "pokey bass": 58, "banana wave": 83, "test 1": 84, "test 2": 84, "real snare": 85, "earthbound o. guitar": 86 };
            const paandorasboxWaveNames: Dictionary<number> = { "kick": 87, "snare": 88, "piano1": 89, "WOW": 90, "overdrive": 91, "trumpet": 92, "saxophone": 93, "orchestrahit": 94, "detached violin": 95, "synth": 96, "sonic3snare": 97, "come on": 98, "choir": 99, "overdriveguitar": 100, "flute": 101, "legato violin": 102, "tremolo violin": 103, "amen break": 104, "pizzicato violin": 105, "tim allen grunt": 106, "tuba": 107, "loopingcymbal": 108, "standardkick": 109, "standardsnare": 110, "closedhihat": 111, "foothihat": 112, "openhihat": 113, "crashcymbal": 114, "pianoC4": 115, "liver pad": 116, "marimba": 117, "susdotwav": 118, "wackyboxtts": 119 };
            // const paandorasbetaWaveNames = {"contrabass": 55, "double bass": 56 };
            //this.chipWave = legacyWaveNames[instrumentObject["wave"]] != undefined ? legacyWaveNames[instrumentObject["wave"]] : Config.chipWaves.findIndex(wave => wave.name == instrumentObject["wave"]);
            this.chipWave = -1;
            const rawName: string = instrumentObject["wave"];
            for (const table of [
                legacyWaveNames,
                modboxWaveNames,
                sandboxWaveNames,
                zefboxWaveNames,
                miscWaveNames,
                paandorasboxWaveNames
            ]) {
                if (this.chipWave == -1 && table[rawName] != undefined && Config.chipWaves[table[rawName]] != undefined) {
                    this.chipWave = table[rawName];
                    break;
                }
            }
            if (this.chipWave == -1) {
                const potentialChipWaveIndex: number = Config.chipWaves.findIndex(wave => wave.name == rawName);
                if (potentialChipWaveIndex != -1) this.chipWave = potentialChipWaveIndex;
            }
            // this.chipWave = legacyWaveNames[instrumentObject["wave"]] != undefined ? legacyWaveNames[instrumentObject["wave"]] : modboxWaveNames[instrumentObject["wave"]] != undefined ? modboxWaveNames[instrumentObject["wave"]] : sandboxWaveNames[instrumentObject["wave"]] != undefined ? sandboxWaveNames[instrumentObject["wave"]] : zefboxWaveNames[instrumentObject["wave"]] != undefined ? zefboxWaveNames[instrumentObject["wave"]] : miscWaveNames[instrumentObject["wave"]] != undefined ? miscWaveNames[instrumentObject["wave"]] : paandorasboxWaveNames[instrumentObject["wave"]] != undefined ? paandorasboxWaveNames[instrumentObject["wave"]] : Config.chipWaves.findIndex(wave => wave.name == instrumentObject["wave"]); 
            if (this.chipWave == -1) this.chipWave = 1;
        }

        if (this.type == InstrumentType.fm || this.type == InstrumentType.fm6op) {
            if (this.type == InstrumentType.fm) {
                this.algorithm = Config.algorithms.findIndex(algorithm => algorithm.name == instrumentObject["algorithm"]);
                if (this.algorithm == -1) this.algorithm = 0;
                this.feedbackType = Config.feedbacks.findIndex(feedback => feedback.name == instrumentObject["feedbackType"]);
                if (this.feedbackType == -1) this.feedbackType = 0;
            } else {
                this.algorithm6Op = Config.algorithms6Op.findIndex(algorithm6Op => algorithm6Op.name == instrumentObject["algorithm"]);
                if (this.algorithm6Op == -1) this.algorithm6Op = 1;
                if (this.algorithm6Op == 0) {
                    this.customAlgorithm.set(instrumentObject["customAlgorithm"]["carrierCount"], instrumentObject["customAlgorithm"]["mods"]);
                } else {
                    this.customAlgorithm.fromPreset(this.algorithm6Op);
                }
                this.feedbackType6Op = Config.feedbacks6Op.findIndex(feedback6Op => feedback6Op.name == instrumentObject["feedbackType"]);
                // SynthBox feedback support
                if (this.feedbackType6Op == -1) {
                    // These are all of the SynthBox feedback presets that aren't present in Gold/UltraBox
                    let synthboxLegacyFeedbacks: DictionaryArray<any> = toNameMap([
                        { name: "2⟲ 3⟲", indices: [[], [2], [3], [], [], []] },
                        { name: "3⟲ 4⟲", indices: [[], [], [3], [4], [], []] },
                        { name: "4⟲ 5⟲", indices: [[], [], [], [4], [5], []] },
                        { name: "5⟲ 6⟲", indices: [[], [], [], [], [5], [6]] },
                        { name: "1⟲ 6⟲", indices: [[1], [], [], [], [], [6]] },
                        { name: "1⟲ 3⟲", indices: [[1], [], [3], [], [], []] },
                        { name: "1⟲ 4⟲", indices: [[1], [], [], [4], [], []] },
                        { name: "1⟲ 5⟲", indices: [[1], [], [], [], [5], []] },
                        { name: "4⟲ 6⟲", indices: [[], [], [], [4], [], [6]] },
                        { name: "2⟲ 6⟲", indices: [[], [2], [], [], [], [6]] },
                        { name: "3⟲ 6⟲", indices: [[], [], [3], [], [], [6]] },
                        { name: "4⟲ 5⟲ 6⟲", indices: [[], [], [], [4], [5], [6]] },
                        { name: "1⟲ 3⟲ 6⟲", indices: [[1], [], [3], [], [], [6]] },
                        { name: "2→5", indices: [[], [], [], [], [2], []] },
                        { name: "2→6", indices: [[], [], [], [], [], [2]] },
                        { name: "3→5", indices: [[], [], [], [], [3], []] },
                        { name: "3→6", indices: [[], [], [], [], [], [3]] },
                        { name: "4→6", indices: [[], [], [], [], [], [4]] },
                        { name: "5→6", indices: [[], [], [], [], [], [5]] },
                        { name: "1→3→4", indices: [[], [], [1], [], [3], []] },
                        { name: "2→5→6", indices: [[], [], [], [], [2], [5]] },
                        { name: "2→4→6", indices: [[], [], [], [2], [], [4]] },
                        { name: "4→5→6", indices: [[], [], [], [], [4], [5]] },
                        { name: "3→4→5→6", indices: [[], [], [], [3], [4], [5]] },
                        { name: "2→3→4→5→6", indices: [[], [1], [2], [3], [4], [5]] },
                        { name: "1→2→3→4→5→6", indices: [[], [1], [2], [3], [4], [5]] },
                    ]);

                    let synthboxFeedbackType = synthboxLegacyFeedbacks[synthboxLegacyFeedbacks.findIndex(feedback => feedback.name == instrumentObject["feedbackType"])]!.indices;

                    if (synthboxFeedbackType != undefined) {
                        this.feedbackType6Op = 0;
                        this.customFeedbackType.set(synthboxFeedbackType);
                    } else {
                        // if the feedback type STILL can't be resolved, default to the first non-custom option
                        this.feedbackType6Op = 1;
                    }
                }

                if ((this.feedbackType6Op == 0) && (instrumentObject["customFeedback"] != undefined)) {
                    this.customFeedbackType.set(instrumentObject["customFeedback"]["mods"]);
                } else {
                    this.customFeedbackType.fromPreset(this.feedbackType6Op);
                }
            }
            if (instrumentObject["feedbackAmplitude"] != undefined) {
                this.feedbackAmplitude = clamp(0, Config.operatorAmplitudeMax + 1, instrumentObject["feedbackAmplitude"] | 0);
            } else {
                this.feedbackAmplitude = 0;
            }

            for (let j: number = 0; j < Config.operatorCount + (this.type == InstrumentType.fm6op ? 2 : 0); j++) {
                const operator: Operator = this.operators[j];
                let operatorObject: any = undefined;
                if (instrumentObject["operators"] != undefined) operatorObject = instrumentObject["operators"][j];
                if (operatorObject == undefined) operatorObject = {};

                operator.frequency = Config.operatorFrequencies.findIndex(freq => freq.name == operatorObject["frequency"]);
                if (operator.frequency == -1) operator.frequency = 0;
                if (operatorObject["amplitude"] != undefined) {
                    operator.amplitude = clamp(0, Config.operatorAmplitudeMax + 1, operatorObject["amplitude"] | 0);
                } else {
                    operator.amplitude = 0;
                }
                if (operatorObject["waveform"] != undefined) {
                    if (format == "goldbox" && j > 3) {
                        operator.waveform = 0;
                        continue;
                    }

                    operator.waveform = Config.operatorWaves.findIndex(wave => wave.name == operatorObject["waveform"]);
                    if (operator.waveform == -1) {
                        // GoldBox compatibility
                        if (operatorObject["waveform"] == "square") {
                            operator.waveform = Config.operatorWaves.dictionary["pulse width"].index;
                            operator.pulseWidth = 5;
                        } else if (operatorObject["waveform"] == "rounded") {
                            operator.waveform = Config.operatorWaves.dictionary["quasi-sine"].index;
                        } else {
                            operator.waveform = 0;
                        }

                    }
                } else {
                    operator.waveform = 0;
                }
                if (operatorObject["pulseWidth"] != undefined) {
                    operator.pulseWidth = operatorObject["pulseWidth"] | 0;
                } else {
                    operator.pulseWidth = 5;
                }
            }
        }
        else if (this.type == InstrumentType.customChipWave) {
            if (instrumentObject["customChipWave"]) {

                for (let i: number = 0; i < 64; i++) {
                    this.customChipWave[i] = instrumentObject["customChipWave"][i];
                }


                let sum: number = 0.0;
                for (let i: number = 0; i < this.customChipWave.length; i++) {
                    sum += this.customChipWave[i];
                }
                const average: number = sum / this.customChipWave.length;

                // Perform the integral on the wave. The chipSynth will perform the derivative to get the original wave back but with antialiasing.
                let cumulative: number = 0;
                let wavePrev: number = 0;
                for (let i: number = 0; i < this.customChipWave.length; i++) {
                    cumulative += wavePrev;
                    wavePrev = this.customChipWave[i] - average;
                    this.customChipWaveIntegral[i] = cumulative;
                }

                // 65th, last sample is for anti-aliasing
                this.customChipWaveIntegral[64] = 0.0;
            }
        } else if (this.type == InstrumentType.mod) {
            if (instrumentObject["modChannels"] != undefined) {
                for (let mod: number = 0; mod < Config.modCount; mod++) {
                    this.modChannels[mod] = instrumentObject["modChannels"][mod];
                    this.modInstruments[mod] = instrumentObject["modInstruments"][mod];
                    this.modulators[mod] = instrumentObject["modSettings"][mod];
                    // Due to an oversight, this isn't included in JSONs prior to JB 2.6.
                    if (instrumentObject["modFilterTypes"] != undefined)
                        this.modFilterTypes[mod] = instrumentObject["modFilterTypes"][mod];
                    if (instrumentObject["modEnvelopeNumbers"] != undefined)
                        this.modEnvelopeNumbers[mod] = instrumentObject["modEnvelopeNumbers"][mod];
                }
            }
        }

        if (this.type != InstrumentType.mod) {
            // Arpeggio speed
            if (this.chord == Config.chords.dictionary["arpeggio"].index && instrumentObject["arpeggioSpeed"] != undefined) {
                this.arpeggioSpeed = instrumentObject["arpeggioSpeed"];
            }
            else {
                this.arpeggioSpeed = (useSlowerRhythm) ? 9 : 12; // Decide whether to import arps as x3/4 speed
            }
            if (this.chord == Config.chords.dictionary["monophonic"].index && instrumentObject["monoChordTone"] != undefined) {
                this.monoChordTone = instrumentObject["monoChordTone"];
            }

            if (instrumentObject["fastTwoNoteArp"] != undefined) {
                this.fastTwoNoteArp = instrumentObject["fastTwoNoteArp"];
            }
            else {
                this.fastTwoNoteArp = useFastTwoNoteArp;
            }

            if (instrumentObject["clicklessTransition"] != undefined) {
                this.clicklessTransition = instrumentObject["clicklessTransition"];
            }
            else {
                this.clicklessTransition = false;
            }

            if (instrumentObject["aliases"] != undefined) {
                this.aliases = instrumentObject["aliases"];
            }
            else {
                // modbox had no anti-aliasing, so enable it for everything if that mode is selected
                if (format == "modbox") {
                    this.effects = (this.effects | (1 << EffectType.distortion));
                    this.aliases = true;
                    this.distortion = 0;
                } else {
                    this.aliases = false;
                }
            }

            if (instrumentObject["noteFilterType"] != undefined) {
                this.noteFilterType = instrumentObject["noteFilterType"];
            }
            if (instrumentObject["noteSimpleCut"] != undefined) {
                this.noteFilterSimpleCut = instrumentObject["noteSimpleCut"];
            }
            if (instrumentObject["noteSimplePeak"] != undefined) {
                this.noteFilterSimplePeak = instrumentObject["noteSimplePeak"];
            }
            if (instrumentObject["noteFilter"] != undefined) {
                this.noteFilter.fromJsonObject(instrumentObject["noteFilter"]);
            } else {
                this.noteFilter.reset();
            }
            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                if (Array.isArray(instrumentObject["noteSubFilters" + i])) {
                    this.noteSubFilters[i] = new FilterSettings();
                    this.noteSubFilters[i]!.fromJsonObject(instrumentObject["noteSubFilters" + i]);
                }
            }
            if (instrumentObject["eqFilterType"] != undefined) {
                this.eqFilterType = instrumentObject["eqFilterType"];
            }
            if (instrumentObject["eqSimpleCut"] != undefined) {
                this.eqFilterSimpleCut = instrumentObject["eqSimpleCut"];
            }
            if (instrumentObject["eqSimplePeak"] != undefined) {
                this.eqFilterSimplePeak = instrumentObject["eqSimplePeak"];
            }
            if (Array.isArray(instrumentObject["eqFilter"])) {
                this.eqFilter.fromJsonObject(instrumentObject["eqFilter"]);
            } else {
                this.eqFilter.reset();

                const legacySettings: LegacySettings = {};

                // Try converting from legacy filter settings.
                const filterCutoffMaxHz: number = 8000;
                const filterCutoffRange: number = 11;
                const filterResonanceRange: number = 8;
                if (instrumentObject["filterCutoffHz"] != undefined) {
                    legacySettings.filterCutoff = clamp(0, filterCutoffRange, Math.round((filterCutoffRange - 1) + 2.0 * Math.log((instrumentObject["filterCutoffHz"] | 0) / filterCutoffMaxHz) / Math.LN2));
                } else {
                    legacySettings.filterCutoff = (this.type == InstrumentType.chip) ? 6 : 10;
                }
                if (instrumentObject["filterResonance"] != undefined) {
                    legacySettings.filterResonance = clamp(0, filterResonanceRange, Math.round((filterResonanceRange - 1) * (instrumentObject["filterResonance"] | 0) / 100));
                } else {
                    legacySettings.filterResonance = 0;
                }

                legacySettings.filterEnvelope = getEnvelope(instrumentObject["filterEnvelope"]);
                legacySettings.pulseEnvelope = getEnvelope(instrumentObject["pulseEnvelope"]);
                legacySettings.feedbackEnvelope = getEnvelope(instrumentObject["feedbackEnvelope"]);
                if (Array.isArray(instrumentObject["operators"])) {
                    legacySettings.operatorEnvelopes = [];
                    for (let j: number = 0; j < Config.operatorCount + (this.type == InstrumentType.fm6op ? 2 : 0); j++) {
                        let envelope: Envelope | undefined;
                        if (instrumentObject["operators"][j] != undefined) {
                            envelope = getEnvelope(instrumentObject["operators"][j]["envelope"]);
                        }
                        legacySettings.operatorEnvelopes[j] = (envelope != undefined) ? envelope : Config.envelopes.dictionary["none"];
                    }
                }

                // Try converting from even older legacy filter settings.
                if (instrumentObject["filter"] != undefined) {
                    const legacyToCutoff: number[] = [10, 6, 3, 0, 8, 5, 2];
                    const legacyToEnvelope: string[] = ["none", "none", "none", "none", "decay 1", "decay 2", "decay 3"];
                    const filterNames: string[] = ["none", "bright", "medium", "soft", "decay bright", "decay medium", "decay soft"];
                    const oldFilterNames: Dictionary<number> = { "sustain sharp": 1, "sustain medium": 2, "sustain soft": 3, "decay sharp": 4 };
                    let legacyFilter: number = oldFilterNames[instrumentObject["filter"]] != undefined ? oldFilterNames[instrumentObject["filter"]] : filterNames.indexOf(instrumentObject["filter"]);
                    if (legacyFilter == -1) legacyFilter = 0;
                    legacySettings.filterCutoff = legacyToCutoff[legacyFilter];
                    legacySettings.filterEnvelope = getEnvelope(legacyToEnvelope[legacyFilter]);
                    legacySettings.filterResonance = 0;
                }

                this.convertLegacySettings(legacySettings, true);
            }

            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                if (Array.isArray(instrumentObject["eqSubFilters" + i])) {
                    this.eqSubFilters[i] = new FilterSettings();
                    this.eqSubFilters[i]!.fromJsonObject(instrumentObject["eqSubFilters" + i]);
                }
            }

            if (Array.isArray(instrumentObject["envelopes"])) {
                const envelopeArray: any[] = instrumentObject["envelopes"];
                for (let i = 0; i < envelopeArray.length; i++) {
                    if (this.envelopeCount >= Config.maxEnvelopeCount) break;
                    const tempEnvelope: EnvelopeSettings = new EnvelopeSettings(this.isNoiseInstrument);
                    tempEnvelope.fromJsonObject(envelopeArray[i], format);
                    //old pitch envelope detection
                    let pitchEnvelopeStart: number;
                    if (instrumentObject["pitchEnvelopeStart"] != undefined && instrumentObject["pitchEnvelopeStart"] != null) { //make sure is not null bc for some reason it can be
                        pitchEnvelopeStart = instrumentObject["pitchEnvelopeStart"];
                    } else if (instrumentObject["pitchEnvelopeStart" + i] != undefined && instrumentObject["pitchEnvelopeStart" + i] != undefined) {
                        pitchEnvelopeStart = instrumentObject["pitchEnvelopeStart" + i];
                    } else {
                        pitchEnvelopeStart = tempEnvelope.pitchEnvelopeStart;
                    }
                    let pitchEnvelopeEnd: number;
                    if (instrumentObject["pitchEnvelopeEnd"] != undefined && instrumentObject["pitchEnvelopeEnd"] != null) {
                        pitchEnvelopeEnd = instrumentObject["pitchEnvelopeEnd"];
                    } else if (instrumentObject["pitchEnvelopeEnd" + i] != undefined && instrumentObject["pitchEnvelopeEnd" + i] != null) {
                        pitchEnvelopeEnd = instrumentObject["pitchEnvelopeEnd" + i];
                    } else {
                        pitchEnvelopeEnd = tempEnvelope.pitchEnvelopeEnd;
                    }
                    let envelopeInverse: boolean;
                    if (instrumentObject["envelopeInverse" + i] != undefined && instrumentObject["envelopeInverse" + i] != null) {
                        envelopeInverse = instrumentObject["envelopeInverse" + i];
                    } else if (instrumentObject["pitchEnvelopeInverse"] != undefined && instrumentObject["pitchEnvelopeInverse"] != null && Config.envelopes[tempEnvelope.envelope].name == "pitch") { //assign only if a pitch envelope
                        envelopeInverse = instrumentObject["pitchEnvelopeInverse"];
                    } else {
                        envelopeInverse = tempEnvelope.inverse;
                    }
                    let discreteEnvelope: boolean;
                    if (instrumentObject["discreteEnvelope"] != undefined) {
                        discreteEnvelope = instrumentObject["discreteEnvelope"];
                    } else {
                        discreteEnvelope = tempEnvelope.discrete;
                    }
                    this.addEnvelope(tempEnvelope.target, tempEnvelope.index, tempEnvelope.envelope, true, pitchEnvelopeStart, pitchEnvelopeEnd, envelopeInverse, tempEnvelope.perEnvelopeSpeed, tempEnvelope.perEnvelopeLowerBound, tempEnvelope.perEnvelopeUpperBound, tempEnvelope.steps, tempEnvelope.seed, tempEnvelope.waveform, discreteEnvelope);
                }
            }
        }
        // advloop addition
        if (type === 0) {
            if (instrumentObject["isUsingAdvancedLoopControls"] != undefined) {
                this.isUsingAdvancedLoopControls = instrumentObject["isUsingAdvancedLoopControls"];
                this.chipWaveLoopStart = instrumentObject["chipWaveLoopStart"];
                this.chipWaveLoopEnd = instrumentObject["chipWaveLoopEnd"];
                this.chipWaveLoopMode = instrumentObject["chipWaveLoopMode"];
                this.chipWavePlayBackwards = instrumentObject["chipWavePlayBackwards"];
                this.chipWaveStartOffset = instrumentObject["chipWaveStartOffset"];
            } else {
                this.isUsingAdvancedLoopControls = false;
                this.chipWaveLoopStart = 0;
                this.chipWaveLoopEnd = Config.rawRawChipWaves[this.chipWave].samples.length - 1;
                this.chipWaveLoopMode = 0;
                this.chipWavePlayBackwards = false;
                this.chipWaveStartOffset = 0;
            }
        }
    }
    // advloop addition

    public getLargestControlPointCount(forNoteFilter: boolean) {
        let largest: number;
        if (forNoteFilter) {
            largest = this.noteFilter.controlPointCount;
            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                if (this.noteSubFilters[i] != null && this.noteSubFilters[i]!.controlPointCount > largest)
                    largest = this.noteSubFilters[i]!.controlPointCount;
            }
        }
        else {
            largest = this.eqFilter.controlPointCount;
            for (let i: number = 0; i < Config.filterMorphCount; i++) {
                if (this.eqSubFilters[i] != null && this.eqSubFilters[i]!.controlPointCount > largest)
                    largest = this.eqSubFilters[i]!.controlPointCount;
            }
        }
        return largest;
    }

    public static frequencyFromPitch(pitch: number): number {
        return 440.0 * Math.pow(2.0, (pitch - 69.0) / 12.0);
    }

    public addEnvelope(target: number, index: number, envelope: number, newEnvelopes: boolean, start: number = 0, end: number = -1, inverse: boolean = false, perEnvelopeSpeed: number = -1, perEnvelopeLowerBound: number = 0, perEnvelopeUpperBound: number = 1, steps: number = 2, seed: number = 2, waveform: number = LFOEnvelopeTypes.sine, discrete: boolean = false): void {
        end = end != -1 ? end : this.isNoiseInstrument ? Config.drumCount - 1 : Config.maxPitch; //find default if none is given
        perEnvelopeSpeed = perEnvelopeSpeed != -1 ? perEnvelopeSpeed : newEnvelopes ? 1 : Config.envelopes[envelope].speed; //find default if none is given
        let makeEmpty: boolean = false;
        if (!this.supportsEnvelopeTarget(target, index)) makeEmpty = true;
        if (this.envelopeCount >= Config.maxEnvelopeCount) throw new Error();
        while (this.envelopes.length <= this.envelopeCount) this.envelopes[this.envelopes.length] = new EnvelopeSettings(this.isNoiseInstrument);
        const envelopeSettings: EnvelopeSettings = this.envelopes[this.envelopeCount];
        envelopeSettings.target = makeEmpty ? Config.instrumentAutomationTargets.dictionary["none"].index : target;
        envelopeSettings.index = makeEmpty ? 0 : index;
        if (!newEnvelopes) {
            envelopeSettings.envelope = clamp(0, Config.newEnvelopes.length, Config.envelopes[envelope].type);
        } else {
            envelopeSettings.envelope = envelope;
        }
        envelopeSettings.pitchEnvelopeStart = start;
        envelopeSettings.pitchEnvelopeEnd = end;
        envelopeSettings.inverse = inverse;
        envelopeSettings.perEnvelopeSpeed = perEnvelopeSpeed;
        envelopeSettings.perEnvelopeLowerBound = perEnvelopeLowerBound;
        envelopeSettings.perEnvelopeUpperBound = perEnvelopeUpperBound;
        envelopeSettings.steps = steps;
        envelopeSettings.seed = seed;
        envelopeSettings.waveform = waveform;
        envelopeSettings.discrete = discrete;
        this.envelopeCount++;
    }

    public supportsEnvelopeTarget(target: number, index: number): boolean {
        const automationTarget: AutomationTarget = Config.instrumentAutomationTargets[target];
        if (automationTarget.computeIndex == null && automationTarget.name != "none") {
            return false;
        }
        if (index >= automationTarget.maxCount) {
            return false;
        }
        if (automationTarget.compatibleInstruments != null && automationTarget.compatibleInstruments.indexOf(this.type) == -1) {
            return false;
        }
        if (automationTarget.effect != null && (this.effects & (1 << automationTarget.effect)) == 0) {
            return false;
        }
        if (automationTarget.name == "arpeggioSpeed") {
            return effectsIncludeChord(this.effects) && this.chord == Config.chords.dictionary["arpeggio"].index;
        }
        if (automationTarget.isFilter) {
            //if (automationTarget.perNote) {
            let useControlPointCount: number = this.noteFilter.controlPointCount;
            if (this.noteFilterType)
                useControlPointCount = 1;
            if (index >= useControlPointCount) return false;
            //} else {
            //	if (index >= this.eqFilter.controlPointCount)   return false;
            //}
        }
        if ((automationTarget.name == "operatorFrequency") || (automationTarget.name == "operatorAmplitude")) {
            if (index >= 4 + (this.type == InstrumentType.fm6op ? 2 : 0)) return false;
        }
        return true;
    }

    public clearInvalidEnvelopeTargets(): void {
        for (let envelopeIndex: number = 0; envelopeIndex < this.envelopeCount; envelopeIndex++) {
            const target: number = this.envelopes[envelopeIndex].target;
            const index: number = this.envelopes[envelopeIndex].index;
            if (!this.supportsEnvelopeTarget(target, index)) {
                this.envelopes[envelopeIndex].target = Config.instrumentAutomationTargets.dictionary["none"].index;
                this.envelopes[envelopeIndex].index = 0;
            }
        }
    }

    public getTransition(): Transition {
        return effectsIncludeTransition(this.effects) ? Config.transitions[this.transition] :
            (this.type == InstrumentType.mod ? Config.transitions.dictionary["interrupt"] : Config.transitions.dictionary["normal"]);
    }

    public getFadeInSeconds(): number {
        return (this.type == InstrumentType.drumset) ? 0.0 : Synth.fadeInSettingToSeconds(this.fadeIn);
    }

    public getFadeOutTicks(): number {
        return (this.type == InstrumentType.drumset) ? Config.drumsetFadeOutTicks : Synth.fadeOutSettingToTicks(this.fadeOut)
    }

    public getChord(): Chord {
        return effectsIncludeChord(this.effects) ? Config.chords[this.chord] : Config.chords.dictionary["simultaneous"];
    }

    public getDrumsetEnvelope(pitch: number): Envelope {
        if (this.type != InstrumentType.drumset) throw new Error("Can't getDrumsetEnvelope() for non-drumset.");
        return Config.envelopes[this.drumsetEnvelopes[pitch]];
    }
}

