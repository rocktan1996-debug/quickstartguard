# 交付验证记录 / Verification

版本：**0.1.0-alpha.1**。日期：2026-10-23。

## 真实执行的结果

| 项目 | 本次结果 |
|---|---|
| TypeScript 编译 | 通过；TypeScript 5.8.3、@types/node 22.19.7 |
| 自动测试 | **118 通过 / 0 失败 / 0 跳过**（Linux 环境） |
| 运行环境 | Linux x86_64、Node.js v22.16.0 |
| 正常示例 | 真正执行 Bash + Node 命令，PASS，退出码 0 |
| 故意失败示例 | 真正执行，检测到缺少预期字符串，FAIL，退出码 1 |
| 项目 README 自测 | 通过；本机 Linux 检查执行，Windows 检查明确 SKIP |
| 本地 npm tarball 安装 | 在独立目录离线安装成功，安装后的 qsg 可运行正常示例 |
| 锁文件干净安装 | 移除 node_modules 后，npm ci --offline --ignore-scripts 成功安装 3 个开发依赖，重新编译及测试通过 |
| vendor SHA-256 校验 | 通过；这只确认文件完整性，不代表安全审计 |

原始输出见 [linux-tests.log](verification/linux-tests.log)，结构化记录见 [results.json](verification/results.json)。

已覆盖：YAML 重复字段/错误类型/深度限制/原型污染回归，Markdown 标记、引用和注释、CRLF、未闭合 fence，路径和符号链接边界，输出上限、超时和普通 Linux 子进程清理，中间命令失败、预期非零退出、环境变量过滤、GitHub 注解转义、JSON 脱敏、init 不覆盖、SIGINT 取消。

## 没有声称完成的验证

**Windows / PowerShell 实机测试：未执行。** 当前环境没有 Windows 或 pwsh。执行器、检查、跨平台测试和 Windows GitHub Actions 配置都在源码中，但不能把这些文件的存在当作 Windows 通过证据。Windows 上的进程树清理、执行策略、路径和原生命令退出处理尤其需要实际验收。

GitHub Actions：配置已生成，但没有访问你的仓库创建远程运行。Node 24 矩阵也未在当前环境执行。

全新联网下载开发依赖、在线 npm audit：没有完成。开发环境无法访问 npm registry；但最终已经移除 node_modules，按 package-lock.json 执行 npm ci --offline --ignore-scripts，从 npm 缓存干净安装 3 个固定依赖，并重新执行编译和全部测试。安装记录见 verification/offline-install.log。交付 CLI 的运行及现有测试不依赖 npm 下载。

维护者真人试用、社区采用、公开 npm/GitHub 发布、完整安全审计：均未完成，不伪造记录。

## 结论

这是**可本地运行并已在 Linux 验证的 Alpha**，不是“所有平台已经验收”的正式生产版。公开 beta 前的门槛见 [RELEASE.md](RELEASE.md)，接手事项见 [CODEX_HANDOFF.md](CODEX_HANDOFF.md)。

## 公开仓库后追加验证：2026-10-23

[GitHub Actions 主分支运行 #39941328349](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39941328349) 已完成，以下四个工作均为 **success**：

- `test (ubuntu-24.04, 22)`
- `test (ubuntu-24.04, 24)`
- `test (windows-2025, 22)`
- `test (windows-2025, 24)`

这是在上传并配置 GitHub Actions 之后取得的新证据；上文“Windows 未执行”仅描述**最初本地交付**的测试条件，并非当前仓库的全部验证状态。当前仍未完成维护者个人 Windows 电脑测试、联网完整安全审计、第三方使用验证或 npm 正式发布。
