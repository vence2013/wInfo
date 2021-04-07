/* 直接重启容器太慢， 还是进入终端操作。
 * 创建一个无效的服务器来保持容器运行
 */
const http = require("http");

http.createServer().listen(8888);
