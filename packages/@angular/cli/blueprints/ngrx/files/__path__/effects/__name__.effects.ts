import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { <%= classifiedModuleName %>Actions } from '../actions';

@Injectable()
export class LocationListEffects {
    constructor(
        private update$: Actions,
        private <%= camelizedModuleName %>Actions: <%= classifiedModuleName %>Actions
    ) { }

    @Effect() <%= camelizedModuleName %>$ = this.update$
        .ofType(<%= classifiedModuleName %>Actions.<%= upperCasedModuleName %>)
        .map(action => action.payload)
        .switchMap(
            payload => Observable //here the service acts
                .map(results => this.<%= camelizedModuleName %>Actions.<%= camelizedModuleName %>Success(results))
                .catch(error => Observable.of([]))
        );
}