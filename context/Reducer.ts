interface Action {
    type: string;
    payload: any;
    playlists: [];
    active_playlist: [];
}

export const initialState = {
    user: null,
    token: null,
    playlists: [],
    active_playlist: [],
    playing: false,
    item: null
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

        default: 
            return state
    }
}