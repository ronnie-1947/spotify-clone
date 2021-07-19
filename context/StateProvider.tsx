import React, {createContext, useContext, useReducer} from 'react'

interface app {

}

interface Props {
    children: React.ReactNode;
    reducer: any;
    initialState: any;
}

const StateContext = createContext<any>({})

const StateContextProvider = ({children, reducer, initialState}:Props)=>(
    <StateContext.Provider value={useReducer(reducer, initialState)}>
        {children}
    </StateContext.Provider>
)

export const useStateContextValue: ()=>any[] = ()=> useContext(StateContext)

export default StateContextProvider