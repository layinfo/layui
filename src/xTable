/**
 @Name：layui.xTable 1.0 增强版table
 @Author:   hyfeng
 @License：MIT
 
 用法：
	xTable.render({
		elem: '#tagsInput', // id
		toolbtn: [
			// name 等于按钮 lay-event，用于监听事件
			{name:'add',title:'新增', skin:'layui-btn-sm layui-btn-warm'},  
			{name:'edit',title:'编辑', skin:'layui-btn-sm'}
		],
		autoSort: false, // 服务端排序
		cols: [[
			{type: 'numbers'},
			{field: 'name', title: '姓名', width:100, sort: true,search:'text'}, // 开启搜索：search:'text' ,仅支持:time,text
			{field: 'section_name', title: '部门', width:100, sort: true,search:'text'},
			{field: 'position', title: '职位', width:100,search:'time'},// 
		]],
		..... (其他参考layui.table)
	});
	
	搜索时，可以传入额外参数
	xTable.extra(filter, {key:value, ...}); //设置
	xTable.extra(filter); //清除 
 */
 
layui.define(['jquery','form','table','laydate'],function(exports){
	"use strict";
	var $ = layui.jquery,
		form = layui.form,
		table = layui.table,
		laydate= layui.laydate,
	
		//字符常量
		MOD_NAME = 'xTable', 
		
		//外部接口
		_table = {
			config: {},
			
			//事件监听，调用table on方法
			on: function(events, callback){
				return table.on(events, callback);
			},
			
			// 获取选中行
			checkStatus: function(filter){
				return table.checkStatus(filter);
			},
			
			// 重置表格尺寸
			resize: function(filter){
				return table.resize(filter);
			},
			
			// 表格重载
			reload: function(filter, opt){
				
				return table.reload(filter, opt);
			},
			
			/**
			 * 绑定额外参数(仅搜索可用，用后记得清空，否则会一携带)
			 * @param (mixed) filter 过滤器|选择器
			 * @param (mixed) param  参数，为空时清除，格式: {field:name,...}
			 * @return nothing
			 */
			extra: function(filter, param){
				var $elem = $(filter), param = param || null;
				if($elem.length == 0) $elem = $('table[lay-filter='+filter+']');
				if($elem.length == 0) return console.error('xTable: '+filter+' 节点不存在！');
				
				$elem.data('extra', param);
			},
			
			/**
			 * 渲染入口
			 * @param (mixed) options 配置内容|{}
			 * @return mixed
			 */
			render: function(options){
				return _render(options);
			},
		}, 

		//构造器
		Class = function(options){
			var that = this;
			
			that.config = $.extend({}, that.config, _table.config, options);
			that.render();
		};
	
	//默认配置
	Class.prototype.config = {
		// 表头工具栏按钮
		toolbtn: []
	};
	
	// table 渲染
	Class.prototype.render = function(){
		var that = this,
			options = that.config;
		
		// 表格lay-filter
		if($(options.elem).length == 0) return;
		options.filter = $(options.elem).attr('id') || 'dataTable_'+options.elem;
		if(!$(options.elem).attr('lay-filter')) $(options.elem).attr(options.filter);

		// sort 默认改为服务器端排序
		options.autoSort= options.autoSort || false;
		// toolbar
		if(this.addToolBar()){
			options.toolbar = this.addToolBar();
		}else{
			// 只要有一项搜索，显示右侧栏
			$.each(options.cols[0], function(i, val){
				if(val.search){
					options.toolbar = true;
					return false;
				}
			});
		}
		// method
		options.method  = options.method || 'post';
		// done
		var thisDone = options.done || null;
		delete options.done;
		
		options.done = function(res, curr, count){
			var $dataTable = $('.layui-table-view[lay-id='+this.id+']');

			//耗时（接口请求+视图渲染）
			console.log('xTable: 数据量('+res.data.length+'条)，加载耗时('+this.time+')');
			// 状态栏显示
			//this.elem.siblings('.layui-table-view').children('.layui-table-page').children('div').after('<div style="position: absolute;top:8px;right:8px;color:#999;">耗时:'+parseInt(this.time)/1000+'s</div>');
			
			// 渲染搜索栏
			that.addSearch($dataTable);

			// 绑定事件
			that.showDown().enter().serviceSort();
			typeof thisDone === 'function' && thisDone(res, curr, count);
		}
		
		table.render( options );
	};
	
	// 标签容器
	Class.prototype.addToolBar = function(){
		var that = this,
			options = that.config;
		
		var firstSearch = 'text', searchValue = '', openToolbar = false;
		var toolbarHtml = ['<div><div class="layui-btn-container layui-clear">'+
			(function(){
				if(options.toolbtn && $.isArray(options.toolbtn) && options.toolbtn.length){
					var html = '';
					openToolbar = true; // 开启工具栏
					layui.each(options.toolbtn, function(i,v){
						html += '<button class="layui-btn '+v.skin+'" lay-event="'+v.name+'" lay-filter="'+v.name+'">'+v.title+'</button>';
					});
					return html;
				}
			})(),
		  '</div></div>'].join('');

		return openToolbar ? toolbarHtml : '';
	}
	
	// 添加搜索
	Class.prototype.addSearch = function($table){
		var that = this,
			options = that.config;
		
		var $toolSelf = $table.children('.layui-table-tool').children('.layui-table-tool-self');
		
		// 防止重复渲染
		if($table.find('div[lay-event=LAYTABLE_SEARCH]').length == 0){
			var searchHtml = (function(){
				var openSearchForm = false;
				var formHtml = ['<!-- 搜索栏 -->',
				'<div class="layui-inline" title="搜索" lay-event="LAYTABLE_SEARCH"><i class="layui-icon layui-icon-search"></i>',
				'<form class="layui-table-search" lay-filter="tableSearchForm">',
					'<div class="">',
						'<div class="layui-table-search-select" style="float:left;width: 70px;">',
							'<div class="layui-unselect layui-form-select">',
								'<input type="hidden" name="param" value="">',
								'<input type="hidden" name="search_field" value="">',
								'<div class="layui-select-title">',
									'<input type="text" placeholder="请选择" value="" readonly="" class="layui-input layui-unselect"><i class="layui-edge"></i>',
								'</div>',
								'<dl class="layui-anim layui-anim-upbit">',
									(function(){
										var dd = '', first = true;
										layui.each(options.cols[0], function(i, item){
											if(item.search){
												openSearchForm = true; // 只要有一项，开启搜索栏
												item.search = item.search == 'time'?'time':'text';
												if(first){
													dd += '<dd lay-value="'+item.field+'" action="'+item.search+'" class="layui-table-search-dl layui-this">'+item.title+'</dd>'; 
													first = false;
												}else{
													dd += '<dd lay-value="'+item.field+'" action="'+item.search+'" class="layui-table-search-dl">'+item.title+'</dd>';
												}
											}
										});
										return dd;
									})(),
								'</dl>',
							'</div>',
						'</div>',
						'<div class="layui-table-search-input" style="padding-left: 70px;">',
							'<input type="text" name="keyword" placeholder="关键字搜索" id="layui-search-keyword" class="layui-input">',
							'<input type="text" name="filter_time" placeholder="选择时间段" id="layui-search-time" class="layui-input layui-hide">',
							'<i class="layui-icon layui-icon-search"></i>',
						'</div>',
					'</div>',
				'</form>',
				'</div>'].join('');
				return openSearchForm ? formHtml : '';
				})();
			
			// 添加搜索图标
			$toolSelf.prepend( searchHtml );
		
			// 初始化时间段输入框 
			laydate.render({ 
				elem: '#layui-search-time',
				range: '~' //或 range: '~' 来自定义分割字符
			});
		}
		
		// 初始化搜索值
		var searchData = $(options.elem).data('search');
		var $thisSelect = $toolSelf.find('.layui-table-search-select');
		if(searchData){
			$thisSelect.find('dd').removeClass('layui-this');
			$thisSelect.find('dd[lay-value='+searchData.search_field+']').addClass('layui-this'); 
			$('#layui-search-keyword').val(searchData.keyword);
			$('#layui-search-time').val(searchData.filter_time);
			if(searchData.filter_time){
				$('#layui-search-time').removeClass('layui-hide');
				$('#layui-search-keyword').addClass('layui-hide');
			}
		}
		
		$thisSelect.find('input[name=search_field]').val($thisSelect.find('dd.layui-this').attr('lay-value'));
		$thisSelect.find('.layui-select-title>input').val($thisSelect.find('dd.layui-this').text());
		
		// 添加搜索图标点击
		$toolSelf.on('click', 'div[lay-event=LAYTABLE_SEARCH]', function(e){
			var $form = $(this).children('form.layui-table-search');
			if($(e.target).closest('.layui-table-search').length == 0){
				$form.toggleClass('layui-hide');
			}
		});
		
		// 添加切换输入框
		$toolSelf.on('click', '.layui-table-search-dl', function(e){
			var $dd = $(this), $inputDiv = $('.layui-table-search-input');
			var act = $dd.attr('action') == 'time' ? 'filter_time' : 'keyword';
			
			// 先全部隐藏，清空值，再显示
			$inputDiv.find('input').addClass('layui-hide').val('');
			$inputDiv.find('[name='+act+']').removeClass('layui-hide');
        
			// 关闭下拉，切换显示
			$dd.addClass('layui-this').siblings('dd').removeClass('layui-this');
			$dd.closest('.layui-form-selected').removeClass('layui-form-selected');
			$dd.closest('.layui-form-select').find('input[name=search_field]').val($dd.attr('lay-value'));
			$dd.closest('.layui-form-select').find('.layui-select-title>input').val($dd.text());
		});
		
		return that;
	}
	
	// 搜索事件
	Class.prototype.enter = function(oTable){
		var that = this,
			options = that.config;
		
		var $tableView = $(options.elem).siblings('.layui-table-view');
		$tableView.find('.layui-table-search-input').on('keypress blur', 'input', function(e){
			var keynum = (e.keyCode ? e.keyCode : e.which);  
			var $form  = $(this).closest('form');
			var searchData = $(options.elem).data('search');
			var extra = $(options.elem).data('extra');

			// 回车 || 失去焦点时(排除选时间，同上次搜索条件)
			if($(this).attr('name') == 'filter_time' && e.type == 'focusout') return false;

			if(keynum == '13' || e.type == 'focusout'){  
				var data = {};
				
				data.search_field= $form.find('.layui-this').attr('lay-value');
				data.show_field  = $form.find('.layui-this').text();
				data.keyword     = $form.find('input[name=keyword]').val();
				data.filter_time = $form.find('input[name=filter_time]').val();
				
				// 额外参数
				data = $.extend({}, data, extra);

				// 缓存搜索数据，并提交数据 
				$(options.elem).data('search', data);
				// 重载表格，第一次搜索，或者关键字改变
				if(!searchData || (data.keyword != searchData.keyword || data.filter_time != searchData.filter_time)){
					table.reload(options.filter, {where: data});
				}

				// 阻止回车事件触发表单提交
				return false;
			}
		});
		
		// 点击搜索图标
		$tableView.find('.layui-table-search-input').on('click', '.layui-icon-search', function(e){
			var $form  = $(this).closest('form');
			var data = {}, 
				searchData = $(options.elem).data('search'),
				extra = $(options.elem).data('extra');
				
			data.search_field = $form.find('.layui-this').attr('lay-value');
			data.show_field = $form.find('.layui-this').text();
			data.keyword = $form.find('input[name=keyword]').val();
			data.filter_time = $form.find('input[name=filter_time]').val();
			
			// 额外参数
			data = $.extend({}, data, extra);

			// 缓存搜索数据，并提交数据 
			$(options.elem).data('search', data);
			// 重载表格，第一次搜索，或者关键字改变
			if(!searchData || (data.keyword != searchData.keyword || data.filter_time != searchData.filter_time)){
				table.reload(options.filter, {where: data});
			}

			// 阻止回车事件触发表单提交
			return false;
		});
			
		return that;
	}
	
	/**
	 * 展开/折叠下拉框
	 */
	Class.prototype.showDown = function(){
		var that = this,
			options = that.config;

		//点击标题区域
        $(options.elem).siblings('.layui-table-view').find('.layui-table-search-select').on('click', '.layui-select-title', function(e){
			var $selected = $(this).closest('.layui-form-selected');

			if($selected.length){
				// 关闭下拉
				$selected.removeClass('layui-form-selected');
            }else{
				// 先关闭其他展开下拉,
				$('.layui-form-selected').removeClass('layui-form-selected');
				// 展开当前下拉
				$(this).closest('.layui-form-select').addClass('layui-form-selected');
            };
        }); 
		
		// 点击下拉区域以外，关闭全部下拉
		$(document).on("click", function (e) {
			var e = e || window.event; //浏览器兼容性
			
			if($(e.target).closest(".layui-form-select").length == 0){
				$('.layui-form-selected').removeClass('layui-form-selected');
			}
		}); 
		
		return that;
	}
	
	/**
	 * 切换输入框(仅支持时间段，关键字搜索，单选、多选没必要，可以用排序)
	 */
	Class.prototype.switchInput = function($tableView){
		var that = this,
			options = that.config;
		console.log($tableView.find('.layui-table-search-dl'));
        $tableView.on('click', '.layui-table-search-dl', function(e){
			var $dd = $(this), $inputDiv = $('.layui-table-search-input');
			var act = $dd.attr('action') == 'time' ? 'filter_time' : 'keyword';
			
			// 先全部隐藏，清空值，再显示
			$inputDiv.find('input').addClass('layui-hide').val('');
			$inputDiv.find('[name='+act+']').removeClass('layui-hide');
        
			// 关闭下拉，切换显示
			$dd.addClass('layui-this').siblings('dd').removeClass('layui-this');
			$dd.closest('.layui-form-selected').removeClass('layui-form-selected');
			$dd.closest('.layui-form-select').find('input[name=search_field]').val($dd.attr('lay-value'));
			$dd.closest('.layui-form-select').find('.layui-select-title>input').val($dd.text());
		
			return false;
		}); 
		
		return that;
	}
	
	/**
	 * 切换服务端排序
	 */
	Class.prototype.serviceSort = function(){
		var that = this,
			options = that.config;

        if(options.autoSort === false){
			//服务端排序事件 ，autoSort: false关闭自动排序
			table.on('sort('+options.filter+')', function(obj){
				var extra = $(options.elem).data('extra');
				var data = $.extend({}, {field: obj.field,order: obj.type}, extra);

				table.reload(options.filter, {
					initSort: obj, //记录初始排序，如果不设的话，将无法标记表头的排序状态。
					where: data
				});
			});
		} 
		
		return that;
	}

	/* 
	 * ==================
	 * 私有方法
	 * ==================
	 */
	
	//核心入口
	function _render(options){ 
	
		//添加专属的style
		if($('#lay-x-table-style').length==0){
			var style = [
					// 公用 表头搜索栏
					'.layui-table-view .layui-table-search{width: 210px;position: relative;right: 190px;top: -26px;}',
					'.layui-table-view .layui-table-search input{padding-right:28px;height:32px;}',
					'.layui-table-view .layui-table-search .layui-form-select{text-align:left;}',
					'.layui-table-view .layui-table-search i.layui-icon-search{position:absolute;top:10px;right:10px;cursor: pointer;}',
					'.layui-table-view .layui-table-search .layui-form-select dl{top:36px;}',
				
					'@media screen and (max-width: 768px) { .layui-table-view .layui-table-search{right: 80px;top: 10px;} }'
				].join('');
			
			$('<style id="lay-x-table-style"></style>').text(style).appendTo($('head'));
		}

		return new Class(options);
	}

	exports(MOD_NAME, _table);
});
