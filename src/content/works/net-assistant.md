---
title: "NetAssistant"
year: "早期"
order: 4
summary: "面向本地调试的 UDP/TCP 助手，用来发报文、看回包。"
stack:
  - "网络调试"
  - "UDP"
  - "TCP"
repo: "https://github.com/hhuuaanngg/NetAssistant"
cover:
  mark: "na"
  from: "#e8f4d8"
  to: "#cfe8b4"
  accent: "#4d7c0f"
---

## 问题

调试网络程序时，临时写脚本发几个包太慢，通用抓包工具又重，只想要一个能指定协议、地址和载荷的小工具。

## 方案

做了一个 UDP/TCP 网络调试助手，把发送、接收和基本会话放在同一个窗口里。

## 技术要点

- 支持 UDP / TCP 收发
- 面向本地联调，而不是替代 Wireshark
