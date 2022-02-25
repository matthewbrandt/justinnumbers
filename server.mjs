import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;
import WebSocket from 'ws';

// TODO: define broadcaster id based on twitch auth given by user
const broadcaster_id = '556670211';
const broadcaster_name = 'matty_twoshoes'

// open up the pool for swimming in the data
const pool = new Pool({
  user: 'postgres',
  host: 'containers-us-west-13.railway.app',
  database: 'jin',
  password: process.env.POSTGRES_PW,
  port: 7906
});

async function getChatters() {
  const chatters = await fetch(`https://tmi.twitch.tv/group/user/${broadcaster_name}/chatters`);
  const res = await chatters.json();  
  const { vips, moderators, staff, admins, global_mods, viewers } = res.chatters;

  let chatterArr = [];
  chatterArr = [...vips,...moderators,...staff,...admins,...global_mods,...viewers];

  return chatterArr;
}

async function writeChatterData(users) {
  let chatters = JSON.stringify(users);
  let insertUsers = `INSERT INTO twitch_chatters (chatters) VALUES('${chatters}')`;
  try {
      const res = await pool.query(insertUsers);
      console.log(users.length, "users written into twitch_chatters");
      return;
  } catch (err) {
    console.log(err.stack)
  }
}

async function getUserData() {
    let userArr = [];
    
    // get chatters (users currently in chat)
    const myChatters = await getChatters();

    // write chatters to postgres
    await writeChatterData(myChatters);
      
    // pool is now closed, too many sharks
    //pool.end();
    return;
  };

  async function writeRaidData(data) {
    let insertData = `INSERT INTO twitch_raid_raw (raid_data) VALUES('${data}')`;
    try {
        await pool.query(insertData);
        console.log("raid data written into twitch_raid_raw");
        return;
    } catch (err) {
      console.log(err.stack)
    }
  }

async function testWebSocket() {
    return new Promise( (resolve, reject) => {
      var socket = new WebSocket("wss://streamymcstreamyface.up.railway.app/ws/twitch-events/");
  
      socket.onopen = function(event) {
        socket.send("websocket is now open");
        socket.send(JSON.stringify({"token": process.env.TAU_TOKEN}));
        console.log("this is a message");
      }
  
      socket.onmessage = function(event) {
        // {
        // "id": null, 
        // "event_id": "125d5b99-87f4-4f81-9a26-1e714416c091", 
        // "event_type": "channel-raid", 
        // "event_source": "TestCall", 
        // "event_data": 
        //   {
        //   "from_broadcaster_user_id": null, 
        //   "from_broadcaster_user_name": null, 
        //   "from_broadcaster_user_login": null, 
        //   "to_broadcaster_user_id": "556670211", 
        //   "to_broadcaster_user_name": "Matty_TwoShoes", 
        //   "to_broadcaster_user_login": "matty_twoshoes", 
        //   "viewers": 69
        //   }, 
        //   "created": "2022-02-18T23:15:52.497894+00:00", 
        //   "origin": "test"
        // }
        const output = JSON.parse(event.data);
        if (output.event_type == 'channel-raid') {
          console.log("raid event detected!")
          getUserData();
          writeRaidData(event.data);

        }
        else { console.log("something else that isn't a raid") }
        
   
        resolve(event.data);
      }

      socket.onerror = function(event) {
        console.log("error",event);
      }

      socket.onclose = function(event) {
        console.log("the socket doth closeth", event);
      }
    });
  }


  // detect when a raid happens by listening to the WS
  testWebSocket();
  // upon a raid, get chatters and write them to PG
  // in addition, write the chatters into a new "raid" table design for measuring raid decay
  // count number of "new" chatters from the raid, compare with the raid number for accuracy
  // track this "cohort" as a raid cohort

  





// getting data for the app
// epic: major contributing activities
// story: raid decay
// task: data sources
// ==> eventSub (postgresDB): raid
// ==> helix (API): users
// ==> tmi (API): users/viewers/chatters
// ==> eventSub (websocket): raid
// task: store data in DB
// task: do computations and store in DB
// task: output results?

//getchatters
// task: get all users + at intervals of 2mins
// task: get users info for recent users (30min)

//raids
// task: detect a raid occuring (eventsub ws): raid event
// task: take raid information write to DB


// database??
// frontend
// backend

//@finite: you can technically register an event sub subscription for raids that are initiated from a user id (from @dussed)