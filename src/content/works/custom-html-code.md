---
title: "Custom HTML Code"
year: "2013"
order: 6
summary: "把统计代码从主题文件里拆出来的 WordPress 插件。"
stack:
  - "WordPress"
  - "PHP"
repo: "https://github.com/hhuuaanngg/iplay-AnalyticsCodes"
url: "http://iplay.codes/wp-plugin-ac/"
cover:
  mark: "ac"
  from: "#fde8d8"
  to: "#f5c9a8"
  accent: "#c2410c"
---

## 问题

统计代码写在主题里，一换主题就丢。流量不看也罢，过半年想翻一下却发现数据断了。

## 方案

做了个很小的插件，专门存自定义 HTML / 统计代码，和主题脱钩。

## 技术要点

- 统计代码与主题分离
- 换主题不再丢追踪代码
