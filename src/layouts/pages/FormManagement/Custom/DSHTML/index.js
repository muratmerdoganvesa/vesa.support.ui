import { Formio } from '@formio/react';
const HtmlElementComponent = Formio.Components.components.htmlelement;

export class DSHtmlElementComponent extends HtmlElementComponent {
  /**
   * Varsayılan şemayı tanımla
   */
  static schema(...extend) {
    return HtmlElementComponent.schema({
      label: 'DSHtmlElement',
      type: 'dshtmlelement',
      tag: 'p',
      content: '<p>Varsayılan içerik</p>',
      customBooleanProp: false,
    }, ...extend);
  }

  /**
   * Builder paneli bilgisi
   */
  static get builderInfo() {
    return {
      title: 'DSHtmlElement',
      group: 'dscomponents',
      icon: 'code',
      weight: 10,
      documentation: '/userguide/#htmlelement',
      schema: DSHtmlElementComponent.schema()
    };
  }
}

/**
 * Bileşen edit formuna özel alanlar ekleyin
 */
DSHtmlElementComponent.editForm = (...args) => {
  const editForm = HtmlElementComponent.editForm(...args);

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

  // Özel boolean alan ekleme
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
    tooltip: 'This allows you to enable or disable the custom property.',
    weight: 15
  });
  return editForm;
};

// Bileşeni Formio'ya ekleyin
Formio.Components.addComponent('dshtmlelement', DSHtmlElementComponent);
