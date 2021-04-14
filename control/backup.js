const fs = require("fs");
const path  = require('path');
const shelljs = require('shelljs');
const child_process = require('child_process');

var Backup_state = {};

exports.backup_status = () => 
{
    Backup_state['timestamp_current'] = (new Date()).getTime();

    return Backup_state;
}

exports.backup_status_clear = backup_status_clear;

function backup_status_clear(title) 
{
    Backup_state['title'] = title;
    Backup_state['step']  = 0;
    Backup_state['timestamp_start']   = 0;
    Backup_state['timestamp_current'] = 0;
    Backup_state['messages'] = [];
}

/* 查找现有备份文件 */
exports.backup_fileinfo = async () => 
{
    var ret = null;

	var pa = fs.readdirSync('/data');
	pa.forEach(function(ele, index){
		var info = fs.statSync("/data/"+ele);        
		if(!info.isDirectory() && (/^backup.*\.tgz/.test(ele))){
            ret = {'name':ele, 'path':"/data/"+ele, 'size':info.size, 'mtime':info.mtime};
		}
    })

    return ret;
}


/* 启动备份 */
exports.backup = async (filename) =>
{
    const cfg = require('dotenv').config({ path: envfile }).parsed;

    backup_status_clear('Backup');

    /* 0. 删除现有备份文件（backup*），并准备临时备份目录 */
    Backup_state['step']            = 0;
    Backup_state['messages'][0]     = '1. 删除所有备份文件，并准备临时备份目录。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.execFileSync('script/backup_prepare.sh', [envfile]);

    /* 1. 备份数据库 */
    Backup_state['step']            = 1;
    Backup_state['messages'][1]     = '2. 备份数据库。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    shelljs.exec('mysqldump --host='+cfg.MYSQL_HOST+' -u root -p'+cfg.MYSQL_ROOT_PASSWORD+' '+
        cfg.SYSNAME+' > /data/backup/'+cfg.SYSNAME+'.sql');  

    /* 2. 打包所有备份文件 */
    Backup_state['step']            = 2;
    Backup_state['messages'][2]     = '3. 打包备份数据，包括数据库，上传文件等。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.exec('tar zcvf /data/'+filename+'.tgz -C /data upload backup', (error, stdout, stderr) => {
        let step = Backup_state['step'];
        Backup_state['step']        = 99; // 备份完成（不论成功/失败）！
        Backup_state['messages']    = [];
    
        if (error)
            Backup_state['messages'][step] = error + '<br />' + stderr;
        else
            shelljs.exec('rm -fr /data/backup');
    });
}


/* ----------------------------- Restore ----------------------------------- */

exports.restore = async (filename) => 
{
    const cfg = require('dotenv').config({ path: envfile }).parsed;

    /* 0. 删除现有备份文件（backup*），并准备临时备份目录 */
    Backup_state['step']            = 0;
    Backup_state['messages'][0]     = '1. 删除所有备份文件，并准备临时备份目录。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    shelljs.exec('cd /data; rm -fr `ls|egrep -v '+filename+'`');

    /* 1. 解压备份文件 */
    Backup_state['step']            = 1;
    Backup_state['messages'][1]     = '2. 解压备份文件。';
    Backup_state['timestamp_start'] = (new Date()).getTime();
    child_process.exec('tar -xvf /data/'+filename+' -C /data', (error, stdout, stderr) => {
        let step = Backup_state['step'];
        if (error)
        {
            Backup_state['messages'][step] = error + '<br />' + stderr;
            return ;
        }
            
        /* 2. 恢复备份文件，以及数据库 */
        Backup_state['step']            = 2;
        Backup_state['messages'][2]     = '3. 恢复备份文件，以及数据库。';
        Backup_state['timestamp_start'] = (new Date()).getTime();
        child_process.execFileSync('script/restore.sh', [envfile, cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME]);
    
        Backup_state['step']            = 99; // 备份完成！
        Backup_state['messages']        = [];
        shelljs.exec('rm -fr /data/backup');
    });
}

exports.upload = async (ctx, file) => 
{
    var filename = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var filepath = '/data/'+filename;

    const reader = fs.createReadStream(file.path);
    const upStream = fs.createWriteStream(filepath);
    reader.pipe(upStream);
}