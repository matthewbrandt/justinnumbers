function testWebSocket() {
    return new Promise( (resolve, reject) => {
      var socket = new WebSocket("wss://streamymcstreamyface.up.railway.app/ws/twitch-events/");
  
      socket.onopen = function(event) {
        socket.send("websocket is now open");
        console.log("this is a message");
      }
  
      socket.onmessage = function(event) {
        console.log(`I got some data: ${event.data}`);
        // if (event.data != "Hi there, I am a WebSocket server") {
        //   buildChart(JSON.parse(event.data));  
        // }
        
   
        resolve(event.data);
      }

      socket.onerror = function(event) {
        console.log(event);
      }
    });
}

testWebSocket();