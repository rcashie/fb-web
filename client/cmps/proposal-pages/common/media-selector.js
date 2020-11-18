import '../../common/base/base-button.js';
import '../../common/base/base-spinner.js';
import '../../common/document/document-media.js';
import '../../common/styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class MediaSelector extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .media:not([hidden]) {
                    display: inline-block;
                }

                .container {
                    display: inline-flex;
                    flex-flow: column nowrap;
                    align-items: center;
                    padding: var(--space-large);
                }

                .media-container {
                    display: inline-flex;
                    margin-bottom: var(--space-medium);
                }

                .spinner {
                    width: 8rem;
                }
            </style>

            <iron-ajax
                id="postAjax"
                method="POST"
                url="/upload-api/v1/video"
                on-response="_onPostResponse"
                on-error="_onPostError"
                loading="{{_uploading}}"
            >
            </iron-ajax>

            <slot></slot>

            <input
                id="mediaInput"
                type="file"
                accept="video/webm,video/mp4"
                on-change="_onFileChanged"
                hidden
            >

            <br>
            <div class="app__container app__bordered app__bordered--dashed container">
                <div class="media-container">
                    <document-media
                        class="media"
                        theme="small"
                        file-name="[[fileName]]"
                        preview-data="[[previewData]]"
                        hidden="[[_uploading]]"
                    >
                    </document-media>

                    <base-spinner
                        class="app__media--small spinner"
                        hidden="[[!_uploading]]"
                    >
                    </base-spinner>
                </div>

                <base-button on-click="_onChangeClicked">
                    <!-- TODO: Make string localizable -->
                    Change
                </base-button>
            </div>
        `;
    }

    static get is() {
        return 'media-selector';
    }

    static get properties() {
        return {
            fileName: {
                type: String,
                notify: true
            },

            previewData: {
                type: String,
                notify: true
            },

            _uploading: {
                type: Boolean,
                value: false
            }
        };
    }

    _onFileChanged(event) {
        const file_size_limit = 1000000;
        const file = event.target.files[0];

        if (file.size > file_size_limit) {
            this.dispatchEvent(new CustomEvent('file-size-error'));
            return;
        }

        let ajax = this.$.postAjax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.body = file;
        ajax.generateRequest();
    }

    _onChangeClicked() {
        this.$.mediaInput.click();
    }

    _onPostResponse(event) {
        const response = event.detail.response;
        this.setProperties({
            fileName: response.fileName,
            previewData: response.previewData
        });
    }

    _onPostError(event) {
        if (!event.detail.request.aborted) {
            this.dispatchEvent(new CustomEvent('file-upload-error'));
        }
    }
}

customElements.define(MediaSelector.is, MediaSelector);
