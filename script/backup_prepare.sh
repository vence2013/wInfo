#!/bin/bash
# 1. 删除现有的备份文件
# 2. 准备临时备份目录
# 3. 复制备份文件

webdir=/web
datadir=/data
envfile=$1

# clear previous backup
rm -fr ${datadir}/backup*

# collection file data
mkdir -pv ${datadir}/backup
cp -f  ${webdir}/$envfile ${datadir}/backup/
cp -fr ${webdir}/certificate ${datadir}/backup/