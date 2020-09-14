const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `
<dom-module id="proposal-page-styles">
    <template>
        <style>
            .page-banner {
                border-bottom: var(--border-size) solid var(--color-border);
                margin-bottom: var(--space-section);
                padding: var(--space-large) 0;
            }

            .page-banner--with-buttons {
                display: flex;
                flex-flow: row nowrap;
            }

            .page-banner__header {
                margin: 0;
                flex-grow: 1;
            }

            .page-banner__button {
                margin-left: var(--space-large);
            }

            .page-item {
                margin: 0 0 var(--space-large) 0;
            }

            .page-note {
                color: var(--color-text-note);
                font-size: var(--font-size-small);
                padding: 0 var(--space-small);
            }

            .page-section-start {
                margin-top: var(--space-section);
            }
        </style>
    </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
