import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class RadioGroup extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: inline-block;
                }

                .options {
                    display: flex;
                    border: none;
                    padding: 0;
                    margin: 0;
                }

                .options--horizontal {
                    flex-flow: row wrap;
                }

                .options--vertical {
                    flex-flow: column wrap;
                }

                .options__item {
                    display: flex;
                    align-items: center;
                    margin: var(--space-small) var(--space-large) var(--space-small) 0;
                }

                .options__radio {
                    -moz-appearance: none;
                    -webkit-appearance: none;
                    width: 1rem;
                    height: 1rem;
                    border-radius: 50%;
                    outline: none;
                    margin: 0 var(--space-medium) 0 0;
                    background-color: var(--color-page);
                }

                .options__radio:checked {
                    background-color: var(--color-button-action);
                    border: none;
                }

                .options__radio:focus {
                    border: var(--border-size) dotted var(--color-darker-border);
                }
            </style>

            <slot></slot>
            <ul class\$="options options--[[layout]]">
                <template
                    is="dom-repeat"
                    items="[[options]]"
                >
                    <li class="options__item">
                        <input
                            id="[[item.value]]"
                            class="app__bordered options__radio"
                            type="radio"
                            value="[[item.value]]"
                            checked="[[_isChecked(item.value, value)]]"
                            on-click="_onOptionClicked"
                        >
                        <label for\$="[[item.value]]">[[item.label]]</label>
                    </li>
                </template>
            </ul>
        `;
    }

    static get is() {
        return 'radio-group';
    }

    static get properties() {
        return {
            options: {
                type: Array,
                value: () => []
            },

            value: {
                type: String,
                notify: true,
                value: ''
            },

            layout: {
                type: String,
                value: 'horizontal',
            }
        };
    }

    _onOptionClicked(event) {
        this.value = event.target.value;
    }

    _isChecked(optionValue, currentValue) {
        return optionValue === currentValue;
    }
}

customElements.define(RadioGroup.is, RadioGroup);
