const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `
<dom-module id="stencil-styles">
    <template>
        <style>
            .stencil__header {
                height: 1.6rem; /* from bread-crumb size */
                background-color: var(--color-page-alt);
                margin-bottom: var(--space-medium);
            }

            .stencil__media {
                background-color: var(--color-page-alt);
            }

            .stencil__media--small {
                height: var(--media-height-small);
                width: 8rem; /* arbitrary */
            }

            .stencil__media--large {
                height: var(--media-height-large);
                width: 9rem; /* arbitrary */
            }

            .stencil__attribute-container {
                display: grid;
                justify-items: center;
                justify-content: space-between;
            }

            .stencil__attribute-container--small {
                grid-template-columns: 100%;
                grid-gap: var(--space-medium);
            }

            .stencil__attribute-container--large {
                grid-template-columns: 30% 30% 30%;
                grid-gap: var(--space-large);
            }

            @media (max-width: 40rem) {
                .stencil__attribute-container--large {
                    grid-template-columns: 45% 45%;
                }
            }

            @media (max-width: 25rem) {
                .stencil__attribute-container--large {
                    grid-template-columns: 100%;
                }
            }

            .stencil__attribute {
                background-color: var(--color-page-alt);
                height: var(--line-height-small);
                width: 100%;
                max-width: 15rem;
            }
        </style>
    </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
