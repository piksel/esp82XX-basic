MakeDragDrop( "InnerSystemReflash", DragDropSystemFiles );
$("#dragndropersystem").change(function() { DragDropSystemFiles(this.files ); });

//Preclude drag and drop on rest of document in event user misses firmware boxes.
donothing = function(e) {e.stopPropagation();e.preventDefault();};
$(document).on('drop', donothing );
$(document).on('dragover', donothing );
$(document).on('dragenter', donothing );
