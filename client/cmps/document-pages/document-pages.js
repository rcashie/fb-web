import '../common/base/boolean-filter.js';
import '../common/base/page-message.js';
import './character-document-page.js';
import './game-document-page.js';
import './move-document-page.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentPages extends PolymerElement {
    static get template() {
        return html`
            <style>
                :host {
                    display: block;
                    margin-top: var(--space-small);
                }
            </style>

            <boolean-filter
                id="shownPages"
                names="[[_pageNames]]"
                value-map="{{_shownPages}}"
                single-value="true"
            >
            </boolean-filter>

            <template
                is="dom-if"
                if="[[_shownPages.game]]"
                restamp
            >
                <game-document-page
                    document-id="[[_relativePath]]"
                    child-page="[[_childPage]]"
                >
                </game-document-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.char]]"
                restamp
            >
                <character-document-page
                    document-id="[[_relativePath]]"
                    child-page="[[_childPage]]"
                >
                </character-document-page>
            </template>

            <template
                is="dom-if"
                if="[[_shownPages.move]]"
                restamp
            >
                <move-document-page document-id="[[_relativePath]]">
                </move-document-page>
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
        return 'document-pages';
    }

    static get properties() {
        return {
            path: {
                type: String
            },

            queryParams: {
                type: Object
            },

            _pageNames: {
                type: Array,
                readOnly: true,
                value: () => ['game', 'char', 'move', 'notFound']
            },

            _childPage: {
                type: Number,
                value: 1,
            },

            _shownPages: {
                type: Object
            },

            _relativePath: {
                type: String,
            }
        };
    }

    static get observers() {
        return [
            '_onParamsChanged(path, queryParams)'
        ];
    }

    _onParamsChanged(path, queryParams) {
        const pathRegex = /^(\w+)(?:\/([\w\-.]+))?$/,
            routePageMap = {
                'games': 'game',
                'chars': 'char',
                'moves': 'move'
            };

        const matches = path.match(pathRegex);
        const category = matches && matches[1];
        this.$.shownPages.set(routePageMap[category] || 'notFound');

        this.setProperties({
            _relativePath:  matches[2] || '',
            _childPage: parseInt(queryParams.page) || 1
        });
    }
}

customElements.define(DocumentPages.is, DocumentPages);
