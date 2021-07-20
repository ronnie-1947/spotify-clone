interface Action {
    type: string;
    payload: any;
    playlists: [];
}

export const initialState = {
    user: null,
    token: null,
    playlists: [],
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

        default: 
            return state
    }
}