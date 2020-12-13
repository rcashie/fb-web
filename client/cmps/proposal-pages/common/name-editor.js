import '../../common/styles/app-styles.js';
import '../../common/base/text-input.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

class NameEditor extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: inline-block;
                }

                .name-container {
                    position: relative;
                }

                .name {
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-x-small) var(--space-medium);
                }

                .name__value {
                    min-width: var(--space-large);
                    min-height: var(--line-height-medium);
                }

                .name__close {
                    width: 1rem;
                    height: 1rem;
                    margin-left: var(--space-medium);
                }

                .name__edit {
                    position: absolute;
                    background-color: var(--color-page);
                    padding: var(--space-medium);
                    text-align: center;
                    top: calc(100% + var(--space-small));
                    z-index: 1;
                }
            </style>

            <div class="name-container">
                <div
                    id="name"
                    class="app__container app__bordered name"
                >
                    <button
                        class="app__bare-button name__value"
                        type="button"
                        on-click="showEdit"
                    >
                        [[value]]
                    </button>

                    <!-- TODO: Make the alt string localizable -->
                    <button
                        class="app__bare-button name__close"
                        type="button"
                        on-click="_onRemoveClicked"
                    >
                        <img
                            src="/static/images/close.svg"
                            alt="Close button"
                        />
                    </button>
                </div>

                <template
                    is="dom-if"
                    if="[[_showEdit]]"
                >
                    <div class="app__container app__bordered app__shadowed name__edit">
                        <text-input
                            id="textInput"
                            value="{{value}}"
                            on-blur="_onInputBlurred"
                            on-keydown="_onKeyDowned"
                        >
                        </text-input>
                    </div>
                </template>
            </div>
        `;
    }

    static get is() {
        return 'name-editor';
    }

    static get properties() {
        return {
            value: {
                type: String,
                notify: true,
                value: ''
            },

            _showEdit: {
                type: Boolean,
                value: false
            },

            _shownEditTime: {
                type: Date,
            },

            _debounceJob: {
                type: Object
            }
        };
    }

    showEdit() {
        this._showEdit = true;

        let setFocus = () => {
            this.shadowRoot.querySelector('#textInput').focus();
            this._shownEditTime = new Date();
        };

        this._debounceJob = Debouncer.debounce(
            this._debounceJob,
            timeOut.after(0),
            setFocus
        );
    }

    _onInputBlurred() {
        this._showEdit = false;
    }

    _onKeyDowned(event) {
        const elapsedTime = (new Date()) - this._shownEditTime;
        if (event.keyCode === 13 && elapsedTime > 1000) {
            this._showEdit = false;
        }
    }

    _onRemoveClicked() {
        this.dispatchEvent(new CustomEvent('remove'));
    }
}

customElements.define(NameEditor.is, NameEditor);

export { NameEditor };
