import '../styles/app-styles.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentMedia extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                    overflow: hidden;
                }

                :host([hidden]) {
                    display: none;
                }

                .media-container {
                    display: flex;
                    justify-content: center;
                    margin: 0;
                    overflow: hidden;
                }

                .media-container--small {
                    background-image: none;
                }

                .media-container--large {
                    background-image: url('/static/images/preview-pattern.png');
                }

                .media {
                    width: auto;
                    height: 100%;
                    background-color: var(--color-page);
                }

                .media--small {
                    padding: 0;
                }

                .media--large {
                    padding: 0 var(--space-small);
                }

                .video--loading {
                    filter: blur(0.1rem);
                }

                .video--loaded {
                    animation-name: fade-in;
                    animation-duration: 1s;
                    animation-fill-mode: forwards;
                }

                @keyframes fade-in {
                    from {
                        filter: blur(0.1rem);
                    }

                    to {
                        filter: blur(0);
                    }
                }
            </style>

            <figure class\$="app__media--[[theme]] media-container media-container--[[theme]]">
                <template
                    is="dom-if"
                    if="[[!_fileName]]"
                >
                    <img
                        class\$="media media--[[theme]]"
                        src="/static/images/placeholder.jpg"
                        alt="Placeholder image"
                    />
                </template>

                <template
                    is="dom-if"
                    if="[[_fileName]]"
                    restamp
                >
                    <video
                        class\$="media media--[[theme]] video--[[_getLoadedString(_loaded)]]"
                        loop
                        muted
                        autoplay
                        playsinline
                        on-loadeddata="_onLoadedData"
                        poster="data:image/jpeg;charset=utf-8;base64,[[previewData]]"
                    >
                        <source
                            src="/uploads/[[_fileName]].webm"
                            type="video/webm"
                        >

                        <source
                            src="/uploads/[[_fileName]].mp4"
                            type="video/mp4"
                        >

                        <!-- TODO: Make string localizable -->
                        Your browser does not support the video element
                    </video>
                </template>
            </figure>
        `;
    }

    static get is() {
        return 'document-media';
    }

    static get properties() {
        return {
            fileName: {
                type: String,
                value: null,
                observer: '_onFileNameChanged'
            },

            previewData: {
                type: String,
                value: null
            },

            theme: {
                type: String,
                value: 'large'
            },

            _fileName: {
                type: String,
                value: null
            },

            _loaded: {
                type: Boolean,
                value: false
            },

            _visibilityChangedHandler: {
                type: Object
            }
        };
    }

    constructor() {
        super();
        this._visibilityChangedHandler = this._onVisibilityChanged.bind(this);
    }

    connectedCallback() {
        // TODO RC: This creates an event handler for ALL instances
        // of this object. We only need one.
        super.connectedCallback();
        document.addEventListener(
            'visibilitychange',
            this._visibilityChangedHandler,
            { passive: true }
        );
    }

    disconnectedCallback() {
        // TODO RC: This creates an event handler for ALL instances
        // of this object. We only need one.
        super.disconnectedCallback();
        document.removeEventListener(
            'visibilitychange',
            this._visibilityChangedHandler,
            { passive: true }
        );
    }

    _onVisibilityChanged() {
        let video = this.shadowRoot.querySelector('video');
        if (!video) {
            return;
        }

        if (document.visibilityState === 'visible') {
            video.play();
        } else {
            video.pause();
        }
    }

    _onLoadedData() {
        this._loaded = true;
    }

    _getLoadedString(loaded) {
        return loaded ? 'loaded' : 'loading';
    }

    _onFileNameChanged(fileName) {
        // Set the '_fileName' property on another frame to restamp the video element
        this.setProperties({
            _fileName: null,
            _loaded: false
        });

        window.requestAnimationFrame(() => this._fileName = fileName);
    }
}

customElements.define(DocumentMedia.is, DocumentMedia);
