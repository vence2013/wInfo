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

            console.log(ret, ret['log-idx'] == 99);
            if (ret['log-idx'] == 99) 
                window.clearInterval(timer_query_state);
        });
    }

    $scope.export_request = () => 
    {
        $http
        .get('/document/export/all')
        .then(()=>{
            timer_query_state = window.setInterval(query_state, 1000);
        });
    }
}