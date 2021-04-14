
exports.reqCheck = reqCheck;
function reqCheck(req2) {
    var query = {};

    query['page']     = parseInt(req2.page);
    query['size'] = parseInt(req2.size);
    query['tag'] = req2.tag;
    // 以空格分开的字符串
    var fields = ['str'];
    for (var i=0; i<fields.length; i++) {
        var key   = fields[i];
        var value = req2[key];
        // 检查是否含有效字符
        if (!value || !/^[\s]*.+[\s]*$/.test(value)) continue;
        query[key] = value.replace(/[\s]+/, ' ') // 将多个空格替换为一个
                          .replace(/(^\s*)|(\s*$)/g, "") // 删除字符串首尾的空格
                          .split(' ');
    }
    // 日期格式
    var dateExp = new RegExp(/^\d{4}(-)\d{1,2}\1\d{1,2}$/);
    if (req2.createget && dateExp.test(req2.createget)) { query['createget'] = req2.createget; }
    if (req2.createlet && dateExp.test(req2.createlet)) { query['createlet'] = req2.createlet; }
    // 排序
    switch (req2.order) {
        case '2': query['order'] = ['createdAt', 'ASC']; break;
        default: query['order'] = ['createdAt', 'DESC'];
    }

    return query;
}