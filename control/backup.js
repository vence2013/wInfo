const fs = require("fs");
const path  = require('path');
const shelljs = require('shelljs');
const child_process = require('child_process');

var Backup_state = {
    'title':'', 
    'step' : 0, 
    'timestamp_start'  : 0, 
    'timestamp_current': 0, 
    'messages': []
};

/* 启动备份 */
exports.backup = async (filename) =>
{
    const cfg = require('dotenv').config({ path: envfile }).parsed;
    let ts, tdiff;

    Backup_state['title'] = 'Backup';
    /* 0. 删除现有备份文件（backup*），并准备临时备份目录 */
    Backup_state['step']            = 0;
    Backup_state['messages'][0]     = '1. 删除所有备份文件，并准备临时备份目录。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execFileSync('script/backup_prepare.sh', [envfile]);

    /* 1. 备份数据库 */
    Backup_state['step']            = 1;
    Backup_state['messages'][1]     = '2. 备份数据库。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execSync('mysqldump --host='+cfg.MYSQL_HOST+' -u root -p'+cfg.MYSQL_ROOT_PASSWORD+' '+
        cfg.SYSNAME+' > /data/backup/'+cfg.SYSNAME+'.sql');    

    /* 2. 打包所有备份文件 */
    Backup_state['step']            = 2;
    Backup_state['messages'][2]     = '3. 打包备份数据，包括数据库，上传文件等。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execSync('tar zcvf /data/'+filename+'.tgz -C /data upload backup');

    Backup_state['step']            = 99; // 备份完成！
    child_process.execSync('rm -fr /data/backup');
}

exports.backup_status = () => 
{
    Backup_state['timestamp_current'] = (new Date()).getTime();
    return Backup_state;
}

/* 查找现有备份文件 */
exports.backup_fileinfo = async () => 
{
    var ret = null;

	var pa = fs.readdirSync('/data');
	pa.forEach(function(ele, index){
		var info = fs.statSync("/data/"+ele)
		if(!info.isDirectory() && (/^backup.*\.tgz/.test(ele))){
            ret = {'name':ele, 'path':"/data/"+ele, 'size':info.size, 'mtime':info.mtime};
		}
    })

    return ret;
}


/* ----------------------------- Restore ----------------------------------- */

var Restore_state = {'step': -1, 'timestamp_start': 0, 'timestamp_current':0, 'messages': []};

exports.restore = async (filename) => 
{
    const cfg = require('dotenv').config({ path: envfile }).parsed;

    Backup_state['title'] = 'Restore';
    /* 0. 删除现有备份文件（backup*），并准备临时备份目录 */
    Backup_state['step']            = 0;
    Backup_state['messages'][0]     = '1. 删除所有备份文件，并准备临时备份目录。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execSync('cd /data; rm -fr `ls|egrep -v '+filename+'`');

    /* 1. 解压备份文件 */
    Backup_state['step']            = 1;
    Backup_state['messages'][1]     = '2. 解压备份文件。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    shelljs.exec('tar -xvf /data/'+filename+' -C /data ');

    /* 2. 恢复备份文件，以及数据库 */
    Backup_state['step']            = 2;
    Backup_state['messages'][2]     = '3. 恢复备份文件，以及数据库。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execFileSync('script/restore.sh', [envfile, cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME]);

    Backup_state['step']            = 99; // 备份完成！
    child_process.execSync('rm -fr /data/backup');
}

exports.upload = async (ctx, file) => 
{
    var filename = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var filepath = '/data/'+filename;

    const reader = fs.createReadStream(file.path);
    const upStream = fs.createWriteStream(filepath);
    reader.pipe(upStream);
}