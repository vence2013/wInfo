angular
.module('displayApp', [])
.controller('displayCtrl', displayCtrl);

function displayCtrl($scope, $http) 
{
    $scope.docinfo = null;

    var docid = $('.doc-display').attr('docid');

    var editor = editormd("editormd", { 
        path : '/node_modules/editor.md/lib/',
        width : '100%',             
        tocContainer : ".TOC",
        tocDropdown  : false,        
        onload : function() { 
            this.previewing(); 
            $('#editormd').find('.editormd-preview-close-btn').remove();

            detail();
        }    
    }); 

    var wnd_height = $(document).height();
    $('.doc-display>.row>div').height(wnd_height - 70);
    $('.TOC').height(wnd_height - 160);

    function detail() {
        $http.get('/document/detail/'+docid).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            $scope.docinfo = ret;
            editor.setMarkdown($scope.docinfo.content); 
            {
                var title = '';                
                var str = ret.content.replace(/^[\\n#\ \t]*/, '');
                
                if (/[^\n]+/.test(str))
                {
                    title = str.match(/[^\n]+/)[0];
                }
                else
                {
                    title = str.substr(0, 100);
                }
                $(document).attr("title", title);
            }
        })
    }
}