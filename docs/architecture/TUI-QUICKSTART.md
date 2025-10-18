# TARS TUI (CLI) Quickstart

Run MCP tools from the terminal using the same core logic as the Obsidian plugin.

Prerequisites:

- Populate a Claude Desktop style `.mcp.json` in your working directory.

Build:

```
pnpm -F @tars/tui build
```

List tools:

```
packages/tui/dist/cli.cjs tools --config .mcp.json
```

Execute a tool:

```
packages/tui/dist/cli.cjs exec --server trello --tool list_boards --params '{"limit": 5}'
```

Notes:

- The CLI uses `@tars/mcp-hosting` for server management and `ToolExecutor` for robust execution with timeouts and session tracking.
- Results are printed as JSON when structured, otherwise as plain text.

