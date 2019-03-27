# layui
layui前端 UI 框架扩展模块

## 目录结构

初始的目录结构如下：

~~~
www  WEB部署目录（或者子目录）
├─application           应用目录
│  ├─common             公共模块目录（可以更改）
│  ├─module_name        模块目录
│
├─public                WEB目录（对外访问目录）
│  ├─index.php  
│  ├─static             静态资源目录
│  │  ├─layui           layui UI 框架目录
│  │  ├─css             全局CSS文件目录
│  │  ├─images          全局图片文件目录
│  │  ├─libs            扩展js类库
│  │  │  ├─xTable.js    增强版table
│  │  │  ├─xTree.js     扩展版tree
│  │  │  ...
│  └─.htaccess          用于apache的重写


