import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { <%= classifiedModuleName %>Actions } from '../actions';

@Injectable()
export class <%= classifiedModuleName %>Effects {
    constructor(
        private update$: Actions,
        private <%= camelizedModuleName %>Actions: <%= classifiedModuleName %>Actions
    ) { }

    @Effect() <%= camelizedModuleName %>$ = this.update$
        .ofType(<%= classifiedModuleName %>Actions.GET_<%= upperCasedModuleName %>)
        .map(action => action.payload)
        .switchMap(
            payload => Observable.create() //REPLACE returning statement with async method from service
                .map(results => this.<%= camelizedModuleName %>Actions.<%= camelizedModuleName %>Success(results))
                .catch(error => Observable.create()) //put error handler here
        );
}