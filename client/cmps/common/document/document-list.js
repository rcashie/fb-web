import '../styles/app-styles.js';
import '../styles/stencil-styles.js';
import './document-list-item.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentList extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style include="stencil-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .list:not([hidden]) {
                    display: grid;
                    grid-template-columns: 48% 48%;
                    justify-items: center;
                    justify-content: space-between;
                }

                @media (max-width: 40rem) {
                    .list:not([hidden]) {
                        grid-template-columns: 100%;
                        justify-content: center;
                    }
                }

                .list__item {
                    width: 100%;
                }

                .stencil__body {
                    display: flex;
                    flex-flow: row nowrap;
                    padding: var(--space-large);
                }

                .stencil__attribute-container {
                    flex-grow: 1;
                    padding-left: var(--space-large);
                }
            </style>

            <div
                class="list"
                hidden="[[!showStencil]]"
            >
                <div class="app__container app__shadowed app__section list__item">
                    <div class="stencil__header">
                    </div>

                    <div class="stencil__body">
                        <div class="stencil__media stencil__media--small">
                        </div>

                        <div class="stencil__attribute-container stencil__attribute-container--small">
                            <div class="stencil__attribute"></div>
                            <div class="stencil__attribute"></div>
                            <div class="stencil__attribute"></div>
                        </div>
                    </div>
                </div>

                <div class="app__container app__shadowed app__section list__item">
                    <div class="stencil__header">
                    </div>

                    <div class="stencil__body">
                        <div class="stencil__media stencil__media--small">
                        </div>

                        <div class="stencil__attribute-container stencil__attribute-container--small">
                            <div class="stencil__attribute"></div>
                            <div class="stencil__attribute"></div>
                            <div class="stencil__attribute"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="list"
                hidden="[[showStencil]]"
            >
                <template
                    is="dom-repeat"
                    items="[[documents]]"
                >
                    <document-list-item
                        class="app__section list__item"
                        document="[[item]]"
                        full-crumb-path="[[fullCrumbPath]]"
                    >
                    </document-list-item>
                </template>
            </div>
        `;
    }

    static get is() {
        return 'document-list';
    }

    static get properties() {
        return {
            documents: {
                type: Array,
                value: () => []
            },

            showStencil: {
                type: Boolean,
                value: true
            },

            fullCrumbPath: {
                type: Boolean,
                value: false
            }
        };
    }
}

customElements.define(DocumentList.is, DocumentList);
