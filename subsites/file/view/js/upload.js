angular
.module('uploadApp', ['angularFileUpload'])
.controller('uploadCtrl', uploadCtrl);

function uploadCtrl($scope, $http, FileUploader) 
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
            /* 不能滤除已选择的标签，因为有的文件可能没有选择已选的标签，需要再次选中 */
            $scope.tag_display = ret.list.map((x)=>{ return x.name});
        })
    }

    $scope.tag_select = tag_select;
    function tag_select(name) 
    {
        // 选中文件后，操作标签才有效
        if ($('.file_checkbox:checked').length == 0) return;

        // 关联标签到选中文件
        for (i=0; i<uploader.queue.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked'))
            {
                if (uploader.queue[i]['tags'])
                {
                    if (uploader.queue[i]['tags'].indexOf(name) == -1) uploader.queue[i]['tags'].push(name);
                }                     
                else
                    uploader.queue[i]['tags'] = [ name ];
            }
                
        }

        if ($scope.tag_input_valid.indexOf(name) == -1) $scope.tag_input_valid.push(name);
        tag_search(); /* 重新搜索，滤除已选择标签 */
    }

    function tag_select_refresh()
    {
        var tags = [];        
        for (i=0; i<uploader.queue.length; i++)
        {
            // 搜集所有文件的标签            
            var tags_inner = uploader.queue[i]['tags'];
            if (!tags_inner) continue;
            
            for (j=0; j<tags_inner.length; j++)
            {
                if (tags.indexOf(tags_inner[j]) == -1) tags.push(tags_inner[j]);
            }
        }

        // 从新收集选中文件的关联标签，并更新到选中标签的数组
        $scope.tag_input_valid = tags;
    }

    $scope.tag_unselect = (name) => {
        // 选中文件后，操作标签才有效
        if ($('.file_checkbox:checked').length == 0) return;
      
        for (i=0; i<uploader.queue.length; i++)
        {
            // 取消标签到选中文件的关联
            if ($('.file_checkbox:eq('+i+')').prop('checked'))
            {
                var tags_inner = uploader.queue[i]['tags'];
                if (tags_inner)
                {
                    console.log(tags_inner);
                    var idx = tags_inner.indexOf(name);
                    if (idx != -1) uploader.queue[i]['tags'].splice(idx, 1);
                }
            }
        }

        // 从新收集选中文件的关联标签，并更新到选中标签的数组
        tag_select_refresh();

        tag_search(); /* 重新搜索，滤除已选择标签 */
    }


    /* 文件上传 -------------------------------------------------------------*/

    var cfg_file_list_max = 18;

    // 上传成功后删除记录
    var uploader = $scope.uploader = new FileUploader({
        'url'               : '/file/upload', 
        'queueLimit'        : cfg_file_list_max, 
        'removeAfterUpload' : true,
    })    
    uploader.filters.push({ name: 'syncFilter',
        fn: function(item, options) { 
            // 限制上传的数量
            if (this.queue.length >= cfg_file_list_max) return false; 

            // 取消已存在(文件名/大小相同)的文件
            for (var i=0; i<this.queue.length; i++) {
                if ((this.queue[i]._file.name === item.name) && 
                    (this.queue[i]._file.size===item.size)) 
                    return false;
            }
            return true;
        }
    });
    uploader.onAfterAddingAll = (addedItems) =>
    {
        // 选中所有新添加的文件
        window.setTimeout(()=>{
            tag_select_refresh();

            for (i=0; i<addedItems.length; i++)
            {
                var idx = uploader.queue.indexOf(addedItems[i]);
                if (idx != -1) $('.file_checkbox:eq('+idx+')').prop('checked', true);
            }
        }, 500);
    }
    uploader.onBeforeUploadItem = (item)=>
    {
        if (item['tags']) item['formData'] = [{'tags':JSON.stringify(item['tags'])}];
    }
    uploader.onCompleteItem = () =>
    {
        tag_select_refresh();
    }
    uploader.onSuccessItem = (fileItem, response, status, headers) =>
    {
        // 显示错误信息
        if (/^[\-0-9]+$/.test(response.error)) {
            $scope.itemSel = null;
            if (response.error != 0) {
                toastr.error(response.message+'('+fileItem.file.name+')', '', 
                    {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            }
        } else {
            console.log(response);
            toastr.error('文件上传错误！');            
        }
    };

    $scope.check_all = false;
    $scope.check_all_click = () =>
    {
        var current_check = !$scope.check_all;

        $(".file_checkbox").prop("checked", current_check);
    }

    $scope.file_remove = () =>
    {
        var objs = [];
        for (i=0; i<uploader.queue.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked')) objs.push(uploader.queue[i]);
        }

        for (i=0; i<objs.length; i++) objs[i].remove();
    }
}