import { Reducer } from "redux";
import { ConnectionActionType, ConnectionState } from "./connectionTypes";

export const initialState: ConnectionState = {
    id: undefined,
    loading: false,
    list: [],
    selectedId: undefined
}

export const ConnectionReducer: Reducer<ConnectionState> = (state = initialState, action) => {
    switch (action.type) {
        case ConnectionActionType.CONNECTION_INPUT_CHANGE: {
            const { id } = action as { id: string };
            return { ...state, id };
        }
        case ConnectionActionType.CONNECTION_CONNECT_LOADING: {
            const { loading } = action as { loading: boolean };
            return { ...state, loading };
        }
        case ConnectionActionType.CONNECTION_LIST_ADD: {
            const { id } = action as { id: string };
            const newList = [...state.list, id];
            if (newList.length === 1) {
                return { ...state, list: newList, selectedId: id };
            }
            return { ...state, list: newList };
        }
        case ConnectionActionType.CONNECTION_LIST_REMOVE: {
            const { id } = action as { id: string };
            const newList = state.list.filter(e => e !== id);
            if (state.selectedId && !newList.includes(state.selectedId)) {
                if (newList.length === 0) {
                    return { ...state, list: newList, selectedId: undefined };
                } else {
                    return { ...state, list: newList, selectedId: newList[0] };
                }
            }
            return { ...state, list: newList };
        }
        case ConnectionActionType.CONNECTION_ITEM_SELECT: {
            const { id } = action as { id: string };
            return { ...state, selectedId: id };
        }
        default:
            return state;
    }
};