interface Action {
    type: string
    payload: any
    playlists: []
    active_playlist: []
    current_page: string
    playing_playlist_id: string
    playing_track_id: string
    playing: boolean
    shuffle: boolean
    repeat: boolean
}

export const initialState = {
    user: null,
    token: null,
    playlists: [],
    active_playlist: [],
    playing_playlist_id: null,
    playing_track_id: null,
    outer_playing_track_id: null,
    shuffle: false,
    repeat: false,
    playing: false,
    item: null,
    current_page: 'home'
}

export const reducer = (state:any, action:Action)=>{
    
    switch(action.type) {

        case 'SET_USER_N_TOKEN':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token
            }

        case 'SET_TOKEN':
            return {
                ...state,
                token: action.payload
            }

        case 'SET_PLAYLISTS':
            return {
                ...state,
                playlists: action.playlists
            }

        case 'SET_ACTIVE_PLAYLIST':
            return {
                ...state,
                active_playlist: action.active_playlist
            }

        case 'SET_PAGE':
            return {
                ...state,
                current_page: action.current_page
            }

        case 'SET_PLAYING_DETAILS': 
            return {
                ...state,
                playing_playlist_id: action.payload?.playing_playlist_id,
                outer_playing_track_id: action.payload?.playing_track_id
            }

        case 'SET_PLAYING_TRACK':
            return {
                ...state,
                playing_track_id: action.playing_track_id
            }

        case 'SET_PLAY_PAUSE':
            return {
                ...state,
                playing: action.playing
            }

        case 'SET_SHUFFLE':
            return {
                ...state,
                shuffle: action.shuffle
            }

        case 'SET_REPEAT':
            return {
                ...state,
                repeat: action.repeat
            }

        default: 
            return state
    }
}