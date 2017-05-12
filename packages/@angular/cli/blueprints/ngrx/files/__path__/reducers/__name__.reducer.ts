import { Action } from '@ngrx/store';
import { <%= classifiedModuleName %>Actions } from '../actions';

export type <%= classifiedModuleName %>State = any[];

const initialState: <%= classifiedModuleName %>State = [];

export function <%= classifiedModuleName %>Reducer(state = initialState, action: Action): <%= classifiedModuleName %>State {
    switch (action.type) {
        case <%= camelizedModuleName %>Actions.ACTION_NAME: {
            console.log(<%= classifiedModuleName %>Actions.<%= upperCasedModuleName %>, '<ACTION>', action.payload);
            return state;
        }
        case <%= camelizedModuleName %>Actions.ACTION_NAME_SUCCESS: {
            console.log(<%= classifiedModuleName %>Actions.<%= upperCasedModuleName %>_SUCCESS, '<ACTION>', action.payload.data);
            return action.payload;
        }
        default:
            return state;
    };
}