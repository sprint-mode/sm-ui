/**
 * ModuleManifest — versioned contract between a growth-stack module and the Portal Manager installer.
 *
 * A module author publishes one of these (module-manifest.json, validated against
 * module-manifest.schema.json) as part of the module package. Portal Manager reads it
 * to drive the install cascade: config form → bindings → permissions sections → meter → pin.
 *
 * Format version: 1.0.0
 * FEAT-3530
 */

/** Top-level manifest. The `id` + `module_version` pair is the unique install key. */
export interface ModuleManifest {
  /** Stable lowercase slug matching the npm package name segment (e.g. "dex-engine"). */
  id: string;

  /** Semver of this manifest format. Current: "1.0.0". A Portal Manager that does not
   *  recognise the major version refuses to install. */
  manifest_version: string;

  /** Semver of the module package this manifest describes. */
  module_version: string;

  /** Semver range of the manifest format the module was written against (e.g. "^1.0.0").
   *  Installer validates that its own manifest_version satisfies this range. */
  engine_version_range: string;

  /** Human-readable display name for the Portal Manager module picker. */
  name: string;

  /** One-line description (no markup). */
  description: string;

  /** JSON Schema (draft-07) for the config the installer collects from the operator.
   *  Portal Manager renders a form from this and validates the result before provisioning. */
  config_schema: Record<string, unknown>;

  /** Sections this module adds to the portal's Permissions tab. */
  sections: ModuleSection[];

  /** Roles this module introduces on top of the portal's base roles. */
  roles: ModuleRole[];

  /** Routes this module registers (documentation only — the module owns its own routing). */
  routes: ModuleRoute[];

  /** Cron triggers the installer must provision in the worker. */
  crons: ModuleCron[];

  /** MCP tools this module exposes. */
  mcp_tools: ModuleMcpTool[];

  /** Cost types this module reports to Platform billing via meter(). */
  metering_keys: ModuleMeteringKey[];

  /** Infrastructure the installer must provision before the module can run. */
  bindings_required: ModuleBindings;

  /** Path relative to the module package root where numbered migration SQL files live.
   *  Installer applies them in lexicographic order before any other provisioning step. */
  migrations_path: string;
}

export interface ModuleSection {
  /** Stable key used in the Permissions table. */
  key: string;
  name: string;
  description?: string;
  /** Default access level per portal role key.
   *  Roles not listed default to "none". */
  default_grants: Record<string, 'read' | 'write' | 'admin' | 'none'>;
}

export interface ModuleRole {
  key: string;
  name: string;
  description?: string;
}

export interface ModuleRoute {
  /** HTTP method, or "*" for all. */
  method: string;
  path: string;
  description?: string;
  auth_required?: boolean;
}

export interface ModuleCron {
  /** Standard cron expression (five fields). Must match the wrangler trigger. */
  cron: string;
  path: string;
  description?: string;
}

export interface ModuleMcpTool {
  name: string;
  description?: string;
}

export interface ModuleMeteringKey {
  /** Namespaced meter id passed as `cost_type` to meter() (e.g. "dex.email_sent"). */
  cost_type: string;
  unit_label: string;
  description?: string;
  /** Default SM vendor cost per unit (seed; editable post-install). */
  sm_cost_per_unit?: number;
  /** Default client price per unit (seed; editable post-install). */
  client_price_per_unit?: number;
}

export interface ModuleBindings {
  /** D1 databases the installer must create (or confirm share of). */
  d1: ModuleD1Binding[];
  /** R2 buckets the installer must create. */
  r2: ModuleR2Binding[];
  /** Secrets the installer must set via `wrangler secret put`. */
  secrets: ModuleSecret[];
  /** Plain vars the installer must set (non-sensitive). */
  vars: ModuleVar[];
}

export interface ModuleD1Binding {
  /** Binding name as it appears in wrangler.toml (e.g. "DB"). */
  binding: string;
  description?: string;
  /** true when this binding can point at the portal's existing shared DB.
   *  Installer asks the operator; false means the module requires its own. */
  can_share?: boolean;
}

export interface ModuleR2Binding {
  binding: string;
  description?: string;
}

export interface ModuleSecret {
  name: string;
  required: boolean;
  description?: string;
  /** Which surface or feature requires this secret (e.g. "surfaces.twilio"). */
  when?: string;
}

export interface ModuleVar {
  name: string;
  required: boolean;
  description?: string;
  example?: string;
}
