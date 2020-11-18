import './common/base/boolean-filter.js';
import './common/base/page-message.js';
import './common/base/sign-in-dialog.js';
import './common/styles/app-styles.js';
import './document-pages/document-pages.js';
import './home-page.js';
import './proposal-pages/proposal-pages.js';
import './search-page.js';
import './tos-page.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { getUserClaims } from './common/util/cookie.js';

class FbApp extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: flex;
                    flex-flow: column nowrap;
                    min-height: 100vh;
                }

                .flex-item {
                    margin-left: var(--space-large);
                }

                .banner {
                    color: var(--color-text-inverse);
                    background-color: var(--color-page-inverse);
                    padding: var(--space-large) var(--space-large) var(--space-small);
                }

                .banner__content {
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;
                }

                .logo {
                    display: flex;
                    flex-flow: row nowrap;
                    align-items: center;
                    margin-right: auto;
                }

                .logo__icon {
                    height: 2rem;
                    margin-right: var(--space-small);
                }

                .logo__title {
                    font-family: 'Sniglet';
                    margin: 0;
                }

                .profile-menu-container {
                    position: relative;
                }

                .profile-menu {
                    display: flex;
                    flex-flow: column nowrap;
                    position: absolute;
                    top: var(--space-small);
                    right: var(--space-small);
                    background-color: var(--color-page-inverse);
                    color: var(--color-text-inverse);
                    z-index: 1;
                }

                .profile-menu__item {
                    padding: var(--space-small) var(--space-large);
                }

                .profile-menu__item--header {
                    background-color: var(--color-page-alt);
                    color: var(--color-text);
                }

                .profile-icon {
                    background-color: var(--color-page);
                    border-radius: 50%;
                    width: 1.5rem;
                    height: 1.5rem;
                    line-height: 0;
                }

                .media-link:not([hidden]) {
                    display: inline-flex;
                    flex-flow: row nowrap;
                    align-items: center;
                    white-space: nowrap;
                }

                .media-link__icon {
                    width: 1.2rem;
                    margin-right: var(--space-small);
                }

                .page-container {
                    flex-grow: 1;
                }

                .footer {
                    display: flex;
                    flex-flow: row wrap;
                    justify-content: flex-end;
                    color: var(--color-text-inverse);
                    background-color: var(--color-page-inverse);
                    padding: var(--space-large);
                    margin-top: var(--space-section);
                }

                @media (max-width: 25rem) {
                    .footer {
                        justify-content: center;
                    }
                }
            </style>

            <app-location
                route="{{_route}}"
                query-params="{{_queryParams}}"
                url-space-regex="^(?!\/auth).+?$"
            >
            </app-location>

            <boolean-filter
                id="shownPages"
                names='[[_sectionNames]]'
                value-map="{{_shownPages}}"
                single-value="true"
            >
            </boolean-filter>

            <sign-in-dialog id="signInDialog">
            </sign-in-dialog>

            <div class="banner">
                <nav class="banner__content">
                    <a
                        class="app__hyperlink logo"
                        href="/"
                    >
                        <img
                            class="logo__icon"
                            src="/static/images/logo.svg"
                            alt=""
                        />

                        <h1 class="app__header app__header--large logo__title">
                            framebastard
                        </h1>
                    </a>

                    <template
                        is="dom-if"
                        if="[[_userInfo]]"
                    >
                        <button
                            class="app__bare-button media-link flex-item"
                            type="button"
                            on-click="_toggleProfileMenu"
                        >
                            <img
                                class="profile-icon"
                                src="/static/images/user-icon.svg"
                                alt=""
                            />
                        </button>
                    </template>

                    <button
                        class="app__hyperlink app__bare-button media-link flex-item"
                        type="button"
                        on-click="_onSignInClicked"
                        hidden="[[_userInfo]]"
                    >
                        <img
                            class="media-link__icon"
                            src="/static/images/twitter-icon.svg"
                            alt=""
                        />

                        <!-- TODO: Make string localizable -->
                        Sign In
                    </button>
                </nav>

                <div
                    class="profile-menu-container"
                    hidden="[[_hideProfileMenu]]"
                    on-click="_menuClicked"
                >

                    <!-- TODO: Make strings localizable -->
                    <nav class="app__container app__heavy-shadowed profile-menu">
                        <span class="profile-menu__item profile-menu__item--header">@[[_userInfo.name]]</span>
                        <a
                            class="app__hyperlink profile-menu__item"
                            href="/props/list/all"
                        >
                            All Proposals
                        </a>
                        <a
                            class="app__hyperlink profile-menu__item"
                            href\$="/props/list/user/[[_userInfo.id]]"
                        >
                            My Proposals
                        </a>
                        <a
                            class="app__hyperlink profile-menu__item"
                            href="/auth/logout"
                        >
                            Sign Out
                        </a>
                    </nav>
                </div>
            </div>

            <div class="page-container">
                <template
                    is="dom-if"
                    if="[[_shownPages.home]]"
                    restamp
                >
                    <home-page query-params="[[_queryParams]]">
                    </home-page>
                </template>

                <template
                    is="dom-if"
                    if="[[_shownPages.search]]"
                    restamp
                >
                    <search-page query-params="[[_queryParams]]">
                    </search-page>
                </template>

                <template
                    is="dom-if"
                    if="[[_shownPages.documents]]"
                    restamp
                >
                    <document-pages
                        path="[[_relativePath]]"
                        query-params="[[_queryParams]]"
                    >
                    </document-pages>
                </template>

                <template
                    is="dom-if"
                    if="[[_shownPages.proposals]]"
                    restamp
                >
                    <proposal-pages
                        path="[[_relativePath]]"
                        query-params="[[_queryParams]]"
                    >
                    </proposal-pages>
                </template>

                <template
                    is="dom-if"
                    if="[[_shownPages.tos]]"
                >
                    <tos-page></tos-page>
                </template>

                <!-- TODO: Make string localizable -->
                <page-message
                    type="missing"
                    message="Derp... there's nothing to see here."
                    hidden="[[!_shownPages.notFound]]"
                >
                </page-message>
            </div>

            <nav class="footer">
                <a
                    class="app__hyperlink media-link flex-item"
                    href="https://github.com/rcashie/fb-web"
                    target="_blank"
                >
                    <img
                        class="media-link__icon"
                        src="/static/images/github-icon.svg"
                        alt=""
                    />

                    <!-- TODO: Make string localizable -->
                    Source code
                </a>

                <a
                    class="app__hyperlink media-link flex-item"
                    href="https://twitter.com/rcashie"
                    target="_blank"
                >
                    <img
                        class="media-link__icon"
                        src="/static/images/twitter-icon.svg"
                        alt=""
                    />

                    <!-- TODO: Make string localizable -->
                    rcashie
                </a>

                <a
                    class="app__hyperlink media-link flex-item"
                    href="https://www.buymeacoffee.com/0jglCxWSD"
                    target="_blank"
                >
                    <img
                        class="media-link__icon"
                        src="/static/images/BMC-btn-logo.svg"
                        alt=""
                    />

                    <!-- TODO: Make string localizable -->
                    Buy me a coffee
                </a>
            </nav>
        `;
    }

    static get is() {
        return 'fb-app';
    }

    static get properties() {
        return {
            _route: {
                type: Object,
                observer: '_onRouteChanged'
            },

            _relativePath: {
                type: String
            },

            _userInfo: {
                type: Object
            },

            _hideProfileMenu: {
                type: Boolean,
                value: true
            },

            _sectionNames: {
                type: Array,
                readOnly: true,
                value: () => [
                    'home',
                    'search',
                    'documents',
                    'proposals',
                    'tos'
                ]
            },

            _documentClickedHandler: {
                type: Object
            }
        };
    }

    constructor() {
        super();
        this._documentClickedHandler = this._documentClicked.bind(this);
    }

    ready() {
        super.ready();
        this.dispatchEvent(new CustomEvent('ready'));
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener(
            'click',
            this._documentClickedHandler,
            { passive: true }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener(
            'click',
            this._documentClickedHandler
        );
    }

    _documentClicked() {
        this._hideProfileMenu = true;
    }

    _menuClicked(event) {
        event.stopPropagation();
    }

    _toggleProfileMenu(event) {
        this._hideProfileMenu = !this._hideProfileMenu;
        event.stopPropagation();
    }

    _onSignInClicked() {
        this.$.signInDialog.show();
    }

    _onRouteChanged(route) {
        // Update the sub page to show, the relative path
        // and the currently logged in user
        const pathRegex = /^\/([^/]+)(?:\/(.+)?)?$/;
        const routePageMap = {
            '': 'home',
            tos: 'tos',
            search: 'search',
            docs: 'documents',
            props: 'proposals',
        };

        const matches = route.path.match(pathRegex);
        const category = matches && matches[1] || '';
        const relativePath = matches && matches[2] || '';

        const claims = getUserClaims();
        const userInfo = claims ? {
            name: claims.screenName,
            id: claims.sub
        } : null;

        // Always set this first before relative path.
        this.$.shownPages.set(routePageMap[category] || 'notFound');
        this.setProperties({
            _relativePath: relativePath,
            _userInfo: userInfo
        });
    }
}

customElements.define(FbApp.is, FbApp);
