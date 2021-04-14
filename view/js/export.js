angular
.module('appApp', [])
.controller('appCtrl', appCtrl);

function appCtrl($scope, $http) 
{
    let wnd_height = $(document).height();
    $('.log-msg').css({'height': (wnd_height - 90)+'px'});

    var timer_query_state;

    function query_state()
    {
        $http
        .get('/document/export/state')
        .then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            let ret = res.data.message;
            $('.log-sys').html('');
            $(ret['log-sys']).map((i, e) => {
                $('.log-sys').append('<div>'+e+'</div>');
            });
            $('.log-doc').html(JSON.stringify(ret['log-doc']));

            if (ret['log-idx'] == 99) 
            {
                export_file_info();
                window.clearInterval(timer_query_state); 
                $('#export_btn').removeClass('btn-danger').addClass('btn-success').html('导出成功');
            }
        });
    }

    $scope.export_request = () => 
    {
        $http
        .get('/document/export/all')
        .then(()=>{
            timer_query_state = window.setInterval(query_state, 1000);

            /* 修改为正在备份的样式 */
            $("#export_btn")
            .removeClass('btn-warning').addClass('btn-danger')
            .html('正在导出<span class="spinner-border spinner-border-sm ml-2" role="status"></span>');            
        });
    }


    function export_file_info()
    {
        $http
        .get('/document/export/info')
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
    export_file_info();
}