/*
 * Chive - web based MySQL database management
 * Copyright (C) 2009 Fusonic GmbH
 * 
 * This file is part of Chive.
 *
 * Chive is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * Chive is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 */

var currentLocation = window.location.href;
var editing = false;
var globalPost = {};

function checkLocation() 
{
	if(window.location.href != currentLocation) 
	{
		refresh();
	}
}

function reload() 
{
	location.reload();
}

function refresh() 
{
	currentLocation = window.location.href;
	newLocation = currentLocation
		.replace(/\?(.+)#/, '')
		.replace('#', '/')					// Replace # with /
		.replace(/([^:])\/+/g, '$1/');		// Remove multiple slashes
	$.post(newLocation, globalPost, function(response) {
		var content = document.getElementById('content');
		content.innerHTML = response;
		var scripts = content.getElementsByTagName('script');
		for(var i = 0; i < scripts.length; i++)
		{
			$.globalEval(scripts[i].innerHTML);
		}
		init();
		var globalPost = {};
		AjaxResponse.handle(response);
	});
	return false;
}

function init() 
{
	$('table.list').each(function() {
		var tBody = this.tBodies[0];
		var rowCount = tBody.rows.length;
		var currentClass = 'odd';
		for(var i = 0; i < rowCount; i++)
		{
			if(!tBody.rows[i].className.match('noSwitch'))
			{
				if(currentClass == 'even')
				{
					currentClass = 'odd';
				}
				else
				{
					currentClass = 'even';
				}
			}
			tBody.rows[i].className += ' ' + currentClass;
		}
	});
	
	// Add checkboxes to respective tables
	try 
	{
		$('table.addCheckboxes').addCheckboxes().removeClass('addCheckboxes');
		$('table.editable').editableTable().removeClass('editable');
	}
	catch(exception) {
		// @todo (rponudic) remove
	}
	
	// Unset editing
	editing = false;
}

function navigateTo(_url, _post)
{
	globalPost = _post;
	window.location.href = _url;
	
	return false;
}

$(document).ready(function()
{
	// Load sideBar
	var sideBar = $("#sideBar");
	
	$('body').layout({
		
		// General
		applyDefaultStyles: true,

		// North
		north__size: 40,
		north__resizable: false,
		north__closable: false,
		north__spacing_open: 1,

		// West
		west__size: userSettings.sidebarWidth,
		west__initClosed: userSettings.sidebarState == 'closed',
		west__onresize_end: function () {
			sideBar.accordion('resize');
			if($('.ui-layout-west').width() != userSettings.sidebarWidth)
			{
				// Save
				userSettings.sidebarWidth = $('.ui-layout-west').width(); 
				$.post(baseUrl + '/ajaxSettings/set', {
						name: 'sidebarWidth',
						value: $('.ui-layout-west').width()
					}
				);
			}
			return;
		},
		west__onclose_end: function () {
			sideBar.accordion('resize');
			// Save
			$.post(baseUrl + '/ajaxSettings/set', {
					name: 'sidebarState',
					value: 'closed'
				}
			);
			return;
		},
		west__onopen_end: function () {
			sideBar.accordion('resize');
			// Save
			$.post(baseUrl + '/ajaxSettings/set', {
					name: 'sidebarState',
					value: 'open'
				}
			);
			return;
		}
	});
	

	// ACCORDION - inside the West pane
	sideBar.accordion({
		animated: "slide",
		addClasses: false,
		autoHeight: true,
		collapsible: false,
		fillSpace: true,
		selectedClass: "active"
	});
	
	// Trigger resize event for sidebar accordion - doesn't work in webkit-based browsers
	sideBar.accordion('resize');
	

	// Setup list filters

	$('#schemaList').setupListFilter($('#schemaSearch'));
	$('#tableList').setupListFilter($('#tableSearch'));
	$('#viewList').setupListFilter($('#viewSearch'));
	$('#bookmarkList').setupListFilter($('#bookmarkSearch'));
	

	
	/*
	 * Ajax functions
	 */ 
	
	// START
	$(document).ajaxStart(function() {
		$('#loading').css({'background-image': 'url(' + baseUrl + '/images/loading4.gif)'}).fadeIn();
		//$('#loading2').show();
	});
	
	// STOP
	$(document).ajaxStop(function() {
		//$('#loading2').hide();
		$('#loading').css({'background-image': 'url(' + baseUrl + '/images/loading5.gif)'}).fadeOut();
	});
	
	// ERROR
	$(document).ajaxError(function() {
		Notification.add('warning', 'Ajax request failed', 'Click <a href="javascript:void(0);" onclick="reload();">here</a> to reload site.', null);
		$('#loading').css({'background-image': 'url(' + baseUrl + '/images/loading5.gif)'}).fadeOut();
	});

	/*
	 * Change jQuery UI dialog defaults
	 */
	$.ui.dialog.defaults.autoOpen = false;
	$.ui.dialog.defaults.modal = true;
	$.ui.dialog.defaults.resizable = false;


	/*
	 * Misc
	 */
	setInterval(checkLocation, 100);
	
	if(currentLocation.indexOf('#') > -1)
	{
		refresh();
	}
	
	/*
	 * Keepalive packages
	 */
	setInterval(function() {
		$.post(baseUrl + '/site/keepAlive', function(response) {
			if(response != 'OK') {
				reload();
			}
		});
	}, 300000);	//Every 5 minutes
	
})
.keydown(function(e) 
{
	if(e.keyCode >= 48 
		&& e.keyCode <= 90
		&& !e.altKey && !e.ctrlKey && !e.shiftKey 
		&& (e.target == null || (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA' && e.target.tagName != 'SELECT')))
	{
		var element = $('#tableSearch:visible, #schemaSearch:visible');
		if(element.length == 1)
		{
		element.get(0).focus();
		}
	}
});

var AjaxResponse = {
	
	handle: function(data)
	{
		if(!data)
			return; 
			
		try 
		{
			data = JSON.parse(data);
		}
		catch(err) {}
		
		
		if(data.redirectUrl) 
		{
			window.location.href = data.redirectUrl;
		}
		
		if(data.reload)
		{
			reload();
		}
		
		if(data.refresh) 
		{
			refresh();
		}
		
		if(data.notifications && data.notifications.length > 0) 
		{
			$.each(data.notifications, function() {
				Notification.add(this.type, this.title, this.message, this.code, this.options);
			});
		}
		
		if($.isArray(data.js))
		{
			for(var i = 0; i < data.js.length; i++)
			{
				eval(data.js[i]);
			}
		}
	}
	
};


String.prototype.trim = function() {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

String.prototype.startsWith = function(str)
{
	return (this.match("^"+str)==str);
}

/*
 * Keyboard shortcuts
 */
$(document).bind('keydown', 'pageup', function() {
	if($('ul.yiiPager li.selected').next('li').length > 0)
	{
		location.href = $('ul.yiiPager li.selected').next('li').find('a').attr('href');
	}
	
});
$(document).bind('keydown', 'pagedown', function() {
	if($('ul.yiiPager li.selected').prev('li').length > 0)
	{
		location.href = $('ul.yiiPager li.selected').prev('li').find('a').attr('href');
	}
	
});
$(document).bind('keydown', 'shift+pagedown', function() {
	if($('ul.yiiPager li.selected').prev('li').length > 0)
	{
		location.href = $('ul.yiiPager li.selected').prev('li').find('a').attr('href');
	}
	
});
/*
 * Language
 */

var lang = {
	
	get: function(category, variable, parameters) 
	{
		var package = lang[category];
		if(package && package[variable])
		{
			variable = package[variable];
			if(parameters)
			{
				for(var key in parameters)
				{
					variable = variable.replace(key, parameters[key]);
				}
			}
		}
		return variable;
	}
	
};

$.datepicker.setDefaults($.datepicker.regional['de']);

function download(_url, _data) 
{
	io = document.createElement('iframe');
	io.src = _url + (_data ? '?' + $.param(_data) : '');
	io.style.display = 'none';
	io = $(io);
	$('body').append(io);
	
	setTimeout(function() {
		io.remove();
	}, 5000);
	
}