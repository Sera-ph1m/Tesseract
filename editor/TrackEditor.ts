// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { ColorConfig } from "./ColorConfig";
import { Config } from "../synth/SynthConfig";
import { ChannelTag } from "../synth/synth";
import { isMobile } from "./EditorConfig";
import { SongDocument } from "./SongDocument";
import { ChannelRow } from "./ChannelRow";
import { ChangeRenameChannelTag } from "./changes";
import { SongEditor } from "./SongEditor";
import { HTML, SVG } from "imperative-html/dist/esm/elements-strict";

class TagRow {
  public readonly container: HTMLElement;
  private readonly _label: HTMLElement;
  constructor(tag: ChannelTag) {
    this.container = HTML.div({
      class: "tagRow",
      style: `
					display: flex;
					align-items: center;
					padding-left: 4px;
					margin: 0;
					height: ${ChannelRow.patternHeight}px;	
					box-sizing: border-box;
					background: transparent;
            `,
    });
    this.container.dataset.startChannel = tag.startChannel.toString();
    this._label = HTML.div(
      {
        class: "tagRowLabel",
        style: `
				font-size: 20px;
				font-weight: bold;
				color: ${ColorConfig.primaryText};
			`,
      },
      tag.name
    );
    this.container.appendChild(this._label);
  }
  public update(tag: ChannelTag) {
    this._label.textContent = tag.name;
    this.container.style.height = ChannelRow.patternHeight + "px";
    this.container.dataset.startChannel = tag.startChannel.toString();
  }
  public setColor(color: string) {
    this._label.style.color = color;
  }
}

export class TrackEditor {
  private readonly _tagRows = new Map<string, TagRow>();

  private _channelColors: Map<number, { primary: string; secondary: string }> =
    new Map();

  private _tagColors: Map<string, { primary: string; secondary: string }> =
    new Map();

  public readonly _barDropDown: HTMLSelectElement = HTML.select(
    {
      style:
        "width: 32px; height: " +
        Config.barEditorHeight +
        "px; top: 0px; position: absolute; opacity: 0",
    },

    HTML.option({ value: "barBefore" }, "Insert Bar Before"),
    HTML.option({ value: "barAfter" }, "Insert Bar After"),
    HTML.option({ value: "deleteBar" }, "Delete This Bar")
  );
  private readonly _channelRowContainer: HTMLElement = HTML.div({
    style: `display: flex; flex-direction: column; padding-top: ${Config.barEditorHeight}px`,
  });
  private readonly _barNumberContainer: SVGGElement = SVG.g();
  private readonly _playhead: SVGRectElement = SVG.rect({
    fill: ColorConfig.playhead,
    x: 0,
    y: 0,
    width: 4,
    height: 128,
  });
  private readonly _boxHighlight: SVGRectElement = SVG.rect({
    fill: "none",
    stroke: ColorConfig.hoverPreview,
    "stroke-width": 2,
    "pointer-events": "none",
    x: 1,
    y: 1,
    width: 30,
    height: 30,
  });
  private readonly _upHighlight: SVGPathElement = SVG.path({
    fill: ColorConfig.invertedText,
    stroke: ColorConfig.invertedText,
    "stroke-width": 1,
    "pointer-events": "none",
  });
  private readonly _downHighlight: SVGPathElement = SVG.path({
    fill: ColorConfig.invertedText,
    stroke: ColorConfig.invertedText,
    "stroke-width": 1,
    "pointer-events": "none",
  });
  private readonly _barEditorPath: SVGPathElement = SVG.path({
    fill: ColorConfig.uiWidgetBackground,
    stroke: ColorConfig.uiWidgetBackground,
    "stroke-width": 1,
    "pointer-events": "none",
  });
  private readonly _selectionRect: SVGRectElement = SVG.rect({
    class: "dashed-line dash-move",
    fill: ColorConfig.boxSelectionFill,
    stroke: ColorConfig.hoverPreview,
    "stroke-width": 2,
    "stroke-dasharray": "5, 3",
    "fill-opacity": "0.4",
    "pointer-events": "none",
    visibility: "hidden",
    x: 1,
    y: 1,
    width: 62,
    height: 62,
  });
  private readonly _svg: SVGSVGElement = SVG.svg(
    { style: `position: absolute; top: 0;` },
    this._barEditorPath,
    this._selectionRect,
    this._barNumberContainer,
    this._boxHighlight,
    this._upHighlight,
    this._downHighlight,
    this._playhead
  );
  private readonly _select: HTMLSelectElement = HTML.select({
    class: "trackSelectBox",
    style:
      "background: none; border: none; appearance: none; border-radius: initial; box-shadow: none; color: transparent; position: absolute; touch-action: none;",
  });

  public readonly container: HTMLElement = HTML.div(
    {
      class: "noSelection",
      style: `background-color: ${ColorConfig.editorBackground}; position: relative; overflow: hidden;`,
    },
    this._channelRowContainer,
    this._svg,
    this._select,
    this._barDropDown
  );

  private readonly _channels: ChannelRow[] = [];
  private readonly _barNumbers: SVGTextElement[] = [];
  private _mouseX: number = 0;
  private _mouseY: number = 0;
  private _mouseStartBar: number = 0;
  private _mouseStartChannel: number = 0;
  private _mouseBar: number = 0;
  private _mouseChannel: number = 0;
  private _mouseOver: boolean = false;
  private _mousePressed: boolean = false;
  private _mouseDragging = false;
  private _barWidth: number = 32;
  private _renderedBarCount: number = -1;
  private _renderedEditorWidth: number = -1;
  private _renderedEditorHeight: number = -1;
  private _renderedPatternCount: number = 0;
  private _renderedPlayhead: number = -1;
  private _touchMode: boolean = isMobile;
  private _barDropDownBar: number = 0;
  private _lastScrollTime: number = 0;

  constructor(private _doc: SongDocument, public _songEditor: SongEditor) {
    window.requestAnimationFrame(this._animatePlayhead);
    this._svg.addEventListener("mousedown", this._whenMousePressed);
    document.addEventListener("mousemove", this._whenMouseMoved);
    document.addEventListener("mouseup", this._whenMouseReleased);
    this._svg.addEventListener("mouseover", this._whenMouseOver);
    this._svg.addEventListener("mouseout", this._whenMouseOut);
    this._svg.addEventListener("contextmenu", this._whenContextMenu);

    this._select.addEventListener("change", this._whenSelectChanged);
    this._select.addEventListener("touchstart", this._whenSelectPressed);
    this._select.addEventListener("touchmove", this._whenSelectMoved);
    this._select.addEventListener("touchend", this._whenSelectReleased);
    this._select.addEventListener("touchcancel", this._whenSelectReleased);

    let determinedCursorType: boolean = false;
    document.addEventListener(
      "mousedown",
      () => {
        if (!determinedCursorType) {
          this._touchMode = false;
          this._updatePreview();
        }
        determinedCursorType = true;
      },
      true
    );
    document.addEventListener(
      "touchstart",
      () => {
        if (!determinedCursorType) {
          this._touchMode = true;
          this._updatePreview();
        }
        determinedCursorType = true;
      },
      true
    );

    this._barDropDown.selectedIndex = -1;
    this._barDropDown.addEventListener("change", this._barDropDownHandler);
    this._barDropDown.addEventListener(
      "mousedown",
      this._barDropDownGetOpenedPosition
    );
  }

  public get channelColors(): Map<
    number,
    { primary: string; secondary: string }
  > {
    return this._channelColors;
  }

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

    for (let ch = 0; ch < channelCount; ch++) {
      tags
        .filter((t) => t.startChannel === ch)
        .forEach((tag) => {
          const colorIndex = (pitchCounter % 10) + 1;
          const colors = {
            primary: `var(--pitch${colorIndex}-primary-note)`,
            secondary: `var(--pitch${colorIndex}-secondary-note)`,
          };
          tagColors.set(tag.id, colors);
          pitchCounter = (pitchCounter + 1) % 10;
        });

      if (song.getChannelIsMod(ch)) {
        const colorIndex = (modCounter % 4) + 1;
        baseChannelColors.set(ch, {
          primary: `var(--mod${colorIndex}-primary-note)`,
          secondary: `var(--mod${colorIndex}-secondary-note)`,
        });
        modCounter = (modCounter + 1) % 4;
      } else {
        const colorIndex = (pitchCounter % 10) + 1;
        baseChannelColors.set(ch, {
          primary: `var(--pitch${colorIndex}-primary-note)`,
          secondary: `var(--pitch${colorIndex}-secondary-note)`,
        });
        pitchCounter = (pitchCounter + 1) % 10;
      }
    }

    this._tagColors = tagColors;

    for (let ch = 0; ch < channelCount; ch++) {
      const covering = tags.filter(
        (t) => t.startChannel <= ch && ch <= t.endChannel
      );
      let innermostTag = null;
      if (covering.length > 0) {
        const minRange = Math.min(
          ...covering.map((t) => t.endChannel - t.startChannel)
        );
        const smallest = covering.filter(
          (t) => t.endChannel - t.startChannel === minRange
        );
        if (smallest.length > 1) {
          innermostTag = smallest.reduce(
            (latest, t) =>
              tags.indexOf(t) > tags.indexOf(latest) ? t : latest,
            smallest[0]
          );
        } else {
          innermostTag = smallest[0];
        }
      }
      if (innermostTag) {
        this._channelColors.set(ch, tagColors.get(innermostTag.id)!);
      } else {
        this._channelColors.set(ch, baseChannelColors.get(ch)!);
      }
    }
  }

  private _computeChannelIndexFromY(relY: number): number {
    const rows = Array.from(
      this._channelRowContainer.children
    ) as HTMLElement[];
    let cum = 0;
    for (const row of rows) {
      if (row.style.display === "none") continue;
      const h = row.offsetHeight;
      if (relY < cum + h) {
        if (row.classList.contains("tagRow")) {
          const idx = parseInt(row.dataset.startChannel!);
          return isNaN(idx) ? 0 : idx;
        } else {
          const idx = parseInt(row.dataset.channelIndex!);
          return isNaN(idx) ? 0 : idx;
        }
      }
      cum += h;
    }
    return Math.max(0, this._doc.song.getChannelCount() - 1);
  }

  private _getVisualRowInfo(
    channelIndex: number
  ): { y: number; height: number } | null {
    let cumulativeY = Config.barEditorHeight;
    const channelRow = this._channelRowContainer.querySelector(
      `[data-channel-index='${channelIndex}']`
    ) as HTMLElement | null;

    if (!channelRow || channelRow.style.display === "none") {
      return null;
    }

    const rows = Array.from(
      this._channelRowContainer.children
    ) as HTMLElement[];
    for (const row of rows) {
      if (row.style.display === "none") continue;
      if (row === channelRow) {
        return { y: cumulativeY, height: row.offsetHeight };
      }
      cumulativeY += row.offsetHeight;
    }
    return null;
  }

  private _getTagRowAtY(y: number): HTMLElement | null {
    const relY = y - Config.barEditorHeight;
    if (relY < 0) return null;

    let cumulativeHeight = 0;
    const rows = Array.from(
      this._channelRowContainer.children
    ) as HTMLElement[];

    for (const row of rows) {
      if (row.style.display === "none") continue;
      const rowHeight = row.offsetHeight;
      if (relY >= cumulativeHeight && relY < cumulativeHeight + rowHeight) {
        if (row.classList.contains("tagRow")) {
          return row;
        }
        return null;
      }
      cumulativeHeight += rowHeight;
    }
    return null;
  }

  private _barDropDownGetOpenedPosition = (event: MouseEvent): void => {
    this._barDropDownBar = Math.floor(
      Math.min(
        this._doc.song.barCount - 1,
        Math.max(0, this._mouseX / this._barWidth)
      )
    );
  };

  private _barDropDownHandler = (event: Event): void => {
    var moveBarOffset = this._barDropDown.value == "barBefore" ? 0 : 1;

    if (
      this._barDropDown.value == "barBefore" ||
      this._barDropDown.value == "barAfter"
    ) {
      this._doc.bar = this._barDropDownBar - 1 + moveBarOffset;
      this._doc.selection.resetBoxSelection();
      this._doc.selection.insertBars();
      if (this._doc.synth.playhead >= this._barDropDownBar + moveBarOffset) {
        this._doc.synth.playhead++;
        this._songEditor._barScrollBar.animatePlayhead();
      }
    } else if (this._barDropDown.value == "deleteBar") {
      this._doc.bar = this._barDropDownBar;
      this._doc.selection.resetBoxSelection();
      this._doc.selection.deleteBars();
      if (this._doc.synth.playhead > this._barDropDownBar) {
        this._doc.synth.playhead--;
        this._songEditor._barScrollBar.animatePlayhead();
      }
    }

    this._barDropDown.selectedIndex = -1;
  };

  private _whenSelectChanged = (): void => {
    this._doc.selection.setPattern(this._select.selectedIndex);
  };

  private _animatePlayhead = (timestamp: number): void => {
    const playhead = this._barWidth * this._doc.synth.playhead - 2;
    if (this._renderedPlayhead != playhead) {
      this._renderedPlayhead = playhead;
      this._playhead.setAttribute("x", "" + playhead);
    }
    window.requestAnimationFrame(this._animatePlayhead);
  };

  public movePlayheadToMouse(): boolean {
    if (this._mouseOver) {
      this._doc.synth.playhead =
        this._mouseBar + (this._mouseX % this._barWidth) / this._barWidth;
      return true;
    }
    return false;
  }

  private _dragBoxSelection(): void {
    this._doc.selection.setTrackSelection(
      this._doc.selection.boxSelectionX0,
      this._mouseBar,
      this._doc.selection.boxSelectionY0,
      this._mouseChannel
    );
    this._doc.selection.selectionUpdated();
  }

  private _updateSelectPos(event: TouchEvent): void {
    const boundingRect: ClientRect = this._svg.getBoundingClientRect();
    this._mouseX = event.touches[0].clientX - boundingRect.left;
    this._mouseY = event.touches[0].clientY - boundingRect.top;
    if (isNaN(this._mouseX)) this._mouseX = 0;
    if (isNaN(this._mouseY)) this._mouseY = 0;

    this._mouseBar = Math.floor(
      Math.min(
        this._doc.song.barCount - 1,
        Math.max(0, this._mouseX / this._barWidth)
      )
    );
    let relY = this._mouseY - Config.barEditorHeight;
    if (relY < 0) relY = 0;
    this._mouseChannel = this._computeChannelIndexFromY(relY);
  }

  private _whenSelectPressed = (event: TouchEvent): void => {
    this._mousePressed = true;
    this._mouseDragging = true;
    this._updateSelectPos(event);
    this._mouseStartBar = this._mouseBar;
    this._mouseStartChannel = this._mouseChannel;
  };

  private _whenSelectMoved = (event: TouchEvent): void => {
    this._updateSelectPos(event);
    if (
      this._mouseStartBar != this._mouseBar ||
      this._mouseStartChannel != this._mouseChannel
    ) {
      event.preventDefault();
    }
    if (this._mousePressed) this._dragBoxSelection();
    this._updatePreview();
  };

  private _whenSelectReleased = (event: TouchEvent): void => {
    this._mousePressed = false;
    this._mouseDragging = false;
    this._updatePreview();
  };

  private _whenMouseOver = (event: MouseEvent): void => {
    if (this._mouseOver) return;
    this._mouseOver = true;
  };

  private _whenMouseOut = (event: MouseEvent): void => {
    if (!this._mouseOver) return;
    this._mouseOver = false;
  };

  private _updateMousePos(event: MouseEvent): void {
    const boundingRect: ClientRect = this._svg.getBoundingClientRect();
    this._mouseX = (event.clientX || event.pageX) - boundingRect.left;
    this._mouseY = (event.clientY || event.pageY) - boundingRect.top;

    this._mouseBar = Math.floor(
      Math.min(
        this._doc.song.barCount - 1,
        Math.max(0, this._mouseX / this._barWidth)
      )
    );
    let relY = this._mouseY - Config.barEditorHeight;
    if (relY < 0) relY = 0;
    this._mouseChannel = this._computeChannelIndexFromY(relY);
  }

  private _whenMousePressed = (event: MouseEvent): void => {
    event.preventDefault();
    if (event.button !== 0) return;
    this._mousePressed = true;
    this._updateMousePos(event);
    this._mouseStartBar = this._mouseBar;
    this._mouseStartChannel = this._mouseChannel;

    const tagRow = this._getTagRowAtY(this._mouseY);
    if (tagRow) {
      if (event.button !== 0) {
        this._mousePressed = false;
        this._mouseDragging = false;
        return;
      }

      const tagId = tagRow.dataset.tagId;
      if (tagId) {
        const tag = this._doc.song.channelTags.find((t) => t.id === tagId);
        if (tag) {
          const orig = tag.name;
          const collapsed = orig.endsWith("...");
          const newName = collapsed ? orig.slice(0, -3) : orig + "...";
          this._doc.record(
            new ChangeRenameChannelTag(this._doc, tag.id, newName)
          );
        }
      }

      this._mousePressed = false;
      this._mouseDragging = false;
      return;
    }

    if (this._mouseY >= Config.barEditorHeight) {
      if (event.shiftKey) {
        this._mouseDragging = true;
        this._doc.selection.setTrackSelection(
          this._doc.selection.boxSelectionX0,
          this._mouseBar,
          this._doc.selection.boxSelectionY0,
          this._mouseChannel
        );
        this._doc.selection.selectionUpdated();
      } else {
        this._mouseDragging = false;
        if (
          this._doc.channel != this._mouseChannel ||
          this._doc.bar != this._mouseBar
        ) {
          this._doc.selection.setChannelBar(this._mouseChannel, this._mouseBar);
          this._mouseDragging = true;
        }
        this._doc.selection.resetBoxSelection();
      }
    }
  };

  private _whenMouseMoved = (event: MouseEvent): void => {
    this._updateMousePos(event);
    if (this._mousePressed) {
      if (
        this._mouseStartBar != this._mouseBar ||
        this._mouseStartChannel != this._mouseChannel
      ) {
        this._mouseDragging = true;
      }
      this._dragBoxSelection();
    }
    this._updatePreview();
  };

  private _whenMouseReleased = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    if (this._mousePressed && !this._mouseDragging) {
      if (
        this._doc.channel == this._mouseChannel &&
        this._doc.bar == this._mouseBar
      ) {
        const visualRowInfo = this._getVisualRowInfo(this._mouseChannel);
        if (visualRowInfo) {
          const rowTop = visualRowInfo.y;
          const localY = this._mouseY - rowTop;
          const up: boolean = localY < visualRowInfo.height / 2;

          const patternCount: number = this._doc.song.patternsPerChannel;
          this._doc.selection.setPattern(
            (this._doc.song.channels[this._mouseChannel].bars[this._mouseBar] +
              (up ? 1 : patternCount)) %
              (patternCount + 1)
          );
        }
      }
    }
    this._mousePressed = false;
    this._mouseDragging = false;
    this._updatePreview();
  };

  private _whenContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    this._updateMousePos(event);

    const tagRow = this._getTagRowAtY(this._mouseY);
    if (tagRow) {
      document.dispatchEvent(
        new CustomEvent("muteeditor-open-tag-menu", {
          detail: { tagId: tagRow.dataset.tagId, originalEvent: event },
        })
      );
      this._boxHighlight.style.visibility = "hidden";
      this._upHighlight.style.visibility = "hidden";
      this._downHighlight.style.visibility = "hidden";
      return;
    }

    if (this._mouseY >= Config.barEditorHeight) {
      const ch = this._mouseChannel;
      document.dispatchEvent(
        new CustomEvent("muteeditor-open-channel-menu", {
          detail: { channelIndex: ch, originalEvent: event },
        })
      );
      this._boxHighlight.style.visibility = "hidden";
      this._upHighlight.style.visibility = "hidden";
      this._downHighlight.style.visibility = "hidden";
      return;
    }

    this._updatePreview();
  };

  private _updatePreview(): void {
    if (this._mouseOver && this._getTagRowAtY(this._mouseY)) {
      this._svg.style.cursor = "pointer";
      this._boxHighlight.style.visibility = "hidden";
      this._upHighlight.style.visibility = "hidden";
      this._downHighlight.style.visibility = "hidden";
      return;
    } else if (this._mouseOver) {
      this._svg.style.cursor = "default";
    }

    let channel: number = this._mouseChannel;
    let bar: number = this._mouseBar;

    if (this._touchMode) {
      bar = this._doc.bar;
      channel = this._doc.channel;
    }

    const selected: boolean =
      bar == this._doc.bar && channel == this._doc.channel;
    const overTrackEditor: boolean = this._mouseY >= Config.barEditorHeight;
    const visualRowInfo = this._getVisualRowInfo(channel);

    if (this._mouseDragging && this._mouseStartBar != this._mouseBar) {
      var timestamp: number = Date.now();
      if (timestamp - this._lastScrollTime >= 50) {
        if (
          bar > this._doc.barScrollPos + this._doc.trackVisibleBars - 1 &&
          this._doc.barScrollPos <
            this._doc.song.barCount - this._doc.trackVisibleBars
        ) {
          this._songEditor.changeBarScrollPos(1);
        }
        if (bar < this._doc.barScrollPos && this._doc.barScrollPos > 0) {
          this._songEditor.changeBarScrollPos(-1);
        }
        this._lastScrollTime = timestamp;
      }
    }

    if (
      this._mouseOver &&
      !this._mousePressed &&
      !selected &&
      overTrackEditor &&
      visualRowInfo
    ) {
      this._boxHighlight.setAttribute("x", "" + (1 + this._barWidth * bar));
      this._boxHighlight.setAttribute("y", "" + (1 + visualRowInfo.y));
      this._boxHighlight.setAttribute(
        "height",
        "" + (visualRowInfo.height - 2)
      );
      this._boxHighlight.setAttribute("width", "" + (this._barWidth - 2));
      this._boxHighlight.style.visibility = "visible";
    } else if (
      (this._mouseOver ||
        (this._mouseX >= bar * this._barWidth &&
          this._mouseX < bar * this._barWidth + this._barWidth &&
          this._mouseY > 0)) &&
      !overTrackEditor
    ) {
      this._boxHighlight.setAttribute("x", "" + (1 + this._barWidth * bar));
      this._boxHighlight.setAttribute("y", "1");
      this._boxHighlight.setAttribute(
        "height",
        "" + (Config.barEditorHeight - 3)
      );
      this._boxHighlight.style.visibility = "visible";
    } else {
      this._boxHighlight.style.visibility = "hidden";
    }

    if (
      (this._mouseOver || this._touchMode) &&
      selected &&
      overTrackEditor &&
      visualRowInfo
    ) {
      const up: boolean =
        this._mouseY - visualRowInfo.y < visualRowInfo.height / 2;
      const center: number = this._barWidth * (bar + 0.8);
      const middle: number = visualRowInfo.y + visualRowInfo.height * 0.5;
      const base: number = visualRowInfo.height * 0.1;
      const tip: number = visualRowInfo.height * 0.4;
      const width: number = visualRowInfo.height * 0.175;

      this._upHighlight.setAttribute(
        "fill",
        up && !this._touchMode
          ? ColorConfig.hoverPreview
          : ColorConfig.invertedText
      );
      this._downHighlight.setAttribute(
        "fill",
        !up && !this._touchMode
          ? ColorConfig.hoverPreview
          : ColorConfig.invertedText
      );

      this._upHighlight.setAttribute(
        "d",
        `M ${center} ${middle - tip} L ${center + width} ${middle - base} L ${
          center - width
        } ${middle - base} z`
      );
      this._downHighlight.setAttribute(
        "d",
        `M ${center} ${middle + tip} L ${center + width} ${middle + base} L ${
          center - width
        } ${middle + base} z`
      );

      this._upHighlight.style.visibility = "visible";
      this._downHighlight.style.visibility = "visible";
    } else {
      this._upHighlight.style.visibility = "hidden";
      this._downHighlight.style.visibility = "hidden";
    }

    const selectedVisualRow = this._getVisualRowInfo(this._doc.channel);
    if (selectedVisualRow) {
      this._select.style.left = this._barWidth * this._doc.bar + "px";
      this._select.style.width = this._barWidth + "px";
      this._select.style.top = selectedVisualRow.y + "px";
      this._select.style.height = selectedVisualRow.height + "px";
    }

    this._barDropDown.style.left = this._barWidth * bar + "px";

    const patternCount: number = this._doc.song.patternsPerChannel + 1;
    for (let i: number = this._renderedPatternCount; i < patternCount; i++) {
      this._select.appendChild(HTML.option({ value: i }, i));
    }
    for (let i: number = patternCount; i < this._renderedPatternCount; i++) {
      this._select.removeChild(<Node>this._select.lastChild);
    }
    this._renderedPatternCount = patternCount;
    const selectedPattern: number =
      this._doc.song.channels[this._doc.channel].bars[this._doc.bar];
    if (this._select.selectedIndex != selectedPattern)
      this._select.selectedIndex = selectedPattern;
  }

  public render(): void {
    this._computeChannelColors();

    this._barWidth = this._doc.getBarWidth();

    const channelCount = this._doc.song.getChannelCount();
    if (this._channels.length !== channelCount) {
      for (let y = this._channels.length; y < channelCount; y++) {
        this._channels[y] = new ChannelRow(this._doc, y);
      }
      this._channels.length = channelCount;
      this._mousePressed = false;
    }

    for (let i = 0; i < channelCount; i++) {
      this._channels[i].render(this._channelColors.get(i)!);
    }

    const tags = this._doc.song.channelTags;
    tags.forEach((tag) => {
      if (!this._tagRows.has(tag.id)) {
        this._tagRows.set(tag.id, new TagRow(tag));
      }
      const row = this._tagRows.get(tag.id)!;
      row.container.dataset.tagId = tag.id;
      row.update(tag);

      row.setColor(this._tagColors.get(tag.id)!.primary);
    });
    for (const id of Array.from(this._tagRows.keys())) {
      if (!tags.find((t) => t.id === id)) this._tagRows.delete(id);
    }

    this._channelRowContainer.innerHTML = "";
    const collapsedTagIds = new Set(
      tags.filter((t) => t.name.endsWith("...")).map((t) => t.id)
    );

    for (let ch = 0; ch < channelCount; ch++) {
      const startTags = tags
        .filter((t) => t.startChannel === ch)
        .sort((a, b) => {
          const lenA = a.endChannel - a.startChannel;
          const lenB = b.endChannel - b.startChannel;
          if (lenA !== lenB) return lenB - lenA;
          return tags.indexOf(a) - tags.indexOf(b);
        });
      startTags.forEach((tag) => {
        const tagRow = this._tagRows.get(tag.id)!.container;
        const isInsideCollapsed = tags.some(
          (p) =>
            collapsedTagIds.has(p.id) &&
            tag.startChannel >= p.startChannel &&
            tag.endChannel <= p.endChannel &&
            p.id !== tag.id
        );
        tagRow.style.display = isInsideCollapsed ? "none" : "flex";
        this._channelRowContainer.appendChild(tagRow);
      });

      const channelRow = this._channels[ch].container;
      const parentTag = tags.find(
        (t) =>
          ch >= t.startChannel &&
          ch <= t.endChannel &&
          collapsedTagIds.has(t.id)
      );
      channelRow.style.display = parentTag ? "none" : "";
      this._channelRowContainer.appendChild(channelRow);
    }

    const editorWidth: number = this._barWidth * this._doc.song.barCount;
    if (this._renderedEditorWidth != editorWidth) {
      this._renderedEditorWidth = editorWidth;
      this._channelRowContainer.style.width = editorWidth + "px";
      this.container.style.width = editorWidth + "px";
      this._svg.setAttribute("width", editorWidth + "");

      var pathString = "";
      for (let x: number = 0; x < this._doc.song.barCount; x++) {
        var pathLeft = x * this._barWidth + 2;
        var pathTop = 1;
        var pathRight = x * this._barWidth + this._barWidth - 2;
        var pathBottom = Config.barEditorHeight - 3;
        pathString += `M ${pathLeft} ${pathTop} H ${pathRight} V ${pathBottom} H ${pathLeft} V ${pathTop} Z `;
      }
      this._barEditorPath.setAttribute("d", pathString);

      if (this._renderedBarCount < this._doc.song.barCount) {
        for (
          var pos = this._renderedBarCount;
          pos < this._doc.song.barCount;
          pos++
        ) {
          this._barNumbers[pos] = SVG.text(
            {
              "font-family": "sans-serif",
              "font-size": "8px",
              "text-anchor": "middle",
              "font-weight": "bold",
              x: pos * this._barWidth + this._barWidth / 2 + "px",
              y: "7px",
              fill: ColorConfig.secondaryText,
            },
            "" + (pos + 1)
          );
          if (pos % 4 == 0) {
            this._barNumbers[pos].setAttribute("fill", ColorConfig.primaryText);
          }
          this._barNumberContainer.appendChild(this._barNumbers[pos]);
        }
      } else if (this._renderedBarCount > this._doc.song.barCount) {
        for (
          var pos = this._renderedBarCount - 1;
          pos >= this._doc.song.barCount;
          pos--
        ) {
          this._barNumberContainer.removeChild(this._barNumbers[pos]);
        }
      }
      this._barNumbers.length = this._doc.song.barCount;
      this._renderedBarCount = this._doc.song.barCount;

      for (var pos = 0; pos < this._barNumbers.length; pos++) {
        this._barNumbers[pos].setAttribute(
          "x",
          pos * this._barWidth + this._barWidth / 2 + "px"
        );
      }
    }

    Array.from(this.container.querySelectorAll(".tagBorder")).forEach((el) =>
      el.remove()
    );
    tags.forEach((tag) => {
      const color = this._tagColors.get(tag.id)!.primary;

      const sameEnd = tags
        .filter((t) => t.endChannel === tag.endChannel)
        .sort((a, b) => {
          const spanA = a.endChannel - a.startChannel;
          const spanB = b.endChannel - b.startChannel;
          if (spanA !== spanB) return spanB - spanA;
          return tags.indexOf(a) - tags.indexOf(b);
        });
      const idx = sameEnd.findIndex((t) => t.id === tag.id);
      const tagRowElem = this._tagRows.get(tag.id)!.container;
      const isCollapsed = collapsedTagIds.has(tag.id);

      if (!isCollapsed) {
        const top = HTML.div({
          class: "tagBorder",
          style: `position:absolute;bottom:0;left:0;
                           width:100%;height:2px;background:${color};
                           pointer-events:none;`,
        });
        tagRowElem.style.position = "relative";
        tagRowElem.appendChild(top);
      }

      let attachElem: HTMLElement | null = null;
      const channelRow = this._channelRowContainer.querySelector(
        `[data-channel-index='${tag.endChannel}']`
      ) as HTMLElement | null;
      if (channelRow && channelRow.style.display !== "none") {
        attachElem = channelRow;
      } else {
        const candidates = tags
          .map((t2) => this._tagRows.get(t2.id)!.container)
          .filter((el) => el.style.display !== "none")
          .filter((el) => {
            const start = parseInt(el.dataset.startChannel!);
            const t2 = tags.find((x) => x.id === el.dataset.tagId)!;
            return start <= tag.endChannel && tag.endChannel <= t2.endChannel;
          });
        if (candidates.length) {
          attachElem = candidates.reduce((best, cur) => {
            return parseInt(cur.dataset.startChannel!) >
              parseInt(best.dataset.startChannel!)
              ? cur
              : best;
          }, candidates[0]);
        }
      }
      if (attachElem) {
        const bot = HTML.div({
          class: "tagBorder",
          style: `position:absolute;bottom:${idx * 3}px;left:0;
                           width:100%;height:2px;background:${color};
                           pointer-events:none;`,
        });
        attachElem.style.position = "relative";
        attachElem.appendChild(bot);
      }
    });

    const editorHeightVisual = Array.from(
      this._channelRowContainer.children
    ).reduce((sum, child) => sum + (child as HTMLElement).offsetHeight, 0);
    if (this._renderedEditorHeight !== editorHeightVisual) {
      this._renderedEditorHeight = editorHeightVisual;
      this._svg.setAttribute(
        "height",
        "" + (editorHeightVisual + Config.barEditorHeight)
      );
      this._playhead.setAttribute(
        "height",
        "" + (editorHeightVisual + Config.barEditorHeight)
      );
      this.container.style.height =
        editorHeightVisual + Config.barEditorHeight + "px";
    }

    if (this._doc.selection.boxSelectionActive) {
      const startCh = this._doc.selection.boxSelectionChannel;
      const endCh = startCh + this._doc.selection.boxSelectionHeight - 1;
      const startVisual = this._getVisualRowInfo(startCh);
      const endVisual = this._getVisualRowInfo(
        Math.min(endCh, this._doc.song.getChannelCount() - 1)
      );

      if (startVisual && endVisual) {
        this._selectionRect.setAttribute(
          "x",
          String(this._barWidth * this._doc.selection.boxSelectionBar + 1)
        );
        this._selectionRect.setAttribute("y", String(startVisual.y + 1));
        this._selectionRect.setAttribute(
          "width",
          String(this._barWidth * this._doc.selection.boxSelectionWidth - 2)
        );
        this._selectionRect.setAttribute(
          "height",
          String(endVisual.y + endVisual.height - startVisual.y - 2)
        );
        this._selectionRect.setAttribute("visibility", "visible");
      } else {
        this._selectionRect.setAttribute("visibility", "hidden");
      }
    } else {
      this._selectionRect.setAttribute("visibility", "hidden");
    }

    this._select.style.display = this._touchMode ? "" : "none";
    this._updatePreview();
  }
}
