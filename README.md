# wInfo
document, file

生成证书，参考：http://www.cnblogs.com/zzmiaow/p/10201035.html

剩余的功能：
* 标签显示（按使用最多/关联资源，按最近使用倒序）
* 标签列表中关联资源显示

网页编辑器有2个问题：
1. 1个页面多个实例有问题，内容都是一样的
2. 结合bootstrap的nav效果，切换到没有编辑器的导航再切换回来，编辑器不见了！

jquery-notebook是一个新不错的选择。

转移数据
~~~sql
INSERT INTO `se_requirements` (`id`,`category_id`,`title`,`desc`,`comment`,`importance`,`sources`,`createdAt`,`updatedAt`) SELECT `id`,`seRequirementCategoryId`,`title`,`desc`,`comment`,`importance`,`sources`,`createdAt`,`updatedAt` FROM `se_requirements1`;
~~~

~~~
npm install -g bower
bower install jquery-notebook
~~~