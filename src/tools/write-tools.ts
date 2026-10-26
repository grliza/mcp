// Which tools mutate or destroy A1 objects/cells. Used by the readonly/
// readwrite gate: in A1_MODE=readonly these tools are NOT registered, so they
// never appear in tools/list and cannot be invoked.

export const WRITE_TOOLS: ReadonlySet<string> = new Set([
  // cubes
  "a1_set_cube_rule",
  "a1_create_cube",
  "a1_delete_cube",
  "a1_create_picklist_cube",
  "a1_create_view",
  "a1_delete_view",
  // dimensions
  "a1_create_dimension",
  "a1_delete_dimension",
  "a1_create_element",
  "a1_delete_element",
  "a1_set_edges",
  "a1_create_subset",
  "a1_delete_subset",
  // processes
  "a1_execute_process",
  "a1_create_process",
  "a1_delete_process",
  // chores
  "a1_activate_chore",
  "a1_deactivate_chore",
  "a1_delete_chore",
  // security
  "a1_cancel_task",
  "a1_create_client",
  "a1_delete_client",
  "a1_set_client_password",
  "a1_create_group",
  "a1_delete_group",
  // mdx / cells
  "a1_set_cells",
  "a1_save_data",
]);
