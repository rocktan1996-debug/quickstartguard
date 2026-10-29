# Codex 接手说明

这是可以运行的 0.1.0-alpha.2，不要重写成空架子。先读 `AGENTS.md`。

## 接手时先验证

```text
node dist/cli.js --help
node scripts/verify-vendor.mjs
node scripts/test.mjs
node dist/cli.js validate
node dist/cli.js run --execute
```

Windows 需要 Node 22+、PowerShell 7.4+。开发改动前联网运行 `npm ci --ignore-scripts`，改完用 `npm run check`；不要只跑旧 dist 的测试就声称新源码通过。

## 优先任务（按顺序）

1. **Windows 真机验收**：跑全套测试、正常/故意失败 fixture、PowerShell 中间原生命令失败、中文带空格路径、超时进程树清理。将系统、Node、pwsh 版本和真实输出记录到 VERIFICATION；不要替换 Linux 记录或伪造全绿。
2. **依赖可重现构建**：将离线 vendored Marked/js-yaml 换成经过审阅的上游固定版本和 bundling 脚本，补 lockfile、许可证、SBOM，联网 audit。保留 source-map、重复 ID、HTML 注释、未闭合 fence、原型污染回归。不要把当前 backport 冒充官方 4.1.1。
3. **全新安装和 CI**：在联网的干净 runner 执行 npm ci；完成 Ubuntu/Windows × Node 22/24 矩阵，保存实际链接。Windows 未通过前，版本仍是 alpha。
4. **执行稳定性**：为 Windows 后台子进程、超时竞态、用户中断、丢失 Shell 增加真实回归；明确哪些场景无法保证终止。
5. **对外试点准备**：填写仓库 URL、maintainer、security contact，核查 npm 名称，审查 MIT/第三方许可和打包清单。未经用户明确许可不要推送或发布。
6. **真人试用**：征求一位外部维护者同意，接入一个真正需要的 README 检查；记录问题、PR、反馈。不得制造用户、Star 或维护历史。

## 暂时不做

不加网页账户、SaaS、AI 自动修复、自动群发 PR、收费、跨平台模拟执行或“确保获奖”功能。不让 GitHub token/全部父环境传给 README 脚本。

## 可直接交给 Codex 的任务

“请基于这个现有 QuickstartGuard 仓库继续开发，不要重写。先读 AGENTS.md 和 docs/VERIFICATION.md，运行现有测试。在 Windows + pwsh 7.4+ 上完成第一项验收，修复真实失败并补回归测试。每次修改 src 后重新构建 dist，报告真实命令、退出码和验证范围。不要擅自创建仓库、公开发布 npm 或申请奖励。”
