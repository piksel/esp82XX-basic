function TwiddleGPIO( gp )
{
	var st = "GF";
	st += gp;
	QueueOperation( st );
}

function GPIOInput( gp )
{
	var st = "GI";
	st += gp;
	QueueOperation( st );
}

function GPIOUpdate(req,data) {
	var secs = data.split( "\t" );
	var op = 0;
	var n = Number(secs[2]);
	var m = Number(secs[1]);

	for( op = 0; op < 16; op++ )
	{
		var b = $( "#ButtonGPIO" + op );
		if( b )
		{
			if( 1<<op & n )
			{
				b.css("background-color","red" );
				b.css("color","black" );
				b.prop( "value", "1" );
			}
			else
			{
				b.css("background-color","black" );
				b.css("color","white" );
				b.prop( "value", "0" );
			}
		}

		b = $( "#BGPIOIn" + op );
		if( b )
		{
			if( 1<<op & m )
			{
				b.css("background-color","blue" );
				b.css("color","white" );
				b.attr( "value", "out" );
			}
			else
			{
				b.css("background-color","green" );
				b.css("color","white" );
				b.attr( "value", "in" );
			}
		}
	}
	if( IsTabOpen('GPIOs') )
	{
		QueueOperation( "GS", GPIOUpdate );
	}
}

function GPIODataTicker()
{
	if( !IsTabOpen('GPIOs') ) return;
	QueueOperation( "GS", GPIOUpdate );
	setTimeout( GPIODataTicker, 500 );
}


function GPIODataTickerStart()
{
	if( IsTabOpen('GPIOs') )
		GPIODataTicker();
}
