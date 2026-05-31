import { Formio } from '@formio/react';
const BaseComponent = Formio.Components.components.component;

export class DSApprovalComponent extends BaseComponent {
    static schema(...extend) {
        return BaseComponent.schema({
            label: 'Onay/Red',
            type: 'dsapproval',
            key: 'dsapproval',
            input: true,
            persistent: false,
            approvalComment: '',
            ...extend
        });
    }

    static get builderInfo() {
        return {
            title: 'Onay/Red',
            icon: 'check-square',
            group: 'dscomponents',
            documentation: '/userguide/#approval',
            weight: 30,
            schema: DSApprovalComponent.schema()
        };
    }

    constructor(component, options, data) {
        super(component, options, data);
        this.value = { comment: '', status: null };
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value || { comment: '', status: null };
        if (this.commentInput) {
            this.commentInput.value = this.value.comment;
        }
    }

    render(children) {
        return super.render(`
      <div class="ds-approval">
        <label>${this.component.label}</label>
        <textarea class="form-control" rows="3" placeholder="Açıklama girin..."></textarea>
        <div style="margin-top:10px;">
          <button type="button" class="btn btn-success">Onayla</button>
          <button type="button" class="btn btn-danger" style="margin-left:10px;">Reddet</button>
        </div>
      </div>
    `);
    }

    attach(element) {
        const result = super.attach(element);
        this.commentInput = this.element.querySelector('textarea');
        const approveBtn = this.element.querySelector('.btn-success');
        const rejectBtn = this.element.querySelector('.btn-danger');

        this.commentInput.addEventListener('input', (e) => {
            this.value.comment = e.target.value;
        });

        approveBtn.addEventListener('click', () => {
            this.value.status = 'approved';
            this.emit('customEvent', { type: 'onayla', component: this.component, data: this.data });
            this.root.triggerSubmit();
        });

        rejectBtn.addEventListener('click', () => {
            this.value.status = 'rejected';
            this.emit('customEvent', { type: 'reddet', component: this.component, data: this.data });
            this.root.triggerSubmit();
        });

        return result;
    }

}

Formio.Components.addComponent('dsapproval', DSApprovalComponent);
