import './common/search/search-results-loader.js';
import './common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class SearchPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .search-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: var(--color-page-alt);
                    height: auto;
                    padding: var(--space-medium) var(--space-large);
                }

                .search {
                    max-width: calc(var(--page-max-width) * 0.60);
                    width: 100%;
                }
            </style>

            <div class="app__section search-container">
                <search-input
                    class="search"
                    value="[[_query]]"
                    on-invoke-search="_searchInvoked"
                >
                </search-input>
            </div>

            <search-results-loader
                query="[[_query]]"
                page="[[_page]]"
            >
            </search-results-loader>
        `;
    }

    static get is() {
        return 'search-page';
    }

    static get properties() {
        return {
            queryParams: {
                type: Object,
                observer: '_onQueryParamsChanged'
            },

            _query: {
                type: String,
                value: '',
            },

            _page: {
                type: Number,
                value: 1,
            }
        };
    }

    _searchInvoked(event) {
        window.history.pushState({}, null, `/search?query=${event.detail}`);
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    _onQueryParamsChanged(newParams) {
        this.setProperties({
            _query: decodeURI(newParams.query || ''),
            _page: parseInt(newParams.page) || 1,
        });

        // TODO: Make this string localizable
        document.title = `Search '${this._query}' | framebastard`;
    }
}

customElements.define(SearchPage.is, SearchPage);
