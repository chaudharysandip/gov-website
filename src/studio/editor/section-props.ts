/**
 * The few sections that are handed their content as props.
 *
 * Almost every section in every theme pulls its own content out of
 * `useTenantStore`, which is why the studio can drive nineteen themes without
 * touching them. Theme-1's hero is the exception: `Theme-1/index.tsx` passes it
 * a `hero` object, and it renders nothing without one. So the studio passes the
 * same shape, derived from the editable content rather than from the theme's
 * hard-coded fallback — which is what makes that hero editable at all.
 *
 * `select` has to return *flat primitives*, never a nested object. A Zustand
 * selector's result is compared for identity on every store read, so one that
 * builds a fresh `{ hero: { … } }` each call never compares equal, and
 * `useSyncExternalStore` re-renders forever. `select` is read through
 * `useShallow`, and `build` shapes the result afterwards, in render.
 */

/** A section whose content its theme hands it as props rather than reading. */
interface PropsBinding {
  select: (state: any) => Record<string, unknown>;
  build: (values: Record<string, unknown>) => Record<string, unknown>;
}

const SECTION_PROPS: Record<string, PropsBinding> = {
  "theme-1:hero": {
    select: (state: any) => {
      const slide = state.slider?.[0];
      const profile = state.layout?.profile;
      return {
        description: slide?.title || profile?.description || "",
        subCaption: slide?.summary || profile?.slogan || "",
        image: slide?.image || "/about.jpg",
      };
    },
    build: (values: Record<string, unknown>) => ({ hero: values }),
  },
};

/**
 * Which content slices a prop-driven section is really reading, so the
 * inspector still offers the right fields even though the section's own source
 * never mentions the store.
 */
const PROP_SECTION_SLICES: Record<string, string[]> = {
  "theme-1:hero": ["slider"],
};

/** The props binding for a section, or null when it feeds itself. */
export function propsBindingFor(themeId: string, sectionId: string): PropsBinding | null {
  return SECTION_PROPS[`${themeId}:${sectionId}`] ?? null;
}

/** Extra content slices a prop-driven section edits. */
export function extraSlicesFor(themeId: string, sectionId: string): string[] {
  return PROP_SECTION_SLICES[`${themeId}:${sectionId}`] ?? [];
}
