export type SmLook = 'sm-core';
export declare const SM_LOOKS: readonly SmLook[];
export declare function isSmLook(v: unknown): v is SmLook;
/** Sets data-sm-look on <html>. Unknown values are ignored, and a look the portal already
 *  set in index.html is never removed. */
export declare function applySmLook(look: unknown): void;
/** The sm-core faces (Space Grotesk, IBM Plex Mono). Only portals with the look on load them. */
export declare const SM_CORE_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
/** Adds the look's font stylesheet to <head> once. Unknown looks are ignored. */
export declare function loadSmLookFonts(look: unknown): void;
/** The look in force right now, or null. */
export declare function currentSmLook(): SmLook | null;
