
SystemInfoTick();

$("#SystemName").on("input propertychange paste",function(){snchanged = true; $("#SystemName").addClass( "unsaved-input"); });
$("#SystemDescription").on("input propertychange paste",function(){sdchanged = true;$("#SystemDescription").addClass( "unsaved-input"); });
window.$output = $('#output');
