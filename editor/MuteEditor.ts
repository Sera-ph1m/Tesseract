// Copyright (c) 2012-2022 John Nesky and contributing authors, distributed under the MIT license, see accompanying the LICENSE.md file.

import { SongDocument } from "./SongDocument";
import { HTML } from "imperative-html/dist/esm/elements-strict";
import { ColorConfig } from "./ColorConfig";
import { InputBox } from "./HTMLWrapper";
import {
  ChangeAddChannel,
  ChangeChannelName,
  ChangeChannelOrder,
  ChangeRemoveChannel,
  ChangeRemoveChannelTag,
  ChangeRenameChannelTag,
  ChangeChannelTagRange,
} from "./changes";
import { ChangeGroup } from "./Change";
import { Config } from "../synth/SynthConfig";
import { ChannelType, ChannelTag } from "../synth/synth";
import { SongEditor } from "./SongEditor";

export class MuteEditor {
  private readonly _tagContextMenu: HTMLDivElement = HTML.div({
    style: `display: none; position: fixed; z-index: 1000; background: ${ColorConfig.editorBackground}; border: 1px solid ${ColorConfig.primaryText}; font-size: 12px; width: max-content;`,
  });
  // Channel context‐menu (replaces the old <select>)
  private readonly _channelContextMenu: HTMLDivElement = HTML.div({
    style: `display: none; position: fixed; z-index: 1000;
                background: ${ColorConfig.editorBackground};
                border: 1px solid ${ColorConfig.primaryText};
                font-size: 12px; width: max-content;`,
  });
  private _activeChannelIndexForMenu: number | null = null;
  private _cornerFiller: HTMLDivElement = HTML.div({
    style: `background: ${ColorConfig.editorBackground}; position: sticky; bottom: 0; left: 0; width: 32px; height: 30px;`,
  });

  private readonly _buttons: HTMLDivElement[] = [];
  private _rowToChannel: (number | null)[] = [];
  private _rowToTag: (string | null)[] = [];
  private readonly _tagColors = new Map<
    string,
    { primary: string; secondary: string }
  >();
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
    // Note: This InputBox handler might not be fully functional with the new context menu approach
    // as ChangeChannelName now takes channelIndex. It's best to confirm how this InputBox is used.
    (oldValue: string, newValue: string) =>
      new ChangeChannelName(
        this._doc,
        this._activeChannelIndexForMenu!,
        oldValue,
        newValue
      )
  );

  public readonly container: HTMLElement = HTML.div(
    {
      class: "muteEditor",
      style: "position: sticky; padding-top: " + Config.barEditorHeight + "px;",
    },
    this._channelNameDisplay,
    this._channelNameInput.input
  );

  // NOTE: This logic is duplicated from TrackEditor.ts due to architectural constraints
  // that prevent passing the computed map from TrackEditor through SongEditor.
  private _channelColors: Map<number, { primary: string; secondary: string }> =
    new Map();

  // Helper function to re-calculate colors according to the new logic.
  // Duplicated from TrackEditor because MuteEditor cannot access TrackEditor's internal state.
  private _computeChannelColors(): void {
     // Wipe and gather root CSS vars
     this._channelColors.clear();
     const song = this._doc.song;
     const channelCount = song.getChannelCount();
     const tags = song.channelTags;
     const rootStyle = getComputedStyle(document.documentElement);
     const useFormula =
       rootStyle.getPropertyValue("--use-color-formula").trim() === "true";
 
     // We'll store either dynamic or static results here first
     const baseChannelColors = new Map<number, {
       primary: string;
       secondary: string;
     }>();
 
     if (useFormula) {
       // dynamic HSL stepping
       let pitchIdx = 0, noiseIdx = 0, modIdx = 0;
       const getColor = (
         type: "pitch" | "noise" | "mod",
         element: "primary-note" | "secondary-note",
         idx: number
       ): string => {
         const prefix = `--${type}-${element}`;
         const baseH = parseFloat(rootStyle.getPropertyValue(`${prefix}-hue`));
         const stepH = parseFloat(
           rootStyle.getPropertyValue(`${prefix}-hue-scale`)
         ) * 6.5;
         const baseS = parseFloat(rootStyle.getPropertyValue(`${prefix}-sat`));
         const stepS = parseFloat(
           rootStyle.getPropertyValue(`${prefix}-sat-scale`)
         );
         const baseL = parseFloat(rootStyle.getPropertyValue(`${prefix}-lum`)) * .85;
         const stepL = parseFloat(
           rootStyle.getPropertyValue(`${prefix}-lum-scale`)
         );
         const h = ((baseH + idx * stepH) % 360 + 360) % 360;
         const s = Math.min(100, Math.max(0, baseS + idx * stepS));
         const l = Math.min(100, Math.max(0, baseL + idx * stepL));
         return `hsl(${h}, ${s}%, ${l}%)`;
       };
 
       for (let ch = 0; ch < channelCount; ch++) {
         const type = song.getChannelIsMod(ch)
           ? "mod"
           : song.getChannelIsNoise(ch)
             ? "noise"
             : "pitch";
         const idx =
           type === "pitch" ? pitchIdx++ :
           type === "noise" ? noiseIdx++ :
           modIdx++;
         baseChannelColors.set(ch, {
           primary: getColor(type, "primary-note", idx),
           secondary: getColor(type, "secondary-note", idx),
         });
       }
 
       // Tag‐color = the color of its first channel
       this._tagColors.clear();
       tags.forEach(t =>
         this._tagColors.set(t.id, baseChannelColors.get(t.startChannel)!)
       );
     } else {
       // static CSS‐var lookup (original)
       let pitchCounter = 0, modCounter = 0;
       const tagColors = new Map<string, {
         primary: string;
         secondary: string;
       }>();
 
       for (let ch = 0; ch < channelCount; ch++) {
         tags
           .filter(t => t.startChannel === ch)
           .forEach(tag => {
             const i = (pitchCounter % 10) + 1;
             tagColors.set(tag.id, {
               primary: `var(--pitch${i}-primary-note)`,
               secondary: `var(--pitch${i}-secondary-note)`,
             });
             pitchCounter = (pitchCounter + 1) % 10;
           });
 
         if (song.getChannelIsMod(ch)) {
           const i = (modCounter % 4) + 1;
           baseChannelColors.set(ch, {
             primary: `var(--mod${i}-primary-note)`,
             secondary: `var(--mod${i}-secondary-note)`,
           });
           modCounter = (modCounter + 1) % 4;
         } else {
           const i = (pitchCounter % 10) + 1;
           baseChannelColors.set(ch, {
             primary: `var(--pitch${i}-primary-note)`,
             secondary: `var(--pitch${i}-secondary-note)`,
           });
           pitchCounter = (pitchCounter + 1) % 10;
         }
       }
 
       this._tagColors.clear();
       tagColors.forEach((c, id) => this._tagColors.set(id, c));
     }
 
     // Final sweep: override with tags or base
     for (let ch = 0; ch < channelCount; ch++) {
       const innermost = tags
         .filter(t => t.startChannel <= ch && ch <= t.endChannel)
         .pop();
       if (innermost) {
         this._channelColors.set(ch, this._tagColors.get(innermost.id)!);
       } else {
         this._channelColors.set(ch, baseChannelColors.get(ch)!);
       }
     }
	}

  private _renderedPitchChannels: number = 0;
  private _renderedNoiseChannels: number = 0;
  private _renderedChannelHeight: number = -1;
  private _renderedModChannels: number = 0;
  private _channelDropDownOpen: boolean = false;
  private _activeTagIdForMenu: string | null = null;

  constructor(private _doc: SongDocument, private _editor: SongEditor) {
    this.container.addEventListener("click", this._onClick);
    this.container.addEventListener("mousemove", this._onMouseMove);
    this.container.addEventListener("mouseleave", this._onMouseLeave);

    this._tagContextMenu.addEventListener("click", this._onTagMenuClick);
    this._channelContextMenu.addEventListener(
      "click",
      this._onChannelMenuClick
    );
    document.addEventListener("mousedown", this._onDocumentMouseDown, true);
    document.body.appendChild(this._channelContextMenu);

    document.addEventListener(
      "muteeditor-open-tag-menu",
      this._onOpenTagMenu as EventListener
    );
    document.addEventListener(
      "muteeditor-open-channel-menu",
      this._onOpenChannelMenu as EventListener
    );

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

    // Render the tag-menu at top level so it floats above everything
    document.body.appendChild(this._tagContextMenu);
  }

  private _onDocumentMouseDown = (event: MouseEvent): void => {
    if (
      this._tagContextMenu.style.display !== "none" &&
      !this._tagContextMenu.contains(event.target as Node)
    ) {
      this._tagContextMenu.style.display = "none";
    }
    if (
      this._channelContextMenu.style.display !== "none" &&
      !this._channelContextMenu.contains(event.target as Node)
    ) {
      this._channelContextMenu.style.display = "none";
    }
  };

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

  private _onClick = (event: MouseEvent): void => {
    const container = (event.target as HTMLElement).closest(
      ".muteContainer"
    ) as HTMLDivElement;
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
      // show our new context menu
      this.openChannelContextMenu(ch, event);
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
        this._tagContextMenu.style.display === "none" &&
        this._channelContextMenu.style.display === "none" &&
        target != this._channelNameDisplay
      ) {
        this._channelNameDisplay.style.setProperty("display", "none");
      }
      return;
    }

    const ch = this._rowToChannel[index];
    let xPos: number =
      event.clientX - this._buttons[index].getBoundingClientRect().left;

    if (ch !== null) {
      if (xPos >= 21.0) {
        if (!this._channelDropDownOpen) {
          var height = this._doc.getChannelHeight();
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
        }
      } else {
        if (!this._channelDropDownOpen) {
          this._channelNameDisplay.style.setProperty("display", "none");
        }
      }
    } else {
      this._channelNameDisplay.style.setProperty("display", "none");
      if (!this._channelDropDownOpen) {
      }
    }
  };

  private _onMouseLeave = (event: MouseEvent): void => {
    if (
      !this._channelDropDownOpen &&
      this._tagContextMenu.style.display === "none" &&
      this._channelContextMenu.style.display === "none"
    ) {
      this._channelNameDisplay.style.setProperty("display", "none");
    }
  };

  public onKeyUp(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case 27: // esc
      case 13: // enter
        this._channelDropDownOpen = false;
        this._tagContextMenu.style.display = "none";
        this._channelContextMenu.style.display = "none";
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
          style:
            "display: table-cell; -webkit-text-stroke: 1.5px; vertical-align: middle; text-align: center; -webkit-user-select: none; -webkit-touch-callout: none; -moz-user-select: none; -ms-user-select: none; user-select: none; pointer-events: none; width: 12px; height: 20px; transform: translate(0px, 1px);",
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
      this._rowToTag.length = totalRows;
      this.container.appendChild(this._cornerFiller);
    }

    const collapsedTagIds = new Set(
      tags.filter((t) => t.name.endsWith("...")).map((t) => t.id)
    );
    let rowIndex = 0;

    for (let ch = 0; ch < channelCount; ch++) {
      tags
        .filter((t) => t.startChannel === ch)
        .forEach((tag) => {
          const muteContainer = this._buttons[rowIndex];
          const countText = this._channelCounts[rowIndex];

          this._rowToChannel[rowIndex] = null;
          this._rowToTag[rowIndex] = tag.id;

          (muteContainer.children[0] as HTMLElement).style.visibility =
            "hidden";
          countText.textContent = "○";
          countText.style.color = this._tagColors.get(tag.id)!.primary;
          countText.style.fontSize = "inherit";

          const isInsideCollapsed = tags.some(
            (p) =>
              collapsedTagIds.has(p.id) &&
              tag.startChannel >= p.startChannel &&
              tag.endChannel <= p.endChannel &&
              p.id !== tag.id
          );
          muteContainer.style.display = isInsideCollapsed ? "none" : "table";

          rowIndex++;
        });

      const muteContainer = this._buttons[rowIndex];
      const countText = this._channelCounts[rowIndex];
      const muteButton = muteContainer.children[0] as HTMLElement;

      this._rowToChannel[rowIndex] = ch;
      this._rowToTag[rowIndex] = null;

      const parentTag = tags.find(
        (t) =>
          ch >= t.startChannel &&
          ch <= t.endChannel &&
          collapsedTagIds.has(t.id)
      );
      muteContainer.style.display = parentTag ? "none" : "table";

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

    const currentChannelHeight = this._doc.getChannelHeight();
    if (
      this._renderedChannelHeight != currentChannelHeight ||
      startingRowCount != totalRows
    ) {
      for (let y: number = 0; y < totalRows; y++) {
        this._buttons[y].style.marginTop =
          (currentChannelHeight - 20) / 2 + "px";
        this._buttons[y].style.marginBottom =
          (currentChannelHeight - 20) / 2 + "px";
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

    if (
      startingRowCount != totalRows ||
      this._renderedChannelHeight != currentChannelHeight
    ) {
      this._renderedChannelHeight = currentChannelHeight;
      const editorHeight =
        Config.barEditorHeight +
        Array.from(this._buttons).reduce(
          (sum, btn) => sum + btn.offsetHeight,
          0
        );
      this._channelNameDisplay.style.setProperty("display", "none");
      this.container.style.height = editorHeight + 16 + "px";

      if (currentChannelHeight < 27) {
        this._channelNameDisplay.style.setProperty("margin-top", "-2px");
        this._channelNameInput.input.style.setProperty("margin-top", "-4px");
      } else if (currentChannelHeight < 30) {
        this._channelNameDisplay.style.setProperty("margin-top", "-1px");
        this._channelNameInput.input.style.setProperty("margin-top", "-3px");
      } else {
        this._channelNameDisplay.style.setProperty("margin-top", "0px");
        this._channelNameInput.input.style.setProperty("margin-top", "-2px");
      }
    }
  }

  private _onOpenTagMenu = (evt: CustomEvent) => {
    this.openTagContextMenu(evt.detail.tagId, evt.detail.originalEvent);
  };
  private _onOpenChannelMenu = (evt: CustomEvent) => {
    this.openChannelContextMenu(
      evt.detail.channelIndex,
      evt.detail.originalEvent
    );
  };

  public openTagContextMenu(tagId: string, event: MouseEvent): void {
    if (!tagId) return;
    this._activeTagIdForMenu = tagId;

    this._tagContextMenu.innerHTML = ""; // Clear old options
    const options = [
      { label: "Rename...", action: "tagRename" },
      { label: "Mute/Unmute Tag", action: "tagMute" },
      { label: "Solo/Unsolo Tag", action: "tagSolo" },
      { label: "Remove Tag", action: "tagRemove" },
      { label: "Remove Channels & Tag", action: "tagRemoveChannels" },
    ];

    for (const opt of options) {
      const optionDiv = HTML.div(
        {
          "data-action": opt.action,
          style: `padding: 4px 8px; cursor: pointer; color: ${ColorConfig.primaryText};`,
        },
        opt.label
      );
      optionDiv.addEventListener("mouseenter", () => {
        optionDiv.style.backgroundColor = ColorConfig.uiWidgetFocus;
      });
      optionDiv.addEventListener("mouseleave", () => {
        optionDiv.style.backgroundColor = "transparent";
      });
      this._tagContextMenu.appendChild(optionDiv);
    }

    // Render menu invisibly to get its dimensions
    this._tagContextMenu.style.visibility = "hidden";
    this._tagContextMenu.style.display = "block";
    const menuHeight = this._tagContextMenu.offsetHeight;
    this._tagContextMenu.style.visibility = "";

    // Clamp menu inside viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mw = this._tagContextMenu.offsetWidth;
    let lx = event.clientX;
    let ty = event.clientY - menuHeight;
    if (lx + mw > vw)   lx = vw - mw;
    if (lx < 0)         lx = 0;
    if (ty + menuHeight > vh) ty = vh - menuHeight;
    if (ty < 0)        ty = 0;
    this._tagContextMenu.style.left = lx + "px";
    this._tagContextMenu.style.top  = ty + "px";
  }

  private _onTagMenuClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action) return;

    this._tagContextMenu.style.display = "none";
    if (!this._activeTagIdForMenu) return;

    const tag = this._doc.song.channelTags.find(
      (t) => t.id === this._activeTagIdForMenu
    );
    if (!tag) return;

    switch (action) {
      case "tagRename": {
        const isCollapsed = tag.name.endsWith("...");
        const currentName = isCollapsed ? tag.name.slice(0, -3) : tag.name;
        const newName = window.prompt("Enter new tag name:", currentName);
        if (newName !== null && newName.trim() !== "") {
          const finalName = isCollapsed
            ? newName.trim() + "..."
            : newName.trim();
          this._doc.record(
            new ChangeRenameChannelTag(this._doc, tag.id, finalName)
          );
        }
        break;
      }
      case "tagMute": {
        const chs: number[] = [];
        for (let i = tag.startChannel; i <= tag.endChannel; i++) {
          if (!this._doc.song.getChannelIsMod(i)) chs.push(i);
        }
        const allMuted = chs.every((i) => this._doc.song.channels[i].muted);
        chs.forEach((i) => (this._doc.song.channels[i].muted = !allMuted));
        this._doc.notifier.changed();
        break;
      }
      case "tagSolo": {
        const total = this._doc.song.getChannelCount();
        const inside: number[] = [];
        const outside: number[] = [];
        for (let i = 0; i < total; i++) {
          if (this._doc.song.getChannelIsMod(i)) continue;
          if (i >= tag.startChannel && i <= tag.endChannel) inside.push(i);
          else outside.push(i);
        }
        const isSoloed =
          inside.every((i) => !this._doc.song.channels[i].muted) &&
          outside.every((i) => this._doc.song.channels[i].muted);
        if (isSoloed) {
          for (let i = 0; i < total; i++)
            this._doc.song.channels[i].muted = false;
        } else {
          for (let i = 0; i < total; i++) {
            if (this._doc.song.getChannelIsMod(i)) {
              this._doc.song.channels[i].muted = false;
            } else if (i >= tag.startChannel && i <= tag.endChannel) {
              this._doc.song.channels[i].muted = false;
            } else {
              this._doc.song.channels[i].muted = true;
            }
          }
        }
        this._doc.notifier.changed();
        break;
      }
      case "tagRemove":
        this._doc.record(
          new ChangeRemoveChannelTag(this._doc, this._activeTagIdForMenu)
        );
        break;
      case "tagRemoveChannels": {
        this._doc.record(
          new ChangeRemoveChannelTag(this._doc, this._activeTagIdForMenu)
        );
        for (let i = tag.endChannel; i >= tag.startChannel; i--) {
          this._doc.record(new ChangeRemoveChannel(this._doc, i));
        }
        break;
      }
    }

    this._activeTagIdForMenu = null;
	 this._editor.refocusStage();
  };

  // Build & show the channel context menu
  public openChannelContextMenu(channelIndex: number, event: MouseEvent): void {
    this._activeChannelIndexForMenu = channelIndex;
    const ch = this._doc.song.channels[channelIndex];
    const pc = this._doc.song.pitchChannelCount;
    const nc = this._doc.song.noiseChannelCount;
    // 1) Header: channel name (non‐clickable)
    this._channelContextMenu.innerHTML = "";
    const displayName =
      ch.name ||
      (channelIndex < pc
        ? `Pitch ${channelIndex + 1}`
        : channelIndex < pc + nc
        ? `Noise ${channelIndex - pc + 1}`
        : `Mod ${channelIndex - pc - nc + 1}`);
    const hdr = HTML.div(
      {
        style: `padding:4px 8px;
                        color:${ColorConfig.secondaryText};
                        pointer-events:none;
                        font-weight:bold;`,
      },
      displayName
    );
    this._channelContextMenu.appendChild(hdr);
    // 2) Separator
    const sep = HTML.div({
      style: `border-top:1px solid ${ColorConfig.primaryText};
                    margin:4px 0;
                    pointer-events:none;`,
    });
    this._channelContextMenu.appendChild(sep);
    // 3) Actions
    const options = [
      { label: "Rename…", action: "rename" },
      { label: "Move Channel Up", action: "chnUp" },
      { label: "Move Channel Down", action: "chnDown" },
      {
        label: ch.muted ? "Unmute Channel" : "Mute Channel",
        action: "chnMute",
      },
      { label: "Solo Channel", action: "chnSolo" },
      { label: "Insert Channel Below", action: "chnInsert" },
      { label: "Delete This Channel", action: "chnDelete" },
    ];
    for (const o of options) {
      const d = HTML.div(
        {
          "data-action": o.action,
          style: `padding:4px 8px;
                          cursor:pointer;
                          color:${ColorConfig.primaryText};`,
        },
        o.label
      );
      d.addEventListener(
        "mouseenter",
        () => (d.style.backgroundColor = ColorConfig.uiWidgetFocus)
      );
      d.addEventListener(
        "mouseleave",
        () => (d.style.backgroundColor = "transparent")
      );
      this._channelContextMenu.appendChild(d);
    }
    // 4) measure & position
    this._channelContextMenu.style.visibility = "hidden";
    this._channelContextMenu.style.display = "block";
    const h = this._channelContextMenu.offsetHeight;
    this._channelContextMenu.style.visibility = "";
    // Clamp menu inside viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mw = this._channelContextMenu.offsetWidth;
    let lx = event.clientX;
    let ty = event.clientY - h;
    if (lx + mw > vw)   lx = vw - mw;
    if (lx < 0)         lx = 0;
    if (ty + h > vh)    ty = vh - h;
    if (ty < 0)         ty = 0;
    this._channelContextMenu.style.left = lx + "px";
    this._channelContextMenu.style.top  = ty + "px";
  }

  // Handle clicks inside our channel menu
  private _onChannelMenuClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    if (!action || this._activeChannelIndexForMenu == null) return;
    this._channelContextMenu.style.display = "none";
    const ch = this._activeChannelIndexForMenu;
    const channel = this._doc.song.channels[ch];
    const tags = this._doc.song.channelTags;
    switch (action) {
      case "rename": {
        const oldName = channel.name;
        const newName = window.prompt("New channel name:", oldName);
        if (newName !== null && newName.trim() !== oldName) {
          this._doc.record(
            new ChangeChannelName(this._doc, ch, oldName, newName.trim())
          );
        }
        break;
      }
      case "chnUp": {
        // 1) Innermost tag starting at ch → shrink (or delete if span==0)
        const startTagsUp = tags.filter((t) => t.startChannel === ch);
        if (startTagsUp.length > 0) {
          const inner = startTagsUp.reduce(
            (best: ChannelTag, t: ChannelTag) => {
              const spanBest = best.endChannel - best.startChannel;
              const spanT = t.endChannel - t.startChannel;
              if (spanT < spanBest) return t;  // smaller = inner
              if (spanT > spanBest) return best;
              // tie: pick newer
              return tags.indexOf(t) > tags.indexOf(best) ? t : best;
            },
            startTagsUp[0]
          );
          if (inner.startChannel === inner.endChannel) {
            this._doc.record(new ChangeRemoveChannelTag(this._doc, inner.id));
          } else {
            this._doc.record(
              new ChangeChannelTagRange(
                this._doc,
                inner.id,
                ch + 1,
                inner.endChannel
              )
            );
          }
        } else {
          // 2) Outermost tag ending at ch-1 → expand (favor larger spans, tie=older)
          const endTagsUp = tags.filter((t) => t.endChannel === ch - 1);
          if (endTagsUp.length > 0) {
            const outer = endTagsUp.reduce(
              (best: ChannelTag, t: ChannelTag) => {
                const spanBest = best.endChannel - best.startChannel;
                const spanT = t.endChannel - t.startChannel;
                if (spanT > spanBest) return t;  // larger = outer
                if (spanT < spanBest) return best;
                // tie: pick older
                return tags.indexOf(t) < tags.indexOf(best) ? t : best;
              },
              endTagsUp[0]
            );
            this._doc.record(
              new ChangeChannelTagRange(
                this._doc,
                outer.id,
                outer.startChannel,
                ch
              )
            );
          }
          // 3) Otherwise swap up
          else if (ch > 0) {
            this._doc.record(new ChangeChannelOrder(this._doc, ch, ch, -1));
            this._doc.song.updateDefaultChannelNames();
          }
        }
        break;
      }
      case "chnDown": {
        // 1) Innermost tag ending at ch → shrink (or delete if span==0)
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
            this._doc.record(new ChangeRemoveChannelTag(this._doc, inner.id));
          } else {
            this._doc.record(
              new ChangeChannelTagRange(
                this._doc,
                inner.id,
                inner.startChannel,
                ch - 1
              )
            );
          }
        } else {
          // 2) Innermost tag starting at ch+1 → expand its start (favor larger spans, tie=older)
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
            this._doc.record(
              new ChangeChannelTagRange(
                this._doc,
                outer.id,
                ch,
                outer.endChannel
              )
            );
          }
          // 3) Otherwise normal swap-down
          else if (ch < this._doc.song.getChannelCount() - 1) {
            this._doc.record(new ChangeChannelOrder(this._doc, ch, ch, 1));
            this._doc.song.updateDefaultChannelNames();
          }
        }
        break;
      }
      case "chnMute":
        channel.muted = !channel.muted;
        this._doc.notifier.changed();
        break;
      case "chnSolo": {
        let shouldSolo: boolean = false;
        for (
          let chi: number = 0;
          chi < this._doc.song.getChannelCount();
          chi++
        ) {
          if (this._doc.song.channels[chi].type === ChannelType.Mod) continue;
          if (this._doc.song.channels[chi].muted == (chi == ch)) {
            shouldSolo = true;
            break;
          }
        }
        for (
          let chi: number = 0;
          chi < this._doc.song.getChannelCount();
          chi++
        ) {
          if (this._doc.song.channels[chi].type === ChannelType.Mod) continue;
          this._doc.song.channels[chi].muted = shouldSolo ? chi != ch : false;
        }
        this._doc.notifier.changed();
        break;
      }
      case "chnInsert": {
        const idx = ch;
        const type: ChannelType = this._doc.song.getChannelIsMod(idx)
          ? ChannelType.Mod
          : this._doc.song.getChannelIsNoise(idx)
          ? ChannelType.Noise
          : ChannelType.Pitch;
        const cg = new ChangeGroup();
        for (const tag of this._doc.song.channelTags) {
          if (tag.startChannel > idx) {
            cg.append(
              new ChangeChannelTagRange(
                this._doc,
                tag.id,
                tag.startChannel + 1,
                tag.endChannel + 1
              )
            );
          } else if (tag.endChannel >= idx) {
            cg.append(
              new ChangeChannelTagRange(
                this._doc,
                tag.id,
                tag.startChannel,
                tag.endChannel + 1
              )
            );
          }
        }
        cg.append(new ChangeAddChannel(this._doc, type, idx));
        this._doc.record(cg);
        break;
      }
      case "chnDelete":
        this._doc.record(new ChangeRemoveChannel(this._doc, ch));
        break;
    }
    this._editor.refocusStage();
    this._activeChannelIndexForMenu = null;
  };
}
