import '../base/inline-message.js';
import '../styles/app-styles.js';
import './document-list.js';
import '@polymer/iron-ajax/iron-ajax.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentListLoader extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                    max-width: var(--page-max-width);
                    margin: 0 auto;
                    padding: 0 var(--space-large)
                }

                :host([hidden]) {
                    display: none;
                }

                .header {
                    border-style: none none solid none;
                    display: flex;
                    justify-content: space-between;
                }

                .header__title {
                    margin: 0;
                }

                .header__sub {
                    margin: 0;
                    color: var(--color-text-note);
                }

                .footer {
                    display: flex;
                    justify-content: center;
                }

                .footer__link {
                    margin: 0 var(--space-medium);
                }
            </style>

            <iron-ajax
                id="ajax"
                on-response="_onGetResponse"
                on-error="_onGetError"
                url="[[fetchUrl]]"
            >
            </iron-ajax>

            <article>
                <hgroup class="app__bordered app__section header">
                    <h3 class="app__header app__header--medium header__title">
                        [[header]]
                    </h3>
                    <h4 class="app__header header__sub">
                        <!-- TODO: Make this string localizable -->
                        Page [[page]]
                    </h4>
                </hgroup>

                <document-list
                    id="documentList"
                    show-stencil
                    documents="[[_documents]]"
                    full-crumb-path="[[fullCrumbPath]]"
                >
                </document-list>

                <inline-message
                    id="loadError"
                    type="error"
                >
                    <slot name="error"></slot>
                </inline-message>

                <!-- TODO: Make these string localizable -->
                <footer class="footer">
                    <a
                        class="app__hyperlink app__hyperlink--inline footer__link"
                        href\$="?page=[[_prevPage]]"
                        hidden="[[!_prevPage]]"
                    >
                        &larr; Previous
                    </a>
                    <a
                        class="app__hyperlink app__hyperlink--inline footer__link"
                        href\$="?page=[[_nextPage]]"
                        hidden="[[!_nextPage]]"
                    >
                        Next &rarr;
                    </a>
                </footer>
            </article>
        `;
    }

    static get is() {
        return 'document-list-loader';
    }

    static get properties() {
        return {
            header: {
                type: String
            },

            fetchUrl: {
                type: String
            },

            fullCrumbPath: {
                type: Boolean,
                value: false
            },

            page: {
                type: Number,
                value: 1
            },

            pageSize: {
                type: Number,
                value: 10
            },

            _documents: {
                type: Array,
                value: () => []
            },

            _nextPage: {
                type: Number,
                value: null
            },

            _prevPage: {
                type: Number,
                value: null
            }
        };
    }

    static get observers() {
        return [
            '_onParamsChanged(page, pageSize, fetchUrl)'
        ];
    }

    _onParamsChanged(page, pageSize) {
        this.$.loadError.hide();
        this.$.documentList.showStencil = true;

        this.setProperties({
            _documents: [],
            _nextPage: null,
            _prevPage: null
        });

        let ajax = this.$.ajax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.params = {
            offset: (page - 1) * pageSize,
            limit: pageSize,
        };

        ajax.generateRequest();
    }

    _onGetResponse(event) {
        const response = event.detail.response;
        const documents = response.page;

        const isLastPage = (this.page * this.pageSize) >= response.totalCount;
        this.setProperties({
            _documents: documents,
            _nextPage: isLastPage ? null : this.page + 1,
            _prevPage: this.page > 1 ? this.page - 1 : null
        });

        this.$.loadError.hide();
        this.$.documentList.showStencil = false;
    }

    _onGetError(event) {
        if (!event.detail.request.aborted) {
            this.$.loadError.show();
        }
    }
}

customElements.define(DocumentListLoader.is, DocumentListLoader);
