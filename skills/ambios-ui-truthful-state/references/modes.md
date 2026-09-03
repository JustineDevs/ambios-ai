# UI audit modes

| Mode | Surface | Browser proof |
| --- | --- | --- |
| `focused` | One route/component and callers | Both viewport classes plus affected states |
| `standard` | All named routes and shared shell | Direct load, refresh, navigation, overlay, keyboard, error recovery |
| `exhaustive` | Full route tree and shared primitives | Auth/state/viewport matrix plus console/network sweep |

If a state cannot be reached with real data, label it unverified or unsupported and record the missing prerequisite. Do not substitute mock success.
