import '../base/inline-message.js';
import '../document/document-list.js';
import '../styles/app-styles.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class SearchResultsLoader extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                    max-width: var(--page-max-width);
                    margin: 0 auto;
                    padding: 0 var(--space-large)
                }

                :host([hidden]) {
                    display: none;
                }

                .header {
                    border-style: none none solid none;
                    display: flex;
                    justify-content: space-between;
                }

                .header__title {
                    margin: 0;
                }

                .header__sub {
                    margin: 0;
                    color: var(--color-text-note);
                }

                .empty-state:not([hidden]) {
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: center;
                    color: var(--color-text-note);
                    text-align: center;
                }

                .footer {
                    display: flex;
                    justify-content: center;
                }

                .footer__link {
                    margin: 0 var(--space-medium);
                }
            </style>

            <iron-ajax
                id="ajax"
                on-response="_onGetResponse"
                on-error="_onGetError"
                url="/search-api/v1"
            >
            </iron-ajax>

            <article>
                <!-- TODO: Make these string localizable -->
                <hgroup class="app__bordered app__section header">
                    <h3 class="app__header app__header--medium header__title">
                        Search results
                    </h3>
                    <h4 class="app__header header__sub">
                        Page [[page]]
                    </h4>
                </hgroup>

                <template
                    is="dom-if"
                    if="[[_showEmptyState]]"
                >
                    <div class="empty-state">
                        <h2 class="app__header app__header--medium">
                            <!-- TODO: Make this string localizable -->
                            Couldn't find anything; try a different search.
                        </h2>

                        <!-- TODO: Make the alt string localizable -->
                        <img
                            src="/static/images/message-empty.png"
                            alt="Message characterization"
                        />
                    </div>
                </template>

                <document-list
                    documents="[[_documents]]"
                    show-stencil="[[_showStencil]]"
                    full-crumb-path
                >
                </document-list>

                <inline-message
                    id="loadError"
                    type="error"
                >
                    <!-- TODO: Make this string localizable -->
                    Something went wrong; we couldn't load the search results. Maybe try again?
                </inline-message>

                <!-- TODO: Make these string localizable -->
                <footer class="footer">
                    <a
                        class="app__hyperlink app__hyperlink--inline footer__link"
                        href\$="[[_getPagingLink(query, targetType, target, _prevPage)]]"
                        hidden="[[!_prevPage]]"
                    >
                        &larr; Previous
                    </a>
                    <a
                        class="app__hyperlink app__hyperlink--inline footer__link"
                        href\$="[[_getPagingLink(query, targetType, target, _nextPage)]]"
                        hidden="[[!_nextPage]]"
                    >
                        Next &rarr;
                    </a>
                </footer>
            </article>
        `;
    }

    static get is() {
        return 'search-results-loader';
    }

    static get properties() {
        return {
            query: {
                type: String,
                value: ''
            },

            target: {
                type: String,
                value: null
            },

            targetType: {
                type: String,
                value: null
            },

            page: {
                type: Number,
                value: 1
            },

            pageSize: {
                type: Number,
                value: 10
            },

            _documents: {
                type: Array,
                value: () => []
            },

            _showStencil: {
                type: Boolean,
                value: false
            },

            _showEmptyState: {
                type: Boolean,
                value: false
            },

            _nextPage: {
                type: Number,
                value: null
            },

            _prevPage: {
                type: Number,
                value: null
            }
        };
    }

    static get observers() {
        return [
            '_onParamsChanged(query, target, targetType, page, pageSize)'
        ];
    }

    _onParamsChanged(query, target, targetType, page, pageSize) {
        const newQuery = query && query.trim() || '';
        if (newQuery.length === 0) {
            return;
        }

        this.setProperties({
            _documents: [],
            _showStencil: true,
            _showEmptyState: false,
            _nextPage: null,
            _prevPage: null
        });

        let ajax = this.$.ajax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.params = {
            query: newQuery,
            limit: pageSize + 1,
            offset: pageSize * (page - 1)
        };

        if (target) {
            ajax.params[targetType] = target;
        }

        ajax.generateRequest();
        this.$.loadError.hide();
    }

    _onGetResponse(event) {
        const response = event.detail.response;
        const results = Array.isArray(response) ? response : [response];
        const documents = results.slice(0, Math.min(this.pageSize, results.length));

        this.setProperties({
            _documents: documents,
            _showStencil: false,
            _showEmptyState: this.page === 1 && documents.length === 0,
            _nextPage: results.length > this.pageSize ? this.page + 1 : null,
            _prevPage: this.page > 1 ? this.page - 1 : null
        });
    }

    _onGetError(event) {
        if (!event.detail.request.aborted) {
            this.$.loadError.show();
        }
    }

    _getPagingLink(query, targetType, target, page) {
        return `?query=${query}${targetType ? `&${targetType}=${target}` : ''}&page=${page}`;
    }
}

customElements.define(SearchResultsLoader.is, SearchResultsLoader);
