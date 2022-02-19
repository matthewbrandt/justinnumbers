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