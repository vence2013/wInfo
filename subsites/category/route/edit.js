const Router = require('koa-router');
var router = new Router();

router.get('/', async (ctx)=>{
    await ctx.render('subsites/category/view/edit.html'); 
});

module.exports = router;