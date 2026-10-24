# x424 synthetic quickstart pilot

This independent evaluation is not an x424 integration or adoption claim.
Source: https://github.com/x424protocol/x424/blob/52f49d95b0ebf9d5898d9c89239b604656073bb8/README.md#run-the-complete-local-flow

The runner checks out that exact revision into `upstream/`, installs Node
22.22.0 and pnpm 9.12.0, and uses QuickstartGuard at
`d2730965a5d2a85c51deb28ff679531bc0cacf86`.
These are explicitly labelled equivalents of the source install/quickstart steps,
not edits to the upstream README. Provisioning replaces clone/cd/Corepack setup;
therefore this is not a complete test of Corepack or a personal Windows install.

## Linux installation

The frozen lockfile prevents resolution drift. Dependency lifecycle scripts are
disabled; if this breaks installation, retain the failure rather than silently
allowing scripts.

```bash qsg=x424-install-linux
pnpm install --frozen-lockfile --ignore-scripts --reporter=append-only
```

## Linux quickstart

```bash qsg=x424-run-linux
pnpm quickstart
```

## Windows installation (PowerShell 7.4+)

The explicit .cmd avoids selecting pnpm.ps1. No execution-policy changes.

```powershell qsg=x424-install-windows
pnpm.cmd install --frozen-lockfile --ignore-scripts --reporter=append-only
```

## Windows quickstart (PowerShell 7.4+)

```powershell qsg=x424-run-windows
pnpm.cmd quickstart
```

Success requires real exit 0, client status 201 and the upstream completion
banner. HTTP output is produced by the local synthetic server/client, not a
mock printer. A failure in upstream pnpm.cmd spawning must remain a failure;
no upstream scripts, authentication or production code are patched by this pilot.
