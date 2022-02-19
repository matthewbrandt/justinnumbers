// cron job
// get chatters from twitch_chatters table
// if a chatter does not exist in twitch_users_meta, look up helix user info and push to twitch user meta
// if a chatter exists and information is older than 7 days, look up user info again and push changes
// update twitch_users_meta to have the most recent user information for all users

async function getUsers(users) {
    return axios.create({
      baseURL: `${helix_base_url}/users`,
      headers: {
          'Authorization': 'TOKEN ' + process.env.TAU_TOKEN,
      },
      params: {
        login: users
      }
    }).get()
  } 

async function readWriteUserData(users) {
    // take all the chatters currently in chat
    let currentUsers = users;
  
    // run users meta code to update users table
    let usersUpdateQuery = `INSERT INTO twitch_users_meta (id,login,broadcaster_type,view_count,created_at)
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
          ) AS t1
    WHERE user_rank = 1
    ON CONFLICT (id) DO UPDATE
    SET broadcaster_type = EXCLUDED.broadcaster_type,
        view_count = EXCLUDED.view_count,
        updated_at = NOW()
    WHERE twitch_users_meta.broadcaster_type != EXCLUDED.broadcaster_type
       OR twitch_users_meta.view_count < EXCLUDED.view_count;
    `;
    try {
      //await pool.query(usersUpdateQuery);
      console.log("user update query executed");
    } catch (err) {
      console.log(err.stack)
    }
  
    // query the DB to check if they are in the user list
    // if found in the DB, drop that user from the array (will be updated in a separate process)
    let existingUsers = [];
    let existingUsersQuery = `SELECT DISTINCT login FROM twitch_users_meta;`;
    try {
      const res = await pool.query(existingUsersQuery);
      for (let row of res.rows) {
        existingUsers.push(row.login);
      }
      console.log(existingUsers);
    } catch (err) {
      console.log(err.stack)
    }
  
    let missingUsers = [];
    missingUsers = currentUsers.filter( function( el ) {
      return !existingUsers.includes( el );
    } );
  
    // for all users missing in the DB run getUsers() and write to DB
    const missingUserData = await getUsers(missingUsers);
    let userData = missingUserData.data.data;
  
    // drop columns we don't need from the array of objects
    userData.forEach(object => {
      delete object['display_name'];
      delete object['type'];
      delete object['description'];
      delete object['profile_image_url'];
      delete object['offline_image_url'];
    });
  
    let newUserData = [];
    //let row of res.rows
    for (let i = 0; i < userData.length; i++) {
      newUserData.push(Object.values(userData[i]));
    }
  
    try {
        for (let i = 0; i < newUserData.length; i++){
          let value = JSON.stringify(newUserData[i]);
          const res = await pool.query(`INSERT INTO twitch_users_raw VALUES('${value}')`);
        }
    } catch (err) {
      console.log(err.stack)
    }
  }