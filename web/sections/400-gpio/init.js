var GPIOlines;
for(var i=0; i<16; ++i)
  GPIOlines += "<td align=center><div class='gpiolabel'>"+ i + "</div>"
    + "<input type=button id=ButtonGPIO"+ i +" value=0 onclick=\"TwiddleGPIO("+ i +");\">"
    + "<input type=button id=BGPIOIn"+ i +" value=In onclick=\"GPIOInput("+ i +");\" class=\"inbutton\">"
    + "</td>";
$(contentId).html("<table width=100%><tr>" + GPIOlines + "</tr></table>");
