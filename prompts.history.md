
---

Wrong assumptions:

```ts
  async onload() {
    await this.loadSettings()

    // ...other code...
  }
```

Propore DI integration will be:

```ts
  async onload() {
    this.container.bind({ provider: Plugin, useValue: this });

    this.settings = this.conatiner.get(SettingsService)
    // ...other code...
  }
```

Main differences:
- no logic except the initilization inside the TarsPlugin class
- initialization starte from injecting reference on plugin instance
- all other Obsidian related logic, like: addCommand, addStatusBarItem, registerEditorSuggest should be implemented via proper DI services requesting.

