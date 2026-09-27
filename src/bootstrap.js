setInterval(manualTick,1000)
hydratePersistentState();
installAccessibilityFoundation();
ensureControlLabels(document);


document.getElementById('events').innerHTML='<div class="event"><time>12:08</time><div><b>Session started</b><small>PC11 • 60 min package</small></div></div><div class="event"><time>12:04</time><div><b>Payment received</b><small>420,000 تومان • نقدی</small></div></div><div class="event"><time>11:58</time><div><b>PC04 paused</b><small>Network heartbeat recovered</small></div></div><div class="event"><time>11:46</time><div><b>New customer</b><small>Customer #1040 created</small></div></div>';
render();
