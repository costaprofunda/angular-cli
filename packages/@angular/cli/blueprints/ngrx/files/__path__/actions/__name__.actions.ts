import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';

@Injectable()
export class <%= classifiedModuleName %>Actions {

  static GET_<%= upperCasedModuleName %> = '[GET_<%= upperCasedModuleName %>] description';
  <%= camelizedModuleName %>(data): Action {
    return {
      type: <%= classifiedModuleName %>Actions.GET_<%= upperCasedModuleName %>
    };
  }

  static GET_<%= upperCasedModuleName %>_SUCCESS = '[GET_<%= upperCasedModuleName %>_SUCCESS] description';
  <%= camelizedModuleName %>Success(data): Action {
    return {
      type: <%= classifiedModuleName %>Actions.GET_<%= upperCasedModuleName %>_SUCCESS,
      payload: data //remove if uneeded
    };
  }

}
