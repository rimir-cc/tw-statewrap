# Statewrap

Channel-based state management for TiddlyWiki. Define named state channels in a container, and let child views read/write them by name — without knowing the underlying state tiddler paths.

## Features

- **Named channels** — views reference logical names like `selected-project`, not `$:/state/...` paths
- **Reactive rules** — declarative wikitext actions fire when a channel changes (e.g., "when project changes, clear task selection")
- **Instance isolation** — each `<$statewrap>` gets its own state namespace via `instid` or TW's qualify mechanism
- **Re-entry guard** — rules cannot cascade (prevents infinite loops)
- **Filter operators** — `[statewrap-get[channel]]` reads value, `[statewrap-ref[channel]]` returns state tiddler path

## Quick start

```html
<$statewrap channels="selected-project selected-task detail-tab"
            default-detail-tab="overview" instid="demo">
  <$statewrap-rule when="selected-project">
    <$action-statewrap-set channel="selected-task" value=""/>
    <$action-statewrap-set channel="detail-tab" value="overview"/>
  </$statewrap-rule>

  <!-- views go here -->
</$statewrap>
```

## API

| Element | Name | Purpose |
|---------|------|---------|
| Container widget | `<$statewrap>` | Defines channels, defaults; establishes context |
| Rule widget | `<$statewrap-rule>` | Declares reactive wikitext actions for a channel change |
| Action widget | `<$action-statewrap-set>` | Write to a channel by name |
| Filter operator | `[statewrap-get[channel]]` | Read a channel's current value |
| Filter operator | `[statewrap-ref[channel]]` | Get a channel's state tiddler path |

## License

MIT
