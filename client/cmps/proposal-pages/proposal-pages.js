import '../common/base/boolean-filter.js';
import '../common/base/page-message.js';
import './document-proposals-page.js';
import './list-proposals-page.js';
import './new-character-page.js';
import './new-game-page.js';
import './new-move-page.js';
import './user-proposals-page.js';
import './view-proposal-page.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class ProposalPages extends PolymerElement {
    static get template() {
        return html`
            <style>
                :host {
                    display: block;
                    margin: 0 var(--space-large);
                }
            </style>

            <boolean-filter
                id="shownPages"
                names="[[_pageNames]]"
                value-map="{{_shownPages}}"
                single-value="true"
            >
            </boolean-filter>

            <!-- New -->
            <template
                is="dom-if"
                if="[[_shownPages.newGame]]"
                restamp
            >
                <new-game-page query-params="[[queryParams]]">
                </new-game-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.newChar]]"
                restamp
            >
                <new-character-page query-params="[[queryParams]]">
                </new-character-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.newMove]]"
                restamp
            >
                <new-move-page query-params="[[queryParams]]">
                </new-move-page>
            </template>

            <!-- View -->
            <template
                is="dom-if"
                if="[[_shownPages.viewById]]"
                restamp
            >
                <view-proposal-page relative-path="[[_relativePath]]">
                </view-proposal-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.listAll]]"
                restamp
            >
                <list-proposals-page>
                </list-proposals-page>
            </template>


            <template
                is="dom-if"
                if="[[_shownPages.listForDoc]]"
                restamp
            >
                <document-proposals-page document-id="[[_relativePath]]">
                </document-proposals-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.listForUser]]"
                restamp
            >
                <user-proposals-page user-id="[[_relativePath]]">
                </user-proposals-page>
            </template>

            <!-- TODO: Make string localizable -->
            <page-message
                type="missing"
                message="Derp... there's nothing to see here."
                hidden="[[!_shownPages.notFound]]"
            >
            </page-message>
        `;
    }

    static get is() {
        return 'proposal-pages';
    }

    static get properties() {
        return {
            path: {
                type: String,
                observer: '_onPathChanged'
            },

            queryParams: {
                type: Object
            },

            _relativePath: {
                type: String
            },

            _pageNames: {
                type: Array,
                readOnly: true,
                value: () => [
                    'notFound',
                    'newGame',
                    'newChar',
                    'newMove',
                    'viewById',
                    'listAll',
                    'listForDoc',
                    'listForUser'
                ]
            },

            _shownPages: {
                type: Object
            }
        };
    }

    _onPathChanged(newValue) {
        // Supported paths are:
        // new/games
        // new/chars
        // new/moves
        // list/user/<user-id>
        // list/doc/<doc-id>
        // list/all
        // view/any/<doc-id/<ver>>
        const pathRegex = /^(\w+)\/(\w+)(?:\/([\w\-.:]+(?:\/(\d+)?)?)?)?$/;
        const routePageMap = {
            'new': {
                'games': 'newGame',
                'chars': 'newChar',
                'moves': 'newMove'
            },
            'list': {
                'all': 'listAll',
                'user': 'listForUser',
                'doc': 'listForDoc'
            },
            'view': {
                'any': 'viewById'
            },
        };

        let page = null;
        let relativePath = null;
        const matches = newValue.match(pathRegex);

        if (matches && matches[1] && matches[2]) {
            const result = routePageMap[matches[1]];
            if (result) {
                page = result[matches[2]];
                relativePath = matches[3] || '';
            }

        }

        this.$.shownPages.set(page || 'notFound');
        this._relativePath = relativePath;
    }
}

customElements.define(ProposalPages.is, ProposalPages);
