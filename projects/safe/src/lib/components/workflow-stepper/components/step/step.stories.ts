import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { withKnobs } from '@storybook/addon-knobs';
import { SafeStepComponent } from './step.component';
import { SafeWorkflowStepperModule } from '../../workflow-stepper.module';
import { ContentType } from '../../../../models/page.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export default {
    component: SafeStepComponent,
    decorators: [
        moduleMetadata({
            imports: [
                SafeWorkflowStepperModule,
                BrowserAnimationsModule
            ],
            providers: []
        }),
        withKnobs
    ],
    title: 'UI/Workflow/Step',
    argTypes: {}
} as Meta;

const Template: Story<SafeStepComponent> = args => ({
    props: {
        ...args
    }
});

export const Default = Template.bind({});
Default.args = {
    step: {
        name: 'Dashboard',
        type: ContentType.dashboard
    },
    active: true,
    canUpdate: true
};