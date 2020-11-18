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
            </style>

            <div class="app__section search-container">
                <search-input
                    class="app__container app__bordered"
                    value="[[_query]]"
                    prefix="[[_target]]"
                    placeholder="[[_getPlaceholder(_targetType)]]"
                    on-invoke-search="_searchInvoked"
                >
                </search-input>
            </div>

            <search-results-loader
                query="[[_query]]"
                target="[[_target]]"
                target-type="[[_targetType]]"
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
                observer: '_onQueryParamsChanged',
            },

            _query: {
                type: String,
                value: '',
            },

            _page: {
                type: Number,
                value: 1,
            },

            _target: {
                type: String,
                value: null,
            },

            _targetType: {
                type: String,
                value: null,
            }
        };
    }

    _searchInvoked(event) {
        let path = `/search?query=${event.detail}`;
        if (this._target) {
            path += `&${this._targetType}=${this._target}`;
        }

        window.history.pushState({}, null, path);
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    _getPlaceholder(targetType) {
        // TODO: Make these strings localizable
        const placeholders = {
            game: 'Search this game\'s characters and moves',
            char: 'Search this character\'s moves',
            none: 'Search games, characters and moves',
        };

        return placeholders[targetType || 'none'];
    }

    _onQueryParamsChanged(newParams) {
        let targetType, target;
        ['game', 'char'].forEach(type => {
            if (newParams[type]) {
                targetType = type;
                target = newParams[type];
            }
        });

        this.setProperties({
            _query: decodeURI(newParams.query || ''),
            _page: parseInt(newParams.page) || 1,
            _targetType: targetType,
            _target: target,
        });

        // TODO: Make this string localizable
        document.title = `Search '${this._query}' | framebastard`;
    }
}

customElements.define(SearchPage.is, SearchPage);
