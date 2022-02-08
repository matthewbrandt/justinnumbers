import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import axios from 'axios';
import pkg from 'pg';
const { Pool } = pkg;

const helix_base_url = 'https://streamymcstreamyface.up.railway.app/api/twitch/helix';

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

async function getUsers(users) {
  return axios.create({
    baseURL: `${helix_base_url}/users`,
    headers: {
        'Authorization': 'TOKEN ' + process.env.TAU_TOKEN,
    },
    params: {
      //login: users
      login: 'Transmex'
    }
  }).get()
} 

async function writeChatterData(users) {
  let chatters = JSON.stringify(users);
  let insertUsers = `INSERT INTO twitch_chatters (chatters) VALUES('${chatters}')`;
  try {
      const res = await pool.query(insertUsers);
      //console.log(res.rows);
      return res.rows;
  } catch (err) {
    console.log(err.stack)
  }
}

async function readWriteUserData(users) {
  // take all the chatters currently in chat
  let currentUsers = users;

  // run users meta code to update users table
  let usersUpdateQuery = `INSERT INTO twitch_users_meta (id,login,broadcaster_type,view_count,created_at)
  VALUES (
      SELECT id,
             login,
             broadcaster_type,
             view_count,
             created_at
      FROM (
           SELECT DISTINCT id,
                           login,
                           broadcaster_type,
                           view_count,
                           created_at,
                           RANK() OVER(PARTITION BY id ORDER BY inserted_at DESC) AS user_rank
          FROM twitch_users
          ) AS tu
      WHERE user_rank = 1
      )`;
  try {
    const res = await pool.query(usersUpdateQuery);
    return res.rows;
  } catch (err) {
    console.log(err.stack)
  }


  // query the DB to check if they are in the user list
  let compareUsers = '';
  try {
    const res = await pool.query(insertUsers);
    //console.log(res.rows);
    return res.rows;
  } catch (err) {
    console.log(err.stack)
  }

  // if no data > then fetch with getUsers() and write to DB
  
  
  let insertUsers = `INSERT INTO twitch_chatters (chatters) VALUES('${chatters}')`;
  try {
      const res = await pool.query(insertUsers);
      //console.log(res.rows);
      return res.rows;
  } catch (err) {
    console.log(err.stack)
  }
}

// get chatters every 2 minutes
// look up user data for unknown users
async function getUserData() {
    let userArr = [];
    
    const myChatters = await getChatters();
    console.log('myChatters =',myChatters.length);

    // write chatters to postgres
    writeChatterData(myChatters);

    // get the user data from postgres
    // for missing users get them from twitch helix
    readWriteUserData(myChatters);

    

    //const myUsers = await getUsers(myChatters);

    // for (const row of firstResult.data.data) {
    //   userArr.push(row);
    // }
      
    // pool is now closed, too many sharks
    pool.end();
    return userArr;
  };

  //getUserData();
const notSafe = await getUsers();
console.log(notSafe.data.data);

  //testDBConn();



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



//follower stuff
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