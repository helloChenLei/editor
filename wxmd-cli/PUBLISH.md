# NPM 发布指南

本文档说明如何将 `@foolgry/wxmd-cli` 包发布到 NPM 仓库。

## 前置准备

1. **NPM 账号**
   - 访问 https://www.npmjs.com/ 注册账号
   - 用户名应为 `foolgry`（与包名前缀一致）
   - 或使用其他用户名，但需要配置 `publishConfig`

2. **登录 NPM**
   ```bash
   npm login
   # 输入用户名、密码、邮箱
   ```

3. **验证登录**
   ```bash
   npm whoami
   # 应输出你的用户名
   ```

## 发布步骤

### 1. 进入 CLI 目录

```bash
cd wxmd-cli
```

### 2. 安装依赖并测试

```bash
pnpm install
pnpm test
```

确保所有测试通过。

### 3. 更新版本号（如需要）

```bash
# 更新 patch 版本（1.0.0 -> 1.0.1）
npm version patch

# 或更新 minor 版本（1.0.0 -> 1.1.0）
npm version minor

# 或更新 major 版本（1.0.0 -> 2.0.0）
npm version major
```

### 4. 发布到 NPM

```bash
# 发布到公共仓库
npm publish --access public

# 或使用 publishConfig 中已配置的自动 public
npm publish
```

**注意**：scoped 包（`@foolgry/wxmd-cli`）默认是私有的，需要使用 `--access public` 或已在 `package.json` 中配置 `publishConfig.access: "public"`。

### 5. 验证发布

```bash
# 查看包信息
npm view @foolgry/wxmd-cli

# 安装测试
npm install -g @foolgry/wxmd-cli
wxmd-cli --version
```

## 常见问题

### 1. 403 Forbidden

**原因**: 包名已被占用或没有权限

**解决**:
- 如果用户名不是 `foolgry`，需要修改 `package.json` 中的 `name` 字段
- 或使用组织名，如 `@yourname/wxmd-cli`

### 2. 版本已存在

**原因**: 该版本已经发布过

**解决**:
```bash
npm version patch  # 或 minor/major
npm publish
```

### 3. 无法发布 scoped 包

**原因**: Scoped 包默认私有，需要付费或显式设置为 public

**解决**:
确保 `package.json` 中有：
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. 双因素认证 (2FA)

如果启用了 2FA，发布时需要提供 OTP：

```bash
npm publish --otp 123456
```

或使用 Web 授权：
```bash
npm publish
# 按提示在浏览器中完成授权
```

## 更新已发布的包

### 更新 patch 版本（修复 bug）

```bash
cd wxmd-cli
# 修复代码...
pnpm test
npm version patch
npm publish
```

### 更新 minor 版本（新功能）

```bash
cd wxmd-cli
# 开发新功能...
pnpm test
npm version minor
npm publish
```

## 废弃版本

如果需要废弃某个版本：

```bash
npm deprecate @foolgry/wxmd-cli@1.0.0 "This version has critical bugs, please upgrade to 1.0.1"
```

## 撤销发布（24小时内）

如果发布错误，24 小时内可以撤销：

```bash
npm unpublish @foolgry/wxmd-cli@1.0.0
```

**注意**: 撤销后该版本号不能再使用。

## 配置镜像源

如果使用国内镜像，发布时需要切换到官方源：

```bash
# 查看当前 registry
npm config get registry

# 临时切换到官方 registry 发布
npm publish --registry https://registry.npmjs.org/

# 或永久设置
npm config set registry https://registry.npmjs.org/
```

## 发布后检查清单

- [ ] NPM 页面显示正常：https://www.npmjs.com/package/@foolgry/wxmd-cli
- [ ] 版本号正确
- [ ] README 显示正常
- [ ] 全局安装测试通过
- [ ] 命令执行正常

## 自动化发布（GitHub Actions）

可以配置 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd wxmd-cli && npm ci
      - run: cd wxmd-cli && npm test
      - run: cd wxmd-cli && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

需要在 GitHub 仓库设置中添加 `NPM_TOKEN` secret。

---

**相关文档**:
- [NPM 官方文档](https://docs.npmjs.com/)
- [Scoped Packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [Semantic Versioning](https://semver.org/)
