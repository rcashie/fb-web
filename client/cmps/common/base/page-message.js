import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class PageMessage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                :host([hidden]) {
                    display: none;
                }

                .message {
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: center;
                }

                .message__body {
                    text-align: center;
                }

                .app__header--medium {
                    padding: var(--space-medium) var(--space-large);
                }
            </style>

            <section class="message">
                <header class="message__body">
                    <h2 class\$="app__container app__header app__header--medium app__sentiment-[[_getSentiment(type)]]">
                        [[message]]
                    </h2>
                </header>

                <template
                    is="dom-if"
                    if="[[_showImage(hidden, type)]]"
                >
                    <!-- TODO: Make the alt string localizable -->
                    <img
                        src="/static/images/message-[[type]].png"
                        alt="Message characterization"
                    />
                </template>
            </section>
        `;
    }

    static get is() {
        return 'page-message';
    }

    static get properties() {
        return {
            message: {
                type: String,
                /* TODO: Localize this string */
                value: 'Ugh... not sure what happened there.'
            },

            type: {
                type: String,
                value: 'error'
            },

            hidden: {
                type: Boolean,
                reflectToAttribute: true
            }
        };
    }

    _getSentiment(type) {
        const map = {
            error: 'negative',
            missing: 'negative',
            success: 'positive'
        };

        return map[type] || 'neutral';
    }

    /**
     * Prevents images from being fetched unless absolutely necessary.
     */
    _showImage(hidden, type) {
        return !hidden && (
            type === 'error'
            || type === 'missing'
            || type === 'success'
        );
    }
}

customElements.define(PageMessage.is, PageMessage);
