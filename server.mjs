import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import axios from 'axios';
import pkg from 'pg';
const { Pool } = pkg;

// TODO: define broadcaster id based on twitch auth given by user
const broadcaster_id = '556670211';
const broadcaster_name = 'matty_twoshoes'

// first test: fetch data from TAU Postgres DB running on Railway
const pool = new Pool({
  user: 'postgres',
  host: 'containers-us-west-13.railway.app',
  database: 'tau',
  password: process.env.POSTGRES_PW,
  port: 7906
});

async function testDBConn() {
    let testQuery = `SELECT COUNT(*) FROM twitchevents_twitchevent`;
    try {
        const res = await pool.query(testQuery)
        console.log(res.rows);
        return res.rows;
      } catch (err) {
        console.log(err.stack)
      }
}

let cursor_string = '';
const getFollows = axios.create({
    baseURL: 'https://streamymcstreamyface.up.railway.app/api/twitch/helix/users/follows',
    headers: {
        'Authorization': 'TOKEN ' + process.env.TAU_TOKEN,
    },
    params: {
      to_id: broadcaster_id,
      after: cursor_string
    }
})

async function getChatters() {
  const chatters = await fetch('https://tmi.twitch.tv/group/user/matty_twoshoes/chatters');
  const res = await chatters.json();  
  const { vips, moderators, staff, admins, global_mods, viewers } = res.chatters;

  let chatterArr = [];
  chatterArr = [...vips,...moderators,...staff,...admins,...global_mods,...viewers];

  //console.log(chatterArr);
  return chatterArr;
}

async function getUsers(users) {
  return axios.create({
    baseURL: 'https://streamymcstreamyface.up.railway.app/api/twitch/helix/users',
    headers: {
        'Authorization': 'TOKEN ' + process.env.TAU_TOKEN,
    },
    params: {
      login: users
    }
  }).get()
} 

async function testApiConn() {
    let followerArr = [];
    
    const myChatters = await getChatters();
    //console.log(myChatters);

    //const firstResult = await getFollows.get();
    const firstResult = await getUsers(myChatters);

    for (const row of firstResult.data.data) {
      followerArr.push(row);
      console.log(row);
      }
      
    
    return followerArr;
  };


//fire up the websockets - SOCK IT TO ME
import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
//const wss = new WebSocket.Server({ server });
const wss = new WebSocket('ws://streamymcstreamyface.up.railway.app:8999/ws/twitch-events/');

/* wss.on('connection', (ws) => {

  //connection is up, let's add a simple simple event
  ws.on('message', async (message) => {

      //log the received message and send it back to the client
      console.log('ws message received: %s', message);
      //ws.send(`Hello, you sent -> ${message}`);
      const feed = await testApiConn();
      ws.send(feed);
      console.log('ws data sent');

  });


  //send immediatly a feedback to the incoming connection    
  ws.send('Hi there, I am a WebSocket server');
}); */

//start our server
server.listen(8999, () => {
  console.log(server.address());
  console.log(`Server started on port ${server.address().port} :)`);
});













// getting data for the app
// epic: major contributing activities
// story: raid decay
// task: data sources
// ==> eventSub (postgresDB): raid
// ==> helix (API): users
// ==> tmi (API): users/viewers/chatters
// ==> eventSub (ws): raid
// task: store data in DB
// task: do computations and store in DB
// task: output results?

// database??
// frontend
// backend

//@finite: you can technically register an event sub subscription for raids that are initiated from a user id (from @dussed)