import '../common/base/base-button.js';
import '../common/base/boolean-filter';
import '../common/base/inline-message.js';
import '../common/base/page-message.js';
import '../common/styles/app-styles.js';
import './common/proposal-info.js';
import './common/proposal-item.js';
import './common/proposal-page-styles.js';
import '@polymer/iron-ajax/iron-ajax.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getTimeString } from '../common/util/time.js';
import { getUserClaims } from '../common/util/cookie.js';

class ViewProposalPage extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style include="proposal-page-styles">
            </style>

            <style>
                :host {
                    --item-max-width: 20rem;

                    display: block;
                    max-width: var(--page-max-width);
                    margin: var(--space-medium) auto;
                }

                .info {
                    margin: var(--space-large) 0 var(--space-section) 0;
                }

                .item-container {
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: center;
                }

                .item {
                    max-width: var(--item-max-width);
                    width: 100%;
                }

                .arrow-container:not([hidden]) {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }

                .arrow {
                    margin-top: 4.5rem;
                    width: 3rem;
                    height: 3rem;
                }

                @media (max-width: 40rem) {
                    .item-container {
                        flex-flow: column nowrap;
                        align-items: center;
                    }

                    .arrow {
                        margin-top: 0;
                        transform: rotate(90deg);
                    }
                }
            </style>

            <iron-ajax
                id="getAjax"
                on-response="_onGetResponse"
                on-error="_onGetError"
            >
            </iron-ajax>

            <iron-ajax
                id="patchAjax"
                method="PATCH"
                on-response="_onPatchResponse"
                on-error="_onPatchError"
            >
            </iron-ajax>

            <boolean-filter
                id="hiddenSections"
                names="[[_sectionNames]]"
                value-map="{{_hiddenSections}}"
            >
            </boolean-filter>

            <article hidden="[[_hiddenSections.content]]">
                <header class="page-banner page-banner--with-buttons">
                    <h2 class="page-banner__header app__header app__header--large">
                        [[_getHeader(_proposal, _previous)]]
                    </h2>

                    <!-- TODO: Make these strings localizable -->
                    <base-button
                        class="page-banner__button"
                        disabled="[[_actionsDisabled]]"
                        hidden="[[!_canCancel(_userInfo, _proposal)]]"
                        on-click="_onCancelClicked"
                    >
                        Cancel
                    </base-button>

                    <base-button
                        class="page-banner__button"
                        disabled="[[_actionsDisabled]]"
                        hidden="[[!_canApprove(_userInfo, _proposal)]]"
                        on-click="_onRejectClicked"
                    >
                        Reject
                    </base-button>

                    <base-button
                        theme="action"
                        class="page-banner__button"
                        disabled="[[_actionsDisabled]]"
                        hidden="[[!_canApprove(_userInfo, _proposal)]]"
                        on-click="_onApproveClicked"
                    >
                        Approve
                    </base-button>
                </header>

                <inline-message
                    id="inlineError"
                    type="error"
                >
                    [[_errorMessage]]
                </inline-message>

                <proposal-info
                    class="info"
                    proposal="[[_proposal]]"
                >
                </proposal-info>

                <div class="item-container">

                    <!-- Previous item -->
                    <proposal-item
                        class="item"
                        hidden="[[!_previous]]"
                        proposal="[[_previous]]"
                        theme="inactive"
                    >
                    </proposal-item>

                    <div
                        class="arrow-container"
                        hidden="[[!_previous]]"
                    >
                        <!-- TODO: Make the alt string localizable -->
                        <img
                            class="arrow"
                            src="/static/images/arrow-right.svg"
                            alt="Arrow"
                        />
                    </div>

                    <!-- Current item -->
                    <proposal-item
                        class="item"
                        proposal="[[_proposal]]"
                    >
                    </proposal-item>
                </div>
            </article>

            <!-- TODO: Make string localizable -->
            <page-message
                type="missing"
                message="Whoops! There's no proposal here."
                hidden="[[_hiddenSections.notFound]]"
            >
            </page-message>

            <page-message hidden="[[_hiddenSections.error]]">
            </page-message>
        `;
    }

    static get is() {
        return 'view-proposal-page';
    }

    static get properties() {
        return {
            relativePath: {
                type: String,
                observer: '_onRelativePathChanged'
            },

            _proposal: {
                type: Object,
            },

            _version: {
                type: Number,
            },

            _previous: {
                type: Object,
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
                    'success',
                    'error',
                    'notFound'
                ]
            },

            _hiddenSections: {
                type: Object
            },

            _userInfo: {
                type: Object
            },

            _actionsDisabled: {
                type: Boolean,
                value: false,
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        if (this._proposal) {
            this._setDocumentTitle(this._proposal.target, this._version);
        }
    }

    _onRelativePathChanged(newValue) {
        const pathRegex = /^([\w\-.]+)\/(\d+)$/;
        const matches = newValue.match(pathRegex);

        this.$.hiddenSections.set('stencil');

        const claims = getUserClaims() || {};
        let userInfo = {
            id: claims.sub,
            isAdmin: claims.isAdmin,
        };

        this.setProperties({
            _userInfo: userInfo,
            _version: matches[2],
        });

        let ajax = this.$.getAjax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.url = `/doc-api/v1/props/any/${matches[1]}/${matches[2]}`;
        ajax.generateRequest();

        this._setDocumentTitle(matches[1], matches[2]);
    }

    _setDocumentTitle(target, version) {
        // TODO: Make this string localizable
        document.title = `Proposal - ${target} #${version} | framebastard`;
    }

    _onGetResponse(event) {
        const response = event.detail.response;

        this.setProperties({
            _proposal: response.proposal,
            _previous: response.previous || null,
        });

        this.$.hiddenSections.set('content');
    }

    _onGetError(event) {
        const section = (event.detail.request.xhr.status === 404)
            ? 'notFound' : 'error';

        this.$.hiddenSections.set(section);
    }

    _onCancelClicked() {
        this._makePatchCall('cancelled');
    }

    _onApproveClicked() {
        this._makePatchCall('approved');
    }

    _onRejectClicked() {
        this._makePatchCall('rejected');
    }

    _makePatchCall(status) {
        this._actionsDisabled = true;

        let ajax = this.$.patchAjax;
        if (ajax.lastRequest) {
            ajax.lastRequest.abort();
        }

        ajax.url = `/doc-api/v1/props/any/${this._proposal.target}/${this._version}/status/${status}`;
        ajax.generateRequest();
    }

    _onPatchResponse() {
        location.reload();
        this._actionsDisabled = false;
    }

    _onPatchError(event) {
        // TODO: Make these strings localizable
        let errorMessage = event.detail.request.status === 401
            ? 'Ahem, it looks like you are not authorized to do that.'
            : 'Something went wrong; we couldn\'t complete the action. Maybe try again?';

        this.setProperties({
            _errorMessage: errorMessage,
            _actionsDisabled: false,
        });

        this.$.inlineError.show();
    }

    _getHeader(proposal, previous) {
        // TODO: Make these strings localizable
        if (previous) {
            return `Proposed changes #${this._version} to ${proposal.target}`;
        }

        const stringMap = {
            'game': `Proposed new game ${proposal.target}`,
            'character': `Proposed new character ${proposal.target}`,
            'move': `Proposed new move ${proposal.target}`,
        };

        return stringMap[proposal.document.type];
    }

    _getTimeString(time) {
        return getTimeString(time);
    }

    _canCancel(userInfo, proposal) {
        return proposal
            && proposal.status === 'pending'
            && userInfo.id === proposal.authorId;
    }

    _canApprove(userInfo, proposal) {
        return proposal
            && proposal.status === 'pending'
            && userInfo.isAdmin;
    }
}

customElements.define(ViewProposalPage.is, ViewProposalPage);
