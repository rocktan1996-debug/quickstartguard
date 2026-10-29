# QuickstartGuard 第一个可运行版本

**版本：0.1.0-alpha.1。已经包含源码、编译后的 CLI、测试、演示项目和 GitHub Actions 配置，不再只是方案。**

## Windows 上先做这几步

先解压 ZIP。进入包含 `package.json`、`src`、`dist` 的目录，在终端执行：

```powershell
node --version
pwsh --version
node .\dist\cli.js --help
node .\dist\cli.js validate --config .\fixtures\demo-valid\qsg.yml
node .\dist\cli.js run --config .\fixtures\demo-valid\qsg.yml --execute
```

要求 Node.js 22+。真正执行 Windows 示例需要 **PowerShell 7.4+**，命令是 `pwsh`，不是系统旧版 `powershell.exe`。当前终端即使是旧版 PowerShell，也可以先运行 `node ... validate`；但电脑需要装好并能从 PATH 找到 `pwsh` 才能执行检查。不修改系统执行策略，不需要管理员权限运行本工具。

下载包自带运行代码和解析库，**只运行上述命令不需要 `npm install`、OpenAI API Key、ChatGPT 会员或服务器**。被检查的安装命令本身是否需要联网，取决于你写了什么；示例不联网。

正常示例应显示 `PASS`。接着试试故意失败的示例：

```powershell
node .\dist\cli.js run --config .\fixtures\demo-broken\qsg.yml --execute
$LASTEXITCODE
```

这里 `FAIL`、退出码 `1` 是预期结果：示例程序没有输出文档期望的 `Usage: hello`，工具应当拦住它，而不是假装测试通过。

### 和固定命令测试相比，多检查了什么？

运行 [README-only 对照实验](examples/readme-drift/README.md)：

```text
node examples/readme-drift/run.mjs --execute
```

这是**明确标注的人为合成实验**，不是上游真实缺陷。先确认固定命令测试与 QSG 都通过；然后只在临时副本的实际 `README.md` 中把脚本名改错：固定命令测试仍通过，直接读取 README 的 QSG 失败并指出命令行号；恢复 README 后两者再次通过。原始示例不变，临时副本自动删除，不安装依赖、不联网。它只证明文档绑定的增量行为，不代表某个上游完整 CI、社区采用或优于已经读取 README 的测试。

运行自动测试：

```powershell
node .\scripts\test.mjs
```

**实际验证边界：本次交付在 Linux + Node 22.16.0 上测试；没有 Windows 机器或 pwsh，因此不宣称 Windows 真实执行已经通过。** Windows 执行器和自动测试已编写，CI 配置也已提供，但必须由你的 Windows 本机或首次 GitHub Actions 运行取得证据。详细结果见 `docs/VERIFICATION.md`。

## 检查自己的开源项目

先保留 QuickstartGuard 文件夹。在目标项目目录运行（把路径改为解压后的实际路径）：

```powershell
node C:\Tools\QuickstartGuard\dist\cli.js init
node C:\Tools\QuickstartGuard\dist\cli.js validate
node C:\Tools\QuickstartGuard\dist\cli.js run --execute
```

`init` 会生成 `qsg.yml` 和 `quickstart.qsg.md`，不会覆盖已有文件。初始例子是简单打印。随后将真正的安装/运行命令放到项目 README，添加 `qsg=唯一编号` 标记，并在 `qsg.yml` 里引用。具体例子见英文 README 和 `docs/CONFIGURATION.md`。

`validate` 只校验，不执行任何 README 命令。`run` 必须加 `--execute`。

## 保存结果

```powershell
node .\dist\cli.js run --config .\fixtures\demo-valid\qsg.yml --execute --json-out .qsg/results.json --summary-out .qsg/summary.md
```

本例报告在 `fixtures/demo-valid/.qsg/`，因为报告路径相对**配置文件所在目录**。默认 JSON 不含原始 stdout/stderr。确实需要日志时再加 `--include-output`，分享前检查敏感信息。

## 修改源码 / 交给 Codex 接手

源码在 `src/`。`dist/` 是已经编译好的版本。要改源码，需要联网安装开发依赖：

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run check
```

Windows 下使用 `npm.cmd` 可避免终端误选 `npm.ps1`。不用设置全局宽松执行策略。

把整个项目文件夹交给 Codex，入口说明是 `AGENTS.md` 和 `docs/CODEX_HANDOFF.md`。不要只给 `dist/`。

## 这版没有替你做的事

没有创建/上传 GitHub 仓库，没有公开发布 npm 包，没有跑远程 Windows CI，没有申请任何奖励。`private: true` 防止误发到 npm；本地安装和打包不受影响。

## 安全提醒

这不是沙箱，README 代码和普通终端命令拥有相同权限。不要在装有重要凭据的电脑上执行不信任仓库。虽然默认过滤环境变量，程序仍可以读本机文件、改文件、联网。脱敏、进程树清理和资源限制不是完美隔离。

当前解析库为可离线运行的固定版本，并包含一个公开安全修复回移；详见 `vendor/README.md`。公开 beta 前还需要换成可重现的上游依赖构建、联网依赖审计、Windows 验收和真人试用。
