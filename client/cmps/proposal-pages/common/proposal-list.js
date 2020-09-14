import '../../common/base/base-button.js';
import '../../common/base/base-spinner.js';
import '../../common/base/inline-message.js';
import '../../common/document/document-breadcrumbs.js';
import '../../common/styles/app-styles.js';
import './proposal-info.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getTimeString } from '../../common/util/time.js';

class ProposalList extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .list {
                    display: grid;
                    grid-template-columns: 100%;
                    grid-gap: var(--space-section);
                }

                .list-item {
                    overflow: hidden;
                    padding: var(--space-medium);
                }

                .list-item__header {
                    display: inline-block;
                    margin-bottom: var(--space-medium);
                }

                .footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .footer__button {
                    margin: var(--space-large) 0;
                }

                .spinner {
                    width: 8rem;
                    margin: 0 auto;
                }
            </style>

            <iron-ajax
                id="ajax"
                on-response="_onGetResponse"
                on-error="_onGetError"
                url="/doc-api/v1/props/any"
            >
            </iron-ajax>

            <base-spinner
                class="spinner"
                hidden="[[!_showStencil]]"
            >
            </base-spinner>

            <div
                class="app__section list"
                hidden="[[_showStencil]]"
            >
                <template
                    is="dom-repeat"
                    items="[[_proposals]]"
                >
                    <article class="app__container app__bordered app__shadowed list-item">
                        <document-breadcrumbs
                            class="list-item__header"
                            document="[[item]]"
                            full-path="true"
                            is-proposal
                        >
                        </document-breadcrumbs>

                        <proposal-info proposal="[[item]]">
                        </proposal-info>
                    </article>
                </template>
            </div>

            <inline-message
                id="loadError"
                type="error"
            >
                <!-- TODO: Make this string localizable -->
                Something went wrong; we couldn't load the proposals. Maybe try again?
            </inline-message>

            <div class="footer">
                <base-button
                    hidden
                    class="footer__button"
                    id="loadMoreButton"
                    on-click="_onLoadMoreClicked"
                >
                    <!-- TODO: Make this string localizable -->
                    Load More
                </base-button>
            </div>
        `;
    }

    static get is() {
        return 'proposal-list';
    }

    static get properties() {
        return {
            target: {
                type: String
            },

            author: {
                type: String
            },

            status: {
                type: String
            },

            sort: {
                type: String
            },

            pageSize: {
                type: Number,
                value: 10
            },

            _proposals: {
                type: Array,
                value: () => []
            },

            _showStencil: {
                type: Boolean,
                value: true
            },

            _currentPage: {
                type: Number,
                value: 0
            },

            _ready: {
                type: Boolean
            }
        };
    }

    static get observers() {
        return [
            '_queryOptionsChanged(status, sort, target, author, pageSize)'
        ];
    }

    ready() {
        super.ready();
        this._ready = true;
    }

    fetch() {
        this.setProperties({
            _currentPage: 0,
            _proposals: [],
            _showStencil: true
        });

        this._requestPage();
    }

    _queryOptionsChanged() {
        if (!this._ready) {
            return;
        }

        this.fetch();
    }

    _onGetResponse(event) {
        const response = event.detail.response;
        this.push('_proposals', ...response.page);
        this._showStencil = false;
        this.$.loadMoreButton.hidden = this._proposals.length === response.totalCount;
    }

    _onGetError(event) {
        if (!event.detail.request.aborted) {
            this.$.loadError.show();
            this._showStencil = false;
        }
    }

    _onLoadMoreClicked() {
        this._currentPage += 1;
        this._requestPage();
    }

    _requestPage() {
        this.$.loadMoreButton.hidden = true;
        this.$.loadError.hide();

        let params = {
            offset: this._currentPage * this.pageSize,
            limit: this.pageSize,
            status: this.status,
            sortAsc: this.sort === 'asc'
        };

        // Set optional parameters
        ['target', 'author'].forEach(param => {
            const value = this[param];
            if (value) {
                params[param] = value;
            }
        });

        let ajax = this.$.ajax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.params = params;
        ajax.generateRequest();
    }

    _getTimeString(time) {
        return getTimeString(time);
    }
}

customElements.define(ProposalList.is, ProposalList);
