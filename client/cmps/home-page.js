import './common/document/document-list-loader';
import './common/search/search-input';
import './common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class HomePage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .search-container {
                    background-image: url('/static/images/crowd.jpg');
                    background-color: var(--color-page-inverse);
                    height: 150px; /* background image height */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                @media (max-width: 25rem) {
                    .search-container {
                        background-image: none;
                        height: auto;
                        padding: 0 var(--space-medium) var(--space-large);
                    }
                }
            </style>

            <div class="app__section search-container">
                <!-- TODO: Make the placeholder string localizable -->
                <search-input
                    class="app__container app__bordered"
                    placeholder="Search games, characters and moves"
                    on-invoke-search="_searchInvoked"
                >
                </search-input>
            </div>

            <document-list-loader
                header="Games"
                page="[[_page]]"
                fetch-url="/doc-api/v1/docs/games"
            >
                <span slot="error">
                    <!-- TODO: Make this string localizable -->
                    Something went wrong; we couldn't load the games. Maybe try again?
                </span>
            </document-list-loader>
        `;
    }

    static get is() {
        return 'home-page';
    }

    static get properties() {
        return {
            queryParams: {
                type: Object,
                observer: '_onQueryParamsChanged'
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
        this._page = parseInt(newParams.page) || 1;
    }

    connectedCallback() {
        super.connectedCallback();

        // TODO: Make this string localizable
        document.title = 'framebastard';
    }
}

customElements.define(HomePage.is, HomePage);
