/**
 * What is editable in each slice of website content.
 *
 * The nineteen themes all read the same tenant payload, so the editable fields
 * are described once per slice rather than once per theme per section. A
 * section's manifest records which slices it reads (taken from its own
 * `useTenantStore` selectors), and the inspector composes the panel from these
 * definitions.
 *
 * `kind` maps onto a control in `src/studio/editor/fields`:
 *   text | textarea | richtext | image | link | number | color
 */

import type { ContentField, ContentSlice, SectionDefinition } from "@/studio/types";
import { ALBUM_THUMBNAIL, BOARD, GALLERYIMAGES, PROFILE } from "@edn/site-themes/lib/file-path";

const post = (label: string, extra: ContentField[] = []): ContentSlice => ({
  label,
  type: "list",
  itemLabel: (item) => item?.title || item?.name || "Untitled",
  fields: [
    { name: "title", label: "Title", kind: "text" },
    { name: "summary", label: "Summary", kind: "textarea" },
    { name: "image", label: "Image", kind: "image" },
    { name: "date", label: "Date", kind: "text", placeholder: "YYYY-MM-DD" },
    ...extra,
  ],
});

export const CONTENT_MODEL: Record<string, ContentSlice> = {
  slider: {
    label: "Slides",
    type: "list",
    itemLabel: (item) => item?.title || "Slide",
    addLabel: "Add slide",
    template: { title: "New slide", summary: "", image: "/about.jpg", link: "/", buttonText: "Learn more" },
    fields: [
      { name: "title", label: "Heading", kind: "text" },
      { name: "summary", label: "Description", kind: "textarea" },
      { name: "image", label: "Background image", kind: "image" },
      { name: "buttonText", label: "Button text", kind: "text" },
      { name: "link", label: "Button link", kind: "link" },
    ],
  },

  aboutUs: {
    label: "About",
    type: "object",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "summary", label: "Description", kind: "textarea", rows: 6 },
      { name: "image", label: "Image", kind: "image" },
      { name: "buttonText", label: "Button text", kind: "text" },
      { name: "buttonLink", label: "Button link", kind: "link" },
    ],
  },

  statistics: {
    label: "Statistics",
    type: "list",
    itemLabel: (item) => item?.name || "Statistic",
    addLabel: "Add statistic",
    template: { name: "New metric", figure: "0" },
    fields: [
      { name: "name", label: "Label", kind: "text" },
      { name: "figure", label: "Figure", kind: "text" },
    ],
  },

  program: {
    ...post("Programs"),
    addLabel: "Add program",
    template: { title: "New program", summary: "", image: "/about.jpg", slug: "new-program" },
  },

  service: {
    label: "Services",
    type: "list",
    itemLabel: (item) => item?.title || "Service",
    addLabel: "Add service",
    template: { title: "New service", summary: "", icon: "star", href: "/" },
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "summary", label: "Description", kind: "textarea" },
      { name: "icon", label: "Icon name", kind: "text", placeholder: "lucide icon, e.g. book-open" },
      { name: "href", label: "Link", kind: "link" },
    ],
  },

  facility: {
    label: "Facilities",
    type: "list",
    itemLabel: (item) => item?.title || "Facility",
    addLabel: "Add facility",
    template: { title: "New facility", summary: "", image: "/about.jpg" },
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "summary", label: "Description", kind: "textarea" },
      { name: "image", label: "Image", kind: "image" },
    ],
  },

  testimonial: {
    label: "Testimonials",
    type: "list",
    itemLabel: (item) => item?.title || "Testimonial",
    addLabel: "Add testimonial",
    template: { title: "New name", summary: "Role", description: "", image: "/preview.png" },
    fields: [
      { name: "title", label: "Name", kind: "text" },
      { name: "summary", label: "Role", kind: "text" },
      { name: "description", label: "Quote", kind: "textarea", rows: 4 },
      { name: "image", label: "Photo", kind: "image" },
    ],
  },

  team: {
    label: "Team",
    type: "list",
    itemLabel: (item) => item?.title || "Member",
    addLabel: "Add member",
    template: { title: "New member", subtitle: "Role", designation: "Role", category: "Faculty", image: "/preview.png" },
    fields: [
      { name: "title", label: "Name", kind: "text" },
      { name: "designation", label: "Designation", kind: "text" },
      { name: "category", label: "Department", kind: "text" },
      { name: "image", label: "Photo", kind: "image", module: PROFILE },
    ],
  },

  board: {
    label: "Board groups",
    type: "list",
    itemLabel: (item) => item?.name || "Group",
    addLabel: "Add group",
    template: { name: "New group", members: [] },
    fields: [
      { name: "name", label: "Group name", kind: "text" },
      {
        name: "members",
        label: "Members",
        kind: "list",
        itemLabel: (item) => item?.name || "Member",
        template: { name: "New member", designation: "Member", image: "/preview.png", message: "" },
        fields: [
          { name: "name", label: "Name", kind: "text" },
          { name: "designation", label: "Designation", kind: "text" },
          { name: "image", label: "Photo", kind: "image", module: BOARD },
          { name: "message", label: "Message", kind: "textarea" },
        ],
      },
    ],
  },

  boardMessage: {
    ...post("Leadership messages"),
    addLabel: "Add message",
    template: { title: "New message", summary: "", image: "/preview.png" },
  },

  album: {
    label: "Albums",
    type: "list",
    itemLabel: (item) => item?.name || "Album",
    addLabel: "Add album",
    template: { name: "New album", thumbnail: "/about.jpg", galleries: [] },
    fields: [
      { name: "name", label: "Album name", kind: "text" },
      { name: "thumbnail", label: "Cover image", kind: "image", module: ALBUM_THUMBNAIL },
      {
        name: "galleries",
        label: "Images",
        kind: "list",
        itemLabel: () => "Image",
        template: { image: "/about.jpg" },
        fields: [{ name: "image", label: "Image", kind: "image", module: GALLERYIMAGES }],
      },
    ],
  },

  client: {
    label: "Partners",
    type: "list",
    itemLabel: (item) => item?.title || "Partner",
    addLabel: "Add partner",
    template: { title: "New partner", image: "/logo.png" },
    fields: [
      { name: "title", label: "Name", kind: "text" },
      { name: "image", label: "Logo", kind: "image" },
    ],
  },

  news: { ...post("News"), addLabel: "Add article", template: { title: "New article", summary: "", image: "/about.jpg" } },
  event: { ...post("Events"), addLabel: "Add event", template: { title: "New event", summary: "", image: "/about.jpg" } },
  notice: { ...post("Notices"), addLabel: "Add notice", template: { title: "New notice", summary: "", image: "/pattern.png" } },
  blog: { ...post("Blog posts"), addLabel: "Add post", template: { title: "New post", summary: "", image: "/about.jpg" } },
  downloads: { ...post("Downloads"), addLabel: "Add file", template: { title: "New file", summary: "" } },
  portfolio: { ...post("Portfolio"), addLabel: "Add item", template: { title: "New item", summary: "", image: "/about.jpg" } },

  faq: {
    label: "Questions",
    type: "list",
    itemLabel: (item) => item?.title || "Question",
    addLabel: "Add question",
    template: { title: "New question", summary: "" },
    fields: [
      { name: "title", label: "Question", kind: "text" },
      { name: "summary", label: "Answer", kind: "textarea", rows: 4 },
    ],
  },

  home: {
    label: "Homepage intro",
    type: "object",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "summary", label: "Summary", kind: "textarea" },
      { name: "image", label: "Image", kind: "image" },
    ],
  },

  /**
   * `layout` is site-wide: identity, navigation and contact details. Sections
   * that read it (headers, footers, admission bands) show a shortcut to the
   * Site panel rather than repeating these fields section by section.
   */
  layout: {
    label: "Site details",
    type: "nested",
    siteWide: true,
    groups: [
      {
        path: "profile",
        label: "Identity",
        fields: [
          { name: "name", label: "Institution name", kind: "text" },
          { name: "slogan", label: "Tagline", kind: "text" },
          { name: "description", label: "Description", kind: "textarea", rows: 4 },
          { name: "logo", label: "Logo", kind: "image", module: PROFILE },
          { name: "whiteLogo", label: "Logo (dark backgrounds)", kind: "image", module: PROFILE },
          { name: "banner", label: "Page banner", kind: "image", module: PROFILE },
          { name: "estdYear", label: "Established", kind: "text" },
        ],
      },
      {
        path: "profile",
        label: "Contact",
        fields: [
          { name: "address", label: "Address", kind: "text" },
          { name: "email", label: "Email", kind: "text" },
          { name: "phone", label: "Phone", kind: "text" },
          { name: "mobileNumber", label: "Mobile", kind: "text" },
          { name: "officeTime", label: "Office hours", kind: "text" },
          { name: "mapUrl", label: "Map URL", kind: "link" },
          { name: "onlineApplicationUrl", label: "Apply online URL", kind: "link" },
        ],
      },
    ],
    lists: [
      {
        path: "menu",
        label: "Navigation",
        itemLabel: (item) => item?.title || "Menu item",
        template: { title: "New item", slug: "/", children: [] },
        fields: [
          { name: "title", label: "Label", kind: "text" },
          { name: "slug", label: "Link", kind: "link" },
          {
            name: "children",
            label: "Submenu",
            kind: "list",
            itemLabel: (item) => item?.title || "Item",
            template: { title: "New item", slug: "/" },
            fields: [
              { name: "title", label: "Label", kind: "text" },
              { name: "slug", label: "Link", kind: "link" },
            ],
          },
        ],
      },
      {
        path: "socialMedias",
        label: "Social links",
        itemLabel: (item) => item?.name || "Link",
        template: { name: "Facebook", link: "https://" },
        fields: [
          { name: "name", label: "Network", kind: "text" },
          { name: "link", label: "URL", kind: "link" },
        ],
      },
    ],
  },

  copyright: {
    label: "Copyright",
    type: "list",
    itemLabel: (item) => item?.title || "Copyright",
    fields: [
      { name: "title", label: "Line", kind: "text" },
      { name: "description", label: "Detail", kind: "textarea" },
    ],
  },
};

/** Slices that only ever make sense in the site-wide panel. */
export const SITE_WIDE_SLICES = new Set(["layout", "copyright"]);

/**
 * The editable slices for a section, minus the site-wide ones, in the order the
 * section's manifest lists them.
 */
export function editableSlices(section: SectionDefinition | null | undefined): string[] {
  return (section?.slices ?? []).filter(
    (slice) => CONTENT_MODEL[slice] && !SITE_WIDE_SLICES.has(slice),
  );
}

/** True when a section reads site-wide content and nothing of its own. */
export function readsOnlySiteWide(section: SectionDefinition | null | undefined): boolean {
  const slices = section?.slices ?? [];
  return slices.length > 0 && editableSlices(section).length === 0;
}
