# 发布（GitHub Desktop，先放个人账号试看）

仓库：https://github.com/lennonlol123/transverse（发布时由 GitHub Desktop 创建）
网址：https://lennonlol123.github.io/transverse/

1. 打开 GitHub Desktop：File → Add Local Repository… → 选本目录 `transverse-site` → Add Repository。
2. 点 **Publish repository**：Name 填 `transverse`，**取消勾选 Keep this code private**（免费账号的 Pages 需要公开仓库），Organization 选 None，点 Publish。
3. 仓库网页 Settings → Pages → Source 选 **GitHub Actions**。
4. Actions 里的 **Build and publish playable TransVerse** 跑完并显示绿色后打开网址。第一次运行若因为 Pages 还没开启而失败，开启后点 Re-run all jobs。

以后搬到组织 westlake-encode-lab：请组织 Owner 给 lennonlol123 权限，然后在仓库 Settings → General → Transfer ownership 转过去，
网址变成 https://westlake-encode-lab.github.io/transverse/ （GitHub 会把旧仓库地址自动转到新地址，但 github.io 网址不会自动跳转）。

不需要 API key 或任何 secrets。不要把 agii 项目的其他文件、实验记录或私有集放进这个仓库。

## 本机预览

```sh
python3 tools/build_site.py
python3 tools/check_release.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```
浏览器打开 http://127.0.0.1:8000/ ，游戏在 /play/。
