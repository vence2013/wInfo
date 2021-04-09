angular
.module('pictureApp', [])
.controller('pictureCtrl', pictureCtrl);

function pictureCtrl($scope, $http) 
{
    $scope.opts = opts = {'str':'', 'ext':'png jpg gif', 'order':'4', 'page':1, 'pageSize':45};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);

    $('.pic-view').height($(document).height() - 100);

    var updateTimer = null;
    /* 以下条件更新视图：opts更新； page改变 */
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (updateTimer)
            window.clearTimeout(updateTimer);
        updateTimer = window.setTimeout(update, 500);            
    }, true);


    function update() {
        $http.get('/file/search', {params: opts}).then((res)=>{
            if (errorCheck(res)) 
                return ;
         
            var ret = res.data.message;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);   

            // 构建图片列表
            $(".piclist").html('');
            ret.list.map((x) => {
                var html = "<div><a href='"+x.location+"' title='"+x.name+"'>";
                $(".piclist").append(html+"<img src='"+x.location+"' /></a></div>");
            });
            
            $('.piclist').magnificPopup({ delegate: 'a', type: 'image',
                closeOnContentClick: false, closeBtnInside: false, mainClass: 'mfp-with-zoom',
                image: { verticalFit: true,
                    titleSrc: function(item) {                        
                        return item.el.attr('href');
                    }
                },
                gallery: { enabled: true },
                zoom: { enabled: true, duration: 300,
                    opener: function(element) {
                        return element.find('img');
                    }
                }
                
            });
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