import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class InlineMessage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .message {
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-medium) var(--space-large);
                    background-color: var(--color-sentiment-negative);
                    margin: var(--space-large) 0;
                }

                .message__close-icon {
                    width: 1rem;
                    height: 1rem;
                    cursor: pointer;
                    margin-left: var(--space-large);
                }
            </style>

            <template
                is="dom-if"
                if="[[_shown]]"
            >
                <section class\$="app__container app__sentiment-[[_getSentiment(type)]] message">
                    <slot></slot>

                    <!-- TODO: Make the alt string localizable -->
                    <img
                        class="message__close-icon"
                        src="/static/images/close.svg"
                        on-click="hide"
                        alt="Close button"
                    />
                </section>
            </template>
        `;
    }

    static get is() {
        return 'inline-message';
    }

    static get properties() {
        return {
            type: {
                type: String,
                value: 'error'
            },

            _shown: {
                type: Boolean,
                value: false
            }
        };
    }

    show() {
        // TODO: Pop in animation
        this._shown = true;
    }

    hide() {
        // TODO: Pop out animation
        this._shown = false;
    }

    _getSentiment(type) {
        const map = {
            error: 'negative',
            success: 'positive'
        };

        return map[type] || 'neutral';
    }
}

customElements.define(InlineMessage.is, InlineMessage);
