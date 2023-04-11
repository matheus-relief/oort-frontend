import {
  Meta,
  moduleMetadata,
  Story,
  componentWrapperDecorator,
} from '@storybook/angular';
import { SafeBarChartComponent } from './bar-chart.component';
import { SafeBarChartModule } from './bar-chart.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export default {
  component: SafeBarChartComponent,
  decorators: [
    moduleMetadata({
      imports: [SafeBarChartModule, BrowserAnimationsModule],
      providers: [],
    }),
    componentWrapperDecorator((story) => `<div class="h-96">${story}</div>`),
  ],
  title: 'UI/Charts/Bar Chart',
  argTypes: {
    series: {
      control: { type: 'object' },
    },
    legend: {
      control: { type: 'object' },
    },
    title: {
      control: { type: 'object' },
    },
  },
} as Meta;

/**
 * Template used by storybook to display the component.
 *
 * @param args story arguments
 * @returns storybook template
 */
const TEMPLATE: Story<SafeBarChartComponent> = (args) => ({
  props: {
    ...args,
  },
});

/**
 * Default story
 */
export const DEFAULT = TEMPLATE.bind({});
DEFAULT.storyName = 'Default';
DEFAULT.args = {
  legend: { visible: true, position: 'bottom' },
  title: {
    text: 'title',
    position: 'bottom',
    font: '',
    color: '',
  },
  series: [
    {
      name: 'Serie 1',
      data: [
        {
          field: 8,
          category: 'category 1',
        },
        {
          field: 7,
          category: 'category 2',
        },
        {
          field: 19,
          category: 'category 3',
        },
        {
          field: 16,
          category: 'category 4',
        },
      ],
    },
    {
      name: 'Serie 2',
      color: '#F4E683',
      data: [
        {
          field: 8,
          category: 'category 1',
        },
        {
          field: 7,
          category: 'category 2',
        },
        {
          field: 19,
          category: 'category 3',
        },
        {
          field: 16,
          category: 'category 4',
        },
      ],
    },
    {
      name: 'Serie 3',
      data: [
        {
          field: 8,
          category: 'category 1',
        },
        {
          field: 7,
          category: 'category 2',
        },
        {
          field: 19,
          category: 'category 5',
        },
        {
          field: 16,
          category: 'category 6',
        },
      ],
    },
  ],
};

/**
 * Column story
 */
export const COLUMN = TEMPLATE.bind({});
COLUMN.storyName = 'Vertical';
COLUMN.args = {
  ...DEFAULT.args,
  orientation: 'vertical',
};
