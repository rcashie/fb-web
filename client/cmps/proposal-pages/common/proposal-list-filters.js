import '../../common/base/radio-group.js';
import '../../common/styles/app-styles.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class ProposalListFilters extends PolymerElement {
    static get template() {
        return html`
            <style include="app-styles">
            </style>

            <style>
                :host {
                    display: flex;
                    flex-flow: row wrap;
                    align-items: center;
                }

                .status {
                    margin: var(--space-medium) var(--space-medium) 0 0;
                }

                .sort-options {
                    display: flex;
                    flex-flow: row nowrap;
                    margin: var(--space-medium) 0 0 auto;
                    overflow: hidden;
                }

                .sort-option {
                    padding: 0 var(--space-medium);
                    margin: 0;
                    border: none;
                    font: inherit;
                    letter-spacing: inherit;
                }

                .sort-option--active {
                    background-color: var(--color-page-alt);
                    cursor: default;
                }

                .sort-option--inactive {
                    background-color: var(--color-page);
                    cursor: pointer;
                }
            </style>

            <radio-group
                class="status"
                options="[[_radioOptions]]"
                value="{{status}}"
            >
            </radio-group>

            <!-- TODO: Make these strings localizable -->
            <div class="app__container app__bordered sort-options">
                <button
                    id="sortOldest"
                    class\$="sort-option sort-option--[[_getOldestSortActive(sort)]]"
                    on-click="_sortOptionClicked"
                >
                    Oldest
                </button>

                <button
                    id="sortNewest"
                    class\$="sort-option sort-option--[[_getNewestSortActive(sort)]]"
                    on-click="_sortOptionClicked"
                >
                    Newest
                </button>
            </div>
        `;
    }

    static get is() {
        return 'proposal-list-filters';
    }

    static get properties() {
        return {
            sort: {
                type: String,
                notify: true,
                value: 'desc'
            },

            status: {
                type: String,
                notify: true,
                value: 'approved'
            },

            _radioOptions: {
                type: Array,
                readOnly: true,
                value: () => {
                    // TODO: Make these labels localizable
                    return [
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'cancelled', label: 'Cancelled' }
                    ];
                }
            }
        };
    }

    _sortOptionClicked(event) {
        this.sort = event.srcElement.id === 'sortOldest' ? 'asc' : 'desc';
    }

    _getOldestSortActive(sort) {
        return sort === 'asc' ? 'active' : 'inactive';
    }

    _getNewestSortActive(sort) {
        return sort === 'desc' ? 'active' : 'inactive';
    }
}

customElements.define(ProposalListFilters.is, ProposalListFilters);
