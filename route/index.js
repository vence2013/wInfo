const Router = require('koa-router');
var router = new Router();

var cfg = require('../cfg');

/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.render('view/index.html', cfg); 
})

module.exports = router;