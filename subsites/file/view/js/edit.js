angular
.module('editApp', [])
.controller('editCtrl', editCtrl);

function editCtrl($scope, $http, $timeout) 
{
    /* 标签 ---------------------------------------------------------------------
     * 实现参考document/edit，不同点：
     *     标签搜索框输入空格后，即将该标签关联到选中文件
     */
    var cfg_tag_list_max = 50;

    $scope.tag_input = '';
    $scope.tag_input_valid = [];
    $scope.tag_display = [];


    $scope.$watch('tag_input', tag_parse);

    function tag_parse()
    {
        var str = $scope.tag_input;
        var fmt = str.replace(/\s+/g, ' ');
        var trm = fmt.replace(/^\s*(.*?)\s*$/, "$1");
        /* 如果最后一个字符为空格，则将已输入的标签关联到选中文件 */
        if (trm && (str[str.length-1] == ' ')) 
        {
            tag_select(trm);
            $scope.tag_input = '';
        }
        else 
        {
            tag_search();
        }
    }

    function tag_search()
    {
        var str   = $scope.tag_input ? $scope.tag_input.split(' ').pop() : '';
        var size  = cfg_tag_list_max + $scope.tag_input_valid.length;
        var query = {'str':str, 'size':size};

        $http.get('/tag/search', {params:query }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 将结果中已选择的标签滤除 */
            var list = [];
            for (i=0; (i<cfg_tag_list_max) && (i<ret.list.length); i++)
            {
                var t = ret.list[i].name;
                if ($scope.tag_input_valid.indexOf(t) == -1) list.push(t);
            }
            $scope.tag_display = list;
        })
    }
    
    function get_selected_fileids()
    {
        let ids = [];

        let filelist = $scope.filelist;
        for (i=0; i<filelist.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked')) 
                ids.push(filelist[i].id);
        }

        return ids;
    }

    $scope.tag_unlink = (tag) =>
    {
        let ids = get_selected_fileids();
        let params = {'tag':tag, 'fileids':ids}
        
        $http
        .post('/file/tag/unlink', params)
        .then((res)=>{
            if (errorCheck(res)) return ;

            update();
        });
    }

    function tag_link(tag)
    {
        let ids = get_selected_fileids();
        let params = {'tag':tag, 'fileids':ids}

        $http
        .post('/file/tag/link', params)
        .then((res)=>{
            if (errorCheck(res)) return ;

            update();
        });
    }

    /* 标签关联的取消：点击文件关联的标签，将取消该标签与所有选中文件的关联 */
    $scope.tag_select = (name) => {
        /* 如果没有选中任何文件，则为使用标签筛选文件，否则为将标签关联到选中的文件 */
        if ($('.file_checkbox:checked').length > 0)
        {
            tag_link(name);
        }
        else
        {
            /* 搜索标签后，选择将清除搜索字符串 */
            var str = $scope.tag_input;
            if (str && (str[str.length-1] != ' '))
            {
                $scope.tag_input = (str.indexOf(' ') == -1) ? '' : str.replace(/(.*\s+)[^\s]+$/, "$1");
            }

            $scope.tag_input_valid.push(name);
            tag_search(); /* 重新搜索，滤除已选择标签 */
        }        
    }

    $scope.tag_unselect = (name) => {
        var idx = $scope.tag_input_valid.indexOf(name);
        $scope.tag_input_valid.splice(idx, 1);

        tag_search(); /* 重新搜索，滤除已选择标签 */
    }

    /* 文件搜索，删除 -------------------------------------------------------*/

    var cfg_file_list_max = 18;

    $scope.opts = opts = {'str':'', 'ext':'', 'createget':'', 'createlet':'', 
        'sizeget':'', 'sizelet':'', 'order':'4', 'page':1, 'pageSize':cfg_file_list_max, 
        'with_tag': true, 'tag':$scope.tag_input_valid};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);
    $scope.filelist = [];

    var updateTimer = null;
    /* 以下条件更新视图：opts更新； page改变 */
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (updateTimer)
            window.clearTimeout(updateTimer);
        updateTimer = window.setTimeout(update, 500);            
    }, true);

    function detail(file)
    {
        $http.get('/file/detail/'+file.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            file['tags'] = ret['tags'];
        })
    }

    /* 文件搜索，参数有：文件名称，扩展名，上传时间范围，文件大小范围，排序方式 */
    function update() {
        var query = angular.copy($scope.opts);

        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';

        /* 如果不是全选，记录当前选中的文件 */
        var selected_idxs = [];
        if (!$scope.check_all)
        {
            $(".file_checkbox").each((i, e)=>{
                if ($('.file_checkbox:eq('+i+')').prop('checked')) 
                    selected_idxs.push(i);
            });
        }
            selected_ids = get_selected_fileids();

        $http
        .get('/file/search', {params: query})
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.filelist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);  
            if (ret.list.length > 0)
            {
                ret.list.map((x) => { detail(x); })
            }   

            /* 恢复全选设置 */
            $timeout(()=>{
                if ($scope.check_all)
                    $(".file_checkbox").prop("checked", $scope.check_all);
                else 
                {
                    $(selected_idxs).each((i, e)=>{
                        $('.file_checkbox:eq('+e+')').prop('checked', true)
                    });
                }
            }, 200);
        })
    }

    /* 文件删除分为2步：
     * 1. 在点击删除后，记住文件ID，弹出确认窗口
     * 2. 确认删除后，请求服务器执行删除
     */
    $scope.delid = 0;
    $scope.selectDel = (id) => {
        $scope.delid = id;
    }

    $scope.delete = () => {
        var fileids = [];

        var filelist = $scope.filelist;
        for (i=0; i<filelist.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked')) fileids.push(filelist[i].id);
        }

        $http.delete('/file', {params:{'fileids':fileids}}).then((res)=>{
            if (errorCheck(res)) return ;

            update();
        });
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        opts.page = num;
    }

    $scope.check_all = false;
    $scope.check_all_click = check_all_click;
    function check_all_click()
    {
        var current_check = !$scope.check_all;

        $(".file_checkbox").prop("checked", current_check);
    }
}