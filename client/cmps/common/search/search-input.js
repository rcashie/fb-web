import '../styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class SearchInput extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                .search {
                    display: flex;
                    flex-flow: row nowrap;
                    overflow: hidden;
                    font-size: var(--font-size-header-large);
                    background-color: var(--color-page);
                }

                .search__icon {
                    width: 1rem;
                    height: 1rem;
                }

                .search__input {
                    -moz-appearance: none;
                    -webkit-appearance: none;
                    flex-grow: 1;
                    box-shadow: none;
                    border: none;
                    color: inherit;
                    font: inherit;
                    padding: var(--space-medium) 0 var(--space-medium) var(--space-medium);
                    min-width: 0;
                }

                .search__input::placeholder {
                    color: var(--color-text-note);
                }

                .search__input:focus {
                    outline: none;
                }

                .search__button {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    padding: 0 var(--space-large);
                    border: none;
                    background-color: var(--color-page-alt);
                }

                .search__button[disabled] {
                    cursor: default;
                }
            </style>

            <div class="app__bordered app__container search">
                <!-- TODO: Make these strings localizable -->
                <input
                    class="search__input"
                    type="text"
                    value="{{value::input}}"
                    aria-label="Search games, characters and moves"
                    placeholder="Search games, characters and moves"
                    on-keydown="_onKeyDowned"
                >

                <button
                    class="search__button"
                    on-click="_buttonClicked"
                    disabled="[[_isButtonDisabled(value)]]"
                >
                    <img
                        class="search__icon"
                        src="/static/images/find.svg"
                        alt=""
                    />
                </button>
            </div>
        `;
    }

    static get is() {
        return 'search-input';
    }

    static get properties() {
        return {
            value: {
                type: String,
                value: '',
            }
        };
    }

    focus() {
        this.$.textInput.focus();
    }

    _buttonClicked(event) {
        event.stopPropagation();
        this._raiseSearchEvent();
    }

    _onKeyDowned(event) {
        if (!this._isButtonDisabled(this.value) && event.keyCode === 13) {
            this._raiseSearchEvent();
        }
    }

    _isButtonDisabled(value) {
        return !value || value.length === 0;
    }

    _raiseSearchEvent() {
        this.dispatchEvent(new CustomEvent('invoke-search', { detail: this.value }));
    }
}

customElements.define(SearchInput.is, SearchInput);
