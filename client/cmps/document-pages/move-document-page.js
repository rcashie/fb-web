import '../common/base/boolean-filter.js';
import '../common/base/page-message.js';
import '../common/styles/app-styles.js';
import './common/document-info.js';
import '@polymer/iron-ajax/iron-ajax.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class MoveDocumentPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
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
                        href\$="/props/new/moves?target=[[documentId]]"
                    >
                        Edit
                    </a>
                    this move
                </span>
            </document-info>

            <!-- TODO: Make string localizable -->
            <page-message
                type="missing"
                message="Whoops! There's no move here."
                hidden="[[_hiddenSections.notFound]]"
            >
            </page-message>

            <page-message hidden="[[_hiddenSections.error]]">
            </page-message>
        `;
    }

    static get is() {
        return 'move-document-page';
    }

    static get properties() {
        return {
            documentId: {
                type: String,
                observer: '_onDocumentIdChanged'
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
        ajax.url = `/doc-api/v1/docs/moves/${newValue}`;
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

    _setDocumentTitle(doc) {
        document.title = `${doc.game.title} → ${doc.character.title} → ${doc.title} | framebastard`;
    }
}

customElements.define(MoveDocumentPage.is, MoveDocumentPage);
