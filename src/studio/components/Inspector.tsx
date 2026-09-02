"use client";

/**
 * The inspector.
 *
 * Four tabs rather than one long list, because the questions are different:
 * *what does this say*, *how does it look*, *how does it look on a phone*, and
 * *what is true of the whole site*. Mixing them is what makes most theme
 * customisers hard to scan.
 *
 * The tabs are underlines rather than a filled segmented control. A pill row
 * reads as four buttons of equal weight competing with the panel below it; an
 * underline reads as a place you are, which is what a tab is.
 */

import { EyeOff, Eye, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@edn/site-themes/components/ui/tabs";
import { ScrollArea } from "@edn/site-themes/components/ui/scroll-area";
import { Button } from "@edn/site-themes/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectSectionState } from "@/studio/store/selectors";
import { OverrideMarks, Placard } from "@/studio/components/bay";
import { ContentPanel } from "@/studio/components/panels/ContentPanel";
import { DesignPanel } from "@/studio/components/panels/DesignPanel";
import { ResponsivePanel } from "@/studio/components/panels/ResponsivePanel";
import { SitePanel } from "@/studio/components/panels/SitePanel";

const TABS = [
  { value: "content", label: "Content" },
  { value: "design", label: "Design" },
  { value: "responsive", label: "Screens" },
  { value: "site", label: "Site" },
];

export function Inspector() {
  const isOpen = useEditorStore((state) => state.inspectorPanelOpen);
  const toggleOpen = useEditorStore((state) => state.toggleInspectorPanel);
  const tab = useEditorStore((state) => state.inspectorTab);
  const setTab = useEditorStore((state) => state.setInspectorTab);
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId);
  const editorConfig = useEditorStore((state) => state.editorConfig);
  const toggleSection = useEditorStore((state) => state.toggleSection);
  const state = useEditorStore((store) => selectSectionState(store, selectedSectionId));
  const visible = state?.visible !== false;

  // The header and the footer are editable but are not in the page's section
  // list, so the lookup has to try both.
  const section =
    editorConfig?.sections.find((entry) => entry.id === selectedSectionId) ??
    editorConfig?.chrome?.find((entry) => entry.id === selectedSectionId) ??
    null;

  // As with the node column: collapsed leaves a rail, never a blank edge.
  if (!isOpen) {
    return (
      <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-studio-line bg-studio-panel py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-[3px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
              onClick={toggleOpen}
              aria-label="Show the inspector"
            >
              <PanelRightOpen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Inspector</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <aside
      className="flex h-full w-76 shrink-0 flex-col border-l border-studio-line bg-studio-panel"
      aria-label="Inspector"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-studio-line py-2 pr-1 pl-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight font-medium text-studio-ink">
            {section?.label ?? "Site"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Placard className="truncate">
              {section ? section.component : editorConfig?.name}
            </Placard>
            {/* Only for a section. With nothing selected the header names the
                site, and a per-section breakpoint readout over "No section
                selected" reports on something that is not there. */}
            {section ? <OverrideMarks styles={state?.styles} /> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          {section ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-[3px] hover:bg-studio-surface"
              onClick={() => toggleSection(section.id)}
              aria-label={visible ? `Hide ${section.label}` : `Show ${section.label}`}
              title={visible ? "On the page" : "Hidden"}
            >
              {visible ? (
                <Eye className="size-4 text-studio-dim" />
              ) : (
                <EyeOff className="size-4 text-studio-caution" />
              )}
            </Button>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-[3px] text-studio-faint hover:bg-studio-surface hover:text-studio-ink"
                onClick={toggleOpen}
                aria-label="Hide the inspector"
              >
                <PanelRightClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Collapse</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="h-8 w-full shrink-0 justify-start gap-0 rounded-none border-b border-studio-line bg-transparent p-0">
          {TABS.map((entry) => (
            <TabsTrigger
              key={entry.value}
              value={entry.value}
              className={cn(
                "relative h-8 flex-1 rounded-none border-0 px-1 text-[12px] font-medium text-studio-faint shadow-none",
                "transition-colors duration-150 hover:text-studio-dim",
                "data-[state=active]:bg-transparent data-[state=active]:text-studio-ink data-[state=active]:shadow-none",
                // The lit rule under the live tab, drawn over the panel's own
                // border so the two read as one line rather than two.
                "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-studio-live",
                "after:scale-x-0 after:transition-transform after:duration-150 data-[state=active]:after:scale-x-100",
              )}
            >
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-3 py-3.5">
            <TabsContent value="content" className="mt-0">
              <ContentPanel section={section} />
            </TabsContent>
            <TabsContent value="design" className="mt-0">
              <DesignPanel section={section} />
            </TabsContent>
            <TabsContent value="responsive" className="mt-0">
              <ResponsivePanel section={section} />
            </TabsContent>
            <TabsContent value="site" className="mt-0">
              <SitePanel />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
