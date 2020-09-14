import '../styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentBreadcrumbs extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    --crumb-size: 1.6rem;
                    --crumb-bridge-width: 1.4rem;

                    display: block;
                }

                .crumbs {
                    display: flex;
                    flex-flow: row wrap;
                    margin: 0;
                    padding: 0;
                }

                .crumbs__item:not([hidden]) {
                    display: flex;
                    flex-flow: row nowrap;
                    flex-grow: 1;
                    height: var(--crumb-size);
                    line-height: var(--crumb-size);
                    margin-bottom: var(--space-small);
                    text-align: center;
                    overflow: hidden;
                }

                .crumbs__title {
                    flex-grow: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    margin: 0 var(--space-medium);
                }

                .app__theme--inactive .crumbs__title {
                    color: var(--color-text-note);
                }

                .crumbs__bridge {
                    height: 100%;
                    overflow: hidden;
                    position: relative;
                    width: var(--crumb-size);
                    padding-right: var(--space-small);
                }

                .crumbs__bridge::before {
                    content: '';
                    position: absolute;
                    left: calc(var(--crumb-size) / -2 + 0.3rem);
                    width: var(--crumb-size);
                    height: var(--crumb-size);
                    transform: rotate(45deg);
                    background-color: var(--color-page);
                }

                .crumbs__bridge-arrow {
                    position: absolute;
                    left: calc(var(--crumb-size) / -2);
                    width: var(--crumb-size);
                    height: var(--crumb-size);
                    transform: rotate(45deg);
                }
            </style>

            <nav>
                <ul class="crumbs">
                    <li
                        class\$="app__theme--[[_crumbData.game.theme]] crumbs__item"
                        hidden="[[_crumbData.game.hidden]]"
                    >
                        <a
                            class="app__hyperlink crumbs__title"
                            href\$="[[_crumbData.game.url]]"
                        >
                            [[_crumbData.game.title]]
                        </a>
                        <div
                            class\$="app__theme--[[_crumbData.character.theme]] crumbs__bridge"
                            hidden="[[_crumbData.character.hidden]]"
                        >
                            <div class\$="app__theme--[[_crumbData.game.theme]] crumbs__bridge-arrow"></div>
                        </div>
                    </li>
                    <li
                        class\$="app__theme--[[_crumbData.character.theme]] crumbs__item"
                        hidden="[[_crumbData.character.hidden]]"
                    >
                        <a
                            class="app__hyperlink crumbs__title"
                            href\$="[[_crumbData.character.url]]"
                        >
                            [[_crumbData.character.title]]
                        </a>
                        <div
                            class\$="app__theme--[[_crumbData.move.theme]] crumbs__bridge"
                            hidden="[[_crumbData.move.hidden]]"
                        >
                            <div class\$="app__theme--[[_crumbData.character.theme]] crumbs__bridge-arrow"></div>
                        </div>
                    </li>
                    <li
                        class="app__theme--move crumbs__item"
                        hidden="[[_crumbData.move.hidden]]"
                    >
                        <a
                            class="app__hyperlink crumbs__title"
                            href\$="[[_crumbData.move.url]]"
                        >
                            [[_crumbData.move.title]]
                        </a>
                    </li>
                </ul>
            </nav>
        `;
    }

    static get is() {
        return 'document-breadcrumbs';
    }

    static get properties() {
        return {
            document: {
                type: Object
            },

            fullPath: {
                type: Boolean,
                value: true
            },

            isProposal: {
                type: Boolean,
                value: false
            },

            _crumbData: {
                type: Object,
                value: DocumentBreadcrumbs._getDefaultCrumbData()
            }
        };
    }

    static get observers() {
        return [
            '_updateCrumbData(document, fullPath, isProposal)'
        ];
    }

    static _getDefaultCrumbData() {
        const emptyCrumb = {
            title: '',
            url: '#',
            hidden: true,
            theme: 'inactive'
        };

        return {
            game: emptyCrumb,
            character: emptyCrumb,
            move: emptyCrumb
        };
    }

    static _getDocumentCrumbData(document, type, fullPath, out) {
        const urlRootMap = {
            'game': 'games',
            'character': 'chars',
            'move': 'moves'
        };

        const lastCrumb = document.type === type;
        const source = lastCrumb ? document : document[type];
        out[type] = {
            title: source.title,
            url: `/docs/${urlRootMap[type]}/${source.id}`,
            hidden: !(lastCrumb || fullPath),
            theme: lastCrumb ? type : 'inactive'
        };

        return lastCrumb;
    }

    static _getProposalCrumbData(document, type, fullPath, out) {
        const inner_document = document.document;
        const lastCrumb = inner_document.type === type;
        if (!lastCrumb) {
            return DocumentBreadcrumbs._getDocumentCrumbData(inner_document, type, fullPath, out);
        }

        out[type] = {
            title: inner_document.title,
            url: `/props/view/any/${document.id}/${document.version}`,
            hidden: false,
            theme: type
        };

        return true;
    }

    _updateCrumbData(document, fullPath, isProposal) {
        if (!document) {
            return;
        }

        const func = isProposal
            ? DocumentBreadcrumbs._getProposalCrumbData
            : DocumentBreadcrumbs._getDocumentCrumbData;

        let data = DocumentBreadcrumbs._getDefaultCrumbData();
        ['game', 'character', 'move'].some(type => func(document, type, fullPath, data));
        this._crumbData = data;
    }
}

customElements.define(DocumentBreadcrumbs.is, DocumentBreadcrumbs);
