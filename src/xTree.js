/**
 @Name：layui.xTree 1.0 树
 @Author: hyfeng
 @License：MIT
 
 用法：
	xTree.render({
		// id 不支持批量
		elem: '#tree', 
		//默认false, 支持 false | checkbox | radio
		check: 'checkbox', 
		// check: checkbox时有效，默认5个
		max: 5, 
		// 手风琴效果，默认开启
		accordion: true,
		// 点击回调（节点，单选，多选）
		click: null,
		// 初始化完成回调
		done: null,
		// tree数据(无须树形数据)
		data: [
			{id: 1, pid: 0, name: name1},
			{id: 2, pid: 0, name: name2},
			{id: 3, pid: 1, name: name3},
			{id: 4, pid: 1, name: name4},
			{id: 5, pid: 3, name: name5},
			...
		],
		// data > url ，数据源，二选一
		url: 'json/tree.json'
		
		// 根ID值，默认0
		rootId: 0,
		//已选，禁用项，对应ID
		selected: [],
		disabled: [],
		数据字段
		field: {
			id: 'id', // 必须，保证唯一
			pid: 'pid', // 必须
			name: 'name', // 必须
			disabled: 'disabled',
			selected: 'selected',
			children: 'children', 
			spread: 'spread',
		},
		// 数据格式
		response: {
			statusName: 'code',
			statusCode: 1,
			msgName: 'msg',
			dataName: 'data',
		},
		// 接口的其它参数，参考layui.table异步数据接口
		method: 'get',
		where: '',
		...
	});
	
	//取值(默认)[filter]必须，省略第三个，返回已选
	xTree.value(filter, 'get', [1,2,3...]);
	//设置选中[filter, 'set']必须，省略第三个，全部清空选中，第四个，联动下级
	xTree.value(filter, 'set', [1,2,3...], false|true);
	
	// 禁用[filter, 'disabled']必须，省略第三个，全部禁用，
	xTree.value(filter, 'disabled', [1,2,3...]);
	//启用[filter, 'enable']必须，省略第三个，全部启用，
	xTree.value(filter, 'enable', [1,2,3...]);
	//重置[filter]必须，清空已选，禁用
	xTree.value(filter, 'clear');
 */
 
layui.define(['jquery','layer'],function(exports){
	"use strict";
	var $ = layui.jquery,
		form = layui.form,
		laypage = layui.laypage,
	
		//字符常量
		MOD_NAME = 'xTree', 
		
		//外部接口
		tree = {
			config: {},

			//设置全局项
			set: function(options){
				var that = this;
				that.config = $.extend({}, that.config, options);
				return that;
			},

			//事件监听
			on: function(events, callback){
				return layui.onevent.call(this, MOD_NAME, events, callback);
			},
			
			/**
			 * 获取已选值，已选，禁用，启用！注意参数顺序1、filter,2、value,3、handle,4、subAct
			 * @param (string) filter 过滤器|ID|dom(不要加#.)
			 * @param (string) handle 处理类型，可选值：get|set|disabled|enable
			 * @param (string number array) value 值|id
			 * @param (boolean) subAct 是否处理子节点(仅选择时可用)，可选值：true|fasle
			 * @return mixed
			 */
			value: function(){
				var filter = arguments[0] || '',
					handle = arguments[1] || 'get',
					value  = (typeof arguments[2] == 'number' ? String(arguments[2]) : arguments[2]) || '',
					subAct = arguments[3] || false;

				return _setValue(filter, handle, value, subAct);
			},
			
			/**
			 * 渲染入口
			 * @param (mixed) options 配置内容|{}
			 * @return mixed
			 */
			render: function(options){
				return _render(options);
			}
		}, 

		//构造器
		Class = function(options){
			var that = this;

			that.config = $.extend({}, that.config, tree.config, options);
			that.render();
		};
	
	//默认配置
	Class.prototype.config = {
		// DOM选择器
		elem: '',
		// 开启|关闭复选框,单选框，可选：false|checkbox|radio
		check: false,
		// check: checkbox时有效，默认1个，即单选
		max: 1,
		// 点击回调
		click: null,
		// 初始化完成回调
		done: null,
		// json数据
		data: [],
		// 手风琴效果
		accordion: true,
		// 值，默认分隔符
		separator: ',',
		// 联动子节点(多选时，选择父节点，同时选中所有子节点)
		subAct: false,
		
		//已选，禁用项，对应ID
		selected: [],
		disabled: [],
		
		// 排序字段，排序方向
		sort: 'sort', 
		order: 'asc',
	};
	
	// xTree 渲染
	Class.prototype.render = function(){
		var that = this,
			options = that.config;
			
		//数据字段名
		options.field = $.extend({
			id: 'id', // 必须
			pid: 'pid', // 必须
			name: 'name', // 必须
			disabled: 'disabled',
			selected: 'selected',
			children: 'children', 
			spread: 'spread',
		}, options.field);
		
		//响应数据的自定义格式
		options.response = $.extend({
			statusName: 'code',
			statusCode: 1,
			msgName: 'msg',
			dataName: 'data',
			countName: 'count'
		}, options.response);
		
		//图标
		options.icon = $.extend({
			spread: 'layui-icon-download-circle',
			contract: 'layui-icon-add-circle-fine',
			leaf: 'layui-icon-file',
		}, options.icon);
		
		// max 转数字，此处判断多选或单选，1为单选，大于1多选
		// 下拉表格时：cls.type: checkbox 单选 | 多选，其他单选
		options.max = parseInt( options.max ) || 1;
		options.check = options.max > 1 ? 'checkbox' : options.check;
		
		// 转换传入的选中, 禁用值
		if(options.selected){
			// 如果是字符串或数字，转数组，由','分隔
			if(options.selected.constructor !== Array){
				options.selected = String(options.selected).split(options.separator);
			}

			// 转回字符串格式，防止传数字数组（[1,2,3..]）过来时$.inArray不能识别
			options.selected = options.selected.join(',').split(',');
			// 删除多除项
			options.selected = options.selected.slice(0, options.max);
		}
		if(options.disabled){
			if(options.disabled.constructor !== Array){
				options.disabled = String(options.disabled).split(options.separator);
			}
			
			options.disabled = options.disabled.join(',').split(',');
		}
			
		// 需要初始化的input
		var othis = $(options.elem);
		if(othis.length == 0){
			console.error('layui.xTree：未找到'+options.elem+'！');
			return;
		}
		
		// 添加树类
		var filter = othis.attr('lay-filter') || othis.attr('id');
		othis.addClass('lay-x-tree layui-form layui-elip').attr('lay-filter', filter);
		// 缓存树dom
		that.thisElem = othis;
		// 缓存配置内容
		that.thisElem.data('config', options);
		
		// 初始化 data > url
		if(options.data || options.url){
			that.loadData(function(data){
				
				that.createTree( data ).event();
			});
		}else{
			$(options.elem).html('无数据');
		}
	};
	
	// 生成树
	Class.prototype.createTree = function(treeJson){
		var that = this, 
			options = that.config;

		// 写入页面
		$(options.elem).html(renderTree(treeJson));

		// 展开最后一项节点及父节点
		that.thisElem.find('.layui-this:last').each(function(index, item){
			_spreadNodes($(item).parent('.lay-x-tree-leaf'));
		});
		
		// 禁用项，子节点全部禁用
		that.thisElem.find('.layui-disabled').each(function(i, dis){
			$(this).siblings('.lay-x-tree-node').find('.lay-x-tree-leaf').children('a').addClass('layui-disabled');
			$(this).siblings('.lay-x-tree-node').find('input[type=checkbox]').prop('disabled', true);
		});

		// 渲染多选，单选框
		if(options.check == 'checkbox'){
			form.render('checkbox');
		}else if(options.check == 'radio'){
			form.render('radio');
		}

		//初始化完成回调
		typeof options.done === 'function' && options.done(that.thisElem, that.data);
		
		// 递归生成树dom
		function renderTree(treeJson, pid, spread){
			var ul = '<ul lay-pid="'+(typeof(pid)?pid:'')+'" class="lay-x-tree-'+(pid == 'root'?'root':'node')+' '+((spread || that.rootId == pid || pid ==='root') ? 'layui-show' :'layui-hide')+'">\n';
			layui.each(treeJson, function(i, item){
				var li= '',exteHtml = '', 
					checked  = (item[options.field.selected] || $.inArray(String(item[options.field.id]), options.selected) != -1) ? 'checked ' : '', 
					disabled = (item[options.field.disabled] || $.inArray(String(item[options.field.id]), options.disabled) != -1) ? 'disabled ' : '';
				
				if(options.check == 'checkbox'){
					exteHtml = '<input type="checkbox" lay-skin="primary" ' + checked + disabled +'>';
				}else if(options.check == 'radio'){
					exteHtml = '<input type="radio" name="lay-x-tree-radio" ' + checked + disabled +'>';
				}

				//如果叶子节点还有子节点，通过递归调用生成
				if(item[options.field.children]){
					// 添加文件夹标识
					li = '<li lay-id="'+item[options.field.id]+'" class="lay-x-tree-leaf"><a href="javascript:;" class="'+(checked?'layui-this ':'')+(disabled?'layui-disabled ':'')+'"><i class="layui-icon '+ options.icon.contract +(item[options.field.spread] ? options.icon.spread : '')+' lay-x-tree-spread"></i>'+ exteHtml + '<cite title="'+item[options.field.name]+'">' +item[options.field.name]+'</cite></a>';
					// 下一层
					li += renderTree(item[options.field.children], item[options.field.pid], item[options.field.spread]);
				}else{
					// 添加叶子节点标识
					li = '<li lay-id="'+item[options.field.id]+'" class="lay-x-tree-leaf"><a href="javascript:;" class="'+(checked?'layui-this ':'')+(disabled?'layui-disabled ':'')+'"><i class="layui-icon '+(exteHtml?'lay-x-tree-perch':options.icon.leaf)+'"></i>'+ exteHtml + '<cite title="'+item[options.field.name]+'">' + item[options.field.name]+'</cite></a>';
				}
				ul+=li + '</li>\n';
			});
			
			return ul+"</ul>\n";
		}
		
		return that;
	}
	
	// 公共事件
	Class.prototype.event = function(){
		var that = this, options = that.config;

		// 点击 展开 | 收缩 图标
		that.thisElem.on('click', '.lay-x-tree-spread', function(){
			_spreadNodes($(this).closest('.lay-x-tree-leaf'));
			// 阻止事件冒泡
			return false;
		});

		// 点击节点事件(包含单选，多选事件)
		that.thisElem.on('click', '.lay-x-tree-leaf', function(e){
			var $node = $(this);

			// 禁用项，不回调
			if($node.children('a').is('.layui-disabled')){
				return false;
			}else if((options.check == 'checkbox' || options.check == 'radio') && !$(e.target).is('.layui-icon')){
				return false;
			}

			// 处理事件
			_choice($(this), options.subAct);
			
			// 选择 ||　取消
			var checked = $node.children('a').is('.layui-this');

			//触发点击节点回调
			typeof options.click === 'function' && options.click($node, options.data[$node.attr('lay-id')], checked);
			
			// 必须要阻止事件冒泡，父节点选择器也是lay-x-tree-leaf
			return false;
		});
		
		return that;
	}
	
	// 加载数据
	Class.prototype.loadData = function(callback){
		var that = this,
			options = that.config;
		
		// data > url
		if(options.data && options.data.constructor === Array && options.data.length){
			// 回调
			callback( that.buildTree(options.data) );
		}else if(options.url){
			//参数
			var data = options.where;
			if(options.contentType && options.contentType.indexOf("application/json") == 0){ //提交 json 格式
				data = JSON.stringify(data);
			}

			$.ajax({
				type: options.method || 'get',
				url: options.url,
				contentType: options.contentType,
				data: data,
				dataType: 'json',
				headers: options.headers || {},
				success: function(res){
					//如果有数据解析的回调，则获得其返回的数据
					if(typeof options.parseData === 'function'){
						res = options.parseData(res) || res;
					}

					//检查数据格式是否符合规范
					if(res[options.response.statusName] && res[options.response.statusName] != options.response.statusCode){
						layer.msg(
							res[options.response.msgName] ||
							('返回的数据不符合规范，正确的成功状态码 ('+ options.response.statusName +') 应为：'+ options.response.statusCode)
						);
					} else {
						
						// 传入数据生成下拉项
						callback( that.buildTree( res[options.response.dataName] ) );
					}
				},
				error: function(e, m){
					layer.msg('系统出错！');
				}
			});
		}
	}
	
	/**
	 * 将一维的扁平数组转换为多层级对象
	 * @param  {[type]} list 一维数组，数组中每一个元素需包含id和pid两个属性 
	 * @return {[type]} tree 多层级树状结构
	 */
	Class.prototype.buildTree = function(list){
		var options = this.config;
		var temp = {};
		var tree = [];
		
		var compare = function(field){
			return function(a,b){
				var value1 = a[field];
				var value2 = b[field];
				return options.order == 'asc' ? (value1 - value2) : (value2 - value1);
			}
		};

		if(list.length == 0){
			return [];
		}

		// 验证字段
		if(list[0][options.field.id] ===undefined || list[0][options.field.pid] ===undefined || list[0][options.field.name] ===undefined){
			return console.error('layui.xTree：缺少关键字段！');
		}
		
		// 核心步骤 #1
		options.data = [];
		for(var i in list){
			temp[list[i][options.field.id]] = list[i];
			// 拷贝并缓存
			options.data[list[i][options.field.id]] = JSON.parse(JSON.stringify(list[i]));
		}
		
		// 核心步骤 #2
		for(var i in temp){
			if(temp[i][options.field.pid] && temp[temp[i][options.field.pid]]){
				if(!temp[temp[i][options.field.pid]].children) {
					//temp[temp[i][options.field.pid]].children = new Object();
					temp[temp[i][options.field.pid]].children = [];
				}
				//temp[temp[i][options.field.pid]].children[temp[i][options.field.id]] = temp[i];
				temp[temp[i][options.field.pid]].children.push(temp[i]);
				// 根据某个值排序
				if(options.sort && temp[i][options.sort]){
					temp[temp[i][options.field.pid]].children.sort(compare(options.sort));
				}
			} else {
				//tree[temp[i][options.field.id]] =  temp[i];
				tree.push(temp[i]);
			}
		}

		return tree;
	}
	
	// 两个数组合并
	Class.prototype.arrayConcat = function(arr1, arr2){
		//不要直接使用var arr = arr1，这样arr只是arr1的一个引用，两者的修改会互相影响
		var arr = arr1.concat(), 
		res = [], 
		json = {};
		
		//或者使用slice()复制，var arr = arr1.slice(0)
		for(var i=0;i<arr2.length;i++){
			arr.indexOf(arr2[i]) === -1 ? arr.push(arr2[i]) : 0;
		}
		
		// 去重
		for(var i = 0; i < arr.length; i++){
			if(!json[arr[i]]){
				res.push(arr[i]);
				json[arr[i]] = 1;
			}
		}

		return res;
	}
	
	/* 
	 * ==================
	 * 私有方法
	 * ==================
	 */
	
	// 渲染入口
	function _render(options){ 
	
		//添加专属的style
		if($('#lay-x-tree-style').length==0){
			var style = [
					// 公用
					'.lay-x-tree {}',
					'.danger{border-color:#FF5722!important}',
					
					'.lay-x-tree ul ul{padding-left: 16px;}',
					'.lay-x-tree ul li{line-height: 28px;}',
					'.lay-x-tree li a{display: block}',
					'.lay-x-tree li a:hover{text-decoration:underline}',
					'.lay-x-tree li a>i{padding-right: 4px;}',
					'.lay-x-tree li a cite{padding: 2px 4px;}',
					'.lay-x-tree li a.layui-this cite{background-color: #5FB878;border-radius: 2px;color:#ffffff;}',
					'.lay-x-tree .layui-disabled i.lay-x-tree-spread{color:#333!important;cursor: pointer !important;}',
					
					'.lay-x-tree li .layui-form-checkbox i{top: -1px;}',
					'.lay-x-tree li .layui-form-checkbox[lay-skin="primary"]{padding-left: 24px;}',
					'.lay-x-tree .lay-x-tree-perch{margin-right:16px}',
					'.lay-x-tree .layui-form-radio{margin:0px;padding-right: 0px;}',
					].join('');
			
			$('<style id="lay-x-tree-style"></style>').text(style).appendTo($('head'));
		}
		
		return new Class(options);
	};
	
	// 展开节点
	function _spreadNodes($node){
		var $tree = $node.parents('.lay-x-tree');
		var $subNode = $node.children('.lay-x-tree-node');
		var options  = $tree.data('config');
		
		// 过滤
		if($tree.length == 0) return;
		
		// 向下关才所有 | 向上打开所有
		if($subNode.is('.layui-show')){
			$node.find('.lay-x-tree-node').removeClass('layui-show').addClass('layui-hide');
			//当前节点，修改图标
			$node.children('a').children('i.lay-x-tree-spread').removeClass(options.icon.spread).addClass(options.icon.contract);
		}else{
			$subNode.removeClass('layui-hide').addClass('layui-show');
			$node.parents('.lay-x-tree-node').removeClass('layui-hide').addClass('layui-show');
			//当前节点，修改图标
			$node.children('a').children('i.lay-x-tree-spread').removeClass(options.icon.contract).addClass(options.icon.spread);
		}

		// 开启手风琴效果
		var $thisRootNode = $subNode.attr('lay-pid') == options.rootId ? $node : $node.closest('.lay-x-tree-node[lay-pid='+options.rootId+']').parent('.lay-x-tree-leaf');
		if(options.accordion && $thisRootNode.length){
			// 关闭除当前分支处的所有展开节点
			$thisRootNode.siblings('.lay-x-tree-leaf').each(function(i, item){
				$(item).find('.lay-x-tree-node.layui-show').removeClass('layui-show').addClass('layui-hide');
				$(item).find('.'+options.icon.spread).removeClass(options.icon.spread).addClass(options.icon.contract);
			});
		}
	}
	
	// 选择 subAct是否联动子节点
	function _choice($node, subAct){
		var $tree = $node.parents('.lay-x-tree');
		var $thisInput = $node.children('a').children('input');
		var options  = $tree.data('config'), checked = false;
		
		// 过滤不存在的节点
		if($node.length == 0) return false;
		// 传入优先
		subAct = subAct == undefined ? options.subAct : subAct;
		
		// 选择，取消标识
		if(options.check =='checkbox' || options.check == 'radio'){
			checked = $thisInput.prop('checked');
		}else{
			checked = $node.children('a').is('.layui-this') ? false : true;
		}

		// 多选时，限制个数，
		// 单选|多选时，必须点击单选框，多选框才有回调
		if(options.check == 'checkbox'){
			var $checkedInput = $tree.find('.lay-x-tree-leaf input:checked');
			
			// 最多个数限制
			if($checkedInput.length > options.max){
				layer.msg('最多只允许选择'+options.max+'个!');
				// 取消选择
				$thisInput.prop('checked', false);
				form.render('checkbox');
				return false;
			}

			// 联动子节点
			if(subAct){
				layui.each($node.find('.lay-x-tree-leaf'), function(i, item){
					// 跳过禁选项
					if(!$(item).children('a').is('.layui-disabled')){
						$(item).children('a').children('input[type=checkbox]').prop('checked', $thisInput.prop('checked'));
						if($thisInput.prop('checked')){
							$(item).children('a').addClass('layui-this');
						}else{
							$(item).children('a').removeClass('layui-this');
						}
					}
				});
			}
		}
		
		// 刷新表单(checkbox | radio)
		form.render();
		
		// 当前节点添加标识
		if(options.check != 'checkbox' &&　checked){
			// 不是多选，并且是未选状态，先去除其他所有已选
			$tree.find('.layui-this').removeClass('layui-this');
		}

		checked ? $node.children('a').addClass('layui-this') : $node.children('a').removeClass('layui-this');
	}
	
	//  返回已选 | 设置值 | 禁选 (默认取值)
	function _setValue(filter, handle, value, subAct){
		var $tree, options, data=[];
		
		// 定位树
		// 转过滤器
		if(/(^#)|(^\.)/.test(filter)){
			filter = filter.substr(1);
		}
		
		$tree = $('.lay-x-tree[lay-filter='+filter+']');

		if($tree.length == 0) return;
		options = $tree.data('config');
		
		// 传入优先
		subAct = subAct == undefined ? options.subAct : subAct;

		// value转为数组处理
		if(value && value.constructor !== Array){
			// 防止传入数字
			value = String(value).split(options.separator);
		}

		/**
		 * 禁选，启用，设置选中，返回值, 不指定id(value)，全禁，全启用，全部清空选中
		 */
		if(handle == 'disabled'){ //#1 设置禁用
			if(value){
				$.each(value, function(){
					$tree.find('.lay-x-tree-leaf[lay-id='+this+']').children('a').addClass('layui-disabled');
					$tree.find('.lay-x-tree-leaf[lay-id='+this+']').children('a').children('input').prop('disabled', true);
					// 联动子节点
					if(subAct){
						$tree.find('.lay-x-tree-leaf[lay-id='+this+']').find('.lay-x-tree-leaf').each(function(){
							$(this).children('a').addClass('layui-disabled');
							$(this).children('a').children('input').prop('disabled', true);
						});
					}
				});
			}else{
				$tree.find('.lay-x-tree-leaf').children('a').each(function(){
					$(this).addClass('layui-disabled');
					$(this).children('input').prop('disabled', true);
				});
			}
		}else if(handle == 'enable'){ //#2 设置启用
			if(value.length){
				$.each(value, function(){
					$tree.find('.lay-x-tree-leaf[lay-id='+this+']').children('a').removeClass('layui-disabled');
					$tree.find('.lay-x-tree-leaf[lay-id='+this+']').children('a').children('input').prop('disabled', false);
				});
			}else{
				$tree.find('.lay-x-tree-leaf').children('a').each(function(){
					$(this).removeClass('layui-disabled');
					$(this).children('input').prop('disabled', false);
				});
			}
		}else if(handle == 'set'){ //#3 设置选中

			if(value.length){
				// 先清空
				$tree.find('.lay-x-tree-leaf').each(function(){
					$(this).children('a').removeClass('layui-this');
					$(this).children('a').children('input:checked').prop('checked', false);
				});
				
				// 最大选项处理
				value = options.check == 'checkbox' ? value.slice(0, options.max-1) : [String(value[0])];
				
				$.each(value, function(i, dom){
					var $node = $tree.find('.lay-x-tree-leaf[lay-id='+this+']');
					$node.children('a').children('input').prop('checked', true);

					// 传入数据
					_choice($node, subAct);
					// 展开最后一个
					if(i == (value.length - 1)){
						_spreadNodes($node);
					}
				});
			}else{ // 清空(多选有限制，暂时不提供全选)
				$tree.find('.lay-x-tree-leaf').children('a').each(function(){
					$(this).removeClass('layui-this');
					$(this).children('input').prop('checked', false);
				});
				$tree.find('.lay-x-tree-leaf')
			}
		}else if(handle == 'clear'){ //#4 清除(全部)禁用，选中
			$tree.find('.lay-x-tree-leaf').each(function(){
				$(this).children('a').removeClass('layui-this').removeClass('layui-disabled');
				$(this).find('input:checked').prop('checked', false).prop('disabled', false);
			});
			// 收回展开
			$tree.find('.'+options.icon.spread).removeClass(options.icon.spread).addClass(options.icon.contract);
			$tree.children('.lay-x-tree-leaf').find('.layui-show').removeClass('layui-show').addClass('layui-hide');
		}else{ //#5 取值, 不指定id(value)，返回已选项，传入all，返回全部
			if(value.length){//#5.1 树中已选项
				if(value[0] == 'all'){ //#5.2 传入all，返回全部
					data = options.data;
				}else{ // 返回指定id项数据
					$.each(value, function(){
						data.push(options.data[this]);
					});
				}
			}else{ // 返回指定项数据
				$tree.find('.layui-this').each(function(){
					data.push(options.data[$(this).parent('li').attr('lay-id')]);
				});
			}
			return data;
		}
		
		form.render();
	}

	exports(MOD_NAME, tree);
});
