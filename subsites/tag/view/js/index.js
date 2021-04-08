angular
.module('appApp', [])
.controller('appCtrl', appCtrl);

function appCtrl($scope, $http) 
{
    $scope.opts = opts = {'str':'', 'page':1, 'size':100};
    $scope.page = pageSet(0, opts.size, 10, 0);
    $scope.taglist = [];
    $scope.tagname = '';
    $scope.tagsel  = false;

    $('.tag-view').height($(document).height() - 100);

    $scope.$watch('opts', tag_refresh, true);

    function tag_refresh()
    {
        $http.get('/tag/search', {params: $scope.opts})
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            console.log(ret);
            $scope.taglist = ret.list;
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
    }
}