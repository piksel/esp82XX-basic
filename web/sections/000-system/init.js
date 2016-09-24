
SystemInfoTick();

$("#SystemName").on("input propertychange paste",function(){snchanged = true; $("#SystemName").addClass( "unsaved-input"); });
$("#SystemDescription").on("input propertychange paste",function(){sdchanged = true;$("#SystemDescription").addClass( "unsaved-input"); });
window.$outputMsg = $('#outputMsg');
window.$outputInfo = $('#outputInfo');
window.outputMsg = document.getElementById('outputMsg');
window.outputInfo = document.getElementById('outputInfo');
