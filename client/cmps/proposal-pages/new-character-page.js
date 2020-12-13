import '../common/base/base-button.js';
import '../common/base/boolean-filter';
import '../common/base/inline-message.js';
import '../common/base/page-message.js';
import '../common/base/sign-in-dialog.js';
import '../common/base/text-input.js';
import '../common/styles/app-styles.js';
import './common/media-selector.js';
import './common/proposal-page-styles.js';
import './common/name-set-editor.js';
import '@polymer/iron-ajax/iron-ajax.js';
import { AttributeSetEditor } from './common/attribute-set-editor.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getUserClaims } from '../common/util/cookie.js';

class NewCharacterPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style include="proposal-page-styles">
            </style>

            <style>
                :host {
                    display: block;
                    max-width: var(--page-max-width);
                    margin: var(--space-medium) auto;
                }
            </style>

            <iron-ajax
                id="getAjax"
                on-response="_onGetResponse"
                on-error="_onGetError"
            >
            </iron-ajax>

            <iron-ajax
                id="postAjax"
                method="POST"
                url="/doc-api/v1/props/chars"
                content-type="application/json"
                on-response="_onPostResponse"
                on-error="_onPostError"
            >
            </iron-ajax>

            <boolean-filter
                id="hiddenSections"
                names="[[_sectionNames]]"
                value-map="{{_hiddenSections}}"
            >
            </boolean-filter>

            <sign-in-dialog
                id="signInDialog"
                cancel-url="[[_getCancelSignInUrl(queryParams)]]"
            >
            </sign-in-dialog>

            <article hidden="[[_hiddenSections.content]]">

                <header class="page-banner page-banner--with-buttons">
                    <h2 class="app__header app__header--large page-banner__header">
                        [[_getHeader(queryParams.target)]]
                    </h2>

                    <!-- TODO: Make this string localizable -->
                    <base-button
                        class="page-banner__button"
                        id="submitButton"
                        theme="action"
                        on-click="_onSubmitClicked"
                    >
                        Submit
                    </base-button>
                </header>

                <inline-message
                    id="inlineError"
                    type="error"
                >
                    [[_errorMessage]]
                </inline-message>

                <!-- TODO: Make the label & placeholder localizable -->
                <text-input
                    id="charTitle"
                    class="page-item"
                    value="{{_title}}"
                    placeholder="e.g. Ryu"
                    required
                >
                    Title
                </text-input>

                <!-- TODO: Make the label & placeholder localizable -->
                <text-input
                    id="charId"
                    class="page-item"
                    value="{{_id}}"
                    placeholder="e.g. ryu"
                    prefix="[[_getIdPrefix(queryParams)]]"
                    pattern="\\s*[a-z0-9-_]+\\s*"
                    disabled="[[queryParams.target]]"
                    required
                >
                    Short name
                    <span class="page-note">(May only contain characters 'a-z', '0-9', '-' and '_')</span>
                </text-input>

                <!-- TODO: Make the label localizable -->
                <media-selector
                    class="page-item"
                    file-name="{{_media.fileName}}"
                    preview-data="{{_media.previewData}}"
                    on-file-size-error="_onFileSizeError"
                    on-file-upload-error="_onFileUploadError"
                >
                    Video
                    <span class="page-note">(Upload a video that's less than 1 MB)</span>
                </media-selector>

                <name-set-editor
                    class="page-item"
                    names="{{_names}}"
                >
                    Aliases
                    <span class="page-note">(Other names this character may be called)</span>
                </name-set-editor>

                <!-- TODO: Make this string localizable -->
                <h3 class="app__header app__header--medium page-section-start">
                    Attributes
                </h3>

                <!-- TODO: Make these placeholders localizable -->
                <attribute-set-editor
                    id="charAttributes"
                    title-placeholder="e.g. Health"
                    value-placeholder="e.g. 1000"
                    attributes="{{_attributes}}"
                >
                </attribute-set-editor>
            </article>

            <page-message hidden="[[_hiddenSections.error]]">
            </page-message>
        `;
    }

    static get is() {
        return 'new-character-page';
    }

    static get properties() {
        return {
            queryParams: {
                type: Object,
                observer: '_onQueryParamsChanged'
            },

            _gameId: {
                type: String,
                value: ''
            },

            _id: {
                type: String,
                value: ''
            },

            _title: {
                type: String,
                value: ''
            },

            _names: {
                type: Array
            },

            _attributes: {
                type: Array,
                value: () => {
                    return [
                        AttributeSetEditor.createBlankAttribute()
                    ];
                }
            },

            _media: {
                type: Object,
                value: () => {
                    return {
                        fileName: '',
                        previewData: ''
                    };
                }
            },

            _errorMessage: {
                type: String,
                value: ''
            },

            _sectionNames: {
                type: Array,
                readOnly: true,
                value: () => [
                    'stencil',
                    'content',
                    'error'
                ]
            },

            _hiddenSections: {
                type: Object
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        // TODO: Make this string localizable
        document.title = 'New character proposal | framebastard';
    }

    _onQueryParamsChanged(newParams) {
        if (!getUserClaims()) {
            this.$.signInDialog.show();
        }

        let section;
        const target = newParams.target;
        if (target) {
            let ajax = this.$.getAjax;
            if (ajax.lastRequest) {
                ajax.lastRequest.abort();
            }

            ajax.url = `/doc-api/v1/docs/chars/${decodeURI(target)}`;
            ajax.generateRequest();
            section = 'stencil';
        } else {
            this._gameId = decodeURI(newParams.game);
            section = 'content';
        }

        this.$.hiddenSections.set(section);
    }

    _getCancelSignInUrl(queryParams) {
        const target = queryParams.target;
        return target
            ? `/docs/chars/${target}`
            : `/docs/games/${queryParams.game}`;
    }

    _getIdPrefix(queryParams) {
        const gameId = queryParams.game;
        return gameId ? `${gameId}.` : '';
    }

    _onGetResponse(event) {
        const document = event.detail.response;
        let attributes = document.attributes;
        attributes.forEach(attr => attr.sentiment = attr.sentiment || 'neutral');

        this.setProperties({
            _gameId: document.game.id,
            _id: document.id,
            _title: document.title,
            _names: document.names || [],
            _attributes: attributes,
            _media: document.media || {}
        });

        this.$.hiddenSections.set('content');
    }

    _onGetError() {
        this.$.hiddenSections.set('error');
    }

    _onSubmitClicked() {
        if (!this.$.charId.valid
            || !this.$.charTitle.valid
            || !this.$.charAttributes.valid) {
            // TODO: Make this string localizable
            this._errorMessage = 'Please fill in or correct the highlighted areas.';
            this.$.inlineError.show();
            return;
        }

        let ajax = this.$.postAjax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.body = {
            target: `${this._getIdPrefix(this.queryParams)}${this._id}`,
            document: {
                game: this._gameId,
                title: this._title,
                attributes: this._attributes,
                media: this._media,
                names: this._names
            }
        };

        this.$.submitButton.disabled = true;
        ajax.generateRequest();
    }

    _onPostResponse(event) {
        let response = event.detail.response;
        window.history.pushState({}, null, `/props/view/any/${response.proposal}/${response.version}`);
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    _onPostError(event) {
        // TODO: Make these strings localizable
        this._errorMessage = event.detail.request.status === 401
            ? 'Darn, you are no longer logged in. Please login'
            : 'Something went wrong; we couldn\'t submit your character. Maybe try again?';

        this.$.inlineError.show();
        this.$.submitButton.disabled = false;
    }

    _onFileSizeError() {
        // TODO: Make this string localizable
        this._errorMessage = 'Hmm, your file is too big. Files must be 1MB or less.';
        this.$.inlineError.show();
    }

    _onFileUploadError() {
        // TODO: Make this string localizable
        this._errorMessage = 'Something went wrong; we couldn\'t upload your file. Maybe try again?';
        this.$.inlineError.show();
    }

    _getHeader(target) {
        // TODO: Make these strings localizable
        return target ?
            `Propose changes to ${target}`
            : 'Propose a new character';
    }
}

customElements.define(NewCharacterPage.is, NewCharacterPage);
