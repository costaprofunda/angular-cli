import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';

@Injectable()
export class <%= classifiedModuleName %>Actions {

  static <%= upperCasedModuleName %> = '[<%= upperCasedModuleName %>] description';
  <%= camelizedModuleName %>(data): Action {
    return {
      type: <%= classifiedModuleName %>Actions.<%= upperCasedModuleName %>
    };
  }

  static <%= upperCasedModuleName %>_SUCCESS = '[<%= upperCasedModuleName %>_SUCCESS] description';
  <%= camelizedModuleName %>Success(data): Action {
    return {
      type: <%= classifiedModuleName %>Actions.<%= upperCasedModuleName %>_SUCCESS,
      payload: data //remove if uneeded
    };
  }

}
