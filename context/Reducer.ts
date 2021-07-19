interface Action {
    type: string;
    payload: any;
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

        case 'SET_USER':
            return {
                ...state,
                user: action.payload
            }

        case 'SET_TOKEN':
            return {
                ...state,
                token: action.payload
            }

        default: 
            return state
    }
}