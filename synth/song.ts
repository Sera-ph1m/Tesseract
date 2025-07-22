export class Song {
   private static readonly _format: string = Config.jsonFormat;
   private static readonly _oldestBeepboxVersion: number = 2;
   private static readonly _latestBeepboxVersion: number = 9;
   private static readonly _oldestJummBoxVersion: number = 1;
   private static readonly _latestJummBoxVersion: number = 6;
   private static readonly _oldestGoldBoxVersion: number = 1;
   private static readonly _latestGoldBoxVersion: number = 4;
  private static readonly _oldestUltraBoxVersion: number = 1; 
  private static readonly _latestUltraBoxVersion: number = 5; 
  private static readonly _oldestSlarmoosBoxVersion: number = 1; 
  private static readonly _latestSlarmoosBoxVersion: number = 5; 
  private static readonly _oldestSomethingBoxVersion: number = 1;
  private static readonly _latestSomethingBoxVersion: number = 1;
   // One-character variant detection at the start of URL to distinguish variants such as JummBox, Or Goldbox. "j" and "g" respectively
   //also "u" is ultrabox lol
  private static readonly _variant = 0x62; //"b" ~ somethingbox

   public title: string;
   public scale: number;
   public scaleCustom: boolean[] = [];
   public key: number;
   public octave: number;
   public tempo: number;
   public reverb: number;
   public beatsPerBar: number;
   public barCount: number;
   public patternsPerChannel: number;
   public rhythm: number;
   public layeredInstruments: boolean;
   public patternInstruments: boolean;
   public loopStart: number;
   public loopLength: number;
   public readonly channels: Channel[] = [];
   public limitDecay: number = 4.0;
   public limitRise: number = 4000.0;
   public compressionThreshold: number = 1.0;
   public limitThreshold: number = 1.0;
   public compressionRatio: number = 1.0;
   public limitRatio: number = 1.0;
   public masterGain: number = 1.0;
   public inVolumeCap: number = 0.0;
   public outVolumeCap: number = 0.0;
   public eqFilter: FilterSettings = new FilterSettings();
   public eqFilterType: boolean = false;
   public eqFilterSimpleCut: number = Config.filterSimpleCutRange - 1;
   public eqFilterSimplePeak: number = 0;
   public eqSubFilters: (FilterSettings | null)[] = [];
   public tmpEqFilterStart: FilterSettings | null;
   public tmpEqFilterEnd: FilterSettings | null;

   constructor(string?: string) {
       if (string != undefined) {
           this.fromBase64String(string);
       } else {
           this.initToDefault(true);
       }
   }

   // Returns the ideal new note volume when dragging (max volume for a normal note, a "neutral" value for mod notes based on how they work)
   public getNewNoteVolume = (isMod: boolean, modChannel?: number, modInstrument?: number, modCount?: number): number => {
       if (!isMod || modChannel == undefined || modInstrument == undefined || modCount == undefined)
           return Config.noteSizeMax;
       else {
           // Sigh, the way pitches count up and the visual ordering in the UI are flipped.
           modCount = Config.modCount - modCount - 1;

           const instrument: Instrument = this.channels[modChannel].instruments[modInstrument];
           let vol: number | undefined = Config.modulators[instrument.modulators[modCount]].newNoteVol;

           let currentIndex: number = instrument.modulators[modCount];
           // For tempo, actually use user defined tempo
           let tempoIndex: number = Config.modulators.dictionary["tempo"].index;
           if (currentIndex == tempoIndex) vol = this.tempo - Config.modulators[tempoIndex].convertRealFactor;
           //for effects and envelopes, use the user defined value of the selected instrument (or the default value if all or active is selected)
           if (!Config.modulators[currentIndex].forSong && instrument.modInstruments[modCount] < this.channels[instrument.modChannels[modCount]].instruments.length) {
               let chorusIndex: number = Config.modulators.dictionary["chorus"].index;
               let reverbIndex: number = Config.modulators.dictionary["reverb"].index;
               let panningIndex: number = Config.modulators.dictionary["pan"].index;
               let panDelayIndex: number = Config.modulators.dictionary["pan delay"].index;
               let distortionIndex: number = Config.modulators.dictionary["distortion"].index;
               let detuneIndex: number = Config.modulators.dictionary["detune"].index;
               let vibratoDepthIndex: number = Config.modulators.dictionary["vibrato depth"].index;
               let vibratoSpeedIndex: number = Config.modulators.dictionary["vibrato speed"].index;
               let vibratoDelayIndex: number = Config.modulators.dictionary["vibrato delay"].index;
               let arpSpeedIndex: number = Config.modulators.dictionary["arp speed"].index;
               let bitCrushIndex: number = Config.modulators.dictionary["bit crush"].index;
               let freqCrushIndex: number = Config.modulators.dictionary["freq crush"].index;
               let echoIndex: number = Config.modulators.dictionary["echo"].index;
               let echoDelayIndex: number = Config.modulators.dictionary["echo delay"].index;
               let pitchShiftIndex: number = Config.modulators.dictionary["pitch shift"].index;
               let ringModIndex: number = Config.modulators.dictionary["ring modulation"].index;
               let ringModHertzIndex: number = Config.modulators.dictionary["ring mod hertz"].index;
               let granularIndex: number = Config.modulators.dictionary["granular"].index;
               let grainAmountIndex: number = Config.modulators.dictionary["grain freq"].index;
               let grainSizeIndex: number = Config.modulators.dictionary["grain size"].index;
               let grainRangeIndex: number = Config.modulators.dictionary["grain range"].index;
               let envSpeedIndex: number = Config.modulators.dictionary["envelope speed"].index;
               let perEnvSpeedIndex: number = Config.modulators.dictionary["individual envelope speed"].index;
               let perEnvLowerIndex: number = Config.modulators.dictionary["individual envelope lower bound"].index;
               let perEnvUpperIndex: number = Config.modulators.dictionary["individual envelope upper bound"].index;
               let instrumentIndex: number = instrument.modInstruments[modCount];

               switch (currentIndex) {
                   case chorusIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].chorus - Config.modulators[chorusIndex].convertRealFactor;
                       break;
                   case reverbIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].reverb - Config.modulators[reverbIndex].convertRealFactor;
                       break;
                   case panningIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].pan - Config.modulators[panningIndex].convertRealFactor;
                       break;
                   case panDelayIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].panDelay - Config.modulators[panDelayIndex].convertRealFactor;
                       break;
                   case distortionIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].distortion - Config.modulators[distortionIndex].convertRealFactor;
                       break;
                   case detuneIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].detune;
                       break;
                   case vibratoDepthIndex:
                       vol = Math.round(this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].vibratoDepth * 25 - Config.modulators[vibratoDepthIndex].convertRealFactor);
                       break;
                   case vibratoSpeedIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].vibratoSpeed - Config.modulators[vibratoSpeedIndex].convertRealFactor;
                       break;
                   case vibratoDelayIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].vibratoDelay - Config.modulators[vibratoDelayIndex].convertRealFactor;
                       break;
                   case arpSpeedIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].arpeggioSpeed - Config.modulators[arpSpeedIndex].convertRealFactor;
                       break;
                   case bitCrushIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].bitcrusherQuantization - Config.modulators[bitCrushIndex].convertRealFactor;
                       break;
                   case freqCrushIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].bitcrusherFreq - Config.modulators[freqCrushIndex].convertRealFactor;
                       break;
                   case echoIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].echoSustain - Config.modulators[echoIndex].convertRealFactor;
                       break;
                   case echoDelayIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].echoDelay - Config.modulators[echoDelayIndex].convertRealFactor;
                       break;
                   case pitchShiftIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].pitchShift;
                       break;
                   case ringModIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].ringModulation - Config.modulators[ringModIndex].convertRealFactor;
                       break;
                   case ringModHertzIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].ringModulationHz - Config.modulators[ringModHertzIndex].convertRealFactor;
                       break;
                   case granularIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].granular - Config.modulators[granularIndex].convertRealFactor;
                       break;
                   case grainAmountIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].grainAmounts - Config.modulators[grainAmountIndex].convertRealFactor;
                       break;
                   case grainSizeIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].grainSize - Config.modulators[grainSizeIndex].convertRealFactor;
                       break;
                   case grainRangeIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].grainRange - Config.modulators[grainRangeIndex].convertRealFactor;
                       break;
                   case envSpeedIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].envelopeSpeed - Config.modulators[envSpeedIndex].convertRealFactor;
                       break;
                   case perEnvSpeedIndex:
                       vol = Config.perEnvelopeSpeedToIndices[this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].envelopes[instrument.modEnvelopeNumbers[modCount]].perEnvelopeSpeed] - Config.modulators[perEnvSpeedIndex].convertRealFactor;
                       break;
                   case perEnvLowerIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].envelopes[instrument.modEnvelopeNumbers[modCount]].perEnvelopeLowerBound - Config.modulators[perEnvLowerIndex].convertRealFactor;
                       break;
                   case perEnvUpperIndex:
                       vol = this.channels[instrument.modChannels[modCount]].instruments[instrumentIndex].envelopes[instrument.modEnvelopeNumbers[modCount]].perEnvelopeUpperBound - Config.modulators[perEnvUpperIndex].convertRealFactor;
                       break;
               }
           }

           if (vol != undefined)
               return vol;
           else
               return Config.noteSizeMax;
       }
   }


   public getVolumeCap = (isMod: boolean, modChannel?: number, modInstrument?: number, modCount?: number): number => {
       if (!isMod || modChannel == undefined || modInstrument == undefined || modCount == undefined)
           return Config.noteSizeMax;
       else {
           // Sigh, the way pitches count up and the visual ordering in the UI are flipped.
           modCount = Config.modCount - modCount - 1;

           let instrument: Instrument = this.channels[modChannel].instruments[modInstrument];
           let modulator = Config.modulators[instrument.modulators[modCount]];
           let cap: number | undefined = modulator.maxRawVol;

           if (cap != undefined) {
               // For filters, cap is dependent on which filter setting is targeted
               if (modulator.name == "eq filter" || modulator.name == "note filter" || modulator.name == "song eq") {
                   // type 0: number of filter morphs
                   // type 1/odd: number of filter x positions
                   // type 2/even: number of filter y positions
                   cap = Config.filterMorphCount - 1;
                   if (instrument.modFilterTypes[modCount] > 0 && instrument.modFilterTypes[modCount] % 2) {
                       cap = Config.filterFreqRange;
                   } else if (instrument.modFilterTypes[modCount] > 0) {
                       cap = Config.filterGainRange;
                   }
               }
               return cap;
           }
           else
               return Config.noteSizeMax;
       }
   }

   public getVolumeCapForSetting = (isMod: boolean, modSetting: number, filterType?: number): number => {
       if (!isMod)
           return Config.noteSizeMax;
       else {
           let cap: number | undefined = Config.modulators[modSetting].maxRawVol;
           if (cap != undefined) {

               // For filters, cap is dependent on which filter setting is targeted
               if (filterType != undefined && (Config.modulators[modSetting].name == "eq filter" || Config.modulators[modSetting].name == "note filter" || Config.modulators[modSetting].name == "song eq")) {
                   // type 0: number of filter morphs
                   // type 1/odd: number of filter x positions
                   // type 2/even: number of filter y positions
                   cap = Config.filterMorphCount - 1;
                   if (filterType > 0 && filterType % 2) {
                       cap = Config.filterFreqRange;
                   } else if (filterType > 0) {
                       cap = Config.filterGainRange;
                   }
               }

               return cap;
           } else
               return Config.noteSizeMax;
       }
   }

   public getChannelCount(): number {
       return this.channels.length;
   }

   /** number of Pitch channels */
   public get pitchChannelCount(): number {
       return this.channels.reduce(
           (cnt, ch) => cnt + (ch.type === ChannelType.Pitch ? 1 : 0),
           0
       );
   }
   /** allow legacy assignments—no‐op */
   public set pitchChannelCount(_v: number) { /* noop */ }
   /** number of Noise channels */
   public get noiseChannelCount(): number {
       return this.channels.reduce(
           (cnt, ch) => cnt + (ch.type === ChannelType.Noise ? 1 : 0),
           0
       );
   }
   /** allow legacy assignments—no‐op */
   public set noiseChannelCount(_v: number) { /* noop */ }
   /** number of Modulator channels */
   public get modChannelCount(): number {
       return this.channels.reduce(
           (cnt, ch) => cnt + (ch.type === ChannelType.Mod ? 1 : 0),
           0
       );
   }
   /** allow legacy assignments—no‐op */
   public set modChannelCount(_v: number) { /* noop */ }

   public getMaxInstrumentsPerChannel(): number {
       return Math.max(
           this.layeredInstruments ? Config.layeredInstrumentCountMax : Config.instrumentCountMin,
           this.patternInstruments ? Config.patternInstrumentCountMax : Config.instrumentCountMin);
   }

   public getMaxInstrumentsPerPattern(channelIndex: number): number {
       return this.getMaxInstrumentsPerPatternForChannel(this.channels[channelIndex]);
   }

   public getMaxInstrumentsPerPatternForChannel(channel: Channel): number {
       return this.layeredInstruments
           ? Math.min(Config.layeredInstrumentCountMax, channel.instruments.length)
           : 1;
   }

   public getChannelIsNoise(channelIndex: number): boolean {
       return this.channels[channelIndex].type === ChannelType.Noise;
   }

   public getChannelIsMod(channelIndex: number): boolean {
       return this.channels[channelIndex].type === ChannelType.Mod;
   }

   public updateDefaultChannelNames(): void {
       const defaultNameRegex = /^Channel \d+$/;
       this.channels.forEach((channel, index) => {
           // If the name is empty or a default name, update it.
           if (channel.name === "" || defaultNameRegex.test(channel.name)) {
               channel.name = `Channel ${index + 1}`;
           }
       });
   }
   private _getChannelsOfType(type: ChannelType): { channel: Channel, absoluteIndex: number }[] {
       return this.channels
           .map((channel, index) => ({ channel, absoluteIndex: index }))
           .filter(item => item.channel.type === type);
   }
   // Update all modulator channel targets after a structural change.
   private _updateAllModTargetIndices(remap: (oldIndex: number) => number): void {
       for (const channel of this.channels) {
           if (channel.type === ChannelType.Mod) {
               for (const instrument of channel.instruments) {
                   for (let i = 0; i < instrument.modChannels.length; i++) {
                       const oldTargetIndex = instrument.modChannels[i];
                       // Don't remap song-level targets (-1) or "None" (-2).
                       if (oldTargetIndex >= 0) {
                           instrument.modChannels[i] = remap(oldTargetIndex);
                       }
                   }
               }
           }
       }
   }

       public addChannel(type: ChannelType, position: number = this.channels.length - 1): void {
       const insertIndex = position + 1;

       // Before modifying the array, update all existing modulators.
       // Any target with an index >= insertIndex will be shifted one position to the right.
       const remap = (oldIndex: number) => (oldIndex >= insertIndex ? oldIndex + 1 : oldIndex);
       this._updateAllModTargetIndices(remap);
       const newChannel = new Channel(type);

       // Initialize the new channel with default properties.
       newChannel.octave = (type === ChannelType.Pitch) ? 3 : 0;

       for (let i = 0; i < this.patternsPerChannel; i++) {
           newChannel.patterns.push(new Pattern());
       }

       for (let i = 0; i < Config.instrumentCountMin; i++) {
           const isNoise = type === ChannelType.Noise;
           const isMod = type === ChannelType.Mod;
           const instrument = new Instrument(isNoise, isMod);
           instrument.setTypeAndReset(
               isMod ? InstrumentType.mod : (isNoise ? InstrumentType.noise : InstrumentType.chip),
               isNoise,
               isMod
           );
           newChannel.instruments.push(instrument);
       }

       for (let i = 0; i < this.barCount; i++) {
           newChannel.bars.push(0);
       }

       this.channels.splice(insertIndex, 0, newChannel);

       this.updateDefaultChannelNames();
   }

   public removeChannel(index: number): void {
       if (index < 0 || index >= this.channels.length) return;

       // Before modifying the array, update all existing modulators.
       const remap = (oldIndex: number) => {
           if (oldIndex === index) return -2; // Target was deleted, set to "None".
           if (oldIndex > index) return oldIndex - 1; // Target was shifted left.
           return oldIndex;
       };
       this._updateAllModTargetIndices(remap);
       this.channels.splice(index, 1);
       this.updateDefaultChannelNames();
   }


   public removeChannelType(type: ChannelType): void {
       const candidates = this._getChannelsOfType(type);
       if (candidates.length === 0) return;

       const leastUsed = candidates.reduce((best, current) => {
           const bestScore = best.channel.bars.filter(b => b > 0).length;
           const currentScore = current.channel.bars.filter(b => b > 0).length;

           if (currentScore < bestScore) return current;
           if (currentScore > bestScore) return best;
           return current.absoluteIndex > best.absoluteIndex ? current : best;
       });

       this.removeChannel(leastUsed.absoluteIndex);
   }


   public initToDefault(andResetChannels: boolean = true): void {
       this.scale = 0;
       this.scaleCustom = [true, false, true, true, false, false, false, true, true, false, true, true];
       //this.scaleCustom = [true, false, false, false, false, false, false, false, false, false, false, false];
       this.key = 0;
       this.octave = 0;
       this.loopStart = 0;
       this.loopLength = 4;
       this.tempo = 150; //Default tempo returned to 150 for consistency with BeepBox and JummBox
       this.reverb = 0;
       this.beatsPerBar = 8;
       this.barCount = 16;
       this.patternsPerChannel = 8;
       this.rhythm = 1;
       this.layeredInstruments = false;
       this.patternInstruments = false;
       this.eqFilter.reset();
       for (let i: number = 0; i < Config.filterMorphCount - 1; i++) {
           this.eqSubFilters[i] = null;
       }

       //This is the tab's display name
       this.title = "Untitled";
       document.title = this.title + " - " + EditorConfig.versionDisplayName;

       if (andResetChannels) {
                     // build 3 pitch, 1 noise, 1 mod—then they can be reordered/mixed later
           this.channels.length = 0;
           for (let i = 0; i < 3; i++) this.channels.push(new Channel(ChannelType.Pitch));
           this.channels.push(new Channel(ChannelType.Noise));
           this.channels.push(new Channel(ChannelType.Mod));
           // set defaults (octave, name, patterns, instruments, bars)
           for (let channelIndex = 0; channelIndex < this.channels.length; channelIndex++) {
               const channel = this.channels[channelIndex];
               channel.octave = channel.type === ChannelType.Pitch
                   ? Math.max(3 - channelIndex, 0)
                   : 0;

               for (let pattern: number = 0; pattern < this.patternsPerChannel; pattern++) {
                   if (channel.patterns.length <= pattern) {
                       channel.patterns[pattern] = new Pattern();
                   } else {
                       channel.patterns[pattern].reset();
                   }
               }
               channel.patterns.length = this.patternsPerChannel;

              for (let i = 0; i < Config.instrumentCountMin; i++) {
                  if (channel.instruments.length <= i) {
                      channel.instruments[i] = new Instrument(
                          channel.type === ChannelType.Noise,
                          channel.type === ChannelType.Mod
                      );
                  }
                  channel.instruments[i].setTypeAndReset(
                      channel.type === ChannelType.Mod    ? InstrumentType.mod    :
                      channel.type === ChannelType.Noise  ? InstrumentType.noise  :
                                                           InstrumentType.chip,
                      channel.type === ChannelType.Noise,
                      channel.type === ChannelType.Mod
                  );
              }
               channel.instruments.length = Config.instrumentCountMin;

               for (let bar: number = 0; bar < this.barCount; bar++) {
                   channel.bars[bar] = bar < 4 ? 1 : 0;
               }
               channel.bars.length = this.barCount;
           }
           this.channels.length = this.getChannelCount();
           this.updateDefaultChannelNames();
       }
   }

   //This determines the url
   public toBase64String(): string {
       let bits: BitFieldWriter;
       let buffer: number[] = [];

       buffer.push(Song._variant);
       buffer.push(base64IntToCharCode[Song._latestSomethingBoxVersion]);

       // Length of the song name string
       buffer.push(SongTagCode.songTitle);
       var encodedSongTitle: string = encodeURIComponent(this.title);
       buffer.push(base64IntToCharCode[encodedSongTitle.length >> 6], base64IntToCharCode[encodedSongTitle.length & 0x3f]);

       // Actual encoded string follows
       for (let i: number = 0; i < encodedSongTitle.length; i++) {
           buffer.push(encodedSongTitle.charCodeAt(i));
       }
      // Save total channel count, then the type of each channel.
      buffer.push(SongTagCode.channelCount, base64IntToCharCode[this.channels.length]);
      this.channels.forEach(channel => {
          buffer.push(base64IntToCharCode[channel.type]);
      });

       buffer.push(SongTagCode.key, base64IntToCharCode[this.key], base64IntToCharCode[this.octave - Config.octaveMin]);
       buffer.push(SongTagCode.loopStart, base64IntToCharCode[this.loopStart >> 6], base64IntToCharCode[this.loopStart & 0x3f]);
       buffer.push(SongTagCode.loopEnd, base64IntToCharCode[(this.loopLength - 1) >> 6], base64IntToCharCode[(this.loopLength - 1) & 0x3f]);
       buffer.push(SongTagCode.tempo, base64IntToCharCode[this.tempo >> 6], base64IntToCharCode[this.tempo & 0x3F]);
       buffer.push(SongTagCode.beatCount, base64IntToCharCode[this.beatsPerBar - 1]);
       buffer.push(SongTagCode.barCount, base64IntToCharCode[(this.barCount - 1) >> 6], base64IntToCharCode[(this.barCount - 1) & 0x3f]);
       buffer.push(SongTagCode.patternCount, base64IntToCharCode[(this.patternsPerChannel - 1) >> 6], base64IntToCharCode[(this.patternsPerChannel - 1) & 0x3f]);
       buffer.push(SongTagCode.rhythm, base64IntToCharCode[this.rhythm]);

       // Push limiter settings, but only if they aren't the default!
       buffer.push(SongTagCode.limiterSettings);
       if (this.compressionRatio != 1.0 || this.limitRatio != 1.0 || this.limitRise != 4000.0 || this.limitDecay != 4.0 || this.limitThreshold != 1.0 || this.compressionThreshold != 1.0 || this.masterGain != 1.0) {
           buffer.push(base64IntToCharCode[Math.round(this.compressionRatio < 1 ? this.compressionRatio * 10 : 10 + (this.compressionRatio - 1) * 60)]); // 0 ~ 1.15 uneven, mapped to 0 ~ 20
           buffer.push(base64IntToCharCode[Math.round(this.limitRatio < 1 ? this.limitRatio * 10 : 9 + this.limitRatio)]); // 0 ~ 10 uneven, mapped to 0 ~ 20
           buffer.push(base64IntToCharCode[this.limitDecay]); // directly 1 ~ 30
           buffer.push(base64IntToCharCode[Math.round((this.limitRise - 2000.0) / 250.0)]); // 2000 ~ 10000 by 250, mapped to 0 ~ 32
           buffer.push(base64IntToCharCode[Math.round(this.compressionThreshold * 20)]); // 0 ~ 1.1 by 0.05, mapped to 0 ~ 22
           buffer.push(base64IntToCharCode[Math.round(this.limitThreshold * 20)]); // 0 ~ 2 by 0.05, mapped to 0 ~ 40
           buffer.push(base64IntToCharCode[Math.round(this.masterGain * 50) >> 6], base64IntToCharCode[Math.round(this.masterGain * 50) & 0x3f]); // 0 ~ 5 by 0.02, mapped to 0 ~ 250
       }
       else {
           buffer.push(base64IntToCharCode[0x3f]); // Not using limiter
       }

       //songeq
       buffer.push(SongTagCode.songEq);
       if (this.eqFilter == null) {
           // Push null filter settings
           buffer.push(base64IntToCharCode[0]);
           console.log("Null EQ filter settings detected in toBase64String for song");
       } else {
           buffer.push(base64IntToCharCode[this.eqFilter.controlPointCount]);
           for (let j: number = 0; j < this.eqFilter.controlPointCount; j++) {
               const point: FilterControlPoint = this.eqFilter.controlPoints[j];
               buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
           }
       }

       // Push subfilters as well. Skip Index 0, is a copy of the base filter.
       let usingSubFilterBitfield: number = 0;
       for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
           usingSubFilterBitfield |= (+(this.eqSubFilters[j + 1] != null) << j);
       }
       // Put subfilter usage into 2 chars (12 bits)
       buffer.push(base64IntToCharCode[usingSubFilterBitfield >> 6], base64IntToCharCode[usingSubFilterBitfield & 63]);
       // Put subfilter info in for all used subfilters
       for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
           if (usingSubFilterBitfield & (1 << j)) {
               buffer.push(base64IntToCharCode[this.eqSubFilters[j + 1]!.controlPointCount]);
               for (let k: number = 0; k < this.eqSubFilters[j + 1]!.controlPointCount; k++) {
                   const point: FilterControlPoint = this.eqSubFilters[j + 1]!.controlPoints[k];
                   buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
               }
           }
       }

       buffer.push(SongTagCode.channelNames);
       for (let channel: number = 0; channel < this.getChannelCount(); channel++) {
           // Length of the channel name string
           var encodedChannelName: string = encodeURIComponent(this.channels[channel].name);
           buffer.push(base64IntToCharCode[encodedChannelName.length >> 6], base64IntToCharCode[encodedChannelName.length & 0x3f]);

           // Actual encoded string follows
           for (let i: number = 0; i < encodedChannelName.length; i++) {
               buffer.push(encodedChannelName.charCodeAt(i));
           }
       }

       buffer.push(SongTagCode.instrumentCount, base64IntToCharCode[(<any>this.layeredInstruments << 1) | <any>this.patternInstruments]);
       if (this.layeredInstruments || this.patternInstruments) {
           for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
               buffer.push(base64IntToCharCode[this.channels[channelIndex].instruments.length - Config.instrumentCountMin]);
           }
       }

       buffer.push(SongTagCode.channelOctave);
       // Iterate through ALL channels and only write an octave if the channel is a pitch channel.
       // This ensures the saved data is correct regardless of channel order.
       this.channels.forEach(channel => {
           if (channel.type === ChannelType.Pitch) {
               buffer.push(base64IntToCharCode[channel.octave]);
           }
       });

       //This is for specific instrument stuff to url
       for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
           for (let i: number = 0; i < this.channels[channelIndex].instruments.length; i++) {
               const instrument: Instrument = this.channels[channelIndex].instruments[i];
               buffer.push(SongTagCode.startInstrument, base64IntToCharCode[instrument.type]);
               buffer.push(SongTagCode.volume, base64IntToCharCode[(instrument.volume + Config.volumeRange / 2) >> 6], base64IntToCharCode[(instrument.volume + Config.volumeRange / 2) & 0x3f]);
               buffer.push(SongTagCode.preset, base64IntToCharCode[instrument.preset >> 6], base64IntToCharCode[instrument.preset & 63]);

               buffer.push(SongTagCode.eqFilter);
               buffer.push(base64IntToCharCode[+instrument.eqFilterType]);
               if (instrument.eqFilterType) {
                   buffer.push(base64IntToCharCode[instrument.eqFilterSimpleCut]);
                   buffer.push(base64IntToCharCode[instrument.eqFilterSimplePeak]);
               }
               else {
                   if (instrument.eqFilter == null) {
                       // Push null filter settings
                       buffer.push(base64IntToCharCode[0]);
                       console.log("Null EQ filter settings detected in toBase64String for channelIndex " + channelIndex + ", instrumentIndex " + i);
                   } else {
                       buffer.push(base64IntToCharCode[instrument.eqFilter.controlPointCount]);
                       for (let j: number = 0; j < instrument.eqFilter.controlPointCount; j++) {
                           const point: FilterControlPoint = instrument.eqFilter.controlPoints[j];
                           buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
                       }
                   }

                   // Push subfilters as well. Skip Index 0, is a copy of the base filter.
                   let usingSubFilterBitfield: number = 0;
                   for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                       usingSubFilterBitfield |= (+(instrument.eqSubFilters[j + 1] != null) << j);
                   }
                   // Put subfilter usage into 2 chars (12 bits)
                   buffer.push(base64IntToCharCode[usingSubFilterBitfield >> 6], base64IntToCharCode[usingSubFilterBitfield & 63]);
                   // Put subfilter info in for all used subfilters
                   for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                       if (usingSubFilterBitfield & (1 << j)) {
                           buffer.push(base64IntToCharCode[instrument.eqSubFilters[j + 1]!.controlPointCount]);
                           for (let k: number = 0; k < instrument.eqSubFilters[j + 1]!.controlPointCount; k++) {
                               const point: FilterControlPoint = instrument.eqSubFilters[j + 1]!.controlPoints[k];
                               buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
                           }
                       }
                   }
               }

               // The list of enabled effects is represented as a 14-bit bitfield using two six-bit characters.
               buffer.push(SongTagCode.effects, base64IntToCharCode[(instrument.effects >> 12) & 63], base64IntToCharCode[(instrument.effects >> 6) & 63], base64IntToCharCode[instrument.effects & 63]);
               if (effectsIncludeNoteFilter(instrument.effects)) {
                   buffer.push(base64IntToCharCode[+instrument.noteFilterType]);
                   if (instrument.noteFilterType) {
                       buffer.push(base64IntToCharCode[instrument.noteFilterSimpleCut]);
                       buffer.push(base64IntToCharCode[instrument.noteFilterSimplePeak]);
                   } else {
                       if (instrument.noteFilter == null) {
                           // Push null filter settings
                           buffer.push(base64IntToCharCode[0]);
                           console.log("Null note filter settings detected in toBase64String for channelIndex " + channelIndex + ", instrumentIndex " + i);
                       } else {
                           buffer.push(base64IntToCharCode[instrument.noteFilter.controlPointCount]);
                           for (let j: number = 0; j < instrument.noteFilter.controlPointCount; j++) {
                               const point: FilterControlPoint = instrument.noteFilter.controlPoints[j];
                               buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
                           }
                       }

                       // Push subfilters as well. Skip Index 0, is a copy of the base filter.
                       let usingSubFilterBitfield: number = 0;
                       for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                           usingSubFilterBitfield |= (+(instrument.noteSubFilters[j + 1] != null) << j);
                       }
                       // Put subfilter usage into 2 chars (12 bits)
                       buffer.push(base64IntToCharCode[usingSubFilterBitfield >> 6], base64IntToCharCode[usingSubFilterBitfield & 63]);
                       // Put subfilter info in for all used subfilters
                       for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                           if (usingSubFilterBitfield & (1 << j)) {
                               buffer.push(base64IntToCharCode[instrument.noteSubFilters[j + 1]!.controlPointCount]);
                               for (let k: number = 0; k < instrument.noteSubFilters[j + 1]!.controlPointCount; k++) {
                                   const point: FilterControlPoint = instrument.noteSubFilters[j + 1]!.controlPoints[k];
                                   buffer.push(base64IntToCharCode[point.type], base64IntToCharCode[Math.round(point.freq)], base64IntToCharCode[Math.round(point.gain)]);
                               }
                           }
                       }
                   }
               }
               if (effectsIncludeTransition(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.transition]);
               }
               if (effectsIncludeChord(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.chord]);
                   // Custom arpeggio speed... only if the instrument arpeggiates.
                   if (instrument.chord == Config.chords.dictionary["arpeggio"].index) {
                       buffer.push(base64IntToCharCode[instrument.arpeggioSpeed]);
                       buffer.push(base64IntToCharCode[+instrument.fastTwoNoteArp]); // Two note arp setting piggybacks on this
                   }
                   if (instrument.chord == Config.chords.dictionary["monophonic"].index) {
                       buffer.push(base64IntToCharCode[instrument.monoChordTone]); //which note is selected
                   }
               }
               if (effectsIncludePitchShift(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.pitchShift]);
               }
               if (effectsIncludeDetune(instrument.effects)) {
                   buffer.push(base64IntToCharCode[(instrument.detune - Config.detuneMin) >> 6], base64IntToCharCode[(instrument.detune - Config.detuneMin) & 0x3F]);
               }
               if (effectsIncludeVibrato(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.vibrato]);
                   // Custom vibrato settings
                   if (instrument.vibrato == Config.vibratos.length) {
                       buffer.push(base64IntToCharCode[Math.round(instrument.vibratoDepth * 25)]);
                       buffer.push(base64IntToCharCode[instrument.vibratoSpeed]);
                       buffer.push(base64IntToCharCode[Math.round(instrument.vibratoDelay)]);
                       buffer.push(base64IntToCharCode[instrument.vibratoType]);
                   }
               }
               if (effectsIncludeDistortion(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.distortion]);
                   // Aliasing is tied into distortion for now
                   buffer.push(base64IntToCharCode[+instrument.aliases]);
               }
               if (effectsIncludeBitcrusher(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.bitcrusherFreq], base64IntToCharCode[instrument.bitcrusherQuantization]);
               }
               if (effectsIncludePanning(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.pan >> 6], base64IntToCharCode[instrument.pan & 0x3f]);
                   buffer.push(base64IntToCharCode[instrument.panDelay]);
               }
               if (effectsIncludeChorus(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.chorus]);
               }
               if (effectsIncludeEcho(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.echoSustain], base64IntToCharCode[instrument.echoDelay]);
               }
               if (effectsIncludeReverb(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.reverb]);
               }
               // if (effectsIncludeNoteRange(instrument.effects)) {
               //     buffer.push(base64IntToCharCode[instrument.noteRange]);
               // }
               if (effectsIncludeGranular(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.granular]);
                   buffer.push(base64IntToCharCode[instrument.grainSize]);
                   buffer.push(base64IntToCharCode[instrument.grainAmounts]);
                   buffer.push(base64IntToCharCode[instrument.grainRange]);
               }
               if (effectsIncludeRingModulation(instrument.effects)) {
                   buffer.push(base64IntToCharCode[instrument.ringModulation]);
                   buffer.push(base64IntToCharCode[instrument.ringModulationHz]);
                   buffer.push(base64IntToCharCode[instrument.ringModWaveformIndex]);
                   buffer.push(base64IntToCharCode[(instrument.ringModPulseWidth)]);
                   buffer.push(base64IntToCharCode[(instrument.ringModHzOffset - Config.rmHzOffsetMin) >> 6], base64IntToCharCode[(instrument.ringModHzOffset - Config.rmHzOffsetMin) & 0x3F]);
               }

               if (instrument.type != InstrumentType.drumset) {
                   buffer.push(SongTagCode.fadeInOut, base64IntToCharCode[instrument.fadeIn], base64IntToCharCode[instrument.fadeOut]);
                   // Transition info follows transition song tag
                   buffer.push(base64IntToCharCode[+instrument.clicklessTransition]);
               }

               if (instrument.type == InstrumentType.harmonics || instrument.type == InstrumentType.pickedString) {
                   buffer.push(SongTagCode.harmonics);
                   const harmonicsBits: BitFieldWriter = new BitFieldWriter();
                   for (let i: number = 0; i < Config.harmonicsControlPoints; i++) {
                       harmonicsBits.write(Config.harmonicsControlPointBits, instrument.harmonicsWave.harmonics[i]);
                   }
                   harmonicsBits.encodeBase64(buffer);
               }

               if (instrument.type == InstrumentType.chip) {
                   buffer.push(SongTagCode.wave);
                   if (instrument.chipWave > 186) {
                       buffer.push(base64IntToCharCode[instrument.chipWave - 186]);
                       buffer.push(base64IntToCharCode[3]);
                   }
                   else if (instrument.chipWave > 124) {
                       buffer.push(base64IntToCharCode[instrument.chipWave - 124]);
                       buffer.push(base64IntToCharCode[2]);
                   }
                   else if (instrument.chipWave > 62) {
                       buffer.push(base64IntToCharCode[instrument.chipWave - 62]);
                       buffer.push(base64IntToCharCode[1]);
                   }
                   else {
                       buffer.push(base64IntToCharCode[instrument.chipWave]);
                       buffer.push(base64IntToCharCode[0]);
                   }
                   buffer.push(104, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);

                   // Repurposed for chip wave loop controls.
                   buffer.push(SongTagCode.loopControls);
                   // The encoding here is as follows:
                   // 0b11111_1
                   //         ^-- isUsingAdvancedLoopControls
                   //   ^^^^^---- chipWaveLoopMode
                   // This essentially allocates 32 different loop modes,
                   // which should be plenty.
                   const encodedLoopMode: number = (
                       (clamp(0, 31 + 1, instrument.chipWaveLoopMode) << 1)
                       | (instrument.isUsingAdvancedLoopControls ? 1 : 0)
                   );
                   buffer.push(base64IntToCharCode[encodedLoopMode]);
                   // The same encoding above is used here, but with the release mode
                   // (which isn't implemented currently), and the backwards toggle.
                   const encodedReleaseMode: number = (
                       (clamp(0, 31 + 1, 0) << 1)
                       | (instrument.chipWavePlayBackwards ? 1 : 0)
                   );
                   buffer.push(base64IntToCharCode[encodedReleaseMode]);
                   encode32BitNumber(buffer, instrument.chipWaveLoopStart);
                   encode32BitNumber(buffer, instrument.chipWaveLoopEnd);
                   encode32BitNumber(buffer, instrument.chipWaveStartOffset);

               } else if (instrument.type == InstrumentType.fm || instrument.type == InstrumentType.fm6op) {
                   if (instrument.type == InstrumentType.fm) {
                       buffer.push(SongTagCode.algorithm, base64IntToCharCode[instrument.algorithm]);
                       buffer.push(SongTagCode.feedbackType, base64IntToCharCode[instrument.feedbackType]);
                   } else {
                       buffer.push(SongTagCode.algorithm, base64IntToCharCode[instrument.algorithm6Op]);
                       if (instrument.algorithm6Op == 0) {
                           buffer.push(SongTagCode.chord, base64IntToCharCode[instrument.customAlgorithm.carrierCount]);
                           buffer.push(SongTagCode.effects);
                           for (let o: number = 0; o < instrument.customAlgorithm.modulatedBy.length; o++) {
                               for (let j: number = 0; j < instrument.customAlgorithm.modulatedBy[o].length; j++) {
                                   buffer.push(base64IntToCharCode[instrument.customAlgorithm.modulatedBy[o][j]]);
                               }
                               buffer.push(SongTagCode.operatorWaves);
                           }
                           buffer.push(SongTagCode.effects);
                       }
                       buffer.push(SongTagCode.feedbackType, base64IntToCharCode[instrument.feedbackType6Op]);
                       if (instrument.feedbackType6Op == 0) {
                           buffer.push(SongTagCode.effects);
                           for (let o: number = 0; o < instrument.customFeedbackType.indices.length; o++) {
                               for (let j: number = 0; j < instrument.customFeedbackType.indices[o].length; j++) {
                                   buffer.push(base64IntToCharCode[instrument.customFeedbackType.indices[o][j]]);
                               }
                               buffer.push(SongTagCode.operatorWaves);
                           }
                           buffer.push(SongTagCode.effects);
                       }
                   }
                   buffer.push(SongTagCode.feedbackAmplitude, base64IntToCharCode[instrument.feedbackAmplitude]);

                   buffer.push(SongTagCode.operatorFrequencies);
                   for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       buffer.push(base64IntToCharCode[instrument.operators[o].frequency]);
                   }
                   buffer.push(SongTagCode.operatorAmplitudes);
                   for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       buffer.push(base64IntToCharCode[instrument.operators[o].amplitude]);
                   }
                   buffer.push(SongTagCode.operatorWaves);
                   for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       buffer.push(base64IntToCharCode[instrument.operators[o].waveform]);
                       // Push pulse width if that type is used
                       if (instrument.operators[o].waveform == 2) {
                           buffer.push(base64IntToCharCode[instrument.operators[o].pulseWidth]);
                       }
                   }
               } else if (instrument.type == InstrumentType.customChipWave) {
                   if (instrument.chipWave > 186) {
                       buffer.push(119, base64IntToCharCode[instrument.chipWave - 186]);
                       buffer.push(base64IntToCharCode[3]);
                   }
                   else if (instrument.chipWave > 124) {
                       buffer.push(119, base64IntToCharCode[instrument.chipWave - 124]);
                       buffer.push(base64IntToCharCode[2]);
                   }
                   else if (instrument.chipWave > 62) {
                       buffer.push(119, base64IntToCharCode[instrument.chipWave - 62]);
                       buffer.push(base64IntToCharCode[1]);
                   }
                   else {
                       buffer.push(119, base64IntToCharCode[instrument.chipWave]);
                       buffer.push(base64IntToCharCode[0]);
                   }
                   buffer.push(104, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
                   buffer.push(SongTagCode.customChipWave);
                   // Push custom wave values
                   for (let j: number = 0; j < 64; j++) {
                       buffer.push(base64IntToCharCode[(instrument.customChipWave[j] + 24) as number]);
                   }
               } else if (instrument.type == InstrumentType.noise) {
                   buffer.push(SongTagCode.wave, base64IntToCharCode[instrument.chipNoise]);
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
               } else if (instrument.type == InstrumentType.spectrum) {
                   buffer.push(SongTagCode.spectrum);
                   const spectrumBits: BitFieldWriter = new BitFieldWriter();
                   for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                       spectrumBits.write(Config.spectrumControlPointBits, instrument.spectrumWave.spectrum[i]);
                   }
                   spectrumBits.encodeBase64(buffer);
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
               } else if (instrument.type == InstrumentType.drumset) {
                   buffer.push(SongTagCode.drumsetEnvelopes);
                   for (let j: number = 0; j < Config.drumCount; j++) {
                       buffer.push(base64IntToCharCode[instrument.drumsetEnvelopes[j]]);
                   }

                   buffer.push(SongTagCode.spectrum);
                   const spectrumBits: BitFieldWriter = new BitFieldWriter();
                   for (let j: number = 0; j < Config.drumCount; j++) {
                       for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                           spectrumBits.write(Config.spectrumControlPointBits, instrument.drumsetSpectrumWaves[j].spectrum[i]);
                       }
                   }
                   spectrumBits.encodeBase64(buffer);
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
               } else if (instrument.type == InstrumentType.harmonics) {
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
               } else if (instrument.type == InstrumentType.pwm) {
                   buffer.push(SongTagCode.pulseWidth, base64IntToCharCode[instrument.pulseWidth]);
                   buffer.push(base64IntToCharCode[instrument.decimalOffset >> 6], base64IntToCharCode[instrument.decimalOffset & 0x3f]);
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
               } else if (instrument.type == InstrumentType.supersaw) {
                   buffer.push(SongTagCode.supersaw, base64IntToCharCode[instrument.supersawDynamism], base64IntToCharCode[instrument.supersawSpread], base64IntToCharCode[instrument.supersawShape]);
                   buffer.push(SongTagCode.pulseWidth, base64IntToCharCode[instrument.pulseWidth]);
                   buffer.push(base64IntToCharCode[instrument.decimalOffset >> 6], base64IntToCharCode[instrument.decimalOffset & 0x3f]);
               } else if (instrument.type == InstrumentType.pickedString) {
                   if (Config.stringSustainRange > 0x20 || SustainType.length > 2) {
                       throw new Error("Not enough bits to represent sustain value and type in same base64 character.");
                   }
                   buffer.push(SongTagCode.unison, base64IntToCharCode[instrument.unison]);
                   if (instrument.unison == Config.unisons.length) encodeUnisonSettings(buffer, instrument.unisonVoices, instrument.unisonSpread, instrument.unisonOffset, instrument.unisonExpression, instrument.unisonSign);
                   buffer.push(SongTagCode.stringSustain, base64IntToCharCode[instrument.stringSustain | (instrument.stringSustainType << 5)]);
               } else if (instrument.type == InstrumentType.mod) {
                   // Handled down below. Could be moved, but meh.
               } else {
                   throw new Error("Unknown instrument type.");
               }

               buffer.push(SongTagCode.envelopes, base64IntToCharCode[instrument.envelopeCount]);
               // Added in JB v6: Options for envelopes come next.
               buffer.push(base64IntToCharCode[instrument.envelopeSpeed]);
               for (let envelopeIndex: number = 0; envelopeIndex < instrument.envelopeCount; envelopeIndex++) {
                   buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].target]);
                   if (Config.instrumentAutomationTargets[instrument.envelopes[envelopeIndex].target].maxCount > 1) {
                       buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].index]);
                   }
                   buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].envelope]);
                   //run pitch envelope handling
                   if (Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name == "pitch") {
                       if (!instrument.isNoiseInstrument) {
                           buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeStart >> 6], base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeStart & 0x3f]);
                           buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeEnd >> 6], base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeEnd & 0x3f]);
                       } else {
                           buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeStart]);
                           buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].pitchEnvelopeEnd]);
                       }
                       //random
                   } else if (Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name == "random") {
                       buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].steps]);
                       buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].seed]);
                       buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].waveform]);
                       //lfo
                   } else if (Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name == "lfo") {
                       buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].waveform]);
                       if (instrument.envelopes[envelopeIndex].waveform == LFOEnvelopeTypes.steppedSaw || instrument.envelopes[envelopeIndex].waveform == LFOEnvelopeTypes.steppedTri) {
                           buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].steps]);
                       }
                   }
                   //inverse
                   let checkboxValues: number = +instrument.envelopes[envelopeIndex].discrete;
                   checkboxValues = checkboxValues << 1;
                   checkboxValues += +instrument.envelopes[envelopeIndex].inverse;
                   buffer.push(base64IntToCharCode[checkboxValues] ? base64IntToCharCode[checkboxValues] : base64IntToCharCode[0]);
                   //midbox envelope port
                   if (Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name != "pitch" && Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name != "note size" && Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name != "punch" && Config.newEnvelopes[instrument.envelopes[envelopeIndex].envelope].name != "none") {
                       buffer.push(base64IntToCharCode[Config.perEnvelopeSpeedToIndices[instrument.envelopes[envelopeIndex].perEnvelopeSpeed]]);
                   }
                   buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].perEnvelopeLowerBound * 10]);
                   buffer.push(base64IntToCharCode[instrument.envelopes[envelopeIndex].perEnvelopeUpperBound * 10]);
               }
           }
       }

       buffer.push(SongTagCode.bars);
       bits = new BitFieldWriter();
       let neededBits: number = 0;
       while ((1 << neededBits) < this.patternsPerChannel + 1) neededBits++;
       for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) for (let i: number = 0; i < this.barCount; i++) {
           bits.write(neededBits, this.channels[channelIndex].bars[i]);
       }
       bits.encodeBase64(buffer);

       buffer.push(SongTagCode.patterns);
       bits = new BitFieldWriter();
       const shapeBits: BitFieldWriter = new BitFieldWriter();
       const bitsPerNoteSize: number = Song.getNeededBits(Config.noteSizeMax);
       for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
           const channel: Channel = this.channels[channelIndex];
           const maxInstrumentsPerPattern: number = this.getMaxInstrumentsPerPattern(channelIndex);
           const isNoiseChannel: boolean = this.getChannelIsNoise(channelIndex);
           const isModChannel: boolean = this.getChannelIsMod(channelIndex);
           const neededInstrumentCountBits: number = Song.getNeededBits(maxInstrumentsPerPattern - Config.instrumentCountMin);
           const neededInstrumentIndexBits: number = Song.getNeededBits(channel.instruments.length - 1);

           // Some info about modulator settings immediately follows in mod channels.
           if (isModChannel) {
               const neededModInstrumentIndexBits: number = Song.getNeededBits(this.getMaxInstrumentsPerChannel() + 2);
               for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {

                   let instrument: Instrument = this.channels[channelIndex].instruments[instrumentIndex];

                   for (let mod: number = 0; mod < Config.modCount; mod++) {
                       const modChannel: number = instrument.modChannels[mod];
                       const modInstrument: number = instrument.modInstruments[mod];
                       const modSetting: number = instrument.modulators[mod];
                       const modFilter: number = instrument.modFilterTypes[mod];
                       const modEnvelope: number = instrument.modEnvelopeNumbers[mod];

                       // Still using legacy "mod status" format, but doing it manually as it's only used in the URL now.
                       // 0 - For pitch/noise
                       // 1 - (used to be For noise, not needed)
                       // 2 - For song
                       // 3 - None

                       let status: number = Config.modulators[modSetting].forSong ? 2 : 0;
                       if (modSetting == Config.modulators.dictionary["none"].index)
                           status = 3;

                       bits.write(2, status);

                       // Channel/Instrument is only used if the status isn't "song" or "none".
                       if (status == 0 || status == 1) {
                           bits.write(8, modChannel);
                           bits.write(neededModInstrumentIndexBits, modInstrument);
                       }

                       // Only used if setting isn't "none".
                       if (status != 3) {
                           bits.write(6, modSetting);
                       }

                       // Write mod filter info, only if this is a filter mod
                       if (Config.modulators[instrument.modulators[mod]].name == "eq filter" || Config.modulators[instrument.modulators[mod]].name == "note filter" || Config.modulators[instrument.modulators[mod]].name == "song eq") {
                           bits.write(6, modFilter);
                       }

                       //write envelope info only if needed
                       if (Config.modulators[instrument.modulators[mod]].name == "individual envelope speed" ||
                           Config.modulators[instrument.modulators[mod]].name == "reset envelope" ||
                           Config.modulators[instrument.modulators[mod]].name == "individual envelope lower bound" ||
                           Config.modulators[instrument.modulators[mod]].name == "individual envelope upper bound"
                       ) {
                           bits.write(6, modEnvelope);
                       }
                   }
               }
           }
           const octaveOffset: number = (isNoiseChannel || isModChannel) ? 0 : channel.octave * Config.pitchesPerOctave;
           let lastPitch: number = isModChannel ? 0 : (isNoiseChannel ? 4 : octaveOffset);
           const recentPitches: number[] = isModChannel ? [0, 1, 2, 3, 4, 5] : (isNoiseChannel ? [4, 6, 7, 2, 3, 8, 0, 10] : [0, 7, 12, 19, 24, -5, -12]);
           const recentShapes: string[] = [];
           for (let i: number = 0; i < recentPitches.length; i++) {
               recentPitches[i] += octaveOffset;
           }
           for (const pattern of channel.patterns) {
               if (this.patternInstruments) {
                   const instrumentCount: number = validateRange(Config.instrumentCountMin, maxInstrumentsPerPattern, pattern.instruments.length);
                   bits.write(neededInstrumentCountBits, instrumentCount - Config.instrumentCountMin);
                   for (let i: number = 0; i < instrumentCount; i++) {
                       bits.write(neededInstrumentIndexBits, pattern.instruments[i]);
                   }
               }

               if (pattern.notes.length > 0) {
                   bits.write(1, 1);

                   let curPart: number = 0;
                   for (const note of pattern.notes) {

                       // For mod channels, a negative offset may be necessary.
                       if (note.start < curPart && isModChannel) {
                           bits.write(2, 0); // rest, then...
                           bits.write(1, 1); // negative offset
                           bits.writePartDuration(curPart - note.start);
                       }

                       if (note.start > curPart) {
                           bits.write(2, 0); // rest
                           if (isModChannel) bits.write(1, 0); // positive offset, only needed for mod channels
                           bits.writePartDuration(note.start - curPart);
                       }

                       shapeBits.clear();

                       // Old format was:
                       // 0: 1 pitch, 10: 2 pitches, 110: 3 pitches, 111: 4 pitches
                       // New format is:
                       //      0: 1 pitch
                       // 1[XXX]: 3 bits of binary signifying 2+ pitches
                       if (note.pitches.length == 1) {
                           shapeBits.write(1, 0);
                       } else {
                           shapeBits.write(1, 1);
                           shapeBits.write(3, note.pitches.length - 2);
                       }

                       shapeBits.writePinCount(note.pins.length - 1);

                       if (!isModChannel) {
                           shapeBits.write(bitsPerNoteSize, note.pins[0].size); // volume
                       }
                       else {
                           shapeBits.write(9, note.pins[0].size); // Modulator value. 9 bits for now = 512 max mod value?
                       }

                       let shapePart: number = 0;
                       let startPitch: number = note.pitches[0];
                       let currentPitch: number = startPitch;
                       const pitchBends: number[] = [];
                       for (let i: number = 1; i < note.pins.length; i++) {
                           const pin: NotePin = note.pins[i];
                           const nextPitch: number = startPitch + pin.interval;
                           if (currentPitch != nextPitch) {
                               shapeBits.write(1, 1);
                               pitchBends.push(nextPitch);
                               currentPitch = nextPitch;
                           } else {
                               shapeBits.write(1, 0);
                           }
                           shapeBits.writePartDuration(pin.time - shapePart);
                           shapePart = pin.time;
                           if (!isModChannel) {
                               shapeBits.write(bitsPerNoteSize, pin.size);
                           } else {
                               shapeBits.write(9, pin.size);
                           }
                       }

                       const shapeString: string = String.fromCharCode.apply(null, shapeBits.encodeBase64([]));
                       const shapeIndex: number = recentShapes.indexOf(shapeString);
                       if (shapeIndex == -1) {
                           bits.write(2, 1); // new shape
                           bits.concat(shapeBits);
                       } else {
                           bits.write(1, 1); // old shape
                           bits.writeLongTail(0, 0, shapeIndex);
                           recentShapes.splice(shapeIndex, 1);
                       }
                       recentShapes.unshift(shapeString);
                       if (recentShapes.length > 10) recentShapes.pop();

                       const allPitches: number[] = note.pitches.concat(pitchBends);
                       for (let i: number = 0; i < allPitches.length; i++) {
                           const pitch: number = allPitches[i];
                           const pitchIndex: number = recentPitches.indexOf(pitch);
                           if (pitchIndex == -1) {
                               let interval: number = 0;
                               let pitchIter: number = lastPitch;
                               if (pitchIter < pitch) {
                                   while (pitchIter != pitch) {
                                       pitchIter++;
                                       if (recentPitches.indexOf(pitchIter) == -1) interval++;
                                   }
                               } else {
                                   while (pitchIter != pitch) {
                                       pitchIter--;
                                       if (recentPitches.indexOf(pitchIter) == -1) interval--;
                                   }
                               }
                               bits.write(1, 0);
                               bits.writePitchInterval(interval);
                           } else {
                               bits.write(1, 1);
                               bits.write(4, pitchIndex);
                               recentPitches.splice(pitchIndex, 1);
                           }
                           recentPitches.unshift(pitch);
                           if (recentPitches.length > 16) recentPitches.pop();

                           if (i == note.pitches.length - 1) {
                               lastPitch = note.pitches[0];
                           } else {
                               lastPitch = pitch;
                           }
                       }

                       if (note.start == 0) {
                           bits.write(1, note.continuesLastPattern ? 1 : 0);
                       }

                       curPart = note.end;
                   }

                   if (curPart < this.beatsPerBar * Config.partsPerBeat + (+isModChannel)) {
                       bits.write(2, 0); // rest
                       if (isModChannel) bits.write(1, 0); // positive offset
                       bits.writePartDuration(this.beatsPerBar * Config.partsPerBeat + (+isModChannel) - curPart);
                   }
               } else {
                   bits.write(1, 0);
               }
           }
       }
       let stringLength: number = bits.lengthBase64();
       let digits: number[] = [];
       while (stringLength > 0) {
           digits.unshift(base64IntToCharCode[stringLength & 0x3f]);
           stringLength = stringLength >> 6;
       }
       buffer.push(base64IntToCharCode[digits.length]);
       Array.prototype.push.apply(buffer, digits); // append digits to buffer.
       bits.encodeBase64(buffer);

       const maxApplyArgs: number = 64000;
       let customSamplesStr = "";
       if (EditorConfig.customSamples != undefined && EditorConfig.customSamples.length > 0) {
           customSamplesStr = "|" + EditorConfig.customSamples.join("|")

       }
       //samplemark
       if (buffer.length < maxApplyArgs) {
           // Note: Function.apply may break for long argument lists. 
           return String.fromCharCode.apply(null, buffer) + customSamplesStr;
           //samplemark
       } else {
           let result: string = "";
           for (let i: number = 0; i < buffer.length; i += maxApplyArgs) {
               result += String.fromCharCode.apply(null, buffer.slice(i, i + maxApplyArgs));
           }
           return result + customSamplesStr;
           //samplemark
       }
   }

   private static _envelopeFromLegacyIndex(legacyIndex: number): Envelope {
       // I swapped the order of "custom"/"steady", now "none"/"note size".
       if (legacyIndex == 0) legacyIndex = 1; else if (legacyIndex == 1) legacyIndex = 0;
       return Config.envelopes[clamp(0, Config.envelopes.length, legacyIndex)];
   }

   public fromBase64String(compressed: string, jsonFormat: string = "auto"): void {
       if (compressed == null || compressed == "") {
           Song._clearSamples();

           this.initToDefault(true);
           return;
       }
       let charIndex: number = 0;
       // skip whitespace.
       while (compressed.charCodeAt(charIndex) <= CharCode.SPACE) charIndex++;
       // skip hash mark.
       if (compressed.charCodeAt(charIndex) == CharCode.HASH) charIndex++;
       // if it starts with curly brace, treat it as JSON.
       if (compressed.charCodeAt(charIndex) == CharCode.LEFT_CURLY_BRACE) {
           this.fromJsonObject(JSON.parse(charIndex == 0 ? compressed : compressed.substring(charIndex)), jsonFormat);
           return;
       }

       const variantTest: number = compressed.charCodeAt(charIndex);
       //I cleaned up these boolean setters with an initial value. Idk why this wasn't done earlier...
       let fromBeepBox: boolean = false;
       let fromJummBox: boolean = false;
       let fromGoldBox: boolean = false;
       let fromUltraBox: boolean = false;
       let fromSlarmoosBox: boolean = false;
       let fromSomethingBox: boolean = false;
       // let fromMidbox: boolean;
       // let fromDogebox2: boolean;
       // let fromAbyssBox: boolean;

       // Detect variant here. If version doesn't match known variant, assume it is a vanilla string which does not report variant.
       if (variantTest == 0x6A) { //"j"
           fromJummBox = true;
           charIndex++;
       } else if (variantTest == 0x67) { //"g"
           fromGoldBox = true;
           charIndex++;
       } else if (variantTest == 0x75) { //"u"
           fromUltraBox = true;
           charIndex++;
       } else if (variantTest == 0x64) { //"d" 
           fromJummBox = true;
           // to-do: add explicit dogebox2 support
           //fromDogeBox2 = true;
           charIndex++;
       } else if (variantTest == 0x61) { //"a" Abyssbox does urls the same as ultrabox //not quite anymore, but oh well
           fromUltraBox = true;
           charIndex++;
       } else if (variantTest == 0x73) { //"s"
           fromSlarmoosBox = true
           charIndex++;
       } else if (variantTest == 0x62) { // "b"
           fromSomethingBox = true;
           charIndex++;
       } else {
           fromBeepBox = true;
       }

       const version: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
       if (fromBeepBox && (version == -1 || version > Song._latestBeepboxVersion || version < Song._oldestBeepboxVersion)) return;
       if (fromJummBox && (version == -1 || version > Song._latestJummBoxVersion || version < Song._oldestJummBoxVersion)) return;
       if (fromGoldBox && (version == -1 || version > Song._latestGoldBoxVersion || version < Song._oldestGoldBoxVersion)) return;
       if (fromUltraBox && (version == -1 || version > Song._latestUltraBoxVersion || version < Song._oldestUltraBoxVersion)) return;
       if (fromSlarmoosBox && (version == -1 || version > Song._latestSlarmoosBoxVersion || version < Song._oldestSlarmoosBoxVersion)) return;
       if (fromSomethingBox && (version == -1 || version > Song._latestSomethingBoxVersion || version < Song._oldestSomethingBoxVersion)) return;
       const beforeTwo: boolean = version < 2;
       const beforeThree: boolean = version < 3;
       const beforeFour: boolean = version < 4;
       const beforeFive: boolean = version < 5;
       const beforeSix: boolean = version < 6;
       const beforeSeven: boolean = version < 7;
       const beforeEight: boolean = version < 8;
       const beforeNine: boolean = version < 9;
       this.initToDefault((fromBeepBox && beforeNine) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)));
       const forceSimpleFilter: boolean = (fromBeepBox && beforeNine || fromJummBox && beforeFive);

       let willLoadLegacySamplesForOldSongs: boolean = false;

       if (fromSlarmoosBox || fromUltraBox || fromGoldBox) {
           compressed = compressed.replaceAll("%7C", "|")
           var compressed_array = compressed.split("|");
           compressed = compressed_array.shift()!;
           if (EditorConfig.customSamples == null || EditorConfig.customSamples.join(", ") != compressed_array.join(", ")) {

               Song._restoreChipWaveListToDefault();

               let willLoadLegacySamples = false;
               let willLoadNintariboxSamples = false;
               let willLoadMarioPaintboxSamples = false;
               const customSampleUrls: string[] = [];
               const customSamplePresets: Preset[] = [];
               sampleLoadingState.statusTable = {};
               sampleLoadingState.urlTable = {};
               sampleLoadingState.totalSamples = 0;
               sampleLoadingState.samplesLoaded = 0;
               sampleLoadEvents.dispatchEvent(new SampleLoadedEvent(
                   sampleLoadingState.totalSamples,
                   sampleLoadingState.samplesLoaded
               ));
               for (const url of compressed_array) {
                   if (url.toLowerCase() === "legacysamples") {
                       if (!willLoadLegacySamples) {
                           willLoadLegacySamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(0);
                       }
                   }
                   else if (url.toLowerCase() === "nintariboxsamples") {
                       if (!willLoadNintariboxSamples) {
                           willLoadNintariboxSamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(1);
                       }
                   }
                   else if (url.toLowerCase() === "mariopaintboxsamples") {
                       if (!willLoadMarioPaintboxSamples) {
                           willLoadMarioPaintboxSamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(2);
                       }
                   }

                   else {
                       // UB version 2 URLs and below will be using the old syntax, so we do need to parse it in that case.
                       // UB version 3 URLs should only have the new syntax, though, unless the user has edited the URL manually.
                       const parseOldSyntax: boolean = beforeThree;
                       const ok: boolean = Song._parseAndConfigureCustomSample(url, customSampleUrls, customSamplePresets, sampleLoadingState, parseOldSyntax);
                       if (!ok) {
                           continue;
                       }
                   }
               }
               if (customSampleUrls.length > 0) {
                   EditorConfig.customSamples = customSampleUrls;
               }
               if (customSamplePresets.length > 0) {
                   const customSamplePresetsMap: DictionaryArray<Preset> = toNameMap(customSamplePresets);
                   EditorConfig.presetCategories[EditorConfig.presetCategories.length] = {
                       name: "Custom Sample Presets",
                       presets: customSamplePresetsMap,
                       index: EditorConfig.presetCategories.length,
                   };
                   // EditorConfig.presetCategories.splice(1, 0, {
                   // name: "Custom Sample Presets",
                   // presets: customSamplePresets,
                   // index: EditorConfig.presetCategories.length,
                   // });
               }


           }
           //samplemark
       }

       if (beforeThree && fromBeepBox) {
           // Originally, the only instrument transition was "instant" and the only drum wave was "retro".
           for (const channel of this.channels) {
               channel.instruments[0].transition = Config.transitions.dictionary["interrupt"].index;
               channel.instruments[0].effects |= 1 << EffectType.transition;
           }
           this.channels[3].instruments[0].chipNoise = 0;
       }

       let legacySettingsCache: LegacySettings[][] | null = null;
       if ((fromBeepBox && beforeNine) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
           // Unfortunately, old versions of BeepBox had a variety of different ways of saving
           // filter-and-envelope-related parameters in the URL, and none of them directly
           // correspond to the new way of saving these parameters. We can approximate the old
           // settings by collecting all the old settings for an instrument and passing them to
           // convertLegacySettings(), so I use this data structure to collect the settings
           // for each instrument if necessary.
           legacySettingsCache = [];
           for (let i: number = legacySettingsCache.length; i < this.getChannelCount(); i++) {
               legacySettingsCache[i] = [];
               for (let j: number = 0; j < Config.instrumentCountMin; j++) legacySettingsCache[i][j] = {};
           }
       }

       let legacyGlobalReverb: number = 0; // beforeNine reverb was song-global, record that reverb here and adapt it to instruments as needed.

       let instrumentChannelIterator: number = 0;
       let instrumentIndexIterator: number = -1;
       let command: number;
       let useSlowerArpSpeed: boolean = false;
       let useFastTwoNoteArp: boolean = false;
       while (charIndex < compressed.length) switch (command = compressed.charCodeAt(charIndex++)) {
           case SongTagCode.songTitle: {
               // Length of song name string
               var songNameLength = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               this.title = decodeURIComponent(compressed.substring(charIndex, charIndex + songNameLength));
               document.title = this.title + " - " + EditorConfig.versionDisplayName;

               charIndex += songNameLength;
           } break;
           case SongTagCode.channelCount: {
               if (fromSomethingBox) {
                   // SomethingBox format: read total count, then each channel's type.
                   const totalChannels =
                       base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   this.channels.length = 0;
                   for (let i = 0; i < totalChannels; i++) {
                       const channelType = base64CharCodeToInt[
                           compressed.charCodeAt(charIndex++)
                       ] as ChannelType;
                       this.channels.push(new Channel(channelType));
                   }
               } else {
                   // Legacy format for all other mods: read fixed counts.
                   const pitchCount = validateRange(
                       Config.pitchChannelCountMin,
                       Config.pitchChannelCountMax,
                       base64CharCodeToInt[compressed.charCodeAt(charIndex++)]
                   );
                   const noiseCount = validateRange(
                       Config.noiseChannelCountMin,
                       Config.noiseChannelCountMax,
                       base64CharCodeToInt[compressed.charCodeAt(charIndex++)]
                   );
                   let modCount = 0;
                   if (!fromBeepBox && !(fromJummBox && beforeTwo)) {
                       modCount = validateRange(
                           Config.modChannelCountMin,
                           Config.modChannelCountMax,
                           base64CharCodeToInt[compressed.charCodeAt(charIndex++)]
                       );
                   }
           
                   this.channels.length = 0;
                   for (let i = 0; i < pitchCount; i++)
                       this.channels.push(new Channel(ChannelType.Pitch));
                   for (let i = 0; i < noiseCount; i++)
                       this.channels.push(new Channel(ChannelType.Noise));
                   for (let i = 0; i < modCount; i++)
                       this.channels.push(new Channel(ChannelType.Mod));
                   // This legacy cache setup is ONLY needed for old formats.
                   if ((fromBeepBox && beforeNine) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                       for (let i: number = legacySettingsCache!.length; i < this.getChannelCount(); i++) {
                           legacySettingsCache![i] = [];
                           for (let j: number = 0; j < Config.instrumentCountMin; j++) legacySettingsCache![i][j] = {};
                       }
                   }
               }
           } break;
           case SongTagCode.scale: {
               this.scale = clamp(0, Config.scales.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               // All the scales were jumbled around by Jummbox. Just convert to free.
               if (this.scale == Config.scales["dictionary"]["Custom"].index) {
                   for (var i = 1; i < Config.pitchesPerOctave; i++) {
                       this.scaleCustom[i] = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] == 1; // ineffiecent? yes, all we're going to do for now? hell yes
                   }
               }
               if (fromBeepBox) this.scale = 0;
           } break;
           case SongTagCode.key: {
               if (beforeSeven && fromBeepBox) {
                   this.key = clamp(0, Config.keys.length, 11 - base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   this.octave = 0;
               } else if (fromBeepBox || fromJummBox) {
                   this.key = clamp(0, Config.keys.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   this.octave = 0;
               } else if (fromGoldBox || (beforeThree && fromUltraBox)) {
                   // GoldBox (so far) didn't introduce any new keys, but old
                   // songs made with early versions of UltraBox share the
                   // same URL format, and those can have more keys. This
                   // shouldn't really result in anything other than 0-11 for
                   // the key and 0 for the octave for GoldBox songs.
                   const rawKeyIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const [key, octave]: [number, number] = convertLegacyKeyToKeyAndOctave(rawKeyIndex);
                   this.key = key;
                   this.octave = octave;
               } else {
                   this.key = clamp(0, Config.keys.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   this.octave = clamp(Config.octaveMin, Config.octaveMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + Config.octaveMin);
               }
           } break;
           case SongTagCode.loopStart: {
               if (beforeFive && fromBeepBox) {
                   this.loopStart = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               } else {
                   this.loopStart = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               }
           } break;
           case SongTagCode.loopEnd: {
               if (beforeFive && fromBeepBox) {
                   this.loopLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               } else {
                   this.loopLength = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
               }
           } break;
           case SongTagCode.tempo: {
               if (beforeFour && fromBeepBox) {
                   this.tempo = [95, 120, 151, 190][base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
               } else if (beforeSeven && fromBeepBox) {
                   this.tempo = [88, 95, 103, 111, 120, 130, 140, 151, 163, 176, 190, 206, 222, 240, 259][base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
               } else {
                   this.tempo = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
               this.tempo = clamp(Config.tempoMin, Config.tempoMax + 1, this.tempo);
           } break;
           case SongTagCode.reverb: {
               if (beforeNine && fromBeepBox) {
                   legacyGlobalReverb = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 12;
                   legacyGlobalReverb = clamp(0, Config.reverbRange, legacyGlobalReverb);
               } else if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   legacyGlobalReverb = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   legacyGlobalReverb = clamp(0, Config.reverbRange, legacyGlobalReverb);
               } else {
                   // Do nothing, BeepBox v9+ do not support song-wide reverb - JummBox still does via modulator.
               }
           } break;
           case SongTagCode.beatCount: {
               if (beforeThree && fromBeepBox) {
                   this.beatsPerBar = [6, 7, 8, 9, 10][base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
               } else {
                   this.beatsPerBar = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
               }
               this.beatsPerBar = Math.max(Config.beatsPerBarMin, Math.min(Config.beatsPerBarMax, this.beatsPerBar));
           } break;
           case SongTagCode.barCount: {
               const barCount: number = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
               this.barCount = validateRange(Config.barCountMin, Config.barCountMax, barCount);
               for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                   for (let bar = this.channels[channelIndex].bars.length; bar < this.barCount; bar++) {
                       this.channels[channelIndex].bars[bar] = (bar < 4) ? 1 : 0;
                   }
                   this.channels[channelIndex].bars.length = this.barCount;
               }
           } break;
           case SongTagCode.patternCount: {
               let patternsPerChannel: number;
               if (beforeEight && fromBeepBox) {
                   patternsPerChannel = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
               } else {
                   patternsPerChannel = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1;
               }
               this.patternsPerChannel = validateRange(1, Config.barCountMax, patternsPerChannel);
               const channelCount: number = this.getChannelCount();
               for (let channelIndex: number = 0; channelIndex < channelCount; channelIndex++) {
                   const patterns: Pattern[] = this.channels[channelIndex].patterns;
                   for (let pattern = patterns.length; pattern < this.patternsPerChannel; pattern++) {
                       patterns[pattern] = new Pattern();
                   }
                   patterns.length = this.patternsPerChannel;
               }
           } break;
           case SongTagCode.instrumentCount: {
               if (fromSomethingBox) {
                   const instrumentsFlagBits: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   this.layeredInstruments = (instrumentsFlagBits & (1 << 1)) != 0;
                   this.patternInstruments = (instrumentsFlagBits & (1 << 0)) != 0;
                                      // Always loop through channels to ensure instruments are created.
                                      for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                                          let instrumentCount: number = 1; // Default to 1 instrument per channel.
                                          if (this.layeredInstruments || this.patternInstruments) {
                                              // If flags are true, read the real count from the data stream.
                                              instrumentCount = validateRange(Config.instrumentCountMin, this.getMaxInstrumentsPerChannel(), base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + Config.instrumentCountMin);
                                          }
                                          const channel: Channel = this.channels[channelIndex];
                                          const isNoiseChannel: boolean = channel.type === ChannelType.Noise;
                                          const isModChannel: boolean = channel.type === ChannelType.Mod;
                                          for (let i: number = channel.instruments.length; i < instrumentCount; i++) {
                                              channel.instruments[i] = new Instrument(isNoiseChannel, isModChannel);
                                          }
                                          channel.instruments.length = instrumentCount;
                                       }
                                       } else { // All legacy formats
                       const instrumentsPerChannel: number = validateRange(Config.instrumentCountMin, Config.patternInstrumentCountMax, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + Config.instrumentCountMin);
                       this.layeredInstruments = false;
                       this.patternInstruments = (instrumentsPerChannel > 1);

                       for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                           const isNoiseChannel: boolean = this.getChannelIsNoise(channelIndex);
                           const isModChannel: boolean = this.getChannelIsMod(channelIndex);

                           for (let instrumentIndex: number = this.channels[channelIndex].instruments.length; instrumentIndex < instrumentsPerChannel; instrumentIndex++) {
                               this.channels[channelIndex].instruments[instrumentIndex] = new Instrument(isNoiseChannel, isModChannel);
                           }
                           this.channels[channelIndex].instruments.length = instrumentsPerChannel;
                           if (beforeSix && fromBeepBox) {
                               for (let instrumentIndex: number = 0; instrumentIndex < instrumentsPerChannel; instrumentIndex++) {
                                   this.channels[channelIndex].instruments[instrumentIndex].setTypeAndReset(isNoiseChannel ? InstrumentType.noise : InstrumentType.chip, isNoiseChannel, isModChannel);
                               }
                           }

                           for (let j: number = legacySettingsCache![channelIndex].length; j < instrumentsPerChannel; j++) {
                               legacySettingsCache![channelIndex][j] = {};
                           }
                       }
                   }
               
           } break;
           case SongTagCode.rhythm: {
              if (fromSomethingBox) {
                  this.rhythm = clamp(0, Config.rhythms.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
              } else if (!fromUltraBox && !fromSlarmoosBox) {
                   let newRhythm = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   this.rhythm = clamp(0, Config.rhythms.length, newRhythm);
                   if (fromJummBox && beforeThree || fromBeepBox) {
                       if (this.rhythm == Config.rhythms.dictionary["÷3 (triplets)"].index || this.rhythm == Config.rhythms.dictionary["÷6"].index) {
                           useSlowerArpSpeed = true;
                       }
                       if (this.rhythm >= Config.rhythms.dictionary["÷6"].index) {
                           // @TODO: This assumes that 6 and 8 are in that order, but
                           // if someone reorders Config.rhythms that may not be true,
                           // so this check probably should instead look for those
                           // specific rhythms.
                           useFastTwoNoteArp = true;
                       }
                   }
               } else if ((fromSlarmoosBox && beforeFour) || (fromUltraBox && beforeFive)) {
                   const rhythmMap = [1, 1, 0, 1, 2, 3, 4, 5];
                   this.rhythm = clamp(0, Config.rhythms.length, rhythmMap[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]]);
               } else {
                   this.rhythm = clamp(0, Config.rhythms.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
           } break;
           case SongTagCode.channelOctave: {
              if (fromSomethingBox) {
                  this.channels.forEach(channel => {
                      if (channel.type === ChannelType.Pitch) {
                          channel.octave = clamp(0, Config.pitchOctaves, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                      } else {
                          channel.octave = 0;
                      }
                  });
              } else { // All legacy formats
                  if (beforeThree && fromBeepBox) {
                      const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                      this.channels[channelIndex].octave = clamp(0, Config.pitchOctaves, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1);
                      if (this.getChannelIsNoise(channelIndex) || this.getChannelIsMod(channelIndex)) this.channels[channelIndex].octave = 0;
                  } else if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                      for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                          this.channels[channelIndex].octave = clamp(0, Config.pitchOctaves, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1);
                          if (this.getChannelIsNoise(channelIndex) || this.getChannelIsMod(channelIndex)) this.channels[channelIndex].octave = 0;
                      }
                  } else { // Modern non-somethingbox formats
                      for (let channelIndex: number = 0; channelIndex < this.pitchChannelCount; channelIndex++) { // Assumes fixed layout
                          this.channels[channelIndex].octave = clamp(0, Config.pitchOctaves, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                      }
                  }
               }
           } break;
           case SongTagCode.startInstrument: {
               instrumentIndexIterator++;
               if (instrumentIndexIterator >= this.channels[instrumentChannelIterator].instruments.length) {
                   instrumentChannelIterator++;
                   instrumentIndexIterator = 0;
               }
               validateRange(0, this.channels.length - 1, instrumentChannelIterator);
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               // JB before v5 had custom chip and mod before pickedString and supersaw were added. Index +2.
               let instrumentType: number = validateRange(0, InstrumentType.length - 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   if (instrumentType == InstrumentType.pickedString || instrumentType == InstrumentType.supersaw) {
                       instrumentType += 2;
                   }
               }
               // Similar story here, JB before v5 had custom chip and mod before supersaw was added. Index +1.
               else if ((fromJummBox && beforeSix) || (fromGoldBox && !beforeFour) || (fromUltraBox && beforeFive)) {
                   if (instrumentType == InstrumentType.supersaw || instrumentType == InstrumentType.customChipWave || instrumentType == InstrumentType.mod) {
                       instrumentType += 1;
                   }
               }
               instrument.setTypeAndReset(instrumentType, this.getChannelIsNoise(instrumentChannelIterator), this.getChannelIsMod(instrumentChannelIterator));

               // Anti-aliasing was added in BeepBox 3.0 (v6->v7) and JummBox 1.3 (v1->v2 roughly but some leakage possible)
               if (((beforeSeven && fromBeepBox) || (beforeTwo && fromJummBox)) && (instrumentType == InstrumentType.chip || instrumentType == InstrumentType.customChipWave || instrumentType == InstrumentType.pwm)) {
                   instrument.aliases = true;
                   instrument.distortion = 0;
                   instrument.effects |= 1 << EffectType.distortion;
               }
               if (useSlowerArpSpeed) {
                   instrument.arpeggioSpeed = 9; // x3/4 speed. This used to be tied to rhythm, but now it is decoupled to each instrument's arp speed slider. This flag gets set when importing older songs to keep things consistent.
               }
               if (useFastTwoNoteArp) {
                   instrument.fastTwoNoteArp = true;
               }

               if (beforeSeven && fromBeepBox) {
                   // instrument.effects = 0;
                   // Chip/noise instruments had arpeggio and FM had custom interval but neither
                   // explicitly saved the chorus setting beforeSeven so enable it here.
                   if (instrument.chord != Config.chords.dictionary["simultaneous"].index) {
                       // Enable chord if it was used.
                       instrument.effects |= 1 << EffectType.chord;
                   }
               }
           } break;
           case SongTagCode.preset: {
               const presetValue: number = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset = presetValue;
               // Picked string was inserted before custom chip in JB v5, so bump up preset index.
               if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   if (this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset == InstrumentType.pickedString) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset = InstrumentType.customChipWave;
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].type = InstrumentType.customChipWave;
                   }
               }
               // Similar story, supersaw is also before custom chip (and mod, but mods can't have presets).
               else if ((fromJummBox && beforeSix) || (fromUltraBox && beforeFive)) {
                   if (this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset == InstrumentType.supersaw) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset = InstrumentType.customChipWave;
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].type = InstrumentType.customChipWave;
                   }
                   // ultra code for 6-op fm maybe
                   if (this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset == InstrumentType.mod) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset = InstrumentType.fm6op;
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].type = InstrumentType.fm6op;
                   }
               }
               // BeepBox directly tweaked "grand piano", but JB kept it the same. The most up to date version is now "grand piano 3"
               if (fromBeepBox && presetValue == EditorConfig.nameToPresetValue("grand piano 1")) {
                   this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].preset = EditorConfig.nameToPresetValue("grand piano 3")!;
               }
           } break;
           
           case SongTagCode.wave: { // 119, which is the same as SongTagCode.pulseWidth
               const instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];

               // First, handle the very old, self-contained BeepBox legacy formats.
               if (beforeThree && fromBeepBox) {
                   const legacyWaves: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 0];
                   const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const legacyInstrument: Instrument = this.channels[channelIndex].instruments[0];
                   legacyInstrument.chipWave = clamp(0, Config.chipWaves.length, legacyWaves[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]] | 0);
                   legacyInstrument.convertLegacySettings(legacySettingsCache![channelIndex][0], forceSimpleFilter);
               } else if (beforeSix && fromBeepBox) {
                   const legacyWaves: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 0];
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (const legacyInstrument of this.channels[channelIndex].instruments) {
                           if (this.getChannelIsNoise(channelIndex)) {
                               legacyInstrument.chipNoise = clamp(0, Config.chipNoises.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           } else {
                               legacyInstrument.chipWave = clamp(0, Config.chipWaves.length, legacyWaves[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]] | 0);
                           }
                       }
                   }
               } else if (beforeSeven && fromBeepBox) {
                   const legacyWaves: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 0];
                   if (this.getChannelIsNoise(instrumentChannelIterator)) {
                       instrument.chipNoise = clamp(0, Config.chipNoises.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   } else {
                       instrument.chipWave = clamp(0, Config.chipWaves.length, legacyWaves[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]] | 0);
                   }
               } else {
                   // This is the path for all modern formats.
                   if (instrument.type === InstrumentType.noise) {
                       instrument.chipNoise = clamp(0, Config.chipNoises.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   
                   } else if (instrument.type === InstrumentType.pwm || instrument.type === InstrumentType.supersaw) {
                       // This is the logic from the original pulseWidth block.
                       instrument.pulseWidth = clamp(0, Config.pulseWidthRange + (+(fromJummBox)) + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       if (fromBeepBox) {
                           instrument.pulseWidth = Math.round(Math.pow(0.5, (7 - instrument.pulseWidth) * Config.pulseWidthStepPower) * Config.pulseWidthRange);
                       }

                       if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                           const pregoldToEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34, 31, 11];
                           const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                           let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                           legacySettings.pulseEnvelope = Song._envelopeFromLegacyIndex(aa);
                           instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                       }

                       if (fromSomethingBox || (fromUltraBox && !beforeFour) || fromSlarmoosBox) {
                           instrument.decimalOffset = clamp(0, 99 + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }

                   } else {
                       // This is the logic for chip, customChipWave, etc.
                       if (fromSomethingBox || fromSlarmoosBox || fromUltraBox) {
                           const chipWaveReal = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           const chipWaveCounter = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

                           if (chipWaveCounter == 3) {
                               instrument.chipWave = clamp(0, Config.chipWaves.length, chipWaveReal + 186);
                           } else if (chipWaveCounter == 2) {
                               instrument.chipWave = clamp(0, Config.chipWaves.length, chipWaveReal + 124);
                           } else if (chipWaveCounter == 1) {
                               instrument.chipWave = clamp(0, Config.chipWaves.length, chipWaveReal + 62);
                           } else {
                               instrument.chipWave = clamp(0, Config.chipWaves.length, chipWaveReal);
                           }
                       } else {
                           instrument.chipWave = clamp(0, Config.chipWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
               }
           } break;
           
  case SongTagCode.eqFilter: {
       if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
           // This block handles various legacy formats correctly.
           if (beforeSeven && fromBeepBox) {
               const legacyToCutoff: number[] = [10, 6, 3, 0, 8, 5, 2];
               const legacyToEnvelope: string[] = ["none", "none", "none", "none", "decay 1", "decay 2", "decay 3"];

               if (beforeThree && fromBeepBox) {
                   const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const instrument: Instrument = this.channels[channelIndex].instruments[0];
                   const legacySettings: LegacySettings = legacySettingsCache![channelIndex][0];
                   const legacyFilter: number = [1, 3, 4, 5][clamp(0, legacyToCutoff.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                   legacySettings.filterCutoff = legacyToCutoff[legacyFilter];
                   legacySettings.filterResonance = 0;
                   legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyToEnvelope[legacyFilter]];
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               } else if (beforeSix && fromBeepBox) {
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (let i: number = 0; i < this.channels[channelIndex].instruments.length; i++) {
                           const instrument: Instrument = this.channels[channelIndex].instruments[i];
                           const legacySettings: LegacySettings = legacySettingsCache![channelIndex][i];
                           const legacyFilter: number = clamp(0, legacyToCutoff.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 1);
                           if (!this.getChannelIsNoise(channelIndex) && !this.getChannelIsMod(channelIndex)) {
                               legacySettings.filterCutoff = legacyToCutoff[legacyFilter];
                               legacySettings.filterResonance = 0;
                               legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyToEnvelope[legacyFilter]];
                           } else {
                               legacySettings.filterCutoff = 10;
                               legacySettings.filterResonance = 0;
                               legacySettings.filterEnvelope = Config.envelopes.dictionary["none"];
                           }
                           instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                       }
                   }
               } else {
                   const legacyFilter: number = clamp(0, legacyToCutoff.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                   legacySettings.filterCutoff = legacyToCutoff[legacyFilter];
                   legacySettings.filterResonance = 0;
                   legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyToEnvelope[legacyFilter]];
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               }
           } else {
               const filterCutoffRange: number = 11;
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
               legacySettings.filterCutoff = clamp(0, filterCutoffRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
           }
       } else {
           // This block handles all modern formats.
           const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
           let typeCheck: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

           if (fromBeepBox || typeCheck == 0) {
               instrument.eqFilterType = false;
               
               // CORRECTED LOGIC: Read the next byte for ALL modern formats that have it.
               if (fromJummBox || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox) {
                   typeCheck = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               }
               
               const originalControlPointCount: number = typeCheck;
               instrument.eqFilter.controlPointCount = clamp(0, Config.filterMaxPoints + 1, originalControlPointCount);
               for (let i: number = instrument.eqFilter.controlPoints.length; i < instrument.eqFilter.controlPointCount; i++) {
                   instrument.eqFilter.controlPoints[i] = new FilterControlPoint();
               }
               for (let i: number = 0; i < instrument.eqFilter.controlPointCount; i++) {
                   const point: FilterControlPoint = instrument.eqFilter.controlPoints[i];
                   point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
               for (let i: number = instrument.eqFilter.controlPointCount; i < originalControlPointCount; i++) {
                   charIndex += 3;
               }

               instrument.eqSubFilters[0] = instrument.eqFilter;
               if ((fromJummBox && !beforeFive) || (fromGoldBox && !beforeFour) || fromUltraBox || fromSlarmoosBox || fromSomethingBox) {
                   let usingSubFilterBitfield: number = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                       if (usingSubFilterBitfield & (1 << j)) {
                           const originalSubfilterControlPointCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           if (instrument.eqSubFilters[j + 1] == null)
                               instrument.eqSubFilters[j + 1] = new FilterSettings();
                           instrument.eqSubFilters[j + 1]!.controlPointCount = clamp(0, Config.filterMaxPoints + 1, originalSubfilterControlPointCount);
                           for (let i: number = instrument.eqSubFilters[j + 1]!.controlPoints.length; i < instrument.eqSubFilters[j + 1]!.controlPointCount; i++) {
                               instrument.eqSubFilters[j + 1]!.controlPoints[i] = new FilterControlPoint();
                           }
                           for (let i: number = 0; i < instrument.eqSubFilters[j + 1]!.controlPointCount; i++) {
                               const point: FilterControlPoint = instrument.eqSubFilters[j + 1]!.controlPoints[i];
                               point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           }
                           for (let i: number = instrument.eqSubFilters[j + 1]!.controlPointCount; i < originalSubfilterControlPointCount; i++) {
                               charIndex += 3;
                           }
                       }
                   }
               }
           }
           else {
               instrument.eqFilterType = true;
               instrument.eqFilterSimpleCut = clamp(0, Config.filterSimpleCutRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               instrument.eqFilterSimplePeak = clamp(0, Config.filterSimplePeakRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
           }
       }
   } break;
           
  
  case SongTagCode.loopControls: {
       // CORRECTED LOGIC: Read loop controls for all modern formats that write them.
       if (fromSomethingBox || fromSlarmoosBox || fromUltraBox) {
           if (beforeThree && fromUltraBox) {
               // Still have to support the old and bad loop control data format written as a test, sigh.
               const sampleLoopInfoEncodedLength = decode32BitNumber(compressed, charIndex);
               charIndex += 6;
               const sampleLoopInfoEncoded = compressed.slice(charIndex, charIndex + sampleLoopInfoEncodedLength);
               charIndex += sampleLoopInfoEncodedLength;
               interface SampleLoopInfo {
                   isUsingAdvancedLoopControls: boolean;
                   chipWaveLoopStart: number;
                   chipWaveLoopEnd: number;
                   chipWaveLoopMode: number;
                   chipWavePlayBackwards: boolean;
                   chipWaveStartOffset: number;
               }
               interface SampleLoopInfoEntry {
                   channel: number;
                   instrument: number;
                   info: SampleLoopInfo;
               }
               const sampleLoopInfo: SampleLoopInfoEntry[] = JSON.parse(atob(sampleLoopInfoEncoded));
               for (const entry of sampleLoopInfo) {
                   const channelIndex: number = entry["channel"];
                   const instrumentIndex: number = entry["instrument"];
                   const info: SampleLoopInfo = entry["info"];
                   const instrument: Instrument = this.channels[channelIndex].instruments[instrumentIndex];
                   instrument.isUsingAdvancedLoopControls = info["isUsingAdvancedLoopControls"];
                   instrument.chipWaveLoopStart = info["chipWaveLoopStart"];
                   instrument.chipWaveLoopEnd = info["chipWaveLoopEnd"];
                   instrument.chipWaveLoopMode = info["chipWaveLoopMode"];
                   instrument.chipWavePlayBackwards = info["chipWavePlayBackwards"];
                   instrument.chipWaveStartOffset = info["chipWaveStartOffset"];
               }
           } else {
               // Read the new loop control data format.
               const encodedLoopMode: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               const isUsingAdvancedLoopControls: boolean = Boolean(encodedLoopMode & 1);
               const chipWaveLoopMode: number = encodedLoopMode >> 1;
               const encodedReleaseMode: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               const chipWavePlayBackwards: boolean = Boolean(encodedReleaseMode & 1);
               const chipWaveLoopStart: number = decode32BitNumber(compressed, charIndex);
               charIndex += 6;
               const chipWaveLoopEnd: number = decode32BitNumber(compressed, charIndex);
               charIndex += 6;
               const chipWaveStartOffset: number = decode32BitNumber(compressed, charIndex);
               charIndex += 6;
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               instrument.isUsingAdvancedLoopControls = isUsingAdvancedLoopControls;
               instrument.chipWaveLoopStart = chipWaveLoopStart;
               instrument.chipWaveLoopEnd = chipWaveLoopEnd;
               instrument.chipWaveLoopMode = chipWaveLoopMode;
               instrument.chipWavePlayBackwards = chipWavePlayBackwards;
               instrument.chipWaveStartOffset = chipWaveStartOffset;
           }
       }
       else if (fromGoldBox && !beforeFour && beforeSix) {
           if (document.URL.substring(document.URL.length - 13).toLowerCase() != "legacysamples") {
               if (!willLoadLegacySamplesForOldSongs) {
                   willLoadLegacySamplesForOldSongs = true;
                   Config.willReloadForCustomSamples = true;
                   EditorConfig.customSamples = ["legacySamples"];
                   loadBuiltInSamples(0);
               }
           }
           this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].chipWave = clamp(0, Config.chipWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + 125);
       } else if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
           const filterResonanceRange: number = 8;
           const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
           const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
           legacySettings.filterResonance = clamp(0, filterResonanceRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
           instrument.convertLegacySettings(legacySettings, forceSimpleFilter);

       }
   } break;
           case SongTagCode.drumsetEnvelopes: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               const pregoldToEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34, 31, 11];
               if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                   if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) {

                   }
                   if (instrument.type == InstrumentType.drumset) {
                       for (let i: number = 0; i < Config.drumCount; i++) {
                           let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                           instrument.drumsetEnvelopes[i] = Song._envelopeFromLegacyIndex(aa).index;
                       }
                   } else {
                       // This used to be used for general filter envelopes.
                       // The presence of an envelope affects how convertLegacySettings
                       // decides the closest possible approximation, so update it.
                       const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                       let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                       legacySettings.filterEnvelope = Song._envelopeFromLegacyIndex(aa);
                       instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                   }
               } else {
                   // This tag is now only used for drumset filter envelopes.
                   for (let i: number = 0; i < Config.drumCount; i++) {
                       let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                       if (!fromSlarmoosBox && aa >= 2) aa++; //2 for pitch
                       instrument.drumsetEnvelopes[i] = clamp(0, Config.envelopes.length, aa);
                   }
               }
           } break;
           case SongTagCode.pulseWidth: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               instrument.pulseWidth = clamp(0, Config.pulseWidthRange + (+(fromJummBox)) + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               if (fromBeepBox) {
                   // BeepBox formula
                   instrument.pulseWidth = Math.round(Math.pow(0.5, (7 - instrument.pulseWidth) * Config.pulseWidthStepPower) * Config.pulseWidthRange);
               }

               if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                   const pregoldToEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34, 31, 11];
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                   let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                   legacySettings.pulseEnvelope = Song._envelopeFromLegacyIndex(aa);
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               }

               // CORRECTED LOGIC: Read decimalOffset for all modern formats that write it.
               if (fromSomethingBox || (fromUltraBox && !beforeFour) || fromSlarmoosBox) {
                   instrument.decimalOffset = clamp(0, 99 + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }

           } break;

           case SongTagCode.stringSustain: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               const sustainValue: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               instrument.stringSustain = clamp(0, Config.stringSustainRange, sustainValue & 0x1F);
               instrument.stringSustainType = Config.enableAcousticSustain ? clamp(0, SustainType.length, sustainValue >> 5) : SustainType.bright;
           } break;
           
  case SongTagCode.fadeInOut: {
       if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
           // This block handles various legacy formats correctly.
           const legacySettings = [
               { transition: "interrupt", fadeInSeconds: 0.0, fadeOutTicks: -1 },
               { transition: "normal", fadeInSeconds: 0.0, fadeOutTicks: -3 },
               { transition: "normal", fadeInSeconds: 0.025, fadeOutTicks: -3 },
               { transition: "slide in pattern", fadeInSeconds: 0.025, fadeOutTicks: -3 },
               { transition: "normal", fadeInSeconds: 0.04, fadeOutTicks: 6 },
               { transition: "normal", fadeInSeconds: 0.0, fadeOutTicks: 48 },
               { transition: "normal", fadeInSeconds: 0.0125, fadeOutTicks: 72 },
               { transition: "normal", fadeInSeconds: 0.06, fadeOutTicks: 96 },
               { transition: "slide in pattern", fadeInSeconds: 0.025, fadeOutTicks: -3 },
           ];
           if (beforeThree && fromBeepBox) {
               const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               const settings = legacySettings[clamp(0, legacySettings.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
               const instrument: Instrument = this.channels[channelIndex].instruments[0];
               instrument.fadeIn = Synth.secondsToFadeInSetting(settings.fadeInSeconds);
               instrument.fadeOut = Synth.ticksToFadeOutSetting(settings.fadeOutTicks);
               instrument.transition = Config.transitions.dictionary[settings.transition].index;
               if (instrument.transition != Config.transitions.dictionary["normal"].index) {
                   instrument.effects |= 1 << EffectType.transition;
               }
           } else if (beforeSix && fromBeepBox) {
               for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                   for (const instrument of this.channels[channelIndex].instruments) {
                       const settings = legacySettings[clamp(0, legacySettings.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                       instrument.fadeIn = Synth.secondsToFadeInSetting(settings.fadeInSeconds);
                       instrument.fadeOut = Synth.ticksToFadeOutSetting(settings.fadeOutTicks);
                       instrument.transition = Config.transitions.dictionary[settings.transition].index;
                       if (instrument.transition != Config.transitions.dictionary["normal"].index) {
                           instrument.effects |= 1 << EffectType.transition;
                       }
                   }
               }
           } else if ((beforeFour && !fromGoldBox && !fromUltraBox && !fromSlarmoosBox) || fromBeepBox) {
               const settings = legacySettings[clamp(0, legacySettings.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               instrument.fadeIn = Synth.secondsToFadeInSetting(settings.fadeInSeconds);
               instrument.fadeOut = Synth.ticksToFadeOutSetting(settings.fadeOutTicks);
               instrument.transition = Config.transitions.dictionary[settings.transition].index;
               if (instrument.transition != Config.transitions.dictionary["normal"].index) {
                   instrument.effects |= 1 << EffectType.transition;
               }
           } else {
               const settings = legacySettings[clamp(0, legacySettings.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               instrument.fadeIn = Synth.secondsToFadeInSetting(settings.fadeInSeconds);
               instrument.fadeOut = Synth.ticksToFadeOutSetting(settings.fadeOutTicks);
               instrument.transition = Config.transitions.dictionary[settings.transition].index;
               if (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] > 0) {
                   instrument.legacyTieOver = true;
               }
               instrument.clicklessTransition = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] ? true : false;
               if (instrument.transition != Config.transitions.dictionary["normal"].index || instrument.clicklessTransition) {
                   instrument.effects |= 1 << EffectType.transition;
               }
           }
       } else {
           // This block handles all modern formats.
           const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
           instrument.fadeIn = clamp(0, Config.fadeInRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
           instrument.fadeOut = clamp(0, Config.fadeOutTicks.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
           
           // CORRECTED LOGIC: Read the third byte for ALL modern formats that write it.
           if (fromSomethingBox || fromJummBox || fromGoldBox || fromUltraBox || fromSlarmoosBox) {
               instrument.clicklessTransition = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] ? true : false;
           }
       }
   } break;
   
           case SongTagCode.songEq: { //deprecated vibrato tag repurposed for songEq
               if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                   if (beforeSeven && fromBeepBox) {
                       if (beforeThree && fromBeepBox) {
                           const legacyEffects: number[] = [0, 3, 2, 0];
                           const legacyEnvelopes: string[] = ["none", "none", "none", "tremolo2"];
                           const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           const effect: number = clamp(0, legacyEffects.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           const instrument: Instrument = this.channels[channelIndex].instruments[0];
                           const legacySettings: LegacySettings = legacySettingsCache![channelIndex][0];
                           instrument.vibrato = legacyEffects[effect];
                           if (legacySettings.filterEnvelope == undefined || legacySettings.filterEnvelope.type == EnvelopeType.none) {
                               // Imitate the legacy tremolo with a filter envelope.
                               legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyEnvelopes[effect]];
                               instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                           }
                           if (instrument.vibrato != Config.vibratos.dictionary["none"].index) {
                               // Enable vibrato if it was used.
                               instrument.effects |= 1 << EffectType.vibrato;
                           }
                       } else if (beforeSix && fromBeepBox) {
                           const legacyEffects: number[] = [0, 1, 2, 3, 0, 0];
                           const legacyEnvelopes: string[] = ["none", "none", "none", "none", "tremolo5", "tremolo2"];
                           for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                               for (let i: number = 0; i < this.channels[channelIndex].instruments.length; i++) {
                                   const effect: number = clamp(0, legacyEffects.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   const instrument: Instrument = this.channels[channelIndex].instruments[i];
                                   const legacySettings: LegacySettings = legacySettingsCache![channelIndex][i];
                                   instrument.vibrato = legacyEffects[effect];
                                   if (legacySettings.filterEnvelope == undefined || legacySettings.filterEnvelope.type == EnvelopeType.none) {
                                       // Imitate the legacy tremolo with a filter envelope.
                                       legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyEnvelopes[effect]];
                                       instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                                   }
                                   if (instrument.vibrato != Config.vibratos.dictionary["none"].index) {
                                       // Enable vibrato if it was used.
                                       instrument.effects |= 1 << EffectType.vibrato;
                                   }
                                   if ((legacyGlobalReverb != 0 || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) && !this.getChannelIsNoise(channelIndex)) {
                                       // Enable reverb if it was used globaly before. (Global reverb was added before the effects option so I need to pick somewhere else to initialize instrument reverb, and I picked the vibrato command.)
                                       instrument.effects |= 1 << EffectType.reverb;
                                       instrument.reverb = legacyGlobalReverb;
                                   }
                               }
                           }
                       } else {
                           const legacyEffects: number[] = [0, 1, 2, 3, 0, 0];
                           const legacyEnvelopes: string[] = ["none", "none", "none", "none", "tremolo5", "tremolo2"];
                           const effect: number = clamp(0, legacyEffects.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                           const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                           instrument.vibrato = legacyEffects[effect];
                           if (legacySettings.filterEnvelope == undefined || legacySettings.filterEnvelope.type == EnvelopeType.none) {
                               // Imitate the legacy tremolo with a filter envelope.
                               legacySettings.filterEnvelope = Config.envelopes.dictionary[legacyEnvelopes[effect]];
                               instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
                           }
                           if (instrument.vibrato != Config.vibratos.dictionary["none"].index) {
                               // Enable vibrato if it was used.
                               instrument.effects |= 1 << EffectType.vibrato;
                           }
                           if (legacyGlobalReverb != 0 || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                               // Enable reverb if it was used globaly before. (Global reverb was added before the effects option so I need to pick somewhere else to initialize instrument reverb, and I picked the vibrato command.)
                               instrument.effects |= 1 << EffectType.reverb;
                               instrument.reverb = legacyGlobalReverb;
                           }
                       }
                   } else {
                       const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                       const vibrato: number = clamp(0, Config.vibratos.length + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.vibrato = vibrato;
                       if (instrument.vibrato != Config.vibratos.dictionary["none"].index) {
                           // Enable vibrato if it was used.
                           instrument.effects |= 1 << EffectType.vibrato;
                       }
                       // Custom vibrato
                       if (vibrato == Config.vibratos.length) {
                           instrument.vibratoDepth = clamp(0, Config.modulators.dictionary["vibrato depth"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) / 50;
                           instrument.vibratoSpeed = clamp(0, Config.modulators.dictionary["vibrato speed"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.vibratoDelay = clamp(0, Config.modulators.dictionary["vibrato delay"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) / 2;
                           instrument.vibratoType = clamp(0, Config.vibratoTypes.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.effects |= 1 << EffectType.vibrato;
                       }
                       // Enforce standard vibrato settings
                       else {
                           instrument.vibratoDepth = Config.vibratos[instrument.vibrato].amplitude;
                           instrument.vibratoSpeed = 10; // Normal speed
                           instrument.vibratoDelay = Config.vibratos[instrument.vibrato].delayTicks / 2;
                           instrument.vibratoType = Config.vibratos[instrument.vibrato].type;
                       }
                   }
               } else {
                   // songeq
                  const originalControlPointCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                  this.eqFilter.controlPointCount = clamp(0, Config.filterMaxPoints + 1, originalControlPointCount);
                  for (let i: number = this.eqFilter.controlPoints.length; i < this.eqFilter.controlPointCount; i++) {
                      this.eqFilter.controlPoints[i] = new FilterControlPoint();
                  }
                  for (let i: number = 0; i < this.eqFilter.controlPointCount; i++) {
                      const point: FilterControlPoint = this.eqFilter.controlPoints[i];
                      point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                      point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                      point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                  }
                  for (let i: number = this.eqFilter.controlPointCount; i < originalControlPointCount; i++) {
                      charIndex += 3;
                  }

                  // Get subfilters as well. Skip Index 0, is a copy of the base filter.
                  this.eqSubFilters[0] = this.eqFilter;

                  // CORRECTED LOGIC: Read subfilters for all modern formats that support them.
                  if (fromSomethingBox || (fromSlarmoosBox && !beforeFour)) {
                      let usingSubFilterBitfield: number = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                      for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                          if (usingSubFilterBitfield & (1 << j)) {
                              const originalSubfilterControlPointCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                              if (this.eqSubFilters[j + 1] == null)
                                  this.eqSubFilters[j + 1] = new FilterSettings();
                              this.eqSubFilters[j + 1]!.controlPointCount = clamp(0, Config.filterMaxPoints + 1, originalSubfilterControlPointCount);
                              for (let i: number = this.eqSubFilters[j + 1]!.controlPoints.length; i < this.eqSubFilters[j + 1]!.controlPointCount; i++) {
                                  this.eqSubFilters[j + 1]!.controlPoints[i] = new FilterControlPoint();
                              }
                              for (let i: number = 0; i < this.eqSubFilters[j + 1]!.controlPointCount; i++) {
                                  const point: FilterControlPoint = this.eqSubFilters[j + 1]!.controlPoints[i];
                                  point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                  point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                  point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                              }
                              for (let i: number = this.eqSubFilters[j + 1]!.controlPointCount; i < originalSubfilterControlPointCount; i++) {
                                  charIndex += 3;
                              }
                          }
                      }
                  }
              }
          } break;
           case SongTagCode.arpeggioSpeed: {
               // Deprecated, but supported for legacy purposes
               if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.arpeggioSpeed = clamp(0, Config.modulators.dictionary["arp speed"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.fastTwoNoteArp = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] ? true : false; // Two note arp setting piggybacks on this
               }
               else {
                   // Do nothing, deprecated for now
               }
           } break;
           case SongTagCode.unison: {
               if (beforeThree && fromBeepBox) {
                   const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const instrument = this.channels[channelIndex].instruments[0];
                   instrument.unison = clamp(0, Config.unisons.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.unisonVoices = Config.unisons[instrument.unison].voices;
                   instrument.unisonSpread = Config.unisons[instrument.unison].spread;
                   instrument.unisonOffset = Config.unisons[instrument.unison].offset;
                   instrument.unisonExpression = Config.unisons[instrument.unison].expression;
                   instrument.unisonSign = Config.unisons[instrument.unison].sign;
               } else if (beforeSix && fromBeepBox) {
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (const instrument of this.channels[channelIndex].instruments) {
                           const originalValue: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           let unison: number = clamp(0, Config.unisons.length, originalValue);
                           if (originalValue == 8) {
                               // original "custom harmony" now maps to "hum" and "custom interval".
                               unison = 2;
                               instrument.chord = 3;
                           }
                           instrument.unison = unison;
                           instrument.unisonVoices = Config.unisons[instrument.unison].voices;
                           instrument.unisonSpread = Config.unisons[instrument.unison].spread;
                           instrument.unisonOffset = Config.unisons[instrument.unison].offset;
                           instrument.unisonExpression = Config.unisons[instrument.unison].expression;
                           instrument.unisonSign = Config.unisons[instrument.unison].sign;
                       }
                   }
               } else if (beforeSeven && fromBeepBox) {
                   const originalValue: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   let unison: number = clamp(0, Config.unisons.length, originalValue);
                   const instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   if (originalValue == 8) {
                       // original "custom harmony" now maps to "hum" and "custom interval".
                       unison = 2;
                       instrument.chord = 3;
                   }
                   instrument.unison = unison;
                   instrument.unisonVoices = Config.unisons[instrument.unison].voices;
                   instrument.unisonSpread = Config.unisons[instrument.unison].spread;
                   instrument.unisonOffset = Config.unisons[instrument.unison].offset;
                   instrument.unisonExpression = Config.unisons[instrument.unison].expression;
                   instrument.unisonSign = Config.unisons[instrument.unison].sign;
               } else {
                   const instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.unison = clamp(0, Config.unisons.length + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   const unisonLength = (beforeFive || !fromSlarmoosBox) ? 27 : Config.unisons.length; //27 was the old length before I added >2 voice presets
                   if (((fromUltraBox && !beforeFive) || fromSlarmoosBox) && (instrument.unison == unisonLength)) {
                       // if (instrument.unison == Config.unisons.length) {
                       instrument.unison = Config.unisons.length;
                       instrument.unisonVoices = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

                       const unisonSpreadNegative = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       const unisonSpread: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 63)) * 63);

                       const unisonOffsetNegative = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       const unisonOffset: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 63)) * 63);

                       const unisonExpressionNegative = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       const unisonExpression: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 63);

                       const unisonSignNegative = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       const unisonSign: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] + (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 63);


                       instrument.unisonSpread = unisonSpread / 1000;
                       if (unisonSpreadNegative == 0) instrument.unisonSpread *= -1;

                       instrument.unisonOffset = unisonOffset / 1000;
                       if (unisonOffsetNegative == 0) instrument.unisonOffset *= -1;

                       instrument.unisonExpression = unisonExpression / 1000;
                       if (unisonExpressionNegative == 0) instrument.unisonExpression *= -1;

                       instrument.unisonSign = unisonSign / 1000;
                       if (unisonSignNegative == 0) instrument.unisonSign *= -1;
                   } else {
                       instrument.unisonVoices = Config.unisons[instrument.unison].voices;
                       instrument.unisonSpread = Config.unisons[instrument.unison].spread;
                       instrument.unisonOffset = Config.unisons[instrument.unison].offset;
                       instrument.unisonExpression = Config.unisons[instrument.unison].expression;
                       instrument.unisonSign = Config.unisons[instrument.unison].sign;
                   }
               }

           } break;
           case SongTagCode.chord: {
               if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.chord = clamp(0, Config.chords.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   if (instrument.chord != Config.chords.dictionary["simultaneous"].index) {
                       // Enable chord if it was used.
                       instrument.effects |= 1 << EffectType.chord;
                   }
               } else {
                   // Do nothing? This song tag code is deprecated for now.
               }
           } break;
           
  
           
           case SongTagCode.effects: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if ((beforeNine && fromBeepBox) || ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                   // This block handles various legacy formats correctly.
                   instrument.effects = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] & ((1 << EffectType.length) - 1));
                   if (legacyGlobalReverb == 0 && !((fromJummBox && beforeFive) || (beforeFour && fromGoldBox))) {
                       instrument.effects &= ~(1 << EffectType.reverb);
                   } else if (effectsIncludeReverb(instrument.effects)) {
                       instrument.reverb = legacyGlobalReverb;
                   }
                   instrument.effects |= 1 << EffectType.panning;
                   if (instrument.vibrato != Config.vibratos.dictionary["none"].index) {
                       instrument.effects |= 1 << EffectType.vibrato;
                   }
                   if (instrument.detune != Config.detuneCenter) {
                       instrument.effects |= 1 << EffectType.detune;
                   }
                   if (instrument.aliases)
                       instrument.effects |= 1 << EffectType.distortion;
                   else
                       instrument.effects &= ~(1 << EffectType.distortion);
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               } else {
                   // This block handles all modern formats.
                   if (EffectType.length > 18) throw new Error("EffectType bitmask exceeds 3 characters.");

                   if (fromSomethingBox || (fromSlarmoosBox && !beforeFive)) {
                       instrument.effects = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 12) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   } else {
                       instrument.effects = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }

                   if (effectsIncludeNoteFilter(instrument.effects)) {
                       let typeCheck: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       if (fromBeepBox || typeCheck == 0) {
                           instrument.noteFilterType = false;
                           
                           // CORRECTED LOGIC: Read the next byte for ALL modern formats that have it.
                           if (fromJummBox || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox) {
                               typeCheck = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           }

                           instrument.noteFilter.controlPointCount = clamp(0, Config.filterMaxPoints + 1, typeCheck);
                           for (let i: number = instrument.noteFilter.controlPoints.length; i < instrument.noteFilter.controlPointCount; i++) {
                               instrument.noteFilter.controlPoints[i] = new FilterControlPoint();
                           }
                           for (let i: number = 0; i < instrument.noteFilter.controlPointCount; i++) {
                               const point: FilterControlPoint = instrument.noteFilter.controlPoints[i];
                               point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           }
                           for (let i: number = instrument.noteFilter.controlPointCount; i < typeCheck; i++) {
                               charIndex += 3;
                           }
                           instrument.noteSubFilters[0] = instrument.noteFilter;
                           if ((fromJummBox && !beforeFive) || (fromGoldBox) || (fromUltraBox) || (fromSlarmoosBox) || fromSomethingBox) {
                               let usingSubFilterBitfield: number = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               for (let j: number = 0; j < Config.filterMorphCount - 1; j++) {
                                   if (usingSubFilterBitfield & (1 << j)) {
                                       const originalSubfilterControlPointCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                                       if (instrument.noteSubFilters[j + 1] == null)
                                           instrument.noteSubFilters[j + 1] = new FilterSettings();
                                       instrument.noteSubFilters[j + 1]!.controlPointCount = clamp(0, Config.filterMaxPoints + 1, originalSubfilterControlPointCount);
                                       for (let i: number = instrument.noteSubFilters[j + 1]!.controlPoints.length; i < instrument.noteSubFilters[j + 1]!.controlPointCount; i++) {
                                           instrument.noteSubFilters[j + 1]!.controlPoints[i] = new FilterControlPoint();
                                       }
                                       for (let i: number = 0; i < instrument.noteSubFilters[j + 1]!.controlPointCount; i++) {
                                           const point: FilterControlPoint = instrument.noteSubFilters[j + 1]!.controlPoints[i];
                                           point.type = clamp(0, FilterType.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                           point.freq = clamp(0, Config.filterFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                           point.gain = clamp(0, Config.filterGainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                       }
                                       for (let i: number = instrument.noteSubFilters[j + 1]!.controlPointCount; i < originalSubfilterControlPointCount; i++) {
                                           charIndex += 3;
                                       }
                                   }
                               }
                           }
                       } else {
                           instrument.noteFilterType = true;
                           instrument.noteFilter.reset();
                           instrument.noteFilterSimpleCut = clamp(0, Config.filterSimpleCutRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.noteFilterSimplePeak = clamp(0, Config.filterSimplePeakRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
                   if (effectsIncludeTransition(instrument.effects)) {
                       instrument.transition = clamp(0, Config.transitions.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
                   if (effectsIncludeChord(instrument.effects)) {
                       instrument.chord = clamp(0, Config.chords.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       if (instrument.chord == Config.chords.dictionary["arpeggio"].index && (fromJummBox || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox)) {
                           instrument.arpeggioSpeed = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           instrument.fastTwoNoteArp = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) ? true : false;
                       }
                       if (instrument.chord == Config.chords.dictionary["monophonic"].index && ((fromSlarmoosBox && !beforeFive) || fromSomethingBox)) {
                           instrument.monoChordTone = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       }
                   }
                   if (effectsIncludePitchShift(instrument.effects)) {
                       instrument.pitchShift = clamp(0, Config.pitchShiftRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
                   if (effectsIncludeDetune(instrument.effects)) {
                       if (fromBeepBox) {
                           instrument.detune = clamp(Config.detuneMin, Config.detuneMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.detune = Math.round((instrument.detune - 9) * (Math.abs(instrument.detune - 9) + 1) / 2 + Config.detuneCenter);
                       } else {
                           instrument.detune = clamp(Config.detuneMin, Config.detuneMax + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
                   if (effectsIncludeVibrato(instrument.effects)) {
                       instrument.vibrato = clamp(0, Config.vibratos.length + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       if (instrument.vibrato == Config.vibratos.length && (fromJummBox || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox)) {
                           instrument.vibratoDepth = clamp(0, Config.modulators.dictionary["vibrato depth"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) / 25;
                           instrument.vibratoSpeed = clamp(0, Config.modulators.dictionary["vibrato speed"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.vibratoDelay = clamp(0, Config.modulators.dictionary["vibrato delay"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                           instrument.vibratoType = clamp(0, Config.vibratoTypes.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                       else {
                           instrument.vibratoDepth = Config.vibratos[instrument.vibrato].amplitude;
                           instrument.vibratoSpeed = 10;
                           instrument.vibratoDelay = Config.vibratos[instrument.vibrato].delayTicks / 2;
                           instrument.vibratoType = Config.vibratos[instrument.vibrato].type;
                       }
                   }
                   if (effectsIncludeDistortion(instrument.effects)) {
                       instrument.distortion = clamp(0, Config.distortionRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       if ((fromJummBox && !beforeFive) || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox)
                           instrument.aliases = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] ? true : false;
                   }
                   if (effectsIncludeBitcrusher(instrument.effects)) {
                       instrument.bitcrusherFreq = clamp(0, Config.bitcrusherFreqRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.bitcrusherQuantization = clamp(0, Config.bitcrusherQuantizationRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
                   if (effectsIncludePanning(instrument.effects)) {
                       if (fromBeepBox) {
                           instrument.pan = clamp(0, Config.panMax + 1, Math.round(base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * ((Config.panMax) / 8.0)));
                       }
                       else {
                           instrument.pan = clamp(0, Config.panMax + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                       if ((fromJummBox && !beforeTwo) || fromGoldBox || fromUltraBox || fromSlarmoosBox || fromSomethingBox)
                           instrument.panDelay = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   }
                   if (effectsIncludeChorus(instrument.effects)) {
                       if (fromBeepBox) {
                           instrument.chorus = clamp(0, (Config.chorusRange / 2) + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) * 2;
                       }
                       else {
                           instrument.chorus = clamp(0, Config.chorusRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
                   if (effectsIncludeEcho(instrument.effects)) {
                       instrument.echoSustain = clamp(0, Config.echoSustainRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.echoDelay = clamp(0, Config.echoDelayRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
                   if (effectsIncludeReverb(instrument.effects)) {
                       if (fromBeepBox) {
                           instrument.reverb = clamp(0, Config.reverbRange, Math.round(base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * Config.reverbRange / 3.0));
                       } else {
                           instrument.reverb = clamp(0, Config.reverbRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
                   if (effectsIncludeGranular(instrument.effects)) {
                       instrument.granular = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrument.grainSize = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrument.grainAmounts = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrument.grainRange = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   }
                   if (effectsIncludeRingModulation(instrument.effects)) {
                       instrument.ringModulation = clamp(0, Config.ringModRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.ringModulationHz = clamp(0, Config.ringModHzRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.ringModWaveformIndex = clamp(0, Config.operatorWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.ringModPulseWidth = clamp(0, Config.pulseWidthRange, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       instrument.ringModHzOffset = clamp(Config.rmHzOffsetMin, Config.rmHzOffsetMax + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
               }
               instrument.effects &= (1 << EffectType.length) - 1;
           } break;
           case SongTagCode.volume: {
               if (beforeThree && fromBeepBox) {
                   const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const instrument: Instrument = this.channels[channelIndex].instruments[0];
                   instrument.volume = Math.round(clamp(-Config.volumeRange / 2, 1, -base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 5.0));
               } else if (beforeSix && fromBeepBox) {
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (const instrument of this.channels[channelIndex].instruments) {
                           instrument.volume = Math.round(clamp(-Config.volumeRange / 2, 1, -base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 5.0));
                       }
                   }
               } else if (beforeSeven && fromBeepBox) {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.volume = Math.round(clamp(-Config.volumeRange / 2, 1, -base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 5.0));
               } else if (fromBeepBox) {
                   // Beepbox v9's volume range is 0-7 (0 is max, 7 is mute)
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.volume = Math.round(clamp(-Config.volumeRange / 2, 1, -base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 25.0 / 7.0));
               } else {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   // Volume is stored in two bytes in jummbox just in case range ever exceeds one byte, e.g. through later waffling on the subject.
                   instrument.volume = Math.round(clamp(-Config.volumeRange / 2, Config.volumeRange / 2 + 1, ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) | (base64CharCodeToInt[compressed.charCodeAt(charIndex++)])) - Config.volumeRange / 2));
               }
           } break;
           case SongTagCode.pan: {
               if (beforeNine && fromBeepBox) {
                   // Beepbox has a panMax of 8 (9 total positions), Jummbox has a panMax of 100 (101 total positions)
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.pan = clamp(0, Config.panMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * ((Config.panMax) / 8.0));
               } else if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.pan = clamp(0, Config.panMax + 1, (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   // Pan delay follows on v3 + v4
                   if (fromJummBox && !beforeThree || fromGoldBox || fromUltraBox || fromSlarmoosBox) {
                       instrument.panDelay = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   }
               } else {
                   // Do nothing? This song tag code is deprecated for now.
               }
           } break;
           case SongTagCode.detune: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];

               if ((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) {
                   // Before jummbox v5, detune was -50 to 50. Now it is 0 to 400
                   instrument.detune = clamp(Config.detuneMin, Config.detuneMax + 1, ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) * 4);
                   instrument.effects |= 1 << EffectType.detune;
               } else {
                   // Now in v5, tag code is deprecated and handled thru detune effects.
               }
           } break;
           case SongTagCode.customChipWave: {
               let instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               // Pop custom wave values
               for (let j: number = 0; j < 64; j++) {
                   instrument.customChipWave[j]
                       = clamp(-24, 25, base64CharCodeToInt[compressed.charCodeAt(charIndex++)] - 24);
               }

               let sum: number = 0.0;
               for (let i: number = 0; i < instrument.customChipWave.length; i++) {
                   sum += instrument.customChipWave[i];
               }
               const average: number = sum / instrument.customChipWave.length;

               // Perform the integral on the wave. The chipSynth will perform the derivative to get the original wave back but with antialiasing.
               let cumulative: number = 0;
               let wavePrev: number = 0;
               for (let i: number = 0; i < instrument.customChipWave.length; i++) {
                   cumulative += wavePrev;
                   wavePrev = instrument.customChipWave[i] - average;
                   instrument.customChipWaveIntegral[i] = cumulative;
               }

               // 65th, last sample is for anti-aliasing
               instrument.customChipWaveIntegral[64] = 0.0;

           } break;
           case SongTagCode.limiterSettings: {
               let nextValue: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

               // Check if limiter settings are used... if not, restore to default
               if (nextValue == 0x3f) {
                   this.restoreLimiterDefaults();
               }
               else {
                   // Limiter is used, grab values
                   this.compressionRatio = (nextValue < 10 ? nextValue / 10 : (1 + (nextValue - 10) / 60));
                   nextValue = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   this.limitRatio = (nextValue < 10 ? nextValue / 10 : (nextValue - 9));
                   this.limitDecay = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   this.limitRise = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)] * 250.0) + 2000.0;
                   this.compressionThreshold = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] / 20.0;
                   this.limitThreshold = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] / 20.0;
                   this.masterGain = ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) / 50.0;
               }
           } break;
           case SongTagCode.channelNames: {
               for (let channel: number = 0; channel < this.getChannelCount(); channel++) {
                   // Length of channel name string. Due to some crazy Unicode characters this needs to be 2 bytes...
                  let channelNameLength;
                  if (fromSomethingBox) {
                      // SomethingBox always writes a 2-byte length.
                      channelNameLength = ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                  } else if (beforeFour && !fromGoldBox && !fromUltraBox && !fromSlarmoosBox) {
                       channelNameLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)]
                  } else {
                       channelNameLength = ((base64CharCodeToInt[compressed.charCodeAt(charIndex++)] << 6) + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                  }
                   this.channels[channel].name = decodeURIComponent(compressed.substring(charIndex, charIndex + channelNameLength));

                   charIndex += channelNameLength;
               }
           } break;
           case SongTagCode.algorithm: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if (instrument.type == InstrumentType.fm) {
                   instrument.algorithm = clamp(0, Config.algorithms.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
               else {
                   instrument.algorithm6Op = clamp(0, Config.algorithms6Op.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.customAlgorithm.fromPreset(instrument.algorithm6Op);
                   if (compressed.charCodeAt(charIndex) == SongTagCode.chord) {
                       let carrierCountTemp = clamp(1, Config.operatorCount + 2 + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex + 1)]);
                       charIndex++
                       let tempModArray: number[][] = [];
                       if (compressed.charCodeAt(charIndex + 1) == SongTagCode.effects) {
                           charIndex++
                           let j: number = 0;
                           charIndex++
                           while (compressed.charCodeAt(charIndex) != SongTagCode.effects) {
                               tempModArray[j] = [];
                               let o: number = 0;
                               while (compressed.charCodeAt(charIndex) != SongTagCode.operatorWaves) {
                                   tempModArray[j][o] = clamp(1, Config.operatorCount + 3, base64CharCodeToInt[compressed.charCodeAt(charIndex)]);
                                   o++
                                   charIndex++
                               }
                               j++;
                               charIndex++
                           }
                           instrument.customAlgorithm.set(carrierCountTemp, tempModArray);
                           charIndex++; //????
                       }
                   }
               }
               if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                   // The algorithm determines the carrier count, which affects how legacy settings are imported.
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               }
           } break;
           case SongTagCode.supersaw: {
               if (fromGoldBox && !beforeFour && beforeSix) {
                   //is it more useful to save base64 characters or url length?
                   const chipWaveForCompat = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   if ((chipWaveForCompat + 62) > 85) {
                       if (document.URL.substring(document.URL.length - 13).toLowerCase() != "legacysamples") {
                           if (!willLoadLegacySamplesForOldSongs) {
                               willLoadLegacySamplesForOldSongs = true;
                               Config.willReloadForCustomSamples = true;
                               EditorConfig.customSamples = ["legacySamples"];
                               loadBuiltInSamples(0);
                           }
                       }
                   }

                   if ((chipWaveForCompat + 62) > 78) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].chipWave = clamp(0, Config.chipWaves.length, chipWaveForCompat + 63);
                   }
                   else if ((chipWaveForCompat + 62) > 67) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].chipWave = clamp(0, Config.chipWaves.length, chipWaveForCompat + 61);
                   }
                   else if ((chipWaveForCompat + 62) == 67) {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].chipWave = 40;
                   }
                   else {
                       this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].chipWave = clamp(0, Config.chipWaves.length, chipWaveForCompat + 62);
                   }
               } else {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.supersawDynamism = clamp(0, Config.supersawDynamismMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.supersawSpread = clamp(0, Config.supersawSpreadMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.supersawShape = clamp(0, Config.supersawShapeMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
           } break;
           case SongTagCode.feedbackType: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if (instrument.type == InstrumentType.fm) {
                   instrument.feedbackType = clamp(0, Config.feedbacks.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
               else {
                   instrument.feedbackType6Op = clamp(0, Config.feedbacks6Op.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   instrument.customFeedbackType.fromPreset(instrument.feedbackType6Op);
                   let tempModArray: number[][] = [];
                   if (compressed.charCodeAt(charIndex) == SongTagCode.effects) {
                       let j: number = 0;
                       charIndex++
                       while (compressed.charCodeAt(charIndex) != SongTagCode.effects) {
                           tempModArray[j] = [];
                           let o: number = 0;
                           while (compressed.charCodeAt(charIndex) != SongTagCode.operatorWaves) {
                               tempModArray[j][o] = clamp(1, Config.operatorCount + 2, base64CharCodeToInt[compressed.charCodeAt(charIndex)]);
                               o++
                               charIndex++
                           }
                           j++;
                           charIndex++
                       }
                       instrument.customFeedbackType.set(tempModArray);
                       charIndex++; //???? weirdly needs to skip the end character or it'll use that next loop instead of like just moving to the next one itself
                   }
               }

           } break;
           case SongTagCode.feedbackAmplitude: {
               this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator].feedbackAmplitude = clamp(0, Config.operatorAmplitudeMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
           } break;
           case SongTagCode.feedbackEnvelope: {
               if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                   const pregoldToEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34, 31, 11];
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];

                   let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   if ((beforeTwo && fromGoldBox) || (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox)) aa = pregoldToEnvelope[aa];
                   legacySettings.feedbackEnvelope = Song._envelopeFromLegacyIndex(base64CharCodeToInt[aa]);
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               } else {
                   // Do nothing? This song tag code is deprecated for now.
               }
           } break;
           case SongTagCode.operatorFrequencies: {
               const instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if (beforeThree && fromGoldBox) {
                   const freqToGold3 = [4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 2, 1, 9, 17, 19, 21, 23, 0, 3];

                   for (let o = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       instrument.operators[o].frequency = freqToGold3[clamp(0, freqToGold3.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                   }
               }
               else if (!fromGoldBox && !fromUltraBox && !fromSlarmoosBox) {
                   const freqToUltraBox = [4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 18, 20, 23, 27, 2, 1, 9, 17, 19, 21, 23, 0, 3];

                   for (let o = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       instrument.operators[o].frequency = freqToUltraBox[clamp(0, freqToUltraBox.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                   }

               }
               else {
                   for (let o = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       instrument.operators[o].frequency = clamp(0, Config.operatorFrequencies.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
               }
           } break;
           case SongTagCode.operatorAmplitudes: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                   instrument.operators[o].amplitude = clamp(0, Config.operatorAmplitudeMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
               }
           } break;
           
  
           case SongTagCode.envelopes: {
               const pregoldToEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29, 32, 33, 34, 31, 11];
               const jummToUltraEnvelope: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 58, 59, 60];
               const slarURL3toURL4Envelope: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14];
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                   const legacySettings: LegacySettings = legacySettingsCache![instrumentChannelIterator][instrumentIndexIterator];
                   legacySettings.operatorEnvelopes = [];
                   for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       if ((beforeTwo && fromGoldBox) || (fromBeepBox)) aa = pregoldToEnvelope[aa];
                       if (fromJummBox) aa = jummToUltraEnvelope[aa];
                       legacySettings.operatorEnvelopes[o] = Song._envelopeFromLegacyIndex(aa);
                   }
                   instrument.convertLegacySettings(legacySettings, forceSimpleFilter);
               } else {
                   const envelopeCount: number = clamp(0, Config.maxEnvelopeCount + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   
                   const hasLegacyDiscreteByte = (fromJummBox && !beforeSix) || (fromUltraBox && !beforeFive);
                   let globalEnvelopeDiscrete: boolean = false;

                   if ((fromJummBox && !beforeSix) || (fromUltraBox && !beforeFive) || fromSlarmoosBox || fromSomethingBox) {
                       instrument.envelopeSpeed = clamp(0, Config.modulators.dictionary["envelope speed"].maxRawVol + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
                   
                   if (hasLegacyDiscreteByte) {
                       globalEnvelopeDiscrete = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) ? true : false;
                   }

                   for (let i: number = 0; i < envelopeCount; i++) {
                       const target: number = clamp(0, Config.instrumentAutomationTargets.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       let index: number = 0;
                       const maxCount: number = Config.instrumentAutomationTargets[target].maxCount;
                       if (maxCount > 1) {
                           index = clamp(0, maxCount, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                       let aa: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       if ((beforeTwo && fromGoldBox) || (fromBeepBox)) aa = pregoldToEnvelope[aa];
                       if (fromJummBox) aa = jummToUltraEnvelope[aa];
                       if (!fromSlarmoosBox && aa >= 2) aa++;
                       let updatedEnvelopes: boolean = false;
                       let perEnvelopeSpeed: number = 1;
                       if (!fromSlarmoosBox || beforeThree) {
                           updatedEnvelopes = true;
                           perEnvelopeSpeed = Config.envelopes[aa].speed;
                           aa = Config.envelopes[aa].type;
                       } else if (beforeFour && aa >= 3) aa++;
                       let isTremolo2: boolean = false;
                       if ((fromSlarmoosBox && !beforeThree && beforeFour) || updatedEnvelopes) {
                           if (aa == 9) isTremolo2 = true;
                           aa = slarURL3toURL4Envelope[aa];
                       }
                       const envelope: number = clamp(0, ((fromSlarmoosBox && !beforeThree || updatedEnvelopes) ? Config.newEnvelopes.length : Config.envelopes.length), aa);
                       let pitchEnvelopeStart: number = 0;
                       let pitchEnvelopeEnd: number = Config.maxPitch;
                       let perEnvelopeLowerBound: number = 0;
                       let perEnvelopeUpperBound: number = 1;
                       let steps: number = 2;
                       let seed: number = 2;
                       let waveform: number = LFOEnvelopeTypes.sine;
                       let envelopeInverse: boolean = false;
                       let envelopeDiscrete: boolean = globalEnvelopeDiscrete;
                       
                       // CORRECTED LOGIC: This block must run for somethingbox.
                       if (fromSomethingBox || (fromSlarmoosBox && !beforeThree)) {
                           if (Config.newEnvelopes[envelope].name == "pitch") {
                               if (!instrument.isNoiseInstrument) {
                                   let pitchEnvelopeCompact: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                                   pitchEnvelopeStart = clamp(0, Config.maxPitch + 1, pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   pitchEnvelopeCompact = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                                   pitchEnvelopeEnd = clamp(0, Config.maxPitch + 1, pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               } else {
                                   pitchEnvelopeStart = clamp(0, Config.drumCount, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   pitchEnvelopeEnd = clamp(0, Config.drumCount, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               }
                           }
                           
                           if (fromSomethingBox || (fromSlarmoosBox && !beforeFour)) {
                               if (Config.newEnvelopes[envelope].name == "lfo") {
                                   waveform = clamp(0, LFOEnvelopeTypes.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   if (waveform == LFOEnvelopeTypes.steppedSaw || waveform == LFOEnvelopeTypes.steppedTri) {
                                       steps = clamp(1, Config.randomEnvelopeStepsMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   }
                               } else if (Config.newEnvelopes[envelope].name == "random") {
                                   steps = clamp(1, Config.randomEnvelopeStepsMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   seed = clamp(1, Config.randomEnvelopeSeedMax + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                                   waveform = clamp(0, RandomEnvelopeTypes.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                               }
                           }

                           let checkboxValues: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           envelopeInverse = (checkboxValues & 1) == 1;
                           
                           if (!hasLegacyDiscreteByte) {
                               envelopeDiscrete = ((checkboxValues >> 1) & 1) == 1;
                           }

                           if (Config.newEnvelopes[envelope].name != "pitch" && Config.newEnvelopes[envelope].name != "note size" && Config.newEnvelopes[envelope].name != "punch" && Config.newEnvelopes[envelope].name != "none") {
                               perEnvelopeSpeed = Config.perEnvelopeSpeedIndices[base64CharCodeToInt[compressed.charCodeAt(charIndex++)]];
                           }
                           perEnvelopeLowerBound = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] / 10;
                           perEnvelopeUpperBound = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] / 10;
                       }
                       
                       if (!fromSlarmoosBox || beforeFour) {
                           if (isTremolo2) {
                               waveform = LFOEnvelopeTypes.sine;
                               if (envelopeInverse) {
                                   perEnvelopeUpperBound = Math.floor((perEnvelopeUpperBound / 2) * 10) / 10;
                                   perEnvelopeLowerBound = Math.floor((perEnvelopeLowerBound / 2) * 10) / 10;
                               } else {
                                   perEnvelopeUpperBound = Math.floor((0.5 + (perEnvelopeUpperBound - perEnvelopeLowerBound) / 2) * 10) / 10;
                                   perEnvelopeLowerBound = 0.5;
                               }
                           }
                       }

                       instrument.addEnvelope(target, index, envelope, true, pitchEnvelopeStart, pitchEnvelopeEnd, envelopeInverse, perEnvelopeSpeed, perEnvelopeLowerBound, perEnvelopeUpperBound, steps, seed, waveform, envelopeDiscrete);
                       
                       if (fromSlarmoosBox && beforeThree && !beforeTwo) {
                           let pitchEnvelopeCompact: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           instrument.envelopes[i].pitchEnvelopeStart = pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           pitchEnvelopeCompact = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           instrument.envelopes[i].pitchEnvelopeEnd = pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                           instrument.envelopes[i].inverse = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] == 1 ? true : false;
                       }
                   }

                   let instrumentPitchEnvelopeStart: number = 0;
                   let instrumentPitchEnvelopeEnd: number = Config.maxPitch;
                   let instrumentEnvelopeInverse: boolean = false;
                   if (fromSlarmoosBox && beforeTwo) {
                       let pitchEnvelopeCompact: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrumentPitchEnvelopeStart = pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       pitchEnvelopeCompact = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrumentPitchEnvelopeEnd = pitchEnvelopeCompact * 64 + base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       instrumentEnvelopeInverse = base64CharCodeToInt[compressed.charCodeAt(charIndex++)] === 1 ? true : false;
                       for (let i: number = 0; i < envelopeCount; i++) {
                           instrument.envelopes[i].pitchEnvelopeStart = instrumentPitchEnvelopeStart;
                           instrument.envelopes[i].pitchEnvelopeEnd = instrumentPitchEnvelopeEnd;
                           instrument.envelopes[i].inverse = Config.envelopes[instrument.envelopes[i].envelope].name == "pitch" ? instrumentEnvelopeInverse : false;
                       }
                   }
               }
           } break;
           case SongTagCode.operatorWaves: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];

               if (beforeThree && fromGoldBox) {
                   for (let o: number = 0; o < Config.operatorCount; o++) {
                       const pre3To3g = [0, 1, 3, 2, 2, 2, 4, 5];
                       const old: number = clamp(0, pre3To3g.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       if (old == 3) {
                           instrument.operators[o].pulseWidth = 5;
                       } else if (old == 4) {
                           instrument.operators[o].pulseWidth = 4;
                       } else if (old == 5) {
                           instrument.operators[o].pulseWidth = 6;
                       }
                       instrument.operators[o].waveform = pre3To3g[old];
                   }
               } else {
                   for (let o: number = 0; o < (instrument.type == InstrumentType.fm6op ? 6 : Config.operatorCount); o++) {
                       if (fromJummBox) {
                           const jummToG = [0, 1, 3, 2, 4, 5];
                           instrument.operators[o].waveform = jummToG[clamp(0, Config.operatorWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)])];
                       } else {
                           instrument.operators[o].waveform = clamp(0, Config.operatorWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                       // Pulse width follows, if it is a pulse width operator wave
                       if (instrument.operators[o].waveform == 2) {
                           instrument.operators[o].pulseWidth = clamp(0, Config.pwmOperatorWaves.length, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                       }
                   }
               }

           } break;
           case SongTagCode.spectrum: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               if (instrument.type == InstrumentType.spectrum) {
                   const byteCount: number = Math.ceil(Config.spectrumControlPoints * Config.spectrumControlPointBits / 6)
                   const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + byteCount);
                   for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                       instrument.spectrumWave.spectrum[i] = bits.read(Config.spectrumControlPointBits);
                   }
                   instrument.spectrumWave.markCustomWaveDirty();
                   charIndex += byteCount;
               } else if (instrument.type == InstrumentType.drumset) {
                   const byteCount: number = Math.ceil(Config.drumCount * Config.spectrumControlPoints * Config.spectrumControlPointBits / 6)
                   const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + byteCount);
                   for (let j: number = 0; j < Config.drumCount; j++) {
                       for (let i: number = 0; i < Config.spectrumControlPoints; i++) {
                           instrument.drumsetSpectrumWaves[j].spectrum[i] = bits.read(Config.spectrumControlPointBits);
                       }
                       instrument.drumsetSpectrumWaves[j].markCustomWaveDirty();
                   }
                   charIndex += byteCount;
               } else {
                   throw new Error("Unhandled instrument type for spectrum song tag code.");
               }
           } break;
           case SongTagCode.harmonics: {
               const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
               const byteCount: number = Math.ceil(Config.harmonicsControlPoints * Config.harmonicsControlPointBits / 6);
               const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + byteCount);
               for (let i: number = 0; i < Config.harmonicsControlPoints; i++) {
                   instrument.harmonicsWave.harmonics[i] = bits.read(Config.harmonicsControlPointBits);
               }
               instrument.harmonicsWave.markCustomWaveDirty();
               charIndex += byteCount;
           } break;
           case SongTagCode.aliases: {
               if ((fromJummBox && beforeFive) || (fromGoldBox && beforeFour)) {
                   const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                   instrument.aliases = (base64CharCodeToInt[compressed.charCodeAt(charIndex++)]) ? true : false;
                   if (instrument.aliases) {
                       instrument.distortion = 0;
                       instrument.effects |= 1 << EffectType.distortion;
                   }
               } else {
                   if (fromUltraBox || fromSlarmoosBox) {
                       const instrument: Instrument = this.channels[instrumentChannelIterator].instruments[instrumentIndexIterator];
                       instrument.decimalOffset = clamp(0, 50 + 1, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   }
               }
           }
               break;
           case SongTagCode.bars: {
               let subStringLength: number;
               if (beforeThree && fromBeepBox) {
                   const channelIndex: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   const barCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   subStringLength = Math.ceil(barCount * 0.5);
                   const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + subStringLength);
                   for (let i: number = 0; i < barCount; i++) {
                       this.channels[channelIndex].bars[i] = bits.read(3) + 1;
                   }
               } else if (beforeFive && fromBeepBox) {
                   let neededBits: number = 0;
                   while ((1 << neededBits) < this.patternsPerChannel) neededBits++;
                   subStringLength = Math.ceil(this.getChannelCount() * this.barCount * neededBits / 6);
                   const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + subStringLength);
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (let i: number = 0; i < this.barCount; i++) {
                           this.channels[channelIndex].bars[i] = bits.read(neededBits) + 1;
                       }
                   }
               } else {
                   let neededBits: number = 0;
                   while ((1 << neededBits) < this.patternsPerChannel + 1) neededBits++;
                   subStringLength = Math.ceil(this.getChannelCount() * this.barCount * neededBits / 6);
                   const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + subStringLength);
                   for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
                       for (let i: number = 0; i < this.barCount; i++) {
                           this.channels[channelIndex].bars[i] = bits.read(neededBits);
                       }
                   }
               }
               charIndex += subStringLength;
           } break;
           case SongTagCode.patterns: {
               let bitStringLength: number = 0;
               let channelIndex: number;
               let largerChords: boolean = !((beforeFour && fromJummBox) || fromBeepBox);
               let recentPitchBitLength: number = (largerChords ? 4 : 3);
               let recentPitchLength: number = (largerChords ? 16 : 8);
               if (beforeThree && fromBeepBox) {
                   channelIndex = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

                   // The old format used the next character to represent the number of patterns in the channel, which is usually eight, the default. 
                   charIndex++; //let patternCount: number = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];

                   bitStringLength = base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                   bitStringLength = bitStringLength << 6;
                   bitStringLength += base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
               } else {
                   channelIndex = 0;
                   let bitStringLengthLength: number = validateRange(1, 4, base64CharCodeToInt[compressed.charCodeAt(charIndex++)]);
                   while (bitStringLengthLength > 0) {
                       bitStringLength = bitStringLength << 6;
                       bitStringLength += base64CharCodeToInt[compressed.charCodeAt(charIndex++)];
                       bitStringLengthLength--;
                   }
               }

               const bits: BitFieldReader = new BitFieldReader(compressed, charIndex, charIndex + bitStringLength);
               charIndex += bitStringLength;

               const bitsPerNoteSize: number = Song.getNeededBits(Config.noteSizeMax);
               let songReverbChannel: number = -1;
               let songReverbInstrument: number = -1;
               let songReverbIndex: number = -1;

               //TODO: Goldbox detecting (ultrabox used the goldbox tag for a bit, sadly making things more complicated)
               const shouldCorrectTempoMods: boolean = fromJummBox;
               const jummboxTempoMin: number = 30;

               while (true) {
                   const channel: Channel = this.channels[channelIndex];
                   const isNoiseChannel: boolean = this.getChannelIsNoise(channelIndex);
                   const isModChannel: boolean = this.getChannelIsMod(channelIndex);

                   const maxInstrumentsPerPattern: number = this.getMaxInstrumentsPerPattern(channelIndex);
                   const neededInstrumentCountBits: number = Song.getNeededBits(maxInstrumentsPerPattern - Config.instrumentCountMin);

                   const neededInstrumentIndexBits: number = Song.getNeededBits(channel.instruments.length - 1);

                   // Some info about modulator settings immediately follows in mod channels.
                   if (isModChannel) {
                       let jumfive: boolean = (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)

                       // 2 more indices for 'all' and 'active'
                       const neededModInstrumentIndexBits: number = (jumfive) ? neededInstrumentIndexBits : Song.getNeededBits(this.getMaxInstrumentsPerChannel() + 2);

                       for (let instrumentIndex: number = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {

                           let instrument: Instrument = channel.instruments[instrumentIndex];

                           for (let mod: number = 0; mod < Config.modCount; mod++) {
                               // Still using legacy "mod status" format, but doing it manually as it's only used in the URL now.
                               // 0 - For pitch/noise
                               // 1 - (used to be For noise, not needed)
                               // 2 - For song
                               // 3 - None
                               let status: number = bits.read(2);

                               switch (status) {
                                  case 0: // Pitch or Noise target
                                      if (fromSomethingBox) {
                                          // New format: A modulator can target ANY channel. Read the absolute index.
                                          instrument.modChannels[mod] = clamp(0, this.getChannelCount(), bits.read(8));
                                      } else {
                                          // Legacy format: Can only target pitch or noise channels.
                                          instrument.modChannels[mod] = clamp(0, this.pitchChannelCount + this.noiseChannelCount + 1, bits.read(8));
                                      }
                                      instrument.modInstruments[mod] = clamp(0, this.channels[instrument.modChannels[mod]].instruments.length + 2, bits.read(neededModInstrumentIndexBits));
                                   break;
                                   case 1: // Noise
                                      // Legacy format: The stored index is relative to noise channels.
                                      const relativeNoiseIndex = bits.read(8);
                                      let absoluteNoiseIndex = 0;
                                      let noiseChannelsFound = 0;
                                      for (let i = 0; i < this.channels.length; i++) {
                                          if (this.getChannelIsNoise(i)) {
                                              if (noiseChannelsFound++ == relativeNoiseIndex) {
                                                  absoluteNoiseIndex = i;
                                                  break;
                                              }
                                          }
                                      }
                                      instrument.modChannels[mod] = absoluteNoiseIndex;
                                      instrument.modInstruments[mod] = clamp(0, this.channels[absoluteNoiseIndex].instruments.length + 2, bits.read(neededInstrumentIndexBits));
                                       break;
                                   case 2: // For song
                                       instrument.modChannels[mod] = -1;
                                       break;
                                   case 3: // None
                                       instrument.modChannels[mod] = -2;
                                       break;
                               }

                               // Mod setting is only used if the status isn't "none".
                               if (status != 3) {
                                   instrument.modulators[mod] = bits.read(6);
                               }

                               // In legacy formats, a status of 1 meant "noise channel" and the index was relative.
                              if (status == 1) {
                                  const noiseChannelIndex = instrument.modChannels[mod] - this.pitchChannelCount;
                                  instrument.modChannels[mod] = this.channels.findIndex((ch, i) => this.getChannelIsNoise(i) && i >= this.pitchChannelCount && (i - this.pitchChannelCount) === noiseChannelIndex);
                              }

                               if (!jumfive && (Config.modulators[instrument.modulators[mod]].name == "eq filter" || Config.modulators[instrument.modulators[mod]].name == "note filter" || Config.modulators[instrument.modulators[mod]].name == "song eq")) {
                                   instrument.modFilterTypes[mod] = bits.read(6);
                               }

                               if (Config.modulators[instrument.modulators[mod]].name == "individual envelope speed" ||
                                   Config.modulators[instrument.modulators[mod]].name == "reset envelope" ||
                                   Config.modulators[instrument.modulators[mod]].name == "individual envelope lower bound" ||
                                   Config.modulators[instrument.modulators[mod]].name == "individual envelope upper bound"
                               ) {
                                   instrument.modEnvelopeNumbers[mod] = bits.read(6);
                               }

                               if (jumfive && instrument.modChannels[mod] >= 0) {
                                   let forNoteFilter: boolean = effectsIncludeNoteFilter(this.channels[instrument.modChannels[mod]].instruments[instrument.modInstruments[mod]].effects);

                                   // For legacy filter cut/peak, need to denote since scaling must be applied
                                   if (instrument.modulators[mod] == 7) {
                                       // Legacy filter cut index
                                       // Check if there is no filter dot on prospective filter. If so, add a low pass at max possible freq.

                                       if (forNoteFilter) {
                                           instrument.modulators[mod] = Config.modulators.dictionary["note filt cut"].index;
                                       }
                                       else {
                                           instrument.modulators[mod] = Config.modulators.dictionary["eq filt cut"].index;
                                       }

                                       instrument.modFilterTypes[mod] = 1; // Dot 1 X

                                   }
                                   else if (instrument.modulators[mod] == 8) {
                                       // Legacy filter peak index
                                       if (forNoteFilter) {
                                           instrument.modulators[mod] = Config.modulators.dictionary["note filt peak"].index;
                                       }
                                       else {
                                           instrument.modulators[mod] = Config.modulators.dictionary["eq filt peak"].index;
                                       }

                                       instrument.modFilterTypes[mod] = 2; // Dot 1 Y
                                   }
                               }
                               else if (jumfive) {
                                   // Check for song reverb mod, which must be handled differently now that it is a multiplier
                                   if (instrument.modulators[mod] == Config.modulators.dictionary["song reverb"].index) {
                                       songReverbChannel = channelIndex;
                                       songReverbInstrument = instrumentIndex;
                                       songReverbIndex = mod;
                                   }
                               }

                               // Based on setting, enable some effects for the modulated instrument. This isn't always set, say if the instrument's pan was right in the center.
                               // Only used on import of old songs, because sometimes an invalid effect can be set in a mod in the new version that is actually unused. In that case,
                               // keeping the mod invalid is better since it preserves the state.
                               if (jumfive && Config.modulators[instrument.modulators[mod]].associatedEffect != EffectType.length) {
                                   this.channels[instrument.modChannels[mod]].instruments[instrument.modInstruments[mod]].effects |= 1 << Config.modulators[instrument.modulators[mod]].associatedEffect;
                               }
                           }
                       }
                   }

                   // Scalar applied to detune mods since its granularity was upped. Could be repurposed later if any other granularity changes occur.
                   const detuneScaleNotes: number[][] = [];
                   for (let j: number = 0; j < channel.instruments.length; j++) {
                       detuneScaleNotes[j] = [];
                       for (let i: number = 0; i < Config.modCount; i++) {
                           detuneScaleNotes[j][Config.modCount - 1 - i] = 1 + 3 * +(((beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) && isModChannel && (channel.instruments[j].modulators[i] == Config.modulators.dictionary["detune"].index));
                       }
                   }
                   const octaveOffset: number = (isNoiseChannel || isModChannel) ? 0 : channel.octave * 12;
                   let lastPitch: number = isModChannel ? 0 : (isNoiseChannel ? 4 : octaveOffset);
                   const recentPitches: number[] = isModChannel ? [0, 1, 2, 3, 4, 5] : (isNoiseChannel ? [4, 6, 7, 2, 3, 8, 0, 10] : [0, 7, 12, 19, 24, -5, -12]);
                   const recentShapes: any[] = [];
                   for (let i: number = 0; i < recentPitches.length; i++) {
                       recentPitches[i] += octaveOffset;
                   }
                   for (let i: number = 0; i < this.patternsPerChannel; i++) {
                       const newPattern: Pattern = channel.patterns[i];

                       if ((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox)) {
                           newPattern.instruments[0] = validateRange(0, channel.instruments.length - 1, bits.read(neededInstrumentIndexBits));
                           newPattern.instruments.length = 1;
                       } else {
                           if (this.patternInstruments) {
                               const instrumentCount: number = validateRange(Config.instrumentCountMin, maxInstrumentsPerPattern, bits.read(neededInstrumentCountBits) + Config.instrumentCountMin);
                               for (let j: number = 0; j < instrumentCount; j++) {
                                   newPattern.instruments[j] = validateRange(0, channel.instruments.length - 1 + +(isModChannel) * 2, bits.read(neededInstrumentIndexBits));
                               }
                               newPattern.instruments.length = instrumentCount;
                           } else {
                               newPattern.instruments[0] = 0;
                               newPattern.instruments.length = Config.instrumentCountMin;
                           }
                       }

                       if (!(fromBeepBox && beforeThree) && bits.read(1) == 0) {
                           newPattern.notes.length = 0;
                           continue;
                       }

                       let curPart: number = 0;
                       const newNotes: Note[] = newPattern.notes;
                       let noteCount: number = 0;
                       // Due to arbitrary note positioning, mod channels don't end the count until curPart actually exceeds the max
                       while (curPart < this.beatsPerBar * Config.partsPerBeat + (+isModChannel)) {

                           const useOldShape: boolean = bits.read(1) == 1;
                           let newNote: boolean = false;
                           let shapeIndex: number = 0;
                           if (useOldShape) {
                               shapeIndex = validateRange(0, recentShapes.length - 1, bits.readLongTail(0, 0));
                           } else {
                               newNote = bits.read(1) == 1;
                           }

                           if (!useOldShape && !newNote) {
                               // For mod channels, check if you need to move backward too (notes can appear in any order and offset from each other).
                               if (isModChannel) {
                                   const isBackwards: boolean = bits.read(1) == 1;
                                   const restLength: number = bits.readPartDuration();
                                   if (isBackwards) {
                                       curPart -= restLength;
                                   }
                                   else {
                                       curPart += restLength;
                                   }
                               } else {
                                   const restLength: number = (beforeSeven && fromBeepBox)
                                       ? bits.readLegacyPartDuration() * Config.partsPerBeat / Config.rhythms[this.rhythm].stepsPerBeat
                                       : bits.readPartDuration();
                                   curPart += restLength;

                               }
                           } else {
                               let shape: any;
                               if (useOldShape) {
                                   shape = recentShapes[shapeIndex];
                                   recentShapes.splice(shapeIndex, 1);
                               } else {
                                   shape = {};

                                   if (!largerChords) {
                                       // Old format: X 1's followed by a 0 => X+1 pitches, up to 4
                                       shape.pitchCount = 1;
                                       while (shape.pitchCount < 4 && bits.read(1) == 1) shape.pitchCount++;
                                   }
                                   else {
                                       // New format is:
                                       //      0: 1 pitch
                                       // 1[XXX]: 3 bits of binary signifying 2+ pitches
                                       if (bits.read(1) == 1) {
                                           shape.pitchCount = bits.read(3) + 2;
                                       }
                                       else {
                                           shape.pitchCount = 1;
                                       }
                                   }

                                   shape.pinCount = bits.readPinCount();
                                   if (fromBeepBox) {
                                       shape.initialSize = bits.read(2) * 2;
                                   } else if (!isModChannel) {
                                       shape.initialSize = bits.read(bitsPerNoteSize);
                                   } else {
                                       shape.initialSize = bits.read(9);
                                   }

                                   shape.pins = [];
                                   shape.length = 0;
                                   shape.bendCount = 0;
                                   for (let j: number = 0; j < shape.pinCount; j++) {
                                       let pinObj: any = {};
                                       pinObj.pitchBend = bits.read(1) == 1;
                                       if (pinObj.pitchBend) shape.bendCount++;
                                       shape.length += (beforeSeven && fromBeepBox)
                                           ? bits.readLegacyPartDuration() * Config.partsPerBeat / Config.rhythms[this.rhythm].stepsPerBeat
                                           : bits.readPartDuration();
                                       pinObj.time = shape.length;
                                       if (fromBeepBox) {
                                           pinObj.size = bits.read(2) * 2;
                                       } else if (!isModChannel) {
                                           pinObj.size = bits.read(bitsPerNoteSize);
                                       }
                                       else {
                                           pinObj.size = bits.read(9);
                                       }
                                       shape.pins.push(pinObj);
                                   }
                               }
                               recentShapes.unshift(shape);
                               if (recentShapes.length > 10) recentShapes.pop(); // TODO: Use Deque?

                               let note: Note;
                               if (newNotes.length <= noteCount) {
                                   note = new Note(0, curPart, curPart + shape.length, shape.initialSize);
                                   newNotes[noteCount++] = note;
                               } else {
                                   note = newNotes[noteCount++];
                                   note.start = curPart;
                                   note.end = curPart + shape.length;
                                   note.pins[0].size = shape.initialSize;
                               }

                               let pitch: number;
                               let pitchCount: number = 0;
                               const pitchBends: number[] = []; // TODO: allocate this array only once! keep separate length and iterator index. Use Deque?
                               for (let j: number = 0; j < shape.pitchCount + shape.bendCount; j++) {
                                   const useOldPitch: boolean = bits.read(1) == 1;
                                   if (!useOldPitch) {
                                       const interval: number = bits.readPitchInterval();
                                       pitch = lastPitch;
                                       let intervalIter: number = interval;
                                       while (intervalIter > 0) {
                                           pitch++;
                                           while (recentPitches.indexOf(pitch) != -1) pitch++;
                                           intervalIter--;
                                       }
                                       while (intervalIter < 0) {
                                           pitch--;
                                           while (recentPitches.indexOf(pitch) != -1) pitch--;
                                           intervalIter++;
                                       }
                                   } else {
                                       const pitchIndex: number = validateRange(0, recentPitches.length - 1, bits.read(recentPitchBitLength));
                                       pitch = recentPitches[pitchIndex];
                                       recentPitches.splice(pitchIndex, 1);
                                   }

                                   recentPitches.unshift(pitch);
                                   if (recentPitches.length > recentPitchLength) recentPitches.pop();

                                   if (j < shape.pitchCount) {
                                       note.pitches[pitchCount++] = pitch;
                                   } else {
                                       pitchBends.push(pitch);
                                   }

                                   if (j == shape.pitchCount - 1) {
                                       lastPitch = note.pitches[0];
                                   } else {
                                       lastPitch = pitch;
                                   }
                               }
                               note.pitches.length = pitchCount;
                               pitchBends.unshift(note.pitches[0]); // TODO: Use Deque?
                               const noteIsForTempoMod: boolean = isModChannel && channel.instruments[newPattern.instruments[0]].modulators[Config.modCount - 1 - note.pitches[0]] === Config.modulators.dictionary["tempo"].index;
                               let tempoOffset: number = 0;
                               if (shouldCorrectTempoMods && noteIsForTempoMod) {
                                   tempoOffset = jummboxTempoMin - Config.tempoMin; // convertRealFactor will add back Config.tempoMin as necessary
                               }
                               if (isModChannel) {
                                   note.pins[0].size += tempoOffset;
                                   note.pins[0].size *= detuneScaleNotes[newPattern.instruments[0]][note.pitches[0]];
                               }
                               let pinCount: number = 1;
                               for (const pinObj of shape.pins) {
                                   if (pinObj.pitchBend) pitchBends.shift();

                                   const interval: number = pitchBends[0] - note.pitches[0];
                                   if (note.pins.length <= pinCount) {
                                       if (isModChannel) {
                                           note.pins[pinCount++] = makeNotePin(interval, pinObj.time, pinObj.size * detuneScaleNotes[newPattern.instruments[0]][note.pitches[0]] + tempoOffset);
                                       } else {
                                           note.pins[pinCount++] = makeNotePin(interval, pinObj.time, pinObj.size);
                                       }
                                   } else {
                                       const pin: NotePin = note.pins[pinCount++];
                                       pin.interval = interval;
                                       pin.time = pinObj.time;
                                       if (isModChannel) {
                                           pin.size = pinObj.size * detuneScaleNotes[newPattern.instruments[0]][note.pitches[0]] + tempoOffset;
                                       } else {
                                           pin.size = pinObj.size;
                                       }
                                   }
                               }
                               note.pins.length = pinCount;

                               if (note.start == 0) {
                                   if (!((beforeNine && fromBeepBox) || (beforeFive && fromJummBox) || (beforeFour && fromGoldBox))) {
                                       note.continuesLastPattern = (bits.read(1) == 1);
                                   } else {
                                       if ((beforeFour && !fromUltraBox && !fromSlarmoosBox) || fromBeepBox) {
                                           note.continuesLastPattern = false;
                                       } else {
                                           note.continuesLastPattern = channel.instruments[newPattern.instruments[0]].legacyTieOver;
                                       }
                                   }
                               }

                               curPart = validateRange(0, this.beatsPerBar * Config.partsPerBeat, note.end);
                           }
                       }
                       newNotes.length = noteCount;
                   }

                   if (beforeThree && fromBeepBox) {
                       break;
                   } else {
                       channelIndex++;
                       if (channelIndex >= this.getChannelCount()) break;
                   }
               } // while (true)

               // Correction for old JB songs that had song reverb mods. Change all instruments using reverb to max reverb
               if (((fromJummBox && beforeFive) || (beforeFour && fromGoldBox)) && songReverbIndex >= 0) {
                   for (let channelIndex: number = 0; channelIndex < this.channels.length; channelIndex++) {
                       for (let instrumentIndex: number = 0; instrumentIndex < this.channels[channelIndex].instruments.length; instrumentIndex++) {
                           const instrument: Instrument = this.channels[channelIndex].instruments[instrumentIndex];
                           if (effectsIncludeReverb(instrument.effects)) {
                               instrument.reverb = Config.reverbRange - 1;
                           }
                           // Set song reverb via mod to the old setting at song start.
                           if (songReverbChannel == channelIndex && songReverbInstrument == instrumentIndex) {
                               const patternIndex: number = this.channels[channelIndex].bars[0];
                               if (patternIndex > 0) {
                                   // Doesn't work if 1st pattern isn't using the right ins for song reverb...
                                   // Add note to start of pattern
                                   const pattern: Pattern = this.channels[channelIndex].patterns[patternIndex - 1];
                                   let lowestPart: number = 6;
                                   for (const note of pattern.notes) {
                                       if (note.pitches[0] == Config.modCount - 1 - songReverbIndex) {
                                           lowestPart = Math.min(lowestPart, note.start);
                                       }
                                   }

                                   if (lowestPart > 0) {
                                       pattern.notes.push(new Note(Config.modCount - 1 - songReverbIndex, 0, lowestPart, legacyGlobalReverb));
                                   }
                               }
                               else {
                                   // Add pattern
                                   if (this.channels[channelIndex].patterns.length < Config.barCountMax) {
                                       const pattern: Pattern = new Pattern();
                                       this.channels[channelIndex].patterns.push(pattern);
                                       this.channels[channelIndex].bars[0] = this.channels[channelIndex].patterns.length;
                                       if (this.channels[channelIndex].patterns.length > this.patternsPerChannel) {
                                           for (let chn: number = 0; chn < this.channels.length; chn++) {
                                               if (this.channels[chn].patterns.length <= this.patternsPerChannel) {
                                                   this.channels[chn].patterns.push(new Pattern());
                                               }
                                           }
                                           this.patternsPerChannel++;
                                       }
                                       pattern.instruments.length = 1;
                                       pattern.instruments[0] = songReverbInstrument;
                                       pattern.notes.length = 0;
                                       pattern.notes.push(new Note(Config.modCount - 1 - songReverbIndex, 0, 6, legacyGlobalReverb));
                                   }
                               }
                           }
                       }
                   }
               }
           } break;
           default: {
               throw new Error("Unrecognized song tag code " + String.fromCharCode(command) + " at index " + (charIndex - 1) + " " + compressed.substring(/*charIndex - 2*/0, charIndex));
           } break;
       }

       if (Config.willReloadForCustomSamples) {
           window.location.hash = this.toBase64String();
           setTimeout(() => { location.reload(); }, 50);
       }
   }

   private static _isProperUrl(string: string): boolean {
       try {
           if (OFFLINE) {
               return Boolean(string);
           } else {
               return Boolean(new URL(string));
           }
       }
       catch (x) {
           return false;
       }
   }

   // @TODO: Share more of this code with AddSamplesPrompt.
   private static _parseAndConfigureCustomSample(url: string, customSampleUrls: string[], customSamplePresets: Preset[], sampleLoadingState: SampleLoadingState, parseOldSyntax: boolean): boolean {
       const defaultIndex: number = 0;
       const defaultIntegratedSamples: Float32Array = Config.chipWaves[defaultIndex].samples;
       const defaultSamples: Float32Array = Config.rawRawChipWaves[defaultIndex].samples;

       const customSampleUrlIndex: number = customSampleUrls.length;
       customSampleUrls.push(url);
       // This depends on `Config.chipWaves` being the same
       // length as `Config.rawRawChipWaves`.
       const chipWaveIndex: number = Config.chipWaves.length;

       let urlSliced: string = url;

       let customSampleRate: number = 44100;
       let isCustomPercussive: boolean = false;
       let customRootKey: number = 60;
       let presetIsUsingAdvancedLoopControls: boolean = false;
       let presetChipWaveLoopStart: number | null = null;
       let presetChipWaveLoopEnd: number | null = null;
       let presetChipWaveStartOffset: number | null = null;
       let presetChipWaveLoopMode: number | null = null;
       let presetChipWavePlayBackwards: boolean = false;

       let parsedSampleOptions: boolean = false;
       let optionsStartIndex: number = url.indexOf("!");
       let optionsEndIndex: number = -1;
       if (optionsStartIndex === 0) {
           optionsEndIndex = url.indexOf("!", optionsStartIndex + 1);
           if (optionsEndIndex !== -1) {
               const rawOptions: string[] = url.slice(optionsStartIndex + 1, optionsEndIndex).split(",");
               for (const rawOption of rawOptions) {
                   const optionCode: string = rawOption.charAt(0);
                   const optionData: string = rawOption.slice(1, rawOption.length);
                   if (optionCode === "s") {
                       customSampleRate = clamp(8000, 96000 + 1, parseFloatWithDefault(optionData, 44100));
                   } else if (optionCode === "r") {
                       customRootKey = parseFloatWithDefault(optionData, 60);
                   } else if (optionCode === "p") {
                       isCustomPercussive = true;
                   } else if (optionCode === "a") {
                       presetChipWaveLoopStart = parseIntWithDefault(optionData, null);
                       if (presetChipWaveLoopStart != null) {
                           presetIsUsingAdvancedLoopControls = true;
                       }
                   } else if (optionCode === "b") {
                       presetChipWaveLoopEnd = parseIntWithDefault(optionData, null);
                       if (presetChipWaveLoopEnd != null) {
                           presetIsUsingAdvancedLoopControls = true;
                       }
                   } else if (optionCode === "c") {
                       presetChipWaveStartOffset = parseIntWithDefault(optionData, null);
                       if (presetChipWaveStartOffset != null) {
                           presetIsUsingAdvancedLoopControls = true;
                       }
                   } else if (optionCode === "d") {
                       presetChipWaveLoopMode = parseIntWithDefault(optionData, null);
                       if (presetChipWaveLoopMode != null) {
                           // @TODO: Error-prone. This should be automatically
                           // derived from the list of available loop modes.
                           presetChipWaveLoopMode = clamp(0, 3 + 1, presetChipWaveLoopMode);
                           presetIsUsingAdvancedLoopControls = true;
                       }
                   } else if (optionCode === "e") {
                       presetChipWavePlayBackwards = true;
                       presetIsUsingAdvancedLoopControls = true;
                   }
               }
               urlSliced = url.slice(optionsEndIndex + 1, url.length);
               parsedSampleOptions = true;
           }
       }

       let parsedUrl: URL | string | null = null;
       if (Song._isProperUrl(urlSliced)) {
           if (OFFLINE) {
               parsedUrl = urlSliced;
           } else {
               parsedUrl = new URL(urlSliced);
           }
       }
       else {
           alert(url + " is not a valid url");
           return false;
       }

       if (parseOldSyntax) {
           if (!parsedSampleOptions && parsedUrl != null) {
               if (url.indexOf("@") != -1) {
                   //urlSliced = url.slice(url.indexOf("@"), url.indexOf("@"));
                   urlSliced = url.replaceAll("@", "")
                   if (OFFLINE) {
                       parsedUrl = urlSliced;
                   } else {
                       parsedUrl = new URL(urlSliced);
                   }
                   isCustomPercussive = true;
               }

               function sliceForSampleRate() {
                   urlSliced = url.slice(0, url.indexOf(","));
                   if (OFFLINE) {
                       parsedUrl = urlSliced;
                   } else {
                       parsedUrl = new URL(urlSliced);
                   }
                   customSampleRate = clamp(8000, 96000 + 1, parseFloatWithDefault(url.slice(url.indexOf(",") + 1), 44100));
                   //should this be parseFloat or parseInt?
                   //ig floats let you do decimals and such, but idk where that would be useful
               }

               function sliceForRootKey() {
                   urlSliced = url.slice(0, url.indexOf("!"));
                   if (OFFLINE) {
                       parsedUrl = urlSliced;
                   } else {
                       parsedUrl = new URL(urlSliced);
                   }
                   customRootKey = parseFloatWithDefault(url.slice(url.indexOf("!") + 1), 60);
               }


               if (url.indexOf(",") != -1 && url.indexOf("!") != -1) {
                   if (url.indexOf(",") < url.indexOf("!")) {
                       sliceForRootKey();
                       sliceForSampleRate();
                   }
                   else {
                       sliceForSampleRate();
                       sliceForRootKey();
                   }
               }
               else {
                   if (url.indexOf(",") != -1) {
                       sliceForSampleRate();
                   }
                   if (url.indexOf("!") != -1) {
                       sliceForRootKey();
                   }
               }
           }
       }

       if (parsedUrl != null) {
           // Store in the new format.
           let urlWithNamedOptions = urlSliced;
           const namedOptions: string[] = [];
           if (customSampleRate !== 44100) namedOptions.push("s" + customSampleRate);
           if (customRootKey !== 60) namedOptions.push("r" + customRootKey);
           if (isCustomPercussive) namedOptions.push("p");
           if (presetIsUsingAdvancedLoopControls) {
               if (presetChipWaveLoopStart != null) namedOptions.push("a" + presetChipWaveLoopStart);
               if (presetChipWaveLoopEnd != null) namedOptions.push("b" + presetChipWaveLoopEnd);
               if (presetChipWaveStartOffset != null) namedOptions.push("c" + presetChipWaveStartOffset);
               if (presetChipWaveLoopMode != null) namedOptions.push("d" + presetChipWaveLoopMode);
               if (presetChipWavePlayBackwards) namedOptions.push("e");
           }
           if (namedOptions.length > 0) {
               urlWithNamedOptions = "!" + namedOptions.join(",") + "!" + urlSliced;
           }
           customSampleUrls[customSampleUrlIndex] = urlWithNamedOptions;

           // @TODO: Could also remove known extensions, but it
           // would probably be much better to be able to specify
           // a custom name.
           // @TODO: If for whatever inexplicable reason someone
           // uses an url like `https://example.com`, this will
           // result in an empty name here.
           let name: string;
           if (OFFLINE) {
               //@ts-ignore
               name = decodeURIComponent(parsedUrl.replace(/^([^\/]*\/)+/, ""));
           } else {
               //@ts-ignore
               name = decodeURIComponent(parsedUrl.pathname.replace(/^([^\/]*\/)+/, ""));
           }
           // @TODO: What to do about samples with the same name?
           // The problem with using the url is that the name is
           // user-facing and long names break assumptions of the
           // UI.
           const expression: number = 1.0;
           Config.chipWaves[chipWaveIndex] = {
               name: name,
               expression: expression,
               isCustomSampled: true,
               isPercussion: isCustomPercussive,
               rootKey: customRootKey,
               sampleRate: customSampleRate,
               samples: defaultIntegratedSamples,
               index: chipWaveIndex,
           };
           Config.rawChipWaves[chipWaveIndex] = {
               name: name,
               expression: expression,
               isCustomSampled: true,
               isPercussion: isCustomPercussive,
               rootKey: customRootKey,
               sampleRate: customSampleRate,
               samples: defaultSamples,
               index: chipWaveIndex,
           };
           Config.rawRawChipWaves[chipWaveIndex] = {
               name: name,
               expression: expression,
               isCustomSampled: true,
               isPercussion: isCustomPercussive,
               rootKey: customRootKey,
               sampleRate: customSampleRate,
               samples: defaultSamples,
               index: chipWaveIndex,
           };
           const customSamplePresetSettings: Dictionary<any> = {
               "type": "chip",
               "eqFilter": [],
               "effects": [],
               "transition": "normal",
               "fadeInSeconds": 0,
               "fadeOutTicks": -3,
               "chord": "harmony",
               "wave": name,
               "unison": "none",
               "envelopes": [],
           };
           if (presetIsUsingAdvancedLoopControls) {
               customSamplePresetSettings["isUsingAdvancedLoopControls"] = true;
               customSamplePresetSettings["chipWaveLoopStart"] = presetChipWaveLoopStart != null ? presetChipWaveLoopStart : 0;
               customSamplePresetSettings["chipWaveLoopEnd"] = presetChipWaveLoopEnd != null ? presetChipWaveLoopEnd : 2;
               customSamplePresetSettings["chipWaveLoopMode"] = presetChipWaveLoopMode != null ? presetChipWaveLoopMode : 0;
               customSamplePresetSettings["chipWavePlayBackwards"] = presetChipWavePlayBackwards;
               customSamplePresetSettings["chipWaveStartOffset"] = presetChipWaveStartOffset != null ? presetChipWaveStartOffset : 0;
           }
           const customSamplePreset: Preset = {
               index: 0, // This should be overwritten by toNameMap, in our caller.
               name: name,
               midiProgram: 80,
               settings: customSamplePresetSettings,
           };
           customSamplePresets.push(customSamplePreset);
           if (!Config.willReloadForCustomSamples) {
               const rawLoopOptions: any = {
                   "isUsingAdvancedLoopControls": presetIsUsingAdvancedLoopControls,
                   "chipWaveLoopStart": presetChipWaveLoopStart,
                   "chipWaveLoopEnd": presetChipWaveLoopEnd,
                   "chipWaveLoopMode": presetChipWaveLoopMode,
                   "chipWavePlayBackwards": presetChipWavePlayBackwards,
                   "chipWaveStartOffset": presetChipWaveStartOffset,
               };
               startLoadingSample(urlSliced, chipWaveIndex, customSamplePresetSettings, rawLoopOptions, customSampleRate);
           }
           sampleLoadingState.statusTable[chipWaveIndex] = SampleLoadingStatus.loading;
           sampleLoadingState.urlTable[chipWaveIndex] = urlSliced;
           sampleLoadingState.totalSamples++;
       }

       return true;
   }

   private static _restoreChipWaveListToDefault(): void {
       Config.chipWaves = toNameMap(Config.chipWaves.slice(0, Config.firstIndexForSamplesInChipWaveList));
       Config.rawChipWaves = toNameMap(Config.rawChipWaves.slice(0, Config.firstIndexForSamplesInChipWaveList));
       Config.rawRawChipWaves = toNameMap(Config.rawRawChipWaves.slice(0, Config.firstIndexForSamplesInChipWaveList));
   }

   private static _clearSamples(): void {
       EditorConfig.customSamples = null;

       Song._restoreChipWaveListToDefault();

       sampleLoadingState.statusTable = {};
       sampleLoadingState.urlTable = {};
       sampleLoadingState.totalSamples = 0;
       sampleLoadingState.samplesLoaded = 0;
       sampleLoadEvents.dispatchEvent(new SampleLoadedEvent(
           sampleLoadingState.totalSamples,
           sampleLoadingState.samplesLoaded
       ));
   }

   public toJsonObject(enableIntro: boolean = true, loopCount: number = 1, enableOutro: boolean = true): Object {
       const channelArray: Object[] = [];
       for (let channelIndex: number = 0; channelIndex < this.getChannelCount(); channelIndex++) {
           const channel: Channel = this.channels[channelIndex];
           const instrumentArray: Object[] = [];
           const isNoiseChannel: boolean = this.getChannelIsNoise(channelIndex);
           const isModChannel: boolean = this.getChannelIsMod(channelIndex);
           for (const instrument of channel.instruments) {
               instrumentArray.push(instrument.toJsonObject());
           }

           const patternArray: Object[] = [];
           for (const pattern of channel.patterns) {
               patternArray.push(pattern.toJsonObject(this, channel, isModChannel));
           }

           const sequenceArray: number[] = [];
           if (enableIntro) for (let i: number = 0; i < this.loopStart; i++) {
               sequenceArray.push(channel.bars[i]);
           }
           for (let l: number = 0; l < loopCount; l++) for (let i: number = this.loopStart; i < this.loopStart + this.loopLength; i++) {
               sequenceArray.push(channel.bars[i]);
           }
           if (enableOutro) for (let i: number = this.loopStart + this.loopLength; i < this.barCount; i++) {
               sequenceArray.push(channel.bars[i]);
           }

           const channelObject: any = {
               "type": isModChannel ? "mod" : (isNoiseChannel ? "drum" : "pitch"),
               "name": channel.name,
               "instruments": instrumentArray,
               "patterns": patternArray,
               "sequence": sequenceArray,
           };
           if (!isNoiseChannel) {
               // For compatibility with old versions the octave is offset by one.
               channelObject["octaveScrollBar"] = channel.octave - 1;
           }
           channelArray.push(channelObject);
       }

       const result: any = {
           "name": this.title,
           "format": Song._format,
           "version": Song._latestSlarmoosBoxVersion,
           "scale": Config.scales[this.scale].name,
           "customScale": this.scaleCustom,
           "key": Config.keys[this.key].name,
           "keyOctave": this.octave,
           "introBars": this.loopStart,
           "loopBars": this.loopLength,
           "beatsPerBar": this.beatsPerBar,
           "ticksPerBeat": Config.rhythms[this.rhythm].stepsPerBeat,
           "beatsPerMinute": this.tempo,
           "reverb": this.reverb,
           "masterGain": this.masterGain,
           "compressionThreshold": this.compressionThreshold,
           "limitThreshold": this.limitThreshold,
           "limitDecay": this.limitDecay,
           "limitRise": this.limitRise,
           "limitRatio": this.limitRatio,
           "compressionRatio": this.compressionRatio,
           //"outroBars": this.barCount - this.loopStart - this.loopLength; // derive this from bar arrays?
           //"patternCount": this.patternsPerChannel, // derive this from pattern arrays?
           "songEq": this.eqFilter.toJsonObject(),
           "layeredInstruments": this.layeredInstruments,
           "patternInstruments": this.patternInstruments,
           "channels": channelArray,
       };

       //song eq subfilters
       for (let i: number = 0; i < Config.filterMorphCount - 1; i++) {
           result["songEq" + i] = this.eqSubFilters[i];
       }

       if (EditorConfig.customSamples != null && EditorConfig.customSamples.length > 0) {
           result["customSamples"] = EditorConfig.customSamples;
       }

       return result;
   }

   public fromJsonObject(jsonObject: any, jsonFormat: string = "auto"): void {
       this.initToDefault(true);
       if (!jsonObject) return;

       //const version: number = jsonObject["version"] | 0;
       //if (version > Song._latestVersion) return; // Go ahead and try to parse something from the future I guess? JSON is pretty easy-going!

       // Code for auto-detect mode; if statements that are lower down have 'higher priority'
       if (jsonFormat == "auto") {
           if (jsonObject["format"] == "BeepBox") {
               // Assume that if there is a "riff" song setting then it must be modbox
               if (jsonObject["riff"] != undefined) {
                   jsonFormat = "modbox";
               }

               // Assume that if there are limiter song settings then it must be jummbox
               // Despite being added in JB 2.1, json export for the limiter settings wasn't added until 2.3
               if (jsonObject["masterGain"] != undefined) {
                   jsonFormat = "jummbox";
               }
           }
       }

       const format: string = (jsonFormat == "auto" ? jsonObject["format"] : jsonFormat).toLowerCase();

       if (jsonObject["name"] != undefined) {
           this.title = jsonObject["name"];
       }

       if (jsonObject["customSamples"] != undefined) {
           const customSamples: string[] = jsonObject["customSamples"];
           if (EditorConfig.customSamples == null || EditorConfig.customSamples.join(", ") != customSamples.join(", ")) {
               // Have to duplicate the work done in Song.fromBase64String
               // early here, because Instrument.fromJsonObject depends on the
               // chip wave list having the correct items already in memory.

               Config.willReloadForCustomSamples = true;

               Song._restoreChipWaveListToDefault();

               let willLoadLegacySamples: boolean = false;
               let willLoadNintariboxSamples: boolean = false;
               let willLoadMarioPaintboxSamples: boolean = false;
               const customSampleUrls: string[] = [];
               const customSamplePresets: Preset[] = [];
               for (const url of customSamples) {
                   if (url.toLowerCase() === "legacysamples") {
                       if (!willLoadLegacySamples) {
                           willLoadLegacySamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(0);
                       }
                   }
                   else if (url.toLowerCase() === "nintariboxsamples") {
                       if (!willLoadNintariboxSamples) {
                           willLoadNintariboxSamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(1);
                       }
                   }
                   else if (url.toLowerCase() === "mariopaintboxsamples") {
                       if (!willLoadMarioPaintboxSamples) {
                           willLoadMarioPaintboxSamples = true;
                           customSampleUrls.push(url);
                           loadBuiltInSamples(2);
                       }
                   }

                   else {
                       // When EditorConfig.customSamples is saved in the json
                       // export, it should be using the new syntax, unless
                       // the user has manually modified the URL, so we don't
                       // really need to parse the old syntax here.
                       const parseOldSyntax: boolean = false;
                       Song._parseAndConfigureCustomSample(url, customSampleUrls, customSamplePresets, sampleLoadingState, parseOldSyntax);
                   }
               }
               if (customSampleUrls.length > 0) {
                   EditorConfig.customSamples = customSampleUrls;
               }
               if (customSamplePresets.length > 0) {
                   const customSamplePresetsMap: DictionaryArray<Preset> = toNameMap(customSamplePresets);
                   EditorConfig.presetCategories[EditorConfig.presetCategories.length] = {
                       name: "Custom Sample Presets",
                       presets: customSamplePresetsMap,
                       index: EditorConfig.presetCategories.length,
                   };
               }
           }
       } else {
           // No custom samples, so the only possibility at this point is that
           // we need to load the legacy samples. Let's check whether that's
           // necessary.
           let shouldLoadLegacySamples: boolean = false;
           if (jsonObject["channels"] != undefined) {
               for (let channelIndex: number = 0; channelIndex < jsonObject["channels"].length; channelIndex++) {
                   const channelObject: any = jsonObject["channels"][channelIndex];
                   if (channelObject["type"] !== "pitch") {
                       // Legacy samples can only exist in pitch channels.
                       continue;
                   }
                   if (Array.isArray(channelObject["instruments"])) {
                       const instrumentObjects: any[] = channelObject["instruments"];
                       for (let i: number = 0; i < instrumentObjects.length; i++) {
                           const instrumentObject: any = instrumentObjects[i];
                           if (instrumentObject["type"] !== "chip") {
                               // Legacy samples can only exist in chip wave
                               // instruments.
                               continue;
                           }
                           if (instrumentObject["wave"] == null) {
                               // This should exist if things got saved
                               // correctly, but if they didn't, skip this.
                               continue;
                           }
                           const waveName: string = instrumentObject["wave"];
                           // @TODO: Avoid this duplication.
                           const names: string[] = [
                               "paandorasbox kick",
                               "paandorasbox snare",
                               "paandorasbox piano1",
                               "paandorasbox WOW",
                               "paandorasbox overdrive",
                               "paandorasbox trumpet",
                               "paandorasbox saxophone",
                               "paandorasbox orchestrahit",
                               "paandorasbox detatched violin",
                               "paandorasbox synth",
                               "paandorasbox sonic3snare",
                               "paandorasbox come on",
                               "paandorasbox choir",
                               "paandorasbox overdriveguitar",
                               "paandorasbox flute",
                               "paandorasbox legato violin",
                               "paandorasbox tremolo violin",
                               "paandorasbox amen break",
                               "paandorasbox pizzicato violin",
                               "paandorasbox tim allen grunt",
                               "paandorasbox tuba",
                               "paandorasbox loopingcymbal",
                               "paandorasbox standardkick",
                               "paandorasbox standardsnare",
                               "paandorasbox closedhihat",
                               "paandorasbox foothihat",
                               "paandorasbox openhihat",
                               "paandorasbox crashcymbal",
                               "paandorasbox pianoC4",
                               "paandorasbox liver pad",
                               "paandorasbox marimba",
                               "paandorasbox susdotwav",
                               "paandorasbox wackyboxtts",
                               "paandorasbox peppersteak_1",
                               "paandorasbox peppersteak_2",
                               "paandorasbox vinyl_noise",
                               "paandorasbeta slap bass",
                               "paandorasbeta HD EB overdrive guitar",
                               "paandorasbeta sunsoft bass",
                               "paandorasbeta masculine choir",
                               "paandorasbeta feminine choir",
                               "paandorasbeta tololoche",
                               "paandorasbeta harp",
                               "paandorasbeta pan flute",
                               "paandorasbeta krumhorn",
                               "paandorasbeta timpani",
                               "paandorasbeta crowd hey",
                               "paandorasbeta wario land 4 brass",
                               "paandorasbeta wario land 4 rock organ",
                               "paandorasbeta wario land 4 DAOW",
                               "paandorasbeta wario land 4 hour chime",
                               "paandorasbeta wario land 4 tick",
                               "paandorasbeta kirby kick",
                               "paandorasbeta kirby snare",
                               "paandorasbeta kirby bongo",
                               "paandorasbeta kirby click",
                               "paandorasbeta sonor kick",
                               "paandorasbeta sonor snare",
                               "paandorasbeta sonor snare (left hand)",
                               "paandorasbeta sonor snare (right hand)",
                               "paandorasbeta sonor high tom",
                               "paandorasbeta sonor low tom",
                               "paandorasbeta sonor hihat (closed)",
                               "paandorasbeta sonor hihat (half opened)",
                               "paandorasbeta sonor hihat (open)",
                               "paandorasbeta sonor hihat (open tip)",
                               "paandorasbeta sonor hihat (pedal)",
                               "paandorasbeta sonor crash",
                               "paandorasbeta sonor crash (tip)",
                               "paandorasbeta sonor ride"
                           ];
                           // The difference for these is in the doubled a.
                           const oldNames: string[] = [
                               "pandoraasbox kick",
                               "pandoraasbox snare",
                               "pandoraasbox piano1",
                               "pandoraasbox WOW",
                               "pandoraasbox overdrive",
                               "pandoraasbox trumpet",
                               "pandoraasbox saxophone",
                               "pandoraasbox orchestrahit",
                               "pandoraasbox detatched violin",
                               "pandoraasbox synth",
                               "pandoraasbox sonic3snare",
                               "pandoraasbox come on",
                               "pandoraasbox choir",
                               "pandoraasbox overdriveguitar",
                               "pandoraasbox flute",
                               "pandoraasbox legato violin",
                               "pandoraasbox tremolo violin",
                               "pandoraasbox amen break",
                               "pandoraasbox pizzicato violin",
                               "pandoraasbox tim allen grunt",
                               "pandoraasbox tuba",
                               "pandoraasbox loopingcymbal",
                               "pandoraasbox standardkick",
                               "pandoraasbox standardsnare",
                               "pandoraasbox closedhihat",
                               "pandoraasbox foothihat",
                               "pandoraasbox openhihat",
                               "pandoraasbox crashcymbal",
                               "pandoraasbox pianoC4",
                               "pandoraasbox liver pad",
                               "pandoraasbox marimba",
                               "pandoraasbox susdotwav",
                               "pandoraasbox wackyboxtts",
                               "pandoraasbox peppersteak_1",
                               "pandoraasbox peppersteak_2",
                               "pandoraasbox vinyl_noise",
                               "pandoraasbeta slap bass",
                               "pandoraasbeta HD EB overdrive guitar",
                               "pandoraasbeta sunsoft bass",
                               "pandoraasbeta masculine choir",
                               "pandoraasbeta feminine choir",
                               "pandoraasbeta tololoche",
                               "pandoraasbeta harp",
                               "pandoraasbeta pan flute",
                               "pandoraasbeta krumhorn",
                               "pandoraasbeta timpani",
                               "pandoraasbeta crowd hey",
                               "pandoraasbeta wario land 4 brass",
                               "pandoraasbeta wario land 4 rock organ",
                               "pandoraasbeta wario land 4 DAOW",
                               "pandoraasbeta wario land 4 hour chime",
                               "pandoraasbeta wario land 4 tick",
                               "pandoraasbeta kirby kick",
                               "pandoraasbeta kirby snare",
                               "pandoraasbeta kirby bongo",
                               "pandoraasbeta kirby click",
                               "pandoraasbeta sonor kick",
                               "pandoraasbeta sonor snare",
                               "pandoraasbeta sonor snare (left hand)",
                               "pandoraasbeta sonor snare (right hand)",
                               "pandoraasbeta sonor high tom",
                               "pandoraasbeta sonor low tom",
                               "pandoraasbeta sonor hihat (closed)",
                               "pandoraasbeta sonor hihat (half opened)",
                               "pandoraasbeta sonor hihat (open)",
                               "pandoraasbeta sonor hihat (open tip)",
                               "pandoraasbeta sonor hihat (pedal)",
                               "pandoraasbeta sonor crash",
                               "pandoraasbeta sonor crash (tip)",
                               "pandoraasbeta sonor ride"
                           ];
                           // This mirrors paandorasboxWaveNames, which is unprefixed.
                           const veryOldNames: string[] = [
                               "kick",
                               "snare",
                               "piano1",
                               "WOW",
                               "overdrive",
                               "trumpet",
                               "saxophone",
                               "orchestrahit",
                               "detatched violin",
                               "synth",
                               "sonic3snare",
                               "come on",
                               "choir",
                               "overdriveguitar",
                               "flute",
                               "legato violin",
                               "tremolo violin",
                               "amen break",
                               "pizzicato violin",
                               "tim allen grunt",
                               "tuba",
                               "loopingcymbal",
                               "standardkick",
                               "standardsnare",
                               "closedhihat",
                               "foothihat",
                               "openhihat",
                               "crashcymbal",
                               "pianoC4",
                               "liver pad",
                               "marimba",
                               "susdotwav",
                               "wackyboxtts"
                           ];
                           if (names.includes(waveName)) {
                               shouldLoadLegacySamples = true;
                           } else if (oldNames.includes(waveName)) {
                               shouldLoadLegacySamples = true;
                               // If we see one of these old names, update it
                               // to the corresponding new name.
                               instrumentObject["wave"] = names[oldNames.findIndex(x => x === waveName)];
                           } else if (veryOldNames.includes(waveName)) {
                               if ((waveName === "trumpet" || waveName === "flute") && (format != "paandorasbox")) {
                                   // If we see chip waves named trumpet or flute, and if the format isn't PaandorasBox, we leave them as-is
                               } else {
                                   // There's no other chip waves with ambiguous names like that, so it should
                                   // be okay to assume we'll need to load the legacy samples now.
                                   shouldLoadLegacySamples = true;
                                   // If we see one of these old names, update it
                                   // to the corresponding new name.
                                   instrumentObject["wave"] = names[veryOldNames.findIndex(x => x === waveName)];
                               }
                           }
                       }
                   }
               }
           }
           if (shouldLoadLegacySamples) {
               Config.willReloadForCustomSamples = true;

               Song._restoreChipWaveListToDefault();

               loadBuiltInSamples(0);
               EditorConfig.customSamples = ["legacySamples"];
           } else {
               // We don't need to load the legacy samples, but we may have
               // leftover samples in memory. If we do, clear them.
               if (EditorConfig.customSamples != null && EditorConfig.customSamples.length > 0) {
                   // We need to reload anyway in this case, because (for now)
                   // the chip wave lists won't be correctly updated.
                   Config.willReloadForCustomSamples = true;
                   Song._clearSamples();
               }
           }
       }

       this.scale = 0; // default to free.
       if (jsonObject["scale"] != undefined) {
           const oldScaleNames: Dictionary<string> = {
               "romani :)": "double harmonic :)",
               "romani :(": "double harmonic :(",
               "dbl harmonic :)": "double harmonic :)",
               "dbl harmonic :(": "double harmonic :(",
               "enigma": "strange",
           };
           const scaleName: string = (oldScaleNames[jsonObject["scale"]] != undefined) ? oldScaleNames[jsonObject["scale"]] : jsonObject["scale"];
           const scale: number = Config.scales.findIndex(scale => scale.name == scaleName);
           if (scale != -1) this.scale = scale;
           if (this.scale == Config.scales["dictionary"]["Custom"].index) {
               if (jsonObject["customScale"] != undefined) {
                   for (var i of jsonObject["customScale"].keys()) {
                       this.scaleCustom[i] = jsonObject["customScale"][i];
                   }
               }
           }
       }

       if (jsonObject["key"] != undefined) {
           if (typeof (jsonObject["key"]) == "number") {
               this.key = ((jsonObject["key"] + 1200) >>> 0) % Config.keys.length;
           } else if (typeof (jsonObject["key"]) == "string") {
               const key: string = jsonObject["key"];
               // This conversion code depends on C through B being
               // available as keys, of course.
               if (key === "C+") {
                   this.key = 0;
                   this.octave = 1;
               } else if (key === "G- (actually F#-)") {
                   this.key = 6;
                   this.octave = -1;
               } else if (key === "C-") {
                   this.key = 0;
                   this.octave = -1;
               } else if (key === "oh no (F-)") {
                   this.key = 5;
                   this.octave = -1;
               } else {
                   const letter: string = key.charAt(0).toUpperCase();
                   const symbol: string = key.charAt(1).toLowerCase();
                   const letterMap: Readonly<Dictionary<number>> = { "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11 };
                   const accidentalMap: Readonly<Dictionary<number>> = { "#": 1, "♯": 1, "b": -1, "♭": -1 };
                   let index: number | undefined = letterMap[letter];
                   const offset: number | undefined = accidentalMap[symbol];
                   if (index != undefined) {
                       if (offset != undefined) index += offset;
                       if (index < 0) index += 12;
                       index = index % 12;
                       this.key = index;
                   }
               }
           }
       }

       if (jsonObject["beatsPerMinute"] != undefined) {
           this.tempo = clamp(Config.tempoMin, Config.tempoMax + 1, jsonObject["beatsPerMinute"] | 0);
       }

       if (jsonObject["keyOctave"] != undefined) {
           this.octave = clamp(Config.octaveMin, Config.octaveMax + 1, jsonObject["keyOctave"] | 0);
       }

       let legacyGlobalReverb: number = 0; // In older songs, reverb was song-global, record that here and pass it to Instrument.fromJsonObject() for context.
       if (jsonObject["reverb"] != undefined) {
           legacyGlobalReverb = clamp(0, 32, jsonObject["reverb"] | 0);
       }

       if (jsonObject["beatsPerBar"] != undefined) {
           this.beatsPerBar = Math.max(Config.beatsPerBarMin, Math.min(Config.beatsPerBarMax, jsonObject["beatsPerBar"] | 0));
       }

       let importedPartsPerBeat: number = 4;
       if (jsonObject["ticksPerBeat"] != undefined) {
           importedPartsPerBeat = (jsonObject["ticksPerBeat"] | 0) || 4;
           this.rhythm = Config.rhythms.findIndex(rhythm => rhythm.stepsPerBeat == importedPartsPerBeat);
           if (this.rhythm == -1) {
               this.rhythm = 1; //default rhythm
           }
       }

       // Read limiter settings. Ranges and defaults are based on slider settings

       if (jsonObject["masterGain"] != undefined) {
           this.masterGain = Math.max(0.0, Math.min(5.0, jsonObject["masterGain"] || 0));
       } else {
           this.masterGain = 1.0;
       }

       if (jsonObject["limitThreshold"] != undefined) {
           this.limitThreshold = Math.max(0.0, Math.min(2.0, jsonObject["limitThreshold"] || 0));
       } else {
           this.limitThreshold = 1.0;
       }

       if (jsonObject["compressionThreshold"] != undefined) {
           this.compressionThreshold = Math.max(0.0, Math.min(1.1, jsonObject["compressionThreshold"] || 0));
       } else {
           this.compressionThreshold = 1.0;
       }

       if (jsonObject["limitRise"] != undefined) {
           this.limitRise = Math.max(2000.0, Math.min(10000.0, jsonObject["limitRise"] || 0));
       } else {
           this.limitRise = 4000.0;
       }

       if (jsonObject["limitDecay"] != undefined) {
           this.limitDecay = Math.max(1.0, Math.min(30.0, jsonObject["limitDecay"] || 0));
       } else {
           this.limitDecay = 4.0;
       }

       if (jsonObject["limitRatio"] != undefined) {
           this.limitRatio = Math.max(0.0, Math.min(11.0, jsonObject["limitRatio"] || 0));
       } else {
           this.limitRatio = 1.0;
       }

       if (jsonObject["compressionRatio"] != undefined) {
           this.compressionRatio = Math.max(0.0, Math.min(1.168, jsonObject["compressionRatio"] || 0));
       } else {
           this.compressionRatio = 1.0;
       }

       if (jsonObject["songEq"] != undefined) {
           this.eqFilter.fromJsonObject(jsonObject["songEq"]);
       } else {
           this.eqFilter.reset();
       }

       for (let i: number = 0; i < Config.filterMorphCount - 1; i++) {
           if (jsonObject["songEq" + i]) {
               this.eqSubFilters[i] = jsonObject["songEq" + i];
           } else {
               this.eqSubFilters[i] = null;
           }
       }

       let maxInstruments: number = 1;
       let maxPatterns: number = 1;
       let maxBars: number = 1;
       if (jsonObject["channels"] != undefined) {
           for (const channelObject of jsonObject["channels"]) {
               if (channelObject["instruments"]) maxInstruments = Math.max(maxInstruments, channelObject["instruments"].length | 0);
               if (channelObject["patterns"]) maxPatterns = Math.max(maxPatterns, channelObject["patterns"].length | 0);
               if (channelObject["sequence"]) maxBars = Math.max(maxBars, channelObject["sequence"].length | 0);
           }
       }

       if (jsonObject["layeredInstruments"] != undefined) {
           this.layeredInstruments = !!jsonObject["layeredInstruments"];
       } else {
           this.layeredInstruments = false;
       }
       if (jsonObject["patternInstruments"] != undefined) {
           this.patternInstruments = !!jsonObject["patternInstruments"];
       } else {
           this.patternInstruments = (maxInstruments > 1);
       }
       this.patternsPerChannel = Math.min(maxPatterns, Config.barCountMax);
       this.barCount = Math.min(maxBars, Config.barCountMax);

       if (jsonObject["introBars"] != undefined) {
           this.loopStart = clamp(0, this.barCount, jsonObject["introBars"] | 0);
       }
       if (jsonObject["loopBars"] != undefined) {
           this.loopLength = clamp(1, this.barCount - this.loopStart + 1, jsonObject["loopBars"] | 0);
       }

       const newPitchChannels: Channel[] = [];
       const newNoiseChannels: Channel[] = [];
       const newModChannels: Channel[] = [];
       if (jsonObject["channels"] != undefined) {
           for (let channelIndex: number = 0; channelIndex < jsonObject["channels"].length; channelIndex++) {
               let channelObject: any = jsonObject["channels"][channelIndex];

               const channel: Channel = new Channel();

               let isNoiseChannel: boolean = false;
               let isModChannel: boolean = false;
               if (channelObject["type"] != undefined) {
                   isNoiseChannel = (channelObject["type"] == "drum");
                   isModChannel = (channelObject["type"] == "mod");
               } else {
                   // for older files, assume drums are channel 3.
                   isNoiseChannel = (channelIndex >= 3);
               }
               if (isNoiseChannel) {
                   newNoiseChannels.push(channel);
               } else if (isModChannel) {
                   newModChannels.push(channel);
               }
               else {
                   newPitchChannels.push(channel);
               }

               if (channelObject["octaveScrollBar"] != undefined) {
                   channel.octave = clamp(0, Config.pitchOctaves, (channelObject["octaveScrollBar"] | 0) + 1);
                   if (isNoiseChannel) channel.octave = 0;
               }

               if (channelObject["name"] != undefined) {
                   channel.name = channelObject["name"];
               }
               else {
                   channel.name = "";
               }

               if (Array.isArray(channelObject["instruments"])) {
                   const instrumentObjects: any[] = channelObject["instruments"];
                   for (let i: number = 0; i < instrumentObjects.length; i++) {
                       if (i >= this.getMaxInstrumentsPerChannel()) break;
                       const instrument: Instrument = new Instrument(isNoiseChannel, isModChannel);
                       channel.instruments[i] = instrument;
                       instrument.fromJsonObject(instrumentObjects[i], isNoiseChannel, isModChannel, false, false, legacyGlobalReverb, format);
                   }

               }

               for (let i: number = 0; i < this.patternsPerChannel; i++) {
                   const pattern: Pattern = new Pattern();
                   channel.patterns[i] = pattern;

                   let patternObject: any = undefined;
                   if (channelObject["patterns"]) patternObject = channelObject["patterns"][i];
                   if (patternObject == undefined) continue;

                   pattern.fromJsonObject(patternObject, this, channel, importedPartsPerBeat, isNoiseChannel, isModChannel, format);
               }
               channel.patterns.length = this.patternsPerChannel;

               for (let i: number = 0; i < this.barCount; i++) {
                   channel.bars[i] = (channelObject["sequence"] != undefined) ? Math.min(this.patternsPerChannel, channelObject["sequence"][i] >>> 0) : 0;
               }
               channel.bars.length = this.barCount;
           }
       }

       if (newPitchChannels.length > Config.pitchChannelCountMax) newPitchChannels.length = Config.pitchChannelCountMax;
       if (newNoiseChannels.length > Config.noiseChannelCountMax) newNoiseChannels.length = Config.noiseChannelCountMax;
       if (newModChannels.length > Config.modChannelCountMax) newModChannels.length = Config.modChannelCountMax;
       this.pitchChannelCount = newPitchChannels.length;
       this.noiseChannelCount = newNoiseChannels.length;
       this.modChannelCount = newModChannels.length;
       this.channels.length = 0;
       Array.prototype.push.apply(this.channels, newPitchChannels);
       Array.prototype.push.apply(this.channels, newNoiseChannels);
       Array.prototype.push.apply(this.channels, newModChannels);

       if (Config.willReloadForCustomSamples) {
           window.location.hash = this.toBase64String();
           // The prompt seems to get stuck if reloading is done too quickly.
           setTimeout(() => { location.reload(); }, 50);
       }
   }

   public getPattern(channelIndex: number, bar: number): Pattern | null {
       if (bar < 0 || bar >= this.barCount) return null;
       const patternIndex: number = this.channels[channelIndex].bars[bar];
       if (patternIndex == 0) return null;
       return this.channels[channelIndex].patterns[patternIndex - 1];
   }

   public getBeatsPerMinute(): number {
       return this.tempo;
   }

   public static getNeededBits(maxValue: number): number {
       return 32 - Math.clz32(Math.ceil(maxValue + 1) - 1);
   }

   public restoreLimiterDefaults(): void {
       this.compressionRatio = 1.0;
       this.limitRatio = 1.0;
       this.limitRise = 4000.0;
       this.limitDecay = 4.0;
       this.limitThreshold = 1.0;
       this.compressionThreshold = 1.0;
       this.masterGain = 1.0;
   }
}

class PickedString {
   public delayLine: Float32Array | null = null;
   public delayIndex: number;
   public allPassSample: number;
   public allPassPrevInput: number;
   public sustainFilterSample: number;
   public sustainFilterPrevOutput2: number;
   public sustainFilterPrevInput1: number;
   public sustainFilterPrevInput2: number;
   public fractionalDelaySample: number;
   public prevDelayLength: number;
   public delayLengthDelta: number;
   public delayResetOffset: number;

   public allPassG: number = 0.0;
   public allPassGDelta: number = 0.0;
   public sustainFilterA1: number = 0.0;
   public sustainFilterA1Delta: number = 0.0;
   public sustainFilterA2: number = 0.0;
   public sustainFilterA2Delta: number = 0.0;
   public sustainFilterB0: number = 0.0;
   public sustainFilterB0Delta: number = 0.0;
   public sustainFilterB1: number = 0.0;
   public sustainFilterB1Delta: number = 0.0;
   public sustainFilterB2: number = 0.0;
   public sustainFilterB2Delta: number = 0.0;

   constructor() {
       this.reset();
   }

   public reset(): void {
       this.delayIndex = -1;
       this.allPassSample = 0.0;
       this.allPassPrevInput = 0.0;
       this.sustainFilterSample = 0.0;
       this.sustainFilterPrevOutput2 = 0.0;
       this.sustainFilterPrevInput1 = 0.0;
       this.sustainFilterPrevInput2 = 0.0;
       this.fractionalDelaySample = 0.0;
       this.prevDelayLength = -1.0;
       this.delayResetOffset = 0;
   }

   public update(synth: Synth, instrumentState: InstrumentState, tone: Tone, stringIndex: number, roundedSamplesPerTick: number, stringDecayStart: number, stringDecayEnd: number, sustainType: SustainType): void {
       const allPassCenter: number = 2.0 * Math.PI * Config.pickedStringDispersionCenterFreq / synth.samplesPerSecond;

       const prevDelayLength: number = this.prevDelayLength;

       const phaseDeltaStart: number = tone.phaseDeltas[stringIndex];
       const phaseDeltaScale: number = tone.phaseDeltaScales[stringIndex];
       const phaseDeltaEnd: number = phaseDeltaStart * Math.pow(phaseDeltaScale, roundedSamplesPerTick);

       const radiansPerSampleStart: number = Math.PI * 2.0 * phaseDeltaStart;
       const radiansPerSampleEnd: number = Math.PI * 2.0 * phaseDeltaEnd;

       const centerHarmonicStart: number = radiansPerSampleStart * 2.0;
       const centerHarmonicEnd: number = radiansPerSampleEnd * 2.0;

       const allPassRadiansStart: number = Math.min(Math.PI, radiansPerSampleStart * Config.pickedStringDispersionFreqMult * Math.pow(allPassCenter / radiansPerSampleStart, Config.pickedStringDispersionFreqScale));
       const allPassRadiansEnd: number = Math.min(Math.PI, radiansPerSampleEnd * Config.pickedStringDispersionFreqMult * Math.pow(allPassCenter / radiansPerSampleEnd, Config.pickedStringDispersionFreqScale));
       const shelfRadians: number = 2.0 * Math.PI * Config.pickedStringShelfHz / synth.samplesPerSecond;
       const decayCurveStart: number = (Math.pow(100.0, stringDecayStart) - 1.0) / 99.0;
       const decayCurveEnd: number = (Math.pow(100.0, stringDecayEnd) - 1.0) / 99.0;
       const register: number = sustainType == SustainType.acoustic ? 0.25 : 0.0;
       const registerShelfCenter: number = 15.6;
       const registerLowpassCenter: number = 3.0 * synth.samplesPerSecond / 48000;
       //const decayRateStart: number = Math.pow(0.5, decayCurveStart * shelfRadians / radiansPerSampleStart);
       //const decayRateEnd: number   = Math.pow(0.5, decayCurveEnd   * shelfRadians / radiansPerSampleEnd);
       const decayRateStart: number = Math.pow(0.5, decayCurveStart * Math.pow(shelfRadians / (radiansPerSampleStart * registerShelfCenter), (1.0 + 2.0 * register)) * registerShelfCenter);
       const decayRateEnd: number = Math.pow(0.5, decayCurveEnd * Math.pow(shelfRadians / (radiansPerSampleEnd * registerShelfCenter), (1.0 + 2.0 * register)) * registerShelfCenter);

       const expressionDecayStart: number = Math.pow(decayRateStart, 0.002);
       const expressionDecayEnd: number = Math.pow(decayRateEnd, 0.002);

       Synth.tempFilterStartCoefficients.allPass1stOrderInvertPhaseAbove(allPassRadiansStart);
       synth.tempFrequencyResponse.analyze(Synth.tempFilterStartCoefficients, centerHarmonicStart);
       const allPassGStart: number = Synth.tempFilterStartCoefficients.b[0]; /* same as a[1] */
       const allPassPhaseDelayStart: number = -synth.tempFrequencyResponse.angle() / centerHarmonicStart;

       Synth.tempFilterEndCoefficients.allPass1stOrderInvertPhaseAbove(allPassRadiansEnd);
       synth.tempFrequencyResponse.analyze(Synth.tempFilterEndCoefficients, centerHarmonicEnd);
       const allPassGEnd: number = Synth.tempFilterEndCoefficients.b[0]; /* same as a[1] */
       const allPassPhaseDelayEnd: number = -synth.tempFrequencyResponse.angle() / centerHarmonicEnd;

       // 1st order shelf filters and 2nd order lowpass filters have differently shaped frequency
       // responses, as well as adjustable shapes. I originally picked a 1st order shelf filter,
       // but I kinda prefer 2nd order lowpass filters now and I designed a couple settings:
       const enum PickedStringBrightnessType {
           bright, // 1st order shelf
           normal, // 2nd order lowpass, rounded corner
           resonant, // 3rd order lowpass, harder corner
       }
       const brightnessType: PickedStringBrightnessType = <any>sustainType == SustainType.bright ? PickedStringBrightnessType.bright : PickedStringBrightnessType.normal;
       if (brightnessType == PickedStringBrightnessType.bright) {
           const shelfGainStart: number = Math.pow(decayRateStart, Config.stringDecayRate);
           const shelfGainEnd: number = Math.pow(decayRateEnd, Config.stringDecayRate);
           Synth.tempFilterStartCoefficients.highShelf2ndOrder(shelfRadians, shelfGainStart, 0.5);
           Synth.tempFilterEndCoefficients.highShelf2ndOrder(shelfRadians, shelfGainEnd, 0.5);
       } else {
           const cornerHardness: number = Math.pow(brightnessType == PickedStringBrightnessType.normal ? 0.0 : 1.0, 0.25);
           const lowpass1stOrderCutoffRadiansStart: number = Math.pow(registerLowpassCenter * registerLowpassCenter * radiansPerSampleStart * 3.3 * 48000 / synth.samplesPerSecond, 0.5 + register) / registerLowpassCenter / Math.pow(decayCurveStart, .5);
           const lowpass1stOrderCutoffRadiansEnd: number = Math.pow(registerLowpassCenter * registerLowpassCenter * radiansPerSampleEnd * 3.3 * 48000 / synth.samplesPerSecond, 0.5 + register) / registerLowpassCenter / Math.pow(decayCurveEnd, .5);
           const lowpass2ndOrderCutoffRadiansStart: number = lowpass1stOrderCutoffRadiansStart * Math.pow(2.0, 0.5 - 1.75 * (1.0 - Math.pow(1.0 - cornerHardness, 0.85)));
           const lowpass2ndOrderCutoffRadiansEnd: number = lowpass1stOrderCutoffRadiansEnd * Math.pow(2.0, 0.5 - 1.75 * (1.0 - Math.pow(1.0 - cornerHardness, 0.85)));
           const lowpass2ndOrderGainStart: number = Math.pow(2.0, -Math.pow(2.0, -Math.pow(cornerHardness, 0.9)));
           const lowpass2ndOrderGainEnd: number = Math.pow(2.0, -Math.pow(2.0, -Math.pow(cornerHardness, 0.9)));
           Synth.tempFilterStartCoefficients.lowPass2ndOrderButterworth(warpInfinityToNyquist(lowpass2ndOrderCutoffRadiansStart), lowpass2ndOrderGainStart);
           Synth.tempFilterEndCoefficients.lowPass2ndOrderButterworth(warpInfinityToNyquist(lowpass2ndOrderCutoffRadiansEnd), lowpass2ndOrderGainEnd);
       }

       synth.tempFrequencyResponse.analyze(Synth.tempFilterStartCoefficients, centerHarmonicStart);
       const sustainFilterA1Start: number = Synth.tempFilterStartCoefficients.a[1];
       const sustainFilterA2Start: number = Synth.tempFilterStartCoefficients.a[2];
       const sustainFilterB0Start: number = Synth.tempFilterStartCoefficients.b[0] * expressionDecayStart;
       const sustainFilterB1Start: number = Synth.tempFilterStartCoefficients.b[1] * expressionDecayStart;
       const sustainFilterB2Start: number = Synth.tempFilterStartCoefficients.b[2] * expressionDecayStart;
       const sustainFilterPhaseDelayStart: number = -synth.tempFrequencyResponse.angle() / centerHarmonicStart;

       synth.tempFrequencyResponse.analyze(Synth.tempFilterEndCoefficients, centerHarmonicEnd);
       const sustainFilterA1End: number = Synth.tempFilterEndCoefficients.a[1];
       const sustainFilterA2End: number = Synth.tempFilterEndCoefficients.a[2];
       const sustainFilterB0End: number = Synth.tempFilterEndCoefficients.b[0] * expressionDecayEnd;
       const sustainFilterB1End: number = Synth.tempFilterEndCoefficients.b[1] * expressionDecayEnd;
       const sustainFilterB2End: number = Synth.tempFilterEndCoefficients.b[2] * expressionDecayEnd;
       const sustainFilterPhaseDelayEnd: number = -synth.tempFrequencyResponse.angle() / centerHarmonicEnd;

       const periodLengthStart: number = 1.0 / phaseDeltaStart;
       const periodLengthEnd: number = 1.0 / phaseDeltaEnd;
       const minBufferLength: number = Math.ceil(Math.max(periodLengthStart, periodLengthEnd) * 2);
       const delayLength: number = periodLengthStart - allPassPhaseDelayStart - sustainFilterPhaseDelayStart;
       const delayLengthEnd: number = periodLengthEnd - allPassPhaseDelayEnd - sustainFilterPhaseDelayEnd;

       this.prevDelayLength = delayLength;
       this.delayLengthDelta = (delayLengthEnd - delayLength) / roundedSamplesPerTick;
       this.allPassG = allPassGStart;
       this.sustainFilterA1 = sustainFilterA1Start;
       this.sustainFilterA2 = sustainFilterA2Start;
       this.sustainFilterB0 = sustainFilterB0Start;
       this.sustainFilterB1 = sustainFilterB1Start;
       this.sustainFilterB2 = sustainFilterB2Start;
       this.allPassGDelta = (allPassGEnd - allPassGStart) / roundedSamplesPerTick;
       this.sustainFilterA1Delta = (sustainFilterA1End - sustainFilterA1Start) / roundedSamplesPerTick;
       this.sustainFilterA2Delta = (sustainFilterA2End - sustainFilterA2Start) / roundedSamplesPerTick;
       this.sustainFilterB0Delta = (sustainFilterB0End - sustainFilterB0Start) / roundedSamplesPerTick;
       this.sustainFilterB1Delta = (sustainFilterB1End - sustainFilterB1Start) / roundedSamplesPerTick;
       this.sustainFilterB2Delta = (sustainFilterB2End - sustainFilterB2Start) / roundedSamplesPerTick;

       const pitchChanged: boolean = Math.abs(Math.log2(delayLength / prevDelayLength)) > 0.01;

       const reinitializeImpulse: boolean = (this.delayIndex == -1 || pitchChanged);
       if (this.delayLine == null || this.delayLine.length <= minBufferLength) {
           // The delay line buffer will get reused for other tones so might as well
           // start off with a buffer size that is big enough for most notes.
           const likelyMaximumLength: number = Math.ceil(2 * synth.samplesPerSecond / Instrument.frequencyFromPitch(12));
           const newDelayLine: Float32Array = new Float32Array(Synth.fittingPowerOfTwo(Math.max(likelyMaximumLength, minBufferLength)));
           if (!reinitializeImpulse && this.delayLine != null) {
               // If the tone has already started but the buffer needs to be reallocated,
               // transfer the old data to the new buffer.
               const oldDelayBufferMask: number = (this.delayLine.length - 1) >> 0;
               const startCopyingFromIndex: number = this.delayIndex + this.delayResetOffset;
               this.delayIndex = this.delayLine.length - this.delayResetOffset;
               for (let i: number = 0; i < this.delayLine.length; i++) {
                   newDelayLine[i] = this.delayLine[(startCopyingFromIndex + i) & oldDelayBufferMask];
               }
           }
           this.delayLine = newDelayLine;
       }
       const delayLine: Float32Array = this.delayLine;
       const delayBufferMask: number = (delayLine.length - 1) >> 0;

       if (reinitializeImpulse) {
           // -1 delay index means the tone was reset.
           // Also, if the pitch changed suddenly (e.g. from seamless or arpeggio) then reset the wave.

           this.delayIndex = 0;
           this.allPassSample = 0.0;
           this.allPassPrevInput = 0.0;
           this.sustainFilterSample = 0.0;
           this.sustainFilterPrevOutput2 = 0.0;
           this.sustainFilterPrevInput1 = 0.0;
           this.sustainFilterPrevInput2 = 0.0;
           this.fractionalDelaySample = 0.0;

           // Clear away a region of the delay buffer for the new impulse.
           const startImpulseFrom: number = -delayLength;
           const startZerosFrom: number = Math.floor(startImpulseFrom - periodLengthStart / 2);
           const stopZerosAt: number = Math.ceil(startZerosFrom + periodLengthStart * 2);
           this.delayResetOffset = stopZerosAt; // And continue clearing the area in front of the delay line.
           for (let i: number = startZerosFrom; i <= stopZerosAt; i++) {
               delayLine[i & delayBufferMask] = 0.0;
           }

           const impulseWave: Float32Array = instrumentState.wave!;
           const impulseWaveLength: number = impulseWave.length - 1; // The first sample is duplicated at the end, don't double-count it.
           const impulsePhaseDelta: number = impulseWaveLength / periodLengthStart;

           const fadeDuration: number = Math.min(periodLengthStart * 0.2, synth.samplesPerSecond * 0.003);
           const startImpulseFromSample: number = Math.ceil(startImpulseFrom);
           const stopImpulseAt: number = startImpulseFrom + periodLengthStart + fadeDuration;
           const stopImpulseAtSample: number = stopImpulseAt;
           let impulsePhase: number = (startImpulseFromSample - startImpulseFrom) * impulsePhaseDelta;
           let prevWaveIntegral: number = 0.0;
           for (let i: number = startImpulseFromSample; i <= stopImpulseAtSample; i++) {
               const impulsePhaseInt: number = impulsePhase | 0;
               const index: number = impulsePhaseInt % impulseWaveLength;
               let nextWaveIntegral: number = impulseWave[index];
               const phaseRatio: number = impulsePhase - impulsePhaseInt;
               nextWaveIntegral += (impulseWave[index + 1] - nextWaveIntegral) * phaseRatio;
               const sample: number = (nextWaveIntegral - prevWaveIntegral) / impulsePhaseDelta;
               const fadeIn: number = Math.min(1.0, (i - startImpulseFrom) / fadeDuration);
               const fadeOut: number = Math.min(1.0, (stopImpulseAt - i) / fadeDuration);
               const combinedFade: number = fadeIn * fadeOut;
               const curvedFade: number = combinedFade * combinedFade * (3.0 - 2.0 * combinedFade); // A cubic sigmoid from 0 to 1.
               delayLine[i & delayBufferMask] += sample * curvedFade;
               prevWaveIntegral = nextWaveIntegral;
               impulsePhase += impulsePhaseDelta;
           }
       }
   }
}

class EnvelopeComputer {
   // "Unscaled" values do not increase with Envelope Speed's timescale factor. Thus they are "real" seconds since the start of the note.
   // Fade envelopes notably use unscaled values instead of being tied to Envelope Speed.
   public noteSecondsStart: number[] = [];
   public noteSecondsStartUnscaled: number = 0.0;
   public noteSecondsEnd: number[] = [];
   public noteSecondsEndUnscaled: number = 0.0;
   public noteTicksStart: number = 0.0;
   public noteTicksEnd: number = 0.0;
   public noteSizeStart: number = Config.noteSizeMax;
   public noteSizeEnd: number = Config.noteSizeMax;
   public prevNoteSize: number = Config.noteSizeMax;
   public nextNoteSize: number = Config.noteSizeMax;
   private _noteSizeFinal: number = Config.noteSizeMax;
   public prevNoteSecondsStart: number[] = [];
   public prevNoteSecondsStartUnscaled: number = 0.0;
   public prevNoteSecondsEnd: number[] = [];
   public prevNoteSecondsEndUnscaled: number = 0.0;
   public prevNoteTicksStart: number = 0.0;
   public prevNoteTicksEnd: number = 0.0;
   private _prevNoteSizeFinal: number = Config.noteSizeMax;
   public tickTimeEnd: number[] = [];

   public drumsetFilterEnvelopeStart: number = 0.0;
   public drumsetFilterEnvelopeEnd: number = 0.0;

   public prevSlideStart: boolean = false;
   public prevSlideEnd: boolean = false;
   public nextSlideStart: boolean = false;
   public nextSlideEnd: boolean = false;
   public prevSlideRatioStart: number = 0.0;
   public prevSlideRatioEnd: number = 0.0;
   public nextSlideRatioStart: number = 0.0;
   public nextSlideRatioEnd: number = 0.0;

   public startPinTickAbsolute: number | null = null;
   private startPinTickDefaultPitch: number | null = null;
   private startPinTickPitch: number | null = null;

   public readonly envelopeStarts: number[] = [];
   public readonly envelopeEnds: number[] = [];
   private readonly _modifiedEnvelopeIndices: number[] = [];
   private _modifiedEnvelopeCount: number = 0;
   public lowpassCutoffDecayVolumeCompensation: number = 1.0;

   constructor(/*private _perNote: boolean*/) {
       //const length: number = this._perNote ? EnvelopeComputeIndex.length : InstrumentAutomationIndex.length;
       const length: number = EnvelopeComputeIndex.length;
       for (let i: number = 0; i < length; i++) {
           this.envelopeStarts[i] = 1.0;
           this.envelopeEnds[i] = 1.0;
       }

       this.reset();
   }

   public reset(): void {
       for (let envelopeIndex: number = 0; envelopeIndex < Config.maxEnvelopeCount + 1; envelopeIndex++) {
           this.noteSecondsEnd[envelopeIndex] = 0.0;
           this.prevNoteSecondsEnd[envelopeIndex] = 0.0;
       }
       this.noteSecondsEndUnscaled = 0.0;
       this.noteTicksEnd = 0.0;
       this._noteSizeFinal = Config.noteSizeMax;
       this.prevNoteSecondsEndUnscaled = 0.0;
       this.prevNoteTicksEnd = 0.0;
       this._prevNoteSizeFinal = Config.noteSizeMax;
       this._modifiedEnvelopeCount = 0;
       this.drumsetFilterEnvelopeStart = 0.0;
       this.drumsetFilterEnvelopeEnd = 0.0;
       this.startPinTickAbsolute = null;
       this.startPinTickDefaultPitch = null;
       this.startPinTickPitch = null
   }

   public computeEnvelopes(instrument: Instrument, currentPart: number, tickTimeStart: number[], tickTimeStartReal: number, secondsPerTick: number, tone: Tone | null, timeScale: number[], instrumentState: InstrumentState, synth: Synth, channelIndex: number, instrumentIndex: number): void {
       const secondsPerTickUnscaled: number = secondsPerTick;
       const transition: Transition = instrument.getTransition();
       if (tone != null && tone.atNoteStart && !transition.continues && !tone.forceContinueAtStart) {
           this.prevNoteSecondsEndUnscaled = this.noteSecondsEndUnscaled;
           this.prevNoteTicksEnd = this.noteTicksEnd;
           this._prevNoteSizeFinal = this._noteSizeFinal;
           this.noteSecondsEndUnscaled = 0.0;
           this.noteTicksEnd = 0.0;
           for (let envelopeIndex: number = 0; envelopeIndex < Config.maxEnvelopeCount + 1; envelopeIndex++) {
               this.prevNoteSecondsEnd[envelopeIndex] = this.noteSecondsEnd[envelopeIndex];
               this.noteSecondsEnd[envelopeIndex] = 0.0;
           }
       }
       if (tone != null) {
           if (tone.note != null) {
               this._noteSizeFinal = tone.note.pins[tone.note.pins.length - 1].size;
           } else {
               this._noteSizeFinal = Config.noteSizeMax;
           }
       }
       const tickTimeEnd: number[] = [];
       const tickTimeEndReal: number = tickTimeStartReal + 1.0;
       const noteSecondsStart: number[] = [];
       const noteSecondsStartUnscaled: number = this.noteSecondsEndUnscaled;
       const noteSecondsEnd: number[] = [];
       const noteSecondsEndUnscaled: number = noteSecondsStartUnscaled + secondsPerTickUnscaled;
       const noteTicksStart: number = this.noteTicksEnd;
       const noteTicksEnd: number = noteTicksStart + 1.0;
       const prevNoteSecondsStart: number[] = [];
       const prevNoteSecondsEnd: number[] = [];
       const prevNoteSecondsStartUnscaled: number = this.prevNoteSecondsEndUnscaled;
       const prevNoteSecondsEndUnscaled: number = prevNoteSecondsStartUnscaled + secondsPerTickUnscaled;
       const prevNoteTicksStart: number = this.prevNoteTicksEnd;
       const prevNoteTicksEnd: number = prevNoteTicksStart + 1.0;

       const beatsPerTick: number = 1.0 / (Config.ticksPerPart * Config.partsPerBeat);
       const beatTimeStart: number[] = [];
       const beatTimeEnd: number[] = [];

       let noteSizeStart: number = this._noteSizeFinal;
       let noteSizeEnd: number = this._noteSizeFinal;
       let prevNoteSize: number = this._prevNoteSizeFinal;
       let nextNoteSize: number = 0;
       let prevSlideStart: boolean = false;
       let prevSlideEnd: boolean = false;
       let nextSlideStart: boolean = false;
       let nextSlideEnd: boolean = false;
       let prevSlideRatioStart: number = 0.0;
       let prevSlideRatioEnd: number = 0.0;
       let nextSlideRatioStart: number = 0.0;
       let nextSlideRatioEnd: number = 0.0;
       if (tone == null) {
           this.startPinTickAbsolute = null;
           this.startPinTickDefaultPitch = null;
       }
       if (tone != null && tone.note != null && !tone.passedEndOfNote) {
           const endPinIndex: number = tone.note.getEndPinIndex(currentPart);
           const startPin: NotePin = tone.note.pins[endPinIndex - 1];
           const endPin: NotePin = tone.note.pins[endPinIndex];
           const startPinTick = (tone.note.start + startPin.time) * Config.ticksPerPart;
           if (this.startPinTickAbsolute == null || (!(transition.continues || transition.slides)) && tone.passedEndOfNote) this.startPinTickAbsolute = startPinTick + synth.computeTicksSinceStart(true); //for random per note
           if (this.startPinTickDefaultPitch == null ||/* (!(transition.continues || transition.slides)) &&*/ tone.passedEndOfNote) this.startPinTickDefaultPitch = this.getPitchValue(instrument, tone, instrumentState, false);
           if (!tone.passedEndOfNote) this.startPinTickPitch = this.getPitchValue(instrument, tone, instrumentState, true);
           const endPinTick: number = (tone.note.start + endPin.time) * Config.ticksPerPart;
           const ratioStart: number = (tickTimeStartReal - startPinTick) / (endPinTick - startPinTick);
           const ratioEnd: number = (tickTimeEndReal - startPinTick) / (endPinTick - startPinTick);
           noteSizeStart = startPin.size + (endPin.size - startPin.size) * ratioStart;
           noteSizeEnd = startPin.size + (endPin.size - startPin.size) * ratioEnd;

           if (transition.slides) {
               const noteStartTick: number = tone.noteStartPart * Config.ticksPerPart;
               const noteEndTick: number = tone.noteEndPart * Config.ticksPerPart;
               const noteLengthTicks: number = noteEndTick - noteStartTick;
               const maximumSlideTicks: number = noteLengthTicks * 0.5;
               const slideTicks: number = Math.min(maximumSlideTicks, transition.slideTicks);
               if (tone.prevNote != null && !tone.forceContinueAtStart) {
                   if (tickTimeStartReal - noteStartTick < slideTicks) {
                       prevSlideStart = true;
                       prevSlideRatioStart = 0.5 * (1.0 - (tickTimeStartReal - noteStartTick) / slideTicks);
                   }
                   if (tickTimeEndReal - noteStartTick < slideTicks) {
                       prevSlideEnd = true;
                       prevSlideRatioEnd = 0.5 * (1.0 - (tickTimeEndReal - noteStartTick) / slideTicks);
                   }
               }
               if (tone.nextNote != null && !tone.forceContinueAtEnd) {
                   nextNoteSize = tone.nextNote.pins[0].size
                   if (noteEndTick - tickTimeStartReal < slideTicks) {
                       nextSlideStart = true;
                       nextSlideRatioStart = 0.5 * (1.0 - (noteEndTick - tickTimeStartReal) / slideTicks);
                   }
                   if (noteEndTick - tickTimeEndReal < slideTicks) {
                       nextSlideEnd = true;
                       nextSlideRatioEnd = 0.5 * (1.0 - (noteEndTick - tickTimeEndReal) / slideTicks);
                   }
               }
           }
       }

       let lowpassCutoffDecayVolumeCompensation: number = 1.0;
       let usedNoteSize = false;
       for (let envelopeIndex: number = 0; envelopeIndex <= instrument.envelopeCount; envelopeIndex++) {
           let automationTarget: AutomationTarget;
           let targetIndex: number;
           let envelope: Envelope;

           let inverse: boolean = false;
           let isDiscrete: boolean = false;
           let perEnvelopeSpeed: number = 1;
           let globalEnvelopeSpeed: number = 1;
           let envelopeSpeed: number = perEnvelopeSpeed * globalEnvelopeSpeed;
           let perEnvelopeLowerBound: number = 0;
           let perEnvelopeUpperBound: number = 1;
           let timeSinceStart: number = 0;
           let steps: number = 2;
           let seed: number = 2;
           let waveform: number = LFOEnvelopeTypes.sine;
           let startPinTickAbsolute: number = this.startPinTickAbsolute || 0.0;
           let defaultPitch: number = this.startPinTickDefaultPitch || 0.0;
           if (envelopeIndex == instrument.envelopeCount) {
               if (usedNoteSize /*|| !this._perNote*/) break;
               // Special case: if no other envelopes used note size, default to applying it to note volume.
               automationTarget = Config.instrumentAutomationTargets.dictionary["noteVolume"];
               targetIndex = 0;
               envelope = Config.newEnvelopes.dictionary["note size"];
           } else {
               let envelopeSettings: EnvelopeSettings = instrument.envelopes[envelopeIndex];
               automationTarget = Config.instrumentAutomationTargets[envelopeSettings.target];
               targetIndex = envelopeSettings.index;
               envelope = Config.newEnvelopes[envelopeSettings.envelope];
               inverse = instrument.envelopes[envelopeIndex].inverse;
               isDiscrete = instrument.envelopes[envelopeIndex].discrete;
               perEnvelopeSpeed = instrument.envelopes[envelopeIndex].perEnvelopeSpeed;
               globalEnvelopeSpeed = Math.pow(instrument.envelopeSpeed, 2) / 144;
               envelopeSpeed = perEnvelopeSpeed * globalEnvelopeSpeed;

               perEnvelopeLowerBound = instrument.envelopes[envelopeIndex].perEnvelopeLowerBound;
               perEnvelopeUpperBound = instrument.envelopes[envelopeIndex].perEnvelopeUpperBound;
               if (synth.isModActive(Config.modulators.dictionary["individual envelope lower bound"].index, channelIndex, instrumentIndex) && instrument.envelopes[envelopeIndex].tempEnvelopeLowerBound != null) { //modulation
                   perEnvelopeLowerBound = instrument.envelopes[envelopeIndex].tempEnvelopeLowerBound!;
               }
               if (synth.isModActive(Config.modulators.dictionary["individual envelope upper bound"].index, channelIndex, instrumentIndex) && instrument.envelopes[envelopeIndex].tempEnvelopeUpperBound != null) { //modulation
                   perEnvelopeUpperBound = instrument.envelopes[envelopeIndex].tempEnvelopeUpperBound!;
               }
               if (!(perEnvelopeLowerBound <= perEnvelopeUpperBound)) { //reset bounds if incorrect
                   perEnvelopeLowerBound = 0;
                   perEnvelopeUpperBound = 1;
               }

               timeSinceStart = synth.computeTicksSinceStart();
               steps = instrument.envelopes[envelopeIndex].steps;
               seed = instrument.envelopes[envelopeIndex].seed;
               if (instrument.envelopes[envelopeIndex].waveform >= (envelope.name == "lfo" ? LFOEnvelopeTypes.length : RandomEnvelopeTypes.length)) {
                   instrument.envelopes[envelopeIndex].waveform = 0; //make sure that waveform is a proper index
               }
               waveform = instrument.envelopes[envelopeIndex].waveform;


               if (!timeScale[envelopeIndex]) timeScale[envelopeIndex] = 0;

               const secondsPerTickScaled: number = secondsPerTick * timeScale[envelopeIndex];
               if (!tickTimeStart[envelopeIndex]) tickTimeStart[envelopeIndex] = 0; //prevents tremolos from causing a NaN width error
               tickTimeEnd[envelopeIndex] = tickTimeStart[envelopeIndex] ? tickTimeStart[envelopeIndex] + timeScale[envelopeIndex] : timeScale[envelopeIndex];
               noteSecondsStart[envelopeIndex] = this.noteSecondsEnd[envelopeIndex] ? this.noteSecondsEnd[envelopeIndex] : 0;
               prevNoteSecondsStart[envelopeIndex] = this.prevNoteSecondsEnd[envelopeIndex] ? this.prevNoteSecondsEnd[envelopeIndex] : 0;
               noteSecondsEnd[envelopeIndex] = noteSecondsStart[envelopeIndex] ? noteSecondsStart[envelopeIndex] + secondsPerTickScaled : secondsPerTickScaled;
               prevNoteSecondsEnd[envelopeIndex] = prevNoteSecondsStart[envelopeIndex] ? prevNoteSecondsStart[envelopeIndex] + secondsPerTickScaled : secondsPerTickScaled;
               beatTimeStart[envelopeIndex] = tickTimeStart[envelopeIndex] ? beatsPerTick * tickTimeStart[envelopeIndex] : beatsPerTick;
               beatTimeEnd[envelopeIndex] = tickTimeEnd[envelopeIndex] ? beatsPerTick * tickTimeEnd[envelopeIndex] : beatsPerTick;

               if (envelope.type == EnvelopeType.noteSize) usedNoteSize = true;
           }
           //only calculate pitch if needed
           const pitch: number = (envelope.type == EnvelopeType.pitch) ? this.computePitchEnvelope(instrument, envelopeIndex, (this.startPinTickPitch || this.getPitchValue(instrument, tone, instrumentState, true))) : 0;

           //calculate envelope values if target isn't null
           if (automationTarget.computeIndex != null) {
               const computeIndex: number = automationTarget.computeIndex + targetIndex;
               let envelopeStart: number = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, noteSecondsStartUnscaled, noteSecondsStart[envelopeIndex], beatTimeStart[envelopeIndex], timeSinceStart, noteSizeStart, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
               if (prevSlideStart) {
                   const other: number = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, prevNoteSecondsStartUnscaled, prevNoteSecondsStart[envelopeIndex], beatTimeStart[envelopeIndex], timeSinceStart, prevNoteSize, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
                   envelopeStart += (other - envelopeStart) * prevSlideRatioStart;
               }
               if (nextSlideStart) {
                   const other: number = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, 0.0, 0.0, beatTimeStart[envelopeIndex], timeSinceStart, nextNoteSize, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
                   envelopeStart += (other - envelopeStart) * nextSlideRatioStart;
               }
               let envelopeEnd: number = envelopeStart;
               if (isDiscrete == false) {
                   envelopeEnd = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, noteSecondsEndUnscaled, noteSecondsEnd[envelopeIndex], beatTimeEnd[envelopeIndex], timeSinceStart, noteSizeEnd, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
                   if (prevSlideEnd) {
                       const other: number = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, prevNoteSecondsEndUnscaled, prevNoteSecondsEnd[envelopeIndex], beatTimeEnd[envelopeIndex], timeSinceStart, prevNoteSize, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
                       envelopeEnd += (other - envelopeEnd) * prevSlideRatioEnd;
                   }
                   if (nextSlideEnd) {
                       const other: number = EnvelopeComputer.computeEnvelope(envelope, envelopeSpeed, globalEnvelopeSpeed, 0.0, 0.0, beatTimeEnd[envelopeIndex], timeSinceStart, nextNoteSize, pitch, inverse, perEnvelopeLowerBound, perEnvelopeUpperBound, false, steps, seed, waveform, defaultPitch, startPinTickAbsolute);
                       envelopeEnd += (other - envelopeEnd) * nextSlideRatioEnd;
                   }
               }

               this.envelopeStarts[computeIndex] *= envelopeStart;
               this.envelopeEnds[computeIndex] *= envelopeEnd;
               this._modifiedEnvelopeIndices[this._modifiedEnvelopeCount++] = computeIndex;

               if (automationTarget.isFilter) {
                   const filterSettings: FilterSettings = /*this._perNote ?*/ (instrument.tmpNoteFilterStart != null) ? instrument.tmpNoteFilterStart : instrument.noteFilter /*: instrument.eqFilter*/;
                   if (filterSettings.controlPointCount > targetIndex && filterSettings.controlPoints[targetIndex].type == FilterType.lowPass) {
                       lowpassCutoffDecayVolumeCompensation = Math.max(lowpassCutoffDecayVolumeCompensation, EnvelopeComputer.getLowpassCutoffDecayVolumeCompensation(envelope, perEnvelopeSpeed));
                   }
               }
           }
       }

       this.noteSecondsStartUnscaled = noteSecondsStartUnscaled;
       this.noteSecondsEndUnscaled = noteSecondsEndUnscaled;
       this.noteTicksStart = noteTicksStart;
       this.noteTicksEnd = noteTicksEnd;
       this.prevNoteSecondsStartUnscaled = prevNoteSecondsStartUnscaled;
       this.prevNoteSecondsEndUnscaled = prevNoteSecondsEndUnscaled;
       this.prevNoteTicksStart = prevNoteTicksStart;
       this.prevNoteTicksEnd = prevNoteTicksEnd;
       for (let envelopeIndex: number = 0; envelopeIndex < Config.maxEnvelopeCount + 1; envelopeIndex++) {
           this.noteSecondsStart[envelopeIndex] = noteSecondsStart[envelopeIndex];
           this.noteSecondsEnd[envelopeIndex] = noteSecondsEnd[envelopeIndex];
           this.prevNoteSecondsStart[envelopeIndex] = prevNoteSecondsStart[envelopeIndex];
           this.prevNoteSecondsEnd[envelopeIndex] = prevNoteSecondsEnd[envelopeIndex];
       }
       this.prevNoteSize = prevNoteSize;
       this.nextNoteSize = nextNoteSize;
       this.noteSizeStart = noteSizeStart;
       this.noteSizeEnd = noteSizeEnd;
       this.prevSlideStart = prevSlideStart;
       this.prevSlideEnd = prevSlideEnd;
       this.nextSlideStart = nextSlideStart;
       this.nextSlideEnd = nextSlideEnd;
       this.prevSlideRatioStart = prevSlideRatioStart;
       this.prevSlideRatioEnd = prevSlideRatioEnd;
       this.nextSlideRatioStart = nextSlideRatioStart;
       this.nextSlideRatioEnd = nextSlideRatioEnd;
       this.lowpassCutoffDecayVolumeCompensation = lowpassCutoffDecayVolumeCompensation;
   }

   public clearEnvelopes(): void {
       for (let envelopeIndex: number = 0; envelopeIndex < this._modifiedEnvelopeCount; envelopeIndex++) {
           const computeIndex: number = this._modifiedEnvelopeIndices[envelopeIndex];
           this.envelopeStarts[computeIndex] = 1.0;
           this.envelopeEnds[computeIndex] = 1.0;
       }
       this._modifiedEnvelopeCount = 0;
   }

   public static computeEnvelope(envelope: Envelope, perEnvelopeSpeed: number, globalEnvelopeSpeed: number, unspedTime: number, time: number, beats: number, timeSinceStart: number, noteSize: number, pitch: number, inverse: boolean, perEnvelopeLowerBound: number, perEnvelopeUpperBound: number, isDrumset: boolean = false, steps: number, seed: number, waveform: number, defaultPitch: number, notePinStart: number): number {
       const envelopeSpeed = isDrumset ? envelope.speed : 1;
       const boundAdjust = (perEnvelopeUpperBound - perEnvelopeLowerBound);
       switch (envelope.type) {
           case EnvelopeType.none: return perEnvelopeUpperBound;
           case EnvelopeType.noteSize:
               if (!inverse) {
                   return Synth.noteSizeToVolumeMult(noteSize) * (boundAdjust) + perEnvelopeLowerBound;
               } else {
                   return perEnvelopeUpperBound - Synth.noteSizeToVolumeMult(noteSize) * (boundAdjust);
               }
           case EnvelopeType.pitch:
               //inversion and bounds are handled in the pitch calculation that we did prior
               return pitch;
           case EnvelopeType.pseudorandom:
               //randomization is essentially just a complex hashing function which appears random to us, but is repeatable every time
               //we can use either the time passed from the beginning of our song or the pitch of the note for what we hash
               const hashMax: number = 0xffffffff;
               const step: number = steps;
               switch (waveform) {
                   case RandomEnvelopeTypes.time:
                       if (step <= 1) return 1;
                       const timeHash: number = xxHash32((perEnvelopeSpeed == 0 ? 0 : Math.floor((timeSinceStart * perEnvelopeSpeed) / (256))) + "", seed);
                       if (inverse) {
                           return perEnvelopeUpperBound - boundAdjust * (step / (step - 1)) * Math.floor(timeHash * step / (hashMax + 1)) / step;
                       } else {
                           return boundAdjust * (step / (step - 1)) * Math.floor(timeHash * (step) / (hashMax + 1)) / step + perEnvelopeLowerBound;
                       }
                   case RandomEnvelopeTypes.pitch:
                       const pitchHash: number = xxHash32(defaultPitch + "", seed);
                       if (inverse) {
                           return perEnvelopeUpperBound - boundAdjust * pitchHash / (hashMax + 1);
                       } else {
                           return boundAdjust * pitchHash / (hashMax + 1) + perEnvelopeLowerBound;
                       }
                   case RandomEnvelopeTypes.note:
                       if (step <= 1) return 1;
                       const noteHash: number = xxHash32(notePinStart + "", seed);
                       if (inverse) {
                           return perEnvelopeUpperBound - boundAdjust * (step / (step - 1)) * Math.floor(noteHash * step / (hashMax + 1)) / step;
                       } else {
                           return boundAdjust * (step / (step - 1)) * Math.floor(noteHash * (step) / (hashMax + 1)) / step + perEnvelopeLowerBound;
                       }
                   case RandomEnvelopeTypes.timeSmooth:
                       const timeHashA: number = xxHash32((perEnvelopeSpeed == 0 ? 0 : Math.floor((timeSinceStart * perEnvelopeSpeed) / (256))) + "", seed);
                       const timeHashB: number = xxHash32((perEnvelopeSpeed == 0 ? 0 : Math.floor((timeSinceStart * perEnvelopeSpeed + 256) / (256))) + "", seed);
                       const weightedAverage: number = timeHashA * (1 - ((timeSinceStart * perEnvelopeSpeed) / (256)) % 1) + timeHashB * (((timeSinceStart * perEnvelopeSpeed) / (256)) % 1);
                       if (inverse) {
                           return perEnvelopeUpperBound - boundAdjust * weightedAverage / (hashMax + 1);
                       } else {
                           return boundAdjust * weightedAverage / (hashMax + 1) + perEnvelopeLowerBound;
                       }
                   default: throw new Error("Unrecognized operator envelope waveform type: " + waveform);
               }
           case EnvelopeType.twang:
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * (1.0 / (1.0 + time * envelopeSpeed));
               } else {
                   return boundAdjust / (1.0 + time * envelopeSpeed) + perEnvelopeLowerBound;
               }
           case EnvelopeType.swell:
               if (inverse) {
                   return boundAdjust / (1.0 + time * envelopeSpeed) + perEnvelopeLowerBound; //swell is twang's inverse... I wonder if it would be worth it to just merge the two :/
               } else {
                   return perEnvelopeUpperBound - boundAdjust / (1.0 + time * envelopeSpeed);
               }
           case EnvelopeType.lfo:
               switch (waveform) {
                   case LFOEnvelopeTypes.sine:
                       if (inverse) {
                           return (perEnvelopeUpperBound / 2) + boundAdjust * Math.cos(beats * 2.0 * Math.PI * envelopeSpeed) * 0.5 + (perEnvelopeLowerBound / 2);
                       } else {
                           return (perEnvelopeUpperBound / 2) - boundAdjust * Math.cos(beats * 2.0 * Math.PI * envelopeSpeed) * 0.5 + (perEnvelopeLowerBound / 2);
                       }
                   case LFOEnvelopeTypes.square:
                       if (inverse) {
                           return (Math.cos(beats * 2.0 * Math.PI * envelopeSpeed + 3 * Math.PI / 2) < 0) ? perEnvelopeUpperBound : perEnvelopeLowerBound;
                       } else {
                           return (Math.cos(beats * 2.0 * Math.PI * envelopeSpeed + 3 * Math.PI / 2) < 0) ? perEnvelopeLowerBound : perEnvelopeUpperBound;
                       }
                   case LFOEnvelopeTypes.triangle:
                       if (inverse) {
                           return (perEnvelopeUpperBound / 2) - (boundAdjust / Math.PI) * Math.asin(Math.sin((Math.PI / 2) + beats * Math.PI * 2.0 * envelopeSpeed)) + (perEnvelopeLowerBound / 2);
                       } else {
                           return (perEnvelopeUpperBound / 2) + (boundAdjust / Math.PI) * Math.asin(Math.sin((Math.PI / 2) + beats * Math.PI * 2.0 * envelopeSpeed)) + (perEnvelopeLowerBound / 2);
                       }
                   case LFOEnvelopeTypes.sawtooth:
                       if (inverse) {
                           return perEnvelopeUpperBound - (beats * envelopeSpeed) % 1 * boundAdjust;
                       } else {
                           return (beats * envelopeSpeed) % 1 * boundAdjust + perEnvelopeLowerBound;
                       }
                   case LFOEnvelopeTypes.trapezoid:
                       let trap: number = 0;
                       if (inverse) {
                           trap = (perEnvelopeUpperBound / 2) - (boundAdjust * 2 / Math.PI) * Math.asin(Math.sin((Math.PI / 2) + beats * Math.PI * 2.0 * envelopeSpeed)) + (perEnvelopeLowerBound / 2);
                       } else {
                           trap = (perEnvelopeUpperBound / 2) + (boundAdjust * 2 / Math.PI) * Math.asin(Math.sin((Math.PI / 2) + beats * Math.PI * 2.0 * envelopeSpeed)) + (perEnvelopeLowerBound / 2);
                       }
                       return Math.max(perEnvelopeLowerBound, Math.min(perEnvelopeUpperBound, trap));
                   case LFOEnvelopeTypes.steppedSaw:
                       if (steps <= 1) return 1;
                       let saw: number = (beats * envelopeSpeed) % 1;
                       if (inverse) {
                           return perEnvelopeUpperBound - Math.floor(saw * steps) * boundAdjust / (steps - 1);
                       } else {
                           return Math.floor(saw * steps) * boundAdjust / (steps - 1) + perEnvelopeLowerBound;
                       }

                   case LFOEnvelopeTypes.steppedTri:
                       if (steps <= 1) return 1;
                       let tri: number = 0.5 + (inverse ? -1 : 1) * (1 / Math.PI) * Math.asin(Math.sin((Math.PI / 2) + beats * Math.PI * 2.0 * envelopeSpeed));
                       return Math.round(tri * (steps - 1)) * boundAdjust / (steps - 1) + perEnvelopeLowerBound;
                   default: throw new Error("Unrecognized operator envelope waveform type: " + waveform);
               }
           case EnvelopeType.tremolo2: //kept only for drumsets right now
               if (inverse) {
                   return (perEnvelopeUpperBound / 4) + boundAdjust * Math.cos(beats * 2.0 * Math.PI * envelopeSpeed) * 0.25 + (perEnvelopeLowerBound / 4); //inverse works strangely with tremolo2. If I ever update this I'll need to turn all current versions into tremolo with bounds
               } else {
                   return 0.5 + (perEnvelopeUpperBound / 4) - boundAdjust * Math.cos(beats * 2.0 * Math.PI * envelopeSpeed) * 0.25 - (perEnvelopeLowerBound / 4);
               }
           case EnvelopeType.punch:
               if (inverse) {
                   return Math.max(0, perEnvelopeUpperBound + 1.0 - Math.max(1.0 - perEnvelopeLowerBound, 1.0 - perEnvelopeUpperBound - unspedTime * globalEnvelopeSpeed * 10.0)); //punch special case: 2- instead of 1-
               } else {
                   return Math.max(1.0 + perEnvelopeLowerBound, 1.0 + perEnvelopeUpperBound - unspedTime * globalEnvelopeSpeed * 10.0); //punch only uses global envelope speed
               }
           case EnvelopeType.flare:
               const attack: number = 0.25 / Math.sqrt(envelopeSpeed * perEnvelopeSpeed); //flare and blip need to be handled a little differently with envelope speeds. I have to use the old system
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * (unspedTime < attack ? unspedTime / attack : 1.0 / (1.0 + (unspedTime - attack) * envelopeSpeed * perEnvelopeSpeed));
               } else {
                   return boundAdjust * (unspedTime < attack ? unspedTime / attack : 1.0 / (1.0 + (unspedTime - attack) * envelopeSpeed * perEnvelopeSpeed)) + perEnvelopeLowerBound;
               }
           case EnvelopeType.decay:
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * Math.pow(2, -envelopeSpeed * time);
               } else {
                   return boundAdjust * Math.pow(2, -envelopeSpeed * time) + perEnvelopeLowerBound;
               }
           case EnvelopeType.blip:
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * +(unspedTime < (0.25 / Math.sqrt(envelopeSpeed * perEnvelopeSpeed)));
               } else {
                   return boundAdjust * +(unspedTime < (0.25 / Math.sqrt(envelopeSpeed * perEnvelopeSpeed))) + perEnvelopeLowerBound;
               }
           case EnvelopeType.wibble:
               let temp = 0.5 - Math.cos(beats * envelopeSpeed) * 0.5;
               temp = 1.0 / (1.0 + time * (envelopeSpeed - (temp / (1.5 / envelopeSpeed))));
               temp = temp > 0.0 ? temp : 0.0;
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * temp;
               } else {
                   return boundAdjust * temp + perEnvelopeLowerBound;
               }
           case EnvelopeType.linear: {
               let lin = (1.0 - (time / (16 / envelopeSpeed)));
               lin = lin > 0.0 ? lin : 0.0;
               if (inverse) { //another case where linear's inverse is rise. Do I merge them?
                   return perEnvelopeUpperBound - boundAdjust * lin;
               } else {
                   return boundAdjust * lin + perEnvelopeLowerBound;
               }
           }
           case EnvelopeType.rise: {
               let lin = (time / (16 / envelopeSpeed));
               lin = lin < 1.0 ? lin : 1.0;
               if (inverse) {
                   return perEnvelopeUpperBound - boundAdjust * lin;
               } else {
                   return boundAdjust * lin + perEnvelopeLowerBound;
               }
           }
           case EnvelopeType.fall: {
               if (inverse) {
                   return Math.min(Math.max(perEnvelopeLowerBound, perEnvelopeUpperBound - boundAdjust * Math.sqrt(Math.max(1.0 - envelopeSpeed * time / 2, 0))), perEnvelopeUpperBound);
               } else {
                   return Math.max(perEnvelopeLowerBound, boundAdjust * Math.sqrt(Math.max(1.0 - envelopeSpeed * time / 2, 0)) + perEnvelopeLowerBound);
               }
           }
           default: throw new Error("Unrecognized operator envelope type.");
       }

   }

   public getPitchValue(instrument: Instrument, tone: Tone | null, instrumentState: InstrumentState, calculateBends: boolean = true): number {
       if (tone && tone.pitchCount >= 1) {
           const chord = instrument.getChord();
           const arpeggiates = chord.arpeggiates;
           const monophonic = chord.name == "monophonic"
           const arpeggio: number = Math.floor(instrumentState.arpTime / Config.ticksPerArpeggio); //calculate arpeggiation
           const tonePitch = tone.pitches[arpeggiates ? getArpeggioPitchIndex(tone.pitchCount, instrument.fastTwoNoteArp, arpeggio) : monophonic ? instrument.monoChordTone : 0]
           if (calculateBends) {
               return tone.lastInterval != tonePitch ? tonePitch + tone.lastInterval : tonePitch; //account for pitch bends
           } else {
               return tonePitch;
           }
       }
       return 0;
   }

   public computePitchEnvelope(instrument: Instrument, index: number, pitch: number = 0): number {
       let startNote: number = 0;
       let endNote: number = Config.maxPitch;
       let inverse: boolean = false;
       let envelopeLowerBound: number = 0;
       let envelopeUpperBound: number = 1;

       if (instrument.isNoiseInstrument) {
           endNote = Config.drumCount - 1;
       }


       if (index < instrument.envelopeCount && index !== -2) {
           startNote = instrument.envelopes[index].pitchEnvelopeStart;
           endNote = instrument.envelopes[index].pitchEnvelopeEnd;
           inverse = instrument.envelopes[index].inverse;
           envelopeLowerBound = instrument.envelopes[index].perEnvelopeLowerBound;
           envelopeUpperBound = instrument.envelopes[index].perEnvelopeUpperBound;
       }

       if (startNote > endNote) { //Reset if values are improper
           startNote = 0;
           endNote = instrument.isNoiseInstrument ? Config.drumCount - 1 : Config.maxPitch;
       }
       const range = endNote - startNote + 1;
       if (!inverse) {
           if (pitch <= startNote) {
               return envelopeLowerBound;
           } else if (pitch >= endNote) {
               return envelopeUpperBound;
           } else {
               return (pitch - startNote) * (envelopeUpperBound - envelopeLowerBound) / range + envelopeLowerBound;
           }
       } else {
           if (pitch <= startNote) {
               return envelopeUpperBound;
           } else if (pitch >= endNote) {
               return envelopeLowerBound;
           } else {
               return envelopeUpperBound - (pitch - startNote) * (envelopeUpperBound - envelopeLowerBound) / range;
           }
       }
   }

   public static getLowpassCutoffDecayVolumeCompensation(envelope: Envelope, perEnvelopeSpeed: number = 1): number {
       // This is a little hokey in the details, but I designed it a while ago and keep it 
       // around for compatibility. This decides how much to increase the volume (or
       // expression) to compensate for a decaying lowpass cutoff to maintain perceived
       // volume overall.
       if (envelope.type == EnvelopeType.decay) return 1.25 + 0.025 * /*envelope.speed */ perEnvelopeSpeed;
       if (envelope.type == EnvelopeType.twang) return 1.0 + 0.02 * /*envelope.speed */ perEnvelopeSpeed;
       return 1.0;
   }

   public computeDrumsetEnvelopes(instrument: Instrument, drumsetFilterEnvelope: Envelope, beatsPerPart: number, partTimeStart: number, partTimeEnd: number) {

       const pitch = 1

       function computeDrumsetEnvelope(unspedTime: number, time: number, beats: number, noteSize: number): number {
           return EnvelopeComputer.computeEnvelope(drumsetFilterEnvelope, 1, 1, unspedTime, time, beats, 0, noteSize, pitch, false, 0, 1, true, 2, 2, LFOEnvelopeTypes.sine, pitch, 0);
       }

       // Drumset filters use the same envelope timing as the rest of the envelopes, but do not include support for slide transitions.
       let drumsetFilterEnvelopeStart: number = computeDrumsetEnvelope(this.noteSecondsStartUnscaled, this.noteSecondsStartUnscaled, beatsPerPart * partTimeStart, this.noteSizeStart); //doesn't have/need pitchStart, pitchEnd, pitchInvert, steps, seed, timeSinceBeginning, etc

       // Apply slide interpolation to drumset envelope.
       if (this.prevSlideStart) {
           const other: number = computeDrumsetEnvelope(this.prevNoteSecondsStartUnscaled, this.prevNoteSecondsStartUnscaled, beatsPerPart * partTimeStart, this.prevNoteSize);
           drumsetFilterEnvelopeStart += (other - drumsetFilterEnvelopeStart) * this.prevSlideRatioStart;
       }
       if (this.nextSlideStart) {
           const other: number = computeDrumsetEnvelope(0.0, 0.0, beatsPerPart * partTimeStart, this.nextNoteSize);
           drumsetFilterEnvelopeStart += (other - drumsetFilterEnvelopeStart) * this.nextSlideRatioStart;
       }

       let drumsetFilterEnvelopeEnd: number = drumsetFilterEnvelopeStart;


       //hmm, I guess making discrete per envelope leaves out drumsets....
       drumsetFilterEnvelopeEnd = computeDrumsetEnvelope(this.noteSecondsEndUnscaled, this.noteSecondsEndUnscaled, beatsPerPart * partTimeEnd, this.noteSizeEnd);

       if (this.prevSlideEnd) {
           const other: number = computeDrumsetEnvelope(this.prevNoteSecondsEndUnscaled, this.prevNoteSecondsEndUnscaled, beatsPerPart * partTimeEnd, this.prevNoteSize);
           drumsetFilterEnvelopeEnd += (other - drumsetFilterEnvelopeEnd) * this.prevSlideRatioEnd;
       }
       if (this.nextSlideEnd) {
           const other: number = computeDrumsetEnvelope(0.0, 0.0, beatsPerPart * partTimeEnd, this.nextNoteSize);
           drumsetFilterEnvelopeEnd += (other - drumsetFilterEnvelopeEnd) * this.nextSlideRatioEnd;
       }

       this.drumsetFilterEnvelopeStart = drumsetFilterEnvelopeStart;
       this.drumsetFilterEnvelopeEnd = drumsetFilterEnvelopeEnd;

   }

}