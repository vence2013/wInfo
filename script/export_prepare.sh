#!/bin/bash
# 导出文档前的准备工作
# 1. 删除之前的导出目录以及导出打包文件
# 2. 重建导出目录export

webdir=/web
datadir=/data

rm -frv $datadir/export*
mkdir -pv $datadir/export