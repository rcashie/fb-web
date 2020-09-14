import '../styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class BaseButton extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: inline-block;
                }

                :host([hidden]) {
                    display: none;
                }

                :host([disabled]) {
                    pointer-events: none;
                }

                .button {
                    cursor: pointer;
                    padding: var(--space-medium) var(--space-large);
                    font-family: inherit;
                    font-size: var(--font-size-normal);
                    line-height: var(--line-height-small);
                }

                .button[disabled] {
                    cursor: default;
                }

                .button--neutral {
                    background-color: var(--color-button-neutral);
                    font-weight: var(--font-weight-normal);
                }

                .button--neutral[disabled] {
                    background-color: var(--color-disabled-button-neutral);
                }

                .button--action {
                    border: none;
                    background-color: var(--color-button-action);
                    font-weight: var(--font-weight-bold);
                }

                .button--action[disabled] {
                    background-color: var(--color-disabled-button-action);
                }
           </style>

            <button
                class\$="app__container app__bordered button button--[[theme]]"
                type="button"
                disabled="[[disabled]]"
            >
                <slot></slot>
            </button>
        `;
    }

    static get is() {
        return 'base-button';
    }

    static get properties() {
        return {
            theme: {
                type: String,
                value: 'neutral'
            },

            disabled: {
                type: Boolean,
                value: false
            }
        };
    }
}

customElements.define(BaseButton.is, BaseButton);
