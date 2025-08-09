import { EnvelopeComputer } from './EnvelopeComputer';
import { DynamicBiquadFilter } from './filtering';
import { PickedString } from './PickedString';
import { Config, Note } from './synth';
import { OperatorWave } from './SynthConfig';
export class Tone {
    public instrumentIndex: number;
    public readonly pitches: number[] = Array(Config.maxChordSize + 2).fill(0);
    public pitchCount: number = 0;
    public chordSize: number = 0;
    public drumsetPitch: number | null = null;
    public note: Note | null = null;
    public prevNote: Note | null = null;
    public nextNote: Note | null = null;
    public prevNotePitchIndex: number = 0;
    public nextNotePitchIndex: number = 0;
    public freshlyAllocated: boolean = true;
    public atNoteStart: boolean = false;
    public isOnLastTick: boolean = false; // Whether the tone is finished fading out and ready to be freed.
    public passedEndOfNote: boolean = false;
    public forceContinueAtStart: boolean = false;
    public forceContinueAtEnd: boolean = false;
    public noteStartPart: number = 0;
    public noteEndPart: number = 0;
    public ticksSinceReleased: number = 0;
    public liveInputSamplesHeld: number = 0;
    public lastInterval: number = 0;
    // public noiseSample: number = 0.0;
    // public noiseSampleB: number = 0.0;
    public stringSustainStart: number = 0;
    public stringSustainEnd: number = 0;
    public readonly noiseSamples: number[] = [];
    public readonly phases: number[] = [];
    public readonly operatorWaves: OperatorWave[] = [];
    public readonly phaseDeltas: number[] = [];
    // advloop addition
    public directions: number[] = [];
    public chipWaveCompletions: number[] = [];
    public chipWavePrevWaves: number[] = [];
    public chipWaveCompletionsLastWave: number[] = [];
    // advloop addition
    public readonly phaseDeltaScales: number[] = [];
    public expression: number = 0.0;
    public expressionDelta: number = 0.0;
    public readonly operatorExpressions: number[] = [];
    public readonly operatorExpressionDeltas: number[] = [];
    public readonly prevPitchExpressions: Array<number | null> = Array(Config.maxPitchOrOperatorCount).fill(null);
    public prevVibrato: number | null = null;
    public prevStringDecay: number | null = null;
    public pulseWidth: number = 0.0;
    public pulseWidthDelta: number = 0.0;
    public decimalOffset: number = 0.0;
    public supersawDynamism: number = 0.0;
    public supersawDynamismDelta: number = 0.0;
    public supersawUnisonDetunes: number[] = []; // These can change over time, but slowly enough that I'm not including corresponding delta values within a tick run.
    public supersawShape: number = 0.0;
    public supersawShapeDelta: number = 0.0;
    public supersawDelayLength: number = 0.0;
    public supersawDelayLengthDelta: number = 0.0;
    public supersawDelayLine: Float32Array | null = null;
    public supersawDelayIndex: number = -1;
    public supersawPrevPhaseDelta: number | null = null;
    public readonly pickedStrings: PickedString[] = [];

    public readonly noteFilters: DynamicBiquadFilter[] = [];
    public noteFilterCount: number = 0;
    public initialNoteFilterInput1: number = 0.0;
    public initialNoteFilterInput2: number = 0.0;

    public specialIntervalExpressionMult: number = 1.0;
    public readonly feedbackOutputs: number[] = [];
    public feedbackMult: number = 0.0;
    public feedbackDelta: number = 0.0;
    public stereoVolumeLStart: number = 0.0;
    public stereoVolumeRStart: number = 0.0;
    public stereoVolumeLDelta: number = 0.0;
    public stereoVolumeRDelta: number = 0.0;
    public stereoDelayStart: number = 0.0;
    public stereoDelayEnd: number = 0.0;
    public stereoDelayDelta: number = 0.0;
    public customVolumeStart: number = 0.0;
    public customVolumeEnd: number = 0.0;
    public filterResonanceStart: number = 0.0;
    public filterResonanceDelta: number = 0.0;
    public isFirstOrder: boolean = false;

    public readonly envelopeComputer: EnvelopeComputer = new EnvelopeComputer(/*true*/);

    constructor() {
        this.reset();
    }

    public reset(): void {
        // this.noiseSample = 0.0;
        for (let i: number = 0; i < Config.unisonVoicesMax; i++) {
            this.noiseSamples[i] = 0.0;
        }
        for (let i: number = 0; i < Config.maxPitchOrOperatorCount; i++) {
            this.phases[i] = 0.0;
            // advloop addition
            this.directions[i] = 1;
            this.chipWaveCompletions[i] = 0;
            this.chipWavePrevWaves[i] = 0;
            this.chipWaveCompletionsLastWave[i] = 0;
            // advloop addition
            this.operatorWaves[i] = Config.operatorWaves[0];
            this.feedbackOutputs[i] = 0.0;
            this.prevPitchExpressions[i] = null;
        }
        for (let i: number = 0; i < this.noteFilterCount; i++) {
            this.noteFilters[i].resetOutput();
        }
        this.noteFilterCount = 0;
        this.initialNoteFilterInput1 = 0.0;
        this.initialNoteFilterInput2 = 0.0;
        this.liveInputSamplesHeld = 0;
        this.supersawDelayIndex = -1;
        for (const pickedString of this.pickedStrings) {
            pickedString.reset();
        }
        this.envelopeComputer.reset();
        this.prevVibrato = null;
        this.prevStringDecay = null;
        this.supersawPrevPhaseDelta = null;
        this.drumsetPitch = null;
    }
}

