import '../../common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getTimeString } from '../../common/util/time.js';
import { IMPORTERS } from '../../common/util/importers.js';

class ProposalInfo extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: block;
                }

                .info {
                    display: flex;
                    flex-flow: row wrap;
                    align-items: center;
                }

                @media (max-width: 25rem) {
                    .info {
                        flex-flow: column nowrap;
                        align-items: flex-start;
                    }
                }

                .info__separated {
                    margin: var(--space-small) var(--space-medium) var(--space-small) 0;
                }

                .info__separated::before {
                    content: '\u2022';
                    margin-right: var(--space-medium);
                }

                @media (min-width: 25rem) {
                    .info__separated--first::before {
                        content: none;
                    }
                }

                .info__status {
                    display: inline-block;
                    padding: var(--space-small);
                    margin-right: var(--space-small);
                    line-height: var(--line-height-small);
                }
            </style>

            <div class="info">
                <!-- TODO: Make string localizable -->
                <span class="info__separated info__separated--first">
                    <a
                        class="app__hyperlink app__hyperlink--inline"
                        href\$="[[_authorInfo.url]]"
                    >
                        [[_authorInfo.display]]
                    </a>

                    [[_getTimeString(proposal.created)]]
                </span>

                <!-- TODO: Make these strings localizable -->
                <span
                    class="info__separated"
                    hidden="[[proposal.closed]]"
                >
                    Last updated [[_getTimeString(proposal.lastUpdated)]]
                </span>

                <span class="info__separated">
                    <span class\$="app__container app__sentiment-[[_getSentiment(proposal.status)]] info__status">
                        [[_getStatusString(proposal.status)]]
                    </span>

                    <span hidden="[[!proposal.closed]]">
                        [[_getTimeString(proposal.closed)]]
                    </span>
                <span>
            </div>
        `;
    }

    static get is() {
        return 'proposal-info';
    }

    static get properties() {
        return {
            proposal: {
                type: Object,
                observer: '_onProposalChanged'
            },

            _authorInfo: {
                type: Object
            }
        };
    }

    _onProposalChanged(proposal) {
        if (proposal.authorId.startsWith('i:')) {
            this._authorInfo = {
                display: `↯${proposal.authorName}`,
                url: IMPORTERS[proposal.authorId],
            };
        } else {
            this._authorInfo = {
                display: `@${proposal.authorName}`,
                url: `https://twitter.com/${proposal.authorName}`
            };
        }
    }

    _getTimeString(time) {
        return getTimeString(time);
    }

    _getStatusString(status) {
        // TODO: Localize status string here
        return status;
    }

    _getSentiment(status) {
        const map = {
            'pending': 'neutral',
            'cancelled': 'negative',
            'rejected': 'negative',
            'approved': 'positive',
        };

        return map[status];
    }
}

customElements.define(ProposalInfo.is, ProposalInfo);
