# Evidence record

```yaml
claim: ""
scope: ""
environment: local|preview|production
timestamp: ""
commands:
  - command: ""
    result: pass|fail
    observed: ""
interactions: []
artifacts: []
status: pass|pass-with-explicit-limitations|unsupported|blocked
limitation: null
next_step: null
```

Evidence is sufficient only when it directly proves the claim, is fresh enough for the environment, and does not rely on secret disclosure. Use the narrowest artifact that can be independently checked.

