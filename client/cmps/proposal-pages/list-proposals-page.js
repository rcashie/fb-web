import '../common/styles/app-styles.js';
import './common/proposal-list-filters.js';
import './common/proposal-list.js';
import './common/proposal-page-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class AllProposalsPage extends PolymerElement {
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

            <header class="page-banner">
                <h2 class="app__header app__header--large page-banner__header">
                    <!-- TODO: Make string localizable -->
                    All proposals
                </h2>

                <proposal-list-filters
                    status="{{_status}}"
                    sort="{{_sort}}"
                >
                </proposal-list-filters>
            </header>

            <proposal-list
                status="[[_status]]"
                sort="[[_sort]]"
            >
            </proposal-list>
        `;
    }

    static get is() {
        return 'list-proposals-page';
    }

    static get properties() {
        return {
            _status: {
                type: String
            },

            _sort: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        // TODO: Make this string localizable
        document.title = 'All proposals | framebastard';
    }
}

customElements.define(AllProposalsPage.is, AllProposalsPage);
