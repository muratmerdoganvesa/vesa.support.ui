// Önce Input bileşenini Formio'dan alalım.
import { Formio } from '@formio/react';
const TimeComponent = Formio.Components.components.time;

/**
 * Create an Input component and extend from the InputComponent.
 */
export class DSTimeComponent extends TimeComponent {
  /**
   * Define the default schema to change the type, inputType, and label.
   */
  static schema(...extend) {
    return TimeComponent.schema({
      label: 'DTime',
      type: 'dstime',
      inputType: 'time',
      customBooleanProp: false
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'DSTime',
      group: 'dscomponents',
      icon: 'terminal',
      weight: 20,

      documentation: '/userguide/#time',
      schema: DSTimeComponent.schema()
    };
  }
}

/**
 * Change the edit form to make the "inputType" component a select dropdown
 * instead of a textfield so that users can only configure specific types.
//  */
DSTimeComponent.editForm = (...args) => {
  const editForm = TimeComponent.editForm(...args);


  // Yeni boolean özellik ekleme
  // editForm.components.push({
  //   type: 'checkbox',
  //   key: 'customBooleanProp',
  //   label: 'Grid Üzerinde Gösterilsin',
  //   input: true,
  //   weight: 15,
  //   tooltip: 'This allows you to enable or disable the custom property.'
  // });



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



  // Özel boolean property ekleyin
  editForm.components.unshift({
    type: 'checkbox',
    key: 'customBooleanProp',
    label: 'Grid Üzerinde Gösterilsin',
    input: true,
    tooltip: 'This allows you to enable or disable the custom property.',
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




// Oluşturulan bileşeni 'dsinput' adı altında ekleyin.
Formio.Components.addComponent('dstime', DSTimeComponent);
