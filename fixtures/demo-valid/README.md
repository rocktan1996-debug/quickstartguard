# Example command-line project

This fixture needs no network or installed npm packages.

## Linux quickstart

```bash qsg=quickstart-linux
node ./scripts/hello.mjs --help
```

## Windows quickstart

```powershell qsg=quickstart-windows
node ./scripts/hello.mjs --help
```

This unmarked example must never be executed:

```bash
node -e "require('fs').writeFileSync('UNMARKED_EXECUTED', 'bad')"
```
