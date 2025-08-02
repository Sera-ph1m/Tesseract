// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { Pattern } from "../synth/synth";
import { ColorConfig } from "./ColorConfig";
import { SongDocument } from "./SongDocument";
import { HTML } from "imperative-html/dist/esm/elements-strict";

function computeColorForChannel(doc: SongDocument, channelIndex: number, type: "primary" | "secondary"): string {
	const song = doc.song;
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
		tags
			.filter(t => t.startChannel === ch)
			.forEach(tag => {
				const colorIndex = (pitchCounter % 10) + 1;
				const colors = {
					primary: `var(--pitch${colorIndex}-primary-note)`,
					secondary: `var(--pitch${colorIndex}-secondary-note)`,
				};
				tagColors.set(tag.id, colors);
				pitchCounter = (pitchCounter + 1) % 10;
			});

		// The channel itself
		if (song.getChannelIsMod(ch)) {
			const colorIndex = (modCounter % 4) + 1;
			baseChannelColors.set(ch, {
				primary: `var(--mod${colorIndex}-primary-note)`,
				secondary: `var(--mod${colorIndex}-secondary-note)`,
			});
			modCounter = (modCounter + 1) % 4;
		} else {
			// Pitch and Noise channels share the same color sequence
			const colorIndex = (pitchCounter % 10) + 1;
			baseChannelColors.set(ch, {
				primary: `var(--pitch${colorIndex}-primary-note)`,
				secondary: `var(--pitch${colorIndex}-secondary-note)`,
			});
			pitchCounter = (pitchCounter + 1) % 10;
		}
	}

	// Second pass: Apply tag overrides to find the final color for the requested channelIndex
	const innermostTag = tags
		.filter(t => t.startChannel <= channelIndex && channelIndex <= t.endChannel)
		.pop();

	if (innermostTag) {
		return tagColors.get(innermostTag.id)![type];
	} else {
		return baseChannelColors.get(channelIndex)![type];
	}
}


export function getPrimaryNoteColor(
	doc: SongDocument,
	channelIndex: number
): string {
	return computeColorForChannel(doc, channelIndex, "primary");
}

export function getSecondaryNoteColor(
	doc: SongDocument,
	channelIndex: number
): string {
	return computeColorForChannel(doc, channelIndex, "secondary");
}

export class Box {
	private readonly _text: Text = document.createTextNode("");
	private readonly _label: HTMLElement = HTML.div(
		{ class: "channelBoxLabel" },
		this._text
	);
	public readonly container: HTMLElement = HTML.div(
		{
			class: "channelBox",
			style: `margin: 1px; height: ${ChannelRow.patternHeight - 2}px;`,
		},
		this._label
	);
	private _renderedIndex: number = -1;
	private _patternIndex: number = 0;
	private _selected: boolean = false;
	private _dim: boolean = false;
	private _isNoise: boolean = false;
	private _isMod: boolean = false;
	private _labelColor: string = "?";
	private _primaryColor: string = "?";
	private _renderedLabelColor: string = "?";
	private _renderedVisibility: string = "?";
	private _renderedBorderLeft: string = "?";
	private _renderedBorderRight: string = "?";
	private _renderedBackgroundColor: string = "?";

	constructor(channel: number, color: string) {
		this.container.style.background = ColorConfig.uiWidgetBackground;
		this._label.style.color = color;
	}

	public setWidth(width: number): void {
		this.container.style.width = width - 2 + "px";
	}

	public setHeight(height: number): void {
		this.container.style.height = height - 2 + "px";
	}

	public setIndex(
		index: number,
		selected: boolean,
		dim: boolean,
		labelColor: string,
		isNoise: boolean,
		isMod: boolean,
		primaryColor: string
	): void {
		this._patternIndex = index;
		this._selected = selected;
		this._dim = dim;
		this._labelColor = labelColor;
		this._isNoise = isNoise;
		this._isMod = isMod;
		this._primaryColor = primaryColor;

		if (this._renderedIndex != this._patternIndex) {
			if (index >= 100) {
				this._label.setAttribute("font-size", "16");
				this._label.style.setProperty("transform", "translate(0px, -1.5px)");
			} else {
				this._label.setAttribute("font-size", "20");
				this._label.style.setProperty("transform", "translate(0px, 0px)");
			}

			this._renderedIndex = this._patternIndex;
			this._text.data = String(this._patternIndex);
		}

		this._updateColors();
	}

	private _updateColors(): void {
		const useColor: string = this._selected
			? ColorConfig.c_invertedText
			: this._labelColor;
		if (this._renderedLabelColor != useColor) {
			this._label.style.color = useColor;
			this._renderedLabelColor = useColor;
		}

		let backgroundColor: string;
		if (this._selected) {
			backgroundColor = this._primaryColor;
		} else {
			backgroundColor = this._isMod
				? this._dim
					? ColorConfig.c_trackEditorBgModDim
					: ColorConfig.c_trackEditorBgMod
				: this._isNoise
				? this._dim
					? ColorConfig.c_trackEditorBgNoiseDim
					: ColorConfig.c_trackEditorBgNoise
				: this._dim
				? ColorConfig.c_trackEditorBgPitchDim
				: ColorConfig.c_trackEditorBgPitch;
		}

		if (this._patternIndex == 0 && !this._selected) {
			backgroundColor = "none";
		}

		if (this._renderedBackgroundColor != backgroundColor) {
			this.container.style.background = backgroundColor;
			this._renderedBackgroundColor = backgroundColor;
		}
	}

	public setVisibility(visibility: string): void {
		if (this._renderedVisibility != visibility) {
			this.container.style.visibility = visibility;
			this._renderedVisibility = visibility;
		}
	}
	public setBorderLeft(borderLeft: string): void {
		if (this._renderedBorderLeft != borderLeft) {
			this.container.style.setProperty("border-left", borderLeft);
			this._renderedBorderLeft = borderLeft;
		}
	}
	public setBorderRight(borderRight: string): void {
		if (this._renderedBorderRight != borderRight) {
			this.container.style.setProperty("border-right", borderRight);
			this._renderedBorderRight = borderRight;
		}
	}
}

export class ChannelRow {
	public static patternHeight: number = 28;

	private _renderedBarWidth: number = -1;
	private _renderedBarHeight: number = -1;
	private _boxes: Box[] = [];

	public readonly container: HTMLElement = HTML.div({ class: "channelRow" });

	constructor(
		private readonly _doc: SongDocument,
		public readonly index: number
	) {
		this.container.dataset.channelIndex = this.index.toString();
	}

	public render(colors: { primary: string; secondary: string }): void {
		ChannelRow.patternHeight = this._doc.getChannelHeight();

		const barWidth: number = this._doc.getBarWidth();
		if (this._boxes.length != this._doc.song.barCount) {
			for (
				let x: number = this._boxes.length;
				x < this._doc.song.barCount;
				x++
			) {
				const box: Box = new Box(this.index, ColorConfig.secondaryText);
				box.setWidth(barWidth);
				this.container.appendChild(box.container);
				this._boxes[x] = box;
			}
			for (
				let x: number = this._doc.song.barCount;
				x < this._boxes.length;
				x++
			) {
				this.container.removeChild(this._boxes[x].container);
			}
			this._boxes.length = this._doc.song.barCount;
		}

		if (this._renderedBarWidth != barWidth) {
			this._renderedBarWidth = barWidth;
			for (let x: number = 0; x < this._boxes.length; x++) {
				this._boxes[x].setWidth(barWidth);
			}
		}

		if (this._renderedBarHeight != ChannelRow.patternHeight) {
			this._renderedBarHeight = ChannelRow.patternHeight;
			for (let x: number = 0; x < this._boxes.length; x++) {
				this._boxes[x].setHeight(ChannelRow.patternHeight);
			}
		}

		const isNoise: boolean = this._doc.song.getChannelIsNoise(this.index);
		const isMod: boolean = this._doc.song.getChannelIsMod(this.index);

		const primaryColor = colors.primary;
		const secondaryColor = colors.secondary;

		for (let i: number = 0; i < this._boxes.length; i++) {
			const pattern: Pattern | null = this._doc.song.getPattern(this.index, i);
			const selected: boolean =
				i == this._doc.bar && this.index == this._doc.channel;
			const dim: boolean = pattern == null || pattern.notes.length == 0;
			const patternIndex = this._doc.song.channels[this.index].bars[i];

			const box: Box = this._boxes[i];
			if (i < this._doc.song.barCount) {
				const useSecondary = dim || patternIndex === 0;
				const labelColor = useSecondary ? secondaryColor : primaryColor;

				box.setIndex(
					patternIndex,
					selected,
					dim,
					labelColor,
					isNoise,
					isMod,
					primaryColor
				);
				box.setVisibility("visible");
			} else {
				box.setVisibility("hidden");
			}
			if (i == this._doc.synth.loopBarStart) {
				box.setBorderLeft(`1px dashed ${ColorConfig.uiWidgetFocus}`);
			} else {
				box.setBorderLeft("none");
			}
			if (i == this._doc.synth.loopBarEnd) {
				box.setBorderRight(`1px dashed ${ColorConfig.uiWidgetFocus}`);
			} else {
				box.setBorderRight("none");
			}
		}
	}
}