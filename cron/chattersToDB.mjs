import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;

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
  chatterArr = chatterArr.sort();

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

getUserData();