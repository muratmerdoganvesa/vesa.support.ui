import { Formio } from '@formio/react';
const TextAreaComponent = Formio.Components.components.textarea;

export class DSTextAreaComponent extends TextAreaComponent {
    /**
     * Varsayılan şemayı tanımla
     */
    static schema(...extend) {
        return TextAreaComponent.schema({
            label: 'DSTextArea',
            type: 'dstextarea',
            key: 'dstextarea',
            customBooleanProp: false,
        }, ...extend);
    }

    /**
     * Builder paneli bilgisi
     */
    static get builderInfo() {
        return {
            title: 'DSTextArea',
            group: 'dscomponents',
            icon: 'edit',
            weight: 10,
            documentation: '/userguide/#textarea',
            schema: DSTextAreaComponent.schema()
        };
    }
}

/**
 * Bileşen edit formuna özel alanlar ekleyin
 */
DSTextAreaComponent.editForm = (...args) => {
    const editForm = TextAreaComponent.editForm(...args);

    editForm.components.push({
        type: 'group',
        key: 'customTab',
        components: [{
            label: 'Custom Settings',
            key: 'customSettings',
            type: 'panel',
            components: []
        }]
    });
    // Özel boolean alanları edit form'a ekle
    editForm.components.unshift({
        type: 'checkbox',
        key: 'customBooleanProp',
        label: 'Grid Üzerinde Gösterilsin',
        input: true,
        tooltip: 'Özelleştirilmiş boolean property',
        weight: 15
    });

    editForm.components.unshift({
        type: 'checkbox',
        key: 'workFlowProp',
        label: 'İş Akışı Üzerinde Gösterilsin',
        input: true,
        tooltip: 'İş akışında gösterim kontrolü',
        weight: 15
    });



    return editForm;
};

// Bileşeni Formio'ya ekleyin
Formio.Components.addComponent('dstextarea', DSTextAreaComponent);
