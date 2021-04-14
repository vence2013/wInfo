angular
.module('appApp', ['angularFileUpload'])
.controller('appCtrl', appCtrl);

function appCtrl($scope, $http, $interval, FileUploader) 
{
    $scope.backup_file = null;
    $scope.backup_filename = "backup_techdoc-data_"+(new Date()).format("yyyyMMddhhmmss");


    /* --------------------------------- Backup ---------------------------- */
    var timer_state_query = null;

    $scope.backup = () =>{
        $http
        .get('/backup?filename='+$scope.backup_filename)
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            /* 修改为正在备份的样式 */
            $("#backup_btn")
            .removeClass('btn-warning').addClass('btn-danger')
            .html('正在备份<span class="spinner-border spinner-border-sm ml-2" role="status"></span>');
            timer_state_query = $interval(state_query, 1000);
        });        
    }

    function state_query()
    {
        $http
        .get('/backup/status')
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            let ret = res.data.message;

            /* 显示过程信息 */
            $('.log-msg').html('');
            $(ret.messages).each((i, e)=>{
                let str = e;
                if ((i+1) == ret.messages.length)
                    str += "耗时："+Math.ceil((ret.timestamp_current - ret.timestamp_start)/1000)+"秒"
                $('.log-msg').append('<div>'+str+'</div>');
            });

            if (ret['step'] == 99)
            {
                $interval.cancel(timer_state_query);
                backup_file_info();

                if (ret['title'] == 'Backup')
                    $('#backup_btn').removeClass('btn-danger').addClass('btn-success').html('备份成功');
                else
                    $('#restore_btn').removeClass('btn-danger').addClass('btn-success').html('恢复成功');
            }
        });
    }

    function backup_file_info()
    {
        $http
        .get('/backup/info')
        .then((res)=>{
            if (errorCheck(res)) return ;
            
            var fmtsize = '';
            var ret = res.data.message;
            if (!ret) return;  // 无效的备份文件信息

            if (ret.size < 1024)
                fmtsize = ret.size + 'Byte'
            else if ((ret.size/1024) < 1024)
                fmtsize = Math.ceil(ret.size/1024) + 'KB'
            else if ((ret.size/1024/1024) < 1024)
                fmtsize = Math.ceil(ret.size/1024/1024) + 'MB'

            $scope.remotefile = {'name':ret.name, 'path':ret.path, 'size':fmtsize, 'updatedAt':(new Date(ret.mtime)).format("yyyy-MM-dd hh:mm:ss")};
        });
    }
    backup_file_info();

    /* -------------------------------- Restore ---------------------------- */

    /* Uploader */

    var uploader = $scope.uploader = new FileUploader({
        url: '/backup/restore', 'queueLimit': 1, removeAfterUpload: true
    })
    uploader.onAfterAddingFile = function(fileItem) {
        var file = fileItem.file;

        var fmtsize = '';
        if (file.size < 1024)
            fmtsize = file.size + 'Byte';
        else if ((file.size/1024) < 1024)
            fmtsize = Math.ceil(file.size/1024) + 'KB';
        else if ((file.size/1024/1024) < 1024)
            fmtsize = Math.ceil(file.size/1024/1024) + 'MB';

        $scope.localfile = {'name':file.name, 'size':fmtsize, 'updatedAt':(new Date(file.lastModifiedDate)).format("yyyy-MM-dd hh:mm:ss")};
    }
    uploader.onBeforeUploadItem = function(fileItem) {
        // 开始恢复过程
        /* 修改为正在备份的样式 */
        $("#restore_btn")
        .removeClass('btn-warning').addClass('btn-danger')
        .html('正在恢复<span class="spinner-border spinner-border-sm ml-2" role="status"></span>');       
    }
    // 上传成功
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if (/^[\-0-9]+$/.test(response.error)) {
            toastr.success('Upload file '+fileItem.file.name+' '+response.message);

            window.setTimeout(()=>{ 
                $http.get('/backup/restore?filename='+fileItem.file.name); 
                timer_state_query = $interval(state_query, 1000);
            }, 1000);
        } else {
            console.log(response);
            toastr.info('文件上传错误！');            
        }
    };
}