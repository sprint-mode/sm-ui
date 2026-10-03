export type SmLook = 'sm-core';
export declare const SM_LOOKS: readonly SmLook[];
export declare function isSmLook(v: unknown): v is SmLook;
/** Sets data-sm-look on <html>. Unknown values are ignored, and a look the portal already
 *  set in index.html is never removed. */
export declare function applySmLook(look: unknown): void;
/** The look in force right now, or null. */
export declare function currentSmLook(): SmLook | null;
