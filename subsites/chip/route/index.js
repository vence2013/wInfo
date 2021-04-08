const Router = require('koa-router');
var router = new Router();


router.get('/', async (ctx) => {
    await ctx.render('subsites/chip/view/map.html'); 
})


module.exports = router;