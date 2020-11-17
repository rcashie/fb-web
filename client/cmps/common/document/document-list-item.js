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
                    padding: var(--space-medium);
                    background-color: var(--color-page);
                }

                .list-item__header {
                    margin-bottom: var(--space-small);
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
                    border-style: solid none none none;
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

                <section class="list-item__content">
                    <document-media
                        class="list-item__media"
                        theme="small"
                        file-name="[[document.media.fileName]]"
                        preview-data="[[document.media.previewData]]"
                    >
                    </document-media>

                    <div class="list-item__attributes">
                        <document-attributes
                            max="3"
                            theme="small"
                            attributes="[[document.attributes]]"
                        >
                        </document-attributes>

                    </div>
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

    static _buildTagMatchMap(termMatches) {
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

        let tagMatchMap = new Map();
        Object.values(termMatches).forEach(matches => {
            matches.forEach(match => {
                match.array_positions.forEach(tagIndex => {
                    if (!tagMatchMap[tagIndex]) {
                        tagMatchMap[tagIndex] = [];
                    }

                    tagMatchMap[tagIndex].push({
                        start: match.start,
                        end: match.end,
                    });
                });
            });
        });

        // Make sure we sort by start position
        Object.values(tagMatchMap).forEach(infoArray => {
            infoArray.sort((left, right) => left.start - right.start);
        });

        return tagMatchMap;
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

    static _markTag(tag, tagIndex, tagMatchMap) {
        const matchInfoArray = tagMatchMap[tagIndex];

        // Assuming we have no overlap across matches...
        // break the tag into parts using the match positions.
        // Then join them back together with mark tags.
        let parts = [];
        let currentPos = 0;
        matchInfoArray.forEach(info => {
            if (currentPos < info.start) {
                parts.push({
                    text: tag.substring(currentPos, info.start),
                    mark: false
                });
            }

            parts.push({
                text: tag.substring(info.start, info.end),
                mark: true
            });

            currentPos = info.end;
        });

        if (currentPos < tag.length) {
            parts.push({
                text: tag.substring(currentPos),
                mark: false
            });
        }

        return parts.map(part => {
            const escaped = DocumentListItem._escapeText(part.text);
            return part.mark ? `<mark>${escaped}</mark>` : escaped;
        }).join('');
    }

    static _buildElementsForTags(tags, termMatches) {
        const tagMatchMap = DocumentListItem._buildTagMatchMap(termMatches);

        let result = [];
        tags.forEach((tag, index) => {
            if (!tagMatchMap[index]) return;
            const marked = DocumentListItem._markTag(tag, index, tagMatchMap);
            result.push(`<span>${marked}</span>`);
        });

        return result;
    }

    _onDocumentChanged(document) {
        if (!document || !document.matches) {
            return;
        }

        const parentTags = document.parentTags ?
            DocumentListItem._buildElementsForTags(
                document.parentTags,
                document.matches.parentTags || {}
            )
            : [];

        const tags = DocumentListItem._buildElementsForTags(
            document.tags,
            document.matches.tags || {}
        );

        const html = parentTags.concat(tags).join('');
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
