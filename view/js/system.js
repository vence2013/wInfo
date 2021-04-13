angular
.module('systemApp', ['angularFileUpload'])
.controller('systemCtrl', systemCtrl);

function systemCtrl($scope, $http, $interval, FileUploader) 
{
    $scope.backup_file = null;
    $scope.backup_filename = "backup_techdoc-data_"+(new Date()).format("yyyyMMddhhmmss");


    /* --------------------------------- Backup ---------------------------- */
    var timer_backup_state_query = null;

    $scope.backup = () =>{
        $http
        .get('/system/backup?filename='+$scope.backup_filename)
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            /* 修改为正在备份的样式 */
            $("#backup_btn")
            .removeClass('btn-warning').addClass('btn-danger')
            .html('正在备份<span class="spinner-border spinner-border-sm ml-2" role="status"></span>');
            timer_backup_state_query = $interval(backup_state_query, 1000);
        });        
    }

    function backup_state_query()
    {
        $http
        .get('/system/backup/status')
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            let ret = res.data.message;

            /* 显示过程信息 */
            $('.log-msg').html('');
            $(ret.messages).each((i, e)=>{
                let str = e;
                if ((i+1) == ret.messages.length)
                    str += "耗时："+(ret.timestamp_current - ret.timestamp_start)+" ms"
                $('.log-msg').append('<div>'+str+'</div>');
            });


            if (ret['step'] == 99)
            {
                $interval.cancel(timer_backup_state_query);
                $("#backup_btn")
                .removeClass('btn-danger').addClass('btn-success')
                .html('备份成功');

                backup_file_info()
            }
        });
    }

    function backup_file_info()
    {
        $http
        .get('/system/backup/fileinfo')
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            var fmtsize = '';
            var ret = res.data.message;
            if (ret.size < 1024)
                fmtsize = ret.size + 'Byte'
            else if ((ret.size/1024) < 1024)
                fmtsize = Math.ceil(ret.size/1024) + 'KB'
            else if ((ret.size/1024/1024) < 1024)
                fmtsize = Math.ceil(ret.size/1024/1024) + 'MB'
    
            $scope.fileinfo = {'name':ret.name, 'size':fmtsize, 'updatedAt':(new Date(ret.mtime)).format("yyyy-MM-dd hh:mm:ss")};
        });
    }
    backup_file_info();

    /* -------------------------------- Restore ---------------------------- */

    /* Uploader */

    var uploader = $scope.uploader = new FileUploader({
        url: '/restore/upload', 'queueLimit': 1, removeAfterUpload: true
    })
    uploader.onAfterAddingFile = function(fileItem) {
        var file = fileItem.file;
        var fmtsize = '';

        if (file.size < 1024)
        {
            fmtsize = file.size + 'Byte'
        }
        else if ((file.size/1024) < 1024)
        {
            fmtsize = Math.ceil(file.size/1024) + 'KB'
        }
        else if ((file.size/1024/1024) < 1024)
        {
            fmtsize = Math.ceil(file.size/1024/1024) + 'MB'
        }

        $('#restore_file_name').text(file.name);
        $('#restore_file_size').text(fmtsize);
        $('#restore_file_last_modify').text((new Date(file.lastModifiedDate)).format("yyyy-MM-dd hh:mm:ss"));
    }
    uploader.onBeforeUploadItem = function(fileItem) {
        $('#restore_wait').removeClass('d-none');
    }
    // 上传成功后删除记录
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if (/^[\-0-9]+$/.test(response.error)) {
            if (response.error != 0) {
                toastr.info(response.message+'('+fileItem.file.name+')', '', 
                    {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            }     
        } else {
            console.log(response);
            toastr.info('文件上传错误！');            
        }
    };
}