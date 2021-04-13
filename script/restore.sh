#!/bin/bash
# 1. 删除之前的备份文件，
# 2. 删除当前运行文件（环境配置文件，证书，上传目录）

webdir=/web
datadir=/data

# 参数清单
envfile=$1
hostname=$2
root_password=$3
database=$4

# 恢复运行文件
cd $datadir/backup/
cp -fr certificate $envfile $webdir

# 恢复数据库
db_res=`mysqlshow --host=${hostname} -u root -p${root_password} | grep ${database}`
if [ -z "${db_res}" ]; then
    mysqladmin --host=${hostname} -u root -p${root_password} -s create ${database}
fi
mysql  --host=${hostname} -u root -p${root_password} ${database} < ${database}.sql