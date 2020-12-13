import '../styles/app-styles.js';
import './document-attributes.js';
import './document-breadcrumbs.js';
import './document-media.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class DocumentListItem extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                mark {
                    color: inherit;
                    background-color: inherit;
                    font-weight: var(--font-weight-bold);
                }

                .list-item {
                    overflow: hidden;
                    background-color: var(--color-page);
                }

                .list-item__header {
                    overflow: hidden;
                    margin: var(--space-small);
                    border-radius: var(--border-radius-inner) var(--border-radius-inner) 0 0;
                }

                .list-item__body {
                    padding: var(--space-large);
                }

                .list-item__content {
                    display: flex;
                    flex-flow: row nowrap;
                }

                .list-item__media {
                    margin-right: var(--space-large);
                    flex-shrink: 0;
                }

                .list-item__attributes {
                    flex-grow: 1;
                    overflow: hidden;
                }

                .list-item__more {
                    text-align: right;
                }

                .list-item__match-container:not([hidden]) {
                    display: flex;
                    flex-flow: column nowrap;
                    align-content: center;
                    border-style: dashed none none none;
                    font-size: var(--font-size-small);
                    color: var(--color-text-note);
                }

            </style>

            <article class="app__container app__bordered app__shadowed list-item">
                <header class="list-item__header">
                    <document-breadcrumbs
                        document="[[document]]"
                        full-path="[[fullCrumbPath]]"
                    >
                    </document-breadcrumbs>
                </header>

                <div class="list-item__body">
                    <section class="list-item__content">
                        <document-media
                            class="list-item__media"
                            theme="small"
                            file-name="[[document.media.fileName]]"
                            preview-data="[[document.media.previewData]]"
                        >
                        </document-media>

                        <document-attributes
                            class="list-item__attributes"
                            max="3"
                            theme="small"
                            attributes="[[document.attributes]]"
                        >
                        </document-attributes>
                    </section>

                    <div class="list-item__more">
                        <a
                            class="app__hyperlink app__hyperlink--inline"
                            href\$="[[_getUrl(document)]]"
                        >
                            <!-- TODO: Make string localizable -->
                            more...
                        </a>
                    </div>

                    <footer
                        id="matchContainer"
                        class="app__bordered list-item__match-container"
                        hidden="[[!document.matches]]"
                    >
                    </footer>
                </div>
            </article>
        `;
    }

    static get is() {
        return 'document-list-item';
    }

    static get properties() {
        return {
            document: {
                type: Object,
                observer: '_onDocumentChanged'
            },

            fullCrumbPath: {
                type: Boolean,
                value: false
            }
        };
    }

    static _buildNameMatchMap(termMatches) {
        /* Example input into this function
        {
            "term": [
                {
                    "array_positions": [ 1 ],
                    "end": 4,
                    "start": 0
                },
                {
                    "array_positions": [ 1 ],
                    "end": 13,
                    "start": 9
                }
            ]
            "term2": ...
        }
        */

        let nameMatchMap = new Map();
        Object.values(termMatches).forEach(matches => {
            matches.forEach(match => {
                match.array_positions.forEach(nameIndex => {
                    if (!nameMatchMap[nameIndex]) {
                        nameMatchMap[nameIndex] = [];
                    }

                    nameMatchMap[nameIndex].push({
                        start: match.start,
                        end: match.end,
                    });
                });
            });
        });

        // Make sure we sort by start position
        Object.values(nameMatchMap).forEach(infoArray => {
            infoArray.sort((left, right) => left.start - right.start);
        });

        return nameMatchMap;
    }

    static _escapeText(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    }

    static _markName(name, nameIndex, nameMatchMap) {
        const matchInfoArray = nameMatchMap[nameIndex];

        // Assuming we have no overlap across matches...
        // break the name into parts using the match positions.
        // Then join them back together with mark names.
        let parts = [];
        let currentPos = 0;
        matchInfoArray.forEach(info => {
            if (currentPos < info.start) {
                parts.push({
                    text: name.substring(currentPos, info.start),
                    mark: false
                });
            }

            parts.push({
                text: name.substring(info.start, info.end),
                mark: true
            });

            currentPos = info.end;
        });

        if (currentPos < name.length) {
            parts.push({
                text: name.substring(currentPos),
                mark: false
            });
        }

        return parts.map(part => {
            const escaped = DocumentListItem._escapeText(part.text);
            return part.mark ? `<mark>${escaped}</mark>` : escaped;
        }).join('');
    }

    static _buildElementsForNames(names, termMatches) {
        const nameMatchMap = DocumentListItem._buildNameMatchMap(termMatches);

        let result = [];
        names.forEach((name, index) => {
            // Continue if we don't have a match
            if (!nameMatchMap[index]) return;

            // Otherwise build the element
            const marked = DocumentListItem._markName(name, index, nameMatchMap);
            result.push(`<span>${marked}</span>`);
        });

        return result;
    }

    _onDocumentChanged(document) {
        if (!document || !document.matches) {
            return;
        }

        const parentNames = document.parentNames ?
            DocumentListItem._buildElementsForNames(
                document.parentNames,
                document.matches.parentNames || {}
            )
            : [];

        const names = DocumentListItem._buildElementsForNames(
            document.names,
            document.matches.names || {}
        );

        const html = parentNames.concat(names).join('');
        this.shadowRoot.querySelector('#matchContainer').innerHTML = html;
    }

    _getUrl(document) {
        const urlRootMap = {
            'game': 'games',
            'character': 'chars',
            'move': 'moves'
        };

        return `/docs/${urlRootMap[document.type]}/${document.id}`;
    }
}

customElements.define(DocumentListItem.is, DocumentListItem);
