//Copyright (C) 2015 <>< Charles Lohr, see LICENSE file for more info.
//
//This particular file may be licensed under the MIT/x11, New BSD or ColorChord Licenses.
var outputMsg;
var outputInfo;
var websocket;
var commsup = 0;

var mpfs_start_at = 65536; //1048576; NOTE: If you select 1048576, it will override the 65536 sector, but has much more room.
var flash_scratchpad_at = 524288;
var flash_blocksize = 65536;
var flash_sendsize = 256;
//Push objects that have:
// .request
// .callback = function( ref (this object), data );

var workqueue = [];
var wifilines = [];
var workarray = {};
var lastitem;

var sectionActivateEvents = {};
var sectionOpen = {};

var SystemMessageTimeout = null;
function IssueSystemMessage( msg )
{
	var elem = $( "#SystemMessage" );
	elem.hide();
	elem.html(  "<font size=+2>" + msg + "</font>" );
	elem.slideToggle( 'fast' );
	if( SystemMessageTimeout != null ) clearTimeout(SystemMessageTimeout);
	SystemMessageTimeout = setTimeout( function() { SystemMessageTimeout = null; $( "#SystemMessage" ).fadeOut( 'slow' ) }, 3000 );
}

function QueueOperation( command, callback )
{
	if( workarray[command] == 1 )
	{
		return;
	}

	workarray[command] = 1;
	var vp = new Object();
	vp.callback = callback;
	vp.request = command;
	workqueue.push( vp );
}

function addSection(name, content, id, activateEvent) {
	$('#MainMenu').append('<h3 id="'+id+'Clicker"><span>'+name+'</span></h3><div class="content" id="'+id+'">'+content+'</div>');
	sectionOpen[id] = localStorage["sh" + id] > 0.5;
	if(typeof activateEvent != 'undefined') {
		sectionActivateEvents[id] = activateEvent;
	}
}

function init()
{
  $output = $('#output');

  init_sections();

  // TODO: Add the local storage stuff -NM 2016-09-24
	$( ".collapsible" ).each(function( index ) {
		if( localStorage["sh" + this.id] > 0.5 )
		{
			$( this ).show().toggleClass( 'opened' );
//			console.log( "OPEN: " + this.id );
		}
	});

	$("#custom_command_response").val( "" );

	$( "#MainMenu > h3" ).click(function() {
		  $header = $(this);
		  $content = $header.next('.content');
			$header.toggleClass('open');
			$content.toggle();
			var contentId = $content[0].id;
			if($content.css('display') == 'block') {
				sectionOpen[contentId] = true;
				if(typeof sectionActivateEvents[contentId] != 'undefined')
					sectionActivateEvents[contentId]();
			}
			else {
				sectionOpen[contentId] = false;
			}
			return false;
	})

	console.log( "Load complete.\n" );
	Ticker();
}

window.addEventListener("load", init, false);


function StartWebSocket()
{
	outputMsg.innerHTML = "Connecting...";
	if( websocket ) websocket.close();
	workarray = {};
	workqueue = [];
	lastitem = null;
	websocket = new WebSocket(wsUri);
	websocket.onopen = function(evt) { onOpen(evt) };
	websocket.onclose = function(evt) { onClose(evt) };
	websocket.onmessage = function(evt) { onMessage(evt) };
	websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt)
{
	doSend('e' );
}

function onClose(evt)
{
	$('#SystemStatusClicker').css("color", "red" );
	commsup = 0;
}

var msg = 0;
var tickmessage = 0;
var lasthz = 0;
var time_since_hz = 10; //Make it realize it was disconnected to begin with.

function Ticker()
{
	setTimeout( Ticker, 1000 );

	lasthz = (msg - tickmessage);
	tickmessage = msg;
	if( lasthz == 0 )
	{
		time_since_hz++;
		if( time_since_hz > 3 )
		{
			$('#SystemStatusClicker').css("color", "red" );
			$('#SystemStatusClicker>span').text("System Offline" );
			if( commsup != 0 && !is_waiting_on_stations ) IssueSystemMessage( "Comms Lost." );
			commsup = 0;
			StartWebSocket();
		}
		else
			$('#SystemStatusClicker>span').text("System " + 0 + "Hz" );
	}
	else
	{
		time_since_hz = 0;
		$('#SystemStatusClicker>span').text( "System " + lasthz + "Hz" );
	}
}


function onMessage(evt)
{
	msg++;


	if( commsup != 1 )
	{
		commsup = 1;
		$('#SystemStatusClicker').css("color", "green" );
		IssueSystemMessage( "Comms Established." );
	}


	if( lastitem )
	{
		if( lastitem.callback )
		{
			lastitem.callback( lastitem, evt.data );
			lastitem = null;
		}
	}
	else
	{
		if( evt.data.length > 2 )
		{
			if(IsTabOpen('SystemStatus')) {
				var wxresp = evt.data.substr(2).split("\t");
				outputMsg.innerHTML = 'Messages: ' + msg ;
				outputInfo.innerHTML = "RSSI: " + wxresp[0] + " / IP: " + ((wxresp.length>1)?HexToIP( wxresp[1] ):"");
			}
		}
	}


	if( workqueue.length )
	{
		var elem = workqueue.shift();
		delete workarray[elem.request];

		if( elem.request )
		{
			doSend( elem.request );
			lastitem = elem;
			return;
		}
	}

	doSend('wx'); //Request RSSI.
}

function onError(evt)
{
	$('#SystemStatusClicker').css("color", "red" );
	commsup = 0;
}

function doSend(message)
{
	websocket.send(message);
}

function IsTabOpen( objname )
{
	return sectionOpen[objname];
}

function ShowHideEvent( objname )
{
	var obj = $( "#" + objname );
	obj.slideToggle( 'fast' ).toggleClass( 'opened' );
	var opened = obj.is( '.opened' );
	localStorage["sh" + objname] = opened?1:0;
	return opened!=0;
}


function IssueCustomCommand()
{
	QueueOperation( $("#custom_command").val(), function( req,data) { $("#custom_command_response").val( data ); } );
}

function MakeDragDrop( divname, callback )
{
	var obj = $("#" + divname);
	obj.on('dragenter', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$(this).css('border', '2px solid #0B85A1');
	});

	obj.on('dragover', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
	});

	obj.on('dragend', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$(this).css('border', '2px dotted #0B85A1');
	});

	obj.on('drop', function (e)
	{
		$(this).css('border', '2px dotted #0B85A1');
		e.preventDefault();
		var files = e.originalEvent.dataTransfer.files;

		//We need to send dropped files to Server
		callback(files);
	});
}


/* Utility functions ---------------------------------------------------------- */

function tohex8( c )
{
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function HexToIP( hexstr )
{
	if( !hexstr ) return "";
	return parseInt( hexstr.substr( 6, 2 ), 16 ) + "." +
		parseInt( hexstr.substr( 4, 2 ), 16 ) + "." +
		parseInt( hexstr.substr( 2, 2 ), 16 ) + "." +
		parseInt( hexstr.substr( 0, 2 ), 16 );
}

/* MD5 implementation minified from: http://blog.faultylabs.com/files/md5.js
 Javascript MD5 library - version 0.4 Coded (2011) by Luigi Galli - LG@4e71.org - http://faultylabs.com
 Thanks to: Roberto Viola  The below code is PUBLIC DOMAIN - NO WARRANTY!
 */
"undefined"==typeof faultylabs&&(faultylabs={}),faultylabs.MD5=function(n){function r(n){var r=(n>>>0).toString(16);return"00000000".substr(0,8-r.length)+r}function t(n){for(var r=[],t=0;t<n.length;t++)r=r.concat(s(n[t]));return r}function e(n){for(var r=[],t=0;8>t;t++)r.push(255&n),n>>>=8;return r}function o(n,r){return n<<r&4294967295|n>>>32-r}function a(n,r,t){return n&r|~n&t}function f(n,r,t){return t&n|~t&r}function u(n,r,t){return n^r^t}function i(n,r,t){return r^(n|~t)}function c(n,r){return n[r+3]<<24|n[r+2]<<16|n[r+1]<<8|n[r]}function s(n){for(var r=[],t=0;t<n.length;t++)if(n.charCodeAt(t)<=127)r.push(n.charCodeAt(t));else for(var e=encodeURIComponent(n.charAt(t)).substr(1).split("%"),o=0;o<e.length;o++)r.push(parseInt(e[o],16));return r}function l(){for(var n="",t=0,e=0,o=3;o>=0;o--)e=arguments[o],t=255&e,e>>>=8,t<<=8,t|=255&e,e>>>=8,t<<=8,t|=255&e,e>>>=8,t<<=8,t|=e,n+=r(t);return n}function y(n){for(var r=new Array(n.length),t=0;t<n.length;t++)r[t]=n[t];return r}function h(n,r){return 4294967295&n+r}function p(){function n(n,r,t,e){var a=m;m=U,U=d,d=h(d,o(h(b,h(n,h(r,t))),e)),b=a}var r=A.length;A.push(128);var t=A.length%64;if(t>56){for(var s=0;64-t>s;s++)A.push(0);t=A.length%64}for(s=0;56-t>s;s++)A.push(0);A=A.concat(e(8*r));var y=1732584193,p=4023233417,g=2562383102,v=271733878,b=0,d=0,U=0,m=0;for(s=0;s<A.length/64;s++){b=y,d=p,U=g,m=v;var I=64*s;n(a(d,U,m),3614090360,c(A,I),7),n(a(d,U,m),3905402710,c(A,I+4),12),n(a(d,U,m),606105819,c(A,I+8),17),n(a(d,U,m),3250441966,c(A,I+12),22),n(a(d,U,m),4118548399,c(A,I+16),7),n(a(d,U,m),1200080426,c(A,I+20),12),n(a(d,U,m),2821735955,c(A,I+24),17),n(a(d,U,m),4249261313,c(A,I+28),22),n(a(d,U,m),1770035416,c(A,I+32),7),n(a(d,U,m),2336552879,c(A,I+36),12),n(a(d,U,m),4294925233,c(A,I+40),17),n(a(d,U,m),2304563134,c(A,I+44),22),n(a(d,U,m),1804603682,c(A,I+48),7),n(a(d,U,m),4254626195,c(A,I+52),12),n(a(d,U,m),2792965006,c(A,I+56),17),n(a(d,U,m),1236535329,c(A,I+60),22),n(f(d,U,m),4129170786,c(A,I+4),5),n(f(d,U,m),3225465664,c(A,I+24),9),n(f(d,U,m),643717713,c(A,I+44),14),n(f(d,U,m),3921069994,c(A,I),20),n(f(d,U,m),3593408605,c(A,I+20),5),n(f(d,U,m),38016083,c(A,I+40),9),n(f(d,U,m),3634488961,c(A,I+60),14),n(f(d,U,m),3889429448,c(A,I+16),20),n(f(d,U,m),568446438,c(A,I+36),5),n(f(d,U,m),3275163606,c(A,I+56),9),n(f(d,U,m),4107603335,c(A,I+12),14),n(f(d,U,m),1163531501,c(A,I+32),20),n(f(d,U,m),2850285829,c(A,I+52),5),n(f(d,U,m),4243563512,c(A,I+8),9),n(f(d,U,m),1735328473,c(A,I+28),14),n(f(d,U,m),2368359562,c(A,I+48),20),n(u(d,U,m),4294588738,c(A,I+20),4),n(u(d,U,m),2272392833,c(A,I+32),11),n(u(d,U,m),1839030562,c(A,I+44),16),n(u(d,U,m),4259657740,c(A,I+56),23),n(u(d,U,m),2763975236,c(A,I+4),4),n(u(d,U,m),1272893353,c(A,I+16),11),n(u(d,U,m),4139469664,c(A,I+28),16),n(u(d,U,m),3200236656,c(A,I+40),23),n(u(d,U,m),681279174,c(A,I+52),4),n(u(d,U,m),3936430074,c(A,I),11),n(u(d,U,m),3572445317,c(A,I+12),16),n(u(d,U,m),76029189,c(A,I+24),23),n(u(d,U,m),3654602809,c(A,I+36),4),n(u(d,U,m),3873151461,c(A,I+48),11),n(u(d,U,m),530742520,c(A,I+60),16),n(u(d,U,m),3299628645,c(A,I+8),23),n(i(d,U,m),4096336452,c(A,I),6),n(i(d,U,m),1126891415,c(A,I+28),10),n(i(d,U,m),2878612391,c(A,I+56),15),n(i(d,U,m),4237533241,c(A,I+20),21),n(i(d,U,m),1700485571,c(A,I+48),6),n(i(d,U,m),2399980690,c(A,I+12),10),n(i(d,U,m),4293915773,c(A,I+40),15),n(i(d,U,m),2240044497,c(A,I+4),21),n(i(d,U,m),1873313359,c(A,I+32),6),n(i(d,U,m),4264355552,c(A,I+60),10),n(i(d,U,m),2734768916,c(A,I+24),15),n(i(d,U,m),1309151649,c(A,I+52),21),n(i(d,U,m),4149444226,c(A,I+16),6),n(i(d,U,m),3174756917,c(A,I+44),10),n(i(d,U,m),718787259,c(A,I+8),15),n(i(d,U,m),3951481745,c(A,I+36),21),y=h(y,b),p=h(p,d),g=h(g,U),v=h(v,m)}return l(v,g,p,y).toUpperCase()}var A=null,g=null;return"string"==typeof n?A=s(n):n.constructor==Array?0===n.length?A=n:"string"==typeof n[0]?A=t(n):"number"==typeof n[0]?A=n:g=typeof n[0]:"undefined"!=typeof ArrayBuffer?n instanceof ArrayBuffer?A=y(new Uint8Array(n)):n instanceof Uint8Array||n instanceof Int8Array?A=y(n):n instanceof Uint32Array||n instanceof Int32Array||n instanceof Uint16Array||n instanceof Int16Array||n instanceof Float32Array||n instanceof Float64Array?A=y(new Uint8Array(n.buffer)):g=typeof n:g=typeof n,g&&alert("MD5 type mismatch, cannot process "+g),p()};
