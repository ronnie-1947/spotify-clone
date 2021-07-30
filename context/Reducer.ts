interface Action {
    type: string;
    payload: any;
    playlists: [];
    active_playlist: [];
    current_page: string;
}

export const initialState = {
    user: null,
    token: null,
    playlists: [],
    active_playlist: [],
    playing_playlist: [],
    playing_track: null,
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

        default: 
            return state
    }
}