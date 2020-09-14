import '../common/styles/app-styles.js';
import './common/proposal-list-filters.js';
import './common/proposal-list.js';
import './common/proposal-page-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getUserClaims } from '../common/util/cookie.js';

class UserProposalsPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style include="proposal-page-styles">
            </style>

            <style>
                :host {
                    display: block;
                    max-width: var(--page-max-width);
                    margin: var(--space-medium) auto;
                }
            </style>

            <header class="page-banner">
                <h2 class="app__header app__header--large page-banner__header">
                    <!-- TODO: Make string localizable -->
                    [[_getTitle(userId, _currentUserId)]]
                </h2>

                <proposal-list-filters
                    status="{{_status}}"
                    sort="{{_sort}}"
                >
                </proposal-list-filters>
            </header>

            <proposal-list
                status="[[_status]]"
                sort="[[_sort]]"
                author="[[userId]]"
            >
            </proposal-list>
        `;
    }

    static get is() {
        return 'user-proposals-page';
    }

    static get properties() {
        return {
            userId: {
                type: String,
                _observer: '_onUserIdChanged'
            },

            _currentUserId: {
                type: String
            },

            _status: {
                type: String,
                value: 'pending'
            },

            _sort: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        // TODO: Make this string localizable
        document.title = 'User proposals | framebastard';
    }

    _onUserIdChanged() {
        const claims = getUserClaims();
        this._currentUserId = claims && claims.sub;
    }

    _getTitle(targetUserId, currentUserId) {
        // TODO: Make string localizable
        return targetUserId === currentUserId ?
            'My proposals' : `Proposals by #${targetUserId}`;
    }
}

customElements.define(UserProposalsPage.is, UserProposalsPage);
