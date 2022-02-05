function testWebSocket() {
    return new Promise( (resolve, reject) => {
      var socket = new WebSocket("ws://streamymcstreamyface.up.railway.app:8999/ws/twitch-events/");
  
      socket.onopen = function(event) {
        socket.send("websocket is now open");
        console.log("message");
      }
  
      socket.onmessage = function(event) {
        console.log(`I got some data: ${event.data}`);
        // if (event.data != "Hi there, I am a WebSocket server") {
        //   buildChart(JSON.parse(event.data));  
        // }
        
   
        resolve(event.data);
      }
    });
}

testWebSocket();