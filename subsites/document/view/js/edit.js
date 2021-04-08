angular
.module('editApp', [])
.controller('editCtrl', editCtrl);

function editCtrl($scope, $http, $interval) 
{
    /* 标签 ---------------------------------------------------------------------
     * 
     * 操作：
     *     输入时，显示关联标签； 
     *     输入空格后，标记已存在的标签
     *
     * 显示
     *    1. 显示最新的部分标签
     *    2. 搜索输入相关的标签 
     */
    var cfg_tag_list_max = 50;

    $scope.tag_input = '';
    $scope.tag_input_valid = [];
    $scope.tag_display = [];

    $scope.$watch('tag_input', tag_parse);

    /* 最后一个字符是空格，则查找输入字符中有效的标签，移入 tag_input_valid 
     * 最后一个字符非空格，搜索最后一个字符串相关的标签
     */
    function tag_parse()
    {
        var str = $scope.tag_input;
        /* 根据最后一个字符是否为空格，进行标签搜索或检查 */
        (str && (str[str.length-1] == ' ')) ? tag_check() : tag_search();
    }

    /* 检查输入框中的有效标签
     * 1. 更新选中的有效标签
     * 2. 更新标签输入框的内容
     */
    function tag_check(tags)
    {
        var fmt = $scope.tag_input.replace(/\s+/g, ' ');
        var trm = fmt.replace(/^\s*(.*?)\s*$/, "$1");
        var tags = trm ? trm.split(' ') : [];

        $http.get('/tag/check/'+tags.join(','))
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            ret.map(x=>{
                var tag = x.name;
                var idx = tags.indexOf(tag);
                tags.splice(idx, 1);

                if ($scope.tag_input_valid.indexOf(tag) == -1)
                {
                    $scope.tag_input_valid.push(tag);
                }
            })

            tag_search('');
            $scope.tag_input = tags.join(' ')+' ';
        })
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

    $scope.tag_select = (name) => {
        /* 搜索标签后，选择将清除搜索字符串 */
        var str = $scope.tag_input;
        if (str && (str[str.length-1] != ' '))
        {
            $scope.tag_input = (str.indexOf(' ') == -1) ? '' : str.replace(/(.*\s+)[^\s]+$/, "$1");
        }

        $scope.tag_input_valid.push(name);
        tag_search(); /* 重新搜索，滤除已选择标签 */
    }

    $scope.tag_unselect = (name) => {
        var idx = $scope.tag_input_valid.indexOf(name);
        $scope.tag_input_valid.splice(idx, 1);

        tag_search(); /* 重新搜索，滤除已选择标签 */
    }

    /* 文档  ----------------------------------------------------------------*/

    $scope.docid  = docid = $('#wrapper').attr('docid');
    $scope.docinfo= null;
    $scope.isEdit = (docid == '0') ? false : true;

    var content = '';
    var editor = editormd("editormd", {
        path : '/node_modules/editor.md/lib/',
        width: '100%',
        height: 800,
        toolbarIcons : function() {
            return editormd.toolbarModes['simple']; // full, simple, mini
        },
        onload : function() {
            // 获取编辑标签的内容
            if (docid!='0') { detail(); }
        }  
    });  
    $interval(()=>{ content = editor.getMarkdown(); }, 1000);

    $scope.submit = () => 
    {
        var fmt = $scope.tag_input.replace(/\s+/g, ' ');
        var trm = fmt.replace(/^\s*(.*?)\s*$/, "$1");
        var tags = trm ? trm.split(' ') : [];
        tags = tags.concat($scope.tag_input_valid);

        var params = {'content':content, 'tags':tags};
        $http.post('/document/'+docid, params).then((res)=>{
            if (errorCheck(res)) return ;

            ret = res.data.message;
            // 显示更新成功后，刷新该页面
            toastr.success("操作成功！");
            window.setTimeout(()=>{ window.location.href = '/document/display/'+ret; }, 1000);
        });
    }

    // 详细信息，包括文件属性， 关联标签
    function detail() {

        $http.get('/document/detail/'+docid).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;            
            $scope.docinfo = ret;
            $scope.tag_input_valid = ret.tagnames;         
            editor.setMarkdown(ret.content); 
        });
    }

    $scope.delete = ()=>{
        $http.delete('/document/'+docid).then((res)=>{
            if (errorCheck(res)) return ;

            toastr.success("删除成功，即将返回首页！");
            window.setTimeout(()=>{ window.location.href = '/document'; }, 1000);
        });
    }

}