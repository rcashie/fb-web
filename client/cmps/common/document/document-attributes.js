import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentAttributes extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                    overflow: hidden;
                    line-height: var(--line-height-small);
                }

                .grid {
                    display: grid;
                    justify-items: center;
                    justify-content: space-between;
                }

                .grid--small {
                    grid-template-columns: 100%;
                    grid-gap: var(--space-medium);
                }

                .grid--large {
                    grid-template-columns: 30% 30% 30%;
                    grid-gap: var(--space-large);
                }

                @media (max-width: 40rem) {
                    .grid--large {
                        grid-template-columns: 45% 45%;
                    }
                }

                @media (max-width: 25rem) {
                    .grid--large {
                        grid-template-columns: 100%;
                    }
                }

                .attribute-container {
                    width: 100%;
                }

                .attribute-container::after {
                    content: '';
                    display: block;
                    margin: 0 auto;
                    height: var(--space-small);
                }

                .attribute-container--neutral::after {
                    background-color: var(--color-sentiment-neutral);
                }

                .attribute-container--positive::after {
                    background-color: var(--color-sentiment-positive);
                }

                .attribute-container--negative::after {
                    background-color: var(--color-sentiment-negative);
                }

                .attribute {
                    display: flex;
                    justify-content: space-between;
                    margin: 0 auto;
                    white-space: nowrap;
                }

                .attribute__title {
                    padding: var(--space-small) 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .attribute__value {
                    padding: var(--space-small) var(--space-medium);
                }
            </style>

            <section class\$="grid grid--[[theme]]">
                <template
                    is="dom-repeat"
                    items="[[_getAttributes(attributes)]]"
                >
                    <div class\$="attribute-container attribute-container--[[_getSentiment(item.sentiment)]]">
                        <div class="attribute">
                            <span class="attribute__title">
                                [[item.title]]
                            </span>
                            <span class\$="attribute__value app__sentiment-[[_getSentiment(item.sentiment)]]">
                                [[item.value]]
                            </span>
                        </div>
                    </div>
                </template>
            </section>
        `;
    }

    static get is() {
        return 'document-attributes';
    }

    static get properties() {
        return {
            attributes: {
                type: Array,
                value: () => []
            },

            max: {
                type: Number,
                value: 0
            },

            theme: {
                type: String,
                value: 'large'
            }
        };
    }

    _getSentiment(value) {
        return value ? value : 'neutral';
    }

    _getAttributes(attributes) {
        return this.max && attributes
            ? attributes.slice(0, this.max + 1) : attributes;
    }
}

customElements.define(DocumentAttributes.is, DocumentAttributes);
