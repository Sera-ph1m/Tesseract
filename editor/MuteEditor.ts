// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { SongDocument } from "./SongDocument";
import { HTML } from "imperative-html/dist/esm/elements-strict";
import { ColorConfig } from "./ColorConfig";
import { ChannelRow } from "./ChannelRow";
import { InputBox } from "./HTMLWrapper";
import {
	ChangeChannelOrder,
	ChangeChannelName,
	ChangeRemoveChannel,
	ChangeAddChannel,
} from "./changes";
import { Config } from "../synth/SynthConfig";
import { ChannelType } from "../synth/synth";
import { SongEditor } from "./SongEditor";

export class MuteEditor {
	private readonly _tagDropDown: HTMLSelectElement = HTML.select(
		{
			style:
				"width:0px; height:19px; left:19px; top:0; position:absolute; opacity:0",
		}
		// No options for now.
	);
	private _tagDropDownOpen: boolean = false;

	private _cornerFiller: HTMLDivElement = HTML.div({
		style: `background: ${ColorConfig.editorBackground}; position: sticky; bottom: 0; left: 0; width: 32px; height: 30px;`,
	});

	private readonly _buttons: HTMLDivElement[] = [];
	private _rowToChannel: (number | null)[] = [];
	private readonly _channelCounts: HTMLDivElement[] = [];
	private readonly _channelNameDisplay: HTMLDivElement = HTML.div(
		{
			style: `background-color: ${ColorConfig.uiWidgetFocus}; white-space:nowrap; display: none; transform:translate(20px); width: auto; pointer-events: none; position: absolute; border-radius: 0.2em; z-index: 2;`,
			color: ColorConfig.primaryText,
		},
		""
	);
	public readonly _channelNameInput: InputBox = new InputBox(
		HTML.input(
			{
				style: `color: ${ColorConfig.primaryText}; background-color: ${ColorConfig.uiWidgetFocus}; margin-top: -2px; display: none; width: 6em; position: absolute; border-radius: 0.2em; z-index: 2;`,
				color: ColorConfig.primaryText,
			},
			""
		),
		this._doc,
		(oldValue: string, newValue: string) =>
			new ChangeChannelName(this._doc, oldValue, newValue)
	);

	private readonly _channelDropDown: HTMLSelectElement = HTML.select(
		{
			style: "width: 0px; left: 19px; height: 19px; position:absolute; opacity:0",
		},

		HTML.option({ value: "rename" }, "Rename..."),
		HTML.option({ value: "chnUp" }, "Move Channel Up"),
		HTML.option({ value: "chnDown" }, "Move Channel Down"),
		HTML.option({ value: "chnMute" }, "Mute Channel"),
		HTML.option({ value: "chnSolo" }, "Solo Channel"),
		HTML.option({ value: "chnInsert" }, "Insert Channel Below"),
		HTML.option({ value: "chnDelete" }, "Delete This Channel")
	);

	public readonly container: HTMLElement = HTML.div(
		{
			class: "muteEditor",
			style: "position: sticky; padding-top: " + Config.barEditorHeight + "px;",
		},
		this._channelNameDisplay,
		this._channelNameInput.input,
		this._channelDropDown,
		this._tagDropDown
	);

	// NOTE: This logic is duplicated from TrackEditor.ts due to architectural constraints
	// that prevent passing the computed map from TrackEditor through SongEditor.
	private _channelColors: Map<
		number,
		{ primary: string; secondary: string }
	> = new Map();

	// Helper function to re-calculate colors according to the new logic.
	// Duplicated from TrackEditor because MuteEditor cannot access TrackEditor's internal state.
	private _computeChannelColors(): void {
		this._channelColors.clear();
		const song = this._doc.song;
		const channelCount = song.getChannelCount();
		const tags = song.channelTags;

		let pitchCounter = 0;
		let modCounter = 0;

		const tagColors = new Map<string, { primary: string; secondary: string }>();
		const baseChannelColors = new Map<
			number,
			{ primary: string; secondary: string }
		>();

		// First pass: Iterate through visual rows to determine base colors and tag colors
		for (let ch = 0; ch < channelCount; ch++) {
			tags.filter(t => t.startChannel === ch).forEach(tag => {
				const colorIndex = (pitchCounter % 10) + 1;
				tagColors.set(tag.id, {
					primary: `var(--pitch${colorIndex}-primary-note)`,
					secondary: `var(--pitch${colorIndex}-secondary-note)`,
				});
				pitchCounter = (pitchCounter + 1) % 10;
			});

			if (song.getChannelIsMod(ch)) {
				const colorIndex = (modCounter % 4) + 1;
				baseChannelColors.set(ch, { primary: `var(--mod${colorIndex}-primary-note)`, secondary: `var(--mod${colorIndex}-secondary-note)` });
				modCounter = (modCounter + 1) % 4;
			} else {
				const colorIndex = (pitchCounter % 10) + 1;
				baseChannelColors.set(ch, { primary: `var(--pitch${colorIndex}-primary-note)`, secondary: `var(--pitch${colorIndex}-secondary-note)` });
				pitchCounter = (pitchCounter + 1) % 10;
			}
		}

		// Second pass: Apply tag overrides to find the final color for each channel
		for (let ch = 0; ch < channelCount; ch++) {
			const innermostTag = tags.filter(t => t.startChannel <= ch && ch <= t.endChannel).pop();
			if (innermostTag) {
				this._channelColors.set(ch, tagColors.get(innermostTag.id)!);
			} else {
				this._channelColors.set(ch, baseChannelColors.get(ch)!);
			}
		}
	}

	private _renderedPitchChannels: number = 0;
	private _renderedNoiseChannels: number = 0;
	private _renderedChannelHeight: number = -1;
	private _renderedModChannels: number = 0;
	private _channelDropDownChannel: number = 0;
	private _channelDropDownOpen: boolean = false;
	private _channelDropDownLastState: boolean = false;

	constructor(private _doc: SongDocument, private _editor: SongEditor) {
		this.container.addEventListener("click", this._onClick);
		this.container.addEventListener("mousemove", this._onMouseMove);
		this.container.addEventListener("mouseleave", this._onMouseLeave);

		this._tagDropDown.addEventListener("blur", () => {
			this._tagDropDownOpen = false;
			this._tagDropDown.style.width = "0px";
		});
		this._tagDropDown.addEventListener("click", () => {
			this._tagDropDownOpen = !this._tagDropDownOpen;
		});

		this._channelDropDown.selectedIndex = -1;
		this._channelDropDown.addEventListener("change", this._channelDropDownHandler);
		this._channelDropDown.addEventListener(
			"mousedown",
			this._channelDropDownGetOpenedPosition
		);
		this._channelDropDown.addEventListener("blur", this._channelDropDownBlur);
		this._channelDropDown.addEventListener("click", this._channelDropDownClick);

		this._channelNameInput.input.addEventListener(
			"change",
			this._channelNameInputHide
		);
		this._channelNameInput.input.addEventListener(
			"blur",
			this._channelNameInputHide
		);
		this._channelNameInput.input.addEventListener(
			"mousedown",
			this._channelNameInputClicked
		);
		this._channelNameInput.input.addEventListener(
			"input",
			this._channelNameInputWhenInput
		);
	}

	private _channelNameInputWhenInput = (): void => {
		let newValue = this._channelNameInput.input.value;
		if (newValue.length > 15) {
			this._channelNameInput.input.value = newValue.substring(0, 15);
		}
	};

	private _channelNameInputClicked = (event: MouseEvent): void => {
		event.stopPropagation();
	};

	private _channelNameInputHide = (): void => {
		this._channelNameInput.input.style.setProperty("display", "none");
		this._channelNameDisplay.style.setProperty("display", "none");
	};

	private _channelDropDownClick = (event: MouseEvent): void => {
		this._channelDropDownOpen = !this._channelDropDownLastState;
		this._channelDropDownGetOpenedPosition(event);
	};

	private _channelDropDownBlur = (): void => {
		this._channelDropDownOpen = false;
		this._channelNameDisplay.style.setProperty("display", "none");
	};

	private _channelDropDownGetOpenedPosition = (event: MouseEvent): void => {
		this._channelDropDownLastState = this._channelDropDownOpen;

		this._channelDropDownChannel = Math.floor(
			Math.min(
				this._doc.song.getChannelCount(),
				Math.max(
					0,
					(event.clientY -
						this.container.getBoundingClientRect().top -
						Config.barEditorHeight) /
						ChannelRow.patternHeight
				)
			)
		);
		this._doc.muteEditorChannel = this._channelDropDownChannel;

		this._channelNameDisplay.style.setProperty("display", "");

		if (
			(this._channelDropDownChannel < this._doc.song.pitchChannelCount &&
				this._doc.song.pitchChannelCount == Config.pitchChannelCountMax) ||
			(this._channelDropDownChannel >= this._doc.song.pitchChannelCount &&
				this._channelDropDownChannel <
					this._doc.song.pitchChannelCount +
						this._doc.song.noiseChannelCount &&
				this._doc.song.noiseChannelCount == Config.noiseChannelCountMax) ||
			(this._channelDropDownChannel >=
				this._doc.song.pitchChannelCount +
					this._doc.song.noiseChannelCount &&
				this._doc.song.modChannelCount == Config.modChannelCountMax)
		) {
			this._channelDropDown.options[5].disabled = true;
		} else {
			this._channelDropDown.options[5].disabled = false;
		}

		this._channelDropDown.options[1].disabled = false;
		this._channelDropDown.options[2].disabled = false;

		if (
			this._doc.song.pitchChannelCount == 1 &&
			this._channelDropDownChannel == 0
		) {
			this._channelDropDown.options[6].disabled = true;
		} else {
			this._channelDropDown.options[6].disabled = false;
		}
	};

	private _channelDropDownHandler = (event: Event): void => {
		this._channelNameDisplay.style.setProperty("display", "none");
		this._channelDropDown.style.setProperty("display", "none");
		this._channelDropDownOpen = false;
		event.stopPropagation();

		switch (this._channelDropDown.value) {
			case "rename":
				this._channelNameInput.input.style.setProperty("display", "");
				this._channelNameInput.input.style.setProperty(
					"transform",
					this._channelNameDisplay.style.getPropertyValue("transform")
				);
				this._channelNameInput.input.value =
					this._channelNameDisplay.textContent || "";
				this._channelNameInput.input.select();
				break;
			case "chnUp":
				this._doc.record(
					new ChangeChannelOrder(
						this._doc,
						this._channelDropDownChannel,
						this._channelDropDownChannel,
						-1
					)
				);
				this._doc.song.updateDefaultChannelNames();
				break;
			case "chnDown":
				this._doc.record(
					new ChangeChannelOrder(
						this._doc,
						this._channelDropDownChannel,
						this._channelDropDownChannel,
						1
					)
				);
				this._doc.song.updateDefaultChannelNames();
				break;
			case "chnMute":
				this._doc.song.channels[this._channelDropDownChannel].muted =
					!this._doc.song.channels[this._channelDropDownChannel].muted;
				this.render();
				break;
			case "chnSolo":
				{
					let shouldSolo: boolean = false;
					for (
						let ch: number = 0;
						ch < this._doc.song.getChannelCount();
						ch++
					) {
						if (this._doc.song.channels[ch].type === ChannelType.Mod)
							continue;
						if (
							this._doc.song.channels[ch].muted ==
							(ch == this._channelDropDownChannel)
						) {
							shouldSolo = true;
							break;
						}
					}
					for (
						let ch: number = 0;
						ch < this._doc.song.getChannelCount();
						ch++
					) {
						if (this._doc.song.channels[ch].type === ChannelType.Mod)
							continue;
						this._doc.song.channels[ch].muted = shouldSolo
							? ch != this._channelDropDownChannel
							: false;
					}
					this.render();
				}
				break;
			case "chnInsert":
				{
					let type: ChannelType;
					if (
						this._doc.song.getChannelIsMod(this._channelDropDownChannel)
					) {
						type = ChannelType.Mod;
					} else if (
						this._doc.song.getChannelIsNoise(
							this._channelDropDownChannel
						)
					) {
						type = ChannelType.Noise;
					} else {
						type = ChannelType.Pitch;
					}
					this._doc.record(
						new ChangeAddChannel(
							this._doc,
							type,
							this._channelDropDownChannel
						)
					);
					this._doc.notifier.changed();
				}
				break;
			case "chnDelete":
				{
					this._doc.record(
						new ChangeRemoveChannel(
							this._doc,
							this._channelDropDownChannel
						)
					);
				}
				break;
		}
		if (this._channelDropDown.value != "rename") this._editor.refocusStage();

		this._channelDropDown.selectedIndex = -1;
	};

	private _onClick = (event: MouseEvent): void => {
		const container = (event.target as HTMLElement).closest(".muteContainer") as HTMLDivElement;
		if (!container) return;

		const rowIndex = this._buttons.indexOf(container);
		if (rowIndex < 0) return;

		const ch = this._rowToChannel[rowIndex];
		if (ch == null) {
			return;
		}

		const xPos = event.clientX - container.getBoundingClientRect().left;
		if (xPos < 21.0) {
			this._doc.song.channels[ch].muted = !this._doc.song.channels[ch].muted;
			this._doc.notifier.changed();
		} else {
			this._channelDropDownOpen = !this._channelDropDownLastState;
			this._channelDropDownGetOpenedPosition(event);
			this._channelDropDown.style.setProperty("display", "");
			this._channelDropDown.style.setProperty("width", "15px");
			this._channelDropDown.focus();
		}
	};

	private _onMouseMove = (event: MouseEvent): void => {
		const target = event.target as HTMLElement;
		const rowContainer =
			target.classList.contains("mute-button") ||
			target.classList.contains("muteButtonText")
				? target.parentElement
				: target;
		const index = this._buttons.indexOf(rowContainer as HTMLDivElement);

		if (index == -1) {
			if (
				!this._channelDropDownOpen &&
				!this._tagDropDownOpen &&
				target != this._channelNameDisplay &&
				target != this._channelDropDown &&
				target != this._tagDropDown
			) {
				this._channelNameDisplay.style.setProperty("display", "none");
				this._channelDropDown.style.setProperty("display", "none");
				this._channelDropDown.style.setProperty("width", "0px");
				this._tagDropDown.style.setProperty("width", "0px");
			}
			return;
		}

		const ch = this._rowToChannel[index];
		let xPos: number =
			event.clientX - this._buttons[index].getBoundingClientRect().left;

		if (ch !== null) {
			if (xPos >= 21.0) {
				if (!this._channelDropDownOpen) {
					this._channelDropDown.style.setProperty("display", "");
					var height = ChannelRow.patternHeight;
					this._channelNameDisplay.style.setProperty(
						"transform",
						"translate(20px, " + (height / 4 + height * index) + "px)"
					);
					this._channelNameDisplay.textContent =
						this._doc.song.channels[ch].name ||
						(ch < this._doc.song.pitchChannelCount
							? "Pitch " + (ch + 1)
							: ch <
							  this._doc.song.pitchChannelCount +
									this._doc.song.noiseChannelCount
							? "Noise " + (ch - this._doc.song.pitchChannelCount + 1)
							: "Mod " +
							  (ch -
									this._doc.song.pitchChannelCount -
									this._doc.song.noiseChannelCount +
									1));
					this._channelNameDisplay.style.setProperty("display", "");

					this._channelDropDown.style.top =
						Config.barEditorHeight + 2 + index * height + "px";
					this._channelDropDown.style.setProperty("width", "15px");
				}
			} else {
				if (!this._channelDropDownOpen) {
					this._channelNameDisplay.style.setProperty("display", "none");
					this._channelDropDown.style.setProperty("display", "none");
					this._channelDropDown.style.setProperty("width", "0px");
				}
			}
		} else {
			if (xPos >= 21.0) {
				if (!this._tagDropDownOpen) {
					this._tagDropDown.style.setProperty("display", "");
					var height = ChannelRow.patternHeight;
					this._tagDropDown.style.top =
						Config.barEditorHeight + 2 + index * height + "px";
					this._tagDropDown.style.setProperty("width", "15px");
				}
			} else {
				if (!this._tagDropDownOpen) {
					this._tagDropDown.style.setProperty("display", "none");
					this._tagDropDown.style.setProperty("width", "0px");
				}
			}
			this._channelNameDisplay.style.setProperty("display", "none");
			if (!this._channelDropDownOpen) {
				this._channelDropDown.style.setProperty("display", "none");
				this._channelDropDown.style.setProperty("width", "0px");
			}
		}
	};

	private _onMouseLeave = (event: MouseEvent): void => {
		if (!this._channelDropDownOpen && !this._tagDropDownOpen) {
			this._channelNameDisplay.style.setProperty("display", "none");
			this._channelDropDown.style.setProperty("width", "0px");
			this._tagDropDown.style.setProperty("width", "0px");
		}
	};

	public onKeyUp(event: KeyboardEvent): void {
		switch (event.keyCode) {
			case 27: // esc
			case 13: // enter
				this._channelDropDownOpen = false;
				this._tagDropDownOpen = false;
				this._channelNameDisplay.style.setProperty("display", "none");
				break;
			default:
				break;
		}
	}

	public render(): void {
		if (!this._doc.prefs.enableChannelMuting) return;

		const channelCount = this._doc.song.getChannelCount();
		const tags = this._doc.song.channelTags;
		const totalRows = channelCount + tags.length;
		const startingRowCount: number = this._buttons.length;

		// Compute colors for this render cycle
		this._computeChannelColors();

		if (startingRowCount !== totalRows) {
			for (let y: number = startingRowCount; y < totalRows; y++) {
				const channelCountText: HTMLDivElement = HTML.div({
					class: "noSelection muteButtonText",
					style: "display: table-cell; -webkit-text-stroke: 1.5px; vertical-align: middle; text-align: center; -webkit-user-select: none; -webkit-touch-callout: none; -moz-user-select: none; -ms-user-select: none; user-select: none; pointer-events: none; width: 12px; height: 20px; transform: translate(0px, 1px);",
				});
				const muteButton: HTMLDivElement = HTML.div({
					class: "mute-button",
					title: "Mute (M), Mute All (⇧M), Solo (S), Exclude (⇧S)",
					style: `display: block; pointer-events: none; width: 16px; height: 20px; transform: translate(2px, 1px);`,
				});
				const muteContainer: HTMLDivElement = HTML.div(
					{
						class: "muteContainer",
						style: `align-items: center; height: 20px; margin: 0px; display: table; flex-direction: row; justify-content: space-between; cursor: pointer;`,
					},
					[muteButton, channelCountText]
				);
				this.container.appendChild(muteContainer);
				this._buttons[y] = muteContainer;
				this._channelCounts[y] = channelCountText;
			}

			for (let y: number = totalRows; y < startingRowCount; y++) {
				this.container.removeChild(this._buttons[y]);
			}

			this._buttons.length = totalRows;
			this._channelCounts.length = totalRows;
			this._rowToChannel.length = totalRows;
			this.container.appendChild(this._cornerFiller);
		}

		let rowIndex = 0;
		for (let ch = 0; ch < channelCount; ch++) {
			tags
				.filter(t => t.startChannel === ch)
				.forEach(tag => {
					const muteContainer = this._buttons[rowIndex];
					const countText = this._channelCounts[rowIndex];

					this._rowToChannel[rowIndex] = null;

					(muteContainer.children[0] as HTMLElement).style.visibility =
						"hidden";
					countText.textContent = "○";
					countText.style.color = this._channelColors.get(tag.startChannel)!.primary;
					countText.style.fontSize = "inherit";

					const currentRowIndex = rowIndex;
					muteContainer.onclick = e => {
						e.stopPropagation();
						const top =
							Config.barEditorHeight +
							currentRowIndex * ChannelRow.patternHeight;
						this._tagDropDown.style.top = top + "px";
						this._tagDropDown.style.left = "19px";
						this._tagDropDown.style.width = "15px";
						this._tagDropDown.style.display = "";
						this._tagDropDown.focus();
						this._tagDropDownOpen = true;
					};
					rowIndex++;
				});

			const muteContainer = this._buttons[rowIndex];
			const countText = this._channelCounts[rowIndex];
			const muteButton = muteContainer.children[0] as HTMLElement;

			this._rowToChannel[rowIndex] = ch;

			muteButton.style.visibility = "";
			const isMod: boolean = this._doc.song.getChannelIsMod(ch);
			const isMuted: boolean = this._doc.song.channels[ch].muted;

			muteButton.classList.toggle("muted", isMuted);
			muteButton.classList.toggle("modMute", isMod);

			countText.style.color = this._channelColors.get(ch)!.primary;
			const val = ch + 1;
			countText.textContent = val + "";
			countText.style.fontSize = val >= 10 ? "xx-small" : "inherit";

			rowIndex++;
		}

		if (
			this._renderedChannelHeight != ChannelRow.patternHeight ||
			startingRowCount != totalRows
		) {
			for (let y: number = 0; y < totalRows; y++) {
				this._buttons[y].style.marginTop =
					(ChannelRow.patternHeight - 20) / 2 + "px";
				this._buttons[y].style.marginBottom =
					(ChannelRow.patternHeight - 20) / 2 + "px";
			}
		}

		if (
			this._renderedModChannels != this._doc.song.modChannelCount ||
			this._renderedPitchChannels != this._doc.song.pitchChannelCount ||
			this._renderedNoiseChannels != this._doc.song.noiseChannelCount
		) {
			this._renderedPitchChannels = this._doc.song.pitchChannelCount;
			this._renderedNoiseChannels = this._doc.song.noiseChannelCount;
			this._renderedModChannels = this._doc.song.modChannelCount;
		}

		if (startingRowCount != totalRows || this._renderedChannelHeight != ChannelRow.patternHeight) {
			this._renderedChannelHeight = ChannelRow.patternHeight;
			const editorHeight =
				Config.barEditorHeight + totalRows * ChannelRow.patternHeight;
			this._channelNameDisplay.style.setProperty("display", "none");
			this.container.style.height = editorHeight + 16 + "px";

			if (ChannelRow.patternHeight < 27) {
				this._channelNameDisplay.style.setProperty("margin-top", "-2px");
				this._channelDropDown.style.setProperty("margin-top", "-4px");
				this._channelNameInput.input.style.setProperty(
					"margin-top",
					"-4px"
				);
			} else if (ChannelRow.patternHeight < 30) {
				this._channelNameDisplay.style.setProperty("margin-top", "-1px");
				this._channelDropDown.style.setProperty("margin-top", "-3px");
				this._channelNameInput.input.style.setProperty(
					"margin-top",
					"-3px"
				);
			} else {
				this._channelNameDisplay.style.setProperty("margin-top", "0px");
				this._channelDropDown.style.setProperty("margin-top", "0px");
				this._channelNameInput.input.style.setProperty(
					"margin-top",
					"-2px"
				);
			}
		}
	}
}