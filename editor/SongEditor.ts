// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

//import {Layout} from "./Layout";
import {
  sampleLoadEvents,
  SampleLoadedEvent,
  InstrumentType,
  EffectType,
  Config,
  effectsIncludeTransition,
  effectsIncludeChord,
  effectsIncludePitchShift,
  effectsIncludeDetune,
  effectsIncludeVibrato,
  effectsIncludeNoteFilter,
  effectsIncludeDistortion,
  effectsIncludeBitcrusher,
  effectsIncludePanning,
  effectsIncludeChorus,
  effectsIncludeEcho,
  effectsIncludeReverb,
  effectsIncludeRingModulation,
  effectsIncludeGranular,
  effectsIncludeDiscreteSlide,
  DropdownID,
  calculateRingModHertz,
} from "../synth/SynthConfig";
import { BarScrollBar } from "./BarScrollBar";
import { BeatsPerBarPrompt } from "./BeatsPerBarPrompt";
import { Change, ChangeGroup } from "./Change";
import { ChannelSettingsPrompt } from "./ChannelSettingsPrompt";
import { ColorConfig, ChannelColors } from "./ColorConfig";
import { getPrimaryNoteColor, getSecondaryNoteColor } from "./ChannelRow";
import { CustomChipPrompt } from "./CustomChipPrompt";
import { CustomFilterPrompt } from "./CustomFilterPrompt";
import { InstrumentExportPrompt } from "./InstrumentExportPrompt";
import { InstrumentImportPrompt } from "./InstrumentImportPrompt";
import {
  EditorConfig,
  isMobile,
  prettyNumber,
  Preset,
  PresetCategory,
} from "./EditorConfig";
import { EuclideanRhythmPrompt } from "./EuclidgenRhythmPrompt";
import { ExportPrompt } from "./ExportPrompt";
import "./Layout"; // Imported here for the sake of ensuring this code is transpiled early.
import {
  Instrument,
  Channel,
  Synth,
  ChannelType,
  ChannelTag,
} from "../synth/synth";
import { HTML, SVG } from "imperative-html/dist/esm/elements-strict";
import { Preferences } from "./Preferences";
import { HarmonicsEditor, HarmonicsEditorPrompt } from "./HarmonicsEditor";
import { InputBox, Slider } from "./HTMLWrapper";
import { ImportPrompt } from "./ImportPrompt";
import { ChannelRow } from "./ChannelRow";
import { LayoutPrompt } from "./LayoutPrompt";
import { EnvelopeEditor } from "./EnvelopeEditor";
import { FadeInOutEditor } from "./FadeInOutEditor";
import { FilterEditor } from "./FilterEditor";
import { LimiterPrompt } from "./LimiterPrompt";
import { CustomScalePrompt } from "./CustomScalePrompt";
import { LoopEditor } from "./LoopEditor";
import { MoveNotesSidewaysPrompt } from "./MoveNotesSidewaysPrompt";
import { MuteEditor } from "./MuteEditor";
import { OctaveScrollBar } from "./OctaveScrollBar";
import { MidiInputHandler } from "./MidiInput";
import { KeyboardLayout } from "./KeyboardLayout";
import { PatternEditor } from "./PatternEditor";
import { Piano } from "./Piano";
import { Prompt } from "./Prompt";
import { SongDocument } from "./SongDocument";
import { SongDurationPrompt } from "./SongDurationPrompt";
import { SustainPrompt } from "./SustainPrompt";
import { SongRecoveryPrompt } from "./SongRecoveryPrompt";
import { RecordingSetupPrompt } from "./RecordingSetupPrompt";
import { SpectrumEditor, SpectrumEditorPrompt } from "./SpectrumEditor";
import { CustomThemePrompt } from "./CustomThemePrompt";
import { ThemePrompt } from "./ThemePrompt";
import { TipPrompt } from "./TipPrompt";
import {
  ChangeTempo,
  ChangeKeyOctave,
  ChangeChorus,
  ChangeEchoDelay,
  ChangeEchoSustain,
  ChangeReverb,
  ChangeVolume,
  ChangePan,
  ChangePatternSelection,
  ChangePatternsPerChannel,
  ChangePatternNumbers,
  ChangeSupersawDynamism,
  ChangeSupersawSpread,
  ChangeSupersawShape,
  ChangePulseWidth,
  ChangeFeedbackAmplitude,
  ChangeOperatorAmplitude,
  ChangeOperatorFrequency,
  ChangeDrumsetEnvelope,
  ChangePasteInstrument,
  ChangePreset,
  pickRandomPresetValue,
  ChangeRandomGeneratedInstrument,
  ChangeEQFilterType,
  ChangeNoteFilterType,
  ChangeEQFilterSimpleCut,
  ChangeEQFilterSimplePeak,
  ChangeNoteFilterSimpleCut,
  ChangeNoteFilterSimplePeak,
  ChangeScale,
  ChangeDetectKey,
  ChangeKey,
  ChangeRhythm,
  ChangeFeedbackType,
  ChangeAlgorithm,
  ChangeChipWave,
  ChangeNoiseWave,
  ChangeTransition,
  ChangeToggleEffects,
  ChangeVibrato,
  ChangeUnison,
  ChangeChord,
  ChangeSong,
  ChangePitchShift,
  ChangeDetune,
  ChangeDistortion,
  ChangeStringSustain,
  ChangeBitcrusherFreq,
  ChangeBitcrusherQuantization,
  ChangeAddEnvelope,
  ChangeEnvelopeSpeed,
  ChangeAddChannelInstrument,
  ChangeRemoveChannelInstrument,
  ChangeCustomWave,
  ChangeOperatorWaveform,
  ChangeOperatorPulseWidth,
  ChangeSongTitle,
  ChangeVibratoDepth,
  ChangeVibratoSpeed,
  ChangeVibratoDelay,
  ChangeVibratoType,
  ChangePanDelay,
  ChangeArpeggioSpeed,
  ChangeFastTwoNoteArp,
  ChangeClicklessTransition,
  ChangeAliasing,
  ChangeSetPatternInstruments,
  ChangeHoldingModRecording,
  ChangeChipWavePlayBackwards,
  ChangeChipWaveStartOffset,
  ChangeChipWaveLoopEnd,
  ChangeChipWaveLoopStart,
  ChangeChipWaveLoopMode,
  ChangeChipWaveUseAdvancedLoopControls,
  ChangeDecimalOffset,
  ChangeUnisonVoices,
  ChangeUnisonSpread,
  ChangeUnisonOffset,
  ChangeUnisonExpression,
  ChangeUnisonSign,
  Change6OpFeedbackType,
  Change6OpAlgorithm,
  ChangeCustomAlgorythmorFeedback,
  ChangeRingMod,
  ChangeRingModHz,
  ChangeRingModChipWave,
  ChangeRingModPulseWidth,
  ChangeGranular,
  ChangeGrainSize,
  ChangeGrainAmounts,
  ChangeGrainRange,
  ChangeDiscreteSlide,
  ChangeMonophonicTone,
  ChangeChannelOrder,
  ChangeChannelTagRange,
  ChangeAddChannel,
  ChangeRemoveChannel,
  ChangeRemoveChannelTag,
} from "./changes";

import { TrackEditor } from "./TrackEditor";
import { oscilloscopeCanvas } from "../global/Oscilloscope";
import { VisualLoopControlsPrompt } from "./VisualLoopControlsPrompt";
import { SampleLoadingStatusPrompt } from "./SampleLoadingStatusPrompt";
import { AddSamplesPrompt } from "./AddSamplesPrompt";
import { ShortenerConfigPrompt } from "./ShortenerConfigPrompt";

const { button, div, input, select, span, optgroup, option, canvas } = HTML;

function buildOptions(
  menu: HTMLSelectElement,
  items: ReadonlyArray<string | number>
): HTMLSelectElement {
  for (let index: number = 0; index < items.length; index++) {
    menu.appendChild(option({ value: index }, items[index]));
  }
  return menu;
}

// Similar to the above, but adds a non-interactive header to the list.
// @jummbus: Honestly not necessary with new HTML options interface, but not exactly necessary to change either!

function buildHeaderedOptions(
  header: string,
  menu: HTMLSelectElement,
  items: ReadonlyArray<string | number>
): HTMLSelectElement {
  menu.appendChild(
    option({ selected: true, disabled: true, value: header }, header)
  );

  for (const item of items) {
    menu.appendChild(option({ value: item }, item));
  }
  return menu;
}

function buildPresetOptions(
  isNoise: boolean,
  idSet: string
): HTMLSelectElement {
  const menu: HTMLSelectElement = select({ id: idSet, class: "presetSelect" });

  // Show the "spectrum" custom type in both pitched and noise channels.
  //const customTypeGroup: HTMLElement = optgroup({label: EditorConfig.presetCategories[0].name});
  if (isNoise) {
    menu.appendChild(
      option(
        { value: InstrumentType.noise },
        EditorConfig.valueToPreset(InstrumentType.noise)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.spectrum },
        EditorConfig.valueToPreset(InstrumentType.spectrum)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.drumset },
        EditorConfig.valueToPreset(InstrumentType.drumset)!.name
      )
    );
  } else {
    menu.appendChild(
      option(
        { value: InstrumentType.chip },
        EditorConfig.valueToPreset(InstrumentType.chip)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.customChipWave },
        EditorConfig.valueToPreset(InstrumentType.customChipWave)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.pwm },
        EditorConfig.valueToPreset(InstrumentType.pwm)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.supersaw },
        EditorConfig.valueToPreset(InstrumentType.supersaw)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.fm },
        EditorConfig.valueToPreset(InstrumentType.fm)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.fm6op },
        EditorConfig.instrumentToPreset(InstrumentType.fm6op)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.harmonics },
        EditorConfig.valueToPreset(InstrumentType.harmonics)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.pickedString },
        EditorConfig.valueToPreset(InstrumentType.pickedString)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.spectrum },
        EditorConfig.valueToPreset(InstrumentType.spectrum)!.name
      )
    );
    menu.appendChild(
      option(
        { value: InstrumentType.noise },
        EditorConfig.valueToPreset(InstrumentType.noise)!.name
      )
    );
  }

  // TODO - When you port over the Dogebox2 import/export buttons be sure to uncomment these
  const randomGroup: HTMLElement = optgroup({ label: "Randomize ▾" });
  // const randomGroup: HTMLElement = optgroup({ label: "▾ Randomize" });
  randomGroup.appendChild(option({ value: "randomPreset" }, "Random Preset"));
  randomGroup.appendChild(
    option({ value: "randomGenerated" }, "Random Generated")
  );
  menu.appendChild(randomGroup);

  let firstCategoryGroup: HTMLElement | null = null;
  let customSampleCategoryGroup: HTMLElement | null = null;

  for (
    let categoryIndex: number = 1;
    categoryIndex < EditorConfig.presetCategories.length;
    categoryIndex++
  ) {
    const category: PresetCategory =
      EditorConfig.presetCategories[categoryIndex];
    const group: HTMLElement = optgroup({ label: category.name + " ▾" });
    // const group: HTMLElement = optgroup({ label: "▾ " + category.name });
    let foundAny: boolean = false;
    for (
      let presetIndex: number = 0;
      presetIndex < category.presets.length;
      presetIndex++
    ) {
      const preset: Preset = category.presets[presetIndex];
      if ((preset.isNoise == true) == isNoise) {
        group.appendChild(
          option({ value: (categoryIndex << 6) + presetIndex }, preset.name)
        );
        foundAny = true;
      }
    }

    if (categoryIndex === 1 && foundAny) {
      firstCategoryGroup = group;
    } else if (category.name === "Custom Sample Presets" && foundAny) {
      customSampleCategoryGroup = group;
    }

    // Need to re-sort some elements for readability. Can't just do this in the menu, because indices are saved in URLs and would get broken if the ordering actually changed.
    if (category.name == "String Presets" && foundAny) {
      // Put violin 2 after violin 1
      let moveViolin2 = group.removeChild(group.children[11]);
      group.insertBefore(moveViolin2, group.children[1]);
    }

    if (category.name == "Flute Presets" && foundAny) {
      // Put flute 2 after flute 1
      let moveFlute2 = group.removeChild(group.children[11]);
      group.insertBefore(moveFlute2, group.children[1]);
    }

    if (category.name == "Keyboard Presets" && foundAny) {
      // Put grand piano 2 and 3 after grand piano 1
      let moveGrandPiano2 = group.removeChild(group.children[9]);
      let moveGrandPiano3 = group.removeChild(group.children[9]);
      group.insertBefore(moveGrandPiano3, group.children[1]);
      group.insertBefore(moveGrandPiano2, group.children[1]);
    }

    if (foundAny) menu.appendChild(group);
  }

  if (firstCategoryGroup != null && customSampleCategoryGroup != null) {
    // Put the custom sample presets at the top.
    const parent: HTMLSelectElement = <HTMLSelectElement>(
      customSampleCategoryGroup.parentNode
    );
    parent.removeChild(customSampleCategoryGroup);
    parent.insertBefore(customSampleCategoryGroup, firstCategoryGroup);
  }

  return menu;
}

function setSelectedValue(
  menu: HTMLSelectElement,
  value: number,
  isSelect2: boolean = false
): void {
  const stringValue = value.toString();
  if (menu.value != stringValue) {
    menu.value = stringValue;

    // Change select2 value, if this select is a member of that class.
    if (isSelect2) {
      $(menu).val(value).trigger("change.select2");
    }
  }
}

class CustomChipCanvas {
  private mouseDown: boolean;
  private continuousEdit: boolean;
  private lastX: number;
  private lastY: number;
  public newArray: Float32Array;
  public renderedArray: Float32Array;
  public renderedColor: string;

  private _change: Change | null = null;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    private readonly _doc: SongDocument,
    private readonly _getChange: (newArray: Float32Array) => Change
  ) {
    canvas.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mousedown", this._onMouseDown);
    canvas.addEventListener("mouseup", this._onMouseUp);
    canvas.addEventListener("mouseleave", this._onMouseUp);

    this.mouseDown = false;
    this.continuousEdit = false;
    this.lastX = 0;
    this.lastY = 0;

    this.newArray = new Float32Array(64);
    this.renderedArray = new Float32Array(64);
    this.renderedColor = "";

    // Init waveform
    this.redrawCanvas();
  }

  public redrawCanvas(): void {
    const chipData: Float32Array =
      this._doc.song.channels[this._doc.channel].instruments[
        this._doc.getCurrentInstrument()
      ].customChipWave;
    const renderColor: string = getPrimaryNoteColor(
      this._doc,
      this._doc.channel
    );

    // Check if the data has changed from the last render.
    let needsRedraw: boolean = false;
    if (renderColor != this.renderedColor) {
      needsRedraw = true;
    } else
      for (let i: number = 0; i < 64; i++) {
        if (chipData[i] != this.renderedArray[i]) {
          needsRedraw = true;
          i = 64;
        }
      }
    if (!needsRedraw) {
      return;
    }

    this.renderedArray.set(chipData);

    var ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Black BG
    ctx.fillStyle = ColorConfig.getComputed("--editor-background");
    ctx.fillRect(0, 0, 128, 52);

    // Mid-bar
    ctx.fillStyle = ColorConfig.getComputed("--ui-widget-background");
    ctx.fillRect(0, 25, 128, 2);

    // 25-75 bars
    ctx.fillStyle = ColorConfig.getComputed("--track-editor-bg-pitch-dim");
    ctx.fillRect(0, 13, 128, 1);
    ctx.fillRect(0, 39, 128, 1);

    // Waveform
    ctx.fillStyle = renderColor;

    for (let x: number = 0; x < 64; x++) {
      var y: number = chipData[x] + 26;
      ctx.fillRect(x * 2, y - 2, 2, 4);

      this.newArray[x] = y - 26;
    }
  }

  private _onMouseMove = (event: MouseEvent): void => {
    if (this.mouseDown) {
      var x =
        (event.clientX || event.pageX) -
        this.canvas.getBoundingClientRect().left;
      var y = Math.floor(
        (event.clientY || event.pageY) - this.canvas.getBoundingClientRect().top
      );

      if (y < 2) y = 2;
      if (y > 50) y = 50;

      var ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

      if (this.continuousEdit == true && Math.abs(this.lastX - x) < 40) {
        var lowerBound = x < this.lastX ? x : this.lastX;
        var upperBound = x < this.lastX ? this.lastX : x;

        for (let i = lowerBound; i <= upperBound; i += 2) {
          var progress =
            Math.abs(x - this.lastX) > 2.0
              ? x > this.lastX
                ? 1.0 - (i - lowerBound) / (upperBound - lowerBound)
                : (i - lowerBound) / (upperBound - lowerBound)
              : 0.0;
          var j = Math.round(y + (this.lastY - y) * progress);

          ctx.fillStyle = ColorConfig.getComputed("--editor-background");
          ctx.fillRect(Math.floor(i / 2) * 2, 0, 2, 53);
          ctx.fillStyle = ColorConfig.getComputed("--ui-widget-background");
          ctx.fillRect(Math.floor(i / 2) * 2, 25, 2, 2);
          ctx.fillStyle = ColorConfig.getComputed(
            "--track-editor-bg-pitch-dim"
          );
          ctx.fillRect(Math.floor(i / 2) * 2, 13, 2, 1);
          ctx.fillRect(Math.floor(i / 2) * 2, 39, 2, 1);
          ctx.fillStyle = ColorConfig.getComputedChannelColor(
            this._doc.song,
            this._doc.channel
          ).primaryNote;
          ctx.fillRect(Math.floor(i / 2) * 2, j - 2, 2, 4);

          // Actually update current instrument's custom waveform
          this.newArray[Math.floor(i / 2)] = j - 26;
        }
      } else {
        ctx.fillStyle = ColorConfig.getComputed("--editor-background");
        ctx.fillRect(Math.floor(x / 2) * 2, 0, 2, 52);
        ctx.fillStyle = ColorConfig.getComputed("--ui-widget-background");
        ctx.fillRect(Math.floor(x / 2) * 2, 25, 2, 2);
        ctx.fillStyle = ColorConfig.getComputed("--track-editor-bg-pitch-dim");
        ctx.fillRect(Math.floor(x / 2) * 2, 13, 2, 1);
        ctx.fillRect(Math.floor(x / 2) * 2, 39, 2, 1);
        ctx.fillStyle = ColorConfig.getComputedChannelColor(
          this._doc.song,
          this._doc.channel
        ).primaryNote;
        ctx.fillRect(Math.floor(x / 2) * 2, y - 2, 2, 4);

        // Actually update current instrument's custom waveform
        this.newArray[Math.floor(x / 2)] = y - 26;
      }

      this.continuousEdit = true;
      this.lastX = x;
      this.lastY = y;

      // Preview - update integral used for sound synthesis based on new array, not actual stored array. When mouse is released, real update will happen.
      let instrument: Instrument =
        this._doc.song.channels[this._doc.channel].instruments[
          this._doc.getCurrentInstrument()
        ];

      let sum: number = 0.0;
      for (let i: number = 0; i < this.newArray.length; i++) {
        sum += this.newArray[i];
      }
      const average: number = sum / this.newArray.length;

      // Perform the integral on the wave. The chipSynth will perform the derivative to get the original wave back but with antialiasing.
      let cumulative: number = 0;
      let wavePrev: number = 0;
      for (let i: number = 0; i < this.newArray.length; i++) {
        cumulative += wavePrev;
        wavePrev = this.newArray[i] - average;
        instrument.customChipWaveIntegral[i] = cumulative;
      }

      instrument.customChipWaveIntegral[64] = 0.0;
    }
  };

  private _onMouseDown = (event: MouseEvent): void => {
    this.mouseDown = true;

    // Allow single-click edit
    this._onMouseMove(event);
  };
  private _onMouseUp = (): void => {
    this.mouseDown = false;
    this.continuousEdit = false;

    this._whenChange();
  };

  private _whenChange = (): void => {
    this._change = this._getChange(this.newArray);

    this._doc.record(this._change!);

    this._change = null;
  };
}

class CustomAlgorythmCanvas {
  private mouseDown: boolean;
  //private continuousEdit: boolean;
  //private lastX: number;
  //private lastY: number;
  public newMods: number[][];
  public lookUpArray: number[][];
  public selected: number;
  public inverseModulation: number[][];
  public feedback: number[][];
  public inverseFeedback: number[][];
  public carriers: number;
  public drawArray: number[][];
  public mode: string;

  private _change: Change | null = null;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    private readonly _doc: SongDocument,
    private readonly _getChange: (
      newArray: number[][],
      carry: number,
      mode: string
    ) => Change
  ) {
    //canvas.addEventListener("input", this._whenInput);
    //canvas.addEventListener("change", this._whenChange);
    canvas.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mousedown", this._onMouseDown);
    canvas.addEventListener("mouseup", this._onMouseUp);
    canvas.addEventListener("mouseleave", this._onMouseUp);

    this.mouseDown = false;
    //this.continuousEdit = false;
    //this.lastX = 0;
    //this.lastY = 0;
    this.drawArray = [[], [], [], [], [], []];
    this.lookUpArray = [[], [], [], [], [], []];
    this.carriers = 1;
    this.selected = -1;
    this.newMods = [[], [], [], [], [], []];
    this.inverseModulation = [[], [], [], [], [], []];
    this.feedback = [[], [], [], [], [], []];
    this.inverseFeedback = [[], [], [], [], [], []];
    this.mode = "algorithm";

    this.redrawCanvas();
  }

  public reset(): void {
    this.redrawCanvas(false);
    this.selected = -1;
  }

  public fillDrawArray(noReset: boolean = false): void {
    if (noReset) {
      this.drawArray = [];
      this.drawArray = [[], [], [], [], [], []];
      this.inverseModulation = [[], [], [], [], [], []];
      this.lookUpArray = [[], [], [], [], [], []];
      for (let i: number = 0; i < this.newMods.length; i++) {
        for (let o: number = 0; o < this.newMods[i].length; o++) {
          this.inverseModulation[this.newMods[i][o] - 1].push(i + 1);
        }
      }
      if (this.mode == "feedback") {
        this.inverseFeedback = [[], [], [], [], [], []];
        for (let i: number = 0; i < this.feedback.length; i++) {
          for (let o: number = 0; o < this.feedback[i].length; o++) {
            this.inverseFeedback[this.feedback[i][o] - 1].push(i + 1);
          }
        }
      }
    } else {
      this.drawArray = [];
      this.drawArray = [[], [], [], [], [], []];
      this.carriers = 1;
      this.newMods = [[], [], [], [], [], []];
      this.inverseModulation = [[], [], [], [], [], []];
      this.lookUpArray = [[], [], [], [], [], []];

      var oldMods =
        this._doc.song.channels[this._doc.channel].instruments[
          this._doc.getCurrentInstrument()
        ].customAlgorithm;
      this.carriers = oldMods.carrierCount;
      for (let i: number = 0; i < oldMods.modulatedBy.length; i++) {
        for (let o: number = 0; o < oldMods.modulatedBy[i].length; o++) {
          this.inverseModulation[oldMods.modulatedBy[i][o] - 1].push(i + 1);
          this.newMods[i][o] = oldMods.modulatedBy[i][o];
        }
      }
      if (this.mode == "feedback") {
        this.feedback = [[], [], [], [], [], []];
        this.inverseFeedback = [[], [], [], [], [], []];

        var oldfeed =
          this._doc.song.channels[this._doc.channel].instruments[
            this._doc.getCurrentInstrument()
          ].customFeedbackType.indices;
        for (let i: number = 0; i < oldfeed.length; i++) {
          for (let o: number = 0; o < oldfeed[i].length; o++) {
            this.inverseFeedback[oldfeed[i][o] - 1].push(i + 1);
            this.feedback[i][o] = oldfeed[i][o];
          }
        }
      }
    }
    for (let i: number = 0; i < this.inverseModulation.length; i++) {
      if (i < this.carriers) {
        this.drawArray[this.drawArray.length - 1][i] = i + 1;
        this.lookUpArray[i] = [0, i];
      } else {
        if (this.inverseModulation[i][0] != undefined) {
          let testPos = [
            this.drawArray.length -
              (this.lookUpArray[
                this.inverseModulation[i][
                  this.inverseModulation[i].length - 1
                ] - 1
              ][0] +
                2),
            this.lookUpArray[
              this.inverseModulation[i][this.inverseModulation[i].length - 1] -
                1
            ][1],
          ];
          if (this.drawArray[testPos[0]][testPos[1]] != undefined) {
            while (
              this.drawArray[testPos[0]][testPos[1]] != undefined &&
              testPos[1] < 6
            ) {
              testPos[1]++;
              if (this.drawArray[testPos[0]][testPos[1]] == undefined) {
                this.drawArray[testPos[0]][testPos[1]] = i + 1;
                this.lookUpArray[i] = [
                  this.drawArray.length - (testPos[0] + 1),
                  testPos[1],
                ];
                break;
              }
            }
          } else {
            this.drawArray[testPos[0]][testPos[1]] = i + 1;
            this.lookUpArray[i] = [
              this.drawArray.length - (testPos[0] + 1),
              testPos[1],
            ];
          }
        } else {
          let testPos = [5, 0];
          while (
            this.drawArray[testPos[0]][testPos[1]] != undefined &&
            testPos[1] < 6
          ) {
            testPos[1]++;
            if (this.drawArray[testPos[0]][testPos[1]] == undefined) {
              this.drawArray[testPos[0]][testPos[1]] = i + 1;
              this.lookUpArray[i] = [
                this.drawArray.length - (testPos[0] + 1),
                testPos[1],
              ];
              break;
            }
          }
        }
      }
    }
  }

  private drawLines(ctx: CanvasRenderingContext2D): void {
    if (this.mode == "feedback") {
      for (let off: number = 0; off < 6; off++) {
        ctx.strokeStyle = ColorConfig.getArbitaryChannelColor(
          "pitch",
          off
        ).primaryChannel;
        const set = off * 2 + 0.5;
        for (let i: number = 0; i < this.inverseFeedback[off].length; i++) {
          let tar: number = this.inverseFeedback[off][i] - 1;
          let srtpos: number[] = this.lookUpArray[off];
          let tarpos: number[] = this.lookUpArray[tar];
          ctx.beginPath();
          ctx.moveTo(srtpos[1] * 24 + 12 + set, (6 - srtpos[0] - 1) * 24 + 12);
          ctx.lineTo(
            srtpos[1] * 24 + 12 + set,
            (6 - srtpos[0] - 1) * 24 + 12 + set
          );
          if (tarpos[1] != srtpos[1]) {
            let side: number = 0;
            if (tarpos[0] >= srtpos[0]) {
              side = 24;
            }
            ctx.lineTo(
              srtpos[1] * 24 + side + set,
              (6 - srtpos[0] - 1) * 24 + 12 + set
            );
            if (tarpos[1] == srtpos[1] - 1 && tarpos[0] <= srtpos[0] - 1) {
            } else {
              if (tarpos[0] >= srtpos[0]) {
                ctx.lineTo(
                  (tarpos[1] + 1) * 24 + set,
                  (6 - srtpos[0] - 1) * 24 + 12 + set
                );
                ctx.lineTo(
                  (tarpos[1] + 1) * 24 + set,
                  (6 - tarpos[0] - 1) * 24 + 12 + set
                );
              } else {
                ctx.lineTo(
                  srtpos[1] * 24 + set,
                  (6 - tarpos[0] - 1) * 24 + 12 + set
                );
                ctx.lineTo(
                  (tarpos[1] + 1) * 24 + set,
                  (6 - tarpos[0] - 1) * 24 + 12 + set
                );
              }
            }
            ctx.lineTo(
              (tarpos[1] + 1) * 24 + set,
              (6 - tarpos[0] - 1) * 24 + set - 12
            );
            ctx.lineTo(
              tarpos[1] * 24 + 12 + set,
              (6 - tarpos[0] - 1) * 24 + set - 12
            );
            ctx.lineTo(tarpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
          } else {
            if (srtpos[0] - tarpos[0] == 1) {
              ctx.lineTo(tarpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
            } else {
              if (tarpos[0] >= srtpos[0]) {
                ctx.lineTo(
                  srtpos[1] * 24 + 24 + set,
                  (6 - srtpos[0] - 1) * 24 + 12 + set
                );
                ctx.lineTo(
                  srtpos[1] * 24 + 24 + set,
                  (6 - tarpos[0] - 1) * 24 + set - 12
                );
                ctx.lineTo(
                  tarpos[1] * 24 + set + 12,
                  (6 - tarpos[0] - 1) * 24 + set - 12
                );
                ctx.lineTo(tarpos[1] * 24 + set + 12, (6 - tarpos[0] - 1) * 24);
              } else {
                ctx.lineTo(
                  srtpos[1] * 24 + set,
                  (6 - srtpos[0] - 1) * 24 + 12 + set
                );
                ctx.lineTo(
                  srtpos[1] * 24 + set,
                  (6 - tarpos[0] - 1) * 24 + set - 12
                );
                ctx.lineTo(
                  tarpos[1] * 24 + 12 + set,
                  (6 - tarpos[0] - 1) * 24 + set - 12
                );
                ctx.lineTo(tarpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
              }
            }
          }
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      return;
    }

    for (let off: number = 0; off < 6; off++) {
      ctx.strokeStyle = ColorConfig.getArbitaryChannelColor(
        "pitch",
        off
      ).primaryChannel;
      const set = off * 2 - 1 + 0.5;
      for (let i: number = 0; i < this.inverseModulation[off].length; i++) {
        let tar: number = this.inverseModulation[off][i] - 1;
        let srtpos: number[] = this.lookUpArray[off];
        let tarpos: number[] = this.lookUpArray[tar];
        ctx.beginPath();
        ctx.moveTo(srtpos[1] * 24 + 12 + set, (6 - srtpos[0] - 1) * 24 + 12);
        ctx.lineTo(
          srtpos[1] * 24 + 12 + set,
          (6 - srtpos[0] - 1) * 24 + 12 + set
        );
        if (tarpos[1] != srtpos[1]) {
          ctx.lineTo(srtpos[1] * 24 + set, (6 - srtpos[0] - 1) * 24 + 12 + set);
          if (tarpos[1] == srtpos[1] - 1 && tarpos[0] <= srtpos[0] - 1) {
          } else {
            ctx.lineTo(
              srtpos[1] * 24 + set,
              (6 - tarpos[0] - 1) * 24 + 12 + set
            );
            ctx.lineTo(
              (tarpos[1] + 1) * 24 + set,
              (6 - tarpos[0] - 1) * 24 + 12 + set
            );
          }
          ctx.lineTo(
            (tarpos[1] + 1) * 24 + set,
            (6 - tarpos[0] - 1) * 24 + set - 12
          );
          ctx.lineTo(
            tarpos[1] * 24 + 12 + set,
            (6 - tarpos[0] - 1) * 24 + set - 12
          );
          ctx.lineTo(tarpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
        } else {
          if (Math.abs(tarpos[0] - srtpos[0]) == 1) {
            ctx.lineTo(tarpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
          } else {
            ctx.lineTo(
              srtpos[1] * 24 + set,
              (6 - srtpos[0] - 1) * 24 + 12 + set
            );
            ctx.lineTo(
              srtpos[1] * 24 + set,
              (6 - tarpos[0] - 1) * 24 + set - 12
            );
            ctx.lineTo(
              srtpos[1] * 24 + 12 + set,
              (6 - tarpos[0] - 1) * 24 + set - 12
            );
            ctx.lineTo(srtpos[1] * 24 + 12 + set, (6 - tarpos[0] - 1) * 24);
          }
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  public redrawCanvas(noReset: boolean = false): void {
    this.fillDrawArray(noReset);
    var ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Black BG
    ctx.fillStyle = ColorConfig.getComputed("--editor-background");
    ctx.fillRect(0, 0, 144, 144);

    for (let x: number = 0; x < 6; x++) {
      for (let y: number = 0; y < 6; y++) {
        ctx.fillStyle = ColorConfig.getComputed("--track-editor-bg-pitch-dim");
        ctx.fillRect(x * 24 + 12, y * 24, 12, 12);
        ctx.fillStyle = ColorConfig.getComputed("--editor-background");
        ctx.fillRect(x * 24 + 13, y * 24 + 1, 10, 10);
        if (this.drawArray[y][x] != undefined) {
          if (this.drawArray[y][x] <= this.carriers) {
            ctx.fillStyle = ColorConfig.getComputed("--primary-text");
            ctx.fillRect(x * 24 + 12, y * 24, 12, 12);
            ctx.fillStyle = ColorConfig.getComputed("--editor-background");
            ctx.fillRect(x * 24 + 13, y * 24 + 1, 10, 10);
            ctx.fillStyle = ColorConfig.getComputedChannelColor(
              this._doc.song,
              this._doc.channel
            ).primaryNote;
            ctx.fillText(this.drawArray[y][x] + "", x * 24 + 14, y * 24 + 10);
          } else {
            ctx.fillStyle = ColorConfig.getComputedChannelColor(
              this._doc.song,
              this._doc.channel
            ).primaryNote;
            ctx.fillRect(x * 24 + 12, y * 24, 12, 12);
            ctx.fillStyle = ColorConfig.getComputed("--editor-background");
            ctx.fillRect(x * 24 + 13, y * 24 + 1, 10, 10);
            ctx.fillStyle = ColorConfig.getComputed("--primary-text");
            ctx.fillText(this.drawArray[y][x] + "", x * 24 + 14, y * 24 + 10);
          }
        }
      }
    }
    this.drawLines(ctx);
  }

  private _onMouseMove = (event: MouseEvent): void => {
    if (this.mouseDown) {
      //todo rework to handle draging and single clicks differently

      var x =
        (event.clientX || event.pageX) -
        this.canvas.getBoundingClientRect().left;
      var y = Math.floor(
        (event.clientY || event.pageY) - this.canvas.getBoundingClientRect().top
      );

      var ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

      ctx.fillStyle = ColorConfig.getComputedChannelColor(
        this._doc.song,
        this._doc.channel
      ).primaryNote;

      var yindex = Math.ceil(y / 12);
      var xindex = Math.ceil(x / 12);
      yindex =
        yindex / 2 - Math.floor(yindex / 2) >= 0.5
          ? Math.floor(yindex / 2)
          : -1;
      xindex =
        xindex / 2 + 0.5 - Math.floor(xindex / 2) <= 0.5
          ? Math.floor(xindex / 2) - 1
          : -1;
      yindex = yindex >= 0 && yindex <= 5 ? yindex : -1;
      xindex = xindex >= 0 && xindex <= 5 ? xindex : -1;
      ctx.fillRect(xindex * 24 + 12, yindex * 24, 2, 2);

      if (this.selected == -1) {
        if (this.drawArray?.[yindex]?.[xindex] != undefined) {
          this.selected = this.drawArray[yindex][xindex];
          ctx.fillRect(xindex * 24 + 12, yindex * 24, 12, 12);
          ctx.fillStyle = ColorConfig.getComputed("--editor-background");
          ctx.fillText(
            this.drawArray[yindex][xindex] + "",
            xindex * 24 + 14,
            yindex * 24 + 10
          );
          this.mouseDown = false;
        }
      } else {
        if (this.drawArray?.[yindex]?.[xindex] != undefined) {
          if (this.mode == "feedback") {
            const newmod = this.drawArray[yindex][xindex];
            let check = this.feedback[newmod - 1].indexOf(this.selected);
            if (check != -1) {
              this.feedback[newmod - 1].splice(check, 1);
            } else {
              this.feedback[newmod - 1].push(this.selected);
            }
          } else {
            if (this.drawArray[yindex][xindex] == this.selected) {
              if (this.selected == this.carriers) {
                if (this.selected > 1) {
                  this.carriers--;
                }
              } else if (this.selected - 1 == this.carriers) {
                this.carriers++;
              }
            } else {
              const newmod = this.drawArray[yindex][xindex];
              if (this.selected > newmod) {
                //todo try to rebalence then do this in algorithm mode otherwise input as needed
                let check = this.newMods[newmod - 1].indexOf(this.selected);
                if (check != -1) {
                  this.newMods[newmod - 1].splice(check, 1);
                } else {
                  this.newMods[newmod - 1].push(this.selected);
                }
              } else {
                let check = this.newMods[this.selected - 1].indexOf(newmod);
                if (check != -1) {
                  this.newMods[this.selected - 1].splice(check, 1);
                } else {
                  this.newMods[this.selected - 1].push(newmod);
                }
              }
            }
          }
          this.selected = -1;
          this.redrawCanvas(true);
          this.mouseDown = false;
        } else {
          this.selected = -1;
          this.redrawCanvas(true);
          this.mouseDown = false;
        }
      }
    }
  };

  private _onMouseDown = (event: MouseEvent): void => {
    this.mouseDown = true;

    // Allow single-click edit
    this._onMouseMove(event);
  };
  private _onMouseUp = (): void => {
    this.mouseDown = false;
    //this.continuousEdit = false;

    this._whenChange();
  };

  private _whenChange = (): void => {
    this._change = this._getChange(
      this.mode == "algorithm" ? this.newMods : this.feedback,
      this.carriers,
      this.mode
    );

    this._doc.record(this._change!);

    this._change = null;
  };
}

export class SongEditor {
  public prompt: Prompt | null = null;

  public doc: SongDocument = new SongDocument();

  private readonly _keyboardLayout: KeyboardLayout = new KeyboardLayout(
    this.doc
  );
  private readonly _patternEditorPrev: PatternEditor = new PatternEditor(
    this.doc,
    false,
    -1
  );
  private readonly _patternEditor: PatternEditor = new PatternEditor(
    this.doc,
    true,
    0
  );
  private readonly _patternEditorNext: PatternEditor = new PatternEditor(
    this.doc,
    false,
    1
  );
  private readonly _trackEditor: TrackEditor = new TrackEditor(this.doc, this);
  private readonly _muteEditor: MuteEditor = new MuteEditor(this.doc, this);
  private readonly _loopEditor: LoopEditor = new LoopEditor(
    this.doc,
    this._trackEditor
  );
  private readonly _piano: Piano = new Piano(this.doc);
  private readonly _octaveScrollBar: OctaveScrollBar = new OctaveScrollBar(
    this.doc,
    this._piano
  );
  private readonly _playButton: HTMLButtonElement = button(
    { class: "playButton", type: "button", title: "Play (Space)" },
    span("Play")
  );
  private readonly _pauseButton: HTMLButtonElement = button(
    {
      class: "pauseButton",
      style: "display: none;",
      type: "button",
      title: "Pause (Space)",
    },
    "Pause"
  );
  private readonly _recordButton: HTMLButtonElement = button(
    {
      class: "recordButton",
      style: "display: none;",
      type: "button",
      title: "Record (Ctrl+Space)",
    },
    span("Record")
  );
  private readonly _stopButton: HTMLButtonElement = button(
    {
      class: "stopButton",
      style: "display: none;",
      type: "button",
      title: "Stop Recording (Space)",
    },
    "Stop Recording"
  );
  private readonly _prevBarButton: HTMLButtonElement = button({
    class: "prevBarButton",
    type: "button",
    title: "Previous Bar (left bracket)",
  });
  private readonly _nextBarButton: HTMLButtonElement = button({
    class: "nextBarButton",
    type: "button",
    title: "Next Bar (right bracket)",
  });
  private readonly _volumeSlider: Slider = new Slider(
    input({
      title: "main volume",
      style: "width: 5em; flex-grow: 1; margin: 0;",
      type: "range",
      min: "0",
      max: "75",
      value: "50",
      step: "1",
    }),
    this.doc,
    null,
    false
  );
  private readonly _outVolumeBarBg: SVGRectElement = SVG.rect({
    "pointer-events": "none",
    width: "90%",
    height: "50%",
    x: "5%",
    y: "25%",
    fill: ColorConfig.uiWidgetBackground,
  });
  private readonly _outVolumeBar: SVGRectElement = SVG.rect({
    "pointer-events": "none",
    height: "50%",
    width: "0%",
    x: "5%",
    y: "25%",
    fill: "url('#volumeGrad2')",
  });
  private readonly _outVolumeCap: SVGRectElement = SVG.rect({
    "pointer-events": "none",
    width: "2px",
    height: "50%",
    x: "5%",
    y: "25%",
    fill: ColorConfig.uiWidgetFocus,
  });
  private readonly _stop1: SVGStopElement = SVG.stop({
    "stop-color": "lime",
    offset: "60%",
  });
  private readonly _stop2: SVGStopElement = SVG.stop({
    "stop-color": "orange",
    offset: "90%",
  });
  private readonly _stop3: SVGStopElement = SVG.stop({
    "stop-color": "red",
    offset: "100%",
  });
  private readonly _gradient: SVGGradientElement = SVG.linearGradient(
    { id: "volumeGrad2", gradientUnits: "userSpaceOnUse" },
    this._stop1,
    this._stop2,
    this._stop3
  );
  private readonly _defs: SVGDefsElement = SVG.defs({}, this._gradient);
  private readonly _volumeBarContainer: SVGSVGElement = SVG.svg(
    {
      style: `touch-action: none; overflow: visible; margin: auto; max-width: 20vw;`,
      width: "160px",
      height: "100%",
      preserveAspectRatio: "none",
      viewBox: "0 0 160 12",
    },
    this._defs,
    this._outVolumeBarBg,
    this._outVolumeBar,
    this._outVolumeCap
  );
  private readonly _volumeBarBox: HTMLDivElement = div(
    {
      class: "playback-volume-bar",
      style: "height: 12px; align-self: center;",
    },
    this._volumeBarContainer
  );
  private readonly _fileMenu: HTMLSelectElement = select(
    { style: "width: 100%;" },
    option({ selected: true, disabled: true, hidden: false }, "File"), // todo: "hidden" should be true but looks wrong on mac chrome, adds checkmark next to first visible option even though it's not selected. :(
    option({ value: "new" }, "+ New Blank Song (⇧`)"),
    option(
      { value: "import" },
      "↑ Import Song... (" + EditorConfig.ctrlSymbol + "O)"
    ),
    option(
      { value: "export" },
      "↓ Export Song... (" + EditorConfig.ctrlSymbol + "S)"
    ),
    option({ value: "copyUrl" }, "⎘ Copy Song URL"),
    option({ value: "shareUrl" }, "⤳ Share Song URL"),
    option({ value: "configureShortener" }, "🛠 Customize Url Shortener..."),
    option({ value: "shortenUrl" }, "… Shorten Song URL"),
    option({ value: "viewPlayer" }, "▶ View in Song Player (⇧P)"),
    option({ value: "copyEmbed" }, "⎘ Copy HTML Embed Code"),
    option({ value: "songRecovery" }, "⚠ Recover Recent Song... (`)")
  );
  private readonly _editMenu: HTMLSelectElement = select(
    { style: "width: 100%;" },
    option({ selected: true, disabled: true, hidden: false }, "Edit"), // todo: "hidden" should be true but looks wrong on mac chrome, adds checkmark next to first visible option even though it's not selected. :(
    option({ value: "undo" }, "Undo (Z)"),
    option({ value: "redo" }, "Redo (Y)"),
    option({ value: "copy" }, "Copy Pattern (C)"),
    option({ value: "pasteNotes" }, "Paste Pattern Notes (V)"),
    option(
      { value: "pasteNumbers" },
      "Paste Pattern Numbers (" + EditorConfig.ctrlSymbol + "⇧V)"
    ),
    option({ value: "insertBars" }, "Insert Bar (⏎)"),
    option({ value: "deleteBars" }, "Delete Selected Bars (⌫)"),
    option(
      { value: "insertChannel" },
      "Insert Channel (" + EditorConfig.ctrlSymbol + "⏎)"
    ),
    option(
      { value: "deleteChannel" },
      "Delete Selected Channels (" + EditorConfig.ctrlSymbol + "⌫)"
    ),
    option({ value: "selectChannel" }, "Select Channel (⇧A)"),
    option({ value: "selectAll" }, "Select All (A)"),
    option({ value: "duplicatePatterns" }, "Duplicate Reused Patterns (D)"),
    option({ value: "transposeUp" }, "Move Notes Up (+ or ⇧+)"),
    option({ value: "transposeDown" }, "Move Notes Down (- or ⇧-)"),
    option({ value: "moveNotesSideways" }, "Move All Notes Sideways... (W)"),
    option(
      { value: "generateEuclideanRhythm" },
      "Generate Euclidean Rhythm... (" + EditorConfig.ctrlSymbol + "E)"
    ),
    option({ value: "beatsPerBar" }, "Change Beats Per Bar... (⇧B)"),
    option({ value: "barCount" }, "Change Song Length... (L)"),
    option({ value: "channelSettings" }, "Channel Settings... (Q)"),
    option({ value: "limiterSettings" }, "Limiter Settings... (⇧L)"),
    option({ value: "addExternal" }, "Add Custom Samples... (⇧Q)")
  );
  private readonly _optionsMenu: HTMLSelectElement = select(
    { style: "width: 100%;" },
    option({ selected: true, disabled: true, hidden: false }, "Preferences"), // todo: "hidden" should be true but looks wrong on mac chrome, adds checkmark next to first visible option even though it's not selected. :(
    optgroup(
      { label: "Technical" },
      option({ value: "autoPlay" }, "Auto Play on Load"),
      option({ value: "autoFollow" }, "Auto Follow Playhead"),
      option({ value: "enableNotePreview" }, "Hear Added Notes"),
      option({ value: "notesOutsideScale" }, "Place Notes Out of Scale"),
      option({ value: "setDefaultScale" }, "Set Current Scale as Default"),
      option({ value: "alwaysFineNoteVol" }, "Always Fine Note Volume"),
      option({ value: "enableChannelMuting" }, "Enable Channel Muting"),
      option({ value: "instrumentCopyPaste" }, "Enable Copy/Paste Buttons"),
      option(
        { value: "instrumentImportExport" },
        "Enable Import/Export Buttons"
      ),
      option({ value: "displayBrowserUrl" }, "Enable Song Data in URL"),
      option({ value: "closePromptByClickoff" }, "Close Prompts on Click Off"),
      option({ value: "recordingSetup" }, "Note Recording...")
    ),
    optgroup(
      { label: "Appearance" },
      option({ value: "showFifth" }, 'Highlight "Fifth" Note'),
      option({ value: "notesFlashWhenPlayed" }, "Notes Flash When Played"),
      option({ value: "instrumentButtonsAtTop" }, "Instrument Buttons at Top"),
      option(
        { value: "frostedGlassBackground" },
        "Frosted Glass Prompt Backdrop"
      ),
      option({ value: "showChannels" }, "Show All Channels"),
      option({ value: "showScrollBar" }, "Show Octave Scroll Bar"),
      option(
        { value: "showInstrumentScrollbars" },
        "Show Intsrument Scrollbars"
      ),
      option({ value: "showLetters" }, "Show Piano Keys"),
      option({ value: "displayVolumeBar" }, "Show Playback Volume"),
      option({ value: "showOscilloscope" }, "Show Oscilloscope"),
      option(
        { value: "showSampleLoadingStatus" },
        "Show Sample Loading Status"
      ),
      option({ value: "showDescription" }, "Show Description"),
      option({ value: "layout" }, "Set Layout..."),
      option({ value: "colorTheme" }, "Set Theme..."),
      option({ value: "customTheme" }, "Custom Theme...")
    )
  );
  private readonly _scaleSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.scales.map((scale) => scale.name)
  );
  private readonly _keySelect: HTMLSelectElement = buildOptions(
    select(),
    Config.keys.map((key) => key.name).reverse()
  );
  private readonly _octaveStepper: HTMLInputElement = input({
    style: "width: 59.5%;",
    type: "number",
    min: Config.octaveMin,
    max: Config.octaveMax,
    value: "0",
  });
  private readonly _tempoSlider: Slider = new Slider(
    input({
      style: "margin: 0; vertical-align: middle;",
      type: "range",
      min: "1",
      max: "500",
      value: "160",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeTempo(this.doc, oldValue, newValue),
    false
  );
  private readonly _tempoStepper: HTMLInputElement = input({
    style:
      "width: 4em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    type: "number",
    step: "1",
  });
  private readonly _songEqFilterEditor: FilterEditor = new FilterEditor(
    this.doc,
    false,
    false,
    true
  );
  private readonly _songEqFilterZoom: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; padding-left:0.2em; height:1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("customSongEQFilterSettings"),
    },
    "+"
  );
  private readonly _chorusSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.chorusRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeChorus(this.doc, oldValue, newValue),
    false
  );
  private readonly _chorusRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("chorus") },
      "Chorus:"
    ),
    this._chorusSlider.container
  );
  private readonly _reverbSlider: Slider = new Slider(
    input({
      style: "margin: 0; position: sticky,",
      type: "range",
      min: "0",
      max: Config.reverbRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeReverb(this.doc, oldValue, newValue),
    false
  );
  private readonly _reverbRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("reverb") },
      "Reverb:"
    ),
    this._reverbSlider.container
  );
  private readonly _ringModWaveSelect: HTMLSelectElement = buildOptions(
    select({}),
    Config.operatorWaves.map((wave) => wave.name)
  );
  private readonly _ringModPulsewidthSlider: Slider = new Slider(
    input({
      style: "margin-left: 10px; width: 85%;",
      type: "range",
      min: "0",
      max: Config.pwmOperatorWaves.length - 1,
      value: "0",
      step: "1",
      title: "Pulse Width",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeRingModPulseWidth(this.doc, oldValue, newValue),
    true
  );
  private readonly _ringModSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.ringModRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeRingMod(this.doc, oldValue, newValue),
    false
  );
  private readonly _ringModRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("ringMod") },
      "Ring Mod:"
    ),
    this._ringModSlider.container
  );
  private readonly _ringModHzSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.ringModHzRange - 1,
      value: Config.ringModHzRange - Config.ringModHzRange / 2,
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeRingModHz(this.doc, oldValue, newValue),
    true
  );
  public readonly ringModHzNum: HTMLParagraphElement = div({
    style: "font-size: 80%; ",
    id: "ringModHzNum",
  });
  private readonly _ringModHzSliderRow: HTMLDivElement = div(
    { class: "selectRow", style: "width:100%;" },
    div(
      { style: "display:flex; flex-direction:column; align-items:center;" },
      span(
        {
          class: "tip",
          style: "font-size: smaller;",
          onclick: () => this._openPrompt("RingModHz"),
        },
        "Hertz: "
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; `,
        },
        this.ringModHzNum
      )
    ),
    this._ringModHzSlider.container
  );
  private readonly _ringModWaveText: HTMLSpanElement = span(
    { class: "tip", onclick: () => this._openPrompt("ringModChipWave") },
    "Wave: "
  );
  private readonly _ringModWaveSelectRow: HTMLDivElement = div(
    { class: "selectRow", style: "width: 100%;" },
    this._ringModWaveText,
    this._ringModPulsewidthSlider.container,
    div(
      { class: "selectContainer", style: "width:40%;" },
      this._ringModWaveSelect
    )
  );
  private readonly _ringModContainerRow: HTMLDivElement = div(
    { class: "", style: "display:flex; flex-direction:column;" },
    this._ringModRow,
    this._ringModHzSliderRow,
    // this._rmOffsetHzSliderRow,
    this._ringModWaveSelectRow
  );
  private readonly _granularSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.granularRange,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeGranular(this.doc, oldValue, newValue),
    false
  );
  private readonly _granularRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("granular") },
      "Granular:"
    ),
    this._granularSlider.container
  );
  private readonly _grainSizeSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: Config.grainSizeMin / Config.grainSizeStep,
      max: Config.grainSizeMax / Config.grainSizeStep,
      value: Config.grainSizeMin / Config.grainSizeStep,
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeGrainSize(this.doc, oldValue, newValue),
    false
  );
  public readonly grainSizeNum: HTMLParagraphElement = div({
    style: "font-size: 80%; ",
    id: "grainSizeNum",
  });
  private readonly _grainSizeSliderRow: HTMLDivElement = div(
    { class: "selectRow", style: "width:100%;" },
    div(
      { style: "display:flex; flex-direction:column; align-items:center;" },
      span(
        {
          class: "tip",
          style: "font-size: smaller;",
          onclick: () => this._openPrompt("grainSize"),
        },
        "Grain: "
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; `,
        },
        this.grainSizeNum
      )
    ),
    this._grainSizeSlider.container
  );
  private readonly _grainAmountsSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.grainAmountsMax,
      value: 8,
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeGrainAmounts(this.doc, oldValue, newValue),
    false
  );
  private readonly _grainAmountsRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("grainAmount") },
      "Grain Freq:"
    ),
    this._grainAmountsSlider.container
  );
  private readonly _grainRangeSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.grainRangeMax / Config.grainSizeStep,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeGrainRange(this.doc, oldValue, newValue),
    false
  );
  public readonly grainRangeNum: HTMLParagraphElement = div({
    style: "font-size: 80%; ",
    id: "grainRangeNum",
  });
  private readonly _grainRangeSliderRow: HTMLDivElement = div(
    { class: "selectRow", style: "width:100%;" },
    div(
      { style: "display:flex; flex-direction:column; align-items:center;" },
      span(
        {
          class: "tip",
          style: "font-size: smaller;",
          onclick: () => this._openPrompt("grainRange"),
        },
        "Range: "
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; `,
        },
        this.grainRangeNum
      )
    ),
    this._grainRangeSlider.container
  );
  private readonly _granularContainerRow: HTMLDivElement = div(
    { class: "", style: "display:flex; flex-direction:column;" },
    this._granularRow,
    this._grainAmountsRow,
    this._grainSizeSliderRow,
    this._grainRangeSliderRow
  );
  private readonly _echoSustainSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.echoSustainRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeEchoSustain(this.doc, oldValue, newValue),
    false
  );
  private readonly _echoSustainRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("echoSustain") },
      "Echo:"
    ),
    this._echoSustainSlider.container
  );
  private readonly _echoDelaySlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.echoDelayRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeEchoDelay(this.doc, oldValue, newValue),
    false
  );
  private readonly _echoDelayRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("echoDelay") },
      "Echo Delay:"
    ),
    this._echoDelaySlider.container
  );
  private readonly _rhythmSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.rhythms.map((rhythm) => rhythm.name)
  );
  private readonly _pitchedPresetSelect: HTMLSelectElement = buildPresetOptions(
    false,
    "pitchPresetSelect"
  );
  private readonly _drumPresetSelect: HTMLSelectElement = buildPresetOptions(
    true,
    "drumPresetSelect"
  );
  private readonly _algorithmSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.algorithms.map((algorithm) => algorithm.name)
  );
  private readonly _algorithmSelectRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("algorithm") },
      "Algorithm: "
    ),
    div({ class: "selectContainer" }, this._algorithmSelect)
  );
  private readonly _instrumentButtons: HTMLButtonElement[] = [];
  private readonly _instrumentAddButton: HTMLButtonElement = button({
    type: "button",
    class: "add-instrument last-button",
  });
  private readonly _instrumentRemoveButton: HTMLButtonElement = button({
    type: "button",
    class: "remove-instrument",
  });
  private readonly _instrumentsButtonBar: HTMLDivElement = div(
    { class: "instrument-bar" },
    this._instrumentRemoveButton,
    this._instrumentAddButton
  );
  private readonly _instrumentsButtonRow: HTMLDivElement = div(
    { class: "selectRow", style: "display: none;" },
    span(
      { class: "tip", onclick: () => this._openPrompt("instrumentIndex") },
      "Instrument:"
    ),
    this._instrumentsButtonBar
  );
  private readonly _instrumentVolumeSlider: Slider = new Slider(
    input({
      style: "margin: 0; position: sticky;",
      type: "range",
      min: Math.floor(-Config.volumeRange / 2),
      max: Math.floor(Config.volumeRange / 2),
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeVolume(this.doc, oldValue, newValue),
    true
  );
  private readonly _instrumentVolumeSliderInputBox: HTMLInputElement = input({
    style: "width: 4em; font-size: 80%",
    id: "volumeSliderInputBox",
    type: "number",
    step: "1",
    min: Math.floor(-Config.volumeRange / 2),
    max: Math.floor(Config.volumeRange / 2),
    value: "0",
  });
  private readonly _instrumentVolumeSliderTip: HTMLDivElement = div(
    { class: "selectRow", style: "height: 1em" },
    span(
      {
        class: "tip",
        style: "font-size: smaller;",
        onclick: () => this._openPrompt("instrumentVolume"),
      },
      "Volume: "
    )
  );
  private readonly _instrumentVolumeSliderRow: HTMLDivElement = div(
    { class: "selectRow" },
    div(
      {},
      div(
        {
          style: `color: ${getSecondaryNoteColor(this.doc, this.doc.channel)};`,
        },
        span({ class: "tip" }, this._instrumentVolumeSliderTip)
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; margin-top: -3px;`,
        },
        this._instrumentVolumeSliderInputBox
      )
    ),
    this._instrumentVolumeSlider.container
  );
  private readonly _panSlider: Slider = new Slider(
    input({
      style: "margin: 0; position: sticky;",
      type: "range",
      min: "0",
      max: Config.panMax,
      value: Config.panCenter,
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangePan(this.doc, oldValue, newValue),
    true
  );
  private readonly _panDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Pan),
    },
    "▼"
  );
  private readonly _panSliderInputBox: HTMLInputElement = input({
    style: "width: 4em; font-size: 80%; ",
    id: "panSliderInputBox",
    type: "number",
    step: "1",
    min: "0",
    max: "100",
    value: "0",
  });
  private readonly _panSliderRow: HTMLDivElement = div(
    { class: "selectRow" },
    div(
      {},
      span(
        {
          class: "tip",
          tabindex: "0",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("pan"),
        },
        "Pan: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._panSliderInputBox
      )
    ),
    this._panDropdown,
    this._panSlider.container
  );
  private readonly _panDelaySlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["pan delay"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangePanDelay(this.doc, oldValue, newValue),
    false
  );
  private readonly _panDelayRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("panDelay"),
      },
      "‣ Delay:"
    ),
    this._panDelaySlider.container
  );
  private readonly _panDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: "display: none;" },
    this._panDelayRow
  );
  private readonly _chipWaveSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.chipWaves.map((wave) => wave.name)
  );
  private readonly _chipNoiseSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.chipNoises.map((wave) => wave.name)
  );
  // advloop addition
  // @TODO: Add a dropdown for these. Or maybe this checkbox is fine?
  private readonly _useChipWaveAdvancedLoopControlsBox = input({
    type: "checkbox",
    style: "width: 1em; padding: 0; margin-left: 0.4em; margin-right: 4em;",
  });
  private readonly _chipWaveLoopModeSelect = buildOptions(select(), [
    "Loop",
    "Ping-Pong",
    "Play Once",
    "Play Loop Once",
  ]);
  private readonly _chipWaveLoopStartStepper = input({
    type: "number",
    min: "0",
    step: "1",
    value: "0",
    style:
      "width: 100%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
  });
  private readonly _chipWaveLoopEndStepper = input({
    type: "number",
    min: "0",
    step: "1",
    value: "0",
    style:
      "width: 100%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
  });
  private readonly _setChipWaveLoopEndToEndButton = button(
    {
      type: "button",
      style: "width: 1.5em; height: 1.5em; padding: 0; margin-left: 0.5em;",
    },
    SVG.svg(
      {
        width: "16",
        height: "16",
        viewBox: "-13 -14 26 26",
        "pointer-events": "none",
        style: "width: 100%; height: 100%;",
      },
      SVG.rect({
        x: "4",
        y: "-6",
        width: "2",
        height: "12",
        fill: ColorConfig.primaryText,
      }),
      SVG.path({ d: "M -6 -6 L -6 6 L 3 0 z", fill: ColorConfig.primaryText })
    )
  );
  private readonly _chipWaveStartOffsetStepper = input({
    type: "number",
    min: "0",
    step: "1",
    value: "0",
    style:
      "width: 100%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
  });
  private readonly _chipWavePlayBackwardsBox = input({
    type: "checkbox",
    style: "width: 1em; padding: 0; margin-left: 0.4em; margin-right: 4em;",
  });
  // advloop addition
  private readonly _chipWaveSelectRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("chipWave") },
      "Wave: "
    ),
    div({ class: "selectContainer" }, this._chipWaveSelect)
  );
  private readonly _chipNoiseSelectRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("chipNoise") },
      "Noise: "
    ),
    div({ class: "selectContainer" }, this._chipNoiseSelect)
  );
  private readonly _visualLoopControlsButton: HTMLButtonElement = button(
    {
      style:
        "margin-left: 0em; padding-left: 0.2em; height: 1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("visualLoopControls"),
    },
    "+"
  );
  private readonly _useChipWaveAdvancedLoopControlsRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        style: "flex-shrink: 0;",
        onclick: () => this._openPrompt("loopControls"),
      },
      "Loop Controls: "
    ),
    this._useChipWaveAdvancedLoopControlsBox
  );
  private readonly _chipWaveLoopModeSelectRow = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        style: "font-size: x-small;",
        onclick: () => this._openPrompt("loopMode"),
      },
      "Loop Mode: "
    ),
    div({ class: "selectContainer" }, this._chipWaveLoopModeSelect)
  );
  private readonly _chipWaveLoopStartRow = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        style: "font-size: x-small;",
        onclick: () => this._openPrompt("loopStart"),
      },
      "Loop Start: "
    ),
    this._visualLoopControlsButton,
    span({ style: "display: flex;" }, this._chipWaveLoopStartStepper)
  );
  private readonly _chipWaveLoopEndRow = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        style: "font-size: x-small;",
        onclick: () => this._openPrompt("loopEnd"),
      },
      "Loop End: "
    ),
    span(
      { style: "display: flex;" },
      this._chipWaveLoopEndStepper,
      this._setChipWaveLoopEndToEndButton
    )
  );
  private readonly _chipWaveStartOffsetRow = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("offset") },
      "Offset: "
    ),
    span({ style: "display: flex;" }, this._chipWaveStartOffsetStepper)
  );
  private readonly _chipWavePlayBackwardsRow = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("backwards") },
      "Backwards: "
    ),
    this._chipWavePlayBackwardsBox
  );
  private readonly _fadeInOutEditor: FadeInOutEditor = new FadeInOutEditor(
    this.doc
  );
  private readonly _fadeInOutRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("fadeInOut") },
      "Fade:"
    ),
    this._fadeInOutEditor.container
  );
  private readonly _transitionSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.transitions.map((transition) => transition.name)
  );
  private readonly _transitionDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Transition),
    },
    "▼"
  );
  private readonly _transitionRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("transition") },
      "Transition:"
    ),
    this._transitionDropdown,
    div(
      { class: "selectContainer", style: "width: 52.5%;" },
      this._transitionSelect
    )
  );
  private readonly _clicklessTransitionBox: HTMLInputElement = input({
    type: "checkbox",
    style: "width: 1em; padding: 0; margin-right: 4em;",
  });
  private readonly _clicklessTransitionRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("clicklessTransition"),
      },
      "‣ Clickless:"
    ),
    this._clicklessTransitionBox
  );
  private readonly _transitionDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: "display: none;" },
    this._clicklessTransitionRow
  );
  private readonly _discreteSlideSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.discreteSlideTypes.map((type) => type.name)
  );
  private readonly _discreteSlideRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("discreteSlide") },
      "Discrete Slide:"
    ),
    div({ class: "selectContainer" }, this._discreteSlideSelect)
  );

  private readonly _effectsSelect: HTMLSelectElement = select(
    option({ selected: true, disabled: true, hidden: false })
  ); // todo: "hidden" should be true but looks wrong on mac chrome, adds checkmark next to first visible option even though it's not selected. :(
  private readonly _eqFilterSimpleButton: HTMLButtonElement = button(
    {
      style: "font-size: x-small; width: 50%; height: 40%",
      class: "no-underline",
      onclick: () => this._switchEQFilterType(true),
    },
    "simple"
  );
  private readonly _eqFilterAdvancedButton: HTMLButtonElement = button(
    {
      style: "font-size: x-small; width: 50%; height: 40%",
      class: "last-button no-underline",
      onclick: () => this._switchEQFilterType(false),
    },
    "advanced"
  );
  private readonly _eqFilterTypeRow: HTMLElement = div(
    { class: "selectRow", style: "padding-top: 4px; margin-bottom: 0px;" },
    span(
      {
        style: "font-size: x-small;",
        class: "tip",
        onclick: () => this._openPrompt("filterType"),
      },
      "EQ Filt.Type:"
    ),
    div(
      { class: "instrument-bar" },
      this._eqFilterSimpleButton,
      this._eqFilterAdvancedButton
    )
  );
  private readonly _eqFilterEditor: FilterEditor = new FilterEditor(this.doc);
  private readonly _eqFilterZoom: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; padding-left:0.2em; height:1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("customEQFilterSettings"),
    },
    "+"
  );
  private readonly _eqFilterRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("eqFilter") },
      "EQ Filt:"
    ),
    this._eqFilterZoom,
    this._eqFilterEditor.container
  );
  private readonly _eqFilterSimpleCutSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.filterSimpleCutRange - 1,
      value: "6",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeEQFilterSimpleCut(this.doc, oldValue, newValue),
    false
  );
  private _eqFilterSimpleCutRow: HTMLDivElement = div(
    { class: "selectRow", title: "Low-pass Filter Cutoff Frequency" },
    span(
      { class: "tip", onclick: () => this._openPrompt("filterCutoff") },
      "Filter Cut:"
    ),
    this._eqFilterSimpleCutSlider.container
  );
  private readonly _eqFilterSimplePeakSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.filterSimplePeakRange - 1,
      value: "6",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeEQFilterSimplePeak(this.doc, oldValue, newValue),
    false
  );
  private _eqFilterSimplePeakRow: HTMLDivElement = div(
    { class: "selectRow", title: "Low-pass Filter Peak Resonance" },
    span(
      { class: "tip", onclick: () => this._openPrompt("filterResonance") },
      "Filter Peak:"
    ),
    this._eqFilterSimplePeakSlider.container
  );

  private readonly _noteFilterSimpleButton: HTMLButtonElement = button(
    {
      style: "font-size: x-small; width: 50%; height: 40%",
      class: "no-underline",
      onclick: () => this._switchNoteFilterType(true),
    },
    "simple"
  );
  private readonly _noteFilterAdvancedButton: HTMLButtonElement = button(
    {
      style: "font-size: x-small; width: 50%; height: 40%",
      class: "last-button no-underline",
      onclick: () => this._switchNoteFilterType(false),
    },
    "advanced"
  );
  private readonly _noteFilterTypeRow: HTMLElement = div(
    { class: "selectRow", style: "padding-top: 4px; margin-bottom: 0px;" },
    span(
      {
        style: "font-size: x-small;",
        class: "tip",
        onclick: () => this._openPrompt("filterType"),
      },
      "Note Filt.Type:"
    ),
    div(
      { class: "instrument-bar" },
      this._noteFilterSimpleButton,
      this._noteFilterAdvancedButton
    )
  );
  private readonly _noteFilterEditor: FilterEditor = new FilterEditor(
    this.doc,
    true
  );
  private readonly _noteFilterZoom: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; padding-left:0.2em; height:1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("customNoteFilterSettings"),
    },
    "+"
  );
  private readonly _noteFilterRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("noteFilter") },
      "Note Filt:"
    ),
    this._noteFilterZoom,
    this._noteFilterEditor.container
  );
  private readonly _noteFilterSimpleCutSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.filterSimpleCutRange - 1,
      value: "6",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeNoteFilterSimpleCut(this.doc, oldValue, newValue),
    false
  );
  private _noteFilterSimpleCutRow: HTMLDivElement = div(
    { class: "selectRow", title: "Low-pass Filter Cutoff Frequency" },
    span(
      { class: "tip", onclick: () => this._openPrompt("filterCutoff") },
      "Filter Cut:"
    ),
    this._noteFilterSimpleCutSlider.container
  );
  private readonly _noteFilterSimplePeakSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.filterSimplePeakRange - 1,
      value: "6",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeNoteFilterSimplePeak(this.doc, oldValue, newValue),
    false
  );
  private _noteFilterSimplePeakRow: HTMLDivElement = div(
    { class: "selectRow", title: "Low-pass Filter Peak Resonance" },
    span(
      { class: "tip", onclick: () => this._openPrompt("filterResonance") },
      "Filter Peak:"
    ),
    this._noteFilterSimplePeakSlider.container
  );

  private readonly _supersawDynamismSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.supersawDynamismMax,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeSupersawDynamism(this.doc, oldValue, newValue),
    false
  );
  private readonly _supersawDynamismRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("supersawDynamism") },
      "Dynamism:"
    ),
    this._supersawDynamismSlider.container
  );
  private readonly _supersawSpreadSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.supersawSpreadMax,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeSupersawSpread(this.doc, oldValue, newValue),
    false
  );
  private readonly _supersawSpreadRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("supersawSpread") },
      "Spread:"
    ),
    this._supersawSpreadSlider.container
  );
  private readonly _supersawShapeSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.supersawShapeMax,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeSupersawShape(this.doc, oldValue, newValue),
    false
  );
  private readonly _supersawShapeRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        onclick: () => this._openPrompt("supersawShape"),
        style: "overflow: clip;",
      },
      "Saw/Pulse:"
    ),
    this._supersawShapeSlider.container
  );

  private readonly _pulseWidthSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "1",
      max: Config.pulseWidthRange,
      value: "1",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangePulseWidth(this.doc, oldValue, newValue),
    false
  );
  private readonly _pulseWidthDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:53px; position: absolute; margin-top: 15px; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.PulseWidth),
    },
    "▼"
  );
  private readonly _pwmSliderInputBox: HTMLInputElement = input({
    style: "width: 4em; font-size: 70%;",
    id: "pwmSliderInputBox",
    type: "number",
    step: "1",
    min: "1",
    max: Config.pulseWidthRange,
    value: "1",
  });
  private readonly _pulseWidthRow: HTMLDivElement = div(
    { class: "selectRow" },
    div(
      {},
      span(
        {
          class: "tip",
          tabindex: "0",
          style: "height:1em; font-size: smaller; white-space: nowrap;",
          onclick: () => this._openPrompt("pulseWidth"),
        },
        "Pulse Width:"
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; margin-top: -3px;`,
        },
        this._pwmSliderInputBox
      )
    ),
    this._pulseWidthDropdown,
    this._pulseWidthSlider.container
  );
  //private readonly _pulseWidthRow: HTMLDivElement = div({ class: "selectRow" }, span({ class: "tip", onclick: () => this._openPrompt("pulseWidth") }, "Pulse Width:"), this._pulseWidthDropdown, this._pulseWidthSlider.container);
  private readonly _decimalOffsetSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: "99",
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeDecimalOffset(this.doc, oldValue, 99 - newValue),
    false
  );
  private readonly _decimalOffsetRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:10px;",
        onclick: () => this._openPrompt("decimalOffset"),
      },
      "‣ Offset:"
    ),
    this._decimalOffsetSlider.container
  );
  private readonly _pulseWidthDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: "display: none;" },
    this._decimalOffsetRow
  );

  private readonly _pitchShiftSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.pitchShiftRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangePitchShift(this.doc, oldValue, newValue),
    true
  );
  private readonly _pitchShiftTonicMarkers: HTMLDivElement[] = [
    div({ class: "pitchShiftMarker", style: { color: ColorConfig.tonic } }),
    div({
      class: "pitchShiftMarker",
      style: { color: ColorConfig.tonic, left: "50%" },
    }),
    div({
      class: "pitchShiftMarker",
      style: { color: ColorConfig.tonic, left: "100%" },
    }),
  ];
  private readonly _pitchShiftFifthMarkers: HTMLDivElement[] = [
    div({
      class: "pitchShiftMarker",
      style: { color: ColorConfig.fifthNote, left: (100 * 7) / 24 + "%" },
    }),
    div({
      class: "pitchShiftMarker",
      style: { color: ColorConfig.fifthNote, left: (100 * 19) / 24 + "%" },
    }),
  ];
  private readonly _pitchShiftMarkerContainer: HTMLDivElement = div(
    { style: "display: flex; position: relative;" },
    this._pitchShiftSlider.container,
    div(
      { class: "pitchShiftMarkerContainer" },
      this._pitchShiftTonicMarkers,
      this._pitchShiftFifthMarkers
    )
  );
  private readonly _pitchShiftRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("pitchShift") },
      "Pitch Shift:"
    ),
    this._pitchShiftMarkerContainer
  );
  private readonly _detuneSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: Config.detuneMin - Config.detuneCenter,
      max: Config.detuneMax - Config.detuneCenter,
      value: 0,
      step: "4",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeDetune(this.doc, oldValue, newValue),
    true
  );
  private readonly _detuneSliderInputBox: HTMLInputElement = input({
    style: "width: 4em; font-size: 80%; ",
    id: "detuneSliderInputBox",
    type: "number",
    step: "1",
    min: Config.detuneMin - Config.detuneCenter,
    max: Config.detuneMax - Config.detuneCenter,
    value: 0,
  });
  private readonly _detuneSliderRow: HTMLDivElement = div(
    { class: "selectRow" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("detune"),
        },
        "Detune: "
      ),
      div(
        {
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; margin-top: -3px;`,
        },
        this._detuneSliderInputBox
      )
    ),
    this._detuneSlider.container
  );
  private readonly _distortionSlider: Slider = new Slider(
    input({
      style: "margin: 0; position: sticky;",
      type: "range",
      min: "0",
      max: Config.distortionRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeDistortion(this.doc, oldValue, newValue),
    false
  );
  private readonly _distortionRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("distortion") },
      "Distortion:"
    ),
    this._distortionSlider.container
  );
  private readonly _aliasingBox: HTMLInputElement = input({
    type: "checkbox",
    style: "width: 1em; padding: 0; margin-right: 4em;",
  });
  private readonly _aliasingRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        style: "margin-left:10px;",
        onclick: () => this._openPrompt("aliases"),
      },
      "Aliasing:"
    ),
    this._aliasingBox
  );
  private readonly _bitcrusherQuantizationSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.bitcrusherQuantizationRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeBitcrusherQuantization(this.doc, oldValue, newValue),
    false
  );
  private readonly _bitcrusherQuantizationRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        onclick: () => this._openPrompt("bitcrusherQuantization"),
      },
      "Bit Crush:"
    ),
    this._bitcrusherQuantizationSlider.container
  );
  private readonly _bitcrusherFreqSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.bitcrusherFreqRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeBitcrusherFreq(this.doc, oldValue, newValue),
    false
  );
  private readonly _bitcrusherFreqRow: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("bitcrusherFreq") },
      "Freq Crush:"
    ),
    this._bitcrusherFreqSlider.container
  );
  private readonly _stringSustainSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.stringSustainRange - 1,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeStringSustain(this.doc, oldValue, newValue),
    false
  );
  private readonly _stringSustainLabel: HTMLSpanElement = span(
    { class: "tip", onclick: () => this._openPrompt("stringSustain") },
    "Sustain:"
  );
  private readonly _stringSustainRow: HTMLDivElement = div(
    { class: "selectRow" },
    this._stringSustainLabel,
    this._stringSustainSlider.container
  );

  private readonly _unisonDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Unison),
    },
    "▼"
  );

  private readonly _unisonSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.unisons.map((unison) => unison.name)
  );
  private readonly _unisonSelectRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("unison") },
      "Unison:"
    ),
    this._unisonDropdown,
    div(
      { class: "selectContainer", style: "width: 61.5%;" },
      this._unisonSelect
    )
  );

  private readonly _unisonVoicesInputBox: HTMLInputElement = input({
    style:
      "width: 150%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    id: "unisonVoicesInputBox",
    type: "number",
    step: "1",
    min: Config.unisonVoicesMin,
    max: Config.unisonVoicesMax,
    value: 1,
  });
  private readonly _unisonVoicesRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("unisonVoices"),
        },
        "‣ Voices: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._unisonVoicesInputBox
      )
    )
  );
  private readonly _unisonSpreadInputBox: HTMLInputElement = input({
    style:
      "width: 150%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    id: "unisonSpreadInputBox",
    type: "number",
    step: "0.001",
    min: Config.unisonSpreadMin,
    max: Config.unisonSpreadMax,
    value: 0.0,
  });
  private readonly _unisonSpreadRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("unisonSpread"),
        },
        "‣ Spread: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._unisonSpreadInputBox
      )
    )
  );

  private readonly _unisonOffsetInputBox: HTMLInputElement = input({
    style:
      "width: 150%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    id: "unisonOffsetInputBox",
    type: "number",
    step: "0.001",
    min: Config.unisonOffsetMin,
    max: Config.unisonOffsetMax,
    value: 0.0,
  });
  private readonly _unisonOffsetRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("unisonOffset"),
        },
        "‣ Offset: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._unisonOffsetInputBox
      )
    )
  );
  private readonly _unisonExpressionInputBox: HTMLInputElement = input({
    style:
      "width: 150%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    id: "unisonExpressionInputBox",
    type: "number",
    step: "0.001",
    min: Config.unisonExpressionMin,
    max: Config.unisonExpressionMax,
    value: 1.4,
  });
  private readonly _unisonExpressionRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("unisonExpression"),
        },
        "‣ Volume: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._unisonExpressionInputBox
      )
    )
  );
  private readonly _unisonSignInputBox: HTMLInputElement = input({
    style:
      "width: 150%; height: 1.5em; font-size: 80%; margin-left: 0.4em; vertical-align: middle;",
    id: "unisonSignInputBox",
    type: "number",
    step: "0.001",
    min: Config.unisonSignMin,
    max: Config.unisonSignMax,
    value: 1.0,
  });
  private readonly _unisonSignRow: HTMLDivElement = div(
    { class: "selectRow dropFader" },
    div(
      {},
      span(
        {
          class: "tip",
          style: "height:1em; font-size: smaller;",
          onclick: () => this._openPrompt("unisonSign"),
        },
        "‣ Sign: "
      ),
      div(
        {
          style:
            "color: " +
            getSecondaryNoteColor(this.doc, this.doc.channel) +
            "; margin-top: -3px;",
        },
        this._unisonSignInputBox
      )
    )
  );
  private readonly _unisonDropdownGroup: HTMLElement = div(
    {
      class: "editor-controls",
      style: "display: none; gap: 3px; margin-bottom: 0.5em;",
    },
    this._unisonVoicesRow,
    this._unisonSpreadRow,
    this._unisonOffsetRow,
    this._unisonExpressionRow,
    this._unisonSignRow
  );

  private readonly _chordSelect: HTMLSelectElement = buildOptions(
    select({ style: "flex-shrink: 100" }),
    Config.chords.map((chord) => chord.name)
  );
  private readonly _chordDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Chord),
    },
    "▼"
  );
  private readonly _monophonicNoteInputBox: HTMLInputElement = input({
    style:
      "width: 2.35em; height: 1.5em; font-size: 80%; margin: 0.5em; vertical-align: middle;",
    id: "unisonSignInputBox",
    type: "number",
    step: "1",
    min: 1,
    max: Config.maxChordSize,
    value: 1.0,
  });
  private readonly _chordSelectContainer: HTMLDivElement = div(
    { class: "selectContainer", style: "width=100%" },
    this._chordSelect
  );

  private readonly _chordSelectRow: HTMLElement = div(
    { class: "selectRow", style: "display: flex; flex-direction: row" },
    span(
      { class: "tip", onclick: () => this._openPrompt("chords") },
      "Chords:"
    ),
    this._monophonicNoteInputBox,
    this._chordDropdown,
    this._chordSelectContainer
  );
  private readonly _arpeggioSpeedDisplay: HTMLSpanElement = span(
    {
      style: `color: ${getSecondaryNoteColor(
        this.doc,
        this.doc.channel
      )}; font-size: smaller; text-overflow: clip;`,
    },
    "x1"
  );
  private readonly _arpeggioSpeedSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["arp speed"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeArpeggioSpeed(this.doc, oldValue, newValue),
    false
  );
  private readonly _arpeggioSpeedRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("arpeggioSpeed"),
      },
      "‣ Spd:"
    ),
    this._arpeggioSpeedDisplay,
    this._arpeggioSpeedSlider.container
  );
  private readonly _twoNoteArpBox: HTMLInputElement = input({
    type: "checkbox",
    style: "width: 1em; padding: 0; margin-right: 4em;",
  });
  private readonly _twoNoteArpRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("twoNoteArpeggio"),
      },
      "‣ Fast Two-Note:"
    ),
    this._twoNoteArpBox
  );

  private readonly _chordDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: "display: none;" },
    this._arpeggioSpeedRow,
    this._twoNoteArpRow
  );

  private readonly _vibratoSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.vibratos.map((vibrato) => vibrato.name)
  );
  private readonly _vibratoDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Vibrato),
    },
    "▼"
  );
  private readonly _vibratoSelectRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("vibrato") },
      "Vibrato:"
    ),
    this._vibratoDropdown,
    div(
      { class: "selectContainer", style: "width: 61.5%;" },
      this._vibratoSelect
    )
  );
  private readonly _vibratoDepthSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["vibrato depth"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeVibratoDepth(this.doc, oldValue, newValue),
    false
  );
  private readonly _vibratoDepthRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("vibratoDepth"),
      },
      "‣ Depth:"
    ),
    this._vibratoDepthSlider.container
  );
  private readonly _vibratoSpeedDisplay: HTMLSpanElement = span(
    {
      style: `color: ${getSecondaryNoteColor(
        this.doc,
        this.doc.channel
      )}; font-size: smaller; text-overflow: clip;`,
    },
    "x1"
  );
  private readonly _vibratoSpeedSlider: Slider = new Slider(
    input({
      style: "margin: 0; text-overflow: clip;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["vibrato speed"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeVibratoSpeed(this.doc, oldValue, newValue),
    false
  );
  private readonly _vibratoSpeedRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("vibratoSpeed"),
      },
      "‣ Spd:"
    ),
    this._vibratoSpeedDisplay,
    this._vibratoSpeedSlider.container
  );
  private readonly _vibratoDelaySlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["vibrato delay"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeVibratoDelay(this.doc, oldValue, newValue),
    false
  );
  private readonly _vibratoDelayRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("vibratoDelay"),
      },
      "‣ Delay:"
    ),
    this._vibratoDelaySlider.container
  );
  private readonly _vibratoTypeSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.vibratoTypes.map((vibrato) => vibrato.name)
  );
  private readonly _vibratoTypeSelectRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("vibratoType"),
      },
      "‣ Type:"
    ),
    div(
      { class: "selectContainer", style: "width: 61.5%;" },
      this._vibratoTypeSelect
    )
  );
  private readonly _vibratoDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: `display: none;` },
    this._vibratoDepthRow,
    this._vibratoSpeedRow,
    this._vibratoDelayRow,
    this._vibratoTypeSelectRow
  );
  private readonly _phaseModGroup: HTMLElement = div({
    class: "editor-controls",
  });
  private readonly _feedbackTypeSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.feedbacks.map((feedback) => feedback.name)
  );
  private readonly _feedbackRow1: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("feedbackType") },
      "Feedback:"
    ),
    div({ class: "selectContainer" }, this._feedbackTypeSelect)
  );
  private readonly _spectrumEditor: SpectrumEditor = new SpectrumEditor(
    this.doc,
    null
  );
  private readonly _spectrumZoom: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; padding-left:0.2em; height:1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("spectrumSettings"),
    },
    "+"
  );
  private readonly _spectrumRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        onclick: () => this._openPrompt("spectrum"),
        style: "font-size: smaller",
      },
      "Spectrum:"
    ),
    this._spectrumZoom,
    this._spectrumEditor.container
  );
  private readonly _harmonicsEditor: HarmonicsEditor = new HarmonicsEditor(
    this.doc
  );
  private readonly _harmonicsZoom: HTMLButtonElement = button(
    {
      style: "padding-left:0.2em; height:1.5em; max-width: 12px;",
      onclick: () => this._openPrompt("harmonicsSettings"),
    },
    "+"
  );
  private readonly _harmonicsRow: HTMLElement = div(
    { class: "selectRow" },
    span(
      {
        class: "tip",
        onclick: () => this._openPrompt("harmonics"),
        style: "font-size: smaller",
      },
      "Harmonics:"
    ),
    this._harmonicsZoom,
    this._harmonicsEditor.container
  );

  //SongEditor.ts
  readonly envelopeEditor: EnvelopeEditor = new EnvelopeEditor(
    this.doc,
    (id: number, submenu: number, subtype: string) =>
      this._toggleDropdownMenu(id, submenu, subtype),
    (name: string) => this._openPrompt(name)
  );
  private readonly _envelopeSpeedDisplay: HTMLSpanElement = span(
    {
      style: `color: ${getSecondaryNoteColor(
        this.doc,
        this.doc.channel
      )}; font-size: smaller; text-overflow: clip;`,
    },
    "x1"
  );
  private readonly _envelopeSpeedSlider: Slider = new Slider(
    input({
      style: "margin: 0;",
      type: "range",
      min: "0",
      max: Config.modulators.dictionary["envelope speed"].maxRawVol,
      value: "0",
      step: "1",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeEnvelopeSpeed(this.doc, oldValue, newValue),
    false
  );
  private readonly _envelopeSpeedRow: HTMLElement = div(
    { class: "selectRow dropFader" },
    span(
      {
        class: "tip",
        style: "margin-left:4px;",
        onclick: () => this._openPrompt("envelopeSpeed"),
      },
      "‣ Spd:"
    ),
    this._envelopeSpeedDisplay,
    this._envelopeSpeedSlider.container
  );
  private readonly _envelopeDropdownGroup: HTMLElement = div(
    { class: "editor-controls", style: "display: none;" },
    this._envelopeSpeedRow
  );
  private readonly _envelopeDropdown: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; margin-right: 1em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: () => this._toggleDropdownMenu(DropdownID.Envelope),
    },
    "▼"
  );

  private readonly _drumsetGroup: HTMLElement = div({
    class: "editor-controls",
  });
  private readonly _drumsetZoom: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; padding-left:0.3em; margin-right:0.5em; height:1.5em; max-width: 16px;",
      onclick: () => this._openPrompt("drumsetSettings"),
    },
    "+"
  );
  private readonly _modulatorGroup: HTMLElement = div({
    class: "editor-controls",
  });
  private readonly _modNameRows: HTMLElement[];
  private readonly _modChannelBoxes: HTMLSelectElement[];
  private readonly _modInstrumentBoxes: HTMLSelectElement[];
  private readonly _modSetRows: HTMLElement[];
  private readonly _modSetBoxes: HTMLSelectElement[];
  private readonly _modFilterRows: HTMLElement[];
  private readonly _modFilterBoxes: HTMLSelectElement[];
  private readonly _modEnvelopeRows: HTMLElement[];
  private readonly _modEnvelopeBoxes: HTMLSelectElement[];
  private readonly _modTargetIndicators: SVGElement[];

  private readonly _feedback6OpTypeSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.feedbacks6Op.map((feedback) => feedback.name)
  );
  private readonly _feedback6OpRow1: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("feedbackType") },
      "Feedback:"
    ),
    div({ class: "selectContainer" }, this._feedback6OpTypeSelect)
  );

  private readonly _algorithmCanvasSwitch: HTMLButtonElement = button(
    {
      style:
        "margin-left:0em; height:1.5em; width: 10px; padding: 0px; font-size: 8px;",
      onclick: (e: Event) => this._toggleAlgorithmCanvas(e),
    },
    "A"
  );
  private readonly _customAlgorithmCanvas: CustomAlgorythmCanvas =
    new CustomAlgorythmCanvas(
      canvas({
        width: 144,
        height: 144,
        style: "border:2px solid " + ColorConfig.uiWidgetBackground,
        id: "customAlgorithmCanvas",
      }),
      this.doc,
      (newArray: number[][], carry: number, mode: string) =>
        new ChangeCustomAlgorythmorFeedback(this.doc, newArray, carry, mode)
    );
  private readonly _algorithm6OpSelect: HTMLSelectElement = buildOptions(
    select(),
    Config.algorithms6Op.map((algorithm) => algorithm.name)
  );
  private readonly _algorithm6OpSelectRow: HTMLDivElement = div(
    div(
      { class: "selectRow" },
      span(
        { class: "tip", onclick: () => this._openPrompt("algorithm") },
        "Algorithm: "
      ),
      div({ class: "selectContainer" }, this._algorithm6OpSelect)
    ),
    div(
      {
        style:
          "height:144px; display:flex; flex-direction: row; align-items:center; justify-content:center;",
      },
      div(
        { style: "display:block; width:10px; margin-right: 0.2em" },
        this._algorithmCanvasSwitch
      ),
      div(
        { style: "width:144px; height:144px;" },
        this._customAlgorithmCanvas.canvas
      )
    )
  ); //temp

  private readonly _instrumentCopyButton: HTMLButtonElement = button(
    {
      style: "max-width:86px; width: 86px;",
      class: "copyButton",
      title: "Copy Instrument (⇧C)",
    },
    [
      "Copy",
      // Copy icon:
      SVG.svg(
        {
          style:
            "flex-shrink: 0; position: absolute; left: 0; top: 50%; margin-top: -1em; pointer-events: none;",
          width: "2em",
          height: "2em",
          viewBox: "-5 -21 26 26",
        },
        [
          SVG.path({
            d: "M 0 -15 L 1 -15 L 1 0 L 13 0 L 13 1 L 0 1 L 0 -15 z M 2 -1 L 2 -17 L 10 -17 L 14 -13 L 14 -1 z M 3 -2 L 13 -2 L 13 -12 L 9 -12 L 9 -16 L 3 -16 z",
            fill: "currentColor",
          }),
        ]
      ),
    ]
  );
  private readonly _instrumentPasteButton: HTMLButtonElement = button(
    {
      style: "max-width:86px;",
      class: "pasteButton",
      title: "Paste Instrument (⇧V)",
    },
    [
      "Paste",
      // Paste icon:
      SVG.svg(
        {
          style:
            "flex-shrink: 0; position: absolute; left: 0; top: 50%; margin-top: -1em; pointer-events: none;",
          width: "2em",
          height: "2em",
          viewBox: "0 0 26 26",
        },
        [
          SVG.path({
            d: "M 8 18 L 6 18 L 6 5 L 17 5 L 17 7 M 9 8 L 16 8 L 20 12 L 20 22 L 9 22 z",
            stroke: "currentColor",
            fill: "none",
          }),
          SVG.path({
            d: "M 9 3 L 14 3 L 14 6 L 9 6 L 9 3 z M 16 8 L 20 12 L 16 12 L 16 8 z",
            fill: "currentColor",
          }),
        ]
      ),
    ]
  );

  private readonly _instrumentExportButton: HTMLButtonElement = button(
    { style: "max-width:86px; width: 86px;", class: "exportInstrumentButton" },
    [
      "Export",
      // Export icon:
      SVG.svg(
        {
          style:
            "flex-shrink: 0; position: absolute; left: 0; top: 50%; margin-top: -1em; pointer-events: none;",
          width: "2em",
          height: "2em",
          viewBox: "0 -960 960 960",
        },
        [
          SVG.path({
            d: "M200-120v-40h560v40H200Zm279.231-150.769L254.615-568.462h130.769V-840h188.462v271.538h130.77L479.231-270.769Zm0-65.385 142.923-191.538h-88.308V-800H425.385v272.308h-88.308l142.154 191.538ZM480-527.692Z",
            fill: "currentColor",
          }),
        ]
      ),
    ]
  );
  private readonly _instrumentImportButton: HTMLButtonElement = button(
    { style: "max-width:86px;", class: "importInstrumentButton" },
    [
      "Import",
      // Import icon:
      SVG.svg(
        {
          style:
            "flex-shrink: 0; position: absolute; left: 0; top: 50%; margin-top: -1em; pointer-events: none;",
          width: "2em",
          height: "2em",
          viewBox: "0 -960 960 960",
        },
        [
          SVG.path({
            d: "M200-120v-40h560v40H200Zm185.384-150.769v-271.539H254.615L480-840l224.616 297.692h-130.77v271.539H385.384Zm40.001-40h108.461v-272.308h88.308L480-774.615 337.077-583.077h88.308v272.308ZM480-583.077Z",
            fill: "currentColor",
          }),
        ]
      ),
    ]
  );

  public readonly _globalOscscope: oscilloscopeCanvas = new oscilloscopeCanvas(
    canvas({
      width: 144,
      height: 32,
      style: `border: 2px solid ${ColorConfig.uiWidgetBackground}; position: static;`,
      id: "oscilloscopeAll",
    }),
    1
  );
  private readonly _globalOscscopeContainer: HTMLDivElement = div(
    { style: "height: 38px; margin-left: auto; margin-right: auto;" },
    this._globalOscscope.canvas
  );
  private readonly _customWaveDrawCanvas: CustomChipCanvas =
    new CustomChipCanvas(
      canvas({
        width: 128,
        height: 52,
        style: "border:2px solid " + ColorConfig.uiWidgetBackground,
        id: "customWaveDrawCanvas",
      }),
      this.doc,
      (newArray: Float32Array) => new ChangeCustomWave(this.doc, newArray)
    );
  private readonly _customWavePresetDrop: HTMLSelectElement =
    buildHeaderedOptions(
      "Load Preset",
      select({
        style:
          "width: 50%; height:1.5em; text-align: center; text-align-last: center;",
      }),
      Config.chipWaves.map((wave) => wave.name)
    );
  private readonly _customWaveZoom: HTMLButtonElement = button(
    {
      style: "margin-left:0.5em; height:1.5em; max-width: 20px;",
      onclick: () => this._openPrompt("customChipSettings"),
    },
    "+"
  );

  private readonly _customWaveDraw: HTMLDivElement = div(
    { style: "height:80px; margin-top:10px; margin-bottom:5px" },
    [
      div({ style: "height:54px; display:flex; justify-content:center;" }, [
        this._customWaveDrawCanvas.canvas,
      ]),
      div({ style: "margin-top:5px; display:flex; justify-content:center;" }, [
        this._customWavePresetDrop,
        this._customWaveZoom,
      ]),
    ]
  );

  private readonly _songTitleInputBox: InputBox = new InputBox(
    input({
      style:
        "font-weight:bold; border:none; width: 98%; background-color:${ColorConfig.editorBackground}; color:${ColorConfig.primaryText}; text-align:center",
      maxlength: "30",
      type: "text",
      value: EditorConfig.versionDisplayName,
    }),
    this.doc,
    (oldValue: string, newValue: string) =>
      new ChangeSongTitle(this.doc, oldValue, newValue)
  );

  private readonly _feedbackAmplitudeSlider: Slider = new Slider(
    input({
      type: "range",
      min: "0",
      max: Config.operatorAmplitudeMax,
      value: "0",
      step: "1",
      title: "Feedback Amplitude",
    }),
    this.doc,
    (oldValue: number, newValue: number) =>
      new ChangeFeedbackAmplitude(this.doc, oldValue, newValue),
    false
  );
  private readonly _feedbackRow2: HTMLDivElement = div(
    { class: "selectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("feedbackVolume") },
      "Fdback Vol:"
    ),
    this._feedbackAmplitudeSlider.container
  );
  /*
     * @jummbus - my very real, valid reason for cutting this button: I don't like it.
     * 
    private readonly _customizeInstrumentButton: HTMLButtonElement = button({type: "button", style: "margin: 2px 0"},

        "Customize Instrument",
    );
    */
  private readonly _addEnvelopeButton: HTMLButtonElement = button({
    type: "button",
    class: "add-envelope",
  });
  private readonly _customInstrumentSettingsGroup: HTMLDivElement = div(
    { class: "editor-controls" },
    this._panSliderRow,
    this._panDropdownGroup,
    this._chipWaveSelectRow,
    this._chipNoiseSelectRow,
    this._useChipWaveAdvancedLoopControlsRow,
    this._chipWaveLoopModeSelectRow,
    this._chipWaveLoopStartRow,
    this._chipWaveLoopEndRow,
    this._chipWaveStartOffsetRow,
    this._chipWavePlayBackwardsRow,
    this._customWaveDraw,
    this._eqFilterTypeRow,
    this._eqFilterRow,
    this._eqFilterSimpleCutRow,
    this._eqFilterSimplePeakRow,
    this._fadeInOutRow,
    this._algorithmSelectRow,
    this._algorithm6OpSelectRow,
    this._phaseModGroup,
    this._feedbackRow1,
    this._feedback6OpRow1,
    this._feedbackRow2,
    this._spectrumRow,
    this._harmonicsRow,
    this._drumsetGroup,
    this._supersawDynamismRow,
    this._supersawSpreadRow,
    this._supersawShapeRow,
    this._pulseWidthRow,
    // this._decimalOffsetRow,
    this._pulseWidthDropdownGroup,
    this._stringSustainRow,
    this._unisonSelectRow,
    this._unisonDropdownGroup,
    div(
      {
        style: `padding: 2px 0; margin-left: 2em; display: flex; align-items: center;`,
      },
      span(
        { style: `flex-grow: 1; text-align: center;` },
        span(
          { class: "tip", onclick: () => this._openPrompt("effects") },
          "Effects"
        )
      ),
      div({ class: "effects-menu" }, this._effectsSelect)
    ),
    this._transitionRow,
    this._transitionDropdownGroup,
    this._discreteSlideRow,
    this._chordSelectRow,
    this._chordDropdownGroup,
    this._pitchShiftRow,
    this._detuneSliderRow,
    this._vibratoSelectRow,
    this._vibratoDropdownGroup,
    this._noteFilterTypeRow,
    this._noteFilterRow,
    this._noteFilterSimpleCutRow,
    this._noteFilterSimplePeakRow,
    // this._corruptionRow,
    // this._corruptionTypeRow,
    this._distortionRow,
    this._aliasingRow,
    this._bitcrusherQuantizationRow,
    this._bitcrusherFreqRow,
    this._chorusRow,
    this._echoSustainRow,
    this._echoDelayRow,
    this._reverbRow,
    this._ringModContainerRow,
    this._granularContainerRow,
    div(
      {
        style: `padding: 2px 0; margin-left: 2em; display: flex; align-items: center;`,
      },
      span(
        { style: `flex-grow: 1; text-align: center;` },
        span(
          { class: "tip", onclick: () => this._openPrompt("envelopes") },
          "Envelopes"
        )
      ),
      this._envelopeDropdown,
      this._addEnvelopeButton
    ),
    this._envelopeDropdownGroup,
    this.envelopeEditor.container
  );
  private readonly _instrumentCopyGroup: HTMLDivElement = div(
    { class: "editor-controls" },
    div(
      { class: "selectRow" },
      this._instrumentCopyButton,
      this._instrumentPasteButton
    )
  );
  private readonly _instrumentExportGroup: HTMLDivElement = div(
    { class: "editor-controls" },
    div(
      { class: "selectRow" },
      this._instrumentExportButton,
      this._instrumentImportButton
    )
  );
  private readonly _instrumentSettingsTextRow: HTMLDivElement = div(
    {
      id: "instrumentSettingsText",
      style: `padding: 3px 0; max-width: 15em; text-align: center; color: inherit`,
    },
    "Instrument Settings"
  );
  private readonly _instrumentTypeSelectRow: HTMLDivElement = div(
    { class: "selectRow", id: "typeSelectRow" },
    span(
      { class: "tip", onclick: () => this._openPrompt("instrumentType") },
      "Type:"
    ),
    div(
      div({ class: "pitchSelect" }, this._pitchedPresetSelect),
      div({ class: "drumSelect" }, this._drumPresetSelect)
    )
  );
  private readonly _instrumentSettingsGroup: HTMLDivElement = div(
    { class: "editor-controls" },
    this._instrumentSettingsTextRow,
    this._instrumentsButtonRow,
    // these could've been put into _instrumentSettingsGroup as well but I decided not to
    // this._instrumentCopyGroup,
    // this._instrumentExportGroup,
    this._instrumentTypeSelectRow,
    this._instrumentVolumeSliderRow,
    //this._customizeInstrumentButton,
    this._customInstrumentSettingsGroup
  );
  private readonly _usedPatternIndicator: SVGElement = SVG.path({
    d: "M -6 -6 H 6 V 6 H -6 V -6 M -2 -3 L -2 -3 L -1 -4 H 1 V 4 H -1 V -1.2 L -1.2 -1 H -2 V -3 z",
    fill: ColorConfig.indicatorSecondary,
    "fill-rule": "evenodd",
  });
  private readonly _usedInstrumentIndicator: SVGElement = SVG.path({
    d: "M -6 -0.8 H -3.8 V -6 H 0.8 V 4.4 H 2.2 V -0.8 H 6 V 0.8 H 3.8 V 6 H -0.8 V -4.4 H -2.2 V 0.8 H -6 z",
    fill: ColorConfig.indicatorSecondary,
  });
  private readonly _jumpToModIndicator: SVGElement = SVG.svg(
    {
      style: "width: 92%; height: 1.3em; flex-shrink: 0; position: absolute;",
      viewBox: "0 0 200 200",
    },
    [
      SVG.path({
        d: "M90 155 l0 -45 -45 0 c-25 0 -45 -4 -45 -10 0 -5 20 -10 45 -10 l45 0 0 -45 c0 -25 5 -45 10 -45 6 0 10 20 10 45 l0 45 45 0 c25 0 45 5 45 10 0 6 -20 10 -45 10 l -45 0 0 45 c0 25 -4 45 -10 45 -5 0 -10 -20 -10 -45z",
      }),
      SVG.path({
        d: "M42 158 c-15 -15 -16 -38 -2 -38 6 0 10 7 10 15 0 8 7 15 15 15 8 0 15 5 15 10 0 14 -23 13 -38 -2z",
      }),
      SVG.path({
        d: "M120 160 c0 -5 7 -10 15 -10 8 0 15 -7 15 -15 0 -8 5 -15 10 -15 14 0 13 23 -2 38 -15 15 -38 16 -38 2z",
      }),
      SVG.path({
        d: "M32 58 c3 -23 48 -40 48 -19 0 6 -7 11 -15 11 -8 0 -15 7 -15 15 0 8 -5 15 -11 15 -6 0 -9 -10 -7 -22z",
      }),
      SVG.path({
        d: "M150 65 c0 -8 -7 -15 -15 -15 -8 0 -15 -4 -15 -10 0 -14 23 -13 38 2 15 15 16 38 2 38 -5 0 -10 -7 -10 -15z",
      }),
    ]
  );

  private readonly _promptContainer: HTMLDivElement = div({
    class: "promptContainer",
    style: "display: none;",
  });
  private readonly _promptContainerBG: HTMLDivElement = div({
    class: "promptContainerBG",
    style:
      "display: none; height: 100%; width: 100%; position: fixed; z-index: 99; overflow-x: hidden; pointer-events: none;",
  });
  private readonly _zoomInButton: HTMLButtonElement = button({
    class: "zoomInButton",
    type: "button",
    title: "Zoom In",
  });
  private readonly _zoomOutButton: HTMLButtonElement = button({
    class: "zoomOutButton",
    type: "button",
    title: "Zoom Out",
  });
  private readonly _patternEditorRow: HTMLDivElement = div(
    {
      style:
        "flex: 1; height: 100%; display: flex; overflow: hidden; justify-content: center;",
    },
    this._patternEditorPrev.container,
    this._patternEditor.container,
    this._patternEditorNext.container
  );
  private readonly _patternArea: HTMLDivElement = div(
    { class: "pattern-area" },
    this._piano.container,
    this._patternEditorRow,
    this._octaveScrollBar.container,
    this._zoomInButton,
    this._zoomOutButton
  );
  private readonly _trackContainer: HTMLDivElement = div(
    { class: "trackContainer" },
    this._trackEditor.container,
    this._loopEditor.container
  );
  private readonly _trackVisibleArea: HTMLDivElement = div({
    style:
      "position: absolute; width: 100%; height: 100%; pointer-events: none;",
  });
  private readonly _trackAndMuteContainer: HTMLDivElement = div(
    { class: "trackAndMuteContainer" },
    this._muteEditor.container,
    this._trackContainer,
    this._trackVisibleArea
  );
  public readonly _barScrollBar: BarScrollBar = new BarScrollBar(this.doc);
  private readonly _trackArea: HTMLDivElement = div(
    { class: "track-area" },
    this._trackAndMuteContainer,
    this._barScrollBar.container
  );

  private readonly _menuArea: HTMLDivElement = div(
    { class: "menu-area" },
    div({ class: "selectContainer menu file" }, this._fileMenu),
    div({ class: "selectContainer menu edit" }, this._editMenu),
    div({ class: "selectContainer menu preferences" }, this._optionsMenu)
  );

  private readonly _sampleLoadingBar: HTMLDivElement = div({
    style: `width: 0%; height: 100%; background-color: ${ColorConfig.indicatorPrimary};`,
  });
  private readonly _sampleLoadingBarContainer: HTMLDivElement = div(
    {
      style: `width: 80%; height: 4px; overflow: hidden; margin-left: auto; margin-right: auto; margin-top: 0.5em; cursor: pointer; background-color: ${ColorConfig.indicatorSecondary};`,
    },
    this._sampleLoadingBar
  );
  private readonly _sampleLoadingStatusContainer: HTMLDivElement = div(
    { style: "cursor: pointer;" },
    div(
      {
        style: `margin-top: 0.5em; text-align: center; color: inherit`,
      },
      "Sample Loading Status"
    ),
    div(
      { class: "selectRow", style: "height: 6px; margin-bottom: 0.5em;" },
      this._sampleLoadingBarContainer
    )
  );

  private readonly _songSettingsArea: HTMLDivElement = div(
    { class: "song-settings-area" },
    div(
      { class: "editor-controls" },
      div(
        { class: "editor-song-settings" },
        div(
          {
            style:
              "margin: 3px 0; position: relative; text-align: center; color: ${getSecondaryNoteColor(this.doc, this.doc.channel)};",
          },
          div(
            {
              class: "tip",
              style:
                "flex-shrink: 0; position:absolute; left: 0; top: 0; width: 12px; height: 12px",
              onclick: () => this._openPrompt("usedPattern"),
            },
            SVG.svg(
              {
                style:
                  "flex-shrink: 0; position: absolute; left: 0; top: 0; pointer-events: none;",
                width: "12px",
                height: "12px",
                "margin-right": "0.5em",
                viewBox: "-6 -6 12 12",
              },
              this._usedPatternIndicator
            )
          ),
          div(
            {
              class: "tip",
              style:
                "flex-shrink: 0; position: absolute; left: 14px; top: 0; width: 12px; height: 12px",
              onclick: () => this._openPrompt("usedInstrument"),
            },
            SVG.svg(
              {
                style:
                  "flex-shrink: 0; position: absolute; left: 0; top: 0; pointer-events: none;",
                width: "12px",
                height: "12px",
                "margin-right": "1em",
                viewBox: "-6 -6 12 12",
              },
              this._usedInstrumentIndicator
            )
          ),
          "Song Settings",
          div(
            {
              style:
                "width: 100%; left: 0; top: -1px; position:absolute; overflow-x:clip;",
            },
            this._jumpToModIndicator
          )
        )
      ),
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("scale") },
          "Scale: "
        ),
        div({ class: "selectContainer" }, this._scaleSelect)
      ),
      div(
        { class: "selectRow" },
        span({ class: "tip", onclick: () => this._openPrompt("key") }, "Key: "),
        div({ class: "selectContainer" }, this._keySelect)
      ),
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("key_octave") },
          "Octave: "
        ),
        this._octaveStepper
      ),
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("tempo") },
          "Tempo: "
        ),
        span(
          { style: "display: flex;" },
          this._tempoSlider.container,
          this._tempoStepper
        )
      ),
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("rhythm") },
          "Rhythm: "
        ),
        div({ class: "selectContainer" }, this._rhythmSelect)
      ),
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("songeq") },
          span("Song EQ:")
        ),
        this._songEqFilterZoom,
        this._songEqFilterEditor.container
      ),
      this._sampleLoadingStatusContainer
    )
  );
  private readonly _instrumentSettingsArea: HTMLDivElement = div(
    { class: "instrument-settings-area" },
    this._instrumentSettingsGroup,
    this._modulatorGroup
  );
  public readonly _settingsArea: HTMLDivElement = div(
    { class: "settings-area noSelection" },
    div(
      { class: "version-area" },
      div(
        {
          style: `text-align: center; margin: 3px 0; color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )};`,
        },
        this._songTitleInputBox.input
      )
    ),
    div(
      { class: "play-pause-area" },
      this._volumeBarBox,
      div(
        { class: "playback-bar-controls" },
        this._playButton,
        this._pauseButton,
        this._recordButton,
        this._stopButton,
        this._prevBarButton,
        this._nextBarButton
      ),
      div(
        { class: "playback-volume-controls" },
        span({ class: "volume-speaker" }),
        this._volumeSlider.container
      ),
      this._globalOscscopeContainer
    ),
    this._menuArea,
    this._songSettingsArea,
    this._instrumentSettingsArea
  );

  public readonly mainLayer: HTMLDivElement = div(
    { class: "beepboxEditor", tabIndex: "0" },
    this._patternArea,
    this._trackArea,
    this._settingsArea,
    this._promptContainer
  );

  private _wasPlaying: boolean = false;
  private _currentPromptName: string | null = null;
  private _highlightedInstrumentIndex: number = -1;
  private _renderedInstrumentCount: number = 0;
  private _renderedIsPlaying: boolean = false;
  private _renderedIsRecording: boolean = false;
  private _renderedShowRecordButton: boolean = false;
  private _renderedCtrlHeld: boolean = false;
  private _ctrlHeld: boolean = false;
  private _shiftHeld: boolean = false;
  private _deactivatedInstruments: boolean = false;
  private readonly _operatorRows: HTMLDivElement[] = [];
  private readonly _operatorAmplitudeSliders: Slider[] = [];
  private readonly _operatorFrequencySelects: HTMLSelectElement[] = [];
  private readonly _operatorDropdowns: HTMLButtonElement[] = [];
  private readonly _operatorWaveformSelects: HTMLSelectElement[] = [];
  private readonly _operatorWaveformHints: HTMLSpanElement[] = [];
  private readonly _operatorWaveformPulsewidthSliders: Slider[] = [];
  private readonly _operatorDropdownRows: HTMLElement[] = [];
  private readonly _operatorDropdownGroups: HTMLDivElement[] = [];
  readonly _drumsetSpectrumEditors: SpectrumEditor[] = [];
  private readonly _drumsetEnvelopeSelects: HTMLSelectElement[] = [];
  private _showModSliders: boolean[][] = [];
  private _newShowModSliders: boolean[][] = [];
  private _modSliderValues: number[][] = [];
  private _hasActiveModSliders: boolean = false;

  private _openPanDropdown: boolean = false;
  private _openVibratoDropdown: boolean = false;
  private _openEnvelopeDropdown: boolean = false;
  private _openChordDropdown: boolean = false;
  private _openTransitionDropdown: boolean = false;
  private _openOperatorDropdowns: boolean[] = [];
  private _openPulseWidthDropdown: boolean = false;
  private _openUnisonDropdown: boolean = false;

  private outVolumeHistoricTimer: number = 0;
  private outVolumeHistoricCap: number = 0;
  private lastOutVolumeCap: number = 0;
  public patternUsed: boolean = false;
  private _modRecTimeout: number = -1;

  constructor(/*private _doc: SongDocument*/) {
    this.doc.notifier.watch(this.whenUpdated);
    this.doc.modRecordingHandler = () => {
      this.handleModRecording();
    };
    new MidiInputHandler(this.doc);
    window.addEventListener("resize", this.whenUpdated);
    window.requestAnimationFrame(this.updatePlayButton);
    window.requestAnimationFrame(this._animate);

    if (!("share" in navigator)) {
      this._fileMenu.removeChild(
        this._fileMenu.querySelector("[value='shareUrl']")!
      );
    }

    this._scaleSelect.appendChild(
      optgroup(
        { label: "Edit" },
        option({ value: "forceScale" }, "Snap Notes To Scale"),
        option({ value: "customize" }, "Edit Custom Scale")
      )
    );
    this._keySelect.appendChild(
      optgroup({ label: "Edit" }, option({ value: "detectKey" }, "Detect Key"))
    );
    this._rhythmSelect.appendChild(
      optgroup(
        { label: "Edit" },
        option({ value: "forceRhythm" }, "Snap Notes To Rhythm")
      )
    );

    this._vibratoSelect.appendChild(
      option({ hidden: true, value: 5 }, "custom")
    );

    //this._unisonSelect.appendChild(option({ hidden: true, value: 28 }, "custom"));

    this._unisonSelect.appendChild(
      option({ hidden: true, value: Config.unisons.length }, "custom")
    );

    this._showModSliders = new Array<boolean[]>(Config.modulators.length);
    this._modSliderValues = new Array<number[]>(Config.modulators.length);
    //set default values
    for (let i = 0; i < Config.modulators.length; i++) {
      this._newShowModSliders[i] = [];
      this._showModSliders[i] = [];
      this._modSliderValues[i] = [];
    }

    this._phaseModGroup.appendChild(
      div(
        {
          class: "selectRow",
          style: `color: ${getSecondaryNoteColor(
            this.doc,
            this.doc.channel
          )}; height: 1em; margin-top: 0.5em;`,
        },
        div({ style: "margin-right: .1em; visibility: hidden;" }, 1 + "."),
        div(
          {
            style: "width: 3em; margin-right: .3em;",
            class: "tip",
            onclick: () => this._openPrompt("operatorFrequency"),
          },
          "Freq:"
        ),
        div(
          { class: "tip", onclick: () => this._openPrompt("operatorVolume") },
          "Volume:"
        )
      )
    );
    for (let i: number = 0; i < Config.operatorCount + 2; i++) {
      const operatorIndex: number = i;
      const operatorNumber: HTMLDivElement = div(
        {
          style:
            "margin-right: 0px; color: " +
            "inherit" +
            ";",
        },
        i + 1 + ""
      );
      const frequencySelect: HTMLSelectElement = buildOptions(
        select({ style: "width: 100%;", title: "Frequency" }),
        Config.operatorFrequencies.map((freq) => freq.name)
      );
      const amplitudeSlider: Slider = new Slider(
        input({
          type: "range",
          min: "0",
          max: Config.operatorAmplitudeMax,
          value: "0",
          step: "1",
          title: "Volume",
        }),
        this.doc,
        (oldValue: number, newValue: number) =>
          new ChangeOperatorAmplitude(
            this.doc,
            operatorIndex,
            oldValue,
            newValue
          ),
        false
      );
      const waveformSelect: HTMLSelectElement = buildOptions(
        select({ style: "width: 100%;", title: "Waveform" }),
        Config.operatorWaves.map((wave) => wave.name)
      );
      const waveformDropdown: HTMLButtonElement = button(
        {
          style:
            "margin-left:0em; margin-right: 2px; height:1.5em; width: 8px; max-width: 10px; padding: 0px; font-size: 8px;",
          onclick: () => this._toggleDropdownMenu(DropdownID.FM, i),
        },
        "▼"
      );
      const waveformDropdownHint: HTMLSpanElement = span(
        {
          class: "tip",
          style: "margin-left: 10px;",
          onclick: () => this._openPrompt("operatorWaveform"),
        },
        "Wave:"
      );
      const waveformPulsewidthSlider: Slider = new Slider(
        input({
          style: "margin-left: 10px; width: 85%;",
          type: "range",
          min: "0",
          max: Config.pwmOperatorWaves.length - 1,
          value: "0",
          step: "1",
          title: "Pulse Width",
        }),
        this.doc,
        (oldValue: number, newValue: number) =>
          new ChangeOperatorPulseWidth(
            this.doc,
            operatorIndex,
            oldValue,
            newValue
          ),
        true
      );
      const waveformDropdownRow: HTMLElement = div(
        { class: "selectRow" },
        waveformDropdownHint,
        waveformPulsewidthSlider.container,
        div(
          { class: "selectContainer", style: "width: 6em; margin-left: .3em;" },
          waveformSelect
        )
      );
      const waveformDropdownGroup: HTMLDivElement = div(
        { class: "operatorRow" },
        waveformDropdownRow
      );
      const row: HTMLDivElement = div(
        { class: "selectRow" },
        operatorNumber,
        waveformDropdown,
        div(
          {
            class: "selectContainer",
            style: "width: 3em; margin-right: .3em;",
          },
          frequencySelect
        ),
        amplitudeSlider.container
      );
      this._phaseModGroup.appendChild(row);
      this._operatorRows[i] = row;
      this._operatorAmplitudeSliders[i] = amplitudeSlider;
      this._operatorFrequencySelects[i] = frequencySelect;
      this._operatorDropdowns[i] = waveformDropdown;
      this._operatorWaveformHints[i] = waveformDropdownHint;
      this._operatorWaveformSelects[i] = waveformSelect;
      this._operatorWaveformPulsewidthSliders[i] = waveformPulsewidthSlider;
      this._operatorDropdownRows[i] = waveformDropdownRow;
      this._phaseModGroup.appendChild(waveformDropdownGroup);
      this._operatorDropdownGroups[i] = waveformDropdownGroup;
      this._openOperatorDropdowns[i] = false;

      waveformSelect.addEventListener("change", () => {
        this.doc.record(
          new ChangeOperatorWaveform(
            this.doc,
            operatorIndex,
            waveformSelect.selectedIndex
          )
        );
      });

      frequencySelect.addEventListener("change", () => {
        this.doc.record(
          new ChangeOperatorFrequency(
            this.doc,
            operatorIndex,
            frequencySelect.selectedIndex
          )
        );
      });
    }

    this._drumsetGroup.appendChild(
      div(
        { class: "selectRow" },
        span(
          { class: "tip", onclick: () => this._openPrompt("drumsetEnvelope") },
          "Envelope:"
        ),
        span(
          { class: "tip", onclick: () => this._openPrompt("drumsetSpectrum") },
          "Spectrum:"
        ),
        this._drumsetZoom
      )
    );
    for (let i: number = Config.drumCount - 1; i >= 0; i--) {
      const drumIndex: number = i;
      const spectrumEditor: SpectrumEditor = new SpectrumEditor(
        this.doc,
        drumIndex
      );
      spectrumEditor.container.addEventListener("mousedown", this.refocusStage);
      this._drumsetSpectrumEditors[i] = spectrumEditor;

      const envelopeSelect: HTMLSelectElement = buildOptions(
        select({ style: "width: 100%;", title: "Filter Envelope" }),
        Config.envelopes.map((envelope) => envelope.name)
      );
      this._drumsetEnvelopeSelects[i] = envelopeSelect;
      envelopeSelect.addEventListener("change", () => {
        this.doc.record(
          new ChangeDrumsetEnvelope(
            this.doc,
            drumIndex,
            envelopeSelect.selectedIndex
          )
        );
      });

      const row: HTMLDivElement = div(
        { class: "selectRow" },
        div(
          {
            class: "selectContainer",
            style: "width: 5em; margin-right: .3em;",
          },
          envelopeSelect
        ),
        this._drumsetSpectrumEditors[i].container
      );
      this._drumsetGroup.appendChild(row);
    }

    this._modNameRows = [];
    this._modChannelBoxes = [];
    this._modInstrumentBoxes = [];
    this._modSetRows = [];
    this._modSetBoxes = [];
    this._modFilterRows = [];
    this._modFilterBoxes = [];
    this._modEnvelopeRows = [];
    this._modEnvelopeBoxes = [];
    this._modTargetIndicators = [];
    for (let mod: number = 0; mod < Config.modCount; mod++) {
      let modChannelBox: HTMLSelectElement = select({
        style: "width: 100%; color: currentColor; text-overflow:ellipsis;",
      });
      let modInstrumentBox: HTMLSelectElement = select({
        style: "width: 100%; color: currentColor;",
      });

      let modNameRow: HTMLDivElement = div(
        { class: "operatorRow", style: "height: 1em; margin-bottom: 0.65em;" },
        div(
          {
            class: "tip",
            style: "width: 10%; max-width: 5.4em;",
            id: "modChannelText" + mod,
            onclick: () => this._openPrompt("modChannel"),
          },
          "Ch:"
        ),
        div({ class: "selectContainer", style: "width: 35%;" }, modChannelBox),
        div(
          {
            class: "tip",
            style: "width: 1.2em; margin-left: 0.8em;",
            id: "modInstrumentText" + mod,
            onclick: () => this._openPrompt("modInstrument"),
          },
          "Ins:"
        ),
        div(
          { class: "selectContainer", style: "width: 10%;" },
          modInstrumentBox
        )
      );

      let modSetBox: HTMLSelectElement = select();
      let modFilterBox: HTMLSelectElement = select();
      let modEnvelopeBox: HTMLSelectElement = select();
      let modSetRow: HTMLDivElement = div(
        {
          class: "selectRow",
          id: "modSettingText" + mod,
          style: "margin-bottom: 0.9em; color: currentColor;",
        },
        span(
          { class: "tip", onclick: () => this._openPrompt("modSet") },
          "Setting: "
        ),
        span(
          {
            class: "tip",
            style: "font-size:x-small;",
            onclick: () => this._openPrompt("modSetInfo" + mod),
          },
          "?"
        ),
        div({ class: "selectContainer" }, modSetBox)
      );
      let modFilterRow: HTMLDivElement = div(
        {
          class: "selectRow",
          id: "modFilterText" + mod,
          style: "margin-bottom: 0.9em; color: currentColor;",
        },
        span(
          { class: "tip", onclick: () => this._openPrompt("modFilter" + mod) },
          "Target: "
        ),
        div({ class: "selectContainer" }, modFilterBox)
      );
      let modEnvelopeRow: HTMLDivElement = div(
        {
          class: "selectRow",
          id: "modEnvelopeText" + mod,
          style: "margin-bottom: 0.9em; color: currentColor;",
        },
        span(
          { class: "tip", onclick: () => this._openPrompt("modEnvelope") },
          "Envelope: "
        ),
        div({ class: "selectContainer" }, modEnvelopeBox)
      );

      // @jummbus: I could template this up above and simply create from the template, especially since I also reuse it in song settings, but unsure how to do that with imperative-html :P
      let modTarget: SVGElement = SVG.svg(
        {
          style: "transform: translate(0px, 1px);",
          width: "1.5em",
          height: "1em",
          viewBox: "0 0 200 200",
        },
        [
          SVG.path({
            d: "M90 155 l0 -45 -45 0 c-25 0 -45 -4 -45 -10 0 -5 20 -10 45 -10 l45 0 0 -45 c0 -25 5 -45 10 -45 6 0 10 20 10 45 l0 45 45 0 c25 0 45 5 45 10 0 6 -20 10 -45 10 l -45 0 0 45 c0 25 -4 45 -10 45 -5 0 -10 -20 -10 -45z",
          }),
          SVG.path({
            d: "M42 158 c-15 -15 -16 -38 -2 -38 6 0 10 7 10 15 0 8 7 15 15 15 8 0 15 5 15 10 0 14 -23 13 -38 -2z",
          }),
          SVG.path({
            d: "M120 160 c0 -5 7 -10 15 -10 8 0 15 -7 15 -15 0 -8 5 -15 10 -15 14 0 13 23 -2 38 -15 15 -38 16 -38 2z",
          }),
          SVG.path({
            d: "M32 58 c3 -23 48 -40 48 -19 0 6 -7 11 -15 11 -8 0 -15 7 -15 15 0 8 -5 15 -11 15 -6 0 -9 -10 -7 -22z",
          }),
          SVG.path({
            d: "M150 65 c0 -8 -7 -15 -15 -15 -8 0 -15 -4 -15 -10 0 -14 23 -13 38 2 15 15 16 38 2 38 -5 0 -10 -7 -10 -15z",
          }),
        ]
      );

      this._modNameRows.push(modNameRow);
      this._modChannelBoxes.push(modChannelBox);
      this._modInstrumentBoxes.push(modInstrumentBox);
      this._modSetRows.push(modSetRow);
      this._modSetBoxes.push(modSetBox);
      this._modFilterRows.push(modFilterRow);
      this._modFilterBoxes.push(modFilterBox);
      this._modEnvelopeRows.push(modEnvelopeRow);
      this._modEnvelopeBoxes.push(modEnvelopeBox);
      this._modTargetIndicators.push(modTarget);

      this._modulatorGroup.appendChild(
        div(
          {
            style:
              "margin: 3px 0; font-weight: bold; margin-bottom: 0.7em; text-align: center; color: currentColor;",
          },
          ["Modulator " + (mod + 1), modTarget]
        )
      );
      this._modulatorGroup.appendChild(modNameRow);
      this._modulatorGroup.appendChild(modSetRow);
      this._modulatorGroup.appendChild(modFilterRow);
      this._modulatorGroup.appendChild(modEnvelopeRow);
    }

    // @jummbus - Unsure why this hack is needed for alignment, but I've never been a css wiz...
    this._pitchShiftSlider.container.style.setProperty(
      "transform",
      "translate(0px, 3px)"
    );
    this._pitchShiftSlider.container.style.setProperty("width", "100%");

    this._fileMenu.addEventListener("change", this._fileMenuHandler);
    this._editMenu.addEventListener("change", this._editMenuHandler);
    this._optionsMenu.addEventListener("change", this._optionsMenuHandler);
    this._customWavePresetDrop.addEventListener(
      "change",
      this._customWavePresetHandler
    );
    this._tempoStepper.addEventListener("change", this._whenSetTempo);
    this._scaleSelect.addEventListener("change", this._whenSetScale);
    this._keySelect.addEventListener("change", this._whenSetKey);
    this._octaveStepper.addEventListener("change", this._whenSetOctave);
    this._rhythmSelect.addEventListener("change", this._whenSetRhythm);
    //this._pitchedPresetSelect.addEventListener("change", this._whenSetPitchedPreset);
    //this._drumPresetSelect.addEventListener("change", this._whenSetDrumPreset);
    this._algorithmSelect.addEventListener("change", this._whenSetAlgorithm);
    this._instrumentsButtonBar.addEventListener(
      "click",
      this._whenSelectInstrument
    );
    //this._customizeInstrumentButton.addEventListener("click", this._whenCustomizePressed);
    this._feedbackTypeSelect.addEventListener(
      "change",
      this._whenSetFeedbackType
    );
    this._algorithm6OpSelect.addEventListener(
      "change",
      this._whenSet6OpAlgorithm
    );
    this._feedback6OpTypeSelect.addEventListener(
      "change",
      this._whenSet6OpFeedbackType
    );
    this._chipWaveSelect.addEventListener("change", this._whenSetChipWave);
    this._ringModWaveSelect.addEventListener(
      "change",
      this._whenSetRingModChipWave
    );
    // advloop addition
    this._useChipWaveAdvancedLoopControlsBox.addEventListener(
      "input",
      this._whenSetUseChipWaveAdvancedLoopControls
    );
    this._chipWaveLoopModeSelect.addEventListener(
      "change",
      this._whenSetChipWaveLoopMode
    );
    this._chipWaveLoopStartStepper.addEventListener(
      "change",
      this._whenSetChipWaveLoopStart
    );
    this._chipWaveLoopEndStepper.addEventListener(
      "change",
      this._whenSetChipWaveLoopEnd
    );
    this._setChipWaveLoopEndToEndButton.addEventListener(
      "click",
      this._whenSetChipWaveLoopEndToEnd
    );
    this._chipWaveStartOffsetStepper.addEventListener(
      "change",
      this._whenSetChipWaveStartOffset
    );
    this._chipWavePlayBackwardsBox.addEventListener(
      "input",
      this._whenSetChipWavePlayBackwards
    );
    // advloop addition
    this._sampleLoadingStatusContainer.addEventListener(
      "click",
      this._whenSampleLoadingStatusClicked
    );
    this._chipNoiseSelect.addEventListener("change", this._whenSetNoiseWave);
    this._transitionSelect.addEventListener("change", this._whenSetTransition);
    this._effectsSelect.addEventListener("change", this._whenSetEffects);
    this._discreteSlideSelect.addEventListener(
      "change",
      this._whenSetDiscreteSlide
    );
    this._unisonSelect.addEventListener("change", this._whenSetUnison);
    this._chordSelect.addEventListener("change", this._whenSetChord);
    this._monophonicNoteInputBox.addEventListener(
      "input",
      this._whenSetMonophonicNote
    );
    this._vibratoSelect.addEventListener("change", this._whenSetVibrato);
    this._vibratoTypeSelect.addEventListener(
      "change",
      this._whenSetVibratoType
    );
    this._playButton.addEventListener("click", this.togglePlay);
    this._pauseButton.addEventListener("click", this.togglePlay);
    this._recordButton.addEventListener("click", this._toggleRecord);
    this._stopButton.addEventListener("click", this._toggleRecord);
    // Start recording instead of opening context menu when control-clicking the record button on a Mac.
    this._recordButton.addEventListener("contextmenu", (event: MouseEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        this._toggleRecord();
      }
    });
    this._stopButton.addEventListener("contextmenu", (event: MouseEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        this._toggleRecord();
      }
    });
    this._prevBarButton.addEventListener("click", this._whenPrevBarPressed);
    this._nextBarButton.addEventListener("click", this._whenNextBarPressed);
    this._volumeSlider.input.addEventListener("input", this._setVolumeSlider);
    this._zoomInButton.addEventListener("click", this._zoomIn);
    this._zoomOutButton.addEventListener("click", this._zoomOut);
    this._patternArea.addEventListener(
      "mousedown",
      this._refocusStageNotEditing
    );
    this._trackArea.addEventListener("mousedown", this.refocusStage);

    // The song volume slider is styled slightly different than the class' default.
    this._volumeSlider.container.style.setProperty("flex-grow", "1");
    this._volumeSlider.container.style.setProperty("display", "flex");

    this._volumeBarContainer.style.setProperty("flex-grow", "1");
    this._volumeBarContainer.style.setProperty("display", "flex");

    // Also, any slider with a multiplicative effect instead of a replacement effect gets a different mod color, and a round slider.
    this._volumeSlider.container.style.setProperty(
      "--mod-color",
      ColorConfig.multiplicativeModSlider
    );
    this._volumeSlider.container.style.setProperty(
      "--mod-border-radius",
      "50%"
    );
    this._instrumentVolumeSlider.container.style.setProperty(
      "--mod-color",
      ColorConfig.multiplicativeModSlider
    );
    this._instrumentVolumeSlider.container.style.setProperty(
      "--mod-border-radius",
      "50%"
    );
    this._feedbackAmplitudeSlider.container.style.setProperty(
      "--mod-color",
      ColorConfig.multiplicativeModSlider
    );
    this._feedbackAmplitudeSlider.container.style.setProperty(
      "--mod-border-radius",
      "50%"
    );
    for (let i: number = 0; i < Config.operatorCount + 2; i++) {
      this._operatorAmplitudeSliders[i].container.style.setProperty(
        "--mod-color",
        ColorConfig.multiplicativeModSlider
      );
      this._operatorAmplitudeSliders[i].container.style.setProperty(
        "--mod-border-radius",
        "50%"
      );
    }

    let thisRef: SongEditor = this;
    for (let mod: number = 0; mod < Config.modCount; mod++) {
      this._modChannelBoxes[mod].addEventListener("change", function () {
        thisRef._whenSetModChannel(mod);
      });
      this._modInstrumentBoxes[mod].addEventListener("change", function () {
        thisRef._whenSetModInstrument(mod);
      });
      this._modSetBoxes[mod].addEventListener("change", function () {
        thisRef._whenSetModSetting(mod);
      });
      this._modFilterBoxes[mod].addEventListener("change", function () {
        thisRef._whenSetModFilter(mod);
      });
      this._modEnvelopeBoxes[mod].addEventListener("change", function () {
        thisRef._whenSetModEnvelope(mod);
      });
      this._modTargetIndicators[mod].addEventListener("click", function () {
        thisRef._whenClickModTarget(mod);
      });
    }

    this._jumpToModIndicator.addEventListener("click", function () {
      thisRef._whenClickJumpToModTarget();
    });

    this._patternArea.addEventListener("mousedown", this.refocusStage);
    this._fadeInOutEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._spectrumEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._eqFilterEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._noteFilterEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._songEqFilterEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._harmonicsEditor.container.addEventListener(
      "mousedown",
      this.refocusStage
    );
    this._tempoStepper.addEventListener(
      "keydown",
      this._tempoStepperCaptureNumberKeys,
      false
    );
    this._addEnvelopeButton.addEventListener("click", this._addNewEnvelope);
    this._patternArea.addEventListener(
      "contextmenu",
      this._disableCtrlContextMenu
    );
    this._trackArea.addEventListener(
      "contextmenu",
      this._disableCtrlContextMenu
    );
    this.mainLayer.addEventListener("keydown", this._whenKeyPressed);
    this.mainLayer.addEventListener("keyup", this._whenKeyReleased);
    this.mainLayer.addEventListener("focusin", this._onFocusIn);
    this._instrumentCopyButton.addEventListener(
      "click",
      this._copyInstrument.bind(this)
    );
    this._instrumentPasteButton.addEventListener(
      "click",
      this._pasteInstrument.bind(this)
    );
    this._instrumentExportButton.addEventListener(
      "click",
      this._exportInstruments.bind(this)
    );
    this._instrumentImportButton.addEventListener(
      "click",
      this._importInstruments.bind(this)
    );

    sampleLoadEvents.addEventListener(
      "sampleloaded",
      this._updateSampleLoadingBar.bind(this)
    );

    this._instrumentVolumeSliderInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeVolume(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].volume,
          Math.min(
            25.0,
            Math.max(
              -25.0,
              Math.round(+this._instrumentVolumeSliderInputBox.value)
            )
          )
        )
      );
    });
    this._panSliderInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangePan(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].pan,
          Math.min(
            100.0,
            Math.max(0.0, Math.round(+this._panSliderInputBox.value))
          )
        )
      );
    });
    this._pwmSliderInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangePulseWidth(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].pulseWidth,
          Math.min(
            Config.pulseWidthRange,
            Math.max(1.0, Math.round(+this._pwmSliderInputBox.value))
          )
        )
      );
    });
    this._detuneSliderInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeDetune(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].detune,
          Math.min(
            Config.detuneMax - Config.detuneCenter,
            Math.max(
              Config.detuneMin - Config.detuneCenter,
              Math.round(+this._detuneSliderInputBox.value)
            )
          )
        )
      );
    });

    this._unisonVoicesInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeUnisonVoices(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].unisonVoices,
          Math.min(
            Config.unisonVoicesMax,
            Math.max(
              Config.unisonVoicesMin,
              Math.round(+this._unisonVoicesInputBox.value)
            )
          )
        )
      );
    });
    this._unisonSpreadInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeUnisonSpread(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].unisonSpread,
          Math.min(
            Config.unisonSpreadMax,
            Math.max(Config.unisonSpreadMin, +this._unisonSpreadInputBox.value)
          )
        )
      );
    });
    this._unisonOffsetInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeUnisonOffset(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].unisonOffset,
          Math.min(
            Config.unisonOffsetMax,
            Math.max(Config.unisonOffsetMin, +this._unisonOffsetInputBox.value)
          )
        )
      );
    });
    this._unisonExpressionInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeUnisonExpression(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].unisonExpression,
          Math.min(
            Config.unisonExpressionMax,
            Math.max(
              Config.unisonExpressionMin,
              +this._unisonExpressionInputBox.value
            )
          )
        )
      );
    });
    this._unisonSignInputBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeUnisonSign(
          this.doc,
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ].unisonSign,
          Math.min(
            Config.unisonSignMax,
            Math.max(Config.unisonSignMin, +this._unisonSignInputBox.value)
          )
        )
      );
    });

    this._customWaveDraw.addEventListener("input", () => {
      this.doc.record(
        new ChangeCustomWave(this.doc, this._customWaveDrawCanvas.newArray)
      );
    });
    this._twoNoteArpBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeFastTwoNoteArp(this.doc, this._twoNoteArpBox.checked)
      );
    });
    this._clicklessTransitionBox.addEventListener("input", () => {
      this.doc.record(
        new ChangeClicklessTransition(
          this.doc,
          this._clicklessTransitionBox.checked
        )
      );
    });
    this._aliasingBox.addEventListener("input", () => {
      this.doc.record(new ChangeAliasing(this.doc, this._aliasingBox.checked));
    });

    this._promptContainer.addEventListener("click", (event) => {
      if (this.doc.prefs.closePromptByClickoff === true) {
        if (this.prompt != null && this.prompt.gotMouseUp === true) return;
        if (event.target == this._promptContainer) {
          this.doc.undo();
        }
      }
    });

    // Sorry, bypassing typescript type safety on this function because I want to use the new "passive" option.
    //this._trackAndMuteContainer.addEventListener("scroll", this._onTrackAreaScroll, {capture: false, passive: true});
    (<Function>this._trackAndMuteContainer.addEventListener)(
      "scroll",
      this._onTrackAreaScroll,
      { capture: false, passive: true }
    );

    if (isMobile) {
      const autoPlayOption: HTMLOptionElement = <HTMLOptionElement>(
        this._optionsMenu.querySelector("[value=autoPlay]")
      );
      autoPlayOption.disabled = true;
      autoPlayOption.setAttribute("hidden", "");
    }

    // Beepbox uses availHeight too, but I have a display that fails the check even when one of the other layouts would look better on it. -jummbus
    if (window.screen.availWidth < 710 /*|| window.screen.availHeight < 710*/) {
      const layoutOption: HTMLOptionElement = <HTMLOptionElement>(
        this._optionsMenu.querySelector("[value=layout]")
      );
      layoutOption.disabled = true;
      layoutOption.setAttribute("hidden", "");
    }
  }

  private _whenSampleLoadingStatusClicked = (): void => {
    this._openPrompt("sampleLoadingStatus");
  };

  private _updateSampleLoadingBar(_e: Event): void {
    // @TODO: Avoid this cast and type EventTarget/Event properly.
    const e: SampleLoadedEvent = <SampleLoadedEvent>_e;
    const percent: number =
      e.totalSamples === 0
        ? 0
        : Math.floor((e.samplesLoaded / e.totalSamples) * 100);
    this._sampleLoadingBar.style.width = `${percent}%`;
  }

  private _toggleAlgorithmCanvas(e: Event): void {
    if (this._customAlgorithmCanvas.mode != "feedback") {
      this._customAlgorithmCanvas.mode = "feedback";
      (e.target as Element).textContent = "F";
      this._algorithmCanvasSwitch.value = "feedback";
    } else {
      this._customAlgorithmCanvas.mode = "algorithm";
      (e.target as Element).textContent = "A";
    }
    this._customAlgorithmCanvas.redrawCanvas();
  }

  private _toggleDropdownMenu(
    dropdown: DropdownID,
    submenu: number = 0,
    subtype: string | null = null
  ): void {
    let target: HTMLButtonElement = this._vibratoDropdown;
    let group: HTMLElement = this._vibratoDropdownGroup;
    switch (dropdown) {
      case DropdownID.Envelope:
        target = this._envelopeDropdown;
        this._openEnvelopeDropdown = this._openEnvelopeDropdown ? false : true;
        group = this._envelopeDropdownGroup;
        break;
      case DropdownID.Vibrato:
        target = this._vibratoDropdown;
        this._openVibratoDropdown = this._openVibratoDropdown ? false : true;
        group = this._vibratoDropdownGroup;
        break;
      case DropdownID.Pan:
        target = this._panDropdown;
        this._openPanDropdown = this._openPanDropdown ? false : true;
        group = this._panDropdownGroup;
        break;
      case DropdownID.Chord:
        target = this._chordDropdown;
        this._openChordDropdown = this._openChordDropdown ? false : true;
        group = this._chordDropdownGroup;
        break;
      case DropdownID.Transition:
        target = this._transitionDropdown;
        this._openTransitionDropdown = this._openTransitionDropdown
          ? false
          : true;
        group = this._transitionDropdownGroup;
        break;
      case DropdownID.FM:
        target = this._operatorDropdowns[submenu];
        this._openOperatorDropdowns[submenu] = this._openOperatorDropdowns[
          submenu
        ]
          ? false
          : true;
        group = this._operatorDropdownGroups[submenu];
        break;
      case DropdownID.PulseWidth:
        target = this._pulseWidthDropdown;
        this._openPulseWidthDropdown = this._openPulseWidthDropdown
          ? false
          : true;
        group = this._pulseWidthDropdownGroup;
        break;
      case DropdownID.Unison:
        target = this._unisonDropdown;
        this._openUnisonDropdown = this._openUnisonDropdown ? false : true;
        group = this._unisonDropdownGroup;
        break;
      case DropdownID.EnvelopeSettings:
        target = this.envelopeEditor.extraSettingsDropdowns[submenu];
        this.envelopeEditor.openExtraSettingsDropdowns[submenu] = this
          .envelopeEditor.openExtraSettingsDropdowns[submenu]
          ? false
          : true;
        group = this.envelopeEditor.extraSettingsDropdownGroups[submenu];
        break;
    }

    if (target.textContent == "▼") {
      let instrument: Instrument =
        this.doc.song.channels[this.doc.channel].instruments[
          this.doc.getCurrentInstrument()
        ];
      target.textContent = "▲";
      if (dropdown == DropdownID.EnvelopeSettings) {
        group.style.display = "flex";
        // if (subtype == "pitch") {
        //     this.envelopeEditor.extraPitchSettingsGroups[submenu].style.display = "flex";
        //     this.envelopeEditor.perEnvelopeSpeedGroups[submenu].style.display = "none";
        // } else {
        //     this.envelopeEditor.extraPitchSettingsGroups[submenu].style.display = "none";
        //     if (subtype == "notesize" || subtype == "none" || subtype == "punch") {
        //         this.envelopeEditor.perEnvelopeSpeedGroups[submenu].style.display = "none";
        //     } else {
        //         this.envelopeEditor.perEnvelopeSpeedGroups[submenu].style.display = "flex";
        //     }
        // }
        this.envelopeEditor.rerenderExtraSettings();
      } else if (group != this._chordDropdownGroup) {
        group.style.display = "";
      } // Only show arpeggio dropdown if chord arpeggiates
      else if (instrument.chord == Config.chords.dictionary["arpeggio"].index) {
        group.style.display = "";
        if (instrument.chord == Config.chords.dictionary["arpeggio"].index) {
          this._chordDropdownGroup.style.display = "";
        } else {
          this._chordDropdownGroup.style.display = "none";
        }
      }

      for (let i: number = 0; i < group.children.length; i++) {
        // A timeout is needed so that the previous 0s, 0 opacity settings can be applied. They're not done until the group is visible again because display: none prunes animation steps.
        setTimeout(() => {
          (group.children[i] as HTMLElement).style.animationDelay = "0.17s";
          (group.children[i] as HTMLElement).style.opacity = "1";
        });
      }
    } else {
      for (let i: number = 0; i < group.children.length; i++) {
        (group.children[i] as HTMLElement).style.animationDelay = "0s";
        (group.children[i] as HTMLElement).style.opacity = "0";
      }
      target.textContent = "▼";
      group.style.display = "none";
    }
  }

  private _modSliderUpdate(): void {
    if (!this.doc.synth.playing) {
      this._hasActiveModSliders = false;
      this._songEqFilterEditor.render();

      for (
        let setting: number = 0;
        setting < Config.modulators.length;
        setting++
      ) {
        for (
          let index: number = 0;
          index <= Config.modulators[setting].maxIndex;
          index++
        ) {
          if (this._showModSliders[setting][index] == true) {
            this._showModSliders[setting][index] = false;
            this._newShowModSliders[setting][index] = false;
            let slider: Slider | null = this.getSliderForModSetting(
              setting,
              index
            );

            if (slider != null) {
              slider.container.classList.remove("modSlider");
            }
          }
        }
      }
    } else {
      let instrument: number = this.doc.getCurrentInstrument();
      const anyModActive: boolean = this.doc.synth.isAnyModActive(
        this.doc.channel,
        instrument
      );

      // Check and update mod values on sliders
      if (anyModActive) {
        let instrument: number = this.doc.getCurrentInstrument();

        function updateModSlider(
          editor: SongEditor,
          slider: Slider,
          setting: number,
          channel: number,
          instrument: number,
          index: number
        ): boolean {
          if (editor.doc.synth.isModActive(setting, channel, instrument)) {
            if (Config.modulators[setting].maxIndex > 0) {
              //detect that the mod actually does need updating for the specific index
              const envelope =
                editor.doc.synth.song!.channels[channel].instruments[instrument]
                  .envelopes[index];
              switch (setting) {
                case Config.modulators.dictionary["individual envelope speed"]
                  .index: {
                  if (envelope.tempEnvelopeSpeed == null) {
                    return false;
                  }
                  break;
                }
                case Config.modulators.dictionary[
                  "individual envelope lower bound"
                ].index: {
                  if (envelope.tempEnvelopeLowerBound == null) {
                    return false;
                  }
                  break;
                }
                case Config.modulators.dictionary[
                  "individual envelope upper bound"
                ].index: {
                  if (envelope.tempEnvelopeUpperBound == null) {
                    return false;
                  }
                  break;
                }
              }
            }
            let currentVal: number =
              (editor.doc.synth.getModValue(
                setting,
                channel,
                instrument,
                false
              ) -
                Config.modulators[setting].convertRealFactor) /
              Config.modulators[setting].maxRawVol;

            if (Config.modulators[setting].invertSliderIndicator == true) {
              currentVal = 1 - currentVal;
            }

            if (currentVal != editor._modSliderValues[setting][index]) {
              editor._modSliderValues[setting][index] = currentVal;
              slider.container.style.setProperty(
                "--mod-position",
                currentVal * 96.0 + 2.0 + "%"
              );
            }
            return true;
          }
          return false;
        }

        // Set mod sliders to present values
        for (
          let setting: number = 0;
          setting < Config.modulators.length;
          setting++
        ) {
          for (
            let index: number = 0;
            index <= Config.modulators[setting].maxIndex;
            index++
          ) {
            // Set to last value
            this._newShowModSliders[setting][index] = Boolean(
              this._showModSliders[setting][index]
            );

            // Check for newer value
            let slider: Slider | null = this.getSliderForModSetting(
              setting,
              index
            );

            if (slider != null) {
              this._newShowModSliders[setting][index] = updateModSlider(
                this,
                slider,
                setting,
                this.doc.channel,
                instrument,
                index
              );
            }
          }
        }
      } else if (this._hasActiveModSliders) {
        // Zero out show-mod-slider settings (since none are active) to kill active mod slider flag
        for (
          let setting: number = 0;
          setting < Config.modulators.length;
          setting++
        ) {
          for (
            let index: number = 0;
            index <= Config.modulators[setting].maxIndex;
            index++
          ) {
            this._newShowModSliders[setting][index] = false;
          }
        }
      }

      // Class or unclass mod sliders based on present status
      if (anyModActive || this._hasActiveModSliders) {
        let anySliderActive: boolean = false;

        for (
          let setting: number = 0;
          setting < Config.modulators.length;
          setting++
        ) {
          for (
            let index: number = 0;
            index <= Config.modulators[setting].maxIndex;
            index++
          ) {
            if (
              this._newShowModSliders[setting][index] !=
              this._showModSliders[setting][index]
            ) {
              this._showModSliders[setting][index] =
                this._newShowModSliders[setting][index];
              let slider: Slider | null = this.getSliderForModSetting(
                setting,
                index
              );

              if (slider != null) {
                if (this._showModSliders[setting][index] == true) {
                  slider.container.classList.add("modSlider");
                } else {
                  slider.container.classList.remove("modSlider");
                }
              }
            }

            if (this._newShowModSliders[setting][index] == true)
              anySliderActive = true;
          }
        }

        this._hasActiveModSliders = anySliderActive;
      }
    }
  }

  public getSliderForModSetting(
    setting: number,
    index?: number
  ): Slider | null {
    index = index == undefined ? 0 : index;
    switch (setting) {
      case Config.modulators.dictionary["pan"].index:
        return this._panSlider;
      case Config.modulators.dictionary["detune"].index:
        return this._detuneSlider;
      case Config.modulators.dictionary["fm slider 1"].index:
        return this._operatorAmplitudeSliders[0];
      case Config.modulators.dictionary["fm slider 2"].index:
        return this._operatorAmplitudeSliders[1];
      case Config.modulators.dictionary["fm slider 3"].index:
        return this._operatorAmplitudeSliders[2];
      case Config.modulators.dictionary["fm slider 4"].index:
        return this._operatorAmplitudeSliders[3];
      case Config.modulators.dictionary["fm feedback"].index:
        return this._feedbackAmplitudeSlider;
      case Config.modulators.dictionary["pulse width"].index:
        return this._pulseWidthSlider;
      case Config.modulators.dictionary["decimal offset"].index:
        return this._decimalOffsetSlider;
      case Config.modulators.dictionary["reverb"].index:
        return this._reverbSlider;
      case Config.modulators.dictionary["distortion"].index:
        return this._distortionSlider;
      case Config.modulators.dictionary["note volume"].index:
        // So, this should technically not affect this slider, but it will look better as legacy songs used this mod as 'volume'.
        // In the case that mix volume is used as well, they'd fight for the display, so just don't use this.
        if (
          !this._showModSliders[
            Config.modulators.dictionary["mix volume"].index
          ][index]
        )
          return this._instrumentVolumeSlider;
        return null;
      case Config.modulators.dictionary["mix volume"].index:
        return this._instrumentVolumeSlider;
      case Config.modulators.dictionary["vibrato depth"].index:
        return this._vibratoDepthSlider;
      case Config.modulators.dictionary["vibrato speed"].index:
        return this._vibratoSpeedSlider;
      case Config.modulators.dictionary["vibrato delay"].index:
        return this._vibratoDelaySlider;
      case Config.modulators.dictionary["arp speed"].index:
        return this._arpeggioSpeedSlider;
      case Config.modulators.dictionary["pan delay"].index:
        return this._panDelaySlider;
      case Config.modulators.dictionary["tempo"].index:
        return this._tempoSlider;
      case Config.modulators.dictionary["song volume"].index:
        return this._volumeSlider;
      case Config.modulators.dictionary["eq filt cut"].index:
        return this._eqFilterSimpleCutSlider;
      case Config.modulators.dictionary["eq filt peak"].index:
        return this._eqFilterSimplePeakSlider;
      case Config.modulators.dictionary["note filt cut"].index:
        return this._noteFilterSimpleCutSlider;
      case Config.modulators.dictionary["note filt peak"].index:
        return this._noteFilterSimplePeakSlider;
      case Config.modulators.dictionary["bit crush"].index:
        return this._bitcrusherQuantizationSlider;
      case Config.modulators.dictionary["freq crush"].index:
        return this._bitcrusherFreqSlider;
      case Config.modulators.dictionary["pitch shift"].index:
        return this._pitchShiftSlider;
      case Config.modulators.dictionary["chorus"].index:
        return this._chorusSlider;
      case Config.modulators.dictionary["echo"].index:
        return this._echoSustainSlider;
      case Config.modulators.dictionary["echo delay"].index:
        return this._echoDelaySlider;
      case Config.modulators.dictionary["sustain"].index:
        return this._stringSustainSlider;
      case Config.modulators.dictionary["fm slider 5"].index:
        return this._operatorAmplitudeSliders[4];
      case Config.modulators.dictionary["fm slider 6"].index:
        return this._operatorAmplitudeSliders[5];
      case Config.modulators.dictionary["envelope speed"].index:
        return this._envelopeSpeedSlider;
      case Config.modulators.dictionary["dynamism"].index:
        return this._supersawDynamismSlider;
      case Config.modulators.dictionary["spread"].index:
        return this._supersawSpreadSlider;
      case Config.modulators.dictionary["saw shape"].index:
        return this._supersawShapeSlider;
      case Config.modulators.dictionary["individual envelope speed"].index:
        return this.envelopeEditor.perEnvelopeSpeedSliders[index];
      case Config.modulators.dictionary["individual envelope lower bound"]
        .index:
        return this.envelopeEditor.perEnvelopeLowerBoundSliders[index];
      case Config.modulators.dictionary["individual envelope upper bound"]
        .index:
        return this.envelopeEditor.perEnvelopeUpperBoundSliders[index];
      case Config.modulators.dictionary["ring modulation"].index:
        return this._ringModSlider;
      case Config.modulators.dictionary["ring mod hertz"].index:
        return this._ringModHzSlider;
      case Config.modulators.dictionary["granular"].index:
        return this._granularSlider;
      case Config.modulators.dictionary["grain freq"].index:
        return this._grainAmountsSlider;
      case Config.modulators.dictionary["grain size"].index:
        return this._grainSizeSlider;
      case Config.modulators.dictionary["grain range"].index:
        return this._grainRangeSlider;
      default:
        return null;
    }
  }

  private _openPrompt(promptName: string): void {
    this.doc.openPrompt(promptName);
    this._setPrompt(promptName);
  }

  private _setPrompt(promptName: string | null): void {
    if (this._currentPromptName == promptName) return;
    this._currentPromptName = promptName;

    if (this.prompt) {
      if (
        this._wasPlaying &&
        !(
          this.prompt instanceof TipPrompt ||
          this.prompt instanceof LimiterPrompt ||
          this.prompt instanceof CustomScalePrompt ||
          this.prompt instanceof CustomChipPrompt ||
          this.prompt instanceof CustomFilterPrompt ||
          this.prompt instanceof VisualLoopControlsPrompt ||
          this.prompt instanceof SustainPrompt ||
          this.prompt instanceof HarmonicsEditorPrompt ||
          this.prompt instanceof SpectrumEditorPrompt
        )
      ) {
        this.doc.performance.play();
      }
      this._wasPlaying = false;
      this._promptContainerBG.style.display = "none";
      this._promptContainer.style.display = "none";
      this._promptContainer.removeChild(this.prompt.container);
      this.prompt.cleanUp();
      this.prompt = null;
      this.refocusStage();
    }

    if (promptName) {
      switch (promptName) {
        case "export":
          this.prompt = new ExportPrompt(this.doc);
          break;
        case "import":
          this.prompt = new ImportPrompt(this.doc);
          break;
        case "songRecovery":
          this.prompt = new SongRecoveryPrompt(this.doc);
          break;
        case "barCount":
          this.prompt = new SongDurationPrompt(this.doc);
          break;
        case "beatsPerBar":
          this.prompt = new BeatsPerBarPrompt(this.doc);
          break;
        case "moveNotesSideways":
          this.prompt = new MoveNotesSidewaysPrompt(this.doc);
          break;
        case "channelSettings":
          this.prompt = new ChannelSettingsPrompt(this.doc);
          break;
        case "limiterSettings":
          this.prompt = new LimiterPrompt(this.doc, this);
          break;
        case "customScale":
          this.prompt = new CustomScalePrompt(this.doc);
          break;
        case "customChipSettings":
          this.prompt = new CustomChipPrompt(this.doc, this);
          break;
        case "customEQFilterSettings":
          this.prompt = new CustomFilterPrompt(this.doc, this, false);
          break;
        case "customNoteFilterSettings":
          this.prompt = new CustomFilterPrompt(this.doc, this, true);
          break;
        case "customSongEQFilterSettings":
          this.prompt = new CustomFilterPrompt(this.doc, this, false, true);
          break;
        case "theme":
          this.prompt = new ThemePrompt(this.doc);
          break;
        case "layout":
          this.prompt = new LayoutPrompt(this.doc);
          break;
        case "recordingSetup":
          this.prompt = new RecordingSetupPrompt(this.doc);
          break;
        case "exportInstrument":
          this.prompt = new InstrumentExportPrompt(this.doc); //, this);
          break;
        case "importInstrument":
          this.prompt = new InstrumentImportPrompt(this.doc); //, this);
          break;
        case "stringSustain":
          this.prompt = new SustainPrompt(this.doc);
          break;
        case "addExternal":
          this.prompt = new AddSamplesPrompt(this.doc);
          break;
        case "generateEuclideanRhythm":
          this.prompt = new EuclideanRhythmPrompt(this.doc);
          break;
        case "customTheme":
          this.prompt = new CustomThemePrompt(
            this.doc,
            this._patternEditor,
            this._trackArea,
            document.getElementById("beepboxEditorContainer")!
          );
          break;
        case "visualLoopControls":
          this.prompt = new VisualLoopControlsPrompt(this.doc, this);
          break;
        case "sampleLoadingStatus":
          this.prompt = new SampleLoadingStatusPrompt(this.doc);
          break;
        case "configureShortener":
          this.prompt = new ShortenerConfigPrompt(this.doc);
          break;
        case "harmonicsSettings":
          this.prompt = new HarmonicsEditorPrompt(this.doc, this);
          break;
        case "spectrumSettings":
          this.prompt = new SpectrumEditorPrompt(this.doc, this, false);
          break;
        case "drumsetSettings":
          this.prompt = new SpectrumEditorPrompt(this.doc, this, true);
          break;
        default:
          this.prompt = new TipPrompt(this.doc, promptName);
          break;
      }

      if (this.prompt) {
        if (
          !(
            this.prompt instanceof TipPrompt ||
            this.prompt instanceof LimiterPrompt ||
            this.prompt instanceof CustomChipPrompt ||
            this.prompt instanceof CustomFilterPrompt ||
            this.prompt instanceof VisualLoopControlsPrompt ||
            this.prompt instanceof SustainPrompt ||
            this.prompt instanceof HarmonicsEditorPrompt ||
            this.prompt instanceof SpectrumEditorPrompt
          )
        ) {
          this._wasPlaying = this.doc.synth.playing;
          this.doc.performance.pause();
        }
        this._promptContainer.style.display = "";
        if (this.doc.prefs.frostedGlassBackground == true) {
          this._promptContainerBG.style.display = "";
          this._promptContainerBG.style.backgroundColor = "rgba(0,0,0, 0)";
          this._promptContainerBG.style.backdropFilter =
            "brightness(0.9) blur(14px)";
          this._promptContainerBG.style.opacity = "1";
        } else {
          this._promptContainerBG.style.display = "";
          this._promptContainerBG.style.backgroundColor =
            "var(--editor-background)";
          this._promptContainerBG.style.backdropFilter = "";
          this._promptContainerBG.style.opacity = "0.5";
        }
        this._promptContainer.appendChild(this.prompt.container);
        document.body.appendChild(this._promptContainerBG);
      }
    }
  }

  public refocusStage = (): void => {
    this.mainLayer.focus({ preventScroll: true });
  };

  private _onFocusIn = (event: Event): void => {
    if (
      this.doc.synth.recording &&
      event.target != this.mainLayer &&
      event.target != this._stopButton &&
      event.target != this._volumeSlider.input
    ) {
      // Don't allow using tab to focus on the song settings while recording,
      // since interacting with them while recording would mess up the recording.
      this.refocusStage();
    }
  };

  // Refocus stage if a sub-element that needs focus isn't being edited.
  private _refocusStageNotEditing = (): void => {
    if (!this._patternEditor.editingModLabel)
      this.mainLayer.focus({ preventScroll: true });
  };

  public changeBarScrollPos(offset: number) {
    this._barScrollBar.changePos(offset);
  }

  public whenUpdated = (): void => {
    const prefs: Preferences = this.doc.prefs;
    this._muteEditor.container.style.display = prefs.enableChannelMuting
      ? ""
      : "none";
    const trackBounds: DOMRect = this._trackVisibleArea.getBoundingClientRect();
    this.doc.trackVisibleBars = Math.max(
      1,
      Math.floor(
        (trackBounds.right -
          trackBounds.left -
          (prefs.enableChannelMuting ? 32 : 0)) /
          this.doc.getBarWidth()
      )
    );
    this.doc.trackVisibleChannels = Math.floor(
      (trackBounds.bottom - trackBounds.top - 30) / ChannelRow.patternHeight
    );
    for (
      let i: number =
        this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount;
      i < this.doc.song.channels.length;
      i++
    ) {
      const channel: Channel = this.doc.song.channels[i];
      for (let j: number = 0; j < channel.instruments.length; j++) {
        this.doc.synth.determineInvalidModulators(channel.instruments[j]);
      }
    }
    this._barScrollBar.render();
    this._trackEditor.render();
    this._muteEditor.render();

    this._trackAndMuteContainer.scrollLeft =
      this.doc.barScrollPos * this.doc.getBarWidth();
    this._trackAndMuteContainer.scrollTop =
      this.doc.channelScrollPos * ChannelRow.patternHeight;

    if (
      document.activeElement != this._patternEditor.modDragValueLabel &&
      this._patternEditor.editingModLabel
    ) {
      this._patternEditor.stopEditingModLabel(false);
    }

    this._piano.container.style.display = prefs.showLetters ? "" : "none";
    this._octaveScrollBar.container.style.display = prefs.showScrollBar
      ? ""
      : "none";
    this._barScrollBar.container.style.display =
      this.doc.song.barCount > this.doc.trackVisibleBars ? "" : "none";
    this._volumeBarBox.style.display = this.doc.prefs.displayVolumeBar
      ? ""
      : "none";
    this._globalOscscopeContainer.style.display = this.doc.prefs
      .showOscilloscope
      ? ""
      : "none";
    this.doc.synth.oscEnabled = this.doc.prefs.showOscilloscope;
    this._sampleLoadingStatusContainer.style.display = this.doc.prefs
      .showSampleLoadingStatus
      ? ""
      : "none";
    this._instrumentCopyGroup.style.display = this.doc.prefs.instrumentCopyPaste
      ? ""
      : "none";
    this._instrumentExportGroup.style.display = this.doc.prefs
      .instrumentImportExport
      ? ""
      : "none";
    this._instrumentSettingsArea.style.scrollbarWidth = this.doc.prefs
      .showInstrumentScrollbars
      ? ""
      : "none";
    if (document.getElementById("text-content"))
      document.getElementById("text-content")!.style.display = this.doc.prefs
        .showDescription
        ? ""
        : "none";

    if (this.doc.getFullScreen()) {
      const semitoneHeight: number =
        this._patternEditorRow.clientHeight / this.doc.getVisiblePitchCount();
      const targetBeatWidth: number = semitoneHeight * 5;
      const minBeatWidth: number =
        this._patternEditorRow.clientWidth / (this.doc.song.beatsPerBar * 3);
      const maxBeatWidth: number =
        this._patternEditorRow.clientWidth / (this.doc.song.beatsPerBar + 2);
      const beatWidth: number = Math.max(
        minBeatWidth,
        Math.min(maxBeatWidth, targetBeatWidth)
      );
      const patternEditorWidth: number = beatWidth * this.doc.song.beatsPerBar;

      const beepboxEditorContainer: HTMLElement = document.getElementById(
        "beepboxEditorContainer"
      )!;

      if (this.doc.prefs.showDescription == false) {
        beepboxEditorContainer.style.paddingBottom = "0";
        beepboxEditorContainer.style.borderStyle = "none";
      } else {
        beepboxEditorContainer.style.paddingBottom = "";
        beepboxEditorContainer.style.borderStyle = "";
      }

      this._patternEditorPrev.container.style.width = patternEditorWidth + "px";
      this._patternEditor.container.style.width = patternEditorWidth + "px";
      this._patternEditorNext.container.style.width = patternEditorWidth + "px";
      this._patternEditorPrev.container.style.flexShrink = "0";
      this._patternEditor.container.style.flexShrink = "0";
      this._patternEditorNext.container.style.flexShrink = "0";
      this._patternEditorPrev.container.style.display = "";
      this._patternEditorNext.container.style.display = "";
      this._patternEditorPrev.render();
      this._patternEditorNext.render();
      this._zoomInButton.style.display =
        this.doc.song.channels[this.doc.channel].type === ChannelType.Pitch
          ? ""
          : "none";
      this._zoomOutButton.style.display =
        this.doc.song.channels[this.doc.channel].type === ChannelType.Pitch
          ? ""
          : "none";
      this._zoomInButton.style.right = prefs.showScrollBar ? "24px" : "4px";
      this._zoomOutButton.style.right = prefs.showScrollBar ? "24px" : "4px";
    } else {
      this._patternEditor.container.style.width = "";
      this._patternEditor.container.style.flexShrink = "";
      this._patternEditorPrev.container.style.display = "none";
      this._patternEditorNext.container.style.display = "none";
      this._zoomInButton.style.display = "none";
      this._zoomOutButton.style.display = "none";
    }
    this._patternEditor.render();

    // make the names of these two variables as short as possible for readability
    // also, these two variables are used for the effects tab as well, should they be renamed?
    // the theme variables are named "icon" to prevent people getting confused and thinking they're svg
    const textOnIcon: string = ColorConfig.getComputed("--text-enabled-icon");
    const textOffIcon: string = ColorConfig.getComputed("--text-disabled-icon");
    const textSpacingIcon: string = ColorConfig.getComputed(
      "--text-spacing-icon"
    );
    const optionCommands: ReadonlyArray<string> = [
      "Technical",
      (prefs.autoPlay ? textOnIcon : textOffIcon) + "Auto Play on Load",
      (prefs.autoFollow ? textOnIcon : textOffIcon) + "Auto Follow Playhead",
      (prefs.enableNotePreview ? textOnIcon : textOffIcon) + "Hear Added Notes",
      (prefs.notesOutsideScale ? textOnIcon : textOffIcon) +
        "Place Notes Out of Scale",
      (prefs.defaultScale == this.doc.song.scale ? textOnIcon : textOffIcon) +
        "Set Current Scale as Default",
      (prefs.alwaysFineNoteVol ? textOnIcon : textOffIcon) +
        "Always Fine Note Volume",
      (prefs.enableChannelMuting ? textOnIcon : textOffIcon) +
        "Enable Channel Muting",
      (prefs.instrumentCopyPaste ? textOnIcon : textOffIcon) +
        "Enable Copy/Paste Buttons",
      (prefs.instrumentImportExport ? textOnIcon : textOffIcon) +
        "Enable Import/Export Buttons",
      (prefs.displayBrowserUrl ? textOnIcon : textOffIcon) +
        "Enable Song Data in URL",
      (prefs.closePromptByClickoff ? textOnIcon : textOffIcon) +
        "Close Prompts on Click Off",
      textSpacingIcon + "Note Recording...",
      textSpacingIcon + "Appearance",
      (prefs.showFifth ? textOnIcon : textOffIcon) + 'Highlight "Fifth" Note',
      (prefs.notesFlashWhenPlayed ? textOnIcon : textOffIcon) +
        "Notes Flash When Played",
      (prefs.instrumentButtonsAtTop ? textOnIcon : textOffIcon) +
        "Instrument Buttons at Top",
      (prefs.frostedGlassBackground ? textOnIcon : textOffIcon) +
        "Frosted Glass Prompt Backdrop",
      (prefs.showChannels ? textOnIcon : textOffIcon) + "Show All Channels",
      (prefs.showScrollBar ? textOnIcon : textOffIcon) +
        "Show Octave Scroll Bar",
      (prefs.showInstrumentScrollbars ? textOnIcon : textOffIcon) +
        "Show Instrument Scrollbars",
      (prefs.showLetters ? textOnIcon : textOffIcon) + "Show Piano Keys",
      (prefs.displayVolumeBar ? textOnIcon : textOffIcon) +
        "Show Playback Volume",
      (prefs.showOscilloscope ? textOnIcon : textOffIcon) + "Show Oscilloscope",
      (prefs.showSampleLoadingStatus ? textOnIcon : textOffIcon) +
        "Show Sample Loading Status",
      (prefs.showDescription ? textOnIcon : textOffIcon) + "Show Description",
      textSpacingIcon + "Set Layout...",
      textSpacingIcon + "Set Theme...",
      textSpacingIcon + "Custom Theme...",
    ];
    // Technical dropdown
    const technicalOptionGroup: HTMLOptGroupElement = <HTMLOptGroupElement>(
      this._optionsMenu.children[1]
    );

    for (let i: number = 0; i < technicalOptionGroup.children.length; i++) {
      const option: HTMLOptionElement = <HTMLOptionElement>(
        technicalOptionGroup.children[i]
      );
      if (option.textContent != optionCommands[i + 1])
        option.textContent = optionCommands[i + 1];
    }

    // Appearance dropdown
    const appearanceOptionGroup: HTMLOptGroupElement = <HTMLOptGroupElement>(
      this._optionsMenu.children[2]
    );

    for (let i: number = 0; i < appearanceOptionGroup.children.length; i++) {
      const option: HTMLOptionElement = <HTMLOptionElement>(
        appearanceOptionGroup.children[i]
      );
      if (
        option.textContent !=
        optionCommands[i + technicalOptionGroup.children.length + 2]
      )
        option.textContent =
          optionCommands[i + technicalOptionGroup.children.length + 2];
    }

    const channel: Channel = this.doc.song.channels[this.doc.channel];
    const instrumentIndex: number = this.doc.getCurrentInstrument();
    const instrument: Instrument = channel.instruments[instrumentIndex];
    const wasActive: boolean = this.mainLayer.contains(document.activeElement);
    const activeElement: Element | null = document.activeElement;
    const colors: ChannelColors = ColorConfig.getChannelColor(
      this.doc.song,
      this.doc.channel
    );

    for (
      let i: number = this._effectsSelect.childElementCount - 1;
      i < Config.effectOrder.length;
      i++
    ) {
      this._effectsSelect.appendChild(option({ value: i }));
    }
    this._effectsSelect.selectedIndex = -1;
    for (let i: number = 0; i < Config.effectOrder.length; i++) {
      let effectFlag: number = Config.effectOrder[i];
      const selected: boolean = (instrument.effects & (1 << effectFlag)) != 0;
      const label: string =
        (selected ? textOnIcon : textOffIcon) + Config.effectNames[effectFlag];
      const option: HTMLOptionElement = <HTMLOptionElement>(
        this._effectsSelect.children[i + 1]
      );
      if (option.textContent != label) option.textContent = label;
    }

    setSelectedValue(this._scaleSelect, this.doc.song.scale);
    this._scaleSelect.title = Config.scales[this.doc.song.scale].realName;
    setSelectedValue(
      this._keySelect,
      Config.keys.length - 1 - this.doc.song.key
    );
    this._octaveStepper.value = Math.round(this.doc.song.octave).toString();
    this._tempoSlider.updateValue(Math.max(0, Math.round(this.doc.song.tempo)));
    this._tempoStepper.value = Math.round(this.doc.song.tempo).toString();
    this._songTitleInputBox.updateValue(this.doc.song.title);
    if (this.doc.synth.isFilterModActive(false, 0, 0, true)) {
      this._songEqFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    } else {
      this._songEqFilterEditor.render();
    }

    this._eqFilterTypeRow.style.setProperty(
      "--text-color-lit",
      getPrimaryNoteColor(this.doc, this.doc.channel)
    );
    this._eqFilterTypeRow.style.setProperty(
      "--text-color-dim",
      getSecondaryNoteColor(this.doc, this.doc.channel)
    );
    this._eqFilterTypeRow.style.setProperty(
      "--background-color-lit",
      colors.primaryChannel
    );
    this._eqFilterTypeRow.style.setProperty(
      "--background-color-dim",
      colors.secondaryChannel
    );

    if (instrument.eqFilterType) {
      this._eqFilterSimpleButton.classList.remove("deactivated");
      this._eqFilterAdvancedButton.classList.add("deactivated");
      this._eqFilterRow.style.display = "none";
      this._eqFilterSimpleCutRow.style.display = "";
      this._eqFilterSimplePeakRow.style.display = "";
    } else {
      this._eqFilterSimpleButton.classList.add("deactivated");
      this._eqFilterAdvancedButton.classList.remove("deactivated");
      this._eqFilterRow.style.display = "";
      this._eqFilterSimpleCutRow.style.display = "none";
      this._eqFilterSimplePeakRow.style.display = "none";
    }

    setSelectedValue(this._rhythmSelect, this.doc.song.rhythm);

    if (!this.doc.song.getChannelIsMod(this.doc.channel)) {
      this._customInstrumentSettingsGroup.style.display = "";
      this._panSliderRow.style.display = "";
      this._panDropdownGroup.style.display = this._openPanDropdown
        ? ""
        : "none";
      this._detuneSliderRow.style.display = "";
      this._instrumentVolumeSliderRow.style.display = "";
      this._instrumentTypeSelectRow.style.setProperty("display", "");
      if (prefs.instrumentButtonsAtTop) {
        this._instrumentSettingsGroup.insertBefore(
          this._instrumentExportGroup,
          this._instrumentSettingsGroup.firstChild
        );
        this._instrumentSettingsGroup.insertBefore(
          this._instrumentCopyGroup,
          this._instrumentSettingsGroup.firstChild
        );
      } else {
        this._instrumentSettingsGroup.appendChild(this._instrumentCopyGroup);
        this._instrumentSettingsGroup.appendChild(this._instrumentExportGroup);
      }
      this._instrumentSettingsGroup.insertBefore(
        this._instrumentsButtonRow,
        this._instrumentSettingsGroup.firstChild
      );
      this._instrumentSettingsGroup.insertBefore(
        this._instrumentSettingsTextRow,
        this._instrumentSettingsGroup.firstChild
      );

      if (this.doc.song.channels[this.doc.channel].name == "") {
        this._instrumentSettingsTextRow.textContent = "Instrument Settings";
      } else {
        this._instrumentSettingsTextRow.textContent =
          this.doc.song.channels[this.doc.channel].name;
      }

      this._modulatorGroup.style.display = "none";

      // Check if current viewed pattern on channel is used anywhere
      // + Check if current instrument on channel is used anywhere
      // + Check if a mod targets this
      this._usageCheck(this.doc.channel, instrumentIndex);

      if (this.doc.song.getChannelIsNoise(this.doc.channel)) {
        this._pitchedPresetSelect.style.display = "none";
        this._drumPresetSelect.style.display = "";
        // Also hide select2
        $("#pitchPresetSelect").parent().hide();
        $("#drumPresetSelect").parent().show();

        setSelectedValue(this._drumPresetSelect, instrument.preset, true);
      } else {
        this._pitchedPresetSelect.style.display = "";
        this._drumPresetSelect.style.display = "none";

        // Also hide select2
        $("#pitchPresetSelect").parent().show();
        $("#drumPresetSelect").parent().hide();

        setSelectedValue(this._pitchedPresetSelect, instrument.preset, true);
      }

      if (instrument.type == InstrumentType.noise) {
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._chipNoiseSelectRow.style.display = "";
        setSelectedValue(this._chipNoiseSelect, instrument.chipNoise, true);
      } else {
        this._chipNoiseSelectRow.style.display = "none";
      }
      if (instrument.type == InstrumentType.spectrum) {
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._spectrumRow.style.display = "";
        this._spectrumEditor.render();
      } else {
        this._spectrumRow.style.display = "none";
      }
      if (
        instrument.type == InstrumentType.harmonics ||
        instrument.type == InstrumentType.pickedString
      ) {
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._harmonicsRow.style.display = "flex";
        this._harmonicsEditor.render();
      } else {
        this._harmonicsRow.style.display = "none";
      }
      if (instrument.type == InstrumentType.pickedString) {
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._stringSustainRow.style.display = "";
        this._stringSustainSlider.updateValue(instrument.stringSustain);
        this._stringSustainLabel.textContent = Config.enableAcousticSustain
          ? "Sustain (" +
            Config.sustainTypeNames[instrument.stringSustainType]
              .substring(0, 1)
              .toUpperCase() +
            "):"
          : "Sustain:";
      } else {
        this._stringSustainRow.style.display = "none";
      }
      if (instrument.type == InstrumentType.drumset) {
        this._drumsetGroup.style.display = "";
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._fadeInOutRow.style.display = "none";
        for (let i: number = 0; i < Config.drumCount; i++) {
          setSelectedValue(
            this._drumsetEnvelopeSelects[i],
            instrument.drumsetEnvelopes[i]
          );
          this._drumsetSpectrumEditors[i].render();
        }
      } else {
        this._drumsetGroup.style.display = "none";
        this._fadeInOutRow.style.display = "";
        this._fadeInOutEditor.render();
      }

      if (instrument.type == InstrumentType.chip) {
        this._chipWaveSelectRow.style.display = "";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "";
        if (instrument.isUsingAdvancedLoopControls) {
          this._chipWaveLoopModeSelectRow.style.display = "";
          this._chipWaveLoopStartRow.style.display = "";
          this._chipWaveLoopEndRow.style.display = "";
          this._chipWaveStartOffsetRow.style.display = "";
          this._chipWavePlayBackwardsRow.style.display = "";
        } else {
          this._chipWaveLoopModeSelectRow.style.display = "none";
          this._chipWaveLoopStartRow.style.display = "none";
          this._chipWaveLoopEndRow.style.display = "none";
          this._chipWaveStartOffsetRow.style.display = "none";
          this._chipWavePlayBackwardsRow.style.display = "none";
        }
        // advloop addition
        setSelectedValue(this._chipWaveSelect, instrument.chipWave);
        // advloop addition
        this._useChipWaveAdvancedLoopControlsBox.checked =
          instrument.isUsingAdvancedLoopControls ? true : false;
        setSelectedValue(
          this._chipWaveLoopModeSelect,
          instrument.chipWaveLoopMode
        );
        this._chipWaveLoopStartStepper.value =
          instrument.chipWaveLoopStart + "";
        // this._chipWaveLoopStartStepper.max = (chipWaveLength - 1) + "";
        this._chipWaveLoopEndStepper.value = instrument.chipWaveLoopEnd + "";
        // this._chipWaveLoopEndStepper.max = (chipWaveLength - 1) + "";
        this._chipWaveStartOffsetStepper.value =
          instrument.chipWaveStartOffset + "";
        // this._chipWaveStartOffsetStepper.max = (chipWaveLength - 1) + "";
        this._chipWavePlayBackwardsBox.checked =
          instrument.chipWavePlayBackwards ? true : false;
        // advloop addition
      }

      if (instrument.type == InstrumentType.customChipWave) {
        this._customWaveDraw.style.display = "";
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
      } else {
        this._customWaveDraw.style.display = "none";
      }

      if (instrument.type == InstrumentType.supersaw) {
        this._supersawDynamismRow.style.display = "";
        this._supersawSpreadRow.style.display = "";
        this._supersawShapeRow.style.display = "";
        this._supersawDynamismSlider.updateValue(instrument.supersawDynamism);
        this._supersawSpreadSlider.updateValue(instrument.supersawSpread);
        this._supersawShapeSlider.updateValue(instrument.supersawShape);
      } else {
        this._supersawDynamismRow.style.display = "none";
        this._supersawSpreadRow.style.display = "none";
        this._supersawShapeRow.style.display = "none";
      }
      if (
        instrument.type == InstrumentType.pwm ||
        instrument.type == InstrumentType.supersaw
      ) {
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        this._pulseWidthRow.style.display = "";
        this._pulseWidthSlider.input.title =
          prettyNumber(instrument.pulseWidth) + "%";
        this._pulseWidthSlider.updateValue(instrument.pulseWidth);

        // this._decimalOffsetRow.style.display = "";
        this._decimalOffsetSlider.input.title =
          instrument.decimalOffset / 100 <= 0
            ? "none"
            : "-" + prettyNumber(instrument.decimalOffset / 100) + "%";
        this._decimalOffsetSlider.updateValue(99 - instrument.decimalOffset);

        // this._pulseWidthDropdownGroup.style.display = "";
        this._pulseWidthDropdownGroup.style.display = this
          ._openPulseWidthDropdown
          ? ""
          : "none";
      } else {
        this._pulseWidthRow.style.display = "none";
        // this._decimalOffsetRow.style.display = "none";
        this._pulseWidthDropdownGroup.style.display = "none";
      }

      if (
        instrument.type == InstrumentType.fm ||
        instrument.type == InstrumentType.fm6op
      ) {
        this._phaseModGroup.style.display = "";
        this._feedbackRow2.style.display = "";
        this._chipWaveSelectRow.style.display = "none";
        // advloop addition
        this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
        this._chipWaveLoopModeSelectRow.style.display = "none";
        this._chipWaveLoopStartRow.style.display = "none";
        this._chipWaveLoopEndRow.style.display = "none";
        this._chipWaveStartOffsetRow.style.display = "none";
        this._chipWavePlayBackwardsRow.style.display = "none";
        // advloop addition
        setSelectedValue(this._algorithmSelect, instrument.algorithm);
        setSelectedValue(this._feedbackTypeSelect, instrument.feedbackType);
        this._feedbackAmplitudeSlider.updateValue(instrument.feedbackAmplitude);
        for (
          let i: number = 0;
          i <
          Config.operatorCount +
            (instrument.type == InstrumentType.fm6op ? 2 : 0);
          i++
        ) {
          const isCarrier: boolean =
            instrument.type == InstrumentType.fm
              ? i < Config.algorithms[instrument.algorithm].carrierCount
              : i < instrument.customAlgorithm.carrierCount;
          this._operatorRows[i].style.color = isCarrier
            ? ColorConfig.primaryText
            : "";
          setSelectedValue(
            this._operatorFrequencySelects[i],
            instrument.operators[i].frequency
          );
          this._operatorAmplitudeSliders[i].updateValue(
            instrument.operators[i].amplitude
          );
          setSelectedValue(
            this._operatorWaveformSelects[i],
            instrument.operators[i].waveform
          );
          this._operatorWaveformPulsewidthSliders[i].updateValue(
            instrument.operators[i].pulseWidth
          );
          this._operatorWaveformPulsewidthSliders[i].input.title =
            "" +
            Config.pwmOperatorWaves[instrument.operators[i].pulseWidth].name;
          this._operatorDropdownGroups[i].style.color = isCarrier
            ? ColorConfig.primaryText
            : "";
          const operatorName: string =
            (isCarrier ? "Voice " : "Modulator ") + (i + 1);
          this._operatorFrequencySelects[i].title = operatorName + " Frequency";
          this._operatorAmplitudeSliders[i].input.title =
            operatorName + (isCarrier ? " Volume" : " Amplitude");
          this._operatorDropdownGroups[i].style.display = this
            ._openOperatorDropdowns[i]
            ? ""
            : "none";
          if (instrument.operators[i].waveform == 2) {
            this._operatorWaveformPulsewidthSliders[i].container.style.display =
              "";
            this._operatorWaveformHints[i].style.display = "none";
          } else {
            this._operatorWaveformPulsewidthSliders[i].container.style.display =
              "none";
            this._operatorWaveformHints[i].style.display = "";
          }
        }
        if (instrument.type == InstrumentType.fm6op) {
          setSelectedValue(this._algorithm6OpSelect, instrument.algorithm6Op);
          setSelectedValue(
            this._feedback6OpTypeSelect,
            instrument.feedbackType6Op
          );
          this._customAlgorithmCanvas.redrawCanvas();
          this._algorithm6OpSelectRow.style.display = "";
          this._feedback6OpRow1.style.display = "";
          this._operatorRows[4].style.display = "";
          this._operatorRows[5].style.display = "";
          this._operatorDropdownGroups[4].style.display = this
            ._openOperatorDropdowns[4]
            ? ""
            : "none";
          this._operatorDropdownGroups[5].style.display = this
            ._openOperatorDropdowns[5]
            ? ""
            : "none";
          this._algorithmSelectRow.style.display = "none";
          this._feedbackRow1.style.display = "none";
        } else {
          this._algorithm6OpSelectRow.style.display = "none";
          this._feedback6OpRow1.style.display = "none";
          this._operatorRows[4].style.display = "none";
          this._operatorRows[5].style.display = "none";
          this._operatorDropdownGroups[4].style.display = "none";
          this._operatorDropdownGroups[5].style.display = "none";
          this._feedbackRow1.style.display = "";
          this._algorithmSelectRow.style.display = "";
        }
      } else {
        this._algorithm6OpSelectRow.style.display = "none";
        this._feedback6OpRow1.style.display = "none";
        this._algorithmSelectRow.style.display = "none";
        this._phaseModGroup.style.display = "none";
        this._feedbackRow1.style.display = "none";
        this._feedbackRow2.style.display = "none";
      }
      this._pulseWidthSlider.input.title =
        prettyNumber(instrument.pulseWidth) + "%";

      if (effectsIncludeTransition(instrument.effects)) {
        this._transitionRow.style.display = "";
        if (this._openTransitionDropdown)
          this._transitionDropdownGroup.style.display = "";
        setSelectedValue(this._transitionSelect, instrument.transition);
      } else {
        this._transitionDropdownGroup.style.display = "none";
        this._transitionRow.style.display = "none";
      }
      if (effectsIncludeDiscreteSlide(instrument.effects)) {
        this._discreteSlideRow.style.display = "";
        setSelectedValue(this._discreteSlideSelect, instrument.discreteSlide);
      } else {
        this._discreteSlideRow.style.display = "none";
      }

      if (effectsIncludeChord(instrument.effects)) {
        this._chordSelectRow.style.display = "flex";
        this._chordDropdown.style.display =
          instrument.chord == Config.chords.dictionary["arpeggio"].index
            ? ""
            : "none";
        if (this._openChordDropdown) {
          if (instrument.chord == Config.chords.dictionary["arpeggio"].index) {
            this._chordDropdownGroup.style.display = "";
          } else if (
            instrument.chord == Config.chords.dictionary["monophonic"].index
          ) {
            this._chordDropdownGroup.style.display = "";
            setSelectedValue(this._chordSelect, instrument.chord);
          } else {
            this._chordDropdownGroup.style.display = "none";
          }
        }
        if (instrument.chord == Config.chords.dictionary["monophonic"].index) {
          this._monophonicNoteInputBox.value =
            instrument.monoChordTone + 1 + "";
          this._monophonicNoteInputBox.style.display = "";
          this._chordSelectContainer.style.width = "52.5%";
        } else {
          this._monophonicNoteInputBox.style.display = "none";
          this._chordSelectContainer.style.width = "61.5%";
        }
      } else {
        this._chordSelectRow.style.display = "none";
        this._chordDropdown.style.display = "none";
        this._chordDropdownGroup.style.display = "none";
      }

      if (effectsIncludePitchShift(instrument.effects)) {
        this._pitchShiftRow.style.display = "";
        this._pitchShiftSlider.updateValue(instrument.pitchShift);
        this._pitchShiftSlider.input.title =
          instrument.pitchShift - Config.pitchShiftCenter + " semitone(s)";
        for (const marker of this._pitchShiftFifthMarkers) {
          marker.style.display = prefs.showFifth ? "" : "none";
        }
      } else {
        this._pitchShiftRow.style.display = "none";
      }

      if (effectsIncludeDetune(instrument.effects)) {
        this._detuneSliderRow.style.display = "";
        this._detuneSlider.updateValue(instrument.detune - Config.detuneCenter);
        this._detuneSlider.input.title =
          Synth.detuneToCents(instrument.detune) + " cent(s)";
      } else {
        this._detuneSliderRow.style.display = "none";
      }

      if (effectsIncludeVibrato(instrument.effects)) {
        this._vibratoSelectRow.style.display = "";
        if (this._openVibratoDropdown)
          this._vibratoDropdownGroup.style.display = "";
        setSelectedValue(this._vibratoSelect, instrument.vibrato);
      } else {
        this._vibratoDropdownGroup.style.display = "none";
        this._vibratoSelectRow.style.display = "none";
      }

      if (effectsIncludeNoteFilter(instrument.effects)) {
        this._noteFilterTypeRow.style.setProperty(
          "--text-color-lit",
          getPrimaryNoteColor(this.doc, this.doc.channel)
        );
        this._noteFilterTypeRow.style.setProperty(
          "--text-color-dim",
          getSecondaryNoteColor(this.doc, this.doc.channel)
        );
        this._noteFilterTypeRow.style.setProperty(
          "--background-color-lit",
          colors.primaryChannel
        );
        this._noteFilterTypeRow.style.setProperty(
          "--background-color-dim",
          colors.secondaryChannel
        );
        this._noteFilterTypeRow.style.display = "";

        if (
          this.doc.synth.isFilterModActive(
            true,
            this.doc.channel,
            this.doc.getCurrentInstrument()
          )
        ) {
          this._noteFilterEditor.render(
            true,
            this._ctrlHeld || this._shiftHeld
          );
        } else {
          this._noteFilterEditor.render();
        }

        if (instrument.noteFilterType) {
          this._noteFilterSimpleButton.classList.remove("deactivated");
          this._noteFilterAdvancedButton.classList.add("deactivated");
          this._noteFilterRow.style.display = "none";
          this._noteFilterSimpleCutRow.style.display = "";
          this._noteFilterSimplePeakRow.style.display = "";
        } else {
          this._noteFilterSimpleButton.classList.add("deactivated");
          this._noteFilterAdvancedButton.classList.remove("deactivated");
          this._noteFilterRow.style.display = "";
          this._noteFilterSimpleCutRow.style.display = "none";
          this._noteFilterSimplePeakRow.style.display = "none";
        }
      } else {
        this._noteFilterRow.style.display = "none";
        this._noteFilterSimpleCutRow.style.display = "none";
        this._noteFilterSimplePeakRow.style.display = "none";
        this._noteFilterTypeRow.style.display = "none";
      }

      if (effectsIncludeDistortion(instrument.effects)) {
        this._distortionRow.style.display = "";
        if (
          instrument.type == InstrumentType.chip ||
          instrument.type == InstrumentType.customChipWave ||
          instrument.type == InstrumentType.pwm ||
          instrument.type == InstrumentType.supersaw
        )
          this._aliasingRow.style.display = "";
        else this._aliasingRow.style.display = "none";
        this._distortionSlider.updateValue(instrument.distortion);
      } else {
        this._distortionRow.style.display = "none";
        this._aliasingRow.style.display = "none";
      }

      if (effectsIncludeBitcrusher(instrument.effects)) {
        this._bitcrusherQuantizationRow.style.display = "";
        this._bitcrusherFreqRow.style.display = "";
        this._bitcrusherQuantizationSlider.updateValue(
          instrument.bitcrusherQuantization
        );
        this._bitcrusherFreqSlider.updateValue(instrument.bitcrusherFreq);
      } else {
        this._bitcrusherQuantizationRow.style.display = "none";
        this._bitcrusherFreqRow.style.display = "none";
      }

      if (effectsIncludePanning(instrument.effects)) {
        this._panSliderRow.style.display = "";
        if (this._openPanDropdown) this._panDropdownGroup.style.display = "";
        this._panSlider.updateValue(instrument.pan);
      } else {
        this._panSliderRow.style.display = "none";
        this._panDropdownGroup.style.display = "none";
      }

      if (effectsIncludeChorus(instrument.effects)) {
        this._chorusRow.style.display = "";
        this._chorusSlider.updateValue(instrument.chorus);
      } else {
        this._chorusRow.style.display = "none";
      }

      if (effectsIncludeEcho(instrument.effects)) {
        this._echoSustainRow.style.display = "";
        this._echoSustainSlider.updateValue(instrument.echoSustain);
        this._echoDelayRow.style.display = "";
        this._echoDelaySlider.updateValue(instrument.echoDelay);
        this._echoDelaySlider.input.title =
          Math.round(
            (((instrument.echoDelay + 1) * Config.echoDelayStepTicks) /
              (Config.ticksPerPart * Config.partsPerBeat)) *
              1000
          ) /
            1000 +
          " beat(s)";
      } else {
        this._echoSustainRow.style.display = "none";
        this._echoDelayRow.style.display = "none";
      }

      if (effectsIncludeReverb(instrument.effects)) {
        this._reverbRow.style.display = "";
        this._reverbSlider.updateValue(instrument.reverb);
      } else {
        this._reverbRow.style.display = "none";
      }

      if (effectsIncludeRingModulation(instrument.effects)) {
        this._ringModContainerRow.style.display = "";
        this._ringModSlider.updateValue(instrument.ringModulation);
        this._ringModHzSlider.updateValue(instrument.ringModulationHz);
        setSelectedValue(
          this._ringModWaveSelect,
          instrument.ringModWaveformIndex
        );
        this._ringModPulsewidthSlider.updateValue(instrument.ringModPulseWidth);
      } else {
        this._ringModContainerRow.style.display = "none";
      }

      if (effectsIncludeGranular(instrument.effects)) {
        this._granularContainerRow.style.display = "";
        this._granularSlider.updateValue(instrument.granular);
        this._grainSizeSlider.updateValue(instrument.grainSize);
        this._grainAmountsSlider.updateValue(instrument.grainAmounts);
        this._grainRangeSlider.updateValue(instrument.grainRange);
      } else {
        this._granularContainerRow.style.display = "none";
      }

      if (
        instrument.type == InstrumentType.chip ||
        instrument.type == InstrumentType.customChipWave ||
        instrument.type == InstrumentType.harmonics ||
        instrument.type == InstrumentType.pickedString ||
        instrument.type == InstrumentType.spectrum ||
        instrument.type == InstrumentType.pwm ||
        instrument.type == InstrumentType.noise ||
        instrument.type == InstrumentType.drumset
      ) {
        this._unisonSelectRow.style.display = "";
        setSelectedValue(this._unisonSelect, instrument.unison);
        this._unisonVoicesInputBox.value = instrument.unisonVoices + "";
        this._unisonSpreadInputBox.value = instrument.unisonSpread + "";
        this._unisonOffsetInputBox.value = instrument.unisonOffset + "";
        this._unisonExpressionInputBox.value = instrument.unisonExpression + "";
        this._unisonSignInputBox.value = instrument.unisonSign + "";
        this._unisonDropdownGroup.style.display = this._openUnisonDropdown
          ? ""
          : "none";
      } else {
        this._unisonSelectRow.style.display = "none";
        this._unisonDropdownGroup.style.display = "none";
      }

      if (this._openEnvelopeDropdown)
        this._envelopeDropdownGroup.style.display = "";
      else this._envelopeDropdownGroup.style.display = "none";

      this.envelopeEditor.render();
      this.envelopeEditor.rerenderExtraSettings();

      for (
        let chordIndex: number = 0;
        chordIndex < Config.chords.length;
        chordIndex++
      ) {
        let hidden: boolean =
          !Config.instrumentTypeHasSpecialInterval[instrument.type] &&
          Config.chords[chordIndex].customInterval;
        const option: Element = this._chordSelect.children[chordIndex];
        if (hidden) {
          if (!option.hasAttribute("hidden")) {
            option.setAttribute("hidden", "");
          }
        } else {
          option.removeAttribute("hidden");
        }
      }

      this._instrumentSettingsGroup.style.color = getPrimaryNoteColor(
        this.doc,
        this.doc.channel
      );

      setSelectedValue(this._transitionSelect, instrument.transition);
      setSelectedValue(this._vibratoSelect, instrument.vibrato);
      setSelectedValue(this._vibratoTypeSelect, instrument.vibratoType);
      setSelectedValue(this._chordSelect, instrument.chord);
      this._panSliderInputBox.value = instrument.pan + "";
      this._pwmSliderInputBox.value = instrument.pulseWidth + "";
      this._detuneSliderInputBox.value =
        instrument.detune - Config.detuneCenter + "";
      this.ringModHzNum.innerHTML =
        " (" +
        calculateRingModHertz(
          instrument.ringModulationHz / (Config.ringModHzRange - 1)
        ) +
        ")";
      this.grainSizeNum.innerHTML =
        " (" + instrument.grainSize * Config.grainSizeStep + ")";
      this.grainRangeNum.innerHTML =
        " (" + instrument.grainRange * Config.grainSizeStep + ")";
      this._instrumentVolumeSlider.updateValue(instrument.volume);
      this._instrumentVolumeSliderInputBox.value = "" + instrument.volume;
      this._vibratoDepthSlider.updateValue(
        Math.round(instrument.vibratoDepth * 25)
      );
      this._vibratoDelaySlider.updateValue(Math.round(instrument.vibratoDelay));
      this._vibratoSpeedSlider.updateValue(instrument.vibratoSpeed);
      setSelectedValue(this._vibratoTypeSelect, instrument.vibratoType);
      this._arpeggioSpeedSlider.updateValue(instrument.arpeggioSpeed);
      this._panDelaySlider.updateValue(instrument.panDelay);
      this._vibratoDelaySlider.input.title =
        "" + Math.round(instrument.vibratoDelay);
      this._vibratoDepthSlider.input.title = "" + instrument.vibratoDepth;
      this._vibratoSpeedSlider.input.title = "x" + instrument.vibratoSpeed / 10;
      this._vibratoSpeedDisplay.textContent =
        "x" + instrument.vibratoSpeed / 10;
      this._panDelaySlider.input.title = "" + instrument.panDelay;
      this._arpeggioSpeedSlider.input.title =
        "x" + prettyNumber(Config.arpSpeedScale[instrument.arpeggioSpeed]);
      this._arpeggioSpeedDisplay.textContent =
        "x" + prettyNumber(Config.arpSpeedScale[instrument.arpeggioSpeed]);
      this._eqFilterSimpleCutSlider.updateValue(instrument.eqFilterSimpleCut);
      this._eqFilterSimplePeakSlider.updateValue(instrument.eqFilterSimplePeak);
      this._noteFilterSimpleCutSlider.updateValue(
        instrument.noteFilterSimpleCut
      );
      this._noteFilterSimplePeakSlider.updateValue(
        instrument.noteFilterSimplePeak
      );
      this._envelopeSpeedSlider.updateValue(instrument.envelopeSpeed);
      this._envelopeSpeedSlider.input.title =
        "x" + prettyNumber(Config.arpSpeedScale[instrument.envelopeSpeed]);
      this._envelopeSpeedDisplay.textContent =
        "x" + prettyNumber(Config.arpSpeedScale[instrument.envelopeSpeed]);

      if (instrument.type == InstrumentType.customChipWave) {
        this._customWaveDrawCanvas.redrawCanvas();
        if (this.prompt instanceof CustomChipPrompt) {
          this.prompt.customChipCanvas.render();
        }
      }

      this._renderInstrumentBar(channel, instrumentIndex, colors);
    } // Options for mod channel
    else {
      this._usageCheck(this.doc.channel, instrumentIndex);

      this._pitchedPresetSelect.style.display = "none";
      this._drumPresetSelect.style.display = "none";
      $("#pitchPresetSelect").parent().hide();
      $("#drumPresetSelect").parent().hide();
      if (prefs.instrumentButtonsAtTop) {
        this._modulatorGroup.insertBefore(
          this._instrumentExportGroup,
          this._modulatorGroup.firstChild
        );
        this._modulatorGroup.insertBefore(
          this._instrumentCopyGroup,
          this._modulatorGroup.firstChild
        );
      } else {
        this._modulatorGroup.appendChild(this._instrumentCopyGroup);
        this._modulatorGroup.appendChild(this._instrumentExportGroup);
      }

      this._modulatorGroup.insertBefore(
        this._instrumentsButtonRow,
        this._modulatorGroup.firstChild
      );
      this._modulatorGroup.insertBefore(
        this._instrumentSettingsTextRow,
        this._modulatorGroup.firstChild
      );
      if (this.doc.song.channels[this.doc.channel].name == "") {
        this._instrumentSettingsTextRow.textContent = "Modulator Settings";
      } else {
        this._instrumentSettingsTextRow.textContent =
          this.doc.song.channels[this.doc.channel].name;
      }

      this._chipNoiseSelectRow.style.display = "none";
      this._chipWaveSelectRow.style.display = "none";
      // advloop addition
      this._useChipWaveAdvancedLoopControlsRow.style.display = "none";
      this._chipWaveLoopModeSelectRow.style.display = "none";
      this._chipWaveLoopStartRow.style.display = "none";
      this._chipWaveLoopEndRow.style.display = "none";
      this._chipWaveStartOffsetRow.style.display = "none";
      this._chipWavePlayBackwardsRow.style.display = "none";
      // advloop addition
      this._spectrumRow.style.display = "none";
      this._harmonicsRow.style.display = "none";
      this._transitionRow.style.display = "none";
      this._chordSelectRow.style.display = "none";
      this._chordDropdownGroup.style.display = "none";
      //this._filterCutoffRow.style.display = "none";
      //this._filterResonanceRow.style.display = "none";
      //this._filterEnvelopeRow.style.display = "none";
      this._drumsetGroup.style.display = "none";
      this._customWaveDraw.style.display = "none";
      this._supersawDynamismRow.style.display = "none";
      this._supersawSpreadRow.style.display = "none";
      this._supersawShapeRow.style.display = "none";
      this._algorithmSelectRow.style.display = "none";
      this._phaseModGroup.style.display = "none";
      this._feedbackRow1.style.display = "none";
      this._feedbackRow2.style.display = "none";
      //this._pulseEnvelopeRow.style.display = "none";
      this._pulseWidthRow.style.display = "none";
      // this._decimalOffsetRow.style.display = "none";
      this._vibratoSelectRow.style.display = "none";
      this._vibratoDropdownGroup.style.display = "none";
      this._envelopeDropdownGroup.style.display = "none";
      //this._intervalSelectRow.style.display = "none";
      this._detuneSliderRow.style.display = "none";
      this._panSliderRow.style.display = "none";
      this._panDropdownGroup.style.display = "none";
      this._pulseWidthDropdownGroup.style.display = "none";
      this._unisonDropdownGroup.style.display = "none";

      this._modulatorGroup.style.display = "";
      this._modulatorGroup.style.color = getPrimaryNoteColor(
        this.doc,
        this.doc.channel
      );

      for (let mod: number = 0; mod < Config.modCount; mod++) {
        let instrument: Instrument =
          this.doc.song.channels[this.doc.channel].instruments[
            this.doc.getCurrentInstrument()
          ];
        let modChannelValue: number = instrument.modChannels[mod];
        let modChannel: number = Math.max(0, modChannelValue);
        let modInstrument: number = instrument.modInstruments[mod];

        // Boundary checking
        if (modChannelValue >= 0) {
          if (
            modInstrument >=
              this.doc.song.channels[modChannel].instruments.length + 2 ||
            (modInstrument > 0 &&
              this.doc.song.channels[modChannel].instruments.length <= 1)
          ) {
            modInstrument = 0;
            instrument.modInstruments[mod] = 0;
          }
          if (this.doc.song.channels[modChannel].type == ChannelType.Mod) {
            instrument.modInstruments[mod] = 0;
            instrument.modulators[mod] = 0;
          }
        }

        // Build options for modulator channels (make sure it has the right number).
        const playableChannelCount =
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount;
        if (
          this.doc.recalcChannelNames ||
          this._modChannelBoxes[mod].children.length != 2 + playableChannelCount
        ) {
          while (this._modChannelBoxes[mod].firstChild)
            this._modChannelBoxes[mod].remove(0);
          const channelList: string[] = [];
          channelList.push("none");
          channelList.push("song");
          let pitchCounter = 1;
          let noiseCounter = 1;
          for (let i = 0; i < this.doc.song.channels.length; i++) {
            const channel = this.doc.song.channels[i];
            if (channel.type === ChannelType.Pitch) {
              if (channel.name == "") {
                channelList.push("pitch " + pitchCounter++);
              } else {
                channelList.push(channel.name);
              }
            } else if (channel.type === ChannelType.Noise) {
              if (channel.name == "") {
                channelList.push("noise " + noiseCounter++);
              } else {
                channelList.push(channel.name);
              }
            }
          }
          buildOptions(this._modChannelBoxes[mod], channelList);
        }

        // Set selected index based on channel info.

        let selectedIndex = 0;
        if (instrument.modChannels[mod] == -2) {
          selectedIndex = 0; // "none"
        } else if (instrument.modChannels[mod] == -1) {
          selectedIndex = 1; // "song"
        } else {
          let playableChannelCounter = 0;
          for (let i = 0; i < this.doc.song.channels.length; i++) {
            const channel = this.doc.song.channels[i];
            if (
              channel.type === ChannelType.Pitch ||
              channel.type === ChannelType.Noise
            ) {
              if (i == instrument.modChannels[mod]) {
                selectedIndex = 2 + playableChannelCounter;
                break;
              }
              playableChannelCounter++;
            }
          }
        }
        this._modChannelBoxes[mod].selectedIndex = selectedIndex;

        let channel: Channel = this.doc.song.channels[modChannel];

        // Build options for modulator instruments, preserving “all”/“active”
        const instBox = this._modInstrumentBoxes[mod];
        const oldCount = instBox.children.length;
        const oldSel   = instBox.selectedIndex;
        const wasAll   = oldSel === oldCount - 2;
        const wasAct   = oldSel === oldCount - 1;
        const newCount = channel.instruments.length + 2;
        if (oldCount !== newCount) {
          while (instBox.firstChild) instBox.remove(0);
          const list: string[] = channel.instruments.map((_,i) => String(i+1));
          list.push("all","active");
          buildOptions(instBox, list);
          if (wasAll)    instBox.selectedIndex = newCount - 2;
          else if (wasAct) instBox.selectedIndex = newCount - 1;
          else             instBox.selectedIndex = Math.min(oldSel, newCount - 1);
        }

        // If non-zero pattern, point to which instrument(s) is/are the current
        if (channel.bars[this.doc.bar] > 0) {
          let usedInstruments: number[] =
            channel.patterns[channel.bars[this.doc.bar] - 1].instruments;

          for (let i: number = 0; i < channel.instruments.length; i++) {
            if (usedInstruments.includes(i)) {
              this._modInstrumentBoxes[mod].options[i].label = "🢒" + (i + 1);
            } else {
              this._modInstrumentBoxes[mod].options[i].label = "" + (i + 1);
            }
          }
        } else {
          for (let i: number = 0; i < channel.instruments.length; i++) {
            this._modInstrumentBoxes[mod].options[i].label = "" + (i + 1);
          }
        }

        // Apply model’s setting unless we’re preserving “all”/“active”
        if (!wasAll && !wasAct) {
          instBox.selectedIndex = instrument.modInstruments[mod];
        }

        // Build options for modulator settings (based on channel settings)

        if (instrument.modChannels[mod] != -2) {
          while (this._modSetBoxes[mod].firstChild)
            this._modSetBoxes[mod].remove(0);
          const settingList: string[] = [];
          const unusedSettingList: string[] = [];

          // Make sure these names match the names declared for modulators in SynthConfig.ts.

          settingList.push("none");

          // Populate mod setting options for the song scope.
          if (instrument.modChannels[mod] == -1) {
            settingList.push("song volume");
            settingList.push("tempo");
            settingList.push("song reverb");
            settingList.push("next bar");
            settingList.push("song detune");
            settingList.push("song eq");
          }
          // Populate mod setting options for instrument scope.
          else {
            settingList.push("note volume");
            settingList.push("mix volume");

            // Build a list of target instrument indices, types and other info. It will be a single type for a single instrument, but with "all" and "active" it could be more.
            // All or active are included together. Active allows any to be set, just in case the user fiddles with which are active later.
            let tgtInstrumentTypes: InstrumentType[] = [];
            let anyInstrumentAdvancedEQ: boolean = false,
              anyInstrumentSimpleEQ: boolean = false,
              anyInstrumentAdvancedNote: boolean = false,
              anyInstrumentSimpleNote: boolean = false,
              anyInstrumentArps: boolean = false,
              anyInstrumentPitchShifts: boolean = false,
              anyInstrumentDetunes: boolean = false,
              anyInstrumentVibratos: boolean = false,
              anyInstrumentNoteFilters: boolean = false,
              anyInstrumentDistorts: boolean = false,
              anyInstrumentBitcrushes: boolean = false,
              anyInstrumentPans: boolean = false,
              anyInstrumentChorus: boolean = false,
              anyInstrumentEchoes: boolean = false,
              anyInstrumentReverbs: boolean = false,
              anyInstrumentRingMods: boolean = false,
              anyInstrumentGranulars: boolean = false,
              anyInstrumentHasEnvelopes: boolean = false;
            let allInstrumentPitchShifts: boolean = true,
              allInstrumentNoteFilters: boolean = true,
              allInstrumentDetunes: boolean = true,
              allInstrumentVibratos: boolean = true,
              allInstrumentDistorts: boolean = true,
              allInstrumentBitcrushes: boolean = true,
              allInstrumentPans: boolean = true,
              allInstrumentChorus: boolean = true,
              allInstrumentEchoes: boolean = true,
              allInstrumentReverbs: boolean = true,
              allInstrumentRingMods: boolean = true,
              allInstrumentGranulars: boolean = true;
            let instrumentCandidates: number[] = [];
            if (modInstrument >= channel.instruments.length) {
              for (let i: number = 0; i < channel.instruments.length; i++) {
                instrumentCandidates.push(i);
              }
            } else {
              instrumentCandidates.push(modInstrument);
            }
            for (let i: number = 0; i < instrumentCandidates.length; i++) {
              let instrumentIndex = instrumentCandidates[i];

              if (
                !tgtInstrumentTypes.includes(
                  channel.instruments[instrumentIndex].type
                )
              )
                tgtInstrumentTypes.push(
                  channel.instruments[instrumentIndex].type
                );
              if (channel.instruments[instrumentIndex].eqFilterType)
                anyInstrumentSimpleEQ = true;
              else anyInstrumentAdvancedEQ = true;
              if (
                effectsIncludeChord(
                  channel.instruments[instrumentIndex].effects
                ) &&
                channel.instruments[instrumentIndex].getChord().arpeggiates
              ) {
                anyInstrumentArps = true;
              }
              if (
                effectsIncludePitchShift(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentPitchShifts = true;
              } else {
                allInstrumentPitchShifts = false;
              }
              if (
                effectsIncludeDetune(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentDetunes = true;
              } else {
                allInstrumentDetunes = false;
              }
              if (
                effectsIncludeVibrato(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentVibratos = true;
              } else {
                allInstrumentVibratos = false;
              }
              if (
                effectsIncludeNoteFilter(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentNoteFilters = true;
                if (channel.instruments[instrumentIndex].noteFilterType)
                  anyInstrumentSimpleNote = true;
                else anyInstrumentAdvancedNote = true;
              } else {
                allInstrumentNoteFilters = false;
              }
              if (
                effectsIncludeDistortion(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentDistorts = true;
              } else {
                allInstrumentDistorts = false;
              }
              if (
                effectsIncludeBitcrusher(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentBitcrushes = true;
              } else {
                allInstrumentBitcrushes = false;
              }
              if (
                effectsIncludePanning(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentPans = true;
              } else {
                allInstrumentPans = false;
              }
              if (
                effectsIncludeChorus(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentChorus = true;
              } else {
                allInstrumentChorus = false;
              }
              if (
                effectsIncludeEcho(channel.instruments[instrumentIndex].effects)
              ) {
                anyInstrumentEchoes = true;
              } else {
                allInstrumentEchoes = false;
              }
              if (
                effectsIncludeReverb(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentReverbs = true;
              } else {
                allInstrumentReverbs = false;
              }
              if (
                effectsIncludeRingModulation(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentRingMods = true;
              } else {
                allInstrumentRingMods = false;
              }
              if (
                effectsIncludeGranular(
                  channel.instruments[instrumentIndex].effects
                )
              ) {
                anyInstrumentGranulars = true;
              } else {
                allInstrumentGranulars = false;
              }
              if (channel.instruments[instrumentIndex].envelopes.length > 0) {
                anyInstrumentHasEnvelopes = true;
              }
            }
            if (anyInstrumentAdvancedEQ) {
              settingList.push("eq filter");
            }
            if (anyInstrumentSimpleEQ) {
              settingList.push("eq filt cut");
              settingList.push("eq filt peak");
            }
            if (tgtInstrumentTypes.includes(InstrumentType.fm)) {
              settingList.push("fm slider 1");
              settingList.push("fm slider 2");
              settingList.push("fm slider 3");
              settingList.push("fm slider 4");
              settingList.push("fm feedback");
            }
            if (tgtInstrumentTypes.includes(InstrumentType.fm6op)) {
              settingList.push("fm slider 1");
              settingList.push("fm slider 2");
              settingList.push("fm slider 3");
              settingList.push("fm slider 4");
              settingList.push("fm slider 5");
              settingList.push("fm slider 6");
              settingList.push("fm feedback");
            }
            if (
              tgtInstrumentTypes.includes(InstrumentType.pwm) ||
              tgtInstrumentTypes.includes(InstrumentType.supersaw)
            ) {
              settingList.push("pulse width");
              settingList.push("decimal offset");
            }
            if (tgtInstrumentTypes.includes(InstrumentType.supersaw)) {
              settingList.push("dynamism");
              settingList.push("spread");
              settingList.push("saw shape");
            }
            if (tgtInstrumentTypes.includes(InstrumentType.pickedString)) {
              settingList.push("sustain");
            }
            if (anyInstrumentArps) {
              settingList.push("arp speed");
              settingList.push("reset arp");
            }
            if (anyInstrumentPitchShifts) {
              settingList.push("pitch shift");
            }
            if (!allInstrumentPitchShifts) {
              unusedSettingList.push("+ pitch shift");
            }
            if (anyInstrumentDetunes) {
              settingList.push("detune");
            }
            if (!allInstrumentDetunes) {
              unusedSettingList.push("+ detune");
            }
            if (anyInstrumentVibratos) {
              settingList.push("vibrato depth");
              settingList.push("vibrato speed");
              settingList.push("vibrato delay");
            }
            if (!allInstrumentVibratos) {
              unusedSettingList.push("+ vibrato depth");
              unusedSettingList.push("+ vibrato speed");
              unusedSettingList.push("+ vibrato delay");
            }
            if (anyInstrumentNoteFilters) {
              if (anyInstrumentAdvancedNote) {
                settingList.push("note filter");
              }
              if (anyInstrumentSimpleNote) {
                settingList.push("note filt cut");
                settingList.push("note filt peak");
              }
            }
            if (!allInstrumentNoteFilters) {
              unusedSettingList.push("+ note filter");
            }
            if (anyInstrumentDistorts) {
              settingList.push("distortion");
            }
            if (!allInstrumentDistorts) {
              unusedSettingList.push("+ distortion");
            }
            if (anyInstrumentBitcrushes) {
              settingList.push("bit crush");
              settingList.push("freq crush");
            }
            if (!allInstrumentBitcrushes) {
              unusedSettingList.push("+ bit crush");
              unusedSettingList.push("+ freq crush");
            }
            if (anyInstrumentPans) {
              settingList.push("pan");
              settingList.push("pan delay");
            }
            if (!allInstrumentPans) {
              unusedSettingList.push("+ pan");
              unusedSettingList.push("+ pan delay");
            }
            if (anyInstrumentChorus) {
              settingList.push("chorus");
            }
            if (!allInstrumentChorus) {
              unusedSettingList.push("+ chorus");
            }
            if (anyInstrumentEchoes) {
              settingList.push("echo");
              // Still need to look into this...
              settingList.push("echo delay");
            }
            if (!allInstrumentEchoes) {
              unusedSettingList.push("+ echo");
              unusedSettingList.push("+ echo delay");
            }
            if (anyInstrumentReverbs) {
              settingList.push("reverb");
            }
            if (!allInstrumentReverbs) {
              unusedSettingList.push("+ reverb");
            }
            if (anyInstrumentRingMods) {
              settingList.push("ring modulation");
              settingList.push("ring mod hertz");
            }
            if (!allInstrumentRingMods) {
              unusedSettingList.push("+ ring modulation");
              unusedSettingList.push("+ ring mod hertz");
            }
            if (anyInstrumentGranulars) {
              settingList.push("granular");
              settingList.push("grain freq");
              settingList.push("grain size");
              settingList.push("grain range");
            }
            if (!allInstrumentGranulars) {
              unusedSettingList.push("+ granular");
              unusedSettingList.push("+ grain freq");
              unusedSettingList.push("+ grain size");
              unusedSettingList.push("+ grain range");
            }

            if (anyInstrumentHasEnvelopes) {
              settingList.push("envelope speed");
              settingList.push("individual envelope speed");
              settingList.push("individual envelope lower bound");
              settingList.push("individual envelope upper bound");
              settingList.push("reset envelope");
            }
          }

          buildOptions(this._modSetBoxes[mod], settingList);
          if (unusedSettingList.length > 0) {
            this._modSetBoxes[mod].appendChild(
              option(
                { selected: false, disabled: true, value: "Add Effect" },
                "Add Effect"
              )
            );
            buildOptions(this._modSetBoxes[mod], unusedSettingList);
          }

          let setIndex: number = settingList.indexOf(
            Config.modulators[instrument.modulators[mod]].name
          );

          // Catch instances where invalid set forced setting to "none"
          if (setIndex == -1) {
            this._modSetBoxes[mod].insertBefore(
              option(
                {
                  value: Config.modulators[instrument.modulators[mod]].name,
                  style: "color: red;",
                },
                Config.modulators[instrument.modulators[mod]].name
              ),
              this._modSetBoxes[mod].children[0]
            );
            this._modSetBoxes[mod].selectedIndex = 0;
            this._whenSetModSetting(mod, true);
          } else {
            this._modSetBoxes[mod].selectedIndex = setIndex;
            this._modSetBoxes[mod].classList.remove("invalidSetting");
            instrument.invalidModulators[mod] = false;
          }
        } else if (this._modSetBoxes[mod].selectedIndex > 0) {
          this._modSetBoxes[mod].selectedIndex = 0;
          this._whenSetModSetting(mod);
        }

        //Hide instrument select if channel is "none" or "song"
        //Hopefully the !. don't ruin something...
        if (instrument.modChannels[mod] < 0) {
          (
            this._modInstrumentBoxes[mod].parentElement as HTMLDivElement
          ).style.display = "none";
          $("#modInstrumentText" + mod).get(0)!.style.display = "none";
          $("#modChannelText" + mod).get(0)!.innerText = "Channel:";

          //Hide setting select if channel is "none"
          if (instrument.modChannels[mod] == -2) {
            $("#modSettingText" + mod).get(0)!.style.display = "none";
            (
              this._modSetBoxes[mod].parentElement as HTMLDivElement
            ).style.display = "none";
          } else {
            $("#modSettingText" + mod).get(0)!.style.display = "";
            (
              this._modSetBoxes[mod].parentElement as HTMLDivElement
            ).style.display = "";
          }

          this._modTargetIndicators[mod].style.setProperty(
            "fill",
            ColorConfig.uiWidgetFocus
          );
          this._modTargetIndicators[mod].classList.remove("modTarget");
        } else {
          (
            this._modInstrumentBoxes[mod].parentElement as HTMLDivElement
          ).style.display = channel.instruments.length > 1 ? "" : "none";
          $("#modInstrumentText" + mod).get(0)!.style.display =
            channel.instruments.length > 1 ? "" : "none";
          $("#modChannelText" + mod).get(0)!.innerText =
            channel.instruments.length > 1 ? "Ch:" : "Channel:";
          $("#modSettingText" + mod).get(0)!.style.display = "";
          (
            this._modSetBoxes[mod].parentElement as HTMLDivElement
          ).style.display = "";

          this._modTargetIndicators[mod].style.setProperty(
            "fill",
            ColorConfig.indicatorPrimary
          );
          this._modTargetIndicators[mod].classList.add("modTarget");
        }

        let filterType: string =
          Config.modulators[instrument.modulators[mod]].name;
        let useSongEq: boolean = filterType == "song eq";
        if (useSongEq) filterType = "eq filter";
        if (filterType == "eq filter" || filterType == "note filter") {
          $("#modFilterText" + mod).get(0)!.style.display = "";
          $("#modEnvelopeText" + mod).get(0)!.style.display = "none";
          $("#modSettingText" + mod)
            .get(0)!
            .style.setProperty("margin-bottom", "2px");

          let useInstrument: number = instrument.modInstruments[mod];
          let modChannel: Channel =
            this.doc.song.channels[Math.max(0, instrument.modChannels[mod])];
          let tmpCount: number = -1;
          if (useInstrument >= modChannel.instruments.length) {
            // Use greatest number of dots among all instruments if setting is 'all' or 'active'. If it won't have an effect on one, no worry.
            for (let i: number = 0; i < modChannel.instruments.length; i++) {
              if (filterType == "eq filter") {
                if (
                  modChannel.instruments[i].eqFilter.controlPointCount >
                  tmpCount
                ) {
                  tmpCount =
                    modChannel.instruments[i].eqFilter.controlPointCount;
                  useInstrument = i;
                }
              } else {
                if (
                  modChannel.instruments[i].noteFilter.controlPointCount >
                  tmpCount
                ) {
                  tmpCount =
                    modChannel.instruments[i].noteFilter.controlPointCount;
                  useInstrument = i;
                }
              }
            }
          }

          // Build options for modulator filters (make sure it has the right number of filter dots).
          let dotCount: number =
            filterType == "eq filter"
              ? channel.instruments[useInstrument].getLargestControlPointCount(
                  false
                )
              : channel.instruments[useInstrument].getLargestControlPointCount(
                  true
                );

          const isSimple: boolean = useSongEq
            ? false
            : filterType == "eq filter"
            ? channel.instruments[useInstrument].eqFilterType
            : channel.instruments[useInstrument].noteFilterType;
          if (isSimple) dotCount = 0;
          if (useSongEq) {
            dotCount = this.doc.song.eqFilter.controlPointCount;
            if (this._modFilterBoxes[mod].children.length != 1 + dotCount * 2) {
              while (this._modFilterBoxes[mod].firstChild)
                this._modFilterBoxes[mod].remove(0);
              const dotList: string[] = [];
              dotList.push("morph");
              for (let i: number = 0; i < dotCount; i++) {
                dotList.push("dot " + (i + 1) + " x");
                dotList.push("dot " + (i + 1) + " y");
              }
              buildOptions(this._modFilterBoxes[mod], dotList);
            }
          } else if (
            isSimple ||
            this._modFilterBoxes[mod].children.length != 1 + dotCount * 2
          ) {
            while (this._modFilterBoxes[mod].firstChild)
              this._modFilterBoxes[mod].remove(0);
            const dotList: string[] = [];
            if (!isSimple) dotList.push("morph");
            for (let i: number = 0; i < dotCount; i++) {
              dotList.push("dot " + (i + 1) + " x");
              dotList.push("dot " + (i + 1) + " y");
            }
            buildOptions(this._modFilterBoxes[mod], dotList);
          }

          if (
            isSimple ||
            instrument.modFilterTypes[mod] >= this._modFilterBoxes[mod].length
          ) {
            this._modFilterBoxes[mod].classList.add("invalidSetting");
            instrument.invalidModulators[mod] = true;
            let useName: string =
              (instrument.modFilterTypes[mod] - 1) % 2 == 1
                ? "dot " +
                  (Math.floor((instrument.modFilterTypes[mod] - 1) / 2) + 1) +
                  " y"
                : "dot " +
                  (Math.floor((instrument.modFilterTypes[mod] - 1) / 2) + 1) +
                  " x";
            if (instrument.modFilterTypes[mod] == 0) useName = "morph";
            this._modFilterBoxes[mod].insertBefore(
              option({ value: useName, style: "color: red;" }, useName),
              this._modFilterBoxes[mod].children[0]
            );
            this._modFilterBoxes[mod].selectedIndex = 0;
          } else {
            this._modFilterBoxes[mod].classList.remove("invalidSetting");
            instrument.invalidModulators[mod] = false;
            this._modFilterBoxes[mod].selectedIndex =
              instrument.modFilterTypes[mod];
          }
        } else {
          $("#modFilterText" + mod).get(0)!.style.display = "none";
          $("#modSettingText" + mod)
            .get(0)!
            .style.setProperty("margin-bottom", "0.9em");
        }

        let envelopes: string =
          Config.modulators[instrument.modulators[mod]].name;
        if (
          envelopes == "individual envelope speed" ||
          envelopes == "reset envelope" ||
          envelopes == "individual envelope lower bound" ||
          envelopes == "individual envelope upper bound"
        ) {
          $("#modEnvelopeText" + mod).get(0)!.style.display = "";
          $("#modFilterText" + mod).get(0)!.style.display = "none";
          $("#modSettingText" + mod)
            .get(0)!
            .style.setProperty("margin-bottom", "2px");

          let modChannel: Channel =
            this.doc.song.channels[Math.max(0, instrument.modChannels[mod])];
          let envCount: number = -1;
          // Use greatest envelope count among all instruments if setting is 'all' or 'active'. If it won't have an effect on one, no worry.
          for (let i: number = 0; i < modChannel.instruments.length; i++) {
            if (modChannel.instruments[i].envelopeCount > envCount) {
              envCount = modChannel.instruments[i].envelopeCount;
            }
          }

          // Build options for modulator envelopes (make sure it has the right number of envelopes).
          while (this._modEnvelopeBoxes[mod].firstChild)
            this._modEnvelopeBoxes[mod].remove(0);
          const envelopeList: string[] = [];
          for (let i: number = 0; i < envCount; i++) {
            envelopeList.push("envelope " + (i + 1));
          }
          buildOptions(this._modEnvelopeBoxes[mod], envelopeList);

          if (
            instrument.modEnvelopeNumbers[mod] >=
            this._modEnvelopeBoxes[mod].length
          ) {
            this._modEnvelopeBoxes[mod].classList.add("invalidSetting");
            instrument.invalidModulators[mod] = true;
            let useName: string =
              "envelope " + instrument.modEnvelopeNumbers[mod];
            this._modEnvelopeBoxes[mod].insertBefore(
              option({ value: useName, style: "color: red;" }, useName),
              this._modEnvelopeBoxes[mod].children[0]
            );
            this._modEnvelopeBoxes[mod].selectedIndex = 0;
          } else {
            this._modEnvelopeBoxes[mod].classList.remove("invalidSetting");
            instrument.invalidModulators[mod] = false;
            this._modEnvelopeBoxes[mod].selectedIndex =
              instrument.modEnvelopeNumbers[mod];
          }
        } else {
          $("#modEnvelopeText" + mod).get(0)!.style.display = "none";
          if (!(filterType == "eq filter" || filterType == "note filter")) {
            $("#modSettingText" + mod)
              .get(0)!
              .style.setProperty("margin-bottom", "0.9em");
          }
        }
      }

      this.doc.recalcChannelNames = false;

      for (
        let chordIndex: number = 0;
        chordIndex < Config.chords.length;
        chordIndex++
      ) {
        const option: Element = this._chordSelect.children[chordIndex];
        if (!option.hasAttribute("hidden")) {
          option.setAttribute("hidden", "");
        }
      }

      //this._instrumentSelectRow.style.display = "none";

      this._customInstrumentSettingsGroup.style.display = "none";
      this._panSliderRow.style.display = "none";
      this._panDropdownGroup.style.display = "none";
      this._instrumentVolumeSliderRow.style.display = "none";
      this._instrumentTypeSelectRow.style.setProperty("display", "none");

      this._instrumentSettingsGroup.style.color = getPrimaryNoteColor(
        this.doc,
        this.doc.channel
      );

      // Force piano to re-show, if channel is modulator
      if (
        this.doc.channel >=
        this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
      ) {
        this._piano.forceRender();
      }

      this._renderInstrumentBar(channel, instrumentIndex, colors);
    }

    this._instrumentSettingsGroup.style.color = getPrimaryNoteColor(
      this.doc,
      this.doc.channel
    );

    if (
      this.doc.synth.isFilterModActive(
        false,
        this.doc.channel,
        this.doc.getCurrentInstrument()
      )
    ) {
      this._eqFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    } else {
      this._eqFilterEditor.render();
    }
    if (this.doc.synth.isFilterModActive(false, 0, 0, true)) {
      this._songEqFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    } else {
      this._songEqFilterEditor.render();
    }
    this._instrumentVolumeSlider.updateValue(instrument.volume);
    this._detuneSlider.updateValue(instrument.detune - Config.detuneCenter);
    this._twoNoteArpBox.checked = instrument.fastTwoNoteArp ? true : false;
    this._clicklessTransitionBox.checked = instrument.clicklessTransition
      ? true
      : false;
    this._aliasingBox.checked = instrument.aliases ? true : false;
    this._addEnvelopeButton.disabled =
      instrument.envelopeCount >= Config.maxEnvelopeCount;

    this._volumeSlider.updateValue(prefs.volume);

    // If an interface element was selected, but becomes invisible (e.g. an instrument
    // select menu) just select the editor container so keyboard commands still work.
    if (wasActive && activeElement != null && activeElement.clientWidth == 0) {
      this.refocusStage();
    }

    this._setPrompt(this.doc.prompt);

    if (prefs.autoFollow && !this.doc.synth.playing) {
      this.doc.synth.goToBar(this.doc.bar);
    }

    // When adding effects or envelopes to an instrument in fullscreen modes,
    // auto-scroll the settings areas to ensure the new settings are visible.
    if (this.doc.addedEffect) {
      const envButtonRect: DOMRect =
        this._addEnvelopeButton.getBoundingClientRect();
      const instSettingsRect: DOMRect =
        this._instrumentSettingsArea.getBoundingClientRect();
      const settingsRect: DOMRect = this._settingsArea.getBoundingClientRect();
      this._instrumentSettingsArea.scrollTop += Math.max(
        0,
        envButtonRect.top - (instSettingsRect.top + instSettingsRect.height)
      );
      this._settingsArea.scrollTop += Math.max(
        0,
        envButtonRect.top - (settingsRect.top + settingsRect.height)
      );
      this.doc.addedEffect = false;
    }
    if (this.doc.addedEnvelope) {
      this._instrumentSettingsArea.scrollTop =
        this._instrumentSettingsArea.scrollHeight;
      this._settingsArea.scrollTop = this._settingsArea.scrollHeight;
      this.doc.addedEnvelope = false;
    }

    if (
      this._ringModWaveSelect.selectedIndex ==
      Config.operatorWaves.dictionary["pulse width"].index
    ) {
      this._ringModPulsewidthSlider.container.style.display = "";
      this._ringModWaveText.style.display = "none";
    } else {
      this._ringModPulsewidthSlider.container.style.display = "none";
      this._ringModWaveText.style.display = "";
    }

    // Writeback to mods if control key is held while moving a slider.
    this.handleModRecording();
  };

  public handleModRecording(): void {
    window.clearTimeout(this._modRecTimeout);
    const lastChange: Change | null = this.doc.checkLastChange();
    if (
      (this._ctrlHeld || this._shiftHeld) &&
      lastChange != null &&
      this.doc.synth.playing
    ) {
      const changedPatterns = this._patternEditor.setModSettingsForChange(
        lastChange,
        this
      );
      if (this.doc.continuingModRecordingChange != null) {
        this._modRecTimeout = window.setTimeout(() => {
          this.handleModRecording();
        }, 10);
        this.doc.recordingModulators = true;

        if (changedPatterns) this._trackEditor.render();
      }
    } else if (this.doc.recordingModulators) {
      this.doc.recordingModulators = false;
      // A dummy change that pushes history state.
      this.doc.record(
        new ChangeHoldingModRecording(this.doc, null, null, null)
      );
    }
  }

  private _renderInstrumentBar(
    channel: Channel,
    instrumentIndex: number,
    colors: ChannelColors
  ) {
    if (this.doc.song.layeredInstruments || this.doc.song.patternInstruments) {
      this._instrumentsButtonRow.style.display = "";
      this._instrumentsButtonBar.style.setProperty(
        "--text-color-lit",
        getPrimaryNoteColor(this.doc, this.doc.channel)
      );
      this._instrumentsButtonBar.style.setProperty(
        "--text-color-dim",
        getSecondaryNoteColor(this.doc, this.doc.channel)
      );
      this._instrumentsButtonBar.style.setProperty(
        "--background-color-lit",
        getPrimaryNoteColor(this.doc, this.doc.channel)
      );
      this._instrumentsButtonBar.style.setProperty(
        "--background-color-dim",
        getSecondaryNoteColor(this.doc, this.doc.channel)
      );

      const maxInstrumentsPerChannel =
        this.doc.song.getMaxInstrumentsPerChannel();
      while (this._instrumentButtons.length < channel.instruments.length) {
        const instrumentButton: HTMLButtonElement = button(
          String(this._instrumentButtons.length + 1)
        );
        this._instrumentButtons.push(instrumentButton);
        this._instrumentsButtonBar.insertBefore(
          instrumentButton,
          this._instrumentRemoveButton
        );
      }
      for (
        let i: number = this._renderedInstrumentCount;
        i < channel.instruments.length;
        i++
      ) {
        this._instrumentButtons[i].style.display = "";
      }
      for (
        let i: number = channel.instruments.length;
        i < this._renderedInstrumentCount;
        i++
      ) {
        this._instrumentButtons[i].style.display = "none";
      }
      this._renderedInstrumentCount = channel.instruments.length;
      while (this._instrumentButtons.length > maxInstrumentsPerChannel) {
        this._instrumentsButtonBar.removeChild(this._instrumentButtons.pop()!);
      }

      this._instrumentRemoveButton.style.display =
        channel.instruments.length > Config.instrumentCountMin ? "" : "none";
      this._instrumentAddButton.style.display =
        channel.instruments.length < maxInstrumentsPerChannel ? "" : "none";
      if (channel.instruments.length < maxInstrumentsPerChannel) {
        this._instrumentRemoveButton.classList.remove("last-button");
      } else {
        this._instrumentRemoveButton.classList.add("last-button");
      }
      if (channel.instruments.length > 1) {
        if (this._highlightedInstrumentIndex != instrumentIndex) {
          const oldButton: HTMLButtonElement =
            this._instrumentButtons[this._highlightedInstrumentIndex];
          if (oldButton != null)
            oldButton.classList.remove("selected-instrument");
          const newButton: HTMLButtonElement =
            this._instrumentButtons[instrumentIndex];
          newButton.classList.add("selected-instrument");
          this._highlightedInstrumentIndex = instrumentIndex;
        }
      } else {
        const oldButton: HTMLButtonElement =
          this._instrumentButtons[this._highlightedInstrumentIndex];
        if (oldButton != null)
          oldButton.classList.remove("selected-instrument");
        this._highlightedInstrumentIndex = -1;
      }

      if (
        this.doc.song.layeredInstruments &&
        this.doc.song.patternInstruments &&
        this.doc.channel <
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
      ) {
        //const pattern: Pattern | null = this._doc.getCurrentPattern();
        for (let i: number = 0; i < channel.instruments.length; i++) {
          if (
            this.doc.recentPatternInstruments[this.doc.channel].indexOf(i) != -1
          ) {
            this._instrumentButtons[i].classList.remove("deactivated");
          } else {
            this._instrumentButtons[i].classList.add("deactivated");
          }
        }
        this._deactivatedInstruments = true;
      } else if (
        this._deactivatedInstruments ||
        this.doc.channel >=
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
      ) {
        for (let i: number = 0; i < channel.instruments.length; i++) {
          this._instrumentButtons[i].classList.remove("deactivated");
        }
        this._deactivatedInstruments = false;
      }

      if (
        this.doc.song.layeredInstruments &&
        this.doc.song.patternInstruments &&
        channel.instruments.length > 1 &&
        this.doc.channel <
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
      ) {
        for (let i: number = 0; i < channel.instruments.length; i++) {
          this._instrumentButtons[i].classList.remove("no-underline");
        }
      } else {
        for (let i: number = 0; i < channel.instruments.length; i++) {
          this._instrumentButtons[i].classList.add("no-underline");
        }
      }
    } else {
      this._instrumentsButtonRow.style.display = "none";
    }
  }

  public updatePlayButton = (): void => {
    if (
      this._renderedIsPlaying != this.doc.synth.playing ||
      this._renderedIsRecording != this.doc.synth.recording ||
      this._renderedShowRecordButton != this.doc.prefs.showRecordButton ||
      this._renderedCtrlHeld != this._ctrlHeld
    ) {
      this._renderedIsPlaying = this.doc.synth.playing;
      this._renderedIsRecording = this.doc.synth.recording;
      this._renderedShowRecordButton = this.doc.prefs.showRecordButton;
      this._renderedCtrlHeld = this._ctrlHeld;

      if (
        document.activeElement == this._playButton ||
        document.activeElement == this._pauseButton ||
        document.activeElement == this._recordButton ||
        document.activeElement == this._stopButton
      ) {
        // When a focused element is hidden, focus is transferred to the document, so let's refocus the editor instead to make sure we can still capture keyboard input.
        this.refocusStage();
      }

      this._playButton.style.display = "none";
      this._pauseButton.style.display = "none";
      this._recordButton.style.display = "none";
      this._stopButton.style.display = "none";
      this._prevBarButton.style.display = "";
      this._nextBarButton.style.display = "";
      this._playButton.classList.remove("shrunk");
      this._recordButton.classList.remove("shrunk");
      this._patternEditorRow.style.pointerEvents = "";
      this._octaveScrollBar.container.style.pointerEvents = "";
      this._octaveScrollBar.container.style.opacity = "";
      this._trackContainer.style.pointerEvents = "";
      this._loopEditor.container.style.opacity = "";
      this._instrumentSettingsArea.style.pointerEvents = "";
      this._instrumentSettingsArea.style.opacity = "";
      this._menuArea.style.pointerEvents = "";
      this._menuArea.style.opacity = "";
      this._songSettingsArea.style.pointerEvents = "";
      this._songSettingsArea.style.opacity = "";

      if (this.doc.synth.recording) {
        this._stopButton.style.display = "";
        this._prevBarButton.style.display = "none";
        this._nextBarButton.style.display = "none";
        this._patternEditorRow.style.pointerEvents = "none";
        this._octaveScrollBar.container.style.pointerEvents = "none";
        this._octaveScrollBar.container.style.opacity = "0.5";
        this._trackContainer.style.pointerEvents = "none";
        this._loopEditor.container.style.opacity = "0.5";
        this._instrumentSettingsArea.style.pointerEvents = "none";
        this._instrumentSettingsArea.style.opacity = "0.5";
        this._menuArea.style.pointerEvents = "none";
        this._menuArea.style.opacity = "0.5";
        this._songSettingsArea.style.pointerEvents = "none";
        this._songSettingsArea.style.opacity = "0.5";
      } else if (this.doc.synth.playing) {
        this._pauseButton.style.display = "";
      } else if (this.doc.prefs.showRecordButton) {
        this._playButton.style.display = "";
        this._recordButton.style.display = "";
        this._playButton.classList.add("shrunk");
        this._recordButton.classList.add("shrunk");
      } else if (this._ctrlHeld) {
        this._recordButton.style.display = "";
      } else {
        this._playButton.style.display = "";
      }
    }
    window.requestAnimationFrame(this.updatePlayButton);
  };

  private _onTrackAreaScroll = (event: Event): void => {
    this.doc.barScrollPos =
      this._trackAndMuteContainer.scrollLeft / this.doc.getBarWidth();
    this.doc.channelScrollPos =
      this._trackAndMuteContainer.scrollTop / ChannelRow.patternHeight;
    //this._doc.notifier.changed();
  };

  private _disableCtrlContextMenu = (event: MouseEvent): boolean => {
    // On a Mac, clicking while holding control opens the right-click context menu.
    // But in the pattern and track editors I'd rather prevent that and instead allow
    // custom behaviors such as setting the volume of a note.
    if (event.ctrlKey) {
      event.preventDefault();
      return false;
    }
    return true;
  };

  private _usageCheck(channelIndex: number, instrumentIndex: number): void {
    var instrumentUsed = false;
    var patternUsed = false;
    var modUsed = false;
    const channel: Channel = this.doc.song.channels[channelIndex];

    if (
      channelIndex <
      this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
    ) {
      for (
        let modChannelIdx: number =
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount;
        modChannelIdx < this.doc.song.channels.length;
        modChannelIdx++
      ) {
        const modChannel: Channel = this.doc.song.channels[modChannelIdx];
        const patternIdx = modChannel.bars[this.doc.bar];
        if (patternIdx > 0) {
          const modInstrumentIdx: number =
            modChannel.patterns[patternIdx - 1].instruments[0];
          const modInstrument: Instrument =
            modChannel.instruments[modInstrumentIdx];
          for (let mod: number = 0; mod < Config.modCount; mod++) {
            if (
              modInstrument.modChannels[mod] == channelIndex &&
              (modInstrument.modInstruments[mod] == instrumentIndex ||
                modInstrument.modInstruments[mod] >= channel.instruments.length)
            ) {
              modUsed = true;
            }
          }
        }
      }
    }

    let lowestSelX: number = Math.min(
      this.doc.selection.boxSelectionX0,
      this.doc.selection.boxSelectionX1
    );
    let highestSelX: number = Math.max(
      this.doc.selection.boxSelectionX0,
      this.doc.selection.boxSelectionX1
    );
    let lowestSelY: number = Math.min(
      this.doc.selection.boxSelectionY0,
      this.doc.selection.boxSelectionY1
    );
    let highestSelY: number = Math.max(
      this.doc.selection.boxSelectionY0,
      this.doc.selection.boxSelectionY1
    );

    if (channel.bars[this.doc.bar] != 0) {
      for (let i: number = 0; i < this.doc.song.barCount; i++) {
        // Check for this exact bar in another place, but only count it if it's not within the selection
        if (
          channel.bars[i] == channel.bars[this.doc.bar] &&
          i != this.doc.bar &&
          (i < lowestSelX ||
            i > highestSelX ||
            this.doc.channel < lowestSelY ||
            this.doc.channel > highestSelY)
        ) {
          patternUsed = true;
          i = this.doc.song.barCount;
        }
      }
    }

    for (let i: number = 0; i < this.doc.song.barCount; i++) {
      // Check for this exact instrument in another place, but only count it if it's not within the selection
      if (
        channel.bars[i] != 0 &&
        channel.bars[i] != channel.bars[this.doc.bar] &&
        channel.patterns[channel.bars[i] - 1].instruments.includes(
          instrumentIndex
        ) &&
        i != this.doc.bar &&
        (i < lowestSelX ||
          i > highestSelX ||
          this.doc.channel < lowestSelY ||
          this.doc.channel > highestSelY)
      ) {
        instrumentUsed = true;
        i = this.doc.song.barCount;
      }
    }

    if (patternUsed) {
      this._usedPatternIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorPrimary
      );
      this.patternUsed = true;
    } else {
      this._usedPatternIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorSecondary
      );
      this.patternUsed = false;
    }
    if (instrumentUsed) {
      this._usedInstrumentIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorPrimary
      );
    } else {
      this._usedInstrumentIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorSecondary
      );
    }
    if (modUsed) {
      this._jumpToModIndicator.style.setProperty("display", "");
      this._jumpToModIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorPrimary
      );
      this._jumpToModIndicator.classList.add("modTarget");
    } else if (
      channelIndex <
      this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
    ) {
      this._jumpToModIndicator.style.setProperty("display", "");
      this._jumpToModIndicator.style.setProperty(
        "fill",
        ColorConfig.indicatorSecondary
      );
      this._jumpToModIndicator.classList.remove("modTarget");
    } else {
      this._jumpToModIndicator.style.setProperty("display", "none");
    }
  }

  private _tempoStepperCaptureNumberKeys = (event: KeyboardEvent): void => {
    // When the number input is in focus, allow some keyboard events to
    // edit the input without accidentally editing the song otherwise.
    switch (event.keyCode) {
      case 8: // backspace/delete
      case 13: // enter/return
      case 38: // up
      case 40: // down
      case 37: // left
      case 39: // right
      case 48: // 0
      case 49: // 1
      case 50: // 2
      case 51: // 3
      case 52: // 4
      case 53: // 5
      case 54: // 6
      case 55: // 7
      case 56: // 8
      case 57: // 9
        event.stopPropagation();
        break;
    }
  };

  private _whenKeyPressed = (event: KeyboardEvent): void => {
    this._ctrlHeld = event.ctrlKey;
    this._shiftHeld = event.shiftKey;

    if (this.prompt) {
      if (
        this.prompt instanceof CustomChipPrompt ||
        this.prompt instanceof LimiterPrompt ||
        this.prompt instanceof CustomScalePrompt ||
        this.prompt instanceof CustomFilterPrompt
      ) {
        this.prompt.whenKeyPressed(event);
      }
      if (event.keyCode == 27) {
        // ESC key
        // close prompt.
        this.doc.undo();
      }
      return;
    }

    // Defer to actively editing song title, channel name, or mod label
    if (
      document.activeElement == this._songTitleInputBox.input ||
      this._patternEditor.editingModLabel ||
      document.activeElement == this._muteEditor._channelNameInput.input
    ) {
      // Enter/esc returns focus to form
      if (event.keyCode == 13 || event.keyCode == 27) {
        this.mainLayer.focus();
        this._patternEditor.stopEditingModLabel(event.keyCode == 27);
      }

      return;
    }

    // Defer to actively editing volume/pan rows
    if (
      document.activeElement == this._panSliderInputBox ||
      document.activeElement == this._pwmSliderInputBox ||
      document.activeElement == this._detuneSliderInputBox ||
      document.activeElement == this._instrumentVolumeSliderInputBox ||
      // advloop addition
      document.activeElement == this._chipWaveLoopStartStepper ||
      document.activeElement == this._chipWaveLoopEndStepper ||
      document.activeElement == this._chipWaveStartOffsetStepper ||
      // advloop addition
      document.activeElement == this._octaveStepper ||
      document.activeElement == this._unisonVoicesInputBox ||
      document.activeElement == this._unisonSpreadInputBox ||
      document.activeElement == this._unisonOffsetInputBox ||
      document.activeElement == this._unisonExpressionInputBox ||
      document.activeElement == this._unisonSignInputBox ||
      document.activeElement == this._monophonicNoteInputBox ||
      this.envelopeEditor.pitchStartBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.pitchEndBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.perEnvelopeLowerBoundBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.perEnvelopeUpperBoundBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.randomStepsBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.randomStepsBoxes.find(
        (element) => element == document.activeElement
      ) ||
      this.envelopeEditor.LFOStepsBoxes.find(
        (element) => element == document.activeElement
      )
    ) {
      // Enter/esc returns focus to form
      if (event.keyCode == 13 || event.keyCode == 27) {
        this.mainLayer.focus();
      }

      return;
    }

    if (this.doc.synth.recording) {
      // The only valid keyboard interactions when recording are playing notes or pressing space OR P to stop.
      if (!event.ctrlKey && !event.metaKey) {
        this._keyboardLayout.handleKeyEvent(event, true);
      }
      if (event.keyCode == 32) {
        // space
        this._toggleRecord();
        event.preventDefault();
        this.refocusStage();
      } else if (event.keyCode == 80 && (event.ctrlKey || event.metaKey)) {
        // p
        this._toggleRecord();
        event.preventDefault();
        this.refocusStage();
      }
      return;
    }

    const needControlForShortcuts: boolean =
      this.doc.prefs.pressControlForShortcuts !=
      event.getModifierState("CapsLock");
    const canPlayNotes: boolean =
      !event.ctrlKey && !event.metaKey && needControlForShortcuts;
    if (canPlayNotes) this._keyboardLayout.handleKeyEvent(event, true);

    //this._trackEditor.onKeyPressed(event);
    switch (event.keyCode) {
      case 27: // ESC key
        if (!event.ctrlKey && !event.metaKey) {
          new ChangePatternSelection(this.doc, 0, 0);
          this.doc.selection.resetBoxSelection();
        }
        break;
      case 16: // Shift
        this._patternEditor.shiftMode = true;
        break;
      case 17: // Ctrl
        this._patternEditor.controlMode = true;
        break;
      case 32: // space
        if (event.ctrlKey) {
          this._toggleRecord();
        } else if (event.shiftKey) {
          // Jump to mouse
          if (
            this._trackEditor.movePlayheadToMouse() ||
            this._patternEditor.movePlayheadToMouse()
          ) {
            if (!this.doc.synth.playing) this.doc.performance.play();
          }
          if (
            Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
            Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
          ) {
            this.doc.synth.loopBarStart = -1;
            this.doc.synth.loopBarEnd = -1;
            this._loopEditor.setLoopAt(
              this.doc.synth.loopBarStart,
              this.doc.synth.loopBarEnd
            );
          }
        } else {
          this.togglePlay();
        }
        event.preventDefault();
        this.refocusStage();
        break;
      case 80: // p
        if (canPlayNotes) break;
        if (event.ctrlKey || event.metaKey) {
          this._toggleRecord();
          this.doc.synth.loopBarStart = -1;
          this.doc.synth.loopBarEnd = -1;
          this._loopEditor.setLoopAt(
            this.doc.synth.loopBarStart,
            this.doc.synth.loopBarEnd
          );

          event.preventDefault();
          this.refocusStage();
        } else if (canPlayNotes) break;
        if (
          needControlForShortcuts == (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          location.href =
            "player/" +
            (OFFLINE ? "index.html" : "") +
            "#song=" +
            this.doc.song.toBase64String();
          event.preventDefault();
        }
        break;
      case 192: // `/~
        if (canPlayNotes) break;
        if (event.shiftKey) {
          this.doc.goBackToStart();
          this.doc.song.restoreLimiterDefaults();
          for (const channel of this.doc.song.channels) {
            channel.muted = false;
            channel.name = "";
          }
          this.doc.record(new ChangeSong(this.doc, ""), false, true);
        } else {
          if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
            this._openPrompt("songRecovery");
          }
        }
        event.preventDefault();
        break;
      case 90: // z
        if (canPlayNotes) break;
        if (event.shiftKey) {
          this.doc.redo();
        } else {
          this.doc.undo();
        }
        event.preventDefault();
        break;
      case 88: // x
        if (canPlayNotes) break;
        this.doc.selection.cutNotes();
        event.preventDefault();
        break;
      case 89: // y
        if (canPlayNotes) break;
        this.doc.redo();
        event.preventDefault();
        break;
      case 66: // b
        if (canPlayNotes) break;

        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          if (event.shiftKey) {
            this._openPrompt("beatsPerBar");
          } else {
            const leftSel = Math.min(
              this.doc.selection.boxSelectionX0,
              this.doc.selection.boxSelectionX1
            );
            const rightSel = Math.max(
              this.doc.selection.boxSelectionX0,
              this.doc.selection.boxSelectionX1
            );
            if (
              leftSel < this.doc.synth.loopBarStart ||
              this.doc.synth.loopBarStart == -1 ||
              rightSel > this.doc.synth.loopBarEnd ||
              this.doc.synth.loopBarEnd == -1
            ) {
              this.doc.synth.loopBarStart = leftSel;
              this.doc.synth.loopBarEnd = rightSel;

              if (!this.doc.synth.playing) {
                this.doc.synth.snapToBar();
                this.doc.performance.play();
              }
            } else {
              this.doc.synth.loopBarStart = -1;
              this.doc.synth.loopBarEnd = -1;
            }

            // Pressed while viewing a different bar than the current synth playhead.
            if (
              this.doc.bar != Math.floor(this.doc.synth.playhead) &&
              this.doc.synth.loopBarStart != -1
            ) {
              this.doc.synth.goToBar(this.doc.bar);
              this.doc.synth.snapToBar();
              this.doc.synth.initModFilters(this.doc.song);
              this.doc.synth.computeLatestModValues();
              if (this.doc.prefs.autoFollow) {
                this.doc.selection.setChannelBar(
                  this.doc.channel,
                  Math.floor(this.doc.synth.playhead)
                );
              }
            }

            this._loopEditor.setLoopAt(
              this.doc.synth.loopBarStart,
              this.doc.synth.loopBarEnd
            );
          }
        }
        event.preventDefault();
        break;
      case 67: // c
        if (canPlayNotes) break;
        if (event.shiftKey) {
          this._copyInstrument();
        } else {
          this.doc.selection.copy();
          this.doc.selection.resetBoxSelection();
          this.doc.selection.selectionUpdated();
        }
        event.preventDefault();
        break;
      case 13: // enter/return
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
          // ==== ADD CHANNEL + SHIFT TAGS ====
          const idx = this.doc.channel;
          let type: ChannelType = this.doc.song.getChannelIsMod(idx)
            ? ChannelType.Mod
            : this.doc.song.getChannelIsNoise(idx)
            ? ChannelType.Noise
            : ChannelType.Pitch;
          const cg = new ChangeGroup();
          for (const tag of this.doc.song.channelTags) {
            if (tag.startChannel > idx) {
              // entirely below insertion → shift both start+end
              cg.append(
                new ChangeChannelTagRange(
                  this.doc,
                  tag.id,
                  tag.startChannel + 1,
                  tag.endChannel + 1
                )
              );
            } else if (tag.endChannel >= idx) {
              // spans insertion → shift end only
              cg.append(
                new ChangeChannelTagRange(
                  this.doc,
                  tag.id,
                  tag.startChannel,
                  tag.endChannel + 1
                )
              );
            }
          }
          cg.append(new ChangeAddChannel(this.doc, type, idx));
          this.doc.record(cg);
        } else if (event.shiftKey) {
          const width = this.doc.selection.boxSelectionWidth;
          this.doc.selection.boxSelectionX0 -= width;
          this.doc.selection.boxSelectionX1 -= width;
          this.doc.selection.insertBars();
        } else {
          this.doc.selection.insertBars();
        }
        event.preventDefault();
        break;
      case 8: // backspace/delete
        this.doc.synth.loopBarStart = -1;
        this.doc.synth.loopBarEnd = -1;
        this._loopEditor.setLoopAt(
          this.doc.synth.loopBarStart,
          this.doc.synth.loopBarEnd
        );

        if (event.ctrlKey || event.metaKey) {
          this.doc.record(new ChangeRemoveChannel(this.doc, this.doc.channel));
        } else {
          this.doc.selection.deleteBars();
          this.doc.notifier.changed();
        }
        this._barScrollBar.animatePlayhead();
        event.preventDefault();
        break;
      case 84: // t
        // Plain T: tag selected channels
        if (
          !event.ctrlKey &&
          !event.metaKey &&
          this.doc.selection.boxSelectionActive
        ) {
          this.doc.selection.createChannelTag();
          event.preventDefault();
        }
        break;
      case 65: // a
        if (canPlayNotes) break;
        if (event.shiftKey) {
          this.doc.selection.selectChannel();
        } else {
          this.doc.selection.selectAll();
        }
        event.preventDefault();
        break;
      case 68: // d
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          //shift d replaces old d functionality, while d will duplicate replacing an unused pattern
          //This is for consistency with n (n uses ctrl instead of shift, but this will have to do for now)
          this.doc.selection.duplicatePatterns(event.shiftKey ? false : true);
          event.preventDefault();
        }
        break;
      case 69: // e (+shift: eq filter settings)
        if (canPlayNotes) break;
        if (event.shiftKey) {
          const instrument: Instrument =
            this.doc.song.channels[this.doc.channel].instruments[
              this.doc.getCurrentInstrument()
            ];
          if (
            !instrument.eqFilterType &&
            this.doc.channel <
              this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
          )
            this._openPrompt("customEQFilterSettings");
        } else if (event.altKey) {
          //open / close all envelope dropdowns
          const instrument: Instrument =
            this.doc.song.channels[this.doc.channel].instruments[
              this.doc.getCurrentInstrument()
            ];
          const isAllOpen: boolean =
            this.envelopeEditor.openExtraSettingsDropdowns.every((x) => {
              return x == true;
            });
          for (let i = 0; i < instrument.envelopeCount; i++) {
            if (isAllOpen)
              this.envelopeEditor.openExtraSettingsDropdowns[i] = false;
            else this.envelopeEditor.openExtraSettingsDropdowns[i] = true;
          }
          this.envelopeEditor.rerenderExtraSettings();
          event.preventDefault();
        } else if (event.ctrlKey) {
          // EUCLEDIAN RHYTHM SHORTCUT (E)
          this._openPrompt("generateEuclideanRhythm");
          event.preventDefault();
          break;
        } else if (
          needControlForShortcuts == (event.ctrlKey || event.metaKey)
        ) {
          this._openPrompt("customSongEQFilterSettings");
        }
        break;
      case 70: // f
        if (canPlayNotes) break;
        if (event.shiftKey) {
          // if shift+f, move to start of loop bar instead

          this.doc.synth.loopBarStart = -1;
          this.doc.synth.loopBarEnd = -1;
          this._loopEditor.setLoopAt(
            this.doc.synth.loopBarStart,
            this.doc.synth.loopBarEnd
          );

          this.doc.synth.goToBar(this.doc.song.loopStart);
          this.doc.synth.snapToBar();
          this.doc.synth.initModFilters(this.doc.song);
          this.doc.synth.computeLatestModValues();
          if (this.doc.prefs.autoFollow) {
            this.doc.selection.setChannelBar(
              this.doc.channel,
              Math.floor(this.doc.synth.playhead)
            );
          }
          event.preventDefault();
        } else if (event.altKey) {
          //open / close all fm dropdowns
          const instrument: Instrument =
            this.doc.song.channels[this.doc.channel].instruments[
              this.doc.getCurrentInstrument()
            ];
          const operatorCount: number =
            instrument.type == InstrumentType.fm ? 4 : 6;
          let isAllOpen: boolean = true;
          for (let i = 0; i < operatorCount; i++) {
            if (!this._openOperatorDropdowns[i]) isAllOpen = false;
          }
          for (let i = 0; i < operatorCount; i++) {
            if (
              (this._openOperatorDropdowns[i] == false && !isAllOpen) ||
              isAllOpen
            )
              this._toggleDropdownMenu(DropdownID.FM, i);
          }
          event.preventDefault();
        } else if (
          needControlForShortcuts == (event.ctrlKey || event.metaKey)
        ) {
          this.doc.synth.loopBarStart = -1;
          this.doc.synth.loopBarEnd = -1;
          this._loopEditor.setLoopAt(
            this.doc.synth.loopBarStart,
            this.doc.synth.loopBarEnd
          );

          this.doc.synth.snapToStart();
          this.doc.synth.initModFilters(this.doc.song);
          this.doc.synth.computeLatestModValues();
          if (this.doc.prefs.autoFollow) {
            this.doc.selection.setChannelBar(
              this.doc.channel,
              Math.floor(this.doc.synth.playhead)
            );
          }
          event.preventDefault();
        }
        break;
      case 72: // h
        if (canPlayNotes) break;

        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          this.doc.synth.goToBar(this.doc.bar);
          this.doc.synth.snapToBar();
          this.doc.synth.initModFilters(this.doc.song);
          this.doc.synth.computeLatestModValues();

          if (
            Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
            Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
          ) {
            this.doc.synth.loopBarStart = -1;
            this.doc.synth.loopBarEnd = -1;
            this._loopEditor.setLoopAt(
              this.doc.synth.loopBarStart,
              this.doc.synth.loopBarEnd
            );
          }

          if (this.doc.prefs.autoFollow) {
            this.doc.selection.setChannelBar(
              this.doc.channel,
              Math.floor(this.doc.synth.playhead)
            );
          }
          event.preventDefault();
        }
        break;
      case 74: // j
        if (canPlayNotes) break;
        // Ctrl Alt Shift J: Jummbify - set all prefs to my preferred ones lol
        if (event.shiftKey && event.ctrlKey && event.altKey) {
          this.doc.prefs.autoPlay = false;
          this.doc.prefs.autoFollow = false;
          this.doc.prefs.enableNotePreview = true;
          this.doc.prefs.showFifth = true;
          this.doc.prefs.notesOutsideScale = false;
          this.doc.prefs.defaultScale = 0;
          this.doc.prefs.showLetters = true;
          this.doc.prefs.showChannels = true;
          this.doc.prefs.showScrollBar = true;
          this.doc.prefs.alwaysFineNoteVol = false;
          this.doc.prefs.enableChannelMuting = true;
          this.doc.prefs.displayBrowserUrl = true;
          this.doc.prefs.displayVolumeBar = true;
          this.doc.prefs.layout = "wide";
          this.doc.prefs.visibleOctaves = 5;
          this.doc.prefs.save();
          event.preventDefault();
          location.reload();
        }
        break;
      case 76: // l
        if (canPlayNotes) break;
        if (event.shiftKey) {
          this._openPrompt("limiterSettings");
        } else {
          this._openPrompt("barCount");
        }
        break;
      case 77: // m
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          if (this.doc.prefs.enableChannelMuting) {
            this.doc.selection.muteChannels(event.shiftKey);
            event.preventDefault();
          }
        }
        break;
      case 78: // n
        if (canPlayNotes) break;
        // Find lowest-index unused pattern for current channel
        // Ctrl+n - lowest-index completely empty pattern
        // Shift+n - note filter settings

        const group: ChangeGroup = new ChangeGroup();

        if (event.shiftKey) {
          const instrument: Instrument =
            this.doc.song.channels[this.doc.channel].instruments[
              this.doc.getCurrentInstrument()
            ];
          if (
            effectsIncludeNoteFilter(instrument.effects) &&
            !instrument.noteFilterType &&
            this.doc.channel <
              this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
          )
            this._openPrompt("customNoteFilterSettings");
          break;
        } else if (event.ctrlKey) {
          let nextEmpty: number = 0;
          while (
            nextEmpty < this.doc.song.patternsPerChannel &&
            this.doc.song.channels[this.doc.channel].patterns[nextEmpty].notes
              .length > 0
          )
            nextEmpty++;

          nextEmpty++; // The next empty pattern is actually the one after the found one

          // Can't set anything if we're at the absolute limit.
          if (nextEmpty <= Config.barCountMax) {
            if (nextEmpty > this.doc.song.patternsPerChannel) {
              // Add extra empty pattern, if all the rest have something in them.
              group.append(new ChangePatternsPerChannel(this.doc, nextEmpty));
            }

            // Change pattern number to lowest-index unused
            group.append(
              new ChangePatternNumbers(
                this.doc,
                nextEmpty,
                this.doc.bar,
                this.doc.channel,
                1,
                1
              )
            );

            // Auto set the used instruments to the ones you were most recently viewing.
            if (
              this.doc.channel >=
              this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
            ) {
              this.doc.viewedInstrument[this.doc.channel] =
                this.doc.recentPatternInstruments[this.doc.channel][0];
            }
            group.append(
              new ChangeSetPatternInstruments(
                this.doc,
                this.doc.channel,
                this.doc.recentPatternInstruments[this.doc.channel],
                this.doc.song.channels[this.doc.channel].patterns[nextEmpty - 1]
              )
            );
          }
        } else {
          let nextUnused: number = 1;
          while (
            this.doc.song.channels[this.doc.channel].bars.indexOf(nextUnused) !=
              -1 &&
            nextUnused <= this.doc.song.patternsPerChannel
          )
            nextUnused++;

          // Can't set anything if we're at the absolute limit.
          if (nextUnused <= Config.barCountMax) {
            if (nextUnused > this.doc.song.patternsPerChannel) {
              // Add extra empty pattern, if all the rest are used.
              group.append(new ChangePatternsPerChannel(this.doc, nextUnused));
            }

            // Change pattern number to lowest-index unused
            group.append(
              new ChangePatternNumbers(
                this.doc,
                nextUnused,
                this.doc.bar,
                this.doc.channel,
                1,
                1
              )
            );

            // Auto set the used instruments to the ones you were most recently viewing.
            if (
              this.doc.channel >=
              this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
            ) {
              this.doc.viewedInstrument[this.doc.channel] =
                this.doc.recentPatternInstruments[this.doc.channel][0];
            }
            group.append(
              new ChangeSetPatternInstruments(
                this.doc,
                this.doc.channel,
                this.doc.recentPatternInstruments[this.doc.channel],
                this.doc.song.channels[this.doc.channel].patterns[
                  nextUnused - 1
                ]
              )
            );
          }
        }

        this.doc.record(group);

        event.preventDefault();
        break;
      case 81: // q
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          if (event.shiftKey) {
            this._openPrompt("addExternal");
            event.preventDefault();
            break;
          } else {
            this._openPrompt("channelSettings");
            event.preventDefault();
            break;
          }
        }
        break;
      case 83: // s
        if (canPlayNotes) break;
        if (event.shiftKey && event.ctrlKey && event.altKey) {
          // Ctrl Alt Shift S: Slarmooify - set all prefs to my preferred ones lol
          this.doc.prefs.autoPlay = false;
          this.doc.prefs.autoFollow = true;
          this.doc.prefs.enableNotePreview = true;
          this.doc.prefs.showFifth = true;
          this.doc.prefs.notesOutsideScale = false;
          this.doc.prefs.defaultScale = 0;
          this.doc.prefs.showLetters = true;
          this.doc.prefs.showChannels = true;
          this.doc.prefs.showScrollBar = true;
          this.doc.prefs.alwaysFineNoteVol = false;
          this.doc.prefs.enableChannelMuting = true;
          this.doc.prefs.displayBrowserUrl = true;
          this.doc.prefs.displayVolumeBar = true;
          this.doc.prefs.layout = "tall";
          this.doc.prefs.visibleOctaves = 5;
          this.doc.prefs.closePromptByClickoff = false;
          this.doc.prefs.colorTheme = "slarmoosbox";
          this.doc.prefs.frostedGlassBackground = false;
          this.doc.prefs.instrumentButtonsAtTop = true;
          this.doc.prefs.instrumentCopyPaste = true;
          this.doc.prefs.instrumentImportExport = true;
          this.doc.prefs.notesFlashWhenPlayed = true;
          this.doc.prefs.showOscilloscope = true;
          this.doc.prefs.save();
          event.preventDefault();
          location.reload();
        } else if (event.ctrlKey || event.metaKey) {
          this._openPrompt("export");
          event.preventDefault();
        } else if (this.doc.prefs.enableChannelMuting) {
          // JummBox deviation: I like shift+s as just another mute toggle personally.
          // Easier to reach than M and the shift+s invert functionality I am overwriting could be
          // obtained with M anyway. Useability-wise you very often want to 'add' channels on to a solo as you work.
          if (event.shiftKey) {
            this.doc.selection.muteChannels(false);
          } else {
            this.doc.selection.soloChannels(false);
          }
          event.preventDefault();
        }
        break;
      case 79: // o
        if (canPlayNotes) break;
        if (event.ctrlKey || event.metaKey) {
          this._openPrompt("import");
          event.preventDefault();
        }
        break;
      case 86: // v
        if (canPlayNotes) break;
        if (
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          !needControlForShortcuts
        ) {
          this.doc.selection.pasteNumbers();
        } else if (event.shiftKey) {
          this._pasteInstrument();
        } else {
          this.doc.selection.pasteNotes();
        }
        event.preventDefault();
        break;
      case 87: // w
        if (canPlayNotes) break;
        this._openPrompt("moveNotesSideways");
        break;
      case 73: // i
        if (canPlayNotes) break;
        if (
          needControlForShortcuts == (event.ctrlKey || event.metaKey) &&
          event.shiftKey
        ) {
          // Copy the current instrument as a preset to the clipboard.
          const instrument: Instrument =
            this.doc.song.channels[this.doc.channel].instruments[
              this.doc.getCurrentInstrument()
            ];
          const instrumentObject: any = instrument.toJsonObject();
          delete instrumentObject["preset"];
          // Volume and the panning effect are not included in presets.
          delete instrumentObject["volume"];
          delete instrumentObject["pan"];
          const panningEffectIndex: number = instrumentObject[
            "effects"
          ].indexOf(Config.effectNames[EffectType.panning]);
          if (panningEffectIndex != -1)
            instrumentObject["effects"].splice(panningEffectIndex, 1);
          for (
            let i: number = 0;
            i < instrumentObject["envelopes"].length;
            i++
          ) {
            const envelope: any = instrumentObject["envelopes"][i];
            // If there are any envelopes targeting panning or none, remove those too.
            if (
              envelope["target"] == "panning" ||
              envelope["target"] == "none" ||
              envelope["envelope"] == "none"
            ) {
              instrumentObject["envelopes"].splice(i, 1);
              i--;
            }
          }
          this._copyTextToClipboard(JSON.stringify(instrumentObject));
          event.preventDefault();
        }
        break;
      case 82: // r
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          if (event.shiftKey) {
            this._randomGenerated(false);
          } else if (event.altKey) {
            this._randomGenerated(true);
          } else {
            this._randomPreset();
          }
          event.preventDefault();
        }
        break;
      case 219: // left brace
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          this.doc.synth.goToPrevBar();
          this.doc.synth.initModFilters(this.doc.song);
          this.doc.synth.computeLatestModValues();
          if (
            Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
            Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
          ) {
            this.doc.synth.loopBarStart = -1;
            this.doc.synth.loopBarEnd = -1;
            this._loopEditor.setLoopAt(
              this.doc.synth.loopBarStart,
              this.doc.synth.loopBarEnd
            );
          }

          if (this.doc.prefs.autoFollow) {
            this.doc.selection.setChannelBar(
              this.doc.channel,
              Math.floor(this.doc.synth.playhead)
            );
          }
          event.preventDefault();
        }
        break;
      case 221: // right brace
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          this.doc.synth.goToNextBar();
          this.doc.synth.initModFilters(this.doc.song);
          this.doc.synth.computeLatestModValues();
          if (
            Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
            Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
          ) {
            this.doc.synth.loopBarStart = -1;
            this.doc.synth.loopBarEnd = -1;
            this._loopEditor.setLoopAt(
              this.doc.synth.loopBarStart,
              this.doc.synth.loopBarEnd
            );
          }

          if (this.doc.prefs.autoFollow) {
            this.doc.selection.setChannelBar(
              this.doc.channel,
              Math.floor(this.doc.synth.playhead)
            );
          }
          event.preventDefault();
        }
        break;
      case 189: // -
      case 173: // Firefox -
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          this.doc.selection.transpose(false, event.shiftKey);
          event.preventDefault();
        }
        break;
      case 187: // +
      case 61: // Firefox +
      case 171: // Some users have this as +? Hmm.
        if (canPlayNotes) break;
        if (needControlForShortcuts == (event.ctrlKey || event.metaKey)) {
          this.doc.selection.transpose(true, event.shiftKey);
          event.preventDefault();
        }
        break;
      case 38: // Up
        if (event.ctrlKey || event.metaKey) {
          const ch = this.doc.channel;
          const tags = this.doc.song.channelTags;

          // 1) Outermost tag ending at ch-1 → expand downward (favor larger spans, tie=older)
          // 1) Innermost tag starting at ch → shrink upward (or delete if single-channel)
          const startTags = tags.filter((t) => t.startChannel === ch);
          if (startTags.length > 0) {
            const inner = startTags.reduce(
              (best: ChannelTag, t: ChannelTag) => {
                const spanBest = best.endChannel - best.startChannel;
                const spanT = t.endChannel - t.startChannel;
                if (spanT < spanBest) return t; // smaller=inner
                if (spanT > spanBest) return best;
                // tie: pick newer
                return tags.indexOf(t) > tags.indexOf(best) ? t : best;
              },
              startTags[0]
            );
            if (inner.startChannel === inner.endChannel) {
              this.doc.record(new ChangeRemoveChannelTag(this.doc, inner.id));
            } else {
              this.doc.record(
                new ChangeChannelTagRange(
                  this.doc,
                  inner.id,
                  ch + 1,
                  inner.endChannel
                )
              );
            }
          }
          // 2) Outermost tag ending at ch-1 → expand downward
          else {
            const endTags = tags.filter((t) => t.endChannel === ch - 1);
            if (endTags.length > 0) {
              const outer = endTags.reduce(
                (best: ChannelTag, t: ChannelTag) => {
                  const spanBest = best.endChannel - best.startChannel;
                  const spanT = t.endChannel - t.startChannel;
                  if (spanT > spanBest) return t; // larger=outer
                  if (spanT < spanBest) return best;
                  // tie: pick older
                  return tags.indexOf(t) < tags.indexOf(best) ? t : best;
                },
                endTags[0]
              );
              this.doc.record(
                new ChangeChannelTagRange(
                  this.doc,
                  outer.id,
                  outer.startChannel,
                  ch
                )
              );
            }
            // 3) Otherwise normal swap up
            else if (ch > 0) {
              this.doc.record(new ChangeChannelOrder(this.doc, ch, ch, -1));
              this.doc.song.updateDefaultChannelNames();
              this.doc.selection.setChannelBar(ch - 1, this.doc.bar);
              this.doc.recalcChannelNames = true;
              this.doc.notifier.changed();
            }
          }
        } else if (event.shiftKey) {
          this.doc.selection.boxSelectionY1 = Math.max(
            0,
            this.doc.selection.boxSelectionY1 - 1
          );
          this.doc.selection.scrollToEndOfSelection();
          this.doc.selection.selectionUpdated();
        } else {
          this.doc.selection.setChannelBar(
            (this.doc.channel - 1 + this.doc.song.getChannelCount()) %
              this.doc.song.getChannelCount(),
            this.doc.bar
          );
          this.doc.selection.resetBoxSelection();
          //envelopes aren't rerendering when channels are changed so...
          this.envelopeEditor.rerenderExtraSettings();
        }
        event.preventDefault();
        break;
      case 40: // down
        if (event.ctrlKey || event.metaKey) {
          const ch = this.doc.channel;
          const tags = this.doc.song.channelTags;
          // 1) Innermost tag ending at ch → shrink upward (or delete if single-channel)
          const endTagsDown = tags.filter((t) => t.endChannel === ch);
          if (endTagsDown.length > 0) {
            const inner = endTagsDown.reduce(
              (best: ChannelTag, t: ChannelTag) => {
                const spanBest = best.endChannel - best.startChannel;
                const spanT = t.endChannel - t.startChannel;
                if (spanT < spanBest) return t; // smaller=inner
                if (spanT > spanBest) return best;
                // tie: pick newer
                return tags.indexOf(t) > tags.indexOf(best) ? t : best;
              },
              endTagsDown[0]
            );
            if (inner.startChannel === inner.endChannel) {
              this.doc.record(new ChangeRemoveChannelTag(this.doc, inner.id));
            } else {
              this.doc.record(
                new ChangeChannelTagRange(
                  this.doc,
                  inner.id,
                  inner.startChannel,
                  ch - 1
                )
              );
            }
          } else {
            // 2) Innermost tag starting at ch+1 → expand its start downward (favor larger spans, tie=older)
            const startTagsDown = tags.filter((t) => t.startChannel === ch + 1);
            if (startTagsDown.length > 0) {
              const outer = startTagsDown.reduce(
                (best: ChannelTag, t: ChannelTag) => {
                  const spanBest = best.endChannel - best.startChannel;
                  const spanT = t.endChannel - t.startChannel;
                  if (spanT > spanBest) return t; // larger=outer
                  if (spanT < spanBest) return best;
                  // tie: pick older
                  return tags.indexOf(t) < tags.indexOf(best) ? t : best;
                },
                startTagsDown[0]
              );
              this.doc.record(
                new ChangeChannelTagRange(
                  this.doc,
                  outer.id,
                  ch,
                  outer.endChannel
                )
              );
            }
            // 3) Otherwise normal swap down
            else if (ch < this.doc.song.getChannelCount() - 1) {
              this.doc.record(new ChangeChannelOrder(this.doc, ch, ch, 1));
              this.doc.song.updateDefaultChannelNames();
              this.doc.selection.setChannelBar(ch + 1, this.doc.bar);
              this.doc.recalcChannelNames = true;
              this.doc.notifier.changed();
            }
          }
        } else if (event.shiftKey) {
          this.doc.selection.boxSelectionY1 = Math.min(
            this.doc.song.getChannelCount() - 1,
            this.doc.selection.boxSelectionY1 + 1
          );
          this.doc.selection.scrollToEndOfSelection();
          this.doc.selection.selectionUpdated();
        } else {
          this.doc.selection.setChannelBar(
            (this.doc.channel + 1) % this.doc.song.getChannelCount(),
            this.doc.bar
          );
          this.doc.selection.resetBoxSelection();
          this.envelopeEditor.rerenderExtraSettings();
        }
        event.preventDefault();
        break;
      case 37: // left
        if (event.shiftKey) {
          this.doc.selection.boxSelectionX1 = Math.max(
            0,
            this.doc.selection.boxSelectionX1 - 1
          );
          this.doc.selection.scrollToEndOfSelection();
          this.doc.selection.selectionUpdated();
        } else {
          this.doc.selection.setChannelBar(
            this.doc.channel,
            (this.doc.bar + this.doc.song.barCount - 1) % this.doc.song.barCount
          );
          this.doc.selection.resetBoxSelection();
        }
        event.preventDefault();
        break;
      case 39: // right
        if (event.shiftKey) {
          this.doc.selection.boxSelectionX1 = Math.min(
            this.doc.song.barCount - 1,
            this.doc.selection.boxSelectionX1 + 1
          );
          this.doc.selection.scrollToEndOfSelection();
          this.doc.selection.selectionUpdated();
        } else {
          this.doc.selection.setChannelBar(
            this.doc.channel,
            (this.doc.bar + 1) % this.doc.song.barCount
          );
          this.doc.selection.resetBoxSelection();
        }
        event.preventDefault();
        break;
      case 46: // Delete
        this.doc.selection.digits = "";
        this.doc.selection.nextDigit("0", false, false);
        break;
      case 48: // 0
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "0",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 49: // 1
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "1",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 50: // 2
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "2",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 51: // 3
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "3",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 52: // 4
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "4",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 53: // 5
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "5",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 54: // 6
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "6",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 55: // 7
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "7",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 56: // 8
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "8",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      case 57: // 9
        if (canPlayNotes) break;
        this.doc.selection.nextDigit(
          "9",
          needControlForShortcuts !=
            (event.shiftKey || event.ctrlKey || event.metaKey),
          event.altKey
        );
        this._renderInstrumentBar(
          this.doc.song.channels[this.doc.channel],
          this.doc.getCurrentInstrument(),
          ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
        );
        event.preventDefault();
        break;
      default:
        this.doc.selection.digits = "";
        this.doc.selection.instrumentDigits = "";
        break;
    }

    if (canPlayNotes) {
      this.doc.selection.digits = "";
      this.doc.selection.instrumentDigits = "";
    }
  };

  private _whenKeyReleased = (event: KeyboardEvent): void => {
    this._muteEditor.onKeyUp(event);
    if (!event.ctrlKey) {
      // Ctrl
      this._patternEditor.controlMode = false;
    }
    if (!event.shiftKey) {
      // Shift
      this._patternEditor.shiftMode = false;
    }

    this._ctrlHeld = event.ctrlKey;
    this._shiftHeld = event.shiftKey;
    // Release live pitches regardless of control or caps lock so that any pitches played before will get released even if the modifier keys changed.
    this._keyboardLayout.handleKeyEvent(event, false);
  };

  private _copyTextToClipboard(text: string): void {
    // Set as any to allow compilation without clipboard types (since, uh, I didn't write this bit and don't know the proper types library) -jummbus
    let nav: any;
    nav = navigator;

    if (nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(text).catch(() => {
        window.prompt("Copy to clipboard:", text);
      });
      return;
    }
    const textField: HTMLTextAreaElement = document.createElement("textarea");
    textField.textContent = text;
    document.body.appendChild(textField);
    textField.select();
    const succeeded: boolean = document.execCommand("copy");
    textField.remove();
    this.refocusStage();
    if (!succeeded) window.prompt("Copy this:", text);
  }

  private _whenPrevBarPressed = (): void => {
    this.doc.synth.goToPrevBar();
    if (
      Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
      Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
    ) {
      this.doc.synth.loopBarStart = -1;
      this.doc.synth.loopBarEnd = -1;
      this._loopEditor.setLoopAt(
        this.doc.synth.loopBarStart,
        this.doc.synth.loopBarEnd
      );
    }
    this._barScrollBar.animatePlayhead();
  };

  private _whenNextBarPressed = (): void => {
    this.doc.synth.goToNextBar();
    if (
      Math.floor(this.doc.synth.playhead) < this.doc.synth.loopBarStart ||
      Math.floor(this.doc.synth.playhead) > this.doc.synth.loopBarEnd
    ) {
      this.doc.synth.loopBarStart = -1;
      this.doc.synth.loopBarEnd = -1;
      this._loopEditor.setLoopAt(
        this.doc.synth.loopBarStart,
        this.doc.synth.loopBarEnd
      );
    }
    this._barScrollBar.animatePlayhead();
  };

  public togglePlay = (): void => {
    if (this.doc.synth.playing) {
      this.doc.performance.pause();
      this.outVolumeHistoricCap = 0;
    } else {
      this.doc.synth.snapToBar();
      this.doc.performance.play();
    }
  };

  private _toggleRecord = (): void => {
    if (this.doc.synth.playing) {
      this.doc.performance.pause();
    } else {
      this.doc.performance.record();
    }
  };

  public _animate = (): void => {
    // Need to update mods once more to clear the slider display
    this._modSliderUpdate();
    // Same for volume display
    if (this.doc.prefs.displayVolumeBar) {
      this._volumeUpdate();
    }
    // ...and barscrollbar playhead
    this._barScrollBar.animatePlayhead();
    // ...and filters
    if (
      this.doc.synth.isFilterModActive(
        false,
        this.doc.channel,
        this.doc.getCurrentInstrument()
      )
    ) {
      this._eqFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    }
    if (
      this.doc.synth.isFilterModActive(
        true,
        this.doc.channel,
        this.doc.getCurrentInstrument()
      )
    ) {
      this._noteFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    }
    if (this.doc.synth.isFilterModActive(false, 0, 0, true)) {
      this._songEqFilterEditor.render(true, this._ctrlHeld || this._shiftHeld);
    }

    window.requestAnimationFrame(this._animate);
  };

  public _volumeUpdate = (): void => {
    this.outVolumeHistoricTimer--;
    if (this.outVolumeHistoricTimer <= 0) {
      this.outVolumeHistoricCap -= 0.03;
    }
    if (this.doc.song.outVolumeCap > this.outVolumeHistoricCap) {
      this.outVolumeHistoricCap = this.doc.song.outVolumeCap;
      this.outVolumeHistoricTimer = 50;
    }

    if (this.doc.song.outVolumeCap != this.lastOutVolumeCap) {
      this.lastOutVolumeCap = this.doc.song.outVolumeCap;
      this._animateVolume(
        this.doc.song.outVolumeCap,
        this.outVolumeHistoricCap
      );
    }
  };

  private _animateVolume(outVolumeCap: number, historicOutCap: number): void {
    this._outVolumeBar.setAttribute(
      "width",
      "" + Math.min(144, outVolumeCap * 144)
    );
    this._outVolumeCap.setAttribute(
      "x",
      "" + (8 + Math.min(144, historicOutCap * 144))
    );
  }

  private _setVolumeSlider = (): void => {
    // Song volume slider doesn't use a change, but it can still be modulated.
    if ((this._ctrlHeld || this._shiftHeld) && this.doc.synth.playing) {
      const prevVol = this.doc.prefs.volume;
      // The slider only goes to 75, but the mod is 0-100 and in this instance we're using the value for a mod set.
      this.doc.prefs.volume = Math.round(
        (Number(this._volumeSlider.input.value) * 4) / 3
      );
      const changedPatterns = this._patternEditor.setModSettingsForChange(
        null,
        this
      );
      const useVol: number = this.doc.prefs.volume;
      window.clearTimeout(this._modRecTimeout);
      this._modRecTimeout = window.setTimeout(() => {
        this._recordVolumeSlider(useVol);
      }, 10);
      this.doc.recordingModulators = true;

      this.doc.prefs.volume = prevVol;
      this._volumeSlider.updateValue(this.doc.prefs.volume);

      if (changedPatterns) this._trackEditor.render();
    } else {
      this.doc.setVolume(Number(this._volumeSlider.input.value));
      if (this.doc.recordingModulators) {
        this.doc.recordingModulators = false;
        // A dummy change that pushes history state.
        this.doc.record(
          new ChangeHoldingModRecording(this.doc, null, null, null)
        );
      }
    }
  };

  private _recordVolumeSlider(useVol: number): void {
    // Song volume slider doesn't use a change, but it can still be modulated.
    if ((this._ctrlHeld || this._shiftHeld) && this.doc.synth.playing) {
      const prevVol = this.doc.prefs.volume;
      // The slider only goes to 75, but the mod is 0-100 and in this instance we're using the value for a mod set.
      this.doc.prefs.volume = useVol;
      this._patternEditor.setModSettingsForChange(null, this);
      window.clearTimeout(this._modRecTimeout);
      this._modRecTimeout = window.setTimeout(() => {
        this._recordVolumeSlider(useVol);
      }, 10);
      this.doc.recordingModulators = true;

      this.doc.prefs.volume = prevVol;
      this._volumeSlider.updateValue(this.doc.prefs.volume);
    } else {
      this.doc.setVolume(Number(this._volumeSlider.input.value));
      if (this.doc.recordingModulators) {
        this.doc.recordingModulators = false;
        // A dummy change that pushes history state.
        this.doc.record(
          new ChangeHoldingModRecording(this.doc, null, null, null)
        );
      }
    }
  }

  private _copyInstrument = (): void => {
    const channel: Channel = this.doc.song.channels[this.doc.channel];
    const instrument: Instrument =
      channel.instruments[this.doc.getCurrentInstrument()];
    const instrumentCopy: any = instrument.toJsonObject();
    instrumentCopy["isDrum"] = this.doc.song.getChannelIsNoise(
      this.doc.channel
    );
    instrumentCopy["isMod"] = this.doc.song.getChannelIsMod(this.doc.channel);
    window.localStorage.setItem(
      "instrumentCopy",
      JSON.stringify(instrumentCopy)
    );
    this.refocusStage();
  };

  private _pasteInstrument = (): void => {
    const channel: Channel = this.doc.song.channels[this.doc.channel];
    const instrument: Instrument =
      channel.instruments[this.doc.getCurrentInstrument()];
    const instrumentCopy: any = JSON.parse(
      String(window.localStorage.getItem("instrumentCopy"))
    );
    if (
      instrumentCopy != null &&
      instrumentCopy["isDrum"] ==
        this.doc.song.getChannelIsNoise(this.doc.channel) &&
      instrumentCopy["isMod"] == this.doc.song.getChannelIsMod(this.doc.channel)
    ) {
      this.doc.record(
        new ChangePasteInstrument(this.doc, instrument, instrumentCopy)
      );
    }
    this.refocusStage();
  };

  private _exportInstruments = (): void => {
    this._openPrompt("exportInstrument");
  };

  private _importInstruments = (): void => {
    this._openPrompt("importInstrument");
  };

  private _switchEQFilterType(toSimple: boolean) {
    const channel: Channel = this.doc.song.channels[this.doc.channel];
    const instrument: Instrument =
      channel.instruments[this.doc.getCurrentInstrument()];
    if (instrument.eqFilterType != toSimple) {
      this.doc.record(new ChangeEQFilterType(this.doc, instrument, toSimple));
    }
  }

  private _switchNoteFilterType(toSimple: boolean) {
    const channel: Channel = this.doc.song.channels[this.doc.channel];
    const instrument: Instrument =
      channel.instruments[this.doc.getCurrentInstrument()];
    if (instrument.noteFilterType != toSimple) {
      this.doc.record(new ChangeNoteFilterType(this.doc, instrument, toSimple));
    }
  }

  private _randomPreset(): void {
    const isNoise: boolean = this.doc.song.getChannelIsNoise(this.doc.channel);
    this.doc.record(new ChangePreset(this.doc, pickRandomPresetValue(isNoise)));
  }

  private _randomGenerated(usesCurrentInstrumentType: boolean): void {
    this.doc.record(
      new ChangeRandomGeneratedInstrument(this.doc, usesCurrentInstrumentType)
    );
  }

  private _whenSetTempo = (): void => {
    this.doc.record(
      new ChangeTempo(this.doc, -1, parseInt(this._tempoStepper.value) | 0)
    );
  };

  private _whenSetOctave = (): void => {
    this.doc.record(
      new ChangeKeyOctave(
        this.doc,
        this.doc.song.octave,
        parseInt(this._octaveStepper.value) | 0
      )
    );
    this._piano.forceRender();
  };

  private _whenSetScale = (): void => {
    if (isNaN(<number>(<unknown>this._scaleSelect.value))) {
      switch (this._scaleSelect.value) {
        case "forceScale":
          this.doc.selection.forceScale();
          break;
        case "customize":
          this._openPrompt("customScale");
          break;
      }
      this.doc.notifier.changed();
    } else {
      this.doc.record(
        new ChangeScale(this.doc, this._scaleSelect.selectedIndex)
      );
    }
  };

  private _whenSetKey = (): void => {
    if (isNaN(<number>(<unknown>this._keySelect.value))) {
      switch (this._keySelect.value) {
        case "detectKey":
          this.doc.record(new ChangeDetectKey(this.doc));
          break;
      }
      this.doc.notifier.changed();
    } else {
      this.doc.record(
        new ChangeKey(
          this.doc,
          Config.keys.length - 1 - this._keySelect.selectedIndex
        )
      );
    }
  };

  private _whenSetRhythm = (): void => {
    if (isNaN(<number>(<unknown>this._rhythmSelect.value))) {
      switch (this._rhythmSelect.value) {
        case "forceRhythm":
          this.doc.selection.forceRhythm();
          break;
      }
      this.doc.notifier.changed();
    } else {
      this.doc.record(
        new ChangeRhythm(this.doc, this._rhythmSelect.selectedIndex)
      );
    }
  };

  public _refocus = (): void => {
    // Waits a bit because select2 "steals" back focus even after the close event fires.
    var selfRef = this;
    setTimeout(function () {
      selfRef.mainLayer.focus();
    }, 20);
  };

  public _whenSetPitchedPreset = (): void => {
    this._setPreset($("#pitchPresetSelect").val() + "");
  };

  public _whenSetDrumPreset = (): void => {
    this._setPreset($("#drumPresetSelect").val() + "");
  };

  private _setPreset(preset: string): void {
    if (isNaN(<number>(<unknown>preset))) {
      switch (preset) {
        case "copyInstrument":
          this._copyInstrument();
          break;
        case "pasteInstrument":
          this._pasteInstrument();
          break;
        case "randomPreset":
          this._randomPreset();
          break;
        case "randomGenerated":
          this._randomGenerated(false);
          break;
      }
      this.doc.notifier.changed();
    } else {
      this.doc.record(new ChangePreset(this.doc, parseInt(preset)));
    }
  }

  private _whenSetFeedbackType = (): void => {
    this.doc.record(
      new ChangeFeedbackType(this.doc, this._feedbackTypeSelect.selectedIndex)
    );
  };

  private _whenSetAlgorithm = (): void => {
    this.doc.record(
      new ChangeAlgorithm(this.doc, this._algorithmSelect.selectedIndex)
    );
  };

  private _whenSet6OpFeedbackType = (): void => {
    this.doc.record(
      new Change6OpFeedbackType(
        this.doc,
        this._feedback6OpTypeSelect.selectedIndex
      )
    );
    this._customAlgorithmCanvas.reset();
  };
  private _whenSet6OpAlgorithm = (): void => {
    this.doc.record(
      new Change6OpAlgorithm(this.doc, this._algorithm6OpSelect.selectedIndex)
    );
    this._customAlgorithmCanvas.reset();
  };

  private _whenSelectInstrument = (event: MouseEvent): void => {
    if (event.target == this._instrumentAddButton) {
      this.doc.record(new ChangeAddChannelInstrument(this.doc));
    } else if (event.target == this._instrumentRemoveButton) {
      this.doc.record(new ChangeRemoveChannelInstrument(this.doc));
    } else {
      const index: number = this._instrumentButtons.indexOf(<any>event.target);
      if (index != -1) {
        this.doc.selection.selectInstrument(index);
      }
      // Force piano to re-show, if channel is modulator
      if (
        this.doc.channel >=
        this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
      ) {
        this._piano.forceRender();
      }
      this._renderInstrumentBar(
        this.doc.song.channels[this.doc.channel],
        index,
        ColorConfig.getChannelColor(this.doc.song, this.doc.channel)
      );
    }

    this.refocusStage();
  };

  private _whenSetModChannel = (mod: number): void => {
    const selectedDropdownIndex = this._modChannelBoxes[mod].selectedIndex;
    let selectedChannelIndex = -2; // default to "none"
    if (selectedDropdownIndex == 1) {
      selectedChannelIndex = -1; // "song"
    } else if (selectedDropdownIndex > 1) {
      let playableChannelCounter = 0;
      for (let i = 0; i < this.doc.song.channels.length; i++) {
        const channel = this.doc.song.channels[i];
        if (
          channel.type === ChannelType.Pitch ||
          channel.type === ChannelType.Noise
        ) {
          if (playableChannelCounter == selectedDropdownIndex - 2) {
            selectedChannelIndex = i;
            break;
          }
          playableChannelCounter++;
        }
      }
    }

    let instrument: Instrument =
      this.doc.song.channels[this.doc.channel].instruments[
        this.doc.getCurrentInstrument()
      ];
    let previouslyUnset: boolean =
      instrument.modulators[mod] == 0 ||
      Config.modulators[instrument.modulators[mod]].forSong;

    this.doc.selection.setModChannel(mod, selectedChannelIndex + 2);

    const modChannel: number = Math.max(0, selectedChannelIndex);

    // Check if setting was 'song' or 'none' and is changing to a channel number, in which case suggested instrument to mod will auto-set to the current one.
    if (
      this.doc.song.channels[modChannel].instruments.length > 1 &&
      previouslyUnset &&
      selectedChannelIndex >= 0
    ) {
      if (this.doc.song.channels[modChannel].bars[this.doc.bar] > 0) {
        this.doc.selection.setModInstrument(
          mod,
          this.doc.song.channels[modChannel].patterns[
            this.doc.song.channels[modChannel].bars[this.doc.bar] - 1
          ].instruments[0]
        );
      }
    }

    // Force piano to re-show
    this._piano.forceRender();
  };

  private _whenSetModInstrument = (mod: number): void => {
    this.doc.selection.setModInstrument(
      mod,
      this._modInstrumentBoxes[mod].selectedIndex
    );

    // Force piano to re-show
    this._piano.forceRender();
  };

  private _whenSetModSetting = (
    mod: number,
    invalidIndex: boolean = false
  ): void => {
    let text: string = "none";
    if (this._modSetBoxes[mod].selectedIndex != -1) {
      text = this._modSetBoxes[mod].children[
        this._modSetBoxes[mod].selectedIndex
      ].textContent as string;

      if (invalidIndex) {
        // A setting is invalid (not in instrument's effects). It will be the first index. Allow it, but mark it as red.
        this._modSetBoxes[mod].selectedOptions
          .item(0)!
          .style.setProperty("color", "red");
        this._modSetBoxes[mod].classList.add("invalidSetting");
        this.doc.song.channels[this.doc.channel].instruments[
          this.doc.getCurrentInstrument()
        ].invalidModulators[mod] = true;
      } else {
        this._modSetBoxes[mod].classList.remove("invalidSetting");
        this.doc.song.channels[this.doc.channel].instruments[
          this.doc.getCurrentInstrument()
        ].invalidModulators[mod] = false;
      }
    }
    if (!invalidIndex)
      // Invalid index means a set is actually not occurring, just the same index and a warning.
      this.doc.selection.setModSetting(mod, text);

    // Force piano to re-show if channel is modulator, as text shown on it needs to update
    this._piano.forceRender();
  };

  private _whenClickModTarget = (mod: number): void => {
    if (this._modChannelBoxes[mod].selectedIndex >= 2) {
      this.doc.selection.setChannelBar(
        this._modChannelBoxes[mod].selectedIndex - 2,
        this.doc.bar
      );
    }
  };

  private _whenClickJumpToModTarget = (): void => {
    const channelIndex: number = this.doc.channel;
    const instrumentIndex: number = this.doc.getCurrentInstrument();
    if (
      channelIndex <
      this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount
    ) {
      for (
        let modChannelIdx: number =
          this.doc.song.pitchChannelCount + this.doc.song.noiseChannelCount;
        modChannelIdx < this.doc.song.channels.length;
        modChannelIdx++
      ) {
        const modChannel: Channel = this.doc.song.channels[modChannelIdx];
        const patternIdx = modChannel.bars[this.doc.bar];
        if (patternIdx > 0) {
          const modInstrumentIdx: number =
            modChannel.patterns[patternIdx - 1].instruments[0];
          const modInstrument: Instrument =
            modChannel.instruments[modInstrumentIdx];
          for (let mod: number = 0; mod < Config.modCount; mod++) {
            if (
              modInstrument.modChannels[mod] == channelIndex &&
              (modInstrument.modInstruments[mod] == instrumentIndex ||
                modInstrument.modInstruments[mod] >=
                  this.doc.song.channels[channelIndex].instruments.length)
            ) {
              this.doc.selection.setChannelBar(modChannelIdx, this.doc.bar);
              return;
            }
          }
        }
      }
    }
  };

  private _whenSetModFilter = (mod: number): void => {
    this.doc.selection.setModFilter(
      mod,
      this._modFilterBoxes[mod].selectedIndex
    );
  };

  private _whenSetModEnvelope = (mod: number): void => {
    this.doc.selection.setModEnvelope(
      mod,
      this._modEnvelopeBoxes[mod].selectedIndex
    );
  };

  private _whenSetChipWave = (): void => {
    this.doc.record(
      new ChangeChipWave(this.doc, this._chipWaveSelect.selectedIndex)
    );
  };

  private _whenSetRingModChipWave = (): void => {
    this.doc.record(
      new ChangeRingModChipWave(this.doc, this._ringModWaveSelect.selectedIndex)
    );
  };

  // advloop addition
  private _whenSetUseChipWaveAdvancedLoopControls = (): void => {
    this.doc.record(
      new ChangeChipWaveUseAdvancedLoopControls(
        this.doc,
        this._useChipWaveAdvancedLoopControlsBox.checked ? true : false
      )
    );
  };
  private _whenSetChipWaveLoopMode = (): void => {
    this.doc.record(
      new ChangeChipWaveLoopMode(
        this.doc,
        this._chipWaveLoopModeSelect.selectedIndex
      )
    );
  };
  private _whenSetChipWaveLoopStart = (): void => {
    // this._doc.record(new ChangeChipWaveLoopStart(this._doc, Math.max(0, Math.min(chipWaveLoopEnd - 1, parseInt(this._chipWaveLoopStartStepper.value)))));
    this.doc.record(
      new ChangeChipWaveLoopStart(
        this.doc,
        parseInt(this._chipWaveLoopStartStepper.value) | 0
      )
    );
  };
  private _whenSetChipWaveLoopEnd = (): void => {
    // this._doc.record(new ChangeChipWaveLoopEnd(this._doc, Math.max(0, Math.min(chipWaveLength - 1, parseInt(this._chipWaveLoopEndStepper.value)))));
    this.doc.record(
      new ChangeChipWaveLoopEnd(
        this.doc,
        parseInt(this._chipWaveLoopEndStepper.value) | 0
      )
    );
  };
  private _whenSetChipWaveLoopEndToEnd = (): void => {
    const channel = this.doc.song.channels[this.doc.channel];
    const instrument = channel.instruments[this.doc.getCurrentInstrument()];
    const chipWave = Config.rawRawChipWaves[instrument.chipWave];
    const chipWaveLength = chipWave.samples.length;
    this.doc.record(new ChangeChipWaveLoopEnd(this.doc, chipWaveLength - 1));
  };
  private _whenSetChipWaveStartOffset = (): void => {
    // this._doc.record(new ChangeChipWaveStartOffset(this._doc, Math.max(0, Math.min(chipWaveLength - 1, parseInt(this._chipWaveStartOffsetStepper.value)))));
    this.doc.record(
      new ChangeChipWaveStartOffset(
        this.doc,
        parseInt(this._chipWaveStartOffsetStepper.value) | 0
      )
    );
  };
  private _whenSetChipWavePlayBackwards = (): void => {
    this.doc.record(
      new ChangeChipWavePlayBackwards(
        this.doc,
        this._chipWavePlayBackwardsBox.checked
      )
    );
  };
  // advloop addition

  private _whenSetNoiseWave = (): void => {
    this.doc.record(
      new ChangeNoiseWave(this.doc, this._chipNoiseSelect.selectedIndex)
    );
  };

  private _whenSetTransition = (): void => {
    this.doc.record(
      new ChangeTransition(this.doc, this._transitionSelect.selectedIndex)
    );
  };
  private _whenSetDiscreteSlide = (): void => {
    this.doc.record(
      new ChangeDiscreteSlide(this.doc, this._discreteSlideSelect.selectedIndex)
    );
  };

  private _whenSetEffects = (): void => {
    const instrument: Instrument =
      this.doc.song.channels[this.doc.channel].instruments[
        this.doc.getCurrentInstrument()
      ];
    const oldValue: number = instrument.effects;
    const toggleFlag: number =
      Config.effectOrder[this._effectsSelect.selectedIndex - 1];
    this.doc.record(new ChangeToggleEffects(this.doc, toggleFlag, null));
    this._effectsSelect.selectedIndex = 0;
    if (instrument.effects > oldValue) {
      this.doc.addedEffect = true;
    }
    this.doc.notifier.changed();
  };

  private _whenSetVibrato = (): void => {
    this.doc.record(
      new ChangeVibrato(this.doc, this._vibratoSelect.selectedIndex)
    );
  };

  private _whenSetVibratoType = (): void => {
    this.doc.record(
      new ChangeVibratoType(this.doc, this._vibratoTypeSelect.selectedIndex)
    );
  };

  private _whenSetUnison = (): void => {
    this.doc.record(
      new ChangeUnison(this.doc, this._unisonSelect.selectedIndex)
    );
  };

  private _whenSetChord = (): void => {
    this.doc.record(new ChangeChord(this.doc, this._chordSelect.selectedIndex));
  };

  private _whenSetMonophonicNote = (): void => {
    this.doc.record(
      new ChangeMonophonicTone(
        this.doc,
        parseInt(this._monophonicNoteInputBox.value) - 1
      )
    );
  };

  private _addNewEnvelope = (): void => {
    this.doc.record(new ChangeAddEnvelope(this.doc));
    this.refocusStage();
    this.doc.addedEnvelope = true;
  };

  private _zoomIn = (): void => {
    this.doc.prefs.visibleOctaves = Math.max(
      1,
      this.doc.prefs.visibleOctaves - 1
    );
    this.doc.prefs.save();
    this.doc.notifier.changed();
    this.refocusStage();
  };

  private _zoomOut = (): void => {
    this.doc.prefs.visibleOctaves = Math.min(
      Config.pitchOctaves,
      this.doc.prefs.visibleOctaves + 1
    );
    this.doc.prefs.save();
    this.doc.notifier.changed();
    this.refocusStage();
  };

  private _fileMenuHandler = (event: Event): void => {
    switch (this._fileMenu.value) {
      case "new":
        this.doc.goBackToStart();
        this.doc.song.restoreLimiterDefaults();
        for (const channel of this.doc.song.channels) {
          channel.muted = false;
          channel.name = "";
        }
        this.doc.record(new ChangeSong(this.doc, ""), false, true);
        break;
      case "export":
        this._openPrompt("export");
        break;
      case "import":
        this._openPrompt("import");
        break;
      case "copyUrl":
        this._copyTextToClipboard(
          new URL("#" + this.doc.song.toBase64String(), location.href).href
        );
        break;
      case "shareUrl":
        (<any>navigator).share({
          url: new URL("#" + this.doc.song.toBase64String(), location.href)
            .href,
        });
        break;
      case "shortenUrl":
        let shortenerStrategy: string =
          "https://tinyurl.com/api-create.php?url=";
        const localShortenerStrategy: string | null =
          window.localStorage.getItem("shortenerStrategySelect");

        // if (localShortenerStrategy == "beepboxnet") shortenerStrategy = "https://www.beepbox.net/api-create.php?url=";
        if (localShortenerStrategy == "isgd")
          shortenerStrategy = "https://is.gd/create.php?format=simple&url=";

        window.open(
          shortenerStrategy +
            encodeURIComponent(
              new URL("#" + this.doc.song.toBase64String(), location.href).href
            )
        );
        break;
      case "configureShortener":
        this._openPrompt("configureShortener");
        break;
      case "viewPlayer":
        location.href =
          "player/" +
          (OFFLINE ? "index.html" : "") +
          "#song=" +
          this.doc.song.toBase64String();
        break;
      case "copyEmbed":
        this._copyTextToClipboard(
          `<iframe width="384" height="60" style="border: none;" src="${
            new URL(
              "player/#song=" + this.doc.song.toBase64String(),
              location.href
            ).href
          }"></iframe>`
        );
        break;
      case "songRecovery":
        this._openPrompt("songRecovery");
        break;
    }
    this._fileMenu.selectedIndex = 0;
  };

  private _editMenuHandler = (event: Event): void => {
    switch (this._editMenu.value) {
      case "undo":
        this.doc.undo();
        break;
      case "redo":
        this.doc.redo();
        break;
      case "copy":
        this.doc.selection.copy();
        break;
      case "insertBars":
        this.doc.selection.insertBars();
        break;
      case "deleteBars":
        this.doc.selection.deleteBars();
        break;
      case "insertChannel":
        const currentChannel = this.doc.channel;
        let type: ChannelType;
        if (this.doc.song.getChannelIsMod(currentChannel)) {
          type = ChannelType.Mod;
        } else if (this.doc.song.getChannelIsNoise(currentChannel)) {
          type = ChannelType.Noise;
        } else {
          type = ChannelType.Pitch;
        }
        this.doc.song.addChannel(type, currentChannel);
        break;
      case "deleteChannel":
        this.doc.song.removeChannel(this.doc.channel);
        break;
      case "pasteNotes":
        this.doc.selection.pasteNotes();
        break;
      case "pasteNumbers":
        this.doc.selection.pasteNumbers();
        break;
      case "transposeUp":
        this.doc.selection.transpose(true, false);
        break;
      case "transposeDown":
        this.doc.selection.transpose(false, false);
        break;
      case "selectAll":
        this.doc.selection.selectAll();
        break;
      case "selectChannel":
        this.doc.selection.selectChannel();
        break;
      case "duplicatePatterns":
        this.doc.selection.duplicatePatterns(false);
        break;
      case "barCount":
        this._openPrompt("barCount");
        break;
      case "beatsPerBar":
        this._openPrompt("beatsPerBar");
        break;
      case "moveNotesSideways":
        this._openPrompt("moveNotesSideways");
        break;
      case "channelSettings":
        this._openPrompt("channelSettings");
        break;
      case "limiterSettings":
        this._openPrompt("limiterSettings");
        break;
      case "generateEuclideanRhythm":
        this._openPrompt("generateEuclideanRhythm");
        break;
      case "addExternal":
        this._openPrompt("addExternal");
        break;
    }
    this._editMenu.selectedIndex = 0;
  };

  private _optionsMenuHandler = (event: Event): void => {
    switch (this._optionsMenu.value) {
      case "autoPlay":
        this.doc.prefs.autoPlay = !this.doc.prefs.autoPlay;
        break;
      case "autoFollow":
        this.doc.prefs.autoFollow = !this.doc.prefs.autoFollow;
        break;
      case "enableNotePreview":
        this.doc.prefs.enableNotePreview = !this.doc.prefs.enableNotePreview;
        break;
      case "showLetters":
        this.doc.prefs.showLetters = !this.doc.prefs.showLetters;
        break;
      case "showFifth":
        this.doc.prefs.showFifth = !this.doc.prefs.showFifth;
        break;
      case "notesOutsideScale":
        this.doc.prefs.notesOutsideScale = !this.doc.prefs.notesOutsideScale;
        break;
      case "setDefaultScale":
        this.doc.prefs.defaultScale = this.doc.song.scale;
        break;
      case "showChannels":
        this.doc.prefs.showChannels = !this.doc.prefs.showChannels;
        break;
      case "showScrollBar":
        this.doc.prefs.showScrollBar = !this.doc.prefs.showScrollBar;
        break;
      case "alwaysFineNoteVol":
        this.doc.prefs.alwaysFineNoteVol = !this.doc.prefs.alwaysFineNoteVol;
        break;
      case "enableChannelMuting":
        this.doc.prefs.enableChannelMuting =
          !this.doc.prefs.enableChannelMuting;
        for (const channel of this.doc.song.channels) channel.muted = false;
        break;
      case "displayBrowserUrl":
        this.doc.toggleDisplayBrowserUrl();
        break;
      case "displayVolumeBar":
        this.doc.prefs.displayVolumeBar = !this.doc.prefs.displayVolumeBar;
        break;
      case "notesFlashWhenPlayed":
        this.doc.prefs.notesFlashWhenPlayed =
          !this.doc.prefs.notesFlashWhenPlayed;
        break;
      case "layout":
        this._openPrompt("layout");
        break;
      case "colorTheme":
        this._openPrompt("theme");
        break;
      case "customTheme":
        this._openPrompt("customTheme");
        break;
      case "recordingSetup":
        this._openPrompt("recordingSetup");
        break;
      case "showOscilloscope":
        this.doc.prefs.showOscilloscope = !this.doc.prefs.showOscilloscope;
        break;
      case "showDescription":
        this.doc.prefs.showDescription = !this.doc.prefs.showDescription;
        break;
      case "showInstrumentScrollbars":
        this.doc.prefs.showInstrumentScrollbars =
          !this.doc.prefs.showInstrumentScrollbars;
        break;
      case "showSampleLoadingStatus":
        this.doc.prefs.showSampleLoadingStatus =
          !this.doc.prefs.showSampleLoadingStatus;
        break;
      case "closePromptByClickoff":
        this.doc.prefs.closePromptByClickoff =
          !this.doc.prefs.closePromptByClickoff;
        break;
      case "instrumentCopyPaste":
        this.doc.prefs.instrumentCopyPaste =
          !this.doc.prefs.instrumentCopyPaste;
        break;
      case "instrumentImportExport":
        this.doc.prefs.instrumentImportExport =
          !this.doc.prefs.instrumentImportExport;
        break;
      case "instrumentButtonsAtTop":
        this.doc.prefs.instrumentButtonsAtTop =
          !this.doc.prefs.instrumentButtonsAtTop;
        break;
      case "frostedGlassBackground":
        this.doc.prefs.frostedGlassBackground =
          !this.doc.prefs.frostedGlassBackground;
        break;
    }
    this._optionsMenu.selectedIndex = 0;
    this.doc.notifier.changed();
    this.doc.prefs.save();
  };

  private _customWavePresetHandler = (event: Event): void => {
    // Update custom wave value
    let customWaveArray: Float32Array = new Float32Array(64);
    let index: number = this._customWavePresetDrop.selectedIndex - 1;
    let maxValue: number = Number.MIN_VALUE;
    let minValue: number = Number.MAX_VALUE;
    let arrayPoint: number = 0;
    let arrayStep: number = (Config.chipWaves[index].samples.length - 1) / 64.0;

    for (let i: number = 0; i < 64; i++) {
      // Compute derivative to get original wave.
      customWaveArray[i] =
        (Config.chipWaves[index].samples[Math.floor(arrayPoint)] -
          Config.chipWaves[index].samples[Math.floor(arrayPoint) + 1]) /
        arrayStep;

      if (customWaveArray[i] < minValue) minValue = customWaveArray[i];

      if (customWaveArray[i] > maxValue) maxValue = customWaveArray[i];

      // Scale an any-size array to 64 elements
      arrayPoint += arrayStep;
    }

    for (let i: number = 0; i < 64; i++) {
      // Change array range from Min~Max to 0~(Max-Min)
      customWaveArray[i] -= minValue;
      // Divide by (Max-Min) to get a range of 0~1,
      customWaveArray[i] /= maxValue - minValue;
      //then multiply by 48 to get 0~48,
      customWaveArray[i] *= 48.0;
      //then subtract 24 to get - 24~24
      customWaveArray[i] -= 24.0;
      //need to force integers
      customWaveArray[i] = Math.ceil(customWaveArray[i]);

      // Copy back data to canvas
      this._customWaveDrawCanvas.newArray[i] = customWaveArray[i];
    }

    //this._instrumentVolumeSlider.input.value = "" + Math.round(Config.waveVolumes[index] * 50.0 - 50.0);

    this.doc.record(new ChangeCustomWave(this.doc, customWaveArray));
    if (+this._instrumentVolumeSlider.input.value != -Config.volumeRange / 2) {
      this.doc.record(
        new ChangeVolume(
          this.doc,
          +this._instrumentVolumeSlider.input.value,
          Math.min(
            Math.max(
              -Config.volumeRange / 2 +
                Math.round(
                  (Math.sqrt(Config.chipWaves[index].expression) *
                    Config.volumeRange) /
                    2 +
                    parseInt(this._instrumentVolumeSlider.input.value)
                ),
              -Config.volumeRange / 2
            ) >> 1,
            Config.volumeRange / 2
          )
        )
      );
    }

    this._customWavePresetDrop.selectedIndex = 0;
    this.doc.notifier.changed();
    this.doc.prefs.save();
  };
}
