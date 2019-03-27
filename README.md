# layui
layui前端 UI 框架扩展模块


## layui 版本需求：v2.4.5+

此项目为layui组件扩展 x 系列


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
│  │  ├─layui           layui UI 框架目录 v2.4.5+
│  │  ├─css             全局CSS文件目录
│  │  ├─images          全局图片文件目录
│  │  ├─libs            扩展js类库
│  │  │  ├─xTable.js    增强版table
│  │  │  ├─xTree.js     扩展版tree
│  │  │  ...
│  └─.htaccess          用于apache的重写
~~~


## 安装，调用方法

下载 src 目录下的扩展文件放到 /static/libs/ 目录下
~~~
<script type="text/javascript">
layui.config({
	base: '/static/libs/'
}).use(['xTable', 'xTree'], function(){
	var $   = layui.$,
  xTable = layui.xTable,
  xTree  = layui.xTree;
  
  xTable.render({
   elem: '#dataTable',
   url: ''
   ...
  });
 
</script>
~~~


## 扩展组件系列

### 一、table 数据表格 增强版 xTable
  * 顶部工具栏自动生成搜索
  * 顶部工具栏自动生成按钮
  
### 二、tree 树形菜单 扩展版 xTree
  * 支持普通tree菜单
  * 显示单选框、多选框
  * 支持每个节点点击回调事件
  * 支持修改显示图标
