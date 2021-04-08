angular
.module('indexApp', [])
.controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    /* 标签 -------------------------------------------------------------------*/
    var cfg_tag_list_max = 50;

    $scope.tag_input = '';
    $scope.tag_input_valid = [];
    $scope.tag_display = [];

    $scope.$watch('tag_input', tag_search);

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
        $scope.tag_input_valid.push(name);
        $scope.tag_input = '';
        
        tag_search(); /* 重新搜索，滤除已选择标签 */
        doc_update();
    }

    $scope.tag_unselect = (name) => {
        var idx = $scope.tag_input_valid.indexOf(name);
        $scope.tag_input_valid.splice(idx, 1);
        tag_search(); /* 重新搜索，滤除已选择标签 */
        doc_update();
    }


    /* pre-set data ---------------------------------------------------------*/

    var str = $(".data_preset").text();
    if (str)
    {
        var arr = str.replace(/(^\s*)|(\s*$)/g, "").replace(/;*$/, "").split(';');
        for (var i=0; i<arr.length; i++)
        {
            var pair = arr[i].split(':');
            var val = pair[1].replace(/,*$/, "").split(',');
    
            switch (pair[0])
            {
                case 'tag':
                    $scope.tag_input_valid = val;
                    doc_update();
                    break;
            }        
        }
    }


    /* 文档 -----------------------------------------------------------------*/

    $scope.opts = opts = {'page':1, 'size':24, 'str':'', 'tag':'', 'createget':'', 
        'createlet':'', 'order':'1'};
    $scope.page = pageSet(0, opts.size, 10, 0);

    $scope.$watch('opts', doc_update, true);

    function doc_update()
    {
        var query = angular.copy($scope.opts);
        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';
        query['tag'] = $scope.tag_input_valid;

        $http.get('/document/search', {params: query}).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 提取文章标题 
             * 1. 去除开头的#和换行符(\n)
             * 2. 查找下一个换行符前的字符串
             */
            for (var i = 0; i < ret.list.length; i++) {
                var title = '';

                var content = ret.list[i].content;
                var str = content.replace(/^[\\n#\ \t]*/, '');
                if (/[^\n]+/.test(str))
                {
                    title = str.match(/[^\n]+/)[0];
                }
                else
                {
                    title = str.substr(0, 100);
                }                
                ret.list[i]['title'] = title;
            }
            $scope.doclist = ret.list;
            $scope.page = pageSet(ret.total, opts.size, 10, ret.page);        
        })
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        opts.page = num;
        docUpdate();
    }

    $scope.export = () => {
        var query = angular.copy($scope.opts);
        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';
        query['tag'] = $scope.tag_input_valid;

        $http.get('/document/export', {params: query}).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            window.open(ret+'?t='+Math.random());
        })
    }

}