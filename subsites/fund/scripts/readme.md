注意：
1. 脚本fund_data_download.js必须在容器内执行！


## 设计原则
1. 减少各个步骤之间的耦合。
使用上一步输出的结果（比如数据库记录），但不使用上一步运行的结果（比如数组变量）。

2. 下载脚本调用需要使用正确的参数
避免错误的操作导致数据被清除（特别是删除所有数据的操作）

    

## 配置文件示例
1. 净值数据地址。该地址可以通过点击下一页，查看访问地址获得。
~~~
http://url?fundCode=008285&pageIndex=1&pageSize=20&_=1619153462159
http://url?
    fundCode=008285&  基金代码
    pageIndex=1&pageSize=20&  页面及每页显示的数量（每页数据量设置为20000，约54年）
    _=1619153462159   随机值，避免重复请求
~~~

2. 排行统计数据（获取方式同上）。
http://url?op=ph&dt=kf&ft=all&gs=0&sc=6yzf&st=desc&pi=1&pn=50&dx=1
http://url?op=ph&dt=kf&ft=all&gs=0&sc=6yzf&st=desc&dx=1&
    pi=1&pn=50  初步认为是页码，以及每页数据量（每页设置为20000）

~~~
{
    "env_file":"../../../docker_compose_env",
    "fails_file":"fails.txt",
    "next_interval":250,
    "urls": 
    {
        "company": "http://url",
        "company_info": "http://url",
        "fund": "http://url",
        "fund_info": "http://x*.html",
        "fund_value": "http://x*.html",
        "fund_value_referer": "http://url",
        "fund_statistic": "http://url"
    }
}
~~~