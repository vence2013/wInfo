#!/bin/bash
# install the web server base on docker.


# Check hardware type. pc or arm(raspberry pi)
osinfo=$(uname -a|grep -o '[0-9a-zA-Z_]*\sGNU/Linux$')
if [ ${osinfo:0:3} == 'arm' ]; then
    hw_type="rpi"
else
    hw_type='pc'
fi
echo "Hardware Type: "$hw_type


# Check the Software dependency
# 1. softwares: docker-ce, docker-compose(at least v2)
# 2. docker container: mysql:5.5, node:9.11

VerDocker=$(docker -v 2>&1)
VerDockerSub=$(echo $VerDocker | sed 's/[^0-9]*\([0-9\.]*\).*/\1/' | cut -d \. -f 1)
if [[ ${VerDocker:0:6} != "Docker" ]] || [[ ${VerDockerSub} -lt 17 ]]; then
    echo "ERROR: Please install docker 18.x or latest!"
    exit
fi

VerDC=$(docker-compose -v 2>&1)
VerDCx=$(echo $VerDC | sed 's/[^0-9]*\([0-9\.]*\).*/\1/')
VerDCMajor=`echo ${VerDCx}|cut -d \. -f 1`
VerDCMinor=`echo ${VerDCx}|cut -d \. -f 2`
if [[ ${VerDC:0:14} != "docker-compose" ]] || [[ ${VerDCMajor} -lt 1 ]] || [[ ${VerDCMinor} -lt 12 ]]; then
    echo "ERROR: Please install docker-compse 1.12.x or latest!"
    exit
fi


# Check the Parameter

ARGS=`getopt -o "hdu" -n "install.sh" -- "$@"`
eval set -- "${ARGS}"
while true; do
    case "${1}" in
        -h)
            echo "usage: ./install.sh -u -d -v -h"
            echo "默认(不带任何参数)为创建容器后启动网页服务器。"
            echo "-u, 卸载系统，删除容器及相关文件"
            echo "-d, 进行调试安装：进入终端，不启动网页服务器"
            echo "-h, 显示当前帮助信息"
            exit
            ;;
        -d)
            g_mode="debug"
            ;;
        -u)
            g_mode="uninstall"
            ;;
        --)
            break;
            ;;
    esac
    shift
done
echo "Running mode: "$g_mode


# Check the docker image. 
#   Pull if needed!
ImageMysql="mysql:5.5"
ImageNode='node:9.11'
ImageCheckMysql=$(docker images --format "{{.Repository}}:{{.Tag}}"|grep -o "${ImageMysql}")
if [ -z "${ImageCheckMysql}" ]; then 
    docker pull ${ImageMysql}
fi
ImageCheckNode=$(docker images --format "{{.Repository}}:{{.Tag}}"|grep -o "${ImageNode}")
if [ -z "${ImageCheckNode}" ]; then 
    docker pull ${ImageNode}
fi


# Prepare files and directories needed for runtime
# 1. Check if the default environment variables file of docker-compose (docker_compose_env) is exist?

g_envfile="docker_compose_env"
if [ ! -f $g_envfile ]; then
    echo "ERROR: missing default environment variables file of docker-compose($g_envfile)!"
    echo "  you can copy from template folder, then modify as needed."
    exit
fi

# 1.1 Verify that the path is valid
datadir_str=$(cat $g_envfile | grep "ROOTFS_DATA=" | sed 's/\xd//')
datadir=${datadir_str:12}
if [ ! -d "$datadir" ]; then 
    echo "ERROR: $datadir not exist!"
    echo "  ROOTFS_DATA in $g_envfile."
    exit
fi
echo "Data Path: $datadir"

# 2. Prepare files and directories if needed
if [ ! -d "$datadir/upload" ]; then
    mkdir -pv $datadir/upload
fi

# 3. Prepare *.yml for docker-compose
cp -fv template/docker_compose_${hw_type}.yml  docker-compose.yml


# Procedures

if [ "$g_mode" == "uninstall" ]; then
    # Uninstall
    docker-compose -p winfo --env-file $g_envfile down
    rm -fv index.js
    echo "Uninstall Successfull!"
else
    # Install
    sysname_str=$(cat $g_envfile | grep "SYSNAME=" | sed 's/\xd//')
    sysname=${sysname_str:8}

    # 1. re-construct( delete & create) container
    docker-compose -p winfo --env-file $g_envfile down
    docker-compose -p winfo --env-file $g_envfile up -d

    # 2. install npm packages
    # 3. patch for npm packages

    # 4. update index.js
    if [ "$g_mode" == "debug" ]; then
        cp -fv template/index.js index.js
    else
        cp -fv apps.js index.js
    fi

    # 5. restart containers (web & mysql)
    docker restart $sysname"_mysql"
    docker restart $sysname
fi

rm -fv docker-compose.yml
exit