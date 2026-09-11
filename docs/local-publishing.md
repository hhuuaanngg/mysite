# 本地写作与发布指南

## 每天怎么用

打开 Docker Desktop，启动项目一次：

```bash
docker compose up -d --build --wait
```

之后打开 <http://127.0.0.1:5781> 即可。新增文章或作品，点「保存草稿」，再点「打开预览」。准备好了，进入「发布与备份」，勾选这次要上线的内容，再点「发布到云端」。

停止本地工具：`docker compose stop`；下次启动：`docker compose start`。代码更新后重新运行第一条命令。关闭电脑不影响云端已经发布的网站。

不想用 Docker 时，先 `npm ci`，再 `npm run dev`，工坊使用 5681、预览使用 5680。SSH 发布还需要本机安装 OpenSSH、rsync 和 tar。不要同时用两套工坊编辑同一份原稿。

## 三个动作的区别

| 动作 | 结果 |
| --- | --- |
| 保存草稿 | 原稿和图片写入本机；保存前留一份副本；不改线上 |
| 仅生成网站 | 用已发布内容加上勾选草稿生成完整网页包，可下载；不上传、不改变已发布基线 |
| 发布到云端 | 生成网页、上传到新目录、逐文件校验，然后切换线上版本 |

本地预览会显示所有已保存草稿。发布清单只控制导出网站，不会隐藏本地预览中的草稿。

未勾选的新稿及其图片不会上传。未勾选的已发布文章修改不会生效，线上保留旧版正文和图片。重命名会产生「删除旧地址」「新增新地址」两项，请一起选。设置新精选作品也会取消旧精选，发布时请把两项一起选。删除在本地保存后立即影响本地预览，选中删除并发布后才影响线上。

首次启用将当时项目已有文章和图片复制为初始版本，后续变动才进入草稿清单。如果首次启用前目录里已经有未写完的文章，应先整理原有内容再首次生成。不要删除 `.studio/initial` 或整个 `.studio` 来“清理缓存”，这会丢失发布基线。

`npm run build` 只生成已发布基线（初次为原有内容）到 `out/`。日常使用工坊的生成按钮选择新稿；不要绕过该流程直接执行 `astro build`，否则会导出源目录中的全部草稿。

## 第一次连接云服务器

需要这些信息：服务器 IP、SSH 用户名、端口、独立发布目录、网站域名。网站地址目前支持域名根路径，不支持 `/blog/` 这种子目录部署。

服务器需要 Linux、OpenSSH、rsync、sha256sum、flock 和 Nginx（或其他静态网页服务）。SSH 用户需要对发布目录有写权限，网站服务用户需要有读取权限。建议创建仅用于这个站点的部署用户及免口令密钥，不使用个人主密钥。

示例准备工作（在服务器上由管理员根据实际系统执行；不要直接覆盖现有网站目录）：

```bash
# Debian / Ubuntu 示例
sudo apt-get install rsync nginx util-linux
sudo install -d -m 755 -o deploy -g deploy /srv/mysite
```

将部署公钥追加到部署用户的 `~/.ssh/authorized_keys`。用正常 SSH 客户端连接一次，通过服务器控制台或管理员提供的指纹核验主机身份。导出该服务器对应的 `known_hosts` 记录。非默认端口的记录必须使用 `[主机]:端口` 格式。工坊始终启用严格指纹校验，不会自动接受陌生服务器。

Nginx 示例（配置域名、HTTPS 证书和访问权限按现有环境处理）：

```nginx
server {
    listen 80;
    server_name your-domain.example;
    root /srv/mysite/current;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location ~ \.html$ {
        add_header Cache-Control "no-cache";
    }
}
```

首次尚未发布时 `current` 不存在，发布成功后才创建。现有网站迁移时，先用新的独立发布目录完成首次上传，再切换 Nginx 根目录。工坊不会覆盖已经存在的普通 `current` 文件夹，也不会强行接管其他发布系统的版本。

在工坊的「发布与备份」底部填写并保存设置，导入专用私钥文件和核验后的 known_hosts，点击「测试连接」。测试验证 SSH、指纹、服务器依赖及目录写权限；它不验证 DNS、TLS 证书或 Nginx 配置。第一次发布后仍需打开真实域名检查访问效果。

发布会在服务器创建：

```text
/srv/mysite/
  releases/版本号/       每个完整静态网站
  current -> releases/版本号
```

生成错误、网络错误和校验错误都会保留旧站。上传完成后在同一目录中原子切换 `current`，避免读者看到一半文件。网站的域名 metadata 和 sitemap 使用发布设置中的网站地址。工坊、原稿、私钥和备份均不上传到网站。

## 回退和任务中断

在发布记录中找到以前成功发布的版本，点击「回退到此版本」。服务器先核验文件完整性再切换。本地草稿不变，清单会重新显示与回退版本之间的差异。

如果上传时断网、电脑重启，或显示失败但怀疑服务器已切换，先点击「核对线上版本 / 恢复中断任务」。它读取服务器的真实版本并校验文件，修复本地发布记录；不会盲目重新上传。若另一个工坊进程仍在处理任务，先关闭该进程。

不要手工改动服务器的 `current` 或发布版本里的文件。若服务器上的版本不属于本机记录，工坊会停止发布，需核对服务器地址、恢复本机原稿历史或使用新的独立发布目录。

## 原稿到底存在哪里

| 位置 | 内容 |
| --- | --- |
| `src/content/articles` | Markdown 文章草稿 |
| `src/content/works` | Markdown 作品草稿 |
| `public/articles`、`public/works` | 图片文件 |
| `.studio/initial` | 首次启用时的原稿与素材基线 |
| `.studio/revisions` | 每次保存、删除之前的原稿与素材副本 |
| `.studio/releases` | 每次发布的原稿快照、网页包和生成记录 |
| `.studio/state.json` | 当前线上版本指针 |
| `.studio/ssh` | 本机专用 SSH 私钥和指纹 |
| `.studio/settings.json` | 本机服务器设置 |

这些目录都在 Docker 容器外，重建或删除容器不会删除原稿。文章是 Markdown，图片是独立文件；当前上传界面支持 JPG、PNG、GIF、WebP，不提供通用 PDF/Office 附件管理。

`.studio` 不进入 Git。源码仓库的提交和推送仍可作为文章与图片的额外版本记录，但不能代替完整发布历史备份。发布前副本和服务器版本目前不自动清理，会逐渐占用磁盘；检查空间后再归档旧版本，保留当前版本及回退需要的版本。

## 备份与恢复

点击「下载原稿与历史备份」，将压缩包保存到另一块硬盘或云盘。包里包括当前 Markdown、图片、网站源码、初始基线、编辑副本和发布历史；不包含 SSH 凭据或服务器设置。压缩包里可能有未公开草稿，应存放在自己的备份位置。

整机恢复：

1. 在新的空文件夹里解压备份，不覆盖现有项目。
2. 打开 Docker Desktop，在这个文件夹启动 `docker compose up -d --build --wait`。
3. 打开工坊检查文章和图片。
4. 按原服务器信息重新保存设置并导入专用密钥、指纹；随后核对线上版本。

单篇误删或改坏：先停止工坊，将 `.studio/revisions/时间版本/` 中对应的 Markdown、封面和该文章的相册目录恢复到原来的位置，再启动工坊预览。恢复前先下载一次当前备份，保留其他新修改。回退线上网页不能代替恢复本地原稿。

## 验证命令

```bash
npm test
npm run lint
npm run build
```

真实 SSH 集成验证使用一个独立测试镜像，内部运行临时 SSH 服务和 Nginx，不接触云端：

```bash
docker compose build
docker build -f scripts/testing/Dockerfile.ssh -t mysite-ssh-test .
docker run --rm mysite-ssh-test
```
