// Copyright (C) 2021 John Nesky, distributed under the MIT license.

import { Pattern } from "../synth/synth";
import { ColorConfig } from "./ColorConfig";
import { SongDocument } from "./SongDocument";
import { HTML } from "imperative-html/dist/esm/elements-strict";

// This helper function is not exported.
function getChannelTypeIndex(doc: SongDocument, channelIndex: number): number {
	const isNoise = doc.song.getChannelIsNoise(channelIndex);
	const isMod = doc.song.getChannelIsMod(channelIndex);

	let typeIndex = 0;
	for (let i = 0; i < channelIndex; i++) {
		const otherIsNoise = doc.song.getChannelIsNoise(i);
		const otherIsMod = doc.song.getChannelIsMod(i);
		if (isNoise && otherIsNoise) {
			typeIndex++;
		} else if (isMod && otherIsMod) {
			typeIndex++;
		} else if (!isNoise && !isMod && !otherIsNoise && !otherIsMod) {
			typeIndex++;
		}
	}
	return typeIndex;
}

// This helper function is not exported, it's only used by the two functions below.
function _getNoteColor(
	doc: SongDocument,
	channelIndex: number,
	type: "primary" | "secondary"
): string {
	const song = doc.song;
	const isNoise: boolean = song.getChannelIsNoise(channelIndex);
	const isMod: boolean = song.getChannelIsMod(channelIndex);
	const typeIndex = getChannelTypeIndex(doc, channelIndex);

	let colorVarName: string;

	if (isMod) {
		const colorIndex = (typeIndex % 4) + 1;
		colorVarName = `--mod${colorIndex}-${type}-note`;
	} else if (isNoise) {
		const colorIndex = (typeIndex % 5) + 1;
		colorVarName = `--noise${colorIndex}-${type}-note`;
	} else {
		// is pitch
		const colorIndex = (typeIndex % 10) + 1;
		colorVarName = `--pitch${colorIndex}-${type}-note`;
	}

	return `var(${colorVarName})`;
}

/**
 * Returns the CSS variable for a channel's primary note color.
 * @param doc The song document.
 * @param channelIndex The index of the channel.
 * @returns A CSS var() string for the channel's primary note color.
 */
export function getPrimaryNoteColor(
	doc: SongDocument,
	channelIndex: number
): string {
	return _getNoteColor(doc, channelIndex, "primary");
}

/**
 * Returns the CSS variable for a channel's secondary note color.
 * @param doc The song document.
 * @param channelIndex The index of the channel.
 * @returns A CSS var() string for the channel's secondary note color.
 */
export function getSecondaryNoteColor(
	doc: SongDocument,
	channelIndex: number
): string {
	return _getNoteColor(doc, channelIndex, "secondary");
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
		this.container.style.width = width - 2 + "px"; // there's a 1 pixel margin on either side.
	}

	public setHeight(height: number): void {
		this.container.style.height = height - 2 + "px"; // there's a 1 pixel margin on either side.
	}

	public setIndex(
		index: number,
		selected: boolean,
		dim: boolean,
		labelColor: string,
		isNoise: boolean,
		isMod: boolean
	): void {
		if (this._renderedIndex != index) {
			if (index >= 100) {
				this._label.setAttribute("font-size", "16");
				this._label.style.setProperty("transform", "translate(0px, -1.5px)");
			} else {
				this._label.setAttribute("font-size", "20");
				this._label.style.setProperty("transform", "translate(0px, 0px)");
			}

			this._renderedIndex = index;
			this._text.data = String(index);
		}

		// Set the color for the number text itself.
		const useColor: string = selected ? ColorConfig.c_invertedText : labelColor;
		if (this._renderedLabelColor != useColor) {
			this._label.style.color = useColor;
			this._renderedLabelColor = useColor;
		}

		// Set the background color for the box.
		let backgroundColor: string;
		if (selected) {
			backgroundColor = isMod
				? ColorConfig.c_trackEditorBgMod
				: isNoise
				? ColorConfig.c_trackEditorBgNoise
				: ColorConfig.c_trackEditorBgPitch;
		} else {
			backgroundColor = isMod
				? dim
					? ColorConfig.c_trackEditorBgModDim
					: ColorConfig.c_trackEditorBgMod
				: isNoise
				? dim
					? ColorConfig.c_trackEditorBgNoiseDim
					: ColorConfig.c_trackEditorBgNoise
				: dim
				? ColorConfig.c_trackEditorBgPitchDim
				: ColorConfig.c_trackEditorBgPitch;
		}

		if (index == 0 && !selected) {
			backgroundColor = "none";
		}

		if (this._renderedBackgroundColor != backgroundColor) {
			this.container.style.background = backgroundColor;
			this._renderedBackgroundColor = backgroundColor;
		}
	}
	// These cache the value given to them, since they're apparently quite
	// expensive to set.
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
	) {}

	public render(): void {
		ChannelRow.patternHeight = this._doc.getChannelHeight();

		const barWidth: number = this._doc.getBarWidth();
		if (this._boxes.length != this._doc.song.barCount) {
			for (
				let x: number = this._boxes.length;
				x < this._doc.song.barCount;
				x++
			) {
				// Use a safe default color; render() will set the correct one.
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
		const typeIndex: number = getChannelTypeIndex(this._doc, this.index);

		// Determine the CSS variable names for the channel's label colors.
		let primaryColorVar: string;
		let secondaryColorVar: string;

		if (isMod) {
			const colorIndex = (typeIndex % 4) + 1;
			primaryColorVar = `--mod${colorIndex}-primary-channel`;
			secondaryColorVar = `--mod${colorIndex}-secondary-channel`;
		} else if (isNoise) {
			const colorIndex = (typeIndex % 5) + 1;
			primaryColorVar = `--noise${colorIndex}-primary-channel`;
			secondaryColorVar = `--noise${colorIndex}-secondary-channel`;
		} else {
			// is pitch
			const colorIndex = (typeIndex % 10) + 1;
			primaryColorVar = `--pitch${colorIndex}-primary-channel`;
			secondaryColorVar = `--pitch${colorIndex}-secondary-channel`;
		}

		for (let i: number = 0; i < this._boxes.length; i++) {
			const pattern: Pattern | null = this._doc.song.getPattern(this.index, i);
			const selected: boolean =
				i == this._doc.bar && this.index == this._doc.channel;
			const dim: boolean = pattern == null || pattern.notes.length == 0;
			const patternIndex = this._doc.song.channels[this.index].bars[i];

			const box: Box = this._boxes[i];
			if (i < this._doc.song.barCount) {
				const useSecondary = dim || patternIndex === 0;
				const labelColor = `var(${
					useSecondary ? secondaryColorVar : primaryColorVar
				})`;

				box.setIndex(patternIndex, selected, dim, labelColor, isNoise, isMod);
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