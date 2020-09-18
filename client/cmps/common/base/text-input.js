import '../styles/app-styles.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

class TextInput extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .container {
                    display: flex;
                    flex-flow: column;
                    align-items: flex-start;
                }

                .text-box {
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: stretch;
                    color: var(--color-text);
                    background-color: var(--color-page);
                    line-height: var(--line-height-small);
                }

                .text-box--invalid {
                    border-bottom: var(--border-size) solid var(--color-invalid-input);
                }

                .text-box__prefix-container:not([hidden]) {
                    display: flex;
                    align-items: center;
                    background-color: var(--color-page-alt);
                }

                .text-box__prefix {
                    padding: var(--space-small);
                }

                .text-box__input-container {
                    display: flex;
                    align-items: center;
                    flex-grow: 1;
                }

                .text-box__input {
                    -moz-appearance: none;
                    -webkit-appearance: none;
                    border: none;
                    box-shadow: none;
                    color: inherit;
                    font: inherit;
                    width: 100%;
                    box-sizing: border-box;
                    padding: var(--space-small);
                    text-align: inherit;
                }

                .text-box__input::placeholder {
                    color: var(--color-text-note);
                }

                .text-box__input:focus {
                    outline: none;
                }
            </style>

            <div class="container">
                <label for="textInput">
                    <slot></slot>
                </label>

                <div class\$="app__container app__bordered text-box text-box--[[_getValidString(valid)]]">
                    <!-- Extra div required for vertically centering the prefix on IOS devices -->
                    <div
                        class="text-box__prefix-container"
                        hidden="[[!prefix]]"
                    >
                        <span class="text-box__prefix">[[prefix]]</span>
                    </div>
                    <div class="text-box__input-container">
                        <input
                            id="textInput"
                            class="text-box__input"
                            type="text"
                            value="{{value::input}}"
                            placeholder="[[placeholder]]"
                            pattern="[[pattern]]"
                            required="[[required]]"
                            disabled="[[disabled]]"
                        >
                    </div>
                </div>
            </div>
        `;
    }

    static get is() {
        return 'text-input';
    }

    static get properties() {
        return {
            value: {
                type: String,
                value: '',
                notify: true,
                observer: '_onValueChanged'
            },

            // Defaults to at least one non-whitespace character
            pattern: {
                type: String,
                value: '.*\\S.*'
            },

            placeholder: {
                type: String,
                value: ''
            },

            prefix: {
                type: String,
                value: ''
            },

            required: {
                type: Boolean,
                value: false
            },

            disabled: {
                type: Boolean,
                value: false
            },

            valid: {
                type: Boolean,
                value: false,
                readOnly: true,
                notify: true
            },

            _debounceJob: {
                type: Object
            }
        };
    }

    focus() {
        this.$.textInput.focus();
    }

    _getValidString(valid) {
        return valid ? 'valid' : 'invalid';
    }

    _onValueChanged() {
        const setValidProperty = () => {
            this._setValid(this.disabled || this.$.textInput.validity.valid);
        };

        this._debounceJob = Debouncer.debounce(
            this._debounceJob,
            timeOut.after(100),
            setValidProperty
        );
    }
}

customElements.define(TextInput.is, TextInput);
