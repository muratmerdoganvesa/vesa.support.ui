// Önce Input bileşenini Formio'dan alalım.
import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

/**
 * Create an Input component and extend from the InputComponent.
 */
 export class DSSelectComponent extends SelectComponent {
  /**
   * Define the default schema to change the type, inputType, and label.
   */
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'DSSelect',
      type: 'dsselect',
      inputType: 'select',
      customBooleanProp: false
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'DSSelect',
      group: 'dscomponents',
      icon: 'terminal',
      weight: 20,

      documentation: '/userguide/#select',
      schema: DSSelectComponent.schema()
    };
  }
}

/**
 * Change the edit form to make the "inputType" component a select dropdown
 * instead of a textfield so that users can only configure specific types.
//  */
DSSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);


  // Yeni boolean özellik ekleme
  // editForm.components.push({
  //   type: 'checkbox',
  //   key: 'customBooleanProp',
  //   label: 'Grid Üzerinde Gösterilsin',
  //   input: true,
  //   weight: 15,
  //   tooltip: 'This allows you to enable or disable the custom property.'
  // });

  editForm.components.unshift({
    group:'display',
    type: 'checkbox',
    key: 'customBooleanProp',
    label: 'Grid Üzerinde Gösterilsin',
    input: true,

    weight: 15,
    tooltip: 'This allows you to enable or disable the custom property.'
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
Formio.Components.addComponent('dsselect', DSSelectComponent);
