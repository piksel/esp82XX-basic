did_wifi_get_config = false;
is_data_ticker_running = false;
is_waiting_on_stations = false;

function ScanForWifi()
{
	QueueOperation('WS', null);
	is_waiting_on_stations=true;
	IssueSystemMessage( "Scanning for Wifi..." );
}

function KickWifiTicker()
{
	if( !is_data_ticker_running )
		WifiDataTicker();
}

function BSSIDClick( i )
{
	var tlines = wifilines[i];
	document.wifisection.wifitype.value = 1;
	document.wifisection.wificurname.value = tlines[0].substr(1);
	document.wifisection.wificurpassword.value = "";
	document.wifisection.wifimac.value = tlines[1];
	document.wifisection.wificurchannel.value = 0;

	ClickOpmode( 1 );
	return false;
}

function ClickOpmode( i )
{
	if( i == 1 )
	{
		document.wifisection.wificurname.disabled = false;
		document.wifisection.wificurpassword.disabled = false;
		document.wifisection.wifimac.disabled = false;
		document.wifisection.wificurchannel.disabled = true;
	}
	else
	{
		document.wifisection.wificurname.disabled = false;
		document.wifisection.wificurpassword.disabled = true;
		document.wifisection.wificurpassword.value = "";
		document.wifisection.wifimac.disabled = true;
		document.wifisection.wificurchannel.disabled = false;
	}
}

function WifiDataTicker()
{
	if( IsTabOpen('WifiSettings') )
	{
		is_data_ticker_running = true;

		if( !did_wifi_get_config )
		{
			QueueOperation( "WI", function(req,data)
			{
				var params = data.split( "\t" );

				var opmode = Number( params[0].substr(2) );
				document.wifisection.wifitype.value = opmode;
				document.wifisection.wificurname.value = params[1];
				document.wifisection.wificurpassword.value = params[2];
				document.wifisection.wifimac.value = params[3];
				document.wifisection.wificurchannel.value = Number( params[4] );

				ClickOpmode( opmode );
				did_wifi_get_config = true;
			} );
		}

		QueueOperation( "WR", function(req,data) {
			var lines = data.split( "\n" );
			var innerhtml;
			if( data[0] == '!' ) return;  //If no APs, don't deal with list.

			if( lines.length < 3 )
			{
				innerhtml = "No APs found.  Did you scan?";
				if( is_waiting_on_stations )
				{
					IssueSystemMessage( "No APs found." );
					is_waiting_on_stations = false;
				}
			}
			else
			{
				if( is_waiting_on_stations )
				{
					IssueSystemMessage( "Scan Complete." );
					is_waiting_on_stations = false;
				}

				innerhtml = "<TABLE border=1><TR><TH>SSID</TH><TH>MAC</TH><TH>RS</TH><TH>Ch</TH><TH>Enc</TH></TR>"
				wifilines = [];
				for( i = 1; i < lines.length-1; i++ )
				{
					tlines = lines[i].split( "\t" );
					wifilines.push(tlines);
					var bssidval = "<a href='javascript:void(0);' onclick='return BSSIDClick(" + (i -1 )+ ")'>" + tlines[1];
					innerhtml += "<TR><TD>" + tlines[0].substr(1) + "</TD><TD>" + bssidval + "</TD><TD>" + tlines[2] + "</TD><TD>" + tlines[3] + "</TD><TD>" + tlines[4] + "</TD></TR>";
				}
			}
			innerhtml += "</TABLE>";
			document.getElementById("WifiStations").innerHTML = innerhtml;
		} );
		setTimeout( WifiDataTicker, 500 );
	}
	else
	{
		is_data_ticker_running = 0;
	}
}

function ChangeWifiConfig()
{

	var st = "W";
	st += document.wifisection.wifitype.value;
	st += "\t" + document.wifisection.wificurname.value;
	st += "\t" + document.wifisection.wificurpassword.value;
	st += "\t" + document.wifisection.wifimac.value;
	st += "\t" + document.wifisection.wificurchannel.value;
	QueueOperation( st );
	did_wifi_get_config = false;
}
