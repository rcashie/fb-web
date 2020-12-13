import '../../common/base/name-set.js';
import '../../common/document/document-attributes.js';
import '../../common/document/document-media.js';
import '../../common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class ProposalItem extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                :host([hidden]) {
                    display: none;
                }

                .header {
                    text-align: center;
                    margin-bottom: var(--space-small);
                }

                .attributes {
                    margin: 0 var(--space-medium);
                }

                .names {
                    margin: var(--space-section) var(--space-medium) var(--space-medium) var(--space-medium);
                }

                .names__header {
                    display: flex;
                    align-items: center;
                    margin-bottom: var(--space-small);
                }

                .names__icon {
                    width: 1rem;
                    height: 1rem;
                    margin-right: var(--space-small);
                }
            </style>

            <article class="app__container app__bordered app__shadowed" >
                <header class\$="app__theme--[[_getTheme(theme, proposal.document.type)]] header">
                    [[proposal.document.title]]
                </header>

                <document-media
                    class="app__section"
                    file-name="[[proposal.document.media.fileName]]"
                    preview-data="[[proposal.document.media.previewData]]"
                >
                </document-media>

                <document-attributes
                    class="app__section attributes"
                    theme="small"
                    attributes="[[proposal.document.attributes]]"
                >
                </document-attributes>

                <footer class="names">
                    <!-- TODO: Make this string localizable -->
                    <div class="app__header names_header">
                        Aliases
                    </div>

                    <name-set names="[[proposal.document.names]]">
                    </name-set>
                </footer>
            </article>
        `;
    }

    static get is() {
        return 'proposal-item';
    }

    static get properties() {
        return {
            proposal: {
                type: Object,
            },

            theme: {
                type: String,
                value: 'active'
            }
        };
    }

    _getTheme(theme, type) {
        return theme === 'inactive' ? 'inactive' : type;
    }
}

customElements.define(ProposalItem.is, ProposalItem);
