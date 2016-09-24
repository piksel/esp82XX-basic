var sysset = null;
var snchanged = false;
var sdchanged = false;

var lastpeerdata = "";

function CallbackForPeers(req,data)
{
	if( data == lastpeerdata ) return;
	lastpeerdata = data;
	var lines = data.split( "\n" );
	var searchcount = 0;
	if( lines.length > 0 )
	{
		var line1 = lines[0].split( "\t" );
		if( line1.length > 1 ) searchcount = Number( line1[1] );
	}

	var htm = '<table style="width:150"><tr><th>Address</th><th>Service</th><th>Name</th><th>Description</th></tr>';
	for( var i = 1; i < lines.length; i++ )
	{
		var elems = lines[i].split( "\t" );
		if( elems.length < 4 ) continue;
		var ip = HexToIP( elems[0] );

		htm += "<tr><td><a href=http://" + ip + ">" + ip + "</a></td><td>" + elems[1] +
			"</td><td>" + elems[2] + "</td><td>" + elems[3] + "</td></tr>";
	}
	htm += "</table>";
	if( searchcount == 0 )
		htm += "<button onclick=\"QueueOperation('BS')\">Initiate Search</button>";
  else
		htm += '<button disabled="disabled">searching...</button>';
	$("#peers").html( htm );
}

function SysTickBack(req,data)
{
	var params = data.split( "\t" );
	if( !snchanged )
	{
		$("#SystemName").val( params[3] );
		$("#SystemName").removeClass( "unsaved-input");
	}
	if( !sdchanged )
	{
		$("#SystemDescription").val( params[4] );
		$("#SystemDescription").removeClass( "unsaved-input");
	}
	$("#ServiceName").text( params[5] );
	$("#FreeHeap").text( params[6] );

	QueueOperation( "BL", CallbackForPeers );
}

function SystemInfoTick()
{
	if( IsTabOpen('SystemStatus') )
	{
		QueueOperation( "I", SysTickBack );
		setTimeout( SystemInfoTick, 500 );
	}
	else
	{
		//Stop.
	}
}

function SystemChangesReset()
{
	snchanged = false;
	sdchanged = false;
}

function SystemUncommittedChanges()
{
	if( sdchanged || snchanged ) return true;
	else return false;
}

function SetSystemSettings(action){
	if(action == 'save') {
		if( SystemUncommittedChanges() )
			return IssueSystemMessage( "Cannot save.  Uncommitted changes.");
		QueueOperation("IS", function() { IssueSystemMessage( "Saving" ); } );
	}
	if(action == 'reset') {
	}
	if(action == 'revert-saved') {
		QueueOperation("IL", function() { IssueSystemMessage("Reverting." ); } );
	}
	if(action == 'revert-factory') {
		if( confirm( "Are you sure you want to revert to factory settings?" ) )
			QueueOperation("IR");
	}
	SystemChangesReset();
}
