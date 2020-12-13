import '../../common/base/name-set.js';
import '../../common/document/document-attributes.js';
import '../../common/document/document-breadcrumbs.js';
import '../../common/document/document-media.js';
import '../../common/styles/app-styles.js';
import '../../common/styles/stencil-styles.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import { IMPORTERS } from '../../common/util/importers.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentInfo extends PolymerElement {
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

                :host([hidden]) {
                    display: none;
                }

                .header {
                    display: flex;
                }

                .header__crumbs {
                    max-width: var(--page-max-width);
                    width: 100%;
                }

                .header__padding {
                    flex-grow: 1;
                    margin-bottom: var(--space-small);
                }

                .body {
                    max-width: var(--page-max-width);
                    margin: 0 auto;
                    padding: 0 var(--space-large);
                }

                .panel__authors {
                    display: flex;
                    flex-flow: row wrap;
                    margin-bottom: var(--space-medium);
                }

                .panel__edit {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .panel__author {
                    margin-right: var(--space-medium);
                }

                .panel__icon {
                    width: 0.8rem;
                    height: 0.8rem;
                    margin-right: var(--space-medium);
                }

                .stencil__body {
                    max-width: var(--page-max-width);
                    margin: 0 auto;
                    padding: 0 var(--space-medium);
                }

                .stencil__media-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            </style>

            <!-- Stencil -->
            <div hidden="[[!showStencil]]">
                <div class="stencil__header">
                </div>

                <div class="app__section stencil__media-container">
                    <div class="stencil__media stencil__media--large">
                    </div>
                </div>

                <div class="stencil__body">
                    <div class="app__section stencil__attribute-container stencil__attribute-container--large">
                        <div class="stencil__attribute"></div>
                        <div class="stencil__attribute"></div>
                        <div class="stencil__attribute"></div>
                        <div class="stencil__attribute"></div>
                        <div class="stencil__attribute"></div>
                        <div class="stencil__attribute"></div>
                    </div>

                    <!-- TODO: Make this string localizable -->
                    <div class="app__section">
                        <h3 class="app__header app__header--medium">
                            Contributors
                        </h3>
                    </div>
                </div>
            </div>

            <article hidden="[[showStencil]]">
                <header class="header">
                    <div class\$="app__theme--[[_getLeftPaddingTheme(document.type)]] header__padding">
                    </div>
                    <document-breadcrumbs
                        class="header__crumbs"
                        document="[[document]]"
                    >
                    </document-breadcrumbs>
                    <div class\$="app__theme--[[document.type]] header__padding">
                    </div>
                </header>

                <document-media
                    class="app__section"
                    file-name="[[document.media.fileName]]"
                    preview-data="[[document.media.previewData]]"
                >
                </document-media>

                <section class="body">
                    <document-attributes
                        class="app__section"
                        attributes="[[document.attributes]]"
                    >
                    </document-attributes>

                    <!-- TODO: Make this string localizable -->
                    <h3 class="app__header app__header--medium">
                        Contributors
                    </h3>
                    <div class="panel__authors">
                        <template
                            is="dom-repeat"
                            items="[[_authorInfo]]"
                        >
                            <a
                                class="panel__author app__hyperlink app__hyperlink--inline"
                                href\$="[[item.url]]"
                            >
                                [[item.display]]
                            </a>
                        </template>
                        <a
                            class="app__hyperlink app__hyperlink--inline"
                            href\$="/props/list/doc/[[document.id]]"
                        >
                            more...
                        </a>
                    </div>

                    <footer class="panel__edit">
                        <img
                            class="panel__icon"
                            src="/static/images/edit-doc.svg"
                            alt=""
                        />
                        <slot name="edit"></slot>
                    </footer>
                </section>
            </article>
        `;
    }

    static get is() {
        return 'document-info';
    }

    static get properties() {
        return {
            document: {
                type: Object,
                observer: '_onDocumentChanged'
            },

            showStencil: {
                type: Boolean,
                value: true
            },

            _authorInfo: {
                type: Array,
            }
        };
    }

    _onDocumentChanged(document) {
        let authors = document.latestAuthors;
        const array = Array.isArray(authors) ? authors : [authors];
        this._authorInfo = array.map(author => {
            if (author.id.startsWith('i:')) {
                return {
                    display: `↯${author.name}`,
                    url: IMPORTERS[author.id]
                };
            }

            return {
                display: `@${author.name}`,
                url: `https://twitter.com/${author.name}`
            };
        });
    }

    _getLeftPaddingTheme(type) {
        return type === 'game' ? 'game' : 'inactive';
    }
}

customElements.define(DocumentInfo.is, DocumentInfo);
