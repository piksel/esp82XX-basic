
function flashText(message) {
  $("#innersystemflashtext").html( message );
}

function SystemPushImageProgress( is_ok, comment, pushop )
{
	if( !is_ok ) return flashText( "Failed: " + comment );

	flashText( comment );

	if( pushop.place == pushop.padlen )
	{
		if( pushop.ctx.current_state == 0 )		//File 1 is completing.
		{
			pushop.ctx.current_state = 1;
			pushop.ctx.file1wassize = pushop.padlen;
			pushop.ctx.file1md5 = faultylabs.MD5( pushop.paddata ).toLowerCase();
			var reader = new FileReader();

			reader.onload = function(e) {
				flashText( "Pusing second half..." );
				PushImageTo( e.target.result, flash_scratchpad_at + 0x40000, SystemPushImageProgress, pushop.ctx );
			}

			reader.readAsArrayBuffer( pushop.ctx.file2 );
		}
		else if( pushop.ctx.current_state == 1 )
		{
			var f1s = pushop.ctx.file1wassize;
			var f1m = pushop.ctx.file1md5;
			var f2s = pushop.padlen;
			var f2m = faultylabs.MD5( pushop.paddata ).toLowerCase();

			flashText( "Issuing reflash.  Do not expect a response." );

			var stf = "FM" + flash_scratchpad_at + "\t0\t" + f1s + "\t" + f1m + "\t" + (flash_scratchpad_at+0x40000) + "\t" + 0x40000 + "\t" + f2s + "\t" + f2m + "\n";
			QueueOperation( stf, function( fsrd, fr ) { flashText( (fr[0] == '!')?"Flashing failed.":"Flash success." ) });
		}

		return false;
	}

	return true;
}


function WebPagePushImageFunction( ok, comment, pushop )
{
	if( pushop.place == pushop.padlen )
	{
		flashText("Push complete. Reload page.");
	}
	else
	{
		flashText(comment);
	}

	return true;
}

function DragDropSystemFiles( file )
{
	if( file.length == 1 )
	{
		//webpage ".mpfs" file.
		var fn = file[0].name;
		if( fn.substr( fn.length - 5 ) != ".mpfs" )
			return flashText( "Web files are .mfps files." );

		flashText( "Opening " + fn );

		var reader = new FileReader();

		reader.onload = function(e) {
			PushImageTo( e.target.result, mpfs_start_at, WebPagePushImageFunction );
		}

		reader.readAsArrayBuffer( file[0] );
	}
	else if( file.length == 2 )
	{
		var file1 = null;
		var file2 = null;

		for( var i = 0; i < file.length; i++ )
		{
			console.log( "Found: " + file[i].name );
			if( file[i].name.substr( 0, 17 ) == "image.elf-0x00000" ) file1 = file[i];
			if( file[i].name.substr( 0, 17 ) == "image.elf-0x40000" ) file2 = file[i];
		}
		if( !file1 ) return flashText( "Could not find a image.elf-0x00000... file." );
		if( !file2 ) return flashText( "Could not find a image.elf-0x40000... file." );
		if( file1.size > 65536 ) return flashText( "0x00000 needs to fit in IRAM.  Too big." );
		if( file2.size > 262144) return flashText( "0x40000 needs to fit in 256kB.  Too big." );

		//Files check out.  Start pushing.
		flashText( "Starting." );

		var reader = new FileReader();

		reader.onload = function(e) {
			var ctx = new Object();
			ctx.file1 = file1;
			ctx.file2 = file2;
			ctx.current_state = 0;
			PushImageTo( e.target.result, flash_scratchpad_at, SystemPushImageProgress, ctx );
		}

		reader.readAsArrayBuffer( file[0] );
		return;
	}
	else
	{
		flashText( "Cannot accept anything other than 1 or 2 files." );
	}
}


function ContinueSystemFlash( fsrd, flashresponse, pushop )
{
	if( flashresponse[0] == '!' )
	{
		pushop.status_callback( 0, flashresponse, pushop );
		console.log( flashresponse );
		return;
	}

	var cont = pushop.status_callback( 1, flashresponse, pushop );

	if( !cont ) return;
	if( pushop.place >= pushop.padlen ) return;

	//If we are coming from a write, and now we need to erase the next block, do so.

	if( ( pushop.place % flash_blocksize ) == 0 && flashresponse[1] != 'B' )
	{
		QueueOperation( "FB" + ((pushop.place+pushop.base_address)/flash_blocksize),
			function( x, y ) { ContinueSystemFlash( x, y, pushop ); });
	}
	else  	//Done erasing the next block, or coming off a write we don't need to erase?
	{
		var addy = pushop.place + pushop.base_address;
		var sendstr = "FX" + addy + "\t" + flash_sendsize + "\t";
		for( var i = 0; i < flash_sendsize; i++ )
		{
			sendstr += tohex8( pushop.paddata[pushop.place++] );
		}
		QueueOperation( sendstr, function( x, y ) { ContinueSystemFlash( x, y, pushop ); } );
	}
}

//The signature for status callback is: function AVRStatusCallback( is_ok, comment, pushop )
//If pushop.place == pushop.padlen, no further callbacks will continue, even if true is returned.
//you must return "true."  Returning false will cease further pushing.
//This function returns an object with all properties about the transfer.
//WARNING: "location" must be block (65536) aligned.
function PushImageTo( arraydata, location, status_callback, ctx )
{
	if( location & 0xffff != 0 )
	{
		console.log( "Error: to address not 65,536 aligned." );
		return null;
	}

	var pushop = Object();
	pushop.padlen = Math.floor(((arraydata.byteLength-1)/flash_sendsize)+1)*flash_sendsize;
	pushop.paddata = new Uint8Array( pushop.padlen, 0 );
	pushop.paddata.set( new Uint8Array( arraydata ), 0 );
	pushop.status_callback = status_callback;
	pushop.place = 0;
	pushop.base_address = location;
	pushop.ctx = ctx;

	ContinueSystemFlash( null, "Starting", pushop );

	return pushop;
}
