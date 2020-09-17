import '../common/base/boolean-filter.js';
import '../common/base/page-message.js';
import '../common/document/document-list-loader.js';
import '../common/search/search-input.js';
import '../common/styles/app-styles.js';
import './common/document-info.js';
import '@polymer/iron-ajax/iron-ajax.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class GameDocumentPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .search-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: auto;
                    padding: var(--space-medium) var(--space-large);
                }
            </style>

            <iron-ajax
                id="ajax"
                on-response="_onGetResponse"
                on-error="_onGetError"
                loading="{{_showStencil}}"
            >
            </iron-ajax>

            <boolean-filter
                id="hiddenSections"
                names="[[_sectionNames]]"
                value-map="{{_hiddenSections}}"
            >
            </boolean-filter>

            <document-info
                class="app__section"
                document="[[_document]]"
                hidden="[[_hiddenSections.content]]"
                show-stencil="[[_showStencil]]"
            >
                <!-- TODO: Make this string localizable -->
                <span slot="edit">
                    <a
                        class="app__hyperlink app__hyperlink--inline"
                        href\$="/props/new/games?target=[[documentId]]"
                    >
                        Edit
                    </a>
                    this game or
                    <a
                        class="app__hyperlink app__hyperlink--inline"
                        href\$="/props/new/chars?game=[[documentId]]"
                    >
                        Add
                    </a>
                    a character
                </span>
            </document-info>

            <!-- TODO: Make placeholder string localizable -->
            <div class="app__section search-container">
                <search-input
                    placeholder="Search this game's characters and moves"
                    on-invoke-search="_searchInvoked"
                >
                </search-input>
            </div>

            <!-- TODO: Make header string localizable -->
            <document-list-loader
                hidden="[[_hiddenSections.content]]"
                header="Characters"
                page="[[childPage]]"
                fetch-url="/doc-api/v1/docs/chars?game=[[documentId]]"
            >
                <span slot="error">
                    <!-- TODO: Make this string localizable -->
                    Something went wrong; we couldn't load the characters. Maybe try again?
                </span>
            </document-list-loader>

            <!-- TODO: Make string localizable -->
            <page-message
                type="missing"
                message="Whoops! There's no game here."
                hidden="[[_hiddenSections.notFound]]"
            >
            </page-message>

            <page-message hidden="[[_hiddenSections.error]]">
            </page-message>
        `;
    }

    static get is() {
        return 'game-document-page';
    }

    static get properties() {
        return {
            documentId: {
                type: String,
                observer: '_onDocumentIdChanged'
            },

            childPage: {
                type: Number,
                value: 1
            },

            _document: {
                type: Object
            },

            _showStencil: {
                type: Boolean,
                value: true
            },

            _sectionNames: {
                type: Array,
                readOnly: true,
                value: () => ['content', 'notFound', 'error']
            },

            _hiddenSections: {
                type: Object
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._document) {
            this._setDocumentTitle(this._document);
        }
    }

    _onDocumentIdChanged(newValue) {
        this.$.hiddenSections.set('content');

        let ajax = this.$.ajax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.url = `/doc-api/v1/docs/games/${newValue}`;
        ajax.generateRequest();
    }

    _onGetResponse(event) {
        this._document = event.detail.response;
        this._setDocumentTitle(this._document);
    }

    _onGetError(event) {
        const section = (event.detail.request.xhr.status === 404)
            ? 'notFound' : 'error';

        this.$.hiddenSections.set(section);
    }

    _searchInvoked(event) {
        window.history.pushState({}, null, `/search?query=${event.detail}&game=${this.documentId}`);
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    _setDocumentTitle(doc) {
        document.title = `${doc.title} | framebastard`;
    }
}

customElements.define(GameDocumentPage.is, GameDocumentPage);
